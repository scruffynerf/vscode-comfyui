import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { getInstallDir } from './config';

// ---------------------------------------------------------------------------
// Contribution metadata parsing
// ---------------------------------------------------------------------------

interface ContributionMeta {
    target: string;
    type: 'new-file' | 'edit' | 'new-knowledge-file';
    description: string;
    confidence: 'high' | 'medium' | 'low';
    tested: 'yes' | 'partial' | 'no';
    source: string;
    author: 'agent' | 'user' | 'external';
}

function parseContributionHeader(content: string): ContributionMeta | null {
    const match = content.match(/<!-- contribution\n([\s\S]*?)-->/);
    if (!match) { return null; }

    const fields: Record<string, string> = {};
    for (const line of match[1].split('\n')) {
        const [key, ...valueParts] = line.split(':');
        if (key && valueParts.length > 0) {
            fields[key.trim()] = valueParts.join(':').trim();
        }
    }

    return {
        target: fields['target'] || '',
        type: (fields['type'] as ContributionMeta['type']) || 'edit',
        description: fields['description'] || '',
        confidence: (fields['confidence'] as ContributionMeta['confidence']) || 'medium',
        tested: (fields['tested'] as ContributionMeta['tested']) || 'no',
        source: fields['source'] || '',
        author: (fields['author'] as ContributionMeta['author']) || 'agent',
    };
}

function extractContributionContent(content: string): string {
    const match = content.match(/<!-- contribution\n[\s\S]*?-->\n([\s\S]*)$/);
    return match ? match[1].trim() : content;
}

interface ContributionFile {
    filename: string;
    path: string;
    meta: ContributionMeta | null;
    content: string;
    proposedContent: string;
}

function readContribution(dir: string, filename: string): ContributionFile {
    const filePath = path.join(dir, filename);
    const content = fs.readFileSync(filePath, 'utf-8');
    const meta = parseContributionHeader(content);
    const proposedContent = extractContributionContent(content);
    return { filename, path: filePath, meta, content, proposedContent };
}

function listContributions(comfyaiDir: string): ContributionFile[] {
    const contributionsDir = path.join(comfyaiDir, 'wiki', 'contributions');
    if (!fs.existsSync(contributionsDir)) { return []; }

    const files = fs.readdirSync(contributionsDir)
        .filter(f => f.endsWith('.md') && !f.startsWith('.'))
        .map(f => readContribution(contributionsDir, f));

    return files.sort((a, b) => {
        const aTime = fs.statSync(a.path).mtimeMs;
        const bTime = fs.statSync(b.path).mtimeMs;
        return bTime - aTime;
    });
}

// ---------------------------------------------------------------------------
// GitHub URL builders
// ---------------------------------------------------------------------------

const GITHUB_REPO = 'anomalyco/vscode-comfyui';

function buildGitHubCompareUrl(contribution: ContributionFile): string {
    const meta = contribution.meta;
    const description = meta?.description || contribution.filename.replace('.md', '');

    const params = new URLSearchParams({
        title: `[knowledge] ${description}`,
        body: formatContributionForGitHub(contribution),
        labels: 'documentation,knowledge-base',
    });

    return `https://github.com/${GITHUB_REPO}/issues/new?${params.toString()}`;
}

