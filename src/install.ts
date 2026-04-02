import * as fs from 'fs';
import * as path from 'path';

// ---------------------------------------------------------------------------
// Integration node installer
// ---------------------------------------------------------------------------

/**
 * Writes the VSCode bridge custom node into the ComfyUI install dir.
 * Handles both pip-installed (flat) and git-cloned (ComfyUI/ subdir) layouts.
 */
export function installIntegrationNode(installDir: string) {
    const nodeDir = path.join(installDir, 'ComfyUI', 'custom_nodes', 'vscode-comfyui-integration');
    const baseNodeDir = path.join(installDir, 'custom_nodes', 'vscode-comfyui-integration');
    const targetDir = fs.existsSync(path.join(installDir, 'ComfyUI')) ? nodeDir : baseNodeDir;

    fs.mkdirSync(path.join(targetDir, 'js'), { recursive: true });

    const initPy = `WEB_DIRECTORY = "./js"\nNODE_CLASS_MAPPINGS = {}\n__all__ = ["WEB_DIRECTORY", "NODE_CLASS_MAPPINGS"]`;
    const bridgeJs = `import { app } from "../../scripts/app.js";

app.registerExtension({
    name: "vscode.integration",
    async setup() {
        console.log("[VSCode Bridge] Initializing two-way integration...");

        window.addEventListener("message", async (event) => {
            if (event.data && event.data.command === "updateComfyState") {
                if (event.data.workflowData) {
                    try {
                        await app.loadGraphData(event.data.workflowData);
                    } catch (err) {
                        console.error("[VSCode Bridge] Error loading:", err);
                    }
                }
            }
        });

        let lastSerialized = "";
        const broadcastState = () => {
            if (app.graph) {
                try {
                    const workflowData = app.graph.serialize();
                    if (workflowData.nodes) workflowData.nodes.sort((a, b) => Number(a.id) - Number(b.id));
                    if (workflowData.links) {
                        workflowData.links.sort((a, b) => {
                            const idA = Array.isArray(a) ? a[0] : a.id;
                            const idB = Array.isArray(b) ? b[0] : b.id;
                            return Number(idA) - Number(idB);
                        });
                    }
                    const currentStr = JSON.stringify(workflowData);
                    if (currentStr !== lastSerialized) {
                        lastSerialized = currentStr;
                        window.parent.postMessage({ command: "comfyStateUpdate", workflowData }, "*");
                    }
                } catch (e) { }
            }
        };

        const debouncedBroadcast = () => setTimeout(broadcastState, 100);

        const hookGraphEvents = () => {
            if (!app.graph) return;
            window.addEventListener('pointerup', debouncedBroadcast);
            window.addEventListener('keyup', debouncedBroadcast);
            setInterval(broadcastState, 2000);
        };

        setTimeout(() => { hookGraphEvents(); broadcastState(); }, 1000);
    }
});`;

    fs.writeFileSync(path.join(targetDir, '__init__.py'), initPy, 'utf-8');
    fs.writeFileSync(path.join(targetDir, 'js', 'vscode_bridge.js'), bridgeJs, 'utf-8');
}

// ---------------------------------------------------------------------------
// Server readiness polling
// ---------------------------------------------------------------------------

/**
 * Polls `url` until it responds or the timeout elapses.
 * Returns true if the server became responsive, false on timeout.
 */
export async function waitForServer(url: string, interval = 1000, timeout?: number): Promise<boolean> {
    const effectiveTimeout = timeout ?? 60000;
    const startTime = Date.now();
    while (Date.now() - startTime < effectiveTimeout) {
        try {
            const response = await fetch(url, { method: 'HEAD' });
            if (response.ok || response.status < 500) {
                return true;
            }
        } catch (e) {
            // Server not up yet — keep polling
        }
        await new Promise(resolve => setTimeout(resolve, interval));
    }
    return false;
}
