import * as vscode from 'vscode';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { getInstallDir, isAiEnabled } from './config';
import { setStatus, resetStatus } from './statusBar';
import { formatWorkflowSummary } from './workflowAnalyzer';
import { updateNodeCatalog } from './nodeCatalog';

// ---------------------------------------------------------------------------
// ComfyStateProvider — virtual document + filesystem sync
// ---------------------------------------------------------------------------

export class ComfyStateProvider implements vscode.TextDocumentContentProvider {
    public static readonly scheme = 'comfyui-state';
    private _onDidChange = new vscode.EventEmitter<vscode.Uri>();
    public readonly onDidChange = this._onDidChange.event;
    private _state = '{}';
    private _stateObj: any = {};

    public update(workflowData: any) {
        if (workflowData) {
            this._stateObj = JSON.parse(JSON.stringify(workflowData));
            if (Array.isArray(workflowData.nodes)) {
                workflowData.nodes.sort((a: any, b: any) => Number(a.id) - Number(b.id));
            }
            if (Array.isArray(workflowData.links)) {
                workflowData.links.sort((a: any, b: any) => {
                    const idA = Array.isArray(a) ? a[0] : a.id;
                    const idB = Array.isArray(b) ? b[0] : b.id;
                    return Number(idA) - Number(idB);
                });
            }
        }

        this._state = JSON.stringify(workflowData, null, 2);
        this._onDidChange.fire(vscode.Uri.parse(`${ComfyStateProvider.scheme}:Current-Workflow.json`));

        // Sync to a physical file for AI agent visibility
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (workspaceFolders && isAiEnabled()) {
            const comfyaiDir = path.join(getInstallDir(workspaceFolders[0].uri.fsPath), 'comfyai');
            fs.mkdirSync(comfyaiDir, { recursive: true });
            const statePath = path.join(comfyaiDir, 'workflow-state.readonly.json');
            try {
                const stateTmp = statePath + '.tmp';
                fs.writeFileSync(stateTmp, this._state, 'utf-8');
                fs.renameSync(stateTmp, statePath);
            } catch (err) {
                console.error('[ComfyUI] Failed to sync state to file:', err);
            }

            // Write a human/AI-readable summary alongside the state file
            const summaryPath = path.join(comfyaiDir, 'workflow-summary.md');
            try {
                setStatus('$(loading~spin) ComfyUI: Analyzing...');
                const summary = formatWorkflowSummary(workflowData);
                const summaryTmp = summaryPath + '.tmp';
                fs.writeFileSync(summaryTmp, summary, 'utf-8');
                fs.renameSync(summaryTmp, summaryPath);
                resetStatus();
            } catch (err) {
                console.error('[ComfyUI] Failed to write workflow summary:', err);
                resetStatus();
            }
        }
    }

    public provideTextDocumentContent(_uri: vscode.Uri): string {
        return this._state;
    }

    public getState(): any {
        return JSON.parse(JSON.stringify(this._stateObj));
    }
}

export const stateProvider = new ComfyStateProvider();

// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// Server info — written to comfyai/server-info.json on panel open
// ---------------------------------------------------------------------------

async function writeServerInfo(serverUrl: string, installDir: string, config: vscode.WorkspaceConfiguration): Promise<void> {
    const response = await fetch(`${serverUrl}/system_stats`);
    if (!response.ok) { return; }
    const stats = await response.json() as any;
    const startupArgs = config.get<string>('startupArgs', '');
    const info = {
        serverUrl,
        configuredStartupArgs: `--enable-manager${startupArgs ? ' ' + startupArgs : ''}`,
        system: stats.system ?? {},
        devices: stats.devices ?? [],
        updatedAt: new Date().toISOString(),
    };
    const outPath = path.join(installDir, 'comfyai', 'server-info.json');
    fs.writeFileSync(outPath, JSON.stringify(info, null, 2), 'utf-8');
}

