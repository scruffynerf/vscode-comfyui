import * as vscode from 'vscode';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { resolveInstallDir } from './installDir';
import { createStatusBar, setStatus, resetStatus } from './statusBar';
import { getInstallDir } from './config';
import { ComfyStateProvider, ComfyUIPanel, stateProvider } from './panel';
import { watchApplyFile } from './patchBridge';
import { ensureAgentGuide, ensureGitignore } from './agentFiles';
import { installIntegrationNode, installIntegrationNodeTo, waitForServer } from './install';
import { updateNodeCatalog } from './nodeCatalog';
import { registerContributionCommands } from './contributions';

export { ComfyStateProvider, stateProvider };

export function activate(context: vscode.ExtensionContext) {
	console.log('ComfyUI extension is now active!');

	const statusBar = createStatusBar();
	context.subscriptions.push(statusBar);

	ensureAgentGuide(context);
	ensureGitignore(context);
	registerContributionCommands(context);

	context.subscriptions.push(
		vscode.workspace.registerTextDocumentContentProvider(ComfyStateProvider.scheme, stateProvider)
	);

	// Start watching for agent "apply" signals; re-create the watcher if installDir changes.
	let applyFileWatcher: vscode.Disposable = watchApplyFile(context);
	context.subscriptions.push({
		dispose: () => applyFileWatcher.dispose(),
	});
	context.subscriptions.push(
		vscode.workspace.onDidChangeConfiguration(e => {
			if (e.affectsConfiguration('comfyui.installDir')) {
				applyFileWatcher.dispose();
				applyFileWatcher = watchApplyFile(context);
				ensureAgentGuide(context);
			}
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('comfyui.refreshNodeCatalog', async () => {
			const workspaceFolders = vscode.workspace.workspaceFolders;
			if (!workspaceFolders) { return; }
			const rootPath = workspaceFolders[0].uri.fsPath;
			const config = vscode.workspace.getConfiguration('comfyui');
			const serverUrl = config.get<string>('serverUrl', 'http://localhost:8188');
			setStatus('$(loading~spin) ComfyUI: Building node catalog...');
			try {
				const result = await updateNodeCatalog(serverUrl, getInstallDir(rootPath));
				if (result === null) {
					vscode.window.showInformationMessage('ComfyUI: Node catalog built.');
				} else if (result.added.length === 0 && result.removed.length === 0) {
					vscode.window.showInformationMessage('ComfyUI: Node catalog is up to date.');
				} else {
					vscode.window.showInformationMessage(
						`ComfyUI: Node catalog updated (+${result.added.length} -${result.removed.length} nodes).`
					);
				}
			} catch (err) {
				vscode.window.showErrorMessage(`ComfyUI: Failed to build node catalog — is the server running? (${(err as Error).message})`);
			} finally {
				resetStatus();
			}
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('comfyui.openStateDocument', async () => {
			const uri = vscode.Uri.parse(`${ComfyStateProvider.scheme}:Current-Workflow.json`);
			const doc = await vscode.workspace.openTextDocument(uri);
			vscode.window.showTextDocument(doc, { viewColumn: vscode.ViewColumn.Beside, preview: false });
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('comfyui.applyWorkflow', async () => {
			const activeEditor = vscode.window.activeTextEditor;
			if (!activeEditor) {
				vscode.window.showErrorMessage('No active text editor. Open a ComfyUI workflow JSON file to apply it.');
				return;
			}
			const text = activeEditor.document.getText();
			try {
				const workflowData = JSON.parse(text);
				if (ComfyUIPanel.currentPanel) {
					ComfyUIPanel.currentPanel.updateComfyState(workflowData);
					vscode.window.showInformationMessage('Workflow applied to ComfyUI.');
				} else {
					vscode.window.showErrorMessage('ComfyUI Editor is not open. Please run the editor first.');
				}
			} catch (e) {
				vscode.window.showErrorMessage('Failed to parse the active document as a valid JSON workflow.');
			}
		})
	);

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
				const response = await fetch(`${url}${endpoint}`, { method: 'GET' });

				if (response.ok) {
					vscode.window.showInformationMessage('Server restart triggered. Waiting for server to become responsive...');
					const timeout = config.get<number>('serverTimeout', 60000);
					const becameResponsive = await waitForServer(url, 1000, timeout);
					if (becameResponsive) {
						vscode.commands.executeCommand('comfyui.openReloadEditor');
						ComfyUIPanel.triggerCatalogUpdate();
					} else {
						vscode.window.showErrorMessage(
							'Server restart triggered, but ComfyUI did not become responsive before timeout.'
						);
					}
				} else {
					vscode.window.showErrorMessage(`Failed to restart server: ${response.statusText}`);
				}
			} catch (error: any) {
				// When the server restarts it drops the connection — treat connection errors as success.
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
					const becameResponsive = await waitForServer(url, 1000, timeout);
					if (becameResponsive) {
						vscode.commands.executeCommand('comfyui.openReloadEditor');
						ComfyUIPanel.triggerCatalogUpdate();
					} else {
						vscode.window.showErrorMessage(
							'Server restart triggered, but ComfyUI did not become responsive before timeout.'
						);
					}
				} else {
					vscode.window.showErrorMessage(`Error restarting server: ${msg}. Make sure your server is running and the restart endpoint is correct.`);
				}
			}
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('comfyui.installIntegrationNode', async () => {
			const config = vscode.workspace.getConfiguration('comfyui');
			const rawInstallDir = config.get<string>('installDir', 'comfyui-workspace');
			const installDir = resolveInstallDir(
				rawInstallDir,
				vscode.workspace.workspaceFolders?.[0]?.uri.fsPath,
				process.env.HOME
			);
			try {
				installIntegrationNode(installDir);
				ensureAgentGuide(context);
				vscode.window.showInformationMessage('VSCode integration node and agent guide installed/updated.');
			} catch (e: any) {
				vscode.window.showErrorMessage(`Failed to install integration node: ${e?.message ?? e}`);
			}
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('comfyui.installIntegrationNodeTo', async () => {
			const picked = await vscode.window.showOpenDialog({
				canSelectFiles: false,
				canSelectFolders: true,
				canSelectMany: false,
				title: 'Select your ComfyUI custom_nodes folder',
				openLabel: 'Install Here',
			});
			if (!picked || picked.length === 0) { return; }
			const customNodesDir = picked[0].fsPath;
			try {
				installIntegrationNodeTo(customNodesDir);
				vscode.window.showInformationMessage(
					'Integration node installed. Restart ComfyUI with --enable-cors-header to allow the VS Code panel to connect.'
				);
			} catch (e: any) {
				vscode.window.showErrorMessage(`Failed to install integration node: ${e?.message ?? e}`);
			}
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('comfyui.installComfyUI', async (args?: { autoStart?: boolean }) => {
			const config = vscode.workspace.getConfiguration('comfyui');
			const installUv = config.get<boolean>('installUvAutomatically', true);
			const rawInstallDir = config.get<string>('installDir', 'comfyui-workspace');
			const installDir = resolveInstallDir(
				rawInstallDir,
				vscode.workspace.workspaceFolders?.[0]?.uri.fsPath,
				process.env.HOME
			);

			if (!args?.autoStart && fs.existsSync(installDir)) {
				const ownFiles = new Set(['comfyai', 'COMFYUI_AGENT_GUIDE.md']);
				const foreignEntries = fs.readdirSync(installDir).filter(e => !ownFiles.has(e));
				if (foreignEntries.length > 0) {
					const selection = await vscode.window.showWarningMessage(
						`The directory '${installDir}' is not empty. Do you want to continue with the installation?`,
						'Continue',
						'Cancel'
					);
					if (selection !== 'Continue') {
						return;
					}
				}
			}

			vscode.window.showInformationMessage(`Starting ComfyUI Installation in ${installDir}...`);
			fs.mkdirSync(installDir, { recursive: true });
			ensureAgentGuide(context);

			const terminal = vscode.window.createTerminal({ name: 'Install ComfyUI', cwd: installDir });
			terminal.show();

			const isWin = os.platform() === 'win32';
			const venvDir = config.get<string>('venvDir', '.venv');
			const pythonVersion = config.get<string>('pythonVersion', '3.12');
			const enableCors = config.get<boolean>('enableCorsHeader', true);
			const startupArgs = config.get<string>('startupArgs', '');
			const corsArgs = enableCors ? '--enable-cors-header' : '';
			const argsStr = corsArgs + (startupArgs ? ` ${startupArgs}` : '');
			const runCmd = args?.autoStart
				? (isWin ? `; uv run --no-sync comfyui --enable-manager${argsStr}` : ` && uv run --no-sync comfyui --enable-manager${argsStr}`)
				: (isWin ? '; Write-Host "Installation complete. You can run comfyui with: ComfyUI: Run Hiddenswitch ComfyUI"' : ' && echo "Installation complete. You can run comfyui with: ComfyUI: Run Hiddenswitch ComfyUI"');

			if (isWin) {
				const checkUv = installUv
					? `if (!(Get-Command uv -ErrorAction SilentlyContinue)) { Write-Host "Installing uv..."; irm https://astral.sh/uv/install.ps1 | iex; $env:Path += ";$HOME\\.cargo\\bin;$HOME\\.local\\bin" }`
					: `if (!(Get-Command uv -ErrorAction SilentlyContinue)) { Write-Error "uv is not installed. Please enable 'comfyui.installUvAutomatically' or install it manually."; exit 1 }`;

				terminal.sendText(`${checkUv}; uv venv ${venvDir} --python ${pythonVersion}; if ($?) { . ${venvDir}\\Scripts\\activate.ps1; uv pip install --torch-backend=auto "comfyui@git+https://github.com/hiddenswitch/pip-and-uv-installable-ComfyUI.git"${runCmd} }`);
			} else {
				const checkUv = installUv
					? `if ! command -v uv >/dev/null 2>&1; then echo "Installing uv..."; curl -LsSf https://astral.sh/uv/install.sh | sh; export PATH="$HOME/.local/bin:$HOME/.cargo/bin:$PATH"; fi`
					: `command -v uv >/dev/null 2>&1 || { echo "Error: uv is not installed. Please enable 'comfyui.installUvAutomatically' or install it manually."; false; }`;

				terminal.sendText(`${checkUv} && \\
uv venv ${venvDir} --python ${pythonVersion} && \\
source ${venvDir}/bin/activate && \\
uv pip install --torch-backend=auto "comfyui@git+https://github.com/hiddenswitch/pip-and-uv-installable-ComfyUI.git"${runCmd}`);
			}
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('comfyui.installDevelopmentComfyUI', async (args?: { autoStart?: boolean }) => {
			const config = vscode.workspace.getConfiguration('comfyui');
			const installUv = config.get<boolean>('installUvAutomatically', true);
			const gitRepo = config.get<string>('gitRepo', 'https://github.com/hiddenswitch/pip-and-uv-installable-ComfyUI.git');
			const defaultBranch = config.get<string>('defaultBranch', 'main');
			const rawInstallDir = config.get<string>('installDir', 'comfyui-workspace');
			const installDir = resolveInstallDir(
				rawInstallDir,
				vscode.workspace.workspaceFolders?.[0]?.uri.fsPath,
				process.env.HOME
			);

			if (!args?.autoStart && fs.existsSync(installDir)) {
				const ownFiles = new Set(['comfyai', 'COMFYUI_AGENT_GUIDE.md']);
				const foreignEntries = fs.readdirSync(installDir).filter(e => !ownFiles.has(e));
				if (foreignEntries.length > 0) {
					const selection = await vscode.window.showWarningMessage(
						`The directory '${installDir}' is not empty. Do you want to continue with the installation?`,
						'Continue',
						'Cancel'
					);
					if (selection !== 'Continue') {
						return;
					}
				}
			}

			vscode.window.showInformationMessage(`Starting ComfyUI Development Installation in ${installDir}...`);
			fs.mkdirSync(installDir, { recursive: true });
			ensureAgentGuide(context);

			const terminal = vscode.window.createTerminal({ name: 'Install Dev ComfyUI', cwd: installDir });
			terminal.show();

			const isWin = os.platform() === 'win32';
			const venvDir = config.get<string>('venvDir', '.venv');
			const pythonVersion = config.get<string>('pythonVersion', '3.12');
			const enableCors = config.get<boolean>('enableCorsHeader', true);
			const startupArgs = config.get<string>('startupArgs', '');
			const corsArgs = enableCors ? '--enable-cors-header' : '';
			const argsStr = corsArgs + (startupArgs ? ` ${startupArgs}` : '');
			const runCmd = args?.autoStart
				? (isWin ? `; uv run --no-sync comfyui --enable-manager${argsStr}` : ` && uv run --no-sync comfyui --enable-manager${argsStr}`)
				: (isWin ? '; Write-Host "Development installation complete."' : ' && echo "Development installation complete."');

			if (isWin) {
				const checkUv = installUv
					? `if (!(Get-Command uv -ErrorAction SilentlyContinue)) { Write-Host "Installing uv..."; irm https://astral.sh/uv/install.ps1 | iex; $env:Path += ";$HOME\\.cargo\\bin;$HOME\\.local\\bin" }`
					: `if (!(Get-Command uv -ErrorAction SilentlyContinue)) { Write-Error "uv is not installed. Please enable 'comfyui.installUvAutomatically' or install it manually."; exit 1 }`;

				terminal.sendText(`git clone ${gitRepo} ComfyUI; if ($?) { cd ComfyUI; git checkout ${defaultBranch}; ${checkUv}; uv venv ${venvDir} --python ${pythonVersion}; if ($?) { . ${venvDir}\\Scripts\\activate.ps1; uv pip install -e ".[dev]"${runCmd} } }`);
			} else {
				const checkUv = installUv
					? `if ! command -v uv >/dev/null 2>&1; then echo "Installing uv..."; curl -LsSf https://astral.sh/uv/install.sh | sh; export PATH="$HOME/.local/bin:$HOME/.cargo/bin:$PATH"; fi`
					: `command -v uv >/dev/null 2>&1 || { echo "Error: uv is not installed. Please enable 'comfyui.installUvAutomatically' or install it manually."; false; }`;

				terminal.sendText(`git clone ${gitRepo} ComfyUI && \\
cd ComfyUI && git checkout ${defaultBranch} && \\
${checkUv} && \\
uv venv ${venvDir} --python ${pythonVersion} && \\
source ${venvDir}/bin/activate && \\
uv pip install -e ".[dev]"${runCmd}`);
			}
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('comfyui.runHiddenswitch', async () => {
			const config = vscode.workspace.getConfiguration('comfyui');
			const url = config.get<string>('serverUrl', 'http://localhost:8188');

			const isWin = os.platform() === 'win32';
			const venvDir = config.get<string>('venvDir', '.venv');
			const enableCors = config.get<boolean>('enableCorsHeader', true);
			const startupArgs = config.get<string>('startupArgs', '');
			const corsArgs = enableCors ? '--enable-cors-header' : '';
			const argsStr = corsArgs + (startupArgs ? ` ${startupArgs}` : '');
			const rawInstallDir = config.get<string>('installDir', 'comfyui-workspace');
			const installDir = resolveInstallDir(
				rawInstallDir,
				vscode.workspace.workspaceFolders?.[0]?.uri.fsPath,
				process.env.HOME
			);

			// Smart Check: Is the server already running?
			const isRunning = await waitForServer(url, 0, 100);
			if (isRunning) {
				vscode.window.showInformationMessage('ComfyUI server is already running. Opening panel...');
				vscode.commands.executeCommand('comfyui.openReloadEditor');
				return;
			}

			// Install Check: Is the software actually installed?
			const baseVenv = path.join(installDir, venvDir);
			const devVenv = path.join(installDir, 'ComfyUI', venvDir);
			const isInstalled = fs.existsSync(baseVenv) || fs.existsSync(devVenv);

			if (!isInstalled) {
				const selection = await vscode.window.showInformationMessage(
					`ComfyUI is not installed in '${installDir}'. Would you like to install it now?`,
					'Install Standard (pip)',
					'Install Development (git)',
					'Cancel'
				);

				if (selection === 'Install Standard (pip)') {
					vscode.commands.executeCommand('comfyui.installComfyUI', { autoStart: true });
				} else if (selection === 'Install Development (git)') {
					vscode.commands.executeCommand('comfyui.installDevelopmentComfyUI', { autoStart: true });
				}

				if (selection === 'Install Standard (pip)' || selection === 'Install Development (git)') {
					waitForServer(url, 2000, 600000).then((becameResponsive) => {
						if (becameResponsive) {
							vscode.commands.executeCommand('comfyui.openReloadEditor');
						} else {
							vscode.window.showErrorMessage(
								'Installation was started, but ComfyUI did not become responsive within 10 minutes.'
							);
						}
					});
				}
				return;
			}

			installIntegrationNode(installDir);
			ensureAgentGuide(context);

			const terminal = vscode.window.createTerminal('ComfyUI');
			terminal.show();
			if (isWin) {
				terminal.sendText(`if (Test-Path "${installDir}\\ComfyUI") { Set-Location "${installDir}\\ComfyUI" } else { Set-Location "${installDir}" }`);
				terminal.sendText(`. ${venvDir}\\Scripts\\Activate.ps1; uv run --no-sync comfyui --enable-manager${argsStr}`);
			} else {
				terminal.sendText(`if [ -d "${installDir}/ComfyUI" ]; then cd "${installDir}/ComfyUI"; else cd "${installDir}"; fi`);
				terminal.sendText(`source ${venvDir}/bin/activate && uv run --no-sync comfyui --enable-manager${argsStr}`);
			}

			vscode.window.showInformationMessage('Starting ComfyUI Server... Waiting for it to become responsive.');
			const timeout = config.get<number>('serverTimeout', 60000);
			waitForServer(url, 1000, timeout * 3).then((becameResponsive) => {
				if (becameResponsive) {
					vscode.commands.executeCommand('comfyui.openReloadEditor');
				} else {
					vscode.window.showErrorMessage(
						'ComfyUI launch was attempted, but the server did not become responsive before timeout.'
					);
				}
			});
		})
	);

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

export function deactivate() { }
