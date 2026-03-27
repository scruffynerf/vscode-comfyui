import * as path from 'path';

/**
 * Resolves the ComfyUI install directory from a raw config value.
 *
 * - If `rawInstallDir` is an absolute path, it is returned as-is.
 * - Otherwise it is joined with `workspaceRoot`, falling back to
 *   `homeDir`, and then to `'.'` if neither is available.
 */
export function resolveInstallDir(
    rawInstallDir: string,
    workspaceRoot: string | undefined,
    homeDir: string | undefined
): string {
    if (path.isAbsolute(rawInstallDir)) {
        return rawInstallDir;
    }
    const base = workspaceRoot ?? homeDir ?? '.';
    return path.join(base, rawInstallDir);
}
