import * as assert from 'assert';
import * as vscode from 'vscode';

const EXTENSION_ID = 'scruffynerf.vscode-comfyui';

const EXPECTED_COMMANDS = [
    'comfyui.openEditor',
    'comfyui.reloadEditor',
    'comfyui.restartServer',
    'comfyui.installComfyUI',
    'comfyui.installDevelopmentComfyUI',
    'comfyui.runHiddenswitch',
];

suite('Extension Test Suite', () => {

    suiteSetup(async () => {
        const ext = vscode.extensions.getExtension(EXTENSION_ID);
        assert.ok(ext, `Extension "${EXTENSION_ID}" not found`);
        if (!ext.isActive) {
            await ext.activate();
        }
    });

    test('all commands are registered', async () => {
        const allCommands = await vscode.commands.getCommands(true);
        for (const cmd of EXPECTED_COMMANDS) {
            assert.ok(
                allCommands.includes(cmd),
                `Command "${cmd}" was not registered`
            );
        }
    });
});
