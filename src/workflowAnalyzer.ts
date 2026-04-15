/**
 * ComfyUI Workflow Analyzer
 * Sync version: 4
 *
 * Analyzes a ComfyUI workflow graph and produces a human/AI-readable summary.
 * Originally ported from referencecode/VibeComfy/cli_tools/{workflow,analysis,descriptions}.py
 *
 * KEEP IN SYNC WITH: tools/workflow_analyzer.py
 * Both files implement the same analysis and formatting logic. When adding features
 * or fixing bugs here, apply the equivalent change to the Python port, and increment
 * the sync version number in both files.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface WorkflowNode {
    id: number;
    type: string;
    title?: string;
    inputs?: Array<{ name: string; type: string; link?: number | null }>;
    outputs?: Array<{ name: string; type: string; links?: number[] }>;
    widgets_values?: any[] | Record<string, any>;
    pos?: [number, number];
}

// Link format: [link_id, src_node, src_slot, dst_node, dst_slot, type]
export type WorkflowLink = [number, number, number, number, number, string];

// Subgraph definitions (stored in wf.definitions.subgraphs).
// Each instance of a UUID-typed node in the outer workflow maps to one of these.
export interface SubgraphPort {
    id: string;
    name: string;
    type: string;
    label?: string;
    localized_name?: string;
}

export interface SubgraphDef {
    id: string;
    name: string;
    inputs: SubgraphPort[];
    outputs: SubgraphPort[];
    nodes: WorkflowNode[];
    links: WorkflowLink[];
}

export interface Workflow {
    nodes: WorkflowNode[];
    links: WorkflowLink[];
    last_node_id?: number;
    last_link_id?: number;
    groups?: any[];
    extra?: any;
    version?: number;
    definitions?: { subgraphs: SubgraphDef[] };
}

// UUID pattern — used to identify subgraph-typed nodes
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface NodeDict { [id: number]: WorkflowNode }
interface LinkDict { [id: number]: WorkflowLink }

// ---------------------------------------------------------------------------
// Functional operation class classifier
// Derived from type signatures — same rules as nodeCatalog.ts but operating on
// the inline input/output arrays present in the workflow JSON itself.
// ---------------------------------------------------------------------------

// The semantic types that define a node's functional role in a pipeline.
// Primitive types (INT, FLOAT, STRING, BOOLEAN) are parameters/settings, not pipeline data.
//
// KEEP IN SYNC WITH: src/nodeCatalog.ts (MAIN_TYPES) and
//                    tools/workflow_analyzer.py (MAIN_TYPES)
// All three use the same set and the same ten OperationClass values.
const MAIN_TYPES = new Set([
    'MODEL', 'VAE', 'CLIP', 'CLIP_VISION', 'CLIP_VISION_OUTPUT',
    'CONDITIONING', 'LATENT', 'IMAGE', 'MASK', 'VIDEO',
    'AUDIO', 'CONTROL_NET', 'STYLE_MODEL', 'GLIGEN',
    'UPSCALE_MODEL', 'SAMPLER', 'SIGMAS', 'NOISE', 'GUIDER',
]);

type OperationClass = 'source' | 'transform' | 'convert' | 'combine' | 'split' | 'sampler' | 'sink' | 'control' | 'variable' | 'misc';

const CLASS_LABEL: Record<OperationClass, string> = {
    source: 'Source', transform: 'Transform', convert: 'Convert',
    combine: 'Combine', split: 'Split', sampler: 'Sampler',
    sink: 'Sink', control: 'Control',
    variable: 'Variable',  // outputs only primitive/non-pipeline types (INT, FLOAT, STRING, etc.), or SetNode/GetNode
    misc: 'Misc',           // catch-all for edge cases the classifier can't categorize cleanly
};

function nodeMainInputTypes(node: WorkflowNode): string[] {
    return (node.inputs ?? []).map(i => i.type).filter(t => MAIN_TYPES.has(t));
}

function nodeMainOutputTypes(node: WorkflowNode): string[] {
    return (node.outputs ?? []).map(o => o.type).filter(t => MAIN_TYPES.has(t));
}

function classifyWorkflowNode(node: WorkflowNode): OperationClass {
    const inTypes = nodeMainInputTypes(node);
    const outTypes = nodeMainOutputTypes(node);
    const inSet = new Set(inTypes);
    const outSet = new Set(outTypes);

    // Sampler: core generative step — MODEL + CONDITIONING + LATENT → LATENT
    if (inSet.has('MODEL') && inSet.has('CONDITIONING') && inSet.has('LATENT') && outSet.has('LATENT')) {
        return 'sampler';
    }
    // Variable: SetNode/GetNode are variable storage/retrieval regardless of the type they carry
    if (node.type === 'SetNode' || node.type === 'GetNode') {
        return 'variable';
    }
    // Sink: no main-type outputs AND no connected outputs of any type.
    // Nodes that only output FLOAT/INT/STRING/etc. (not in MAIN_TYPES) are not true sinks
    // if those outputs are wired to something.
    if (outSet.size === 0) {
        const hasAnyLinkedOutput = (node.outputs ?? []).some(o => o.links && o.links.length > 0);
        if (!hasAnyLinkedOutput) {
            return 'sink';
        }
        // Has connected outputs of primitive/non-main types — fall through to variable/misc
    }
    // Control: loop/flow by name (type signatures alone aren't distinctive)
    if (/loop|forloop|whileloop/i.test(node.type)) {
        return 'control';
    }
    // Source: no main-type inputs, has main-type outputs
    if (inSet.size === 0) {
        if (outSet.size > 0) { return 'source'; }
        // Variable: no main-type inputs, outputs only primitive/non-main types wired to something
        if ((node.outputs ?? []).some(o => o.links && o.links.length > 0)) { return 'variable'; }
    }
    // Transform: same main types flow in and out (e.g. LoRA: MODEL+CLIP → MODEL+CLIP)
    if (inSet.size > 0 && outSet.size > 0 && outSet.size === inSet.size && [...outSet].every(t => inSet.has(t))) {
        return 'transform';
    }
    if (outSet.size >= 1) {
        const [outType] = outSet;
        // Combine: multiple inputs of the same main type → one output of that type
        if (outSet.size === 1 && inTypes.filter(t => t === outType).length >= 2) {
            return 'combine';
        }
        // Split: one input main type fans out to multiple outputs of the same type
        if (inSet.size === 1 && outTypes.length > 1 && [...outSet].every(t => inSet.has(t))) {
            return 'split';
        }
        // Convert: type-changing node
        return 'convert';
    }
    return 'misc';
}

// ---------------------------------------------------------------------------
// Utility helpers (from workflow.py)
// ---------------------------------------------------------------------------

function getNodesDict(wf: Workflow): NodeDict {
    const d: NodeDict = {};
    for (const n of wf.nodes) { d[n.id] = n; }
    return d;
}

function getLinksDict(wf: Workflow): LinkDict {
    const d: LinkDict = {};
    for (const l of wf.links) { d[l[0]] = l; }
    return d;
}

function buildSubgraphDict(wf: Workflow): Record<string, SubgraphDef> {
    const d: Record<string, SubgraphDef> = {};
    for (const sg of (wf.definitions?.subgraphs ?? [])) { d[sg.id] = sg; }
    return d;
}

function formatNode(nodeId: number, nodesDict: NodeDict, subgraphDict?: Record<string, SubgraphDef>): string {
    const node = nodesDict[nodeId];
    if (!node) { return `[${nodeId}] ?`; }
    let typeName = node.type;
    if (subgraphDict && UUID_RE.test(node.type)) {
        const sg = subgraphDict[node.type];
        if (sg) { typeName = `"${sg.name}"`; }
    }
    const title = node.title && node.title !== node.type ? ` "${node.title}"` : '';
    return `[${nodeId}] ${typeName}${title}`;
}

// ---------------------------------------------------------------------------
// Node descriptions + simple extractor rules — loaded from shared JSON
// Both this file and tools/workflow_analyzer.py load tools/node-data.json so
// the library only needs to be maintained in one place.
// ---------------------------------------------------------------------------

import * as fs from 'fs';
import * as path from 'path';

interface TypeGuard { idx: number; type?: string; nonEmpty?: boolean; notNull?: boolean }
interface ExtractorField {
    label: string; idx: number;
    quote?: boolean; json?: boolean; stringify?: boolean;
    truncate?: number; stripNewlines?: boolean;
}
interface ExtractorRule {
    matches: string[]; exact?: boolean; minLen?: number;
    typeGuards?: TypeGuard[]; fields: ExtractorField[];
    _comment?: string;
}
interface NodeData { nodeDescriptions: Record<string, string>; simpleExtractors: ExtractorRule[] }

// __dirname is <extensionRoot>/out at runtime; tools/ is one level up.
const _nodeData: NodeData = JSON.parse(
    fs.readFileSync(path.join(__dirname, '..', 'tools', 'node-data.json'), 'utf-8')
);
const NODE_DESCRIPTIONS = _nodeData.nodeDescriptions;
const EXTRACTORS: ExtractorRule[] = _nodeData.simpleExtractors;

function getNodeDescription(nodeType: string): string {
    const normalized = nodeType.toLowerCase().replace(/[^a-z0-9]/g, '');
    for (const [key, desc] of Object.entries(NODE_DESCRIPTIONS)) {
        if (key.includes(normalized) || normalized.includes(key)) {
            return desc;
        }
    }
    let words = nodeType
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .replace(/[_+|]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    for (const suffix of ['Node', 'Loader', 'Simple', 'Advanced', 'pysssss', 'rgthree']) {
        words = words.replace(new RegExp(`\\s*${suffix}\\s*$`, 'i'), '');
    }
    return words.toLowerCase() || nodeType;
}

function _renderField(f: ExtractorField, val: any): string {
    if (f.stringify) { val = String(val); }
    if (f.truncate !== undefined && typeof val === 'string' && val.length > f.truncate) {
        val = val.slice(0, f.truncate) + '…';
    }
    if (f.stripNewlines && typeof val === 'string') { val = val.replace(/\n/g, ' '); }
    if (f.json) { return `${f.label}: ${JSON.stringify(val)}`; }
    if (f.quote) { return `${f.label}: "${val}"`; }
    return `${f.label}: ${val}`;
}

function _checkGuard(g: TypeGuard, vals: any[]): boolean {
    if (g.idx >= vals.length) { return false; }
    const val = vals[g.idx];
    if (g.notNull && (val === null || val === undefined)) { return false; }
    if (g.type === 'string' && typeof val !== 'string') { return false; }
    if (g.type === 'number' && typeof val !== 'number') { return false; }
    if (g.nonEmpty && typeof val === 'string' && !val.trim()) { return false; }
    return true;
}

function applyExtractors(normalizedType: string, vals: any[]): string | null {
    for (const rule of EXTRACTORS) {
        const m = rule.matches;
        if (rule.exact ? !m.includes(normalizedType) : !m.some(s => normalizedType.includes(s))) { continue; }
        if (vals.length < (rule.minLen ?? 0)) { continue; }
        if (!(rule.typeGuards ?? []).every(g => _checkGuard(g, vals))) { continue; }
        const parts = rule.fields.filter(f => f.idx < vals.length).map(f => _renderField(f, vals[f.idx]));
        if (parts.length > 0) { return parts.join(', '); }
    }
    return null;
}

// ---------------------------------------------------------------------------
// Analysis (from analysis.py)
// ---------------------------------------------------------------------------

const VISUAL_TYPES = new Set(['Note', 'MarkdownNote', 'Label (rgthree)', 'PrimitiveNode']);

function isVisualOnly(node: WorkflowNode): boolean {
    return VISUAL_TYPES.has(node.type) || node.type.toLowerCase().includes('label');
}

interface AnalysisResult {
    nodeCount: number;
    linkCount: number;
    lastNodeId: number;
    lastLinkId: number;
    workflowType: string;
    typeCounts: Record<string, number>;
    nodeClasses: Record<number, OperationClass>;  // node id → class
    entryPoints: number[];
    exitPoints: number[];
    sources: Array<{ nodeId: number; provides: string[] }>;   // replaces primaryInputs + modelLoaders
    primaryOutputs: number[];
    mainPipeline: Array<[number, string]>;
    variables: Array<{
        name: string;
        setId: number;
        sourceId: number | null;
        sourceType: string | null;
        getIds: number[];
        consumers: Array<{ nodeId: number; nodeType: string; inputSlot: number }>;
    }>;
    loops: Array<{
        name: string;
        startId: number;
        startType: string;
        endId?: number;
        endType?: string;
        iterations?: number;
    }>;
    sections: Array<{ title: string; nodeId: number }>;
}

export function analyzeWorkflow(wf: Workflow): AnalysisResult {
    const nodesDict = getNodesDict(wf);
    const linksDict = getLinksDict(wf);

    // Basic counts
    const typeCounts: Record<string, number> = {};
    for (const n of wf.nodes) {
        typeCounts[n.type] = (typeCounts[n.type] ?? 0) + 1;
    }

    // Compute last IDs
    let lastNodeId = wf.last_node_id ?? 0;
    let lastLinkId = wf.last_link_id ?? 0;
    for (const n of wf.nodes) { if (n.id > lastNodeId) { lastNodeId = n.id; } }
    for (const l of wf.links) { if (l[0] > lastLinkId) { lastLinkId = l[0]; } }

    // Workflow type — scan outer nodes and subgraph internals (up to 3 levels deep)
    const subgraphDict = buildSubgraphDict(wf);
    function collectNodeTypes(nodes: WorkflowNode[], depth: number): string {
        let types = nodes.map(n => n.type.toLowerCase()).join(' ');
        if (depth < 3) {
            for (const n of nodes) {
                if (UUID_RE.test(n.type) && subgraphDict[n.type]) {
                    types += ' ' + collectNodeTypes(subgraphDict[n.type].nodes, depth + 1);
                }
            }
        }
        return types;
    }
    const allTypes = collectNodeTypes(wf.nodes, 0);
    const workflowType = (allTypes.includes('video') || allTypes.includes('vhs')) ? 'Video' : 'General';

    // Resolve SetNode/GetNode variable pairs
    const setNodes: Record<string, number> = {};   // name -> set_node_id
    const getNodesMap: Record<number, number> = {}; // get_node_id -> set_node_id

    for (const node of wf.nodes) {
        if (node.type === 'SetNode') {
            const name = (node.title ?? '').replace(/^Set_/, '');
            if (name) { setNodes[name] = node.id; }
        }
    }
    for (const node of wf.nodes) {
        if (node.type === 'GetNode') {
            const name = (node.title ?? '').replace(/^Get_/, '');
            if (name && name in setNodes) { getNodesMap[node.id] = setNodes[name]; }
        }
    }

    // Build backward adjacency (with Get/Set resolution)
    const backward: Record<number, Array<[number, number, string]>> = {}; // dst -> [(src, link_id, dtype)]
    for (const link of wf.links) {
        const [linkId, srcId, , dstId, , dtype] = link;
        if (!backward[dstId]) { backward[dstId] = []; }
        backward[dstId].push([srcId, linkId, dtype]);
    }
    for (const [getId, setId] of Object.entries(getNodesMap)) {
        const getIdNum = Number(getId);
        if (!backward[getIdNum]) { backward[getIdNum] = []; }
        for (const [srcId, , dtype] of (backward[setId] ?? [])) {
            backward[getIdNum].push([srcId, -1, dtype]);
        }
    }

    // Entry points: nodes with no connected inputs
    const entryPoints: number[] = [];
    for (const node of wf.nodes) {
        if (isVisualOnly(node)) { continue; }
        if (node.id in getNodesMap) { continue; }
        const inputs = node.inputs ?? [];
        if (inputs.length === 0 || inputs.every(inp => inp.link === null || inp.link === undefined)) {
            entryPoints.push(node.id);
        }
    }

    // Exit points: nodes with no connected outputs
    const exitPoints: number[] = [];
    for (const node of wf.nodes) {
        if (isVisualOnly(node)) { continue; }
        if (node.type === 'SetNode') {
            const name = (node.title ?? '').replace(/^Set_/, '');
            const hasConsumers = wf.nodes.some(
                n => n.type === 'GetNode' && (n.title ?? '').replace(/^Get_/, '') === name
            );
            if (hasConsumers) { continue; }
        }
        const outputs = node.outputs ?? [];
        if (outputs.length === 0 || outputs.every(out => !out.links || out.links.length === 0)) {
            exitPoints.push(node.id);
        }
    }

    // Classify every non-visual node by operation class
    const nodeClasses: Record<number, OperationClass> = {};
    for (const node of wf.nodes) {
        if (!isVisualOnly(node)) {
            nodeClasses[node.id] = classifyWorkflowNode(node);
        }
    }

    // Sources: entry points classified as Source (confirmed by type signature)
    const sources: AnalysisResult['sources'] = entryPoints
        .filter(nid => nodeClasses[nid] === 'source')
        .map(nid => ({ nodeId: nid, provides: nodeMainOutputTypes(nodesDict[nid]) }));

    // Primary outputs: exit points classified as Sink
    const primaryOutputs: number[] = exitPoints.filter(nid => nodeClasses[nid] === 'sink');

    // Trace main pipeline: DFS backward from each exit, take longest path
    function tracePipeline(exitId: number): Array<[number, string]> {
        let longest: Array<[number, string]> = [];
        const visit = (nodeId: number, path: Array<[number, string]>, dtype: string) => {
            const current: Array<[number, string]> = [[nodeId, dtype], ...path];
            const upstream = backward[nodeId] ?? [];
            if (upstream.length === 0) {
                if (current.length > longest.length) { longest = current; }
                return;
            }
            for (const [srcId, , srcDtype] of upstream) {
                visit(srcId, current, srcDtype);
            }
        };
        visit(exitId, [], '');
        return longest;
    }

    let mainPipeline: Array<[number, string]> = [];
    for (const exitId of exitPoints) {
        const path = tracePipeline(exitId);
        if (path.length > mainPipeline.length) { mainPipeline = path; }
    }

    // Variables
    const variables: AnalysisResult['variables'] = [];
    for (const [name, setId] of Object.entries(setNodes)) {
        const setInputs = backward[setId] ?? [];
        const sourceId = setInputs[0]?.[0] ?? null;
        const sourceType = sourceId !== null ? (nodesDict[sourceId]?.type ?? null) : null;

        const getIds = Object.entries(getNodesMap)
            .filter(([, sid]) => sid === setId)
            .map(([gid]) => Number(gid));

        const consumers: Array<{ nodeId: number; nodeType: string; inputSlot: number }> = [];
        for (const getId of getIds) {
            for (const link of wf.links) {
                const [, srcId, , dstId, dstSlot] = link;
                if (srcId === getId) {
                    const consumer = nodesDict[dstId];
                    if (consumer) {
                        consumers.push({ nodeId: dstId, nodeType: consumer.type, inputSlot: dstSlot });
                    }
                }
            }
        }
        variables.push({ name, setId, sourceId, sourceType, getIds, consumers });
    }

    // Loops
    const loopStarts: Record<number, AnalysisResult['loops'][0]> = {};
    for (const node of wf.nodes) {
        const t = node.type.toLowerCase();
        if (t.includes('loopstart') || t.includes('forstart') || t.includes('whilestart')) {
            const info: AnalysisResult['loops'][0] = {
                name: node.title ?? node.type,
                startId: node.id,
                startType: node.type,
            };
            // Try to find iteration count
            for (const inp of (node.inputs ?? [])) {
                const inpName = (inp.name ?? '').toLowerCase();
                if (['total', 'iteration', 'count'].some(k => inpName.includes(k)) && inp.link !== null && inp.link !== undefined) {
                    const link = linksDict[inp.link];
                    if (link) {
                        const srcNode = nodesDict[link[1]];
                        if (srcNode) {
                            const srcT = srcNode.type.toLowerCase();
                            if (srcT.includes('constant') || srcT.includes('primitive')) {
                                const vals = srcNode.widgets_values;
                                const first = Array.isArray(vals) ? vals[0] : undefined;
                                if (typeof first === 'number') { info.iterations = Math.round(first); }
                            }
                        }
                    }
                    break;
                }
            }
            loopStarts[node.id] = info;
        }
    }

    const loops: AnalysisResult['loops'] = [];
    for (const node of wf.nodes) {
        const t = node.type.toLowerCase();
        if (t.includes('loopend') || t.includes('forend') || t.includes('whileend')) {
            for (const inp of (node.inputs ?? [])) {
                if (inp.link !== null && inp.link !== undefined) {
                    const link = linksDict[inp.link];
                    if (link && link[1] in loopStarts) {
                        const info = { ...loopStarts[link[1]], endId: node.id, endType: node.type };
                        loops.push(info);
                        break;
                    }
                }
            }
        }
    }
    // Add any loop starts without a matched end
    for (const info of Object.values(loopStarts)) {
        if (!loops.some(l => l.startId === info.startId)) {
            loops.push(info);
        }
    }

    // Sections (Label nodes)
    const sections: Array<{ title: string; nodeId: number }> = [];
    for (const node of wf.nodes) {
        if (node.type.toLowerCase().includes('label')) {
            const title = node.title
                ?? (Array.isArray(node.widgets_values) ? String(node.widgets_values[0]) : undefined)
                ?? 'Unnamed';
            if (title.length > 2) {
                sections.push({ title, nodeId: node.id });
            }
        }
    }

    return {
        nodeCount: wf.nodes.length,
        linkCount: wf.links.length,
        lastNodeId,
        lastLinkId,
        workflowType,
        typeCounts,
        nodeClasses,
        entryPoints: entryPoints.sort((a, b) => a - b),
        exitPoints: exitPoints.sort((a, b) => a - b),
        sources,
        primaryOutputs,
        mainPipeline,
        variables,
        loops,
        sections,
    };
}

// ---------------------------------------------------------------------------
// Widget value extraction
// ---------------------------------------------------------------------------

/**
 * Extract the most meaningful current values from a node's widget_values.
 * All extraction rules live in tools/node-data.json — no node-specific code here.
 */
