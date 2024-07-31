/*
 * SPDX-FileCopyrightText: 2024 Bryan Ramirez
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
import { init } from "./init.js";
import { initializeScenarioMap, toggleSync } from "./scenarios.js";
import {
  addLayerVisibilityHandlers,
  updateLayerVisibility,
  adjustLegendPosition 
} from "./layerVisibility.js";

export let isMainMapVisible = true;

export function toggleScenarios() {
  const originalMapContainer = document.getElementById("js-map");
  const dashboardContainer = document.querySelector(".dashboard-container");

  if (
    dashboardContainer.style.display === "none" ||
    !dashboardContainer.style.display
  ) {
    dashboardContainer.style.display = "grid";
    originalMapContainer.style.display = "none";
    isMainMapVisible = false;
    initializeScenarioMap("map1", "solar", "cf", "2021");
    initializeScenarioMap("map2", "solar", "cf", "2050");
  } else {
    dashboardContainer.style.display = "none";
    originalMapContainer.style.display = "block";
    isMainMapVisible = true;
  }
}

export function toggleSidebar(side, map) {
  if (!isMainMapVisible) {
    toggleScenarios();
    return;
  }

  const body = document.body;
  const flexContainer = document.querySelector(".flex-grow-1");
  const leftBtn = document.getElementById("btn-toggle-left-sidebar");
  const rightBtn = document.getElementById("btn-toggle-right-sidebar");

  if (side === "left") {
    body.classList.toggle("show-left-sidebar");
    flexContainer.classList.toggle("map-shift-right");
  } else if (side === "right") {
    body.classList.toggle("show-right-sidebar");
    flexContainer.classList.toggle("map-shift-left");
  }

  leftBtn.classList.toggle("move-right", body.classList.contains("show-right-sidebar"));
  rightBtn.classList.toggle("move-left", body.classList.contains("show-right-sidebar"));
  map.updateSize();
  adjustLegendPosition();
  setTimeout(() => {
    map.updateSize();
    adjustLegendPosition();
  }, 300);
}

export function initializeUIControls(map, layers) {
  console.log("Initializing UI controls");

  document
    .getElementById("btn-toggle-left-sidebar")
    .addEventListener("click", function () {
      toggleSidebar("left", map);
    });

  document
    .getElementById("btn-toggle-right-sidebar")
    .addEventListener("click", function () {
      toggleSidebar("right", map);
    });

  document
    .getElementById("btn-toggle-scenarios")
    .addEventListener("click", toggleScenarios);

  addLayerVisibilityHandlers(layers);
  updateLayerVisibility(layers);

  const leftSidebar = document.getElementById("left-sidebar");
  const rightSidebar = document.getElementById("right-sidebar");

  leftSidebar.addEventListener("transitionend", adjustLegendPosition);
  rightSidebar.addEventListener("transitionend", adjustLegendPosition);
}

export function addPassiveEventListeners() {
  console.log("Adding passive event listeners");

  document.addEventListener("scroll", function (event) {}, { passive: true });

  const chartElements = document.querySelectorAll("canvas");
  chartElements.forEach((element) => {
    element.addEventListener("wheel", function (event) {}, { passive: true });
  });

  const mapContainer = document.getElementById("js-map");
  mapContainer.addEventListener("touchstart", function (event) {}, {
    passive: true,
  });

  mapContainer.addEventListener("touchmove", function (event) {}, {
    passive: true,
  });
}