// ---------------------------------------------------------------------------
// ComfyUIPanel — embedded webview
// ---------------------------------------------------------------------------

export class ComfyUIPanel {
    public static currentPanel: ComfyUIPanel | undefined;
    private readonly _panel: vscode.WebviewPanel;
    private _disposables: vscode.Disposable[] = [];

    private constructor(panel: vscode.WebviewPanel, _extensionUri: vscode.Uri) {
        this._panel = panel;
        this._panel.webview.html = this._getWebviewContent();
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

        this._panel.onDidChangeViewState(
            (_e: vscode.WebviewPanelOnDidChangeViewStateEvent) => {
                vscode.commands.executeCommand('setContext', 'comfyuiEditorActive', this._panel.visible);
            },
            null,
            this._disposables
        );

        this._panel.webview.onDidReceiveMessage(
            (message) => {
                if (message.command === 'comfyStateUpdate') {
                    stateProvider.update(message.workflowData);
                    // If the catalog update failed at panel-open time (server wasn't ready),
                    // the available-models.json file will be absent. Retry on the first state
                    // update we receive — by this point the server is confirmed reachable.
                    const workspaceFolders = vscode.workspace.workspaceFolders;
                    if (workspaceFolders && isAiEnabled()) {
                        const rootPath = workspaceFolders[0].uri.fsPath;
                        const installDir = getInstallDir(rootPath);
                        const modelsFile = path.join(installDir, 'comfyai', 'available-models.json');
                        if (!fs.existsSync(modelsFile)) {
                            ComfyUIPanel.triggerCatalogUpdate();
                        }
                    }
                }
            },
            null,
            this._disposables
        );

        vscode.commands.executeCommand('setContext', 'comfyuiEditorActive', true);
    }

    public static createOrShow(extensionUri: vscode.Uri) {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;

        if (ComfyUIPanel.currentPanel) {
            ComfyUIPanel.currentPanel._panel.reveal(column);
            return;
        }

        const panel = vscode.window.createWebviewPanel(
            'comfyuiEditor',
            'ComfyUI Editor',
            column || vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
            }
        );

