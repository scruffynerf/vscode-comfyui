import { app } from "../../scripts/app.js";

app.registerExtension({
    name: "vscode.integration",
    async setup() {
        console.log("[VSCode Bridge] Initializing two-way integration...");

        // Listen for messages from the VS Code Webview
        window.addEventListener("message", async (event) => {
            if (event.data && event.data.command === "updateComfyState") {
                console.log("[VSCode Bridge] Received state update from VSCode");
                if (event.data.workflowData) {
                    try {
                        await app.loadGraphData(event.data.workflowData);
                        console.log("[VSCode Bridge] Graph data successfully loaded from VSCode.");
                    } catch (err) {
                        console.error("[VSCode Bridge] Error loading graph data:", err);
                    }
                }
            }
        });

        let lastSerialized = "";
        const broadcastState = () => {
            if (app.graph) {
                try {
                    const workflowData = app.graph.serialize();
                    
                    // Sort nodes and links for stable JSON output
                    if (workflowData.nodes) {
                        workflowData.nodes.sort((a, b) => Number(a.id) - Number(b.id));
                    }
                    if (workflowData.links) {
                        workflowData.links.sort((a, b) => {
                            const idA = Array.isArray(a) ? a[0] : (a && a.id);
                            const idB = Array.isArray(b) ? b[0] : (b && b.id);
                            return Number(idA) - Number(idB);
                        });
                    }

                    const currentStr = JSON.stringify(workflowData);
                    // Only broadcast if the state has actually changed
                    if (currentStr !== lastSerialized) {
                        lastSerialized = currentStr;
                        // Post message out of the iframe up to the parent window (the VS Code Webview)
                        window.parent.postMessage({
                            command: "comfyStateUpdate",
                            workflowData,
                        }, "*");
                    }
                } catch (e) {
                    // Ignore transient serialization errors
                }
            }
        };

        const debouncedBroadcast = () => {
            // using a simple debounce fallback if we hook rapidly firing events
            setTimeout(broadcastState, 100);
        };

        // Hook core graph events once the graph is initialized
        const hookGraphEvents = () => {
            if (!app.graph) return;
            
            // Listen to standard pointer/keyboard interactions as a proxy for "user finished an action"
            window.addEventListener('pointerup', debouncedBroadcast);
            window.addEventListener('keyup', debouncedBroadcast);

            // Also poll every few seconds just to be absolutely sure we don't miss state,
            // (e.g. from executions modifying nodes) but since we do diff checks, it's very cheap.
            setInterval(broadcastState, 2000);
        };

        // Delay starting the hooks until app.graph is populated
        setTimeout(() => {
            hookGraphEvents();
            broadcastState(); // initial broadcast
        }, 1000);
    }
});
