import { Driver, driver, DriveStep } from "driver.js";
import { createSignal } from "solid-js";
import "driver.js/dist/driver.css";

const [tourSteps, setTourSteps] = createSignal<DriveStep[]>([
  {
    element: '[data-help="inventory"]',
    popover: {
      title: "Projects",
      description: "Manage and monitor your projects here.",
      side: "top",
    },
  },
  {
    element: '[data-tour="sidebar"]',
    popover: {
      title: "Create a project",
      description: "Start a new project using this button.",
      side: "bottom",
    },
  },
]);
let instance: Driver | undefined;

export const startTour = () => {
  instance = driver({
    steps: tourSteps(),
    animate: true,
    smoothScroll: true,
    allowClose: true,
    overlayColor: "#000",
    overlayOpacity: 0.62,
    stagePadding: 6,
    stageRadius: 14,
    popoverClass: "qutm-tour",
    showProgress: true,
    progressText: "{{current}} of {{total}}",
    nextBtnText: "Next",
    prevBtnText: "Back",
    doneBtnText: "Done",
    skipMissingElement: true,
  });

  instance.drive();
};
