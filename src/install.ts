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
            const cmd = event.data && event.data.command;

            if (cmd === "updateComfyState") {
                // Full workflow replacement (sourcePath mode). loadGraphData is
                // intentional here — the user explicitly loaded a new workflow.
                if (event.data.workflowData) {
                    try {
                        await app.loadGraphData(event.data.workflowData);
                    } catch (err) {
                        console.error("[VSCode Bridge] Error loading workflow:", err);
                    }
                }
            }

            if (cmd === "applyPatch") {
                // Patch mode — apply changes directly via LiteGraph API to avoid
                // loadGraphData(), which always creates a new tab via beforeLoadNewGraph().
                const patch = event.data.patch;

                // Remove nodes first — LiteGraph remove() disconnects all connected links automatically
                if (patch && patch.remove_nodes && Array.isArray(patch.remove_nodes)) {
                    for (const id of patch.remove_nodes) {
                        const n = app.graph.getNodeById(id);
                        if (n) { app.graph.remove(n); }
                    }
                }

                // Remove specific links without removing their nodes
                if (patch && patch.remove_links && Array.isArray(patch.remove_links)) {
                    for (const id of patch.remove_links) {
                        app.graph.removeLink(id);
                    }
                }

                // Update or add nodes
                if (patch && patch.nodes && Array.isArray(patch.nodes)) {
                    for (const pNode of patch.nodes) {
                        let node = app.graph.getNodeById(pNode.id);

                        if (!node && pNode.type) {
                            // New node — create via LiteGraph and add to current graph
                            node = LiteGraph.createNode(pNode.type);
                            if (node) {
                                node.id = pNode.id;
                                app.graph.add(node);
                            }
                        }

                        if (node) {
                            if (pNode.pos !== undefined) { node.pos[0] = pNode.pos[0]; node.pos[1] = pNode.pos[1]; }
                            if (pNode.size !== undefined) { node.size[0] = pNode.size[0]; node.size[1] = pNode.size[1]; }
                            if (pNode.color !== undefined) { node.color = pNode.color; }
                            if (pNode.bgcolor !== undefined) { node.bgcolor = pNode.bgcolor; }
                            if (pNode.title !== undefined) { node.title = pNode.title; }
                            if (pNode.widgets_values !== undefined && node.widgets) {
                                for (let i = 0; i < Math.min(pNode.widgets_values.length, node.widgets.length); i++) {
                                    node.widgets[i].value = pNode.widgets_values[i];
                                }
                            }
                        }
                    }
                }

                // Add new links via LiteGraph connect()
                // Links are arrays: [link_id, src_node_id, src_slot, dst_node_id, dst_slot, dtype]
                if (patch && patch.links && Array.isArray(patch.links)) {
                    for (const link of patch.links) {
                        const [, srcNodeId, srcSlot, dstNodeId, dstSlot] = link;
                        const srcNode = app.graph.getNodeById(srcNodeId);
                        if (srcNode) {
                            srcNode.connect(srcSlot, dstNodeId, dstSlot);
                        } else {
                            console.warn("[VSCode Bridge] applyPatch: src node not found for link:", link);
                        }
                    }
                }

                app.graph.setDirtyCanvas(true, true);
            }

            if (cmd === "queueWorkflow") {
                try {
                    await app.queuePrompt(0, 1);
                } catch (err) {
                    console.error("[VSCode Bridge] Error queuing workflow:", err);
                }
            }

            if (cmd === "autoLayout") {
                if (app.graph && app.graph.arrange) {
                    app.graph.arrange();
                    app.graph.setDirtyCanvas(true, true);
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
