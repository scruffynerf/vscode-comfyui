# Change Log

All notable changes to the "VS Code ComfyUI" extension will be documented in this file.

## [2.0.0] - 2026-03-27

- Forked from [piiq/code-comfyui](https://github.com/piiq/code-comfyui) by [scruffynerf](https://github.com/scruffynerf).
- Added Support for remote ComfyUI instances via `comfyui.serverUrl` setting.
- Consolidated `Open` and `Reload` commands into a single `ComfyUI: Open/Reload ComfyUI Editor` command.
- Updated keybinding to `Ctrl+Shift+R` to avoid conflicts with macOS system shortcuts.
- Added `ComfyUI: Restart Server` command with configurable endpoint and `Ctrl+Shift+Alt+R` shortcut.
- Fixed `ComfyUI: Restart Server` throwing a false 'fetch failed' error when the server drops the connection during reboot (the extension now waits 5 seconds and automatically reloads the panel).
- Added `ComfyUI: Install Hiddenswitch ComfyUI` (Standard) using `uv`.
- Added `ComfyUI: Install Development ComfyUI` (Git Clone) with editable install support.
- Added `comfyui.installDir` configuration setting to customize installation path.
- Enhanced `ComfyUI: Run Hiddenswitch ComfyUI` to automatically open the editor panel after server startup.
- Brand new icon featuring the Flying Spaghetti Monster.

## [1.0.1] - 2024-01-05

### Added-1.0.1

- Extension icon
- Link to install from VS Code Marketplace

## [1.0.0] - 2024-01-05

### Added-1.0.0

- Initial release of VS Code ComfyUI
- Embed ComfyUI interface directly in your code editor
- Command palette integration with "Open ComfyUI Editor" command
- Support for clipboard operations
- Persistent session state
- Native editor integration
