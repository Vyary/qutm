<div align="center">

# Qutm

**Quest Tracker Improved — a Path of Exile 2 overlay**

[Download](https://github.com/Vyary/qutm/releases/latest) · [Discord](https://discord.com/invite/TfpK2fnCmF) · [Issues](https://github.com/Vyary/qutm/issues)

</div>

---

A lightweight, transparent overlay that guides you through the campaign without missing quests, items, or rewards.

## Features

- **Zone guide** - step-by-step progression, updated as you change zones
- **Layout widget** - points of interest for the current zone
- **Inventory scan (Beta)** - record inventory scans step by step and replay them later
- **Price check (Beta)** - check item price
- **Auto-updates** and minimal performance impact

## Install

Download the latest version from the [Releases page](https://github.com/Vyary/qutm/releases/latest), run it, and follow the quick setup.

Windows is the primary platform. macOS and Linux builds are available too, and compatibility reports are welcome.

## Setup

1. Select your `Client.txt` (in the game's `logs` folder)
2. Set the overlay shortcut
3. Choose your widgets

Qutm only reads `Client.txt` and follows GGG's Terms of Service.

## Development

**Requirements:** [Tauri prerequisites](https://v2.tauri.app/start/prerequisites/) for your platform

```bash
git clone https://github.com/Vyary/qutm.git
cd qutm
npm install
npm run tauri dev
```

Build a release binary:

```bash
npm run tauri build
```

## License

Apache License 2.0 — see [LICENSE](https://github.com/Vyary/qutm/blob/main/LICENSE).
