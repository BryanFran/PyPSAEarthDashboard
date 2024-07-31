/*
 * SPDX-FileCopyrightText: 2024 Bryan Ramirez
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
import { init } from "./init.js";
import { loadLayers, clearLayers } from "./layers.js";
import { addDownloadEventListeners } from "./downloads.js";
import { addMapEventHandlers } from "./eventHandlers.js";
import { addMapRotationInteraction } from "./mapRotation.js";
import { initializeSearch } from "./search.js";
import {
  addLayerVisibilityHandlers,
  updateLayerVisibility,
  adjustLegendPosition
} from "./layerVisibility.js";
import { initializeUrlHandling } from "./urlHandling.js";
import {
  initializeUIControls,
  addPassiveEventListeners,
} from "./uiControls.js";
import {
  setCurrentCountry,
  loadNominalGeneratorCapacityData,
  loadOptimalGeneratorCapacityData,
  loadNominalStorageCapacityData,
  loadOptimalStorageCapacityData,
  loadLineData,
} from "./dataLoaders.js";
import { createScenarioControls } from "./scenarios.js";
import { createOverlays } from "./overlays.js";
import { toggleSync } from "./scenarios.js";

function onCountrySelected(country) {
  console.log(`Country selected: ${country}`);
  loadNominalGeneratorCapacityData(country);
  loadOptimalGeneratorCapacityData(country);
  loadNominalStorageCapacityData(country);
  loadOptimalStorageCapacityData(country);
  loadLineData(country);
}

function setupLayerToggleListeners(layers) {
  document.querySelectorAll('.layer-toggle input[type="checkbox"]').forEach(checkbox => {
    checkbox.addEventListener('change', () => {
      const layerId = checkbox.id.replace('toggle-', '');
      if (layers[layerId]) {
        layers[layerId].setVisible(checkbox.checked);
      }
      updateLayerVisibility(layers);
    });
  });
}

window.onload = async () => {
  try {
    const map = await init("js-map");
    window.map = map;
    let overlays = createOverlays(map);
    window.overlays = overlays;

    const defaultCountry = "United States";
    setCurrentCountry(defaultCountry);

    let layers = loadLayers(map, defaultCountry);

    addDownloadEventListeners();
    addMapEventHandlers(
      map,
      layers.buses,
      layers.lines,
      overlays,
      defaultCountry
    );
    addMapRotationInteraction(map);
    initializeSearch(map, (selectedCountry) => {
      clearLayers(map);
      setCurrentCountry(selectedCountry);
      layers = loadLayers(map, selectedCountry);
      overlays = createOverlays(map);
      window.overlays = overlays;
      addMapEventHandlers(
        map,
        layers.buses,
        layers.lines,
        overlays,
        selectedCountry
      );
      addLayerVisibilityHandlers(layers);
      updateLayerVisibility(layers);
      setupLayerToggleListeners(layers);
      onCountrySelected(selectedCountry);
    });
    addLayerVisibilityHandlers(layers);
    initializeUrlHandling(map);
    initializeUIControls(map, layers);

    setupLayerToggleListeners(layers);

    loadNominalGeneratorCapacityData(defaultCountry);
    loadOptimalGeneratorCapacityData(defaultCountry);
    loadNominalStorageCapacityData(defaultCountry);
    loadOptimalStorageCapacityData(defaultCountry);
    loadLineData(defaultCountry);

    document.addEventListener("DOMContentLoaded", (event) => {
      addPassiveEventListeners();
    });

    const toggleSyncButton = document.getElementById("toggleSyncButton");
    if (toggleSyncButton) {
      toggleSyncButton.addEventListener("click", function () {
        const isEnabled = toggleSync();
        this.textContent = isEnabled
          ? "Desactivar Sincronización"
          : "Activar Sincronización";
      });
    } else {
      console.warn("Toggle sync button not found");
    }

    setTimeout(() => {
      createScenarioControls();
    }, 0);

    adjustLegendPosition();

    window.addEventListener('resize', () => {
      adjustLegendPosition();
      map.updateSize();
    });
  } catch (error) {
    console.error("Error initializing the application:", error);
  }
};
