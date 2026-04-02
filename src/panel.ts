import * as vscode from 'vscode';
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
        updateNodeCatalog(serverUrl, getInstallDir(rootPath)).then(result => {
            if (result && (result.added.length > 0 || result.removed.length > 0)) {
                console.log(`[ComfyUI] Node catalog updated: +${result.added.length} -${result.removed.length}`);
            }
        }).catch(err => {
            // Server may not be running — silently skip
            console.log('[ComfyUI] Node catalog update skipped:', (err as Error).message);
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

    public queueWorkflow() {
        this._panel.webview.postMessage({ command: 'queueWorkflow' });
    }

    private _getWebviewContent() {
        const config = vscode.workspace.getConfiguration('comfyui');
        const url = config.get<string>('serverUrl', 'http://localhost:8188');

        return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>ComfyUI Editor</title>
                <style>
                    body, html {
                        margin: 0;
                        padding: 0;
                        width: 100%;
                        height: 100vh;
                        overflow: hidden;
                        background-color: #1e1e1e;
                    }
                    iframe {
                        border: none;
                        width: 100%;
                        height: 100%;
                    }
                </style>
                <script>
                    const vscode = acquireVsCodeApi();

                    // Listen for messages from the iframe (ComfyUI) and pass to VS Code
                    window.addEventListener('message', event => {
                        if (event.data && event.data.command === 'comfyStateUpdate') {
                            vscode.postMessage(event.data);
                        }
                    });

                    // Listen for messages from VS Code and pass to the iframe (ComfyUI)
                    window.addEventListener('message', event => {
                        const cmd = event.data && event.data.command;
                        if (cmd === 'updateComfyState' || cmd === 'queueWorkflow') {
                            const iframe = document.querySelector('iframe');
                            if (iframe && iframe.contentWindow) {
                                iframe.contentWindow.postMessage(event.data, '*');
                            }
                        }
                    });
                </script>
            </head>
            <body>
                <iframe
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
