import { Driver, driver, DriveStep } from "driver.js";
import { createSignal } from "solid-js";
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

export const [activeTour, setActiveTour] = createSignal(false);
let instance: Driver | undefined;
let prevZone: string = "";
let invWasEmpty = false;

export const startTour = () => {
  if (activeTour()) return;

  setActiveTour(true);

  instance = driver({
    steps: createSteps(),
    popoverClass: "driverjs-theme",
    overlayColor: "oklch(8% 0.012 280)",
    overlayOpacity: 0.75,
    stagePadding: 8,
    stageRadius: 12,
    showProgress: true,
    animate: true,
    progressText: "{{current}} of {{total}}",
    allowClose: true,
    allowKeyboardControl: true,
    onDestroyed: () => cleanUp(),
  });

  instance.drive();
};

const cleanUp = () => {
  if (showZone()) removeLastZone();
  if (showLayout()) changeLayout(prevZone);
  if (showPrice()) setItem(() => emptyItem);
  if (showInventory() && invWasEmpty) {
    clearInventory();
    invWasEmpty = false;
  }

  setActiveTour(false);
  enablePassthrough();
};

const createSteps = (): DriveStep[] => {
  let steps: DriveStep[] = [];

  steps.push({
    popover: {
      title: "Welcome to Qutm",
      description:
        "This quick tour shows where everything lives. Use Next and Previous to move around, or press Esc to close it at any time.",
    },
  });

  if (showZone()) {
    changeZone("G1_2");
    steps.push({
      element: "#zone",
      popover: {
        title: "Zone Widget",
        description:
          "Act progression, zone objectives, and the next thing to do.",
        side: "right",
      },
    });
  }

  if (showLayout()) {
    prevZone = layoutZone();
    changeLayout("G1_2");
    steps.push({
      element: "#layout",
      popover: {
        title: "Layout Widget",
        description: "Points of interest for the zone you are in.",
        side: "left",
        align: "center",
      },
    });
  }

  if (showPrice()) {
    setItem(() => ring);
    steps.push({
      element: "#price",
      popover: {
        title: "Price Widget",
        description: "Scan an item, check price, and open a trade search.",
        side: "right",
      },
    });
  }

  if (showInventory()) {
    if (filtered().length <= 0) {
      invWasEmpty = true;
      addItem({ name: "Mirror of Kalandra", quantity: 1 });
      addItem({ name: "Divine Orb", quantity: 365 });
    }

    steps.push({
      element: "#inventory",
      popover: {
        title: "Inventory Widget",
        description: "Scan your inventory and see what it is worth.",
        side: "right",
      },
    });
  }

  steps.push({
    popover: {
      title: "You're set",
      description:
        "You can go back to playing the game. You can replay this tour from Settings -> Help & tutorials.",
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