function formatContributionForGitHub(contribution: ContributionFile): string {
    const meta = contribution.meta;
    const content = contribution.proposedContent;

    const lines: string[] = [];

    if (meta) {
        lines.push('## Contribution Metadata');
        lines.push('');
        lines.push('| Field | Value |');
        lines.push('|---|---|');
        lines.push(`| Target | \`${meta.target}\` |`);
        lines.push(`| Type | ${meta.type} |`);
        lines.push(`| Confidence | ${meta.confidence} |`);
        lines.push(`| Tested | ${meta.tested} |`);
        lines.push(`| Source | ${meta.source} |`);
        lines.push(`| Author | ${meta.author} |`);
        lines.push('');
    }

    lines.push('## Proposed Content');
    lines.push('');
    lines.push('```markdown');
    lines.push(content);
    lines.push('```');
    lines.push('');
    lines.push('---');
    lines.push('_Submitted via vscode-comfyui agent wiki contribution system_');

    return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Command: List contributions
// ---------------------------------------------------------------------------

async function listPendingContributions(): Promise<void> {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
        vscode.window.showInformationMessage('No workspace folder open.');
        return;
    }

    const rootPath = workspaceFolders[0].uri.fsPath;
    const installDir = getInstallDir(rootPath);
    const comfyaiDir = path.join(installDir, 'comfyai');
    const contributionsDir = path.join(comfyaiDir, 'wiki', 'contributions');

    if (!fs.existsSync(contributionsDir)) {
        fs.mkdirSync(contributionsDir, { recursive: true });
        vscode.window.showInformationMessage('Created wiki/contributions/ directory.');
        return;
    }

    const contributions = listContributions(comfyaiDir);

    if (contributions.length === 0) {
        vscode.window.showInformationMessage('No pending contributions in wiki/contributions/.');
        return;
    }

    const items: vscode.QuickPickItem[] = contributions.map(c => {
        const meta = c.meta;
        const label = meta?.description || c.filename.replace('.md', '');
        const confidence = meta?.confidence || '?';
        const confidenceIcon = confidence === 'high' ? '$(pass)' : confidence === 'medium' ? '$(pass-filled)' : '$(warning)';
        const testedIcon = (meta?.tested === 'yes') ? '$(pass)' : (meta?.tested === 'partial') ? '$(pass-filled)' : '$(circle-slash)';
        return {
            label: `${confidenceIcon} ${label}`,
            description: `$(file) ${c.filename} · tested: ${testedIcon} · target: ${meta?.target || '?'}`,
            detail: `Type: ${meta?.type || '?'} · Confidence: ${confidence}`,
        };
    });

    const selected = await vscode.window.showQuickPick(items, {
        placeHolder: `${contributions.length} pending contribution(s)`,
        canPickMany: false,
    });

    if (selected) {
        const index = items.indexOf(selected);
        const contribution = contributions[index];
        const doc = await vscode.workspace.openTextDocument(contribution.path);
        vscode.window.showTextDocument(doc, { preview: false });
    }
}

// ---------------------------------------------------------------------------
// Command: Submit contributions
// ---------------------------------------------------------------------------

async function submitContributions(): Promise<void> {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
        vscode.window.showInformationMessage('No workspace folder open.');
        return;
    }

    const rootPath = workspaceFolders[0].uri.fsPath;
    const installDir = getInstallDir(rootPath);
    const comfyaiDir = path.join(installDir, 'comfyai');
    const contributions = listContributions(comfyaiDir);

    if (contributions.length === 0) {
        vscode.window.showInformationMessage('No pending contributions in wiki/contributions/.');
        return;
    }

    const items: vscode.QuickPickItem[] = contributions.map(c => {
        const meta = c.meta;
        return {
            label: meta?.description || c.filename.replace('.md', ''),
            description: `${c.filename} → ${meta?.target || '?'}`,
            picked: true,
        };
    });

    const selected = await vscode.window.showQuickPick(items, {
        placeHolder: 'Select contributions to submit (checked = will be submitted)',
        canPickMany: true,
    });

    if (!selected || selected.length === 0) { return; }

    const selectedFilenames = new Set(selected.map(s => s.label));
    const toSubmit = contributions.filter(c => {
        const label = c.meta?.description || c.filename.replace('.md', '');
        return selectedFilenames.has(label);
    });

    if (toSubmit.length === 0) { return; }

    const submitChoice = await vscode.window.showQuickPick(
        ['Submit as GitHub Issue (Recommended)', 'Open GitHub Issues page'],
        { placeHolder: 'How would you like to submit these contributions?' }
    );

    if (submitChoice === 'Submit as GitHub Issue (Recommended)') {
        for (const contribution of toSubmit) {
            const url = buildGitHubCompareUrl(contribution);
            await vscode.env.openExternal(vscode.Uri.parse(url));
        }
        vscode.window.showInformationMessage(
            `Opening ${toSubmit.length} GitHub issue(s) in your browser. Please review and submit each one.`
        );
    } else if (submitChoice === 'Open GitHub Issues page') {
        await vscode.env.openExternal(
            vscode.Uri.parse(`https://github.com/${GITHUB_REPO}/issues?q=is%3Aissue+is%3Aopen+label%3Adocumentation`)
        );
    }
}

