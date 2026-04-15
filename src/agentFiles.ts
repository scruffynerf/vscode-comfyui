import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { getInstallDir, isAiEnabled } from './config';

// ---------------------------------------------------------------------------
// Agent doc deployment
// ---------------------------------------------------------------------------

const TEXT_EXTENSIONS = new Set(['.md', '.txt', '.json', '.yaml', '.yml', '.sh', '.py']);

function copyDirRecursive(src: string, dest: string, vars: Record<string, string>) {
    fs.mkdirSync(dest, { recursive: true });
    for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
        if (entry.name.startsWith('.')) { continue; }
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);
        if (entry.isDirectory()) {
            copyDirRecursive(srcPath, destPath, vars);
        } else if (TEXT_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) {
            let content = fs.readFileSync(srcPath, 'utf-8');
            for (const [key, value] of Object.entries(vars)) {
                content = content.replaceAll(`{${key}}`, value);
            }
            fs.writeFileSync(destPath, content, 'utf-8');
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

/**
 * Seeds a file from source, but only if it doesn't exist at dest.
 * Creates parent directories as needed.
 */
function seedFileOnce(srcPath: string, destPath: string, vars: Record<string, string>) {
    if (fs.existsSync(destPath)) { return; }
    fs.mkdirSync(path.dirname(destPath), { recursive: true });
    let content = fs.readFileSync(srcPath, 'utf-8');
    for (const [key, value] of Object.entries(vars)) {
        content = content.replaceAll(`{${key}}`, value);
    }
    fs.writeFileSync(destPath, content, 'utf-8');
}

/**
 * Seeds all files in a source directory into the dest directory.
 * Only copies files that don't already exist at dest.
 * Recursive — mirrors directory structure.
 */
function seedDirOnce(srcDir: string, destDir: string, vars: Record<string, string>) {
    fs.mkdirSync(destDir, { recursive: true });
    for (const entry of fs.readdirSync(srcDir, { withFileTypes: true })) {
        const srcPath = path.join(srcDir, entry.name);
        const destPath = path.join(destDir, entry.name);
        if (entry.isDirectory()) {
            seedDirOnce(srcPath, destPath, vars);
        } else if (TEXT_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) {
            seedFileOnce(srcPath, destPath, vars);
        } else {
            if (!fs.existsSync(destPath)) {
                fs.copyFileSync(srcPath, destPath);
            }
        }
    }
}

/**
 * Deploys agent docs, schemas, and the top-level guide into the install dir.
 * New agent docs are added by placing files in agent-docs/comfyai/ — no code
 * changes required (the recursive copy handles them automatically).
 *
 * User/agent-editable config files (_extension/hiddenswitch/config/) and wiki/ are seeded
 * once from templates and never overwritten — user edits are preserved across
 * extension updates.
 */
export function ensureAgentGuide(context: vscode.ExtensionContext) {
    if (!isAiEnabled()) { return; }
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
        return;
    }

    const rootPath = workspaceFolders[0].uri.fsPath;
    const installDir = getInstallDir(rootPath);
    const extPath = context.extensionPath;
    const comfyaiDir = path.join(installDir, 'comfyai');
    const config = vscode.workspace.getConfiguration('comfyui');
    const venvDir = config.get<string>('venvDir', '.venv');
    const vars: Record<string, string> = { installDir, venv: venvDir };

    // Clean up old filenames (workspace-root leftovers from earlier versions)
    for (const old of ['AGENT_GUIDE.md']) {
        const p = path.join(rootPath, old);
        if (fs.existsSync(p)) { try { fs.unlinkSync(p); } catch {} }
    }

    console.log('[ComfyUI] ensureAgentGuide: extPath=' + extPath);
    console.log('[ComfyUI] ensureAgentGuide: installDir=' + installDir);
    console.log('[ComfyUI] ensureAgentGuide: comfyaiDir=' + comfyaiDir);
    try {
        // Deploy all agent docs: agent-docs/comfyai/ mirrors workspace comfyai/
        // EXCEPT wiki/ which is seeded (not overwritten) to preserve agent work
        const wikiSrcDir = path.join(extPath, 'agent-docs/comfyai/wiki');
        const wikiDestDir = path.join(comfyaiDir, 'wiki');

        // Copy all of comfyai/ EXCEPT wiki/ — that gets seeded separately below
        const agentDocsDir = path.join(extPath, 'agent-docs/comfyai');
        fs.mkdirSync(comfyaiDir, { recursive: true });
        for (const entry of fs.readdirSync(agentDocsDir, { withFileTypes: true })) {
            if (entry.name === 'wiki' || entry.name.startsWith('.')) { continue; }
            const srcPath = path.join(agentDocsDir, entry.name);
            const destPath = path.join(comfyaiDir, entry.name);
            if (entry.isDirectory()) {
                copyDirRecursive(srcPath, destPath, vars);
            } else if (TEXT_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) {
                let content = fs.readFileSync(srcPath, 'utf-8');
                for (const [key, value] of Object.entries(vars)) {
                    content = content.replaceAll(`{${key}}`, value);
                }
                fs.writeFileSync(destPath, content, 'utf-8');
            } else {
                fs.copyFileSync(srcPath, destPath);
            }
        }

        // Seed wiki/ base files — preserves existing wiki content (contributions, sessions, etc.)
        seedDirOnce(wikiSrcDir, wikiDestDir, vars);

        // Seed user/agent-editable config files from tools/hiddenswitch/config/ (once — never overwrite)
        const extConfigDir = path.join(comfyaiDir, '_extension', 'hiddenswitch', 'config');
        seedFileOnce(
            path.join(extPath, 'tools/hiddenswitch/config/model-includes.json'),
            path.join(extConfigDir, 'model-includes.json'),
            vars
        );
        seedFileOnce(
            path.join(extPath, 'tools/hiddenswitch/config/model-veto.json'),
            path.join(extConfigDir, 'model-veto.json'),
            vars
        );

        // Deploy top-level guide into the install dir (with substitutions)
        let guideContent = fs.readFileSync(path.join(extPath, 'COMFYUI_AGENT_GUIDE.md'), 'utf-8');
        for (const [key, value] of Object.entries(vars)) {
            guideContent = guideContent.replaceAll(`{${key}}`, value);
        }
        fs.writeFileSync(path.join(installDir, 'COMFYUI_AGENT_GUIDE.md'), guideContent, 'utf-8');
    } catch (e) {
        console.error('[ComfyUI] Failed to ensure agent guide files:', e);
    }
}

