import * as vscode from 'vscode';
import { resolveInstallDir } from './installDir';

/**
 * Reads comfyui.installDir from workspace config and resolves it to an
 * absolute path, using workspaceRoot as the base for relative values.
 */
export function getInstallDir(workspaceRoot: string): string {
    const config = vscode.workspace.getConfiguration('comfyui');
    const rawInstallDir = config.get<string>('installDir', 'comfyui-workspace');
    return resolveInstallDir(rawInstallDir, workspaceRoot, process.env.HOME);
}

/**
 * Returns true when the comfyui.enableAiFeatures setting is on (the default).
 * When false, all agent integration is skipped: no state writes, no summary,
 * no catalog, no patch bridge, no agent doc deployment.
 */
export function isAiEnabled(): boolean {
    return vscode.workspace.getConfiguration('comfyui').get<boolean>('enableAiFeatures', true);
}
