import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { getInstallDir, isAiEnabled } from './config';
import { setStatus, resetStatus } from './statusBar';
import { stateProvider, ComfyUIPanel } from './panel';

// ---------------------------------------------------------------------------
// Workflow merge
// ---------------------------------------------------------------------------

/**
 * Merge a patch workflow into a base workflow by node/link ID, returning a new
 * workflow object. Existing nodes/links are updated in place; new ones are added.
 */
export function mergeWorkflows(base: any, patch: any): any {
    const result = JSON.parse(JSON.stringify(base || { nodes: [], links: [], groups: [], config: {}, extra: {}, version: 0.4 }));

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
            try {
                const signalContent = fs.readFileSync(signalPath, 'utf-8');
                const signalData = JSON.parse(signalContent);

                if (signalData && signalData.command === 'interrupt') {
                    // INTERRUPT MODE — stop current generation
                    const serverUrl = vscode.workspace.getConfiguration('comfyui').get<string>('serverUrl', 'http://localhost:8188');
                    const resp = await fetch(`${serverUrl}/interrupt`, { method: 'POST' });
                    if (!resp.ok) {
                        vscode.window.showErrorMessage(`ComfyUI: Interrupt failed (${resp.status})`);
                    }
                    setStatus('$(stop) ComfyUI: Interrupted');
                    setTimeout(resetStatus, 2000);
                    return;
                }

                if (signalData && signalData.command === 'queue') {
                    // QUEUE MODE — forward to the ComfyUI panel (bridge node calls app.queuePrompt)
                    if (ComfyUIPanel.currentPanel) {
                        ComfyUIPanel.currentPanel.queueWorkflow();
                        setStatus('$(play) ComfyUI: Queued');
                        setTimeout(resetStatus, 2000);
                    }
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
                    }
                } else if (signalData && signalData.sourcePath) {
                    // FULL WORKFLOW MODE
                    const fullSourcePath = path.isAbsolute(signalData.sourcePath)
                        ? signalData.sourcePath
                        : path.join(installDir, signalData.sourcePath);

                    if (fs.existsSync(fullSourcePath)) {
                        const workflowContent = fs.readFileSync(fullSourcePath, 'utf-8');
                        workflowData = JSON.parse(workflowContent);
                    }
                }

                if (workflowData && ComfyUIPanel.currentPanel) {
                    saveHistory(installDir, signalData.ts, patchData, stateProvider.getState());
                    ComfyUIPanel.currentPanel.updateComfyState(workflowData);
                }
                resetStatus();
            } catch (err) {
                // Silently ignore malformed JSON during writes
                resetStatus();
            }
        }, 250);
    };

    watcher.onDidChange(handleUpdate);
    watcher.onDidCreate(handleUpdate);

    return new vscode.Disposable(() => {
        if (debounceTimer) { clearTimeout(debounceTimer); }
        watcher.dispose();
    });
}
