import { Driver, driver, DriveStep } from "driver.js";
import { createSignal, flush } from "solid-js";
import "driver.js/dist/driver.css";
import "./driver-theme.css";
import { showZone } from "../Zone/Zone";
import { showLayout } from "../Layout/Layout";
import { showInventory } from "../Inventory/Inventory";
import { showPrice } from "../Price/Price";
import { changeZone, removeLastZone } from "../Zone/utils/Tracker";
import { changeLayout, layoutZone } from "../Layout/LayoutState";
import { emptyItem, setItem } from "../Price/utils/PriceState";
import { addItem, clearInventory, filtered } from "../Inventory/InventoryState";
import { enablePassthrough } from "@/lib/Passthrough";
import { character, setCharacterLevel } from "../Zone/utils/Character";
import { shortcuts } from "@/lib/Shortcut";
import { error } from "@tauri-apps/plugin-log";

export const [activeTour, setActiveTour] = createSignal(false);
let instance: Driver | undefined;
let prevZone: string = "";
let invWasEmpty = false;
let noLevel = false;

export const startTour = (category: string) => {
  try {
    if (activeTour()) return;

    setActiveTour(true);

    instance = driver({
      steps: createSteps(category),
      popoverClass: "driverjs-theme",
      overlayColor: "oklch(8% 0.012 280)",
      stagePadding: 8,
      stageRadius: 12,
      showProgress: true,
      progressText: "{{current}} of {{total}}",
      allowClose: true,
      allowKeyboardControl: true,
      onDestroyed: () => cleanUp(),
    });

    instance.drive();
  } catch (e) {
    error(`failed to do tour: ${e}`);
  }
};

const cleanUp = () => {
  if (showZone()) {
    removeLastZone();
    if (noLevel) setCharacterLevel(0);
  }
  if (showLayout()) changeLayout(prevZone);
  if (showPrice()) setItem(() => emptyItem);
  if (showInventory() && invWasEmpty) {
    clearInventory();
    invWasEmpty = false;
  }

  setActiveTour(false);
  enablePassthrough();
};

const createSteps = (category: string): DriveStep[] => {
  let steps: DriveStep[] = [];

  if (category === "complete") {
    steps.push({
      popover: {
        title: "Welcome to Qutm",
        description:
          "Let's take a tour of your widgets. Use Next and Previous to navigate, or press Esc to exit at any time.",
      },
    });
  }

  if (
    (showZone() || showLayout() || showPrice() || showInventory()) &&
    category === "complete"
  ) {
    steps.push(
      {
        element: "#move",
        popover: {
          title: "Move the widget",
          description:
            "Drag the strip at the top to reposition the widget anywhere on your screen.",
        },
      },
      {
        element: "#transparency",
        popover: {
          title: "Adjust transparency",
          description:
            "Use the slider at the bottom to make the widget more see-through, so it stays out of your way while you play.",
        },
      },
    );
  }

  if (showZone() && (category === "complete" || category === "zone")) {
    changeZone("G1_2");
    if (character.level === 0) {
      setCharacterLevel(9);
      noLevel = true;
    }
    if (category === "zone") flush();

    steps.push(
      {
        element: "#zone",
        popover: {
          title: "Zone widget",
          description:
            "Follow your act progression, zone objectives and what to do next.",
          side: "right",
        },
      },
      {
        element: "#zone-tasks",
        popover: {
          title: "Zone tasks",
          description:
            "Your tasks for the current zone are listed here, so you always know what's next to do.",
          side: "right",
        },
      },
      {
        element: "#level-warning",
        popover: {
          title: "Level warning",
          description:
            "If your level is too high or too low for this zone's experience threshold, a warning appears here.",
          side: "right",
        },
      },
    );
  }

  if (showLayout() && (category === "complete" || category === "layout")) {
    prevZone = layoutZone();
    changeLayout("G1_2");
    if (category === "layout") flush();

    steps.push(
      {
        element: "#layout",
        popover: {
          title: "Layout widget",
          description:
            "Shows the points of interest for the zone you're currently in.",
          side: "left",
        },
      },
      {
        element: "#layout-changer",
        popover: {
          title: "Multiple layouts",
          description:
            "Some zones have more than one layout. Use these buttons to switch between them while the overlay is focused.",
          side: "left",
        },
      },
    );
  }

  if (showPrice() && (category === "complete" || category === "price")) {
    setItem(() => ring);
    if (category === "price") flush();

    steps.push({
      element: "#price",
      popover: {
        title: "Price widget",
        description:
          "Scan an item to check its price and open a trade search for it with one click.",
        side: "right",
      },
    });
  }

  if (
    showInventory() &&
    (category === "complete" || category === "inventory")
  ) {
    if (filtered().length <= 0) {
      invWasEmpty = true;
      addItem({ name: "Mirror of Kalandra", quantity: 1 });
      addItem({ name: "Divine Orb", quantity: 365 });
    }

    const mouseClick = () => shortcuts["addMouseClick"];
    const itemScan = () => shortcuts["addStep"];
    const replay = () => shortcuts["autoScan"];
    if (category === "inventory") flush();

    steps.push(
      {
        element: "#inventory",
        popover: {
          title: "Inventory widget",
          description:
            "Find out what your inventory is worth by recording a sequence of mouse clicks and item scans.",
          side: "right",
        },
      },
      {
        element: "#inventory",
        popover: {
          title: "Record, scan, replay",
          description: `Press ${mouseClick()} to record a mouse click and ${itemScan()} to record an item scan. Press ${replay()} to replay the whole sequence automatically.`,
          side: "right",
        },
      },
    );
  }

  steps.push({
    popover: {
      title: "You're set",
      description:
        "Time to get back to the game. You can replay this tour anytime from Settings → Help & tutorials.",
    },
  });

  return steps;
};

const ring = {
  TypeFilters: {
    filters: {
      category: { value: "Rings", disabled: false },
      rarity: { value: "Unique", disabled: false },
      ilvl: { value: { min: 81 }, disabled: false },
    },
  },
  EquipmentFilters: { filters: {}, disabled: true },
  ReqFilters: { filters: {}, disabled: true },
  MapFilters: { filters: {}, disabled: true },
  MiscFilters: {
    filters: { mirrored: { value: true, disabled: false } },
    disabled: false,
  },
  enhancement: [],
  implicit: [],
  explicit: [
    {
      id: "explicit.stat_746505085",
      mod: "Reflects opposite Ring",
      disabled: false,
    },
  ],
  skill: [],
  runes: [],
  type: { value: "Ring", disabled: false },
  name: { value: "Kalandra's Touch", disabled: false },
};