// ---------------------------------------------------------------------------
// Command: View contribution diff/preview
// ---------------------------------------------------------------------------

async function viewContributionDiff(): Promise<void> {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) { return; }

    const rootPath = workspaceFolders[0].uri.fsPath;
    const installDir = getInstallDir(rootPath);
    const comfyaiDir = path.join(installDir, 'comfyai');
    const contributions = listContributions(comfyaiDir);

    if (contributions.length === 0) {
        vscode.window.showInformationMessage('No pending contributions.');
        return;
    }

    const items: vscode.QuickPickItem[] = contributions.map(c => ({
        label: c.meta?.description || c.filename.replace('.md', ''),
        description: `${c.meta?.type || '?'} · ${c.meta?.target || '?'}`,
    }));

    const selected = await vscode.window.showQuickPick(items, {
        placeHolder: 'Select a contribution to preview',
    });

    if (!selected) { return; }

    const index = items.indexOf(selected);
    const contribution = contributions[index];
    const meta = contribution.meta;

    if (meta?.type === 'new-file' || meta?.type === 'new-knowledge-file') {
        const panel = vscode.window.createWebviewPanel(
            'contribution-preview',
            `Preview: ${meta.target}`,
            vscode.ViewColumn.Beside,
            {}
        );
        panel.webview.html = `
<!DOCTYPE html>
<html>
<head><style>
body { font-family: system-ui; padding: 20px; background: #1e1e1e; color: #d4d4d4; }
h1 { font-size: 16px; color: #569cd6; }
h2 { font-size: 14px; color: #4ec9b0; margin-top: 20px; }
.meta { background: #2d2d2d; padding: 10px; border-radius: 4px; margin: 10px 0; }
.meta-table { border-collapse: collapse; }
.meta-table td { padding: 4px 12px; }
.meta-table td:first-child { color: #9cdcfe; }
.content { background: #252526; padding: 15px; border-radius: 4px; white-space: pre-wrap; font-family: monospace; font-size: 13px; }
.file-path { color: #ce9178; background: #2d2d2d; padding: 4px 8px; border-radius: 4px; display: inline-block; margin: 5px 0; }
</style></head>
<body>
<h1>Proposed New File</h1>
<div class="file-path">${meta.target}</div>
<table class="meta">
<tr><td>Confidence</td><td>${meta.confidence}</td></tr>
<tr><td>Tested</td><td>${meta.tested}</td></tr>
<tr><td>Source</td><td>${meta.source}</td></tr>
</table>
<h2>Content</h2>
<div class="content">${escapeHtml(contribution.proposedContent)}</div>
</body>
</html>`;
    } else {
        const targetPath = path.join(comfyaiDir, meta?.target || '');
        const targetExists = fs.existsSync(targetPath);
        const targetContent = targetExists ? fs.readFileSync(targetPath, 'utf-8') : '(file does not exist yet)';

        const panel = vscode.window.createWebviewPanel(
            'contribution-diff',
            `Diff: ${meta?.target || 'unknown'}`,
            vscode.ViewColumn.Beside,
            {}
        );
        panel.webview.html = `
<!DOCTYPE html>
<html>
<head><style>
body { font-family: system-ui; padding: 20px; background: #1e1e1e; color: #d4d4d4; }
h1 { font-size: 16px; color: #569cd6; }
.file-path { color: #ce9178; background: #2d2d2d; padding: 4px 8px; border-radius: 4px; display: inline-block; margin: 5px 0; }
.section { margin: 15px 0; }
.label { font-size: 12px; color: #808080; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 5px; }
.content { background: #252526; padding: 15px; border-radius: 4px; white-space: pre-wrap; font-family: monospace; font-size: 13px; overflow-x: auto; }
.added { border-left: 3px solid #4ec9b0; }
.removed { opacity: 0.5; }
</style></head>
<body>
<h1>Proposed Edit</h1>
<div class="file-path">${meta?.target || 'unknown target'}</div>

<div class="section">
<div class="label">Current File</div>
<div class="content">${escapeHtml(targetContent)}</div>
</div>

<div class="section">
<div class="label">Proposed Changes</div>
<div class="content added">${escapeHtml(contribution.proposedContent)}</div>
</div>
</body>
</html>`;
    }
}

