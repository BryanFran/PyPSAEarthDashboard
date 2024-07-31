/*
 * SPDX-FileCopyrightText: 2024 Bryan Ramirez
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
import {
  loadNominalGeneratorCapacityData,
  loadOptimalGeneratorCapacityData,
  loadNominalStorageCapacityData,
  loadOptimalStorageCapacityData,
  loadLineData,
} from "./dataLoaders.js";

export function createOverlays(map) {
  const labelElement = document.createElement("div");
  labelElement.id = "map-label";
  labelElement.style.position = "absolute";
  labelElement.style.backgroundColor = "rgba(255, 255, 255, 0.7)";
  labelElement.style.padding = "2px";
  labelElement.style.borderRadius = "5px";
  labelElement.style.fontSize = "0.7rem";
  labelElement.style.whiteSpace = "nowrap";
  labelElement.style.fontWeight = "bold";
  labelElement.style.display = "none";
  labelElement.style.zIndex = "1000";

  document.body.appendChild(labelElement);
  console.log("map-label element created and appended to body");

  const lineLabelElement = document.createElement("div");
  lineLabelElement.id = "line-map-label";
  lineLabelElement.style.position = "absolute";
  lineLabelElement.style.backgroundColor = "rgba(255, 255, 255, 0.7)";
  lineLabelElement.style.padding = "2px";
  lineLabelElement.style.borderRadius = "5px";
  lineLabelElement.style.fontSize = "0.7rem";
  lineLabelElement.style.whiteSpace = "nowrap";
  lineLabelElement.style.fontWeight = "bold";
  lineLabelElement.style.display = "none";
  lineLabelElement.style.zIndex = "1000";

  document.body.appendChild(lineLabelElement);
  console.log("line-map-label element created and appended to body");

  return { labelElement, lineLabelElement };
}

function createTooltip(element, content) {
  console.log("Creating tooltip for element with content:", content);
  if (element._tooltip) {
    element._tooltip.setContent(content);
  } else {
    element._tooltip = tippy(element, {
      content: content,
      trigger: 'manual',
      placement: 'bottom-start',
      arrow: true,
      appendTo: document.body,
      offset: [0, 10],
    });
    console.log("Tooltip created for element:", element);
  }
  return element._tooltip;
}

function showTooltip(tooltip, map, coordinate) {
  console.log("Attempting to show tooltip at coordinate:", coordinate);
  if (!tooltip || !tooltip.popper) {
    console.error("Tooltip popper instance not found");
    return;
  }

  if (!Array.isArray(coordinate) || coordinate.length !== 2 || coordinate.some(isNaN)) {
    console.error("Invalid coordinate:", coordinate);
    return;
  }

  const mapProjection = map.getView().getProjection();
  const projectedCoordinate = ol.proj.fromLonLat(coordinate, mapProjection);

  console.log("Projected coordinate:", projectedCoordinate);

  const pixel = map.getPixelFromCoordinate(projectedCoordinate);
  console.log("Pixel for label positioning:", pixel);

  if (!pixel || pixel.length !== 2 || pixel.some(isNaN)) {
    console.error("Invalid pixel coordinates:", pixel);
    return;
  }

  const mapElement = map.getTargetElement();
  const mapRect = mapElement.getBoundingClientRect();

  const left = Math.round(pixel[0]);
  const top = Math.round(pixel[1]);

  console.log("Map rect:", mapRect);
  console.log("Calculated left:", left, "Calculated top:", top);

  if (left >= 0 && left <= mapRect.width && top >= 0 && top <= mapRect.height) {
    tooltip.setProps({
      getReferenceClientRect: () => ({
        width: 0,
        height: 0,
        top: top + mapRect.top,
        left: left + mapRect.left,
        right: left + mapRect.left,
        bottom: top + mapRect.top,
      })
    });

    tooltip.popper.style.position = 'absolute';
    tooltip.popper.style.top = `${top + mapRect.top}px`;
    tooltip.popper.style.left = `${left + mapRect.left}px`;

    tooltip.show();
    console.log("Tooltip shown at pixel:", [left, top]);
  } else {
    console.error("Calculated coordinates are outside the map view:", { left, top });
  }
}

export function handleBusClick(event, labelElement, map, country, feature) {
  console.log("handleBusClick called with feature:", feature);

  if (!feature || !feature.properties) {
    console.error("Feature or properties not found");
    return Promise.resolve(false);
  }

  let coordinate;
  if (feature.geometry.type === 'Point') {
    coordinate = ol.proj.transform(feature.geometry.coordinates, 'EPSG:3857', 'EPSG:4326');
    console.log("Original bus coordinate:", coordinate);
  } else {
    console.error("Unexpected geometry type for bus:", feature.geometry.type);
    return Promise.resolve(false);
  }

  const busId = feature.properties.Bus;

  console.log(`Clicked bus ID: ${busId}`);
  console.log("Feature properties:", feature.properties);

  const tooltip = createTooltip(labelElement, `Bus: ${busId}`);
  showTooltip(tooltip, map, coordinate);
  labelElement.style.display = 'block';

  return Promise.all([
    loadNominalGeneratorCapacityData(country, busId),
    loadOptimalGeneratorCapacityData(country, busId),
    loadNominalStorageCapacityData(country, busId),
    loadOptimalStorageCapacityData(country, busId),
  ]).then(() => true).catch((error) => {
    console.error(`Error loading data for bus ${busId}:`, error);
    return false;
  });
}

export function handleLineClick(event, lineLabelElement, map, country, feature) {
  console.log("handleLineClick called with feature:", feature);

  if (!feature || !feature.properties) {
    console.error("Feature or properties not found");
    return Promise.resolve(false);
  }

  const lineId = feature.properties.Line;
  let coordinates;
  if (feature.geometry.type === 'LineString') {
    coordinates = feature.geometry.coordinates.map(coord => 
      ol.proj.transform(coord, 'EPSG:3857', 'EPSG:4326')
    );
  } else {
    console.error("Unexpected geometry type for line:", feature.geometry.type);
    return Promise.resolve(false);
  }

  const midPoint = [
    (coordinates[0][0] + coordinates[coordinates.length - 1][0]) / 2,
    (coordinates[0][1] + coordinates[coordinates.length - 1][1]) / 2
  ];
  console.log("Line midpoint:", midPoint);

  console.log(`Clicked line ID: ${lineId}`);
  console.log("Feature properties:", feature.properties);

  const tooltip = createTooltip(lineLabelElement, `Line: ${lineId}`);
  showTooltip(tooltip, map, midPoint);
  lineLabelElement.style.display = 'block';

  return loadLineData(country, lineId)
    .then(() => {
      console.log(`Data loaded for line ${lineId}`);
      return true;
    })
    .catch((error) => {
      console.error(`Error loading data for line ${lineId}:`, error);
      return false;
    });
}

export function handleMapClick(event, map, country, labelElement, lineLabelElement, busesLayer, linesLayer) {
  const clickedCoordinate = event.coordinate;
  
  const busFeature = map.forEachFeatureAtPixel(event.pixel, function(feature) {
    return feature;
  }, {
    layerFilter: function(layer) {
      return layer === busesLayer;
    },
    hitTolerance: 5
  });

  if (busFeature) {
    handleBusClick(event, labelElement, map, country, busFeature);
    lineLabelElement.style.display = 'none';
    return true;
  }

  const lineFeature = map.forEachFeatureAtPixel(event.pixel, function(feature) {
    return feature;
  }, {
    layerFilter: function(layer) {
      return layer === linesLayer;
    }
  });

  if (lineFeature) {
    handleLineClick(event, lineLabelElement, map, country, lineFeature);
    labelElement.style.display = 'none';
    return true;
  }

  labelElement.style.display = 'none';
  lineLabelElement.style.display = 'none';

  return false;
}