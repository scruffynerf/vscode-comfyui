# <img src="images/icon.png" width="64" height="64" alt="VS Code ComfyUI Logo" style="vertical-align: middle;"> VS Code ComfyUI

Interact with ComfyUI directly within your code editor.

[![Open VSX](https://img.shields.io/open-vsx/v/scruffynerf/vscode-comfyui?label=Install%20from%20Open%20VSX&color=purple)](https://open-vsx.org/extension/scruffynerf/vscode-comfyui)
[![GitHub Repository](https://img.shields.io/badge/GitHub-Repository-black?logo=github)](https://github.com/scruffynerf/vscode-comfyui)

![ComfyUI in Editor](images/preview.png)

## Who is this for?

Are you a developer or technical artist who works with both ComfyUI and code? Tired of constantly switching between windows – your code editor, ComfyUI interface, and terminal windows? This extension is for you!

## Features

- 🎨 **Direct Interaction**: Use ComfyUI directly in your code editor (VS Code, Cursor, Theia, Antigravity, etc.).
- 🌐 **Remote Support**: Connect to a remote ComfyUI server by configuring `comfyui.serverUrl`.
- 🔄 **Quick Reload**: Reload or open the ComfyUI editor panel instantly with `Ctrl+Shift+R`.
- ⚡ **Server Management**: Restart your ComfyUI server with `Ctrl+Shift+Alt+R`. The extension will automatically reload the editor panel after 5 seconds. (Requires ComfyUI-Manager or compatible API).
- 📦 **One-Click ComfyUI Installation**: Install and run the [`hiddenswitch`](https://github.com/hiddenswitch/pip-and-uv-installable-ComfyUI) ComfyUI fork via `uv` for a self-contained setup.
  - It's uv/pip installable, lets you use ComfyUI as a Python library, and maintains 99% compatibility with the main repo — highly recommended!

## Requirements

- A running ComfyUI instance (Local or Remote).
- `uv` (optional, for self-contained installation). See [uv installation](https://docs.astral.sh/uv/getting-started/installation/) if you don't have uv installed.

## Configuration

- `comfyui.serverUrl`: The URL of your ComfyUI instance (default: `http://localhost:8188`).  This can be remote!
- `comfyui.restartEndpoint`: The API endpoint to restart the server (default: `/v2/manager/reboot`).
- `comfyui.installDir`: The directory where ComfyUI will be installed (default: `comfyui-workspace`).
- `comfyui.serverTimeout`: The maximum time (in milliseconds) to wait for the server to become responsive during start or restart (default: `60000`).
- `comfyui.gitRepo`: The Git repository URL for development ComfyUI installations (default: `https://github.com/hiddenswitch/ComfyUI.git`).
- `comfyui.defaultBranch`: The branch to checkout for development installations (default: `main`).

## Usage

1. Start your ComfyUI server.
2. Open your code editor.
3. Use the Command Palette to run **ComfyUI: Open/Reload ComfyUI Editor**.
4. Use **ComfyUI: Restart Server** after developing custom nodes.

## Installation (Self-Contained)

- **Standard Installation**: Run **ComfyUI: Install Hiddenswitch ComfyUI (Standard)** for a quick uv/pip-based setup using the [Hiddenswitch fork](https://github.com/hiddenswitch/pip-and-uv-installable-ComfyUI).
- **Development Installation**: Run **ComfyUI: Install Development ComfyUI (Git Clone)**. This clones the repository specified in `comfyui.gitRepo` (defaulting to the `hiddenswitch` fork) and performs an editable install. This allows you to use the main ComfyUI repository or any other fork, and potentially work on the ComfyUI codebase itself.

Either should allow you to develop nodes from within `custom_nodes`. Checkout your node development repo inside `custom_nodes` and you should be able to 'live code' your nodes, and see the changes reflected in the editor panel after a server restart/panel reload.

Once installed, run **ComfyUI: Run Hiddenswitch ComfyUI**. The extension will automatically open the ComfyUI editor panel after a few seconds.

## Release Notes

See [CHANGELOG.md](CHANGELOG.md) for detailed release notes.

## Contributing

Found a bug or want to contribute? Visit our [GitHub repository](https://github.com/scruffynerf/vscode-comfyui).

> [!NOTE]
> This is a fork of [piiq/code-comfyui](https://github.com/piiq/code-comfyui) now maintained by [scruffynerf](https://github.com/scruffynerf).

## License

This extension is licensed under the MIT License.
