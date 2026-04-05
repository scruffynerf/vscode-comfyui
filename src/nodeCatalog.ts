/**
 * ComfyUI Node Catalog
 *
 * Fetches /object_info from the running server, classifies every node by its
 * functional operation class (derived from type signatures, not the unreliable
 * category field), and writes a three-tier set of files for agent consumption:
 *
 *   comfyai/nodes/index.md         — Tier 1: operation class overview
 *   comfyai/nodes/<class>.md      — Tier 2: per-class node lists
 *   comfyai/nodes/node-registry.json — Tier 3: raw /object_info dump (query by key)
 *   comfyai/_extension/nodes-manifest.json — internal: node list for incremental diffs
 */

import * as fs from 'fs';
import * as path from 'path';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type OperationClass =
    | 'source'
    | 'transform'
    | 'convert'
    | 'combine'
    | 'split'
    | 'sampler'
    | 'sink'
    | 'control'
    | 'variable'
    | 'misc';

export interface NodeCatalogEntry {
    name: string;
    displayName: string;
    description: string;
    operationClass: OperationClass;
    inputTypes: string[];      // main semantic types only (no INT/FLOAT/STRING primitives)
    outputTypes: string[];     // main semantic types only
    rawOutputTypes: string[];  // all output types including primitive/non-main (for variable nodes)
}

interface NodeManifest {
    generatedAt: string;
    serverUrl: string;
    nodeCount: number;
    nodeTypes: string[];    // sorted, for diffing
}

// ---------------------------------------------------------------------------
// Main type set — the semantic types that define a node's functional role.
// Primitive types (INT, FLOAT, STRING, BOOLEAN) are intentionally excluded:
// they're parameters/settings, not the data flowing through the pipeline.
//
// KEEP IN SYNC WITH: src/workflowAnalyzer.ts (MAIN_TYPES) and
//                    tools/workflow_analyzer.py (MAIN_TYPES)
// The three classifiers use the same set and the same ten operation classes.
// When adding a type or class here, update all three files and increment the
// sync version in the two analyzer files.
//
// Note: the catalog classifier (this file) operates on *node type schemas*
// (static input/output type signatures from /object_info). The workflow
// analyzer classifiers operate on *workflow graph instances* (actual
// connectivity). They agree on class definitions but may disagree on a
// specific node — e.g. a PrimitiveFloat with no connected outputs is 'sink'
// in a workflow graph but 'variable' in the catalog (schemas show it has outputs).
// ---------------------------------------------------------------------------

const MAIN_TYPES = new Set([
    'MODEL', 'VAE', 'CLIP', 'CLIP_VISION', 'CLIP_VISION_OUTPUT',
    'CONDITIONING', 'LATENT', 'IMAGE', 'MASK', 'VIDEO',
    'AUDIO', 'CONTROL_NET', 'STYLE_MODEL', 'GLIGEN',
    'UPSCALE_MODEL', 'SAMPLER', 'SIGMAS', 'NOISE', 'GUIDER',
]);

// ---------------------------------------------------------------------------
// Classification
// ---------------------------------------------------------------------------

function extractInputTypes(info: any): string[] {
    const allInputs = { ...(info.input?.required ?? {}), ...(info.input?.optional ?? {}) };
    const types: string[] = [];
    for (const val of Object.values(allInputs) as any[]) {
        // Each input is [type_or_enum_array, {...config}]
        // If val[0] is an array, it's an enum list — not a main type
        if (Array.isArray(val) && typeof val[0] === 'string' && MAIN_TYPES.has(val[0])) {
            types.push(val[0]);
        }
    }
    return types;
}

function extractOutputTypes(info: any): string[] {
    return ((info.output ?? []) as string[]).filter(t => MAIN_TYPES.has(t));
}

