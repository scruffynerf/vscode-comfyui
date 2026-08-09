import * as fs from 'fs';
import * as path from 'path';

// ---------------------------------------------------------------------------
// Integration node installer
// ---------------------------------------------------------------------------

/**
 * Writes the VSCode bridge custom node into a ComfyUI custom_nodes directory.
 * The targetCustomNodesDir should be the custom_nodes folder directly
 * (e.g. /path/to/ComfyUI/custom_nodes). The node will be written as a
 * vscode-comfyui-integration/ subfolder inside it.
 */
export function installIntegrationNodeTo(targetCustomNodesDir: string, comfyaiDir: string = '') {
    const targetDir = path.join(targetCustomNodesDir, 'vscode-comfyui-integration');
    _writeIntegrationNode(targetDir, comfyaiDir);
}

/**
 * Writes the VSCode bridge custom node into the managed ComfyUI install dir.
 * Handles both pip-installed (flat) and git-cloned (ComfyUI/ subdir) layouts.
 */
export function installIntegrationNode(installDir: string) {
    const nodeDir = path.join(installDir, 'ComfyUI', 'custom_nodes', 'vscode-comfyui-integration');
    const baseNodeDir = path.join(installDir, 'custom_nodes', 'vscode-comfyui-integration');
    const targetDir = fs.existsSync(path.join(installDir, 'ComfyUI')) ? nodeDir : baseNodeDir;

    // Use forward slashes so the path is valid on all platforms inside the Python string
    const comfyaiDir = path.join(installDir, 'comfyai').replace(/\\/g, '/');
    _writeIntegrationNode(targetDir, comfyaiDir);
}

