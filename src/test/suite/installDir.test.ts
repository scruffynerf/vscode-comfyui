import * as assert from 'assert';
import * as path from 'path';
import { resolveInstallDir } from '../../installDir';

suite('resolveInstallDir', () => {

    test('absolute path is returned as-is', () => {
        const abs = '/some/absolute/path';
        assert.strictEqual(resolveInstallDir(abs, '/workspace', '/home/user'), abs);
    });

    test('relative path is joined with workspaceRoot when available', () => {
        const result = resolveInstallDir('comfyui-workspace', '/my/workspace', '/home/user');
        assert.strictEqual(result, path.join('/my/workspace', 'comfyui-workspace'));
    });

    test('relative path falls back to homeDir when workspaceRoot is undefined', () => {
        const result = resolveInstallDir('comfyui-workspace', undefined, '/home/user');
        assert.strictEqual(result, path.join('/home/user', 'comfyui-workspace'));
    });

    test('relative path falls back to "." when both workspaceRoot and homeDir are undefined', () => {
        const result = resolveInstallDir('comfyui-workspace', undefined, undefined);
        assert.strictEqual(result, path.join('.', 'comfyui-workspace'));
    });
});