        ComfyUIPanel.currentPanel = new ComfyUIPanel(panel, extensionUri);
        ComfyUIPanel.triggerCatalogUpdate();
    }

    public static triggerCatalogUpdate() {
        if (!isAiEnabled()) { return; }
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) { return; }
        const rootPath = workspaceFolders[0].uri.fsPath;
        const config = vscode.workspace.getConfiguration('comfyui');
        const serverUrl = config.get<string>('serverUrl', 'http://localhost:8188');
        const installDir = getInstallDir(rootPath);
        updateNodeCatalog(serverUrl, installDir).then(result => {
            if (result && (result.added.length > 0 || result.removed.length > 0)) {
                console.log(`[ComfyUI] Node catalog updated: +${result.added.length} -${result.removed.length}`);
            }
        }).catch(err => {
            // Server may not be running — silently skip
            console.log('[ComfyUI] Node catalog update skipped:', (err as Error).message);
        });
        writeServerInfo(serverUrl, installDir, config).catch(() => {
            // Server may not be running — silently skip
        });
    }

    public reload() {
        const content = this._getWebviewContent();
        this._panel.webview.html = '';
        setTimeout(() => {
            this._panel.webview.html = content;
        }, 100);
    }

    public updateComfyState(workflowData: any) {
        this._panel.webview.postMessage({ command: 'updateComfyState', workflowData });
    }

    /** Apply a partial patch in-place (avoids loadGraphData / new-tab creation). */
    public applyPatch(patch: any) {
        this._panel.webview.postMessage({ command: 'applyPatch', patch });
    }

    public queueWorkflow() {
        this._panel.webview.postMessage({ command: 'queueWorkflow' });
    }

    public autoLayout() {
        this._panel.webview.postMessage({ command: 'autoLayout' });
    }

    private _getWebviewContent() {
        const config = vscode.workspace.getConfiguration('comfyui');
        const url = config.get<string>('serverUrl', 'http://localhost:8188');
        const nonce = crypto.randomBytes(16).toString('hex');

        // Derive the frame-src / connect-src origin from the configured URL.
        let frameOrigin = url;
        try { frameOrigin = new URL(url).origin; } catch { /* keep full url */ }

        return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonce}'; frame-src ${frameOrigin}; connect-src ${frameOrigin};">
                <title>ComfyUI Editor</title>
                <style>
                    body, html { margin: 0; padding: 0; width: 100%; height: 100vh; overflow: hidden; background-color: #1e1e1e; }
                    iframe { border: none; width: 100%; height: 100%; }
                    #error-msg { display: none; color: #ccc; font-family: sans-serif; padding: 2rem; max-width: 600px; margin: 4rem auto; line-height: 1.6; }
                    #error-msg h2 { color: #f48771; }
                    code { background: #333; padding: 2px 5px; border-radius: 3px; }
                </style>
                <script nonce="${nonce}">
                    const vscode = acquireVsCodeApi();
                    let bridgeConnected = false;

                    // Relay iframe → VS Code
                    window.addEventListener('message', event => {
                        if (event.data && event.data.command === 'comfyStateUpdate') {
                            bridgeConnected = true;
                            vscode.postMessage(event.data);
                        }
                    });

                    // Relay VS Code → iframe
                    window.addEventListener('message', event => {
                        const cmd = event.data && event.data.command;
                        if (cmd === 'updateComfyState' || cmd === 'applyPatch' || cmd === 'queueWorkflow' || cmd === 'autoLayout') {
                            const iframe = document.getElementById('comfy-frame');
                            if (iframe && iframe.contentWindow) {
                                iframe.contentWindow.postMessage(event.data, '*');
                            }
                        }
                    });

                    // After 4 seconds, if the bridge hasn't connected, check whether the
                    // server is reachable with CORS. A 403 (stock ComfyUI blocking the
                    // vscode-webview:// origin) causes the CORS fetch to fail even though
                    // the iframe fired its load event. Show an actionable error in that case.
                    setTimeout(() => {
                        if (bridgeConnected) { return; }
                        fetch('${url}', { credentials: 'omit' })
                            .then(r => { if (!r.ok) { showError(); } })
                            .catch(() => { showError(); });
                    }, 4000);

                    function showError() {
                        if (bridgeConnected) { return; }
                        const msg = document.getElementById('error-msg');
                        const frame = document.getElementById('comfy-frame');
                        if (msg) { msg.style.display = 'block'; }
                        if (frame) { frame.style.display = 'none'; }
                    }
                </script>
            </head>
            <body>
                <div id="error-msg">
                    <h2>ComfyUI panel failed to load</h2>
                    <p>The server at <strong>${url}</strong> is not accepting requests from the VS Code webview
                    (likely a <strong>403 Forbidden</strong> — stock ComfyUI blocks the <code>vscode-webview://</code> origin by default).</p>
                    <p><strong>Fix:</strong> add <code>--enable-cors-header</code> to your ComfyUI startup arguments.<br>
                    In VS Code settings, set <em>ComfyUI › Startup Args</em> to include <code>--enable-cors-header</code>, then restart ComfyUI.</p>
                    
                </div>
                <iframe
                    id="comfy-frame"
                    src="${url}"
                    sandbox="allow-scripts allow-same-origin allow-forms"
                    allow="clipboard-read; clipboard-write">
                </iframe>
            </body>
            </html>
        `;
    }

    public dispose() {
        ComfyUIPanel.currentPanel = undefined;
        this._panel.dispose();
        vscode.commands.executeCommand('setContext', 'comfyuiEditorActive', false);
        while (this._disposables.length) {
            const disposable = this._disposables.pop();
            if (disposable) {
                disposable.dispose();
            }
        }
    }
}
