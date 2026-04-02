import * as vscode from 'vscode';

let _bar: vscode.StatusBarItem;

export function createStatusBar(): vscode.StatusBarItem {
    _bar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    _bar.text = '$(symbol-misc) ComfyUI';
    _bar.tooltip = 'ComfyUI extension active';
    _bar.command = 'comfyui.openReloadEditor';
    _bar.show();
    return _bar;
}

export function setStatus(text: string, tooltip?: string) {
    if (!_bar) { return; }
    _bar.text = text;
    _bar.tooltip = tooltip ?? 'ComfyUI extension active';
}

export function resetStatus() {
    setStatus('$(symbol-misc) ComfyUI', 'ComfyUI extension active');
}