export function classifyNode(name: string, info: any): NodeCatalogEntry {
    const inputTypes = extractInputTypes(info);
    const outputTypes = extractOutputTypes(info);
    const inputSet = new Set(inputTypes);
    const outputSet = new Set(outputTypes);

    let operationClass: OperationClass;

    if (
        // Sampler: the core generative step — consumes MODEL + CONDITIONING(×2) + LATENT, produces LATENT
        inputSet.has('MODEL') && inputSet.has('CONDITIONING') && inputSet.has('LATENT') &&
        outputSet.has('LATENT')
    ) {
        operationClass = 'sampler';
    } else if (
        // Variable: SetNode/GetNode are always variable storage/retrieval, regardless of type carried
        name === 'SetNode' || name === 'GetNode'
    ) {
        operationClass = 'variable';
    } else if (
        // Sink: output_node flag, OR no outputs at all (schema has no output array entries)
        info.output_node === true ||
        (outputSet.size === 0 && (info.output ?? []).length === 0)
    ) {
        operationClass = 'sink';
    } else if (
        // Variable: no main-type outputs but has non-main outputs (INT/FLOAT/STRING/BOOLEAN/COMBO/etc.)
        // These are parameter/configuration nodes, not pipeline data producers.
        outputSet.size === 0 && (info.output ?? []).length > 0
    ) {
        operationClass = 'variable';
    } else if (
        // Control: loop/flow/condition patterns by name (type signatures alone aren't distinctive)
        /loop|forloop|whileloop/i.test(name)
    ) {
        operationClass = 'control';
    } else if (
        // Source: no main-type inputs, has main-type outputs (loads from disk or constants)
        inputSet.size === 0 && outputSet.size > 0
    ) {
        operationClass = 'source';
    } else if (
        // Transform: same main types flow in and out (e.g. LoRA: MODEL+CLIP → MODEL+CLIP)
        inputSet.size > 0 && outputSet.size > 0 &&
        outputSet.size === inputSet.size &&
        [...outputSet].every(t => inputSet.has(t))
    ) {
        operationClass = 'transform';
    } else if (outputSet.size >= 1) {
        // Combine: multiple inputs of the same main type collapse to one output of that type
        const outType = [...outputSet][0];
        const sameTypeInputs = inputTypes.filter(t => t === outType);
        if (outputSet.size === 1 && sameTypeInputs.length >= 2) {
            operationClass = 'combine';
        } else if (
            // Split: one input main type fans out to multiple outputs of the same type
            inputSet.size === 1 && outputTypes.length > 1 &&
            [...outputSet].every(t => inputSet.has(t))
        ) {
            operationClass = 'split';
        } else {
            // Convert: anything else with both inputs and outputs (type transformation)
            operationClass = 'convert';
        }
    } else {
        operationClass = 'misc';
    }

    return {
        name,
        displayName: info.display_name || name,
        description: info.description || '',
        operationClass,
        inputTypes: [...inputSet],
        outputTypes: [...outputSet],
        rawOutputTypes: (info.output ?? []) as string[],
    };
}

// ---------------------------------------------------------------------------
// Markdown formatters
// ---------------------------------------------------------------------------

const CLASS_DESCRIPTIONS: Record<OperationClass, string> = {
    source:    'Produce pipeline-typed values (IMAGE, MODEL, LATENT, etc.) from disk or external sources. No main-type inputs — these are the starting points of any pipeline.',
    transform: 'Modify a value while keeping its type (e.g. LoRA application, image sharpening, latent noise injection). Same types in and out.',
    convert:   'Change a value from one type to another (e.g. VAE encode IMAGE→LATENT, CLIPTextEncode STRING→CONDITIONING).',
    combine:   'Merge multiple values of the same type into one (e.g. ConditioningConcat, ImageBatch, string concatenation).',
    split:     'Divide a single typed value into multiple outputs of the same type.',
    sampler:   'The core generative denoising step. Always requires MODEL + CONDITIONING + LATENT as inputs.',
    sink:      'Consume typed values and produce files, previews, or display output. No connected typed outputs — these end a pipeline.',
    control:   'Flow control: loops, conditionals, scheduling, and sequencing.',
    variable:  'Output only primitive/non-pipeline types (INT, FLOAT, STRING, BOOLEAN, COMBO, etc.) — parameter and configuration nodes that wire scalar values between pipeline nodes. Also includes SetNode/GetNode (variable storage/retrieval). These nodes tune how the pipeline runs but are not part of the main data flow.',
    misc:      'Nodes whose type signature could not be automatically classified — may bridge pipeline and parameter domains, use unusual custom types (e.g. JSON_STRING, *), or be multi-purpose nodes that defy a single category. If you see Misc in a workflow summary, inspect the workflow JSON directly for that node.',
};