// ---------------------------------------------------------------------------
// Gitignore prompt
// ---------------------------------------------------------------------------

export function ensureGitignore(context: vscode.ExtensionContext) {
    if (!isAiEnabled()) { return; }
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) { return; }

    const rootPath = workspaceFolders[0].uri.fsPath;

    // Only act in git repositories
    if (!fs.existsSync(path.join(rootPath, '.git'))) { return; }

    // Don't ask again if the user dismissed before
    const suppressKey = 'comfyui.gitignorePromptDismissed';
    if (context.globalState.get<boolean>(suppressKey)) { return; }

    // comfyai/ lives inside the install dir, not the workspace root — nothing to add
    const agentFiles: string[] = [];

    const gitignorePath = path.join(rootPath, '.gitignore');
    const existing = fs.existsSync(gitignorePath) ? fs.readFileSync(gitignorePath, 'utf-8') : '';
    const missing = agentFiles.filter(f => !existing.includes(f));

    if (missing.length === 0) { return; }

    vscode.window.showInformationMessage(
        `ComfyUI: ${missing.length} agent runtime file(s) are not in .gitignore. Add them?`,
        'Add to .gitignore',
        'Dismiss'
    ).then(choice => {
        if (choice === 'Add to .gitignore') {
            const toAdd = '\n# ComfyUI agent runtime files\n' + missing.join('\n') + '\n';
            fs.appendFileSync(gitignorePath, toAdd, 'utf-8');
            vscode.window.showInformationMessage('ComfyUI: .gitignore updated.');
        } else {
            context.globalState.update(suppressKey, true);
        }
    });
}