function extractNodeValues(node: WorkflowNode): string | null {
    const vals = node.widgets_values;
    if (!vals) { return null; }

    if (Array.isArray(vals)) {
        const result = applyExtractors(node.type.toLowerCase(), vals);
        if (result) { return result; }
    } else if (vals !== null && typeof vals === 'object') {
        // Dict-style widget values (some custom nodes) — no rule needed, generic fallback
        const entries = Object.entries(vals as Record<string, unknown>).slice(0, 5);
        if (entries.length > 0) {
            return entries.map(([k, v]) => `${k}: ${JSON.stringify(v)}`).join(', ');
        }
    }

    return null;
}

// ---------------------------------------------------------------------------
// Markdown formatter
// ---------------------------------------------------------------------------

export function formatWorkflowSummary(wf: Workflow): string {
    const r = analyzeWorkflow(wf);
    const nodesDict = getNodesDict(wf);
    const sgDict = buildSubgraphDict(wf);
    const lines: string[] = [];

    // Count nodes inside subgraphs (recursively) for display
    function countInternalNodes(nodes: WorkflowNode[], depth: number): number {
        let total = 0;
        if (depth >= 3) { return total; }
        for (const n of nodes) {
            if (UUID_RE.test(n.type) && sgDict[n.type]) {
                const sg = sgDict[n.type];
                total += sg.nodes.length + countInternalNodes(sg.nodes, depth + 1);
            }
        }
        return total;
    }
    const internalCount = countInternalNodes(wf.nodes, 0);
    const nodeCountStr = internalCount > 0
        ? `${r.nodeCount} outer + ${internalCount} in subgraphs`
        : String(r.nodeCount);

    lines.push('# ComfyUI Workflow Summary');
    lines.push('');
    lines.push('> **⚠️ DYNAMIC FILE — Re-read before every action. Any user UI interaction changes this.**');
    lines.push('');
    lines.push(`**Type**: ${r.workflowType} | **Nodes**: ${nodeCountStr} | **Links**: ${r.linkCount}`);
    lines.push(
        `**Next IDs** (use when adding nodes/links): next_node_id: ${r.lastNodeId + 1}, next_link_id: ${r.lastLinkId + 1}`
    );

    // Helper: description for a node type, with subgraph name fallback for UUIDs
    function describeType(nodeType: string): string {
        if (UUID_RE.test(nodeType)) {
            const sg = sgDict[nodeType];
            return sg ? `subgraph "${sg.name}"` : 'subgraph (unknown)';
        }
        return getNodeDescription(nodeType);
    }

    // Main Pipeline — node + class label (before Sources so the overall shape is visible first)
    if (r.mainPipeline.length >= 2) {
        lines.push('');
        lines.push(`## Main Pipeline (${r.mainPipeline.length} nodes)`);
        const MAX_SHOWN = 12;
        const shown = r.mainPipeline.slice(0, MAX_SHOWN);
        const parts = shown.map(([nid]) => {
            const cls = CLASS_LABEL[r.nodeClasses[nid] ?? 'misc'];
            return `${formatNode(nid, nodesDict, sgDict)} [${cls}]`;
        });
        lines.push(parts.join(' → '));
        if (r.mainPipeline.length > MAX_SHOWN) {
            lines.push(`_(${r.mainPipeline.length - MAX_SHOWN} more nodes not shown)_`);
        }
    }

    // Sources: all entry-point Source nodes, grouped by what they provide
    if (r.sources.length > 0) {
        lines.push('');
        lines.push('## Sources');
        for (const s of r.sources) {
            const desc = describeType(nodesDict[s.nodeId]?.type ?? '');
            const provides = s.provides.length > 0 ? ` → ${s.provides.join(', ')}` : '';
            lines.push(`- ${formatNode(s.nodeId, nodesDict, sgDict)} — ${desc}${provides}`);
        }
    }

    // Entry points that aren't classified as Source (unusual — flag them)
    const nonSourceEntries = r.entryPoints.filter(
        nid => r.nodeClasses[nid] !== 'source'
    );
    if (nonSourceEntries.length > 0) {
        lines.push('');
        lines.push('## Other Entry Points');
        lines.push('_(nodes with no connected inputs that are not pure Sources — may be misconfigured or use widget-only inputs)_');
        for (const nid of nonSourceEntries) {
            const cls = CLASS_LABEL[r.nodeClasses[nid] ?? 'misc'];
            const desc = describeType(nodesDict[nid]?.type ?? '');
            lines.push(`- ${formatNode(nid, nodesDict, sgDict)} [${cls}] — ${desc}`);
        }
    }

    // Primary Outputs (Sinks)
    if (r.primaryOutputs.length > 0) {
        lines.push('');
        lines.push('## Outputs (Sinks)');
        for (const nid of r.primaryOutputs) {
            const desc = describeType(nodesDict[nid]?.type ?? '');
            const consumes = nodeMainInputTypes(nodesDict[nid]).join(', ');
            const consumesStr = consumes ? ` ← ${consumes}` : '';
            lines.push(`- ${formatNode(nid, nodesDict, sgDict)} — ${desc}${consumesStr}`);
        }
    }

    // Subgraphs — expand each UUID-typed node instance to show its internals
    const uuidOuterNodes = wf.nodes.filter(n => !isVisualOnly(n) && UUID_RE.test(n.type) && sgDict[n.type]);
    if (uuidOuterNodes.length > 0) {
        lines.push('');
        lines.push('## Subgraphs');
        lines.push('_Each subgraph node contains internal nodes. Node IDs shown are the ones to use when editing the workflow JSON._');

        function renderSubgraph(node: WorkflowNode, depth: number): void {
            const sg = sgDict[node.type];
            if (!sg) { return; }

            const heading = depth === 0 ? '###' : '####';
            lines.push('');
            lines.push(`${heading} [${node.id}] "${sg.name}"`);

            if (sg.inputs.length > 0) {
                lines.push(`**Inputs**: ${sg.inputs.map(i => `${i.label ?? i.name} (${i.type})`).join(', ')}`);
            }
            if (sg.outputs.length > 0) {
                lines.push(`**Outputs**: ${sg.outputs.map(o => `${o.label ?? o.name} (${o.type})`).join(', ')}`);
            }

            const sgNodesDict = getNodesDict({ nodes: sg.nodes, links: sg.links });

            const isNamedParam = (n: WorkflowNode): boolean => {
                const nt = n.type.toLowerCase();
                if (!['primitive', 'constant'].some(k => nt.includes(k))) { return false; }
                return !!(n.title && n.title !== n.type);
            };

            // 1. Named parameters block (titled Primitive*/constant nodes)
            const paramNodes = sg.nodes.filter(
                n => !isVisualOnly(n) && !UUID_RE.test(n.type) && isNamedParam(n)
            );
            if (paramNodes.length > 0) {
                lines.push('**Parameters**:');
                for (const n of paramNodes) {
                    const v = extractNodeValues(n);
                    // Strip "value: " prefix for compact display
                    let valStr = '';
                    if (v) {
                        valStr = ' = ' + (v.startsWith('value: ') ? v.slice('value: '.length) : v);
                    }
                    lines.push(`  - **${n.title}**${valStr} [id:${n.id}]`);
                }
            }

            // 2. All other internal nodes with extractable values
            const skipIds = new Set(paramNodes.map(n => n.id));
            const noValueTypes: Record<string, number> = {};
            for (const n of sg.nodes) {
                if (isVisualOnly(n) || UUID_RE.test(n.type)) { continue; }
                if (skipIds.has(n.id)) { continue; }
                const v = extractNodeValues(n);
                if (v) {
                    const cls = CLASS_LABEL[classifyWorkflowNode(n) ?? 'misc'];
                    lines.push(`- ${formatNode(n.id, sgNodesDict, sgDict)} [${cls}]: ${v}`);
                } else {
                    noValueTypes[n.type] = (noValueTypes[n.type] ?? 0) + 1;
                }
            }

            // 3. Compact list of structural/passthrough nodes with no extractable values
            if (Object.keys(noValueTypes).length > 0) {
                const parts = Object.entries(noValueTypes)
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([t, c]) => c > 1 ? `${t}×${c}` : t);
                lines.push(`_Also contains: ${parts.join(', ')}_`);
            }

            // Recurse into nested subgraph instances (one more level)
            const nestedUUIDs = sg.nodes.filter(n => !isVisualOnly(n) && UUID_RE.test(n.type) && sgDict[n.type]);
            if (depth < 1) {
                for (const nested of nestedUUIDs) {
                    renderSubgraph(nested, depth + 1);
                }
            } else if (nestedUUIDs.length > 0) {
                lines.push(`_(${nestedUUIDs.length} nested subgraph(s) not expanded — see workflow JSON)_`);
            }
        }

        for (const node of uuidOuterNodes) {
            renderSubgraph(node, 0);
        }
    }

    // Variables
    if (r.variables.length > 0) {
        lines.push('');
        lines.push('## Variables (SetNode/GetNode)');
        for (const v of r.variables) {
            const srcStr = v.sourceId !== null
                ? `set by ${formatNode(v.sourceId, nodesDict, sgDict)}`
                : `set by [${v.setId}]`;
            const consumerStr = v.consumers.length > 0
                ? `, used by ${v.consumers.map(c => formatNode(c.nodeId, nodesDict, sgDict)).join(', ')}`
                : '';
            lines.push(`- **"${v.name}"**: ${srcStr}${consumerStr}`);
        }
    }

    // Loops
    if (r.loops.length > 0) {
        lines.push('');
        lines.push('## Loops');
        for (const loop of r.loops) {
            const endStr = loop.endId !== undefined ? `→ [${loop.endId}]` : '(no end found)';
            const iterStr = loop.iterations !== undefined ? `, ${loop.iterations} iterations` : '';
            lines.push(`- ${loop.startType} [${loop.startId}] ${endStr}${iterStr}`);
        }
    }

    // Sections
    if (r.sections.length > 0) {
        lines.push('');
        lines.push('## Sections (Labels)');
        for (const s of r.sections) {
            lines.push(`- **"${s.title}"** (Label node [${s.nodeId}])`);
        }
    }

    // Current node values (outer workflow only — subgraph values are in ## Subgraphs above)
    const valueLines: string[] = [];
    for (const node of wf.nodes) {
        if (UUID_RE.test(node.type)) { continue; } // subgraph nodes have no extractable widget values
        const v = extractNodeValues(node);
        if (v) { valueLines.push(`- ${formatNode(node.id, nodesDict, sgDict)} [${CLASS_LABEL[r.nodeClasses[node.id] ?? 'misc']}]: ${v}`); }
    }
    if (valueLines.length > 0) {
        lines.push('');
        lines.push('## Current Node Values');
        lines.push('');
        lines.push('_These values are already extracted — no need to read the workflow JSON to find them._');
        lines.push('');
        lines.push(...valueLines);
    }

    // Hints for common tasks — use operation class + type signature instead of name patterns
    const hintLines: string[] = [];

    // Convert nodes that produce CONDITIONING are text encoders / prompt nodes
    const promptNodes = wf.nodes.filter(n =>
        r.nodeClasses[n.id] === 'convert' && nodeMainOutputTypes(n).includes('CONDITIONING')
    );
    if (promptNodes.length > 0) {
        hintLines.push(`- **Change prompt/conditioning**: ${promptNodes.map(n => formatNode(n.id, nodesDict, sgDict)).join(', ')}`);
    }

    // Sampler nodes
    const samplerNodes = wf.nodes.filter(n => r.nodeClasses[n.id] === 'sampler');
    if (samplerNodes.length > 0) {
        hintLines.push(`- **Adjust sampler settings**: ${samplerNodes.map(n => formatNode(n.id, nodesDict, sgDict)).join(', ')}`);
    }

    // Sources that provide MODEL
    const modelSources = r.sources.filter(s => s.provides.includes('MODEL'));
    if (modelSources.length > 0) {
        hintLines.push(`- **Swap model**: ${modelSources.map(s => formatNode(s.nodeId, nodesDict, sgDict)).join(', ')}`);
    }

    // Transform nodes that have MODEL in and out (LoRA, model merging, etc.)
    const modelTransforms = wf.nodes.filter(n =>
        r.nodeClasses[n.id] === 'transform' && nodeMainInputTypes(n).includes('MODEL')
    );
    if (modelTransforms.length > 0) {
        hintLines.push(`- **Swap/adjust model modifiers (LoRA etc.)**: ${modelTransforms.map(n => formatNode(n.id, nodesDict, sgDict)).join(', ')}`);
    }

    // Sources that provide IMAGE or VIDEO (media inputs)
    const mediaSources = r.sources.filter(s =>
        s.provides.includes('IMAGE') || s.provides.includes('VIDEO')
    );
    if (mediaSources.length > 0) {
        hintLines.push(`- **Change input media**: ${mediaSources.map(s => formatNode(s.nodeId, nodesDict, sgDict)).join(', ')}`);
    }

    // Sinks (outputs)
    if (r.primaryOutputs.length > 0) {
        hintLines.push(`- **Change output destination/format**: ${r.primaryOutputs.map(nid => formatNode(nid, nodesDict, sgDict)).join(', ')}`);
    }

    if (hintLines.length > 0) {
        lines.push('');
        lines.push('## Hints for Common Tasks');
        lines.push('');
        lines.push('Use node IDs below to locate the right section of the workflow JSON when making changes.');
        lines.push('');
        lines.push(...hintLines);
    }

    // Node type breakdown — skip UUID types (covered in ## Subgraphs), show subgraph name for any that slip through
    lines.push('');
    lines.push('## Node Type Breakdown');
    const sortedTypes = Object.entries(r.typeCounts)
        .filter(([t]) => !VISUAL_TYPES.has(t) && !UUID_RE.test(t))
        .sort((a, b) => b[1] - a[1])
        .slice(0, 15);
    for (const [t, count] of sortedTypes) {
        const rep = wf.nodes.find(n => n.type === t);
        const cls = rep ? CLASS_LABEL[r.nodeClasses[rep.id] ?? 'misc'] : '?';
        const desc = getNodeDescription(t);
        lines.push(`- \`${t}\` ×${count} [${cls}] — ${desc}`);
    }
    const hiddenCount = Object.keys(r.typeCounts).filter(t => !VISUAL_TYPES.has(t) && !UUID_RE.test(t)).length - sortedTypes.length;
    if (hiddenCount > 0) {
        lines.push(`_(${hiddenCount} more node types not shown)_`);
    }

    lines.push('');
    lines.push('---');
    lines.push('_Generated by vscode-comfyui. See `comfyai/workflow-state.readonly.json` for the full workflow graph._');

    return lines.join('\n');
}
