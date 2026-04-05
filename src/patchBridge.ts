import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { getInstallDir, isAiEnabled } from './config';
import { setStatus, resetStatus } from './statusBar';
import { stateProvider, ComfyUIPanel } from './panel';
import { waitForServer } from './install';
import { updateNodeCatalog } from './nodeCatalog';

// ---------------------------------------------------------------------------
// Workflow merge
// ---------------------------------------------------------------------------

/**
 * Merge a patch workflow into a base workflow by node/link ID, returning a new
 * workflow object. Existing nodes/links are updated in place; new ones are added.
 */
export function mergeWorkflows(base: any, patch: any): any {
    const result = JSON.parse(JSON.stringify(base || { nodes: [], links: [], groups: [], config: {}, extra: {}, version: 0.4 }));

    // Run removals first so a patch can atomically delete-and-replace in one step
    const removeNodeIds = new Set<number>(
        Array.isArray(patch.remove_nodes) ? patch.remove_nodes.map(Number) : []
    );
    const removeLinkIds = new Set<number>(
        Array.isArray(patch.remove_links) ? patch.remove_links.map(Number) : []
    );

    if (removeNodeIds.size > 0 || removeLinkIds.size > 0) {
        result.nodes = (result.nodes || []).filter((n: any) => !removeNodeIds.has(Number(n.id)));
        result.links = (result.links || []).filter((l: any) => {
            const id = Array.isArray(l) ? l[0] : l.id;
            if (removeLinkIds.has(Number(id))) { return false; }
            // Also remove links whose src or dst node is being deleted
            const srcNodeId = Array.isArray(l) ? l[1] : l.origin_id;
            const dstNodeId = Array.isArray(l) ? l[3] : l.target_id;
            return !removeNodeIds.has(Number(srcNodeId)) && !removeNodeIds.has(Number(dstNodeId));
        });
    }

    if (patch.nodes && Array.isArray(patch.nodes)) {
        const baseNodes = result.nodes || [];
        for (const pNode of patch.nodes) {
            const existingIndex = baseNodes.findIndex((n: any) => n.id === pNode.id);
            if (existingIndex !== -1) {
                baseNodes[existingIndex] = { ...baseNodes[existingIndex], ...pNode };
            } else {
                baseNodes.push(pNode);
            }
        }
        result.nodes = baseNodes;
    }

    if (patch.links && Array.isArray(patch.links)) {
        const baseLinks = result.links || [];
        for (const pLink of patch.links) {
            const pLinkId = Array.isArray(pLink) ? pLink[0] : pLink.id;
            const existingIndex = baseLinks.findIndex((l: any) => (Array.isArray(l) ? l[0] : l.id) === pLinkId);
            if (existingIndex !== -1) {
                baseLinks[existingIndex] = pLink;
            } else {
                baseLinks.push(pLink);
            }
        }
        result.links = baseLinks;
    }

    if (patch.groups && Array.isArray(patch.groups)) {
        result.groups = patch.groups;
    }

    // Sync last IDs to the highest seen node/link ID
    let maxNodeId = result.last_node_id || 0;
    for (const n of (result.nodes || [])) {
        if (Number(n.id) > maxNodeId) { maxNodeId = Number(n.id); }
    }
    result.last_node_id = maxNodeId;

    let maxLinkId = result.last_link_id || 0;
    for (const l of (result.links || [])) {
        const id = Array.isArray(l) ? l[0] : l.id;
        if (Number(id) > maxLinkId) { maxLinkId = Number(id); }
    }
    result.last_link_id = maxLinkId;

    return result;
}

// ---------------------------------------------------------------------------
// Patch history
// ---------------------------------------------------------------------------

export function saveHistory(rootPath: string, signalTs: number | undefined, patch: any, snapshotBefore: any) {
    try {
        const historyDir = path.join(rootPath, 'comfyai', 'workflow-history');
        fs.mkdirSync(historyDir, { recursive: true });
        const iso = new Date().toISOString().replace(/[:.]/g, '-');
        const entry = {
            appliedAt: new Date().toISOString(),
            signalTs: signalTs ?? null,
            patch: patch ?? null,
            snapshotBefore,
        };
        fs.writeFileSync(path.join(historyDir, `${iso}.json`), JSON.stringify(entry, null, 2), 'utf-8');
    } catch (err) {
        console.error('[ComfyUI] Failed to write patch history:', err);
    }
}