function _writeIntegrationNode(targetDir: string, comfyaiDir: string) {
    fs.mkdirSync(path.join(targetDir, 'js'), { recursive: true });

    // Use forward slashes so the path is valid on all platforms inside the Python string
    const safeComfyaiDir = comfyaiDir.replace(/\\/g, '/');

    const initPy = `import json
import logging
import os

WEB_DIRECTORY = "./js"
NODE_CLASS_MAPPINGS = {}
__all__ = ["WEB_DIRECTORY", "NODE_CLASS_MAPPINGS"]

_logger = logging.getLogger(__name__)
_COMFYAI_DIR = ${JSON.stringify(safeComfyaiDir)}


def _load_json(filename):
    if not _COMFYAI_DIR:
        return None
    filepath = os.path.join(_COMFYAI_DIR, filename)
    try:
        with open(filepath, encoding="utf-8") as f:
            return json.load(f)
    except FileNotFoundError:
        return None
    except Exception as exc:
        _logger.warning("[vscode-comfyui] Failed to load %s: %s", filename, exc)
        return None


def _apply_model_curation():
    try:
        from comfy.model_downloader import _known_models_db, add_known_models
        from comfy.model_downloader_types import HuggingFile, CivitFile
    except ImportError:
        return

    veto = _load_json("_extension/hiddenswitch/config/model-veto.json")
    if veto:
        veto_set = set(veto.get("filenames", []))
        if veto_set:
            for db in _known_models_db:
                before = len(db.data)
                db.data[:] = [m for m in db.data if str(m) not in veto_set]
                removed = before - len(db.data)
                if removed:
                    _logger.info("[vscode-comfyui] Removed %d vetoed model(s) from %s", removed, getattr(db, "folder_names", "?"))

    includes = _load_json("_extension/hiddenswitch/config/model-includes.json")
    if includes:
        for folder, entries in includes.items():
            if not isinstance(entries, list):
                continue
            for entry in entries:
                try:
                    source = entry.get("source", "hf")
                    if source == "hf":
                        model = HuggingFile(
                            entry["repo_id"],
                            entry["filename"],
                            save_with_filename=entry.get("save_with_filename"),
                        )
                    elif source == "civitai":
                        model = CivitFile(
                            model_id=entry["model_id"],
                            model_version_id=entry["model_version_id"],
                            filename=entry["filename"],
                        )
                    else:
                        _logger.warning("[vscode-comfyui] Unknown source %r in model-includes.json", source)
                        continue
                    add_known_models(folder, model)
                except (KeyError, TypeError) as exc:
                    _logger.warning("[vscode-comfyui] Skipping bad entry in model-includes.json: %s", exc)


_apply_model_curation()
`;
    const bridgeJs = `import { app } from "../../scripts/app.js";

app.registerExtension({
    name: "vscode.integration",
    async setup() {
        console.log("[VSCode Bridge] Initializing two-way integration...");

        // ------------------------------------------------------------------
        // Graph traversal
        //
        // Since the subgraph rework, node IDs live in per-graph ID spaces: the
        // root graph plus one graph per subgraph *definition*. LGraph.subgraphs
        // is a Map<uuid, Subgraph> that always resolves to the root graph's, so
        // [rootGraph, ...rootGraph.subgraphs.values()] is the full set — this is
        // the same pattern litegraph itself uses internally.
        //
        // getNodeById() only searches the graph it is called on, which is why a
        // patch aimed at a node inside a subgraph used to silently do nothing.
        // ------------------------------------------------------------------
        const rootGraph = () => (app.graph && app.graph.rootGraph) || app.graph;

        const allGraphs = () => {
            const root = rootGraph();
            if (!root) { return []; }
            const graphs = [root];
            const subs = root.subgraphs;
            if (subs && typeof subs.values === "function") {
                for (const sg of subs.values()) {
                    if (sg && sg !== root) { graphs.push(sg); }
                }
            }
            return graphs;
        };

        const graphLabel = (g) => {
            if (g === rootGraph()) { return "root"; }
            return g.name || (g.id != null ? String(g.id) : "subgraph");
        };

        // A patch node may carry \`subgraph\`: the subgraph's name or uuid, or the
        // literal "root". Without it we search everywhere and require exactly one
        // hit — ambiguity is reported rather than guessed at, because IDs are only
        // unique within a graph.
        const inScope = (g, scope) => {
            if (scope == null) { return true; }
            const s = String(scope);
            if (g === rootGraph()) { return s === "root"; }
            return String(g.id) === s || String(g.name) === s;
        };

        const findNodes = (id, scope) => {
            const matches = [];
            for (const g of allGraphs()) {
                if (!inScope(g, scope)) { continue; }
                let n = null;
                try {
                    if (typeof g.getNodeById === "function") { n = g.getNodeById(id); }
                } catch (e) { n = null; }
                if (!n && Array.isArray(g.nodes)) {
                    n = g.nodes.find((x) => String(x.id) === String(id)) || null;
                }
                if (n) { matches.push({ node: n, graph: g }); }
            }
            return matches;
        };

        // Resolve to exactly one node, or explain why not. Every failure here is
        // reported back — a patch that cannot be located must never look applied.
        const resolveNode = (id, scope, report) => {
            const matches = findNodes(id, scope);
            if (matches.length === 1) { return matches[0]; }
            if (matches.length === 0) {
                const where = scope == null
                    ? \`the root graph or any of \${allGraphs().length - 1} subgraph(s)\`
                    : (String(scope) === "root" ? "the root graph" : \`subgraph "\${scope}"\`);
                report.errors.push(\`node \${id}: not found in \${where}\`);
            } else {
                const where = matches.map((m) => graphLabel(m.graph)).join(", ");
                report.errors.push(
                    \`node \${id}: ambiguous — exists in \${matches.length} graphs (\${where}); \` +
                    \`add "subgraph" to the patch node to disambiguate\`
                );
            }
            return null;
        };

        // ------------------------------------------------------------------
        // Patch application
        // ------------------------------------------------------------------
        const applyPatch = (patch) => {
            const report = { ts: Date.now(), applied: [], errors: [] };
            if (!patch || typeof patch !== "object") {
                report.errors.push("patch was empty or not an object");
                return report;
            }

            // Removals first — LiteGraph remove() disconnects attached links for us,
            // so a patch can delete-and-replace in one step.
            if (Array.isArray(patch.remove_nodes)) {
                for (const entry of patch.remove_nodes) {
                    const id = (entry && typeof entry === "object") ? entry.id : entry;
                    const scope = (entry && typeof entry === "object") ? entry.subgraph : undefined;
                    const found = resolveNode(id, scope, report);
                    if (!found) { continue; }
                    try {
                        found.graph.remove(found.node);
                        report.applied.push({ id, graph: graphLabel(found.graph), changed: ["removed"] });
                    } catch (err) {
                        report.errors.push(\`node \${id}: remove failed — \${err && err.message}\`);
                    }
                }
            }

            if (Array.isArray(patch.remove_links)) {
                for (const id of patch.remove_links) {
                    let removed = false;
                    for (const g of allGraphs()) {
                        try {
                            if (g.links && typeof g.links.get === "function" ? g.links.get(id) : (g.links || {})[id]) {
                                g.removeLink(id);
                                removed = true;
                                report.applied.push({ link: id, graph: graphLabel(g), changed: ["removed"] });
                                break;
                            }
                        } catch (e) { /* try the next graph */ }
                    }
                    if (!removed) { report.errors.push(\`link \${id}: not found in any graph\`); }
                }
            }

            // Update or add nodes
            if (Array.isArray(patch.nodes)) {
                for (const pNode of patch.nodes) {
                    const id = pNode.id;
                    let found = findNodes(id, pNode.subgraph);

                    if (found.length > 1) {
                        resolveNode(id, pNode.subgraph, report);   // records the ambiguity
                        continue;
                    }

                    let node = found.length === 1 ? found[0].node : null;
                    let graph = found.length === 1 ? found[0].graph : null;

                    if (!node) {
                        if (!pNode.type) {
                            resolveNode(id, pNode.subgraph, report);   // records "not found"
                            continue;
                        }
                        // New node — created in the scoped graph, or the root by default.
                        graph = rootGraph();
                        if (pNode.subgraph != null) {
                            const target = allGraphs().find((g) => inScope(g, pNode.subgraph));
                            if (!target) {
                                report.errors.push(\`node \${id}: subgraph "\${pNode.subgraph}" not found\`);
                                continue;
                            }
                            graph = target;
                        }
                        try {
                            node = LiteGraph.createNode(pNode.type);
                        } catch (err) {
                            node = null;
                        }
                        if (!node) {
                            report.errors.push(\`node \${id}: unknown node type "\${pNode.type}"\`);
                            continue;
                        }
                        node.id = pNode.id;
                        graph.add(node);
                        // Keep the graph's ID counter ahead of what we just inserted,
                        // otherwise the next user-added node reuses this ID.
                        if (typeof graph.last_node_id === "number" && Number(pNode.id) > graph.last_node_id) {
                            graph.last_node_id = Number(pNode.id);
                        }
                    }

                    const changed = [];
                    if (pNode.pos !== undefined) { node.pos[0] = pNode.pos[0]; node.pos[1] = pNode.pos[1]; changed.push("pos"); }
                    if (pNode.size !== undefined) { node.size[0] = pNode.size[0]; node.size[1] = pNode.size[1]; changed.push("size"); }
                    if (pNode.color !== undefined) { node.color = pNode.color; changed.push("color"); }
                    if (pNode.bgcolor !== undefined) { node.bgcolor = pNode.bgcolor; changed.push("bgcolor"); }
                    if (pNode.title !== undefined) { node.title = pNode.title; changed.push("title"); }

                    if (pNode.widgets_values !== undefined) {
                        if (!node.widgets || node.widgets.length === 0) {
                            report.errors.push(\`node \${id}: patch sets widgets_values but the node has no widgets\`);
                        } else {
                            // Index by widget position, which is what serialize() writes
                            // out — so a patch expressed against workflow-state.readonly.json
                            // lines up with what the canvas reports back.
                            const n = Math.min(pNode.widgets_values.length, node.widgets.length);
                            if (pNode.widgets_values.length > node.widgets.length) {
                                report.errors.push(
                                    \`node \${id}: patch has \${pNode.widgets_values.length} widget value(s) \` +
                                    \`but the node has \${node.widgets.length} — extra values ignored\`
                                );
                            }
                            for (let i = 0; i < n; i++) { node.widgets[i].value = pNode.widgets_values[i]; }
                            changed.push(\`widgets_values[0..\${n - 1}]\`);
                        }
                    }

                    if (changed.length > 0) {
                        report.applied.push({ id, graph: graphLabel(graph), changed });
                    } else {
                        report.errors.push(\`node \${id}: patch entry contained nothing to change\`);
                    }
                }
            }

            // Links: [link_id, src_node_id, src_slot, dst_node_id, dst_slot, dtype]
            // connect() takes a node *object* in this frontend, not an ID.
            if (Array.isArray(patch.links)) {
                for (const link of patch.links) {
                    const [, srcNodeId, srcSlot, dstNodeId, dstSlot] = link;
                    const scope = (link.length > 6 && link[6]) ? link[6] : undefined;
                    const src = resolveNode(srcNodeId, scope, report);
                    const dst = resolveNode(dstNodeId, scope, report);
                    if (!src || !dst) { continue; }
                    if (src.graph !== dst.graph) {
                        report.errors.push(
                            \`link \${srcNodeId}->\${dstNodeId}: endpoints live in different graphs \` +
                            \`(\${graphLabel(src.graph)} vs \${graphLabel(dst.graph)}) — cannot connect across a subgraph boundary\`
                        );
                        continue;
                    }
                    try {
                        const made = src.node.connect(srcSlot, dst.node, dstSlot);
                        if (made) {
                            report.applied.push({ link: \`\${srcNodeId}:\${srcSlot}->\${dstNodeId}:\${dstSlot}\`, graph: graphLabel(src.graph), changed: ["connected"] });
                        } else {
                            report.errors.push(\`link \${srcNodeId}:\${srcSlot}->\${dstNodeId}:\${dstSlot}: connect() refused (slot type mismatch or bad slot index)\`);
                        }
                    } catch (err) {
                        report.errors.push(\`link \${srcNodeId}->\${dstNodeId}: \${err && err.message}\`);
                    }
                }
            }

            return report;
        };

        // ------------------------------------------------------------------
        // Message handling
        // ------------------------------------------------------------------
        let lastPatchReport = null;

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
                // Patch mode — in-place edits via the LiteGraph API, avoiding
                // loadGraphData() (which always opens a new tab).
                let report;
                try {
                    report = applyPatch(event.data.patch);
                } catch (err) {
                    report = { ts: Date.now(), applied: [], errors: [\`bridge threw: \${err && err.message}\`] };
                }
                lastPatchReport = report;

                if (report.errors.length > 0) {
                    console.warn("[VSCode Bridge] applyPatch completed with errors:", report.errors);
                } else {
                    console.log("[VSCode Bridge] applyPatch applied:", report.applied);
                }

                app.graph.setDirtyCanvas(true, true);
                // Acknowledge the specific request. Without this the extension writes
                // an optimistic "ok" that is indistinguishable from a patch that never
                // arrived at all — which is exactly what happens after a panel reload.
                window.parent.postMessage({
                    command: "applyPatchResult",
                    requestId: event.data.requestId,
                    report,
                }, "*");
                // Push the result out immediately rather than waiting for the poll,
                // so the state file carries the report for this patch.
                broadcastState();
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
                    // The outcome of the last patch rides along with the state so it
                    // lands in workflow-state.readonly.json. The extension writes an
                    // optimistic "ok" to apply-response.json without hearing back from
                    // the canvas; this is the only channel that reports what the graph
                    // actually did, per node.
                    if (lastPatchReport) { workflowData._vscode_patch = lastPatchReport; }

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

        // Announce liveness as soon as the bridge is running. The extension cannot
        // otherwise distinguish "panel object exists" from "canvas is reachable",
        // and a state broadcast only fires when the graph actually changes — an idle
        // canvas would look identical to a dead bridge.
        const announceReady = () => {
            window.parent.postMessage({ command: "bridgeReady", ts: Date.now() }, "*");
        };
        announceReady();
        // Re-announce for a short window, in case the extension host attached its
        // listener slightly after the iframe finished loading.
        let announcements = 0;
        const readyTimer = setInterval(() => {
            announceReady();
            if (++announcements >= 10) { clearInterval(readyTimer); }
        }, 1000);

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
