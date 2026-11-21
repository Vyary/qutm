import { setShowInventory } from "@/components/Inventory/Inventory";
import { setShowLayout } from "@/components/Layout/Layout";
import { setShowPrice } from "@/components/Price/Price";
import { setShowSetup } from "@/components/SetupFlow";
import { setAutoUpdate } from "@/components/Updater";
import { setShowZone } from "@/components/Zone/Zone";
import { load } from "@tauri-apps/plugin-store";

export const store = await load("store.json", { autoSave: false });

export const loadSaved = async () => {
  const [
    savedShowZone,
    savedShowLayout,
    savedShowInventory,
    savedShowPrice,
    savedShowSetup,
    savedAutoUpdate,
  ] = await Promise.all([
    store.get<boolean>("showZone"),
    store.get<boolean>("showLayout"),
    store.get<boolean>("showInventory"),
    store.get<boolean>("showPrice"),
    store.get<boolean>("showSetup"),
    store.get<boolean>("showAuto Update"),
  ]);

  setShowZone(savedShowZone ?? false);
  setShowLayout(savedShowLayout ?? false);
  setShowInventory(savedShowInventory ?? false);
  setShowPrice(savedShowPrice ?? false);
  setShowSetup(savedShowSetup ?? true);
  setAutoUpdate(savedAutoUpdate ?? false);
};