// ---------------------------------------------------------------------------
// Apply-response writer
// ---------------------------------------------------------------------------

// When set, every apply-response includes a testing_reminder with a per-action log filename.
let testingLogDir: string | null = null;

function writeApplyResponse(installDir: string, status: 'ok' | 'error', message: string, triggerTs?: number) {
    try {
        const comfyaiDir = path.join(installDir, 'comfyai');
        fs.mkdirSync(comfyaiDir, { recursive: true });
        const responsePath = path.join(comfyaiDir, 'apply-response.json');
        const tmp = responsePath + '.tmp';
        const payload: any = {
            status,
            ts: Date.now(),
            message,
        };
        if (triggerTs !== undefined) {
            payload.trigger_ts = triggerTs;
        }
        if (testingLogDir) {
            const logStem = `log-${triggerTs ?? payload.ts}`;
            let logFileName = `${logStem}.md`;
            let counter = 2;
            while (fs.existsSync(path.join(installDir, testingLogDir, logFileName))) {
                logFileName = `${logStem}-${counter++}.md`;
            }
            const logFile = `${testingLogDir}/${logFileName}`;
            payload.log_file = logFile;
            payload.testing_reminder = [
                `STOP. Write ${logFile} now (use the Write tool — no read needed, just create it).`,
                `Include EVERYTHING since your last log entry:`,
                `- What you were trying to do and why`,
                `- What you did (exact files written, commands run, content sent)`,
                `- What happened (exact response, output, or error — quote it)`,
                `- Anything confusing, surprising, or broken`,
                `- Any question you had to ask the user, and why you needed to ask`,
                `Do this before continuing. Skipping it loses data we need.`,
            ].join(' ');
        }
        fs.writeFileSync(tmp, JSON.stringify(payload, null, 2), 'utf-8');
        fs.renameSync(tmp, responsePath);
    } catch (err) {
        console.error('[ComfyUI] Failed to write apply-response.json:', err);
    }
}

// ---------------------------------------------------------------------------
// Apply-patch file watcher
// ---------------------------------------------------------------------------

/**
 * Watches `comfyai/apply-patch-trigger.json` in the install dir for writes.
 * When the file changes, applies the patch or full workflow to the panel.
 */