const CLASS_LABELS: Record<OperationClass, string> = {
    source:    'Source',
    transform: 'Transform',
    convert:   'Convert',
    combine:   'Combine',
    split:     'Split',
    sampler:   'Sampler',
    sink:      'Sink',
    control:   'Control',
    variable:  'Variable',
    misc:      'Misc',
};

const CLASS_ORDER: OperationClass[] = [
    'source', 'transform', 'convert', 'combine', 'split', 'sampler', 'sink', 'control', 'variable', 'misc'
];

function formatIndexFile(
    byClass: Record<OperationClass, NodeCatalogEntry[]>,
    totalCount: number,
    generatedAt: string
): string {
    const lines: string[] = [];
    lines.push('# ComfyUI Node Catalog — Index');
    lines.push('');
    lines.push(`**${totalCount} nodes** classified into functional operation classes.`);
    lines.push('');
    lines.push('## How to use');
    lines.push('');
    lines.push('1. Identify which operation class fits your need (what does the node *do* to its inputs?)');
    lines.push('2. Read the relevant `comfyai/nodes/classes/<class>.md` file for a list of candidates');
    lines.push('3. Look up the chosen node by key in `comfyai/nodes/node-registry.json` for its full input/output schema');
    lines.push('');
    lines.push('## Operation Classes');
    lines.push('');

    for (const cls of CLASS_ORDER) {
        const count = byClass[cls]?.length ?? 0;
        if (count === 0) { continue; }
        lines.push(`### ${CLASS_LABELS[cls]} (${count}) → \`comfyai/nodes/classes/${cls}.md\``);
        lines.push(CLASS_DESCRIPTIONS[cls]);
        lines.push('');
    }

    lines.push('---');
    lines.push(`_Generated ${generatedAt}. Run \`ComfyUI: Refresh Node Catalog\` to update._`);
    return lines.join('\n');
}