function escapeHtml(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// ---------------------------------------------------------------------------
// Command: Mark merged / discard
// ---------------------------------------------------------------------------

async function markContributionMerged(): Promise<void> {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) { return; }

    const rootPath = workspaceFolders[0].uri.fsPath;
    const installDir = getInstallDir(rootPath);
    const comfyaiDir = path.join(installDir, 'comfyai');
    const contributions = listContributions(comfyaiDir);

    if (contributions.length === 0) {
        vscode.window.showInformationMessage('No pending contributions.');
        return;
    }

    const items: vscode.QuickPickItem[] = contributions.map(c => ({
        label: c.meta?.description || c.filename.replace('.md', ''),
        description: c.filename,
    }));

    const selected = await vscode.window.showQuickPick(items, {
        placeHolder: 'Select a contribution to archive',
    });

    if (!selected) { return; }

    const index = items.indexOf(selected);
    const contribution = contributions[index];

    const archiveDir = path.join(comfyaiDir, 'wiki', '.archive');
    fs.mkdirSync(archiveDir, { recursive: true });

    const archivePath = path.join(archiveDir, contribution.filename);
    fs.renameSync(contribution.path, archivePath);

    vscode.window.showInformationMessage(`Archived: ${contribution.filename}`);
}

async function discardContribution(): Promise<void> {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) { return; }

    const rootPath = workspaceFolders[0].uri.fsPath;
    const installDir = getInstallDir(rootPath);
    const comfyaiDir = path.join(installDir, 'comfyai');
    const contributions = listContributions(comfyaiDir);

    if (contributions.length === 0) {
        vscode.window.showInformationMessage('No pending contributions.');
        return;
    }

    const items: vscode.QuickPickItem[] = contributions.map(c => ({
        label: c.meta?.description || c.filename.replace('.md', ''),
        description: c.filename,
    }));

    const selected = await vscode.window.showQuickPick(items, {
        placeHolder: 'Select a contribution to discard',
    });

    if (!selected) { return; }

    const index = items.indexOf(selected);
    const contribution = contributions[index];

    const confirm = await vscode.window.showWarningMessage(
        `Discard "${contribution.filename}"? This cannot be undone.`,
        'Discard',
        'Cancel'
    );

    if (confirm === 'Discard') {
        fs.unlinkSync(contribution.path);
        vscode.window.showInformationMessage(`Discarded: ${contribution.filename}`);
    }
}

// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------

export function registerContributionCommands(context: vscode.ExtensionContext): void {
    context.subscriptions.push(
        vscode.commands.registerCommand('comfyui.listContributions', listPendingContributions)
    );
    context.subscriptions.push(
        vscode.commands.registerCommand('comfyui.submitContributions', submitContributions)
    );
    context.subscriptions.push(
        vscode.commands.registerCommand('comfyui.viewContributionDiff', viewContributionDiff)
    );
    context.subscriptions.push(
        vscode.commands.registerCommand('comfyui.markContributionMerged', markContributionMerged)
    );
    context.subscriptions.push(
        vscode.commands.registerCommand('comfyui.discardContribution', discardContribution)
    );
}
