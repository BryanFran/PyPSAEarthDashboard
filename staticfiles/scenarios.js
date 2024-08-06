/*
 * SPDX-FileCopyrightText: 2024 Bryan Ramirez
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
import {
  createScenarioCapexOpexChart,
  createScenarioCostDistributionChart,
  createScenarioCapacityComparisonChart,
} from "./charts.js";

var mapInstances = {};
let isSyncEnabled = true;

class SyncControl extends ol.control.Control {
  constructor(options = {}) {
    const button = document.createElement("button");
    button.innerHTML = "⇄";
    button.title = "Activar/Desactivar Sincronización";

    const element = document.createElement("div");
    element.className = "ol-unselectable ol-control sync-control";
    element.appendChild(button);

    super({
      element: element,
      target: options.target,
    });

    button.addEventListener("click", this.handleSyncToggle.bind(this), false);
  }

  handleSyncToggle() {
    const isEnabled = toggleSync();
    this.element.classList.toggle("sync-enabled", isEnabled);
    this.element.title = isEnabled
      ? "Desactivar Sincronización"
      : "Activar Sincronización";
  }
}

export function createScenarioControls() {
  const scenarios = [
    { mapId: "map1", chartId: "chart1", carrier: "solar", variable: "cf", scenario: "2021" },
    { mapId: "map2", chartId: "chart2", carrier: "solar", variable: "cf", scenario: "2050" },
  ];

  scenarios.forEach(({ mapId, chartId, carrier, variable, scenario }) => {
    const mapElement = document.getElementById(mapId);
    const chartElement = document.getElementById(chartId);
    if (!mapElement || !chartElement) {
      console.error(`Element with id ${mapId} or ${chartId} not found`);
      return;
    }

    // Create map controls
    const selectContainer = document.createElement("div");
    selectContainer.className = "map-select-container";

    const carrierSelect = document.createElement("select");
    carrierSelect.id = `carrierSelector-${mapId}`;
    carrierSelect.className = "map-carrier-selector";
    ["solar", "onwind", "offwind-ac", "offwind-dc", "ror"].forEach((c) => {
      const option = document.createElement("option");
      option.value = c;
      option.textContent = c.charAt(0).toUpperCase() + c.slice(1);
      carrierSelect.appendChild(option);
    });

    const variableSelect = document.createElement("select");
    variableSelect.id = `variableSelector-${mapId}`;
    variableSelect.className = "map-variable-selector";
    ["cf", "crt", "usdpt"].forEach((v) => {
      const option = document.createElement("option");
      option.value = v;
      option.textContent = v.toUpperCase();
      variableSelect.appendChild(option);
    });

    const scenarioSelect = document.createElement("select");
    scenarioSelect.id = `scenarioSelector-${mapId}`;
    scenarioSelect.className = "map-scenario-selector";
    ["2021", "2050"].forEach((s) => {
      const option = document.createElement("option");
      option.value = s;
      option.textContent = s;
      scenarioSelect.appendChild(option);
    });

    const legendDiv = document.createElement("div");
    legendDiv.id = `map-legend-${mapId}`;
    legendDiv.className = "map-legend";

    selectContainer.appendChild(carrierSelect);
    selectContainer.appendChild(variableSelect);
    selectContainer.appendChild(scenarioSelect);
    selectContainer.appendChild(legendDiv);
    mapElement.appendChild(selectContainer);

    // Create chart containers
    const economicChartsContainer = document.createElement("div");
    economicChartsContainer.className = "economic-charts-container";

    ['capex-opex', 'cost-distribution', 'capacity-comparison'].forEach(chartType => {
      const chartCanvas = document.createElement("canvas");
      chartCanvas.id = `${chartType}-chart-${chartId}`;
      chartCanvas.style.width = '100%';
      chartCanvas.style.height = '250px'; 
      economicChartsContainer.appendChild(chartCanvas);
    });

    chartElement.appendChild(economicChartsContainer);

    // Set up event listeners
    [carrierSelect, variableSelect, scenarioSelect].forEach((select) => {
      select.addEventListener("change", () => {
        updateMap(mapId);
        updateEconomicCharts(chartId);
      });
    });

    // Set initial values
    carrierSelect.value = carrier;
    variableSelect.value = variable;
    scenarioSelect.value = scenario;

    // Initialize scenario map
    initializeScenarioMap(mapId, carrier, variable, scenario);

    // Initialize economic charts
    updateEconomicCharts(chartId);
  });

  // Synchronize initial view of maps
  const firstMap = mapInstances[scenarios[0].mapId];
  if (firstMap) {
    Object.keys(mapInstances).forEach((mapId) => {
      if (mapId !== scenarios[0].mapId) {
        mapInstances[mapId].getView().setCenter(firstMap.getView().getCenter());
        mapInstances[mapId].getView().setZoom(firstMap.getView().getZoom());
      }
    });
  }
}

export function updateMap(mapId) {
  const carrier = document.getElementById(`carrierSelector-${mapId}`).value;
  const variable = document.getElementById(`variableSelector-${mapId}`).value;
  const scenario = document.getElementById(`scenarioSelector-${mapId}`).value;
  console.log("Updating map:", mapId, carrier, variable, scenario);

  const map = mapInstances[mapId];
  if (!map) {
    console.error(`Map instance not found for mapId: ${mapId}`);
    return;
  }

  const vectorLayer = map
    .getLayers()
    .getArray()
    .find((layer) => layer instanceof ol.layer.Vector);
  if (vectorLayer) {
    const source = vectorLayer.getSource();
    const newUrl = `${window.GEOSERVER_URL}/wfs?service=WFS&version=1.0.0&request=GetFeature&typeName=${window.GEOSERVER_WORKSPACE}:geojson_generators_combined_data_US_${scenario}&outputFormat=application/json`;
    source.setUrl(newUrl);

    source.clear();
    source.refresh();
    source.once("change", function (e) {
      if (source.getState() === "ready") {
        vectorLayer.setStyle((feature) =>
          getChoroplethStyle(feature, variable, carrier, mapId)
        );
        const features = source.getFeatures();
        createLegend(mapId, variable, carrier, features);
        map.updateSize();
      }
    });
  }
}

export async function initializeScenarioMap(
  mapId,
  carrier,
  variable,
  scenario
) {
  console.log("Initializing map:", mapId, carrier, variable, scenario);
  const mapElement = document.getElementById(mapId);
  if (!mapElement) return;

  const longitude = -98.5795;
  const latitude = 39.8283;

  if (mapInstances[mapId]) {
    mapInstances[mapId].setTarget(null);
  }

  let wfsUrl = `${window.GEOSERVER_URL}/wfs?service=WFS&version=1.0.0&request=GetFeature&typeName=${window.GEOSERVER_WORKSPACE}:geojson_generators_combined_data_US_${scenario}&outputFormat=application/json`;
  console.log("WFS URL:", wfsUrl);

  const vectorSource = new ol.source.Vector({
    format: new ol.format.GeoJSON(),
    url: wfsUrl,
    strategy: ol.loadingstrategy.all,
  });

  const vectorLayer = new ol.layer.Vector({
    source: vectorSource,
    style: (feature) => getChoroplethStyle(feature, variable, carrier, mapId),
  });

  const map = new ol.Map({
    target: mapId,
    layers: [
      new ol.layer.Tile({
        source: new ol.source.OSM(),
      }),
      vectorLayer,
    ],
    view: new ol.View({
      center: ol.proj.fromLonLat([longitude, latitude]),
      zoom: 4,
    }),
    controls: ol.control.defaults().extend([new SyncControl({})]),
    interactions: ol.interaction.defaults({ mouseWheelZoom: false }).extend([
      new ol.interaction.MouseWheelZoom({
        constrainResolution: true,
        maxDelta: 1,
        duration: 10,
      }),
    ]),
  });

  mapInstances[mapId] = map;

  map.getView().on("change:center", function () {
    syncMaps(mapId, "center");
  });
  map.getView().on("change:resolution", function () {
    syncMaps(mapId, "zoom");
  });

  try {
    const response = await fetch(wfsUrl);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    const features = new ol.format.GeoJSON().readFeatures(data);
    console.log("Loaded features:", features);
    if (features.length > 0) {
      console.log("Sample feature properties:", features[0].getProperties());
      console.log("Unique carriers:", [
        ...new Set(features.map((f) => f.get("carrier"))),
      ]);
      console.log(
        "Feature count by carrier:",
        features.reduce((acc, f) => {
          const carrier = f.get("carrier");
          acc[carrier] = (acc[carrier] || 0) + 1;
          return acc;
        }, {})
      );
    }
    features.forEach((feature) => {
      vectorSource.addFeature(feature);
    });
    createLegend(mapId, variable, carrier, features);
  } catch (error) {
    console.error("Error fetching data:", error);
    console.log("WFS URL that caused the error:", wfsUrl);
  }

  const tooltip = document.createElement("div");
  tooltip.className = "tooltip";
  tooltip.style.position = "absolute";
  tooltip.style.background = "rgba(255, 255, 255, 0.9)";
  tooltip.style.border = "1px solid #ccc";
  tooltip.style.padding = "10px";
  tooltip.style.pointerEvents = "none";
  tooltip.style.display = "none";
  tooltip.style.zIndex = "1000";
  document.body.appendChild(tooltip);

  map.on("click", function (evt) {
    const pixel = map.getEventPixel(evt.originalEvent);
    const feature = map.forEachFeatureAtPixel(pixel, function (feature) {
      return feature;
    });

    if (feature) {
      const properties = feature.getProperties();
      const geographicName =
        properties.gepgraphic_name || properties.name || "N/A";
      const carrier = properties.carrier || "N/A";
      const cf = properties.cf != null ? properties.cf.toFixed(4) : "N/A";
      const crt = properties.crt != null ? properties.crt.toFixed(4) : "N/A";
      const usdpt =
        properties.usdpt != null ? properties.usdpt.toFixed(4) : "N/A";

      if (carrier !== "load") {
        tooltip.innerHTML = `
          <b>${geographicName}</b><br>
          Carrier: ${carrier}<br>
          CF: ${cf}<br>
          CRT: ${crt}<br>
          USDPT: ${usdpt}
        `;
        tooltip.style.left = `${evt.pixel[0] + 10}px`;
        tooltip.style.top = `${evt.pixel[1] + 10}px`;
        tooltip.style.display = "block";
        console.log("Tooltip content:", tooltip.innerHTML);
      } else {
        tooltip.style.display = "none";
      }
    } else {
      tooltip.style.display = "none";
    }
  });
}

function createLegend(mapId, variable, carrier, features) {
  const legendElement = document.getElementById(`map-legend-${mapId}`);
  if (!legendElement) {
    console.warn(`Legend element not found for mapId: ${mapId}`);
    return;
  }

  const values = features
    .filter((f) => f.get("carrier") === carrier)
    .map((f) => parseFloat(f.get(variable)))
    .filter((v) => !isNaN(v) && isFinite(v))
    .sort((a, b) => a - b);

  if (values.length === 0) {
    legendElement.innerHTML = "<div><b>No data available</b></div>";
    return;
  }

  const minValue = values[0];
  const maxValue = values[values.length - 1];

  const colorScale = carrierColorScales[carrier] || defaultColorScale;
  const chromaScale = chroma.scale(colorScale).domain([minValue, maxValue]);

  const steps = 5;
  const stepSize = (maxValue - minValue) / (steps - 1);

  let legendHTML = `<div><b>Legend - ${carrier}</b></div>`;
  for (let i = 0; i < steps; i++) {
    const value = minValue + i * stepSize;
    const color = chromaScale(value).hex();
    const decimals = maxValue - minValue < 0.01 ? 4 : 3;

    legendHTML += `
      <div style="display: flex; align-items: center; margin-bottom: 5px;">
        <span style="background-color:${color};width:20px;height:20px;display:inline-block;margin-right:5px;"></span>
        <span>${value.toFixed(decimals)}</span>
      </div>
    `;
  }

  legendElement.innerHTML = legendHTML;
}

const carrierColorScales = {
  solar: ["#FFFF00", "#FF0000"],
  onwind: ["#00FFFF", "#0000FF"],
  "offwind-ac": ["#00FF00", "#008000"],
  "offwind-dc": ["#00FF80", "#004D40"],
  ror: ["#80FF00", "#4B8A08"],
  biomass: ["#FF8000", "#8B4513"],
  coal: ["#808080", "#000000"],
  oil: ["#FFA07A", "#8B0000"],
  CCGT: ["#FFD700", "#B8860B"],
  geothermal: ["#FF69B4", "#8B008B"],
  lignite: ["#D2691E", "#8B4513"],
  nuclear: ["#7FFF00", "#006400"],
};

const defaultColorScale = ["#FFFFFF", "#000000"];

function getChoroplethStyle(feature, variable, carrier, mapId) {
  if (!feature || feature.get("carrier") !== carrier) {
    return null;
  }

  let value = parseFloat(feature.get(variable));
  if (isNaN(value) || !isFinite(value)) {
    return new ol.style.Style({
      fill: new ol.style.Fill({
        color: "rgba(200, 200, 200, 0.5)",
      }),
      stroke: new ol.style.Stroke({
        color: "#000000",
        width: 0.1,
      }),
    });
  }

  const allFeatures = mapInstances[mapId]
    .getLayers()
    .getArray()
    .find((layer) => layer instanceof ol.layer.Vector)
    .getSource()
    .getFeatures();

  const allValues = allFeatures
    .filter((f) => f.get("carrier") === carrier)
    .map((f) => parseFloat(f.get(variable)))
    .filter((v) => !isNaN(v) && isFinite(v));

  if (allValues.length === 0) {
    return new ol.style.Style({
      fill: new ol.style.Fill({
        color: "rgba(200, 200, 200, 0.5)",
      }),
      stroke: new ol.style.Stroke({
        color: "#000000",
        width: 0.1,
      }),
    });
  }

  const minValue = Math.min(...allValues);
  const maxValue = Math.max(...allValues);

  const colorScale = carrierColorScales[carrier] || defaultColorScale;
  const chromaScale = chroma.scale(colorScale).domain([minValue, maxValue]);

  const color = chromaScale(value).rgba();

  return new ol.style.Style({
    fill: new ol.style.Fill({
      color: `rgba(${color[0]}, ${color[1]}, ${color[2]}, 0.7)`,
    }),
    stroke: new ol.style.Stroke({
      color: "#000000",
      width: 0.1,
    }),
  });
}

function syncMaps(sourceMapId, changeType) {
  if (!isSyncEnabled) return;

  Object.keys(mapInstances).forEach((mapId) => {
    if (mapId !== sourceMapId) {
      const sourceMap = mapInstances[sourceMapId];
      const targetMap = mapInstances[mapId];

      if (changeType === "center") {
        targetMap.getView().setCenter(sourceMap.getView().getCenter());
      } else if (changeType === "zoom") {
        targetMap.getView().setZoom(sourceMap.getView().getZoom());
      }
    }
  });
}

export function toggleSync() {
  isSyncEnabled = !isSyncEnabled;
  console.log(
    `Sincronización de mapas ${isSyncEnabled ? "activada" : "desactivada"}`
  );
  return isSyncEnabled;
}

function areCoordinatesEqual(coord1, coord2) {
  return coord1[0] === coord2[0] && coord1[1] === coord2[1];
}

export async function loadEconomicData(country, scenario) {
  const url = `/api/economic-data/${country}/${scenario}/`;
  console.log(`Fetching economic data from: ${url}`);
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    console.log(`Received economic data:`, data);
    if (data && data.length > 0) {
      console.log("Sample data structure:", JSON.stringify(data[0], null, 2));
    }
    return data;
  } catch (error) {
    console.error("Error loading economic data:", error);
    return null;
  }
}

export function createCapexOpexChart(data, chartId) {
  if (!data || data.length === 0) {
    console.warn(`No data available for CAPEX vs OPEX chart (${chartId})`);
    return;
  }

  const chartData = {
    labels: data.map((item, index) => `Generator ${index + 1}`),
    datasets: [
      {
        label: "CAPEX",
        data: data.map((item) => item["Capital Expenditure"]),
        backgroundColor: "rgba(75, 192, 192, 0.6)",
      },
      {
        label: "OPEX",
        data: data.map((item) => item["Operational Expenditure"]),
        backgroundColor: "rgba(255, 99, 132, 0.6)",
      },
    ],
  };

  try {
    initChart(
      chartId,
      chartData,
      "bar",
      "CAPEX vs OPEX por Generador",
      "Costo ($)",
      "Generador"
    );
  } catch (error) {
    console.error(`Error creating CAPEX vs OPEX chart (${chartId}):`, error);
  }
}

export function createCostDistributionChart(data, chartId) {
  const totalCosts = data.map((item, index) => ({
    label: `Generator ${index + 1}`,
    value: item["Capital Expenditure"] + item["Operational Expenditure"],
  }));

  createPieChart(chartId, totalCosts, "Distribución de Costos Totales");
}

export function createCapacityComparisonChart(data, chartId) {
  const chartData = {
    labels: data.map((item, index) => `Generator ${index + 1}`),
    datasets: [
      {
        label: "Installed Capacity",
        data: data.map((item) => item["Installed Capacity"]),
        backgroundColor: "rgba(54, 162, 235, 0.6)",
      },
      {
        label: "Optimal Capacity",
        data: data.map((item) => item["Optimal Capacity"]),
        backgroundColor: "rgba(255, 206, 86, 0.6)",
      },
    ],
  };

  initChart(
    chartId,
    chartData,
    "bar",
    "Installed vs Optimal Capacity",
    "Capacity",
    "Generator"
  );
}

export async function updateEconomicCharts(chartId) {
  console.log(`Updating economic charts for ${chartId}`);
  const mapId = chartId.replace('chart', 'map');
  const scenario = document.getElementById(`scenarioSelector-${mapId}`).value;
  console.log(`Scenario selected: ${scenario}`);
  
  try {
    const economicData = await loadEconomicData('United States', scenario);
    console.log('Economic data loaded:', economicData);
    
    if (economicData && economicData.length > 0) {
      try {
        console.log(`Creating CAPEX vs OPEX chart for ${chartId}`);
        createScenarioCapexOpexChart(economicData, `capex-opex-chart-${chartId}`);
        console.log(`Creating Cost Distribution chart for ${chartId}`);
        createScenarioCostDistributionChart(economicData, `cost-distribution-chart-${chartId}`);
        console.log(`Creating Capacity Comparison chart for ${chartId}`);
        createScenarioCapacityComparisonChart(economicData, `capacity-comparison-chart-${chartId}`);
      } catch (error) {
        console.error(`Error creating charts for ${chartId}:`, error);
      }
    } else {
      console.warn(`No economic data available for scenario ${scenario}`);
      ['capex-opex', 'cost-distribution', 'capacity-comparison'].forEach(chartType => {
        const chartElement = document.getElementById(`${chartType}-chart-${chartId}`);
        if (chartElement) {
          chartElement.innerHTML = 'No data available';
        } else {
          console.error(`Chart element ${chartType}-chart-${chartId} not found`);
        }
      });
    }
  } catch (error) {
    console.error(`Error updating economic charts for scenario ${scenario}:`, error);
    ['capex-opex', 'cost-distribution', 'capacity-comparison'].forEach(chartType => {
      const chartElement = document.getElementById(`${chartType}-chart-${chartId}`);
      if (chartElement) {
        chartElement.innerHTML = 'Error loading data';
      } else {
        console.error(`Chart element ${chartType}-chart-${chartId} not found`);
      }
    });
  }
}