function formatClassFile(cls: OperationClass, nodes: NodeCatalogEntry[]): string {
    const lines: string[] = [];
    lines.push(`# ComfyUI Node Catalog — ${CLASS_LABELS[cls]}`);
    lines.push('');
    lines.push(CLASS_DESCRIPTIONS[cls]);
    lines.push('');
    lines.push('For full schema of any node: look up its key in `comfyai/nodes/node-registry.json`.');
    lines.push('');

    // Group within the class by primary output type for easier scanning.
    // Variable/misc nodes use raw output types (which may be primitive/non-main).
    const byOutputType: Record<string, NodeCatalogEntry[]> = {};
    for (const node of nodes) {
        const effectiveOutputs = node.outputTypes.length > 0 ? node.outputTypes : node.rawOutputTypes;
        const key = effectiveOutputs.length > 0 ? effectiveOutputs[0] : '(no output)';
        if (!byOutputType[key]) { byOutputType[key] = []; }
        byOutputType[key].push(node);
    }

    for (const outType of Object.keys(byOutputType).sort()) {
        const typeNodes = byOutputType[outType].sort((a, b) => a.name.localeCompare(b.name));
        lines.push(`## ${outType}`);
        lines.push('');
        for (const node of typeNodes) {
            const inputs = node.inputTypes.length > 0 ? node.inputTypes.join(', ') : 'none';
            const effectiveOutputs = node.outputTypes.length > 0 ? node.outputTypes : node.rawOutputTypes;
            const outputs = effectiveOutputs.length > 0 ? effectiveOutputs.join(', ') : 'none';
            const desc = node.description ? ` — ${node.description}` : '';
            lines.push(`- \`${node.name}\`${node.displayName !== node.name ? ` (${node.displayName})` : ''}${desc}`);
            lines.push(`  - **In**: ${inputs} → **Out**: ${outputs}`);
        }
        lines.push('');
    }

    lines.push('---');
    lines.push(`_${nodes.length} nodes. See \`comfyai/nodes/classes/index.md\` for all classes._`);
    return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Atomic file write helper
// ---------------------------------------------------------------------------

function atomicWrite(filePath: string, content: string) {
    const tmp = filePath + '.tmp';
    fs.writeFileSync(tmp, content, 'utf-8');
    fs.renameSync(tmp, filePath);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Available models extractor
// ---------------------------------------------------------------------------

// Map from output key → { node type, input field name }
// Each of these nodes exposes its model list as a COMBO input (array of strings).
// Entries for custom-node-dependent categories are silently skipped if the node is not installed.
const MODEL_LOADERS: Record<string, { node: string; input: string }> = {
    // Core ComfyUI — always present
    checkpoints:            { node: 'CheckpointLoaderSimple',     input: 'ckpt_name' },
    diffusion_models:       { node: 'UNETLoader',                 input: 'unet_name' },
    vae:                    { node: 'VAELoader',                   input: 'vae_name' },
    clip:                   { node: 'CLIPLoader',                  input: 'clip_name1' },
    loras:                  { node: 'LoraLoader',                  input: 'lora_name' },
    controlnet:             { node: 'ControlNetLoader',            input: 'control_net_name' },
    upscale_models:         { node: 'UpscaleModelLoader',          input: 'model_name' },
    clip_vision:            { node: 'CLIPVisionLoader',            input: 'clip_name' },
    style_models:           { node: 'StyleModelLoader',            input: 'style_model_name' },
    gligen:                 { node: 'GLIGENLoader',                input: 'gligen_name' },
    // Custom node: ComfyUI-IPAdapter-plus
    ipadapter:              { node: 'IPAdapterModelLoader',        input: 'ipadapter_file' },
    // Custom node: ComfyUI-DepthAnythingV2
    depthanything:          { node: 'DepthAnythingModelLoader',    input: 'model_name' },
    // Custom node: Impact Pack / ComfyUI-SAM
    sams:                   { node: 'SAMModelLoader',              input: 'model_name' },
    // Custom node: Impact Pack / ComfyUI-YOLO
    ultralytics_bbox:       { node: 'UltralyticsDetectorProvider', input: 'model_name' },
    ultralytics_segm:       { node: 'UltralyticsDetectorProvider', input: 'model_name' },
    // Custom node: WanVideoWrapper (Kijai)
    mmaudio:                { node: 'WanVideoMMAudioModelLoader',  input: 'model' },
    audio_encoders:         { node: 'WanVideoAudioEncoderLoader',  input: 'model' },
    wav2vec2:               { node: 'WanVideoWav2Vec2Loader',      input: 'model' },
    // Custom node: ComfyUI-SeedVR2_VideoUpscaler
    SEEDVR2:                { node: 'SeedVR2ModelLoader',          input: 'model' },
    // Custom node: ComfyUI-SCAIL-Pose
    detection:              { node: 'PoseEstimationModelLoader',   input: 'model_name' },
    // Custom node: ComfyUI-Frame-Interpolation
    vfi_models:             { node: 'VFIModelLoader',              input: 'model_name' },
    // Custom node: FlashVSR
    FlashVSR:               { node: 'FlashVSRLoader',              input: 'model' },
    // Custom node: diff_controlnet (kohya-ss ControlNet-diff)
    diff_controlnet:        { node: 'DiffControlNetLoader',        input: 'model_name' },
    // Custom node: LTX-specific latent upscalers
    latent_upscale_models:  { node: 'LatentUpscaleModelLoader',    input: 'model_name' },
};

function writeAvailableModels(objectInfo: Record<string, any>, rootPath: string) {
    const models: Record<string, string[]> = {};

    for (const [key, { node, input }] of Object.entries(MODEL_LOADERS)) {
        const nodeInfo = objectInfo[node];
        if (!nodeInfo) { continue; }
        const allInputs = { ...(nodeInfo.input?.required ?? {}), ...(nodeInfo.input?.optional ?? {}) };
        const inputDef = allInputs[input];
        // COMBO inputs are [[option1, option2, ...], {...config}]
        if (Array.isArray(inputDef) && Array.isArray(inputDef[0]) && inputDef[0].length > 0) {
            models[key] = inputDef[0] as string[];
        }
    }

    const output = {
        generatedAt: new Date().toISOString(),
        note: 'Model names the server knows about (same data as UI dropdowns). In hiddenswitch, includes models that will be downloaded on first use — not necessarily already on disk. Run ComfyUI: Refresh Node Catalog to update.',
        models,
    };
    atomicWrite(path.join(rootPath, 'comfyai', 'available-models.json'), JSON.stringify(output, null, 2));
}

function writeDisplayNameIndex(objectInfo: Record<string, any>, rootPath: string) {
    const displayToClass: Record<string, string> = {};
    const classToDisplay: Record<string, string> = {};

    for (const [className, info] of Object.entries(objectInfo)) {
        const displayName: string = info.display_name || '';
        if (displayName && displayName !== className) {
            displayToClass[displayName] = className;
            classToDisplay[className] = displayName;
        }
    }

    const output = {
        generatedAt: new Date().toISOString(),
        note: 'Maps between UI display names and class type names (only entries where they differ). Use displayToClass when you see a UI label and need the type name for patch JSON. Use classToDisplay when you need the label a user sees.',
        displayToClass,
        classToDisplay,
    };
    atomicWrite(path.join(rootPath, 'comfyai', 'nodes', 'display-name-index.json'), JSON.stringify(output, null, 2));
}

const MODEL_FILE_EXTENSIONS = ['.safetensors', '.ckpt', '.pt', '.pth', '.bin', '.gguf', '.sft'];

function isModelFileList(values: string[]): boolean {
    if (values.length === 0) { return false; }
    return values.some(v => MODEL_FILE_EXTENSIONS.some(ext => v.toLowerCase().endsWith(ext)));
}

function writeOutputSlotIndex(objectInfo: Record<string, any>, rootPath: string) {
    const index: Record<string, Array<{ name: string; type: string }>> = {};

    for (const [className, info] of Object.entries(objectInfo)) {
        const outputTypes: string[] = info.output ?? [];
        if (outputTypes.length === 0) { continue; }
        const outputNames: string[] = info.output_name ?? [];
        index[className] = outputTypes.map((type, i) => ({
            name: outputNames[i] || type,
            type,
        }));
    }

    const output = {
        generatedAt: new Date().toISOString(),
        note: 'Output slots for every node, in slot order. Array index = slot number for GraphBuilder .out(N) and patch link src_slot values. Each entry: {name, type}.',
        index,
    };
    atomicWrite(path.join(rootPath, 'comfyai', 'nodes', 'output-slot-index.json'), JSON.stringify(output, null, 2));
}

function writeWidgetEnums(objectInfo: Record<string, any>, rootPath: string) {
    const enums: Record<string, Record<string, string[]>> = {};

    for (const [className, info] of Object.entries(objectInfo)) {
        const allInputs: Record<string, any> = {
            ...(info.input?.required ?? {}),
            ...(info.input?.optional ?? {}),
        };

        const nodeEnums: Record<string, string[]> = {};

        for (const [inputName, inputDef] of Object.entries(allInputs)) {
            // COMBO inputs: [string[], {...config}] — first element is the enum value array
            if (Array.isArray(inputDef) && Array.isArray(inputDef[0]) && inputDef[0].length > 0) {
                const values = inputDef[0] as string[];
                // Skip model file lists — those are already in available-models.json
                if (!isModelFileList(values)) {
                    nodeEnums[inputName] = values;
                }
            }
        }

        if (Object.keys(nodeEnums).length > 0) {
            enums[className] = nodeEnums;
        }
    }

    const output = {
        generatedAt: new Date().toISOString(),
        note: 'Valid string values for COMBO (enum) widget inputs, excluding model file lists (those are in available-models.json). Use to find valid values for sampler_name, scheduler, upscale_method, and any other string-enum input.',
        enums,
    };
    atomicWrite(path.join(rootPath, 'comfyai', 'nodes', 'widget-enums.json'), JSON.stringify(output, null, 2));
}

// ---------------------------------------------------------------------------
// Catalog writer
// ---------------------------------------------------------------------------

/**
 * Classify objectInfo and write all catalog files (Tier 1–3 + manifest).
 * Shared by buildNodeCatalog and the rebuild path in updateNodeCatalog.
 */
function writeCatalog(objectInfo: Record<string, any>, rootPath: string, serverUrl: string): NodeManifest {
    const nodesDir = path.join(rootPath, 'comfyai', 'nodes');
    const classesDir = path.join(nodesDir, 'classes');
    const extDir = path.join(rootPath, 'comfyai', '_extension');
    fs.mkdirSync(nodesDir, { recursive: true });
    fs.mkdirSync(classesDir, { recursive: true });
    fs.mkdirSync(extDir, { recursive: true });

    // Tier 3: raw dump — query by key, do not read whole file
    atomicWrite(path.join(nodesDir, 'node-registry.json'), JSON.stringify(objectInfo, null, 2));

    // Available models — extracted from COMBO inputs of known loader nodes
    writeAvailableModels(objectInfo, rootPath);

    // Display name index — bidirectional map for entries where display name differs from class name
    writeDisplayNameIndex(objectInfo, rootPath);

    // Output slot index — slot number + type for every node's outputs (for GraphBuilder and link patches)
    writeOutputSlotIndex(objectInfo, rootPath);

    // Widget enums — valid COMBO string values, excluding model file lists
    writeWidgetEnums(objectInfo, rootPath);

    const entries: NodeCatalogEntry[] = Object.entries(objectInfo)
        .map(([name, info]) => classifyNode(name, info));

    const byClass: Record<OperationClass, NodeCatalogEntry[]> = {
        source: [], transform: [], convert: [], combine: [],
        split: [], sampler: [], sink: [], control: [], variable: [], misc: [],
    };
    for (const entry of entries) {
        byClass[entry.operationClass].push(entry);
    }

    const generatedAt = new Date().toISOString();

    // Tier 1: index
    atomicWrite(path.join(classesDir, 'index.md'), formatIndexFile(byClass, entries.length, generatedAt));

    // Tier 2: per-class files
    for (const cls of CLASS_ORDER) {
        const nodes = byClass[cls];
        if (nodes.length === 0) { continue; }
        atomicWrite(path.join(classesDir, `${cls}.md`), formatClassFile(cls, nodes));
    }

    const manifest: NodeManifest = {
        generatedAt,
        serverUrl,
        nodeCount: entries.length,
        nodeTypes: Object.keys(objectInfo).sort(),
    };
    atomicWrite(path.join(extDir, 'nodes-manifest.json'), JSON.stringify(manifest, null, 2));

    // Signal file agents can poll to know the refresh is complete.
    // Compare the `completedAt` timestamp against when you triggered the refresh.
    atomicWrite(
        path.join(extDir, 'catalog-refresh-timestamp.json'),
        JSON.stringify({ completedAt: new Date().toISOString(), nodeCount: entries.length }, null, 2)
    );

    return manifest;
}

/**
 * Fetch /object_info, classify all nodes, and write the full catalog.
 * Always writes all files; use updateNodeCatalog() for incremental checks.
 */
export async function buildNodeCatalog(serverUrl: string, rootPath: string): Promise<void> {
    const response = await fetch(`${serverUrl}/object_info`);
    if (!response.ok) {
        throw new Error(`/object_info returned HTTP ${response.status}`);
    }
    const objectInfo = await response.json() as Record<string, any>;
    writeCatalog(objectInfo, rootPath, serverUrl);
}

/**
 * Check whether the node list has changed since the last build.
 * If the manifest is missing or nodes changed, rebuilds the full catalog.
 * Returns null if a full build was done, or { added, removed } if a diff was computed.
 */
export async function updateNodeCatalog(
    serverUrl: string,
    rootPath: string
): Promise<{ added: string[]; removed: string[] } | null> {
    const nodesDir = path.join(rootPath, 'comfyai', 'nodes');
    const extDir = path.join(rootPath, 'comfyai', '_extension');
    const manifestPath = path.join(extDir, 'nodes-manifest.json');
    const indexPath = path.join(nodesDir, 'classes', 'index.md');

    // Full build if no prior catalog exists
    if (!fs.existsSync(manifestPath) || !fs.existsSync(indexPath)) {
        await buildNodeCatalog(serverUrl, rootPath);
        return null;
    }

    const response = await fetch(`${serverUrl}/object_info`);
    if (!response.ok) {
        throw new Error(`/object_info returned HTTP ${response.status}`);
    }
    const objectInfo = await response.json() as Record<string, any>;

    const manifest: NodeManifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    const currentTypes = new Set(Object.keys(objectInfo));
    const previousTypes = new Set(manifest.nodeTypes);

    const added = [...currentTypes].filter(t => !previousTypes.has(t));
    const removed = [...previousTypes].filter(t => !currentTypes.has(t));

    if (added.length === 0 && removed.length === 0) {
        return { added: [], removed: [] };
    }

    // Something changed — rebuild (objectInfo already fetched)
    writeCatalog(objectInfo, rootPath, serverUrl);
    return { added, removed };
}
