# Vision Analysis Models

Reference for segmentation, object detection, depth estimation, and pose detection models. These are preprocessing and analysis tools, not generation models.

All require custom nodes to be installed. If the relevant node isn't installed, these categories won't appear in `available-models.json`.

---

## Segmentation: SAM / SAM2

In `available-models.json` → `sams`. Requires Impact Pack or ComfyUI-segment-anything-2.

SAM (Segment Anything Model) creates masks by clicking points or using bounding boxes. SAM2 extends this to video.

| Model | Notes |
|---|---|
| `sam2.1_hiera_large.safetensors` | Best quality, most VRAM |
| `sam2.1_hiera_large-fp16.safetensors` | fp16, reduced VRAM |
| `sam2.1_hiera_base_plus.safetensors` | Good balance |
| `sam2.1_hiera_small.safetensors` | Fast, less accurate |
| `sam2.1_hiera_tiny.safetensors` | Fastest, least accurate |
| `sam_vit_h_4b8939.pth` | SAM 1.x ViT-H (Impact Pack) |
| `sam_vit_l_0b3195.pth` | SAM 1.x ViT-L |
| `sam_vit_b_01ec64.pth` | SAM 1.x ViT-B, smallest |

**Recommendation**: use SAM2.1 (`hiera_base_plus` for balance, `hiera_large` for quality). SAM 1.x is older — use only if your custom node doesn't support SAM2.

---

## Object detection: Ultralytics YOLO

In `available-models.json` → `ultralytics_bbox` (bounding boxes) and `ultralytics_segm` (segmentation masks). Requires Impact Pack.

Common use: ADetailer-style face/person detection for inpainting and refinement passes.

**Bounding box models** (detect regions, output boxes):

| Model | Detects |
|---|---|
| `face_yolov8n.pt` / `face_yolov8m.pt` | Faces (n = nano/fast, m = medium/quality) |
| `face_yolov8n_v2.pt` / `face_yolov8s.pt` | Faces (alternative versions) |
| `face_yolov9c.pt` | Faces (YOLOv9) |
| `hand_yolov8n.pt` / `hand_yolov8s.pt` | Hands |

**Segmentation models** (detect regions, output masks):

| Model | Detects |
|---|---|
| `person_yolov8m-seg.pt` | Full person |
| `person_yolov8n-seg.pt` | Full person (faster) |
| `deepfashion2_yolov8s-seg.pt` | Clothing/fashion items |

**Typical workflow**: `UltralyticsDetectorProvider` → `SAMDetectorCombined` → inpaint on the detected region.

---

## Depth estimation: DepthAnything V2

In `available-models.json` → `depthanything`. Requires ComfyUI-DepthAnythingV2.

Generates a depth map from an image — useful as ControlNet input or for 3D-aware compositing.

| Model | Notes |
|---|---|
| `depth_anything_v2_vitl_fp16.safetensors` | ViT-Large, best quality |
| `depth_anything_v2_vitl_fp32.safetensors` | ViT-Large, fp32 precision |
| `depth_anything_v2_vitb_fp16.safetensors` | ViT-Base, balanced |
| `depth_anything_v2_vits_fp16.safetensors` | ViT-Small, fastest |
| `depth_anything_v2_metric_hypersim_vitl_fp32.safetensors` | Metric depth (absolute scale, indoor) |
| `depth_anything_v2_metric_vkitti_vitl_fp32.safetensors` | Metric depth (outdoor/driving) |

**Recommendation**: `vitb_fp16` for most use cases (good balance). Use `vitl` for ControlNet inputs where depth accuracy matters. Metric variants give real-world scale — only needed for 3D applications.

---

## Pose detection

In `available-models.json` → `detection`. Requires ComfyUI-SCAIL-Pose or similar.

| Model | Notes |
|---|---|
| `vitpose-l-wholebody.onnx` | ViTPose Large, whole body keypoints |
| `vitpose_h_wholebody_model.onnx` | ViTPose Huge, highest accuracy |
| `yolov10m.onnx` | YOLOv10 person detector (used before pose estimation) |

Pose detection is typically a two-step pipeline: person detection (YOLO) → keypoint estimation (ViTPose).

---

## Choosing by task

| Task | Model type |
|---|---|
| Remove background, isolate subject | SAM2 (`hiera_base_plus`) |
| Detect and refine faces in generation | face_yolov8m bbox + SAM |
| Create depth map for ControlNet | DepthAnything v2 vitb |
| Detect body pose for ControlNet | ViTPose + YOLOv10 |
| Segment clothing items | deepfashion2 segm |
