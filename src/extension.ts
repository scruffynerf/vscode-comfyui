// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as os from 'os';
import { resolveInstallDir } from './installDir';

class ComfyUIPanel {
	public static currentPanel: ComfyUIPanel | undefined;
	private readonly _panel: vscode.WebviewPanel;
	private _disposables: vscode.Disposable[] = [];

	private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
		this._panel = panel;
		this._panel.webview.html = this._getWebviewContent();
		this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

		this._panel.onDidChangeViewState(
			(e: vscode.WebviewPanelOnDidChangeViewStateEvent) => {
				vscode.commands.executeCommand('setContext', 'comfyuiEditorActive', this._panel.visible);
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
	}

	public reload() {
		// Setting html to empty and then back to content can help force a reload of the iframe
		const content = this._getWebviewContent();
		this._panel.webview.html = '';
		setTimeout(() => {
			this._panel.webview.html = content;
		}, 100);
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

async function waitForServer(url: string, interval = 1000, timeout?: number): Promise<boolean> {
	const effectiveTimeout = timeout ?? 60000;
	const startTime = Date.now();
	while (Date.now() - startTime < effectiveTimeout) {
		try {
			// Try a simple ping to the server URL
			const response = await fetch(url, { method: 'HEAD' });
			if (response.ok || response.status < 500) {
				return true;
			}
		} catch (e) {
			// Server not up yet, ignore error and continue polling
		}
		await new Promise(resolve => setTimeout(resolve, interval));
	}
	return false;
}

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	console.log('ComfyUI extension is now active!');

	context.subscriptions.push(
		vscode.commands.registerCommand('comfyui.openReloadEditor', () => {
			if (ComfyUIPanel.currentPanel) {
				ComfyUIPanel.currentPanel.reload();
			} else {
				ComfyUIPanel.createOrShow(context.extensionUri);
			}
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('comfyui.restartServer', async () => {
			const config = vscode.workspace.getConfiguration('comfyui');
			const url = config.get<string>('serverUrl', 'http://localhost:8188');
			const endpoint = config.get<string>('restartEndpoint', '/v2/manager/reboot');

			try {
				vscode.window.showInformationMessage('Restarting ComfyUI Server...');
				const response = await fetch(`${url}${endpoint}`, {
					method: 'GET',
				});

				if (response.ok) {
					vscode.window.showInformationMessage('Server restart triggered. Waiting for server to become responsive...');
					const timeout = config.get<number>('serverTimeout', 60000);
					await waitForServer(url, 1000, timeout);
					vscode.commands.executeCommand('comfyui.openReloadEditor');
				} else {
					vscode.window.showErrorMessage(`Failed to restart server: ${response.statusText}`);
				}
			} catch (error: any) {
				// When the server restarts it drops the connection, causing fetch to throw a
				// network error (TypeError: fetch failed / ECONNRESET / ECONNREFUSED).
				// That means the restart was actually triggered — treat it as success.
				const msg: string = error?.message ?? '';
				const isConnectionDrop =
					error instanceof TypeError &&
					(msg.includes('fetch failed') ||
						msg.includes('ECONNRESET') ||
						msg.includes('ECONNREFUSED') ||
						msg.includes('socket hang up') ||
						msg.includes('network error'));

				if (isConnectionDrop) {
					vscode.window.showInformationMessage('Server restart triggered. Waiting for server to become responsive...');
					const timeout = config.get<number>('serverTimeout', 60000);
					await waitForServer(url, 1000, timeout);
					vscode.commands.executeCommand('comfyui.openReloadEditor');
				} else {
					vscode.window.showErrorMessage(`Error restarting server: ${msg}. Make sure your server is running and the restart endpoint is correct.`);
				}
			}
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('comfyui.installComfyUI', () => {
			const config = vscode.workspace.getConfiguration('comfyui');
			const installUv = config.get<boolean>('installUvAutomatically', true);
			const rawInstallDir = config.get<string>('installDir', 'comfyui-workspace');
			const installDir = resolveInstallDir(
				rawInstallDir,
				vscode.workspace.workspaceFolders?.[0]?.uri.fsPath,
				process.env.HOME
			);
			fs.mkdirSync(installDir, { recursive: true });
			const terminal = vscode.window.createTerminal({ name: 'Install ComfyUI', cwd: installDir });
			terminal.show();

			const isWin = os.platform() === 'win32';

			if (isWin) {
				const checkUv = installUv
					? `if (!(Get-Command uv -ErrorAction SilentlyContinue)) { Write-Host "Installing uv..."; irm https://astral.sh/uv/install.ps1 | iex; $env:Path += ";$HOME\\.cargo\\bin;$HOME\\.local\\bin" }`
					: `if (!(Get-Command uv -ErrorAction SilentlyContinue)) { Write-Error "uv is not installed. Please enable 'comfyui.installUvAutomatically' or install it manually."; exit 1 }`;

				terminal.sendText(`${checkUv}; \\
uv venv --python 3.12; \\
if ($?) { . .venv\\Scripts\\activate.ps1; \\
uv pip install --torch-backend=auto "comfyui@git+https://github.com/hiddenswitch/ComfyUI.git"; \\
Write-Host "Installation complete. You can run comfyui with: ComfyUI: Run Hiddenswitch ComfyUI" }`);
			} else {
				const checkUv = installUv
					? `if ! command -v uv >/dev/null 2>&1; then echo "Installing uv..."; curl -LsSf https://astral.sh/uv/install.sh | sh; export PATH="$HOME/.local/bin:$HOME/.cargo/bin:$PATH"; fi`
					: `command -v uv >/dev/null 2>&1 || { echo "Error: uv is not installed. Please enable 'comfyui.installUvAutomatically' or install it manually."; false; }`;

				terminal.sendText(`${checkUv} && \\
uv venv --python 3.12 && \\
source .venv/bin/activate && \\
uv pip install --torch-backend=auto "comfyui@git+https://github.com/hiddenswitch/ComfyUI.git" && \\
echo "Installation complete. You can run comfyui with: ComfyUI: Run Hiddenswitch ComfyUI"`);
			}
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('comfyui.installDevelopmentComfyUI', () => {
			const config = vscode.workspace.getConfiguration('comfyui');
			const installUv = config.get<boolean>('installUvAutomatically', true);
			const gitRepo = config.get<string>('gitRepo', 'https://github.com/hiddenswitch/ComfyUI.git');
			const defaultBranch = config.get<string>('defaultBranch', 'main');
			const rawInstallDir = config.get<string>('installDir', 'comfyui-workspace');
			const installDir = resolveInstallDir(
				rawInstallDir,
				vscode.workspace.workspaceFolders?.[0]?.uri.fsPath,
				process.env.HOME
			);
			fs.mkdirSync(installDir, { recursive: true });
			const terminal = vscode.window.createTerminal({ name: 'Install Dev ComfyUI', cwd: installDir });
			terminal.show();

			const isWin = os.platform() === 'win32';

			if (isWin) {
				const checkUv = installUv
					? `if (!(Get-Command uv -ErrorAction SilentlyContinue)) { Write-Host "Installing uv..."; irm https://astral.sh/uv/install.ps1 | iex; $env:Path += ";$HOME\\.cargo\\bin;$HOME\\.local\\bin" }`
					: `if (!(Get-Command uv -ErrorAction SilentlyContinue)) { Write-Error "uv is not installed. Please enable 'comfyui.installUvAutomatically' or install it manually."; exit 1 }`;

				terminal.sendText(`git clone ${gitRepo} ComfyUI; \\
if ($?) { cd ComfyUI; git checkout ${defaultBranch}; \\
${checkUv}; \\
uv venv --python 3.12; \\
if ($?) { . .venv\\Scripts\\activate.ps1; \\
uv pip install -e ".[dev]"; \\
Write-Host "Development installation complete." } }`);
			} else {
				const checkUv = installUv
					? `if ! command -v uv >/dev/null 2>&1; then echo "Installing uv..."; curl -LsSf https://astral.sh/uv/install.sh | sh; export PATH="$HOME/.local/bin:$HOME/.cargo/bin:$PATH"; fi`
					: `command -v uv >/dev/null 2>&1 || { echo "Error: uv is not installed. Please enable 'comfyui.installUvAutomatically' or install it manually."; false; }`;

				terminal.sendText(`git clone ${gitRepo} ComfyUI && \\
cd ComfyUI && git checkout ${defaultBranch} && \\
${checkUv} && \\
uv venv --python 3.12 && \\
source .venv/bin/activate && \\
uv pip install -e ".[dev]" && \\
echo "Development installation complete."`);
			}
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('comfyui.runHiddenswitch', () => {
			const config = vscode.workspace.getConfiguration('comfyui');
			const installDir = config.get<string>('installDir', 'comfyui-workspace');
			const terminal = vscode.window.createTerminal('ComfyUI');
			terminal.show();

			const isWin = os.platform() === 'win32';

			// Switch to appropriate directory and run
			if (isWin) {
				terminal.sendText(`if (Test-Path "${installDir}\\ComfyUI") { Set-Location "${installDir}\\ComfyUI" } else { Set-Location "${installDir}" }`);
				terminal.sendText('. .venv\\Scripts\\Activate.ps1; uv run --no-sync comfyui --enable-manager');
			} else {
				terminal.sendText(`if [ -d "${installDir}/ComfyUI" ]; then cd "${installDir}/ComfyUI"; else cd "${installDir}"; fi`);
				terminal.sendText('source .venv/bin/activate && uv run --no-sync comfyui --enable-manager');
			}

			vscode.window.showInformationMessage('Starting ComfyUI Server... Waiting for it to become responsive.');
			const url = config.get<string>('serverUrl', 'http://localhost:8188');
			const timeout = config.get<number>('serverTimeout', 60000);
			waitForServer(url, 1000, timeout * 3).then(() => {
				vscode.commands.executeCommand('comfyui.openReloadEditor');
			});
		})
	);

	// Listen for configuration changes
	context.subscriptions.push(
		vscode.workspace.onDidChangeConfiguration((e: vscode.ConfigurationChangeEvent) => {
			if (e.affectsConfiguration('comfyui.serverUrl')) {
				if (ComfyUIPanel.currentPanel) {
					ComfyUIPanel.currentPanel.reload();
				}
			}
		})
	);
}

// This method is called when your extension is deactivated
export function deactivate() { }
