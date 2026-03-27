<p align="center">
  <img src="images/icon.png" width="128" height="128" alt="VS Code ComfyUI Logo">
</p>

# VS Code ComfyUI

Interact with ComfyUI directly within your code editor.

[![Open VSX](https://img.shields.io/open-vsx/v/scruffynerf/vscode-comfyui?label=Install%20from%20Open%20VSX&color=purple)](https://open-vsx.org/extension/scruffynerf/vscode-comfyui)
[![GitHub Repository](https://img.shields.io/badge/GitHub-Repository-black?logo=github)](https://github.com/scruffynerf/vscode-comfyui)

![ComfyUI in Editor](images/preview.png)

## Who is this for?

Are you a developer or technical artist who works with both ComfyUI and code? Tired of constantly switching between windows – your code editor, ComfyUI interface, and terminal windows? This extension is for you!

## Features

- 🎨 **Direct Interaction**: Use ComfyUI directly in your code editor (VS Code, Cursor, Theia, Antigravity, etc.).
- 🌐 **Remote Support**: Connect to a remote ComfyUI server by configuring `comfyui.serverUrl`.
- 🔄 **Quick Reload**: Reload the ComfyUI editor panel instantly with `Cmd+Alt+R` (or `Ctrl+Alt+R`).
- ⚡ **Server Management**: Restart your ComfyUI server directly from the editor (requires ComfyUI-Manager or compatible API).
- 📦 **One-Click Installation**: Install and run `hiddenswitch` ComfyUI fork via `uv` for a self-contained setup.

## Requirements

- A running ComfyUI instance (Local or Remote).
- `uv` (optional, for self-contained installation).

## Configuration

- `comfyui.serverUrl`: The URL of your ComfyUI instance (default: `http://localhost:8188`).
- `comfyui.restartEndpoint`: The API endpoint to restart the server (default: `/manager/reboot`).
- `comfyui.installDir`: The directory where ComfyUI will be installed (default: `comfyui-workspace`).

## Usage

1. Start your ComfyUI server.
2. Open your code editor.
3. Use the Command Palette to run **ComfyUI: Open ComfyUI Editor**.
4. Use **ComfyUI: Reload Editor** to refresh the interface.
5. Use **ComfyUI: Restart Server** after developing custom nodes.

## Self-Contained Installation (Hiddenswitch)

- **Standard Installation**: Run **ComfyUI: Install Hiddenswitch ComfyUI (Standard)** for a quick pip-based setup.
- **Development Installation**: Run **ComfyUI: Install Development ComfyUI (Git Clone)** if you want to contribute to the ComfyUI codebase. This clones the repository and performs an editable install.

Once installed, run **ComfyUI: Run Hiddenswitch ComfyUI**. The extension will automatically open the ComfyUI editor panel after a few seconds.

## Release Notes

See [CHANGELOG.md](CHANGELOG.md) for detailed release notes.

## Contributing

Found a bug or want to contribute? Visit our [GitHub repository](https://github.com/scruffynerf/vscode-comfyui).

> [!NOTE]
> This is a fork of [piiq/code-comfyui](https://github.com/piiq/code-comfyui) maintained by [scruffynerf](https://github.com/scruffynerf).

## License

This extension is licensed under the MIT License.
