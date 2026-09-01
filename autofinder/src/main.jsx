import React from "react";
import { createRoot } from "react-dom/client";
import VehicleComparator from "../vehicle-comparator.jsx";
import { registerServiceWorker } from "./registerSW.js";

const root = createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <VehicleComparator />
  </React.StrictMode>
);

// Quita la pantalla de arranque en cuanto React pinta.
requestAnimationFrame(() => {
  const boot = document.getElementById("boot");
  if (boot) boot.remove();
});

registerServiceWorker();