export function watchApplyFile(context: vscode.ExtensionContext): vscode.Disposable {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
        return new vscode.Disposable(() => {});
    }

    const rootPath = workspaceFolders[0].uri.fsPath;
    const installDir = getInstallDir(rootPath);
    const signalFileName = 'comfyai/apply-patch-trigger.json';
    const signalPath = path.join(installDir, 'comfyai', 'apply-patch-trigger.json');

    const watcher = vscode.workspace.createFileSystemWatcher(
        new vscode.RelativePattern(vscode.Uri.file(installDir), signalFileName)
    );

    let debounceTimer: NodeJS.Timeout | undefined;

    const handleUpdate = async () => {
        if (debounceTimer) {
            clearTimeout(debounceTimer);
        }
        debounceTimer = setTimeout(async () => {
            if (!fs.existsSync(signalPath)) {
                return;
            }

            if (!isAiEnabled()) { return; }
            setStatus('$(sync~spin) ComfyUI: Patching...');
            let triggerTs: number | undefined;
            try {
                const signalContent = fs.readFileSync(signalPath, 'utf-8');
                const signalData = JSON.parse(signalContent);

                triggerTs = typeof signalData?.ts === 'number' ? signalData.ts : undefined;

                if (signalData && signalData.command === 'testing-mode') {
                    // TESTING MODE — latch or clear the log directory for per-action log file reminders
                    if (signalData.enabled === false) {
                        testingLogDir = null;
                        writeApplyResponse(installDir, 'ok', 'Testing mode disabled', triggerTs);
                    } else if (typeof signalData.logPath === 'string') {
                        testingLogDir = signalData.logPath;
                        writeApplyResponse(installDir, 'ok', `Testing mode enabled — each response will specify a log file in ${testingLogDir}/`, triggerTs);
                    } else {
                        writeApplyResponse(installDir, 'error', 'testing-mode requires logPath (string) or enabled: false', triggerTs);
                    }
                    resetStatus();
                    return;
                }

                if (signalData && signalData.command === 'interrupt') {
                    // INTERRUPT MODE — stop current generation
                    const serverUrl = vscode.workspace.getConfiguration('comfyui').get<string>('serverUrl', 'http://localhost:8188');
                    const resp = await fetch(`${serverUrl}/interrupt`, { method: 'POST' });
                    if (!resp.ok) {
                        vscode.window.showErrorMessage(`ComfyUI: Interrupt failed (${resp.status})`);
                        writeApplyResponse(installDir, 'error', `Interrupt failed: HTTP ${resp.status}`, triggerTs);
                    } else {
                        writeApplyResponse(installDir, 'ok', 'Generation interrupted', triggerTs);
                    }
                    setStatus('$(stop) ComfyUI: Interrupted');
                    setTimeout(resetStatus, 2000);
                    return;
                }

                if (signalData && signalData.command === 'queue') {
                    // QUEUE MODE — forward to the ComfyUI panel (bridge node calls app.queuePrompt)
                    if (ComfyUIPanel.currentPanel) {
                        const count = (typeof signalData.count === 'number' && signalData.count >= 1)
                            ? Math.floor(signalData.count) : 1;
                        for (let i = 0; i < count; i++) {
                            ComfyUIPanel.currentPanel.queueWorkflow();
                        }
                        const countStr = count > 1 ? ` (${count} runs queued)` : '';
                        writeApplyResponse(installDir, 'ok', `Workflow queued${countStr} — check user/comfyui.log for result (tail -20), or poll GET http://localhost:8188/history`, triggerTs);
                        setStatus('$(play) ComfyUI: Queued');
                        setTimeout(resetStatus, 2000);
                    } else {
                        writeApplyResponse(installDir, 'error', 'ComfyUI panel is not open — open the panel and try again', triggerTs);
                    }
                    return;
                }

                if (signalData && signalData.command === 'queue-status') {
                    // QUEUE STATUS — query the ComfyUI server for current queue state
                    const serverUrl = vscode.workspace.getConfiguration('comfyui').get<string>('serverUrl', 'http://localhost:8188');
                    try {
                        const resp = await fetch(`${serverUrl}/queue`);
                        if (!resp.ok) {
                            writeApplyResponse(installDir, 'error', `queue-status failed: HTTP ${resp.status}`, triggerTs);
                        } else {
                            const data: any = await resp.json();
                            const running: any[] = data.queue_running ?? [];
                            const pending: any[] = data.queue_pending ?? [];
                            const runningId = running.length > 0 ? (running[0][1] ?? null) : null;
                            const msg = `Queue: ${running.length} running, ${pending.length} pending` +
                                (runningId ? ` (running prompt_id: ${runningId})` : '');
                            writeApplyResponse(installDir, 'ok', msg, triggerTs);
                        }
                    } catch (err) {
                        writeApplyResponse(installDir, 'error', `queue-status error: ${String(err)}`, triggerTs);
                    }
                    resetStatus();
                    return;
                }

                if (signalData && signalData.command === 'auto-layout') {
                    if (ComfyUIPanel.currentPanel) {
                        ComfyUIPanel.currentPanel.autoLayout();
                        writeApplyResponse(installDir, 'ok', 'Auto-layout applied', triggerTs);
                        setStatus('$(layout) ComfyUI: Layout applied');
                        setTimeout(resetStatus, 2000);
                    } else {
                        writeApplyResponse(installDir, 'error', 'ComfyUI panel is not open — open the panel and try again', triggerTs);
                    }
                    return;
                }

                if (signalData && signalData.command === 'restart-server') {
                    // RESTART SERVER — hit the reboot endpoint, wait for the server to come back,
                    // then reload the panel and refresh the node catalog.
                    const cfg = vscode.workspace.getConfiguration('comfyui');
                    const serverUrl = cfg.get<string>('serverUrl', 'http://localhost:8188');
                    const endpoint = cfg.get<string>('restartEndpoint', '/v2/manager/reboot');
                    const timeout = cfg.get<number>('serverTimeout', 60000);
                    setStatus('$(sync~spin) ComfyUI: Restarting server...');
                    try {
                        await fetch(`${serverUrl}${endpoint}`, { method: 'GET' });
                    } catch (err: any) {
                        // Connection drop on restart is expected — treat as success and fall through
                        const isExpectedDrop = err instanceof TypeError &&
                            (err.message.includes('fetch failed') || err.message.includes('ECONNRESET') ||
                             err.message.includes('ECONNREFUSED') || err.message.includes('socket hang up'));
                        if (!isExpectedDrop) {
                            writeApplyResponse(installDir, 'error', `restart-server: fetch error: ${err.message}`, triggerTs);
                            resetStatus();
                            return;
                        }
                    }
                    const becameResponsive = await waitForServer(serverUrl, 1000, timeout);
                    if (!becameResponsive) {
                        writeApplyResponse(installDir, 'error', 'restart-server: server did not become responsive before timeout', triggerTs);
                        resetStatus();
                        return;
                    }
                    // Reload panel and refresh catalog now that server is back
                    if (ComfyUIPanel.currentPanel) {
                        ComfyUIPanel.currentPanel.reload();
                    }
                    const workspaceFolders = vscode.workspace.workspaceFolders;
                    if (workspaceFolders) {
                        const rootPath = workspaceFolders[0].uri.fsPath;
                        try {
                            await updateNodeCatalog(serverUrl, getInstallDir(rootPath));
                        } catch { /* catalog update is best-effort */ }
                    }
                    writeApplyResponse(installDir, 'ok', 'Server restarted and responsive — panel reloaded, catalog refreshed', triggerTs);
                    setStatus('$(check) ComfyUI: Server restarted');
                    setTimeout(resetStatus, 3000);
                    return;
                }

                if (signalData && signalData.command === 'refresh-catalog') {
                    // REFRESH CATALOG — re-fetch /object_info and rebuild all catalog files.
                    // Same as running "ComfyUI: Refresh Node Catalog" from the command palette.
                    // Use this after installing a custom node (without a full server restart) to
                    // pick up new node types.
                    const cfg = vscode.workspace.getConfiguration('comfyui');
                    const serverUrl = cfg.get<string>('serverUrl', 'http://localhost:8188');
                    const workspaceFolders = vscode.workspace.workspaceFolders;
                    if (!workspaceFolders) {
                        writeApplyResponse(installDir, 'error', 'refresh-catalog: no workspace folder', triggerTs);
                        resetStatus();
                        return;
                    }
                    setStatus('$(loading~spin) ComfyUI: Refreshing catalog...');
                    try {
                        const rootPath = workspaceFolders[0].uri.fsPath;
                        const result = await updateNodeCatalog(serverUrl, getInstallDir(rootPath));
                        const msg = result === null
                            ? 'Catalog rebuilt from scratch'
                            : result.added.length === 0 && result.removed.length === 0
                                ? 'Catalog is already up to date'
                                : `Catalog updated: +${result.added.length} added, -${result.removed.length} removed`;
                        writeApplyResponse(installDir, 'ok', msg, triggerTs);
                    } catch (err) {
                        writeApplyResponse(installDir, 'error', `refresh-catalog failed — is the server running? (${String(err)})`, triggerTs);
                    }
                    resetStatus();
                    return;
                }

                if (signalData && signalData.command === 'open-panel') {
                    // OPEN PANEL — create or reload the ComfyUI panel.
                    // Use after a server restart if the panel did not reload automatically.
                    vscode.commands.executeCommand('comfyui.openReloadEditor');
                    writeApplyResponse(installDir, 'ok', 'Panel opened/reloaded', triggerTs);
                    resetStatus();
                    return;
                }

                let workflowData: any = null;
                let patchData: any = null;

                if (signalData && signalData.patchPath) {
                    // PATCH MODE
                    // TODO(security): Constrain patchPath/sourcePath to installDir.
                    // Current behavior accepts absolute paths and path traversal via relative paths,
                    // which can read arbitrary JSON files outside the project if apply.json is manipulated.
                    const fullPatchPath = path.isAbsolute(signalData.patchPath)
                        ? signalData.patchPath
                        : path.join(installDir, signalData.patchPath);

                    if (fs.existsSync(fullPatchPath)) {
                        const patchContent = fs.readFileSync(fullPatchPath, 'utf-8');
                        patchData = JSON.parse(patchContent);
                        const baseState = stateProvider.getState();
                        workflowData = mergeWorkflows(baseState, patchData);
                    } else {
                        writeApplyResponse(installDir, 'error', `patchPath not found: ${signalData.patchPath}`, triggerTs);
                        resetStatus();
                        return;
                    }
                } else if (signalData && signalData.sourcePath) {
                    // FULL WORKFLOW MODE
                    const fullSourcePath = path.isAbsolute(signalData.sourcePath)
                        ? signalData.sourcePath
                        : path.join(installDir, signalData.sourcePath);

                    if (fs.existsSync(fullSourcePath)) {
                        const workflowContent = fs.readFileSync(fullSourcePath, 'utf-8');
                        workflowData = JSON.parse(workflowContent);
                    } else {
                        writeApplyResponse(installDir, 'error', `sourcePath not found: ${signalData.sourcePath}`, triggerTs);
                        resetStatus();
                        return;
                    }
                }

                if (workflowData && ComfyUIPanel.currentPanel) {
                    saveHistory(installDir, signalData.ts, patchData, stateProvider.getState());
                    if (patchData) {
                        // Patch mode: in-place updates via LiteGraph API — no loadGraphData,
                        // no new tab. New nodes use LiteGraph.createNode() + graph.add().

                        // Detect attempted type changes on existing nodes that are NOT also being
                        // removed in this same patch. If a node is in remove_nodes AND nodes[],
                        // that's an atomic replacement — the bridge handles it correctly (removes first,
                        // then creates new). Only warn for bare type-field patches on existing nodes.
                        const baseState = stateProvider.getState();
                        const baseNodesById: Record<number, any> = {};
                        for (const n of (baseState?.nodes ?? [])) { baseNodesById[n.id] = n; }
                        const removedInThisPatch = new Set<number>(
                            Array.isArray(patchData.remove_nodes) ? patchData.remove_nodes.map(Number) : []
                        );
                        const typeWarnings: string[] = [];
                        for (const pNode of (patchData.nodes ?? [])) {
                            const existing = baseNodesById[pNode.id];
                            if (existing && pNode.type && pNode.type !== existing.type && !removedInThisPatch.has(Number(pNode.id))) {
                                typeWarnings.push(`node ${pNode.id}: type change "${existing.type}" → "${pNode.type}" is unsupported and was ignored — use remove_nodes to delete the old node and add a new one instead`);
                            }
                        }

                        ComfyUIPanel.currentPanel.applyPatch(patchData);
                        const addedNodes = patchData.nodes?.length ?? 0;
                        const addedLinks = patchData.links?.length ?? 0;
                        const rmNodes = patchData.remove_nodes?.length ?? 0;
                        const rmLinks = patchData.remove_links?.length ?? 0;
                        const summary = `Patch applied: ${addedNodes} node(s), ${addedLinks} link(s)` +
                            (rmNodes > 0 || rmLinks > 0 ? `; removed: ${rmNodes} node(s), ${rmLinks} link(s)` : '');
                        const msg = typeWarnings.length > 0 ? `${summary}. WARNING: ${typeWarnings.join('; ')}` : summary;
                        writeApplyResponse(installDir, typeWarnings.length > 0 ? 'error' : 'ok', msg, triggerTs);
                    } else {
                        // Full workflow mode (sourcePath): intentional full replacement.
                        ComfyUIPanel.currentPanel.updateComfyState(workflowData);
                        writeApplyResponse(installDir, 'ok', 'Full workflow loaded', triggerTs);
                    }
                } else if (workflowData && !ComfyUIPanel.currentPanel) {
                    writeApplyResponse(installDir, 'error', 'ComfyUI panel is not open — open the panel and try again', triggerTs);
                }
                resetStatus();
            } catch (err) {
                // Silently ignore malformed JSON during writes (file may be mid-write)
                try {
                    writeApplyResponse(installDir, 'error', `Extension error: ${String(err)}`, triggerTs);
                } catch { /* ignore */ }
                resetStatus();
            }
        }, 250);
    };

    watcher.onDidChange(handleUpdate);
    watcher.onDidCreate(handleUpdate);

    // Cold-start check: if the trigger file is newer than the last response, the watcher
    // may have missed a write that happened before this activation. Process it now.
    (async () => {
        if (!fs.existsSync(signalPath)) { return; }
        const triggerMtime = fs.statSync(signalPath).mtimeMs;
        const responsePath = path.join(installDir, 'comfyai', 'apply-response.json');
        if (fs.existsSync(responsePath)) {
            const responseMtime = fs.statSync(responsePath).mtimeMs;
            if (triggerMtime <= responseMtime) { return; }
        }
        await handleUpdate();
    })();

    return new vscode.Disposable(() => {
        if (debounceTimer) { clearTimeout(debounceTimer); }
        watcher.dispose();
    });
}
