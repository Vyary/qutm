# PoE2 Map Layout Module

This module provides the core components and utilities to render, update, and configure map layout widgets for **Path of Exile 2**.

---

## 🚀 Main Entry Point

### `Layouts()`
The primary component and main entry point for the module. Render this at the root of your overlay to display the map layout interface.

```javascript
import { Layouts } from './modules/layouts';

function OverlayRoot() {
  return (
    <Layouts />
  );
}
```

---

## 🗺️ Changing Map Layouts

### `setLayoutZone(zoneCode)`
The global utility function used to update the current active map layout. This must be triggered whenever the player changes instances or enters a new area.

* **Parameters:** 
  * `zoneCode` *(string)*: The official Path of Exile 2 zone identifier (e.g., `"G1_town"`).

```javascript
import { setLayoutZone } from './modules/layouts';

// Example: Player enters the Act 1 Town hub
setLayoutZone('G1_town');
```

---

## ⚙️ Widget Configuration

### `LayoutSettings()`
The configuration component used to toggle the visibility and state of the map layout widget. 

* **Usage:** Embed this function/component inside your overlay's settings menu or options dashboard to allow players to turn the widget on or off.

```javascript
import { LayoutSettings } from './modules/layouts';

function SettingsMenu() {
  return (
    <div className="menu-section">
      <LayoutSettings />
    </div>
  );
}
```
