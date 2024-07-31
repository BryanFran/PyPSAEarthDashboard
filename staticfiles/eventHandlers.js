/*
 * SPDX-FileCopyrightText: 2024 Bryan Ramirez
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
import {
  handleMapClick,
  createOverlays,
  handleBusClick,
  handleLineClick,
} from "./overlays.js";
import { resetCharts, getCurrentCountry } from "./dataLoaders.js";

export function addMapEventHandlers(map, busesLayer, linesLayer) {
  const overlays = createOverlays(map);
  const { labelElement, lineLabelElement } = overlays;

  map.on("singleclick", function (evt) {
    const viewResolution = map.getView().getResolution();
    const country = getCurrentCountry();
    const buffer = 1000;

    const clickHandled = handleMapClick(
      evt,
      map,
      country,
      labelElement,
      lineLabelElement,
      busesLayer,
      linesLayer
    );

    if (!clickHandled) {
      const busUrl = busesLayer
        .getSource()
        .getFeatureInfoUrl(evt.coordinate, viewResolution, "EPSG:3857", {
          INFO_FORMAT: "application/json",
          buffer: buffer,
        });

      if (busUrl) {
        fetch(busUrl)
          .then((response) => response.json())
          .then((data) => {
            console.log("Bus data received:", data);

            if (data.features && data.features.length > 0) {
              handleBusClick(evt, labelElement, map, country, data.features[0])
                .then((handled) => {
                  if (!handled) {
                    resetCharts(country).catch((error) => console.error(error));
                  }
                })
                .catch((error) => console.error(error));
            } else {
              resetCharts(country).catch((error) => console.error(error));
            }
          })
          .catch((error) => console.error(error));
      }

      const lineUrl = linesLayer
        .getSource()
        .getFeatureInfoUrl(evt.coordinate, viewResolution, "EPSG:3857", {
          INFO_FORMAT: "application/json",
          buffer: buffer,
        });

      if (lineUrl) {
        fetch(lineUrl)
          .then((response) => response.json())
          .then((data) => {
            console.log("Line data received:", data);

            if (data.features && data.features.length > 0) {
              handleLineClick(evt, lineLabelElement, map, country, data.features[0])
                .then((handled) => {
                  if (!handled) {
                    resetCharts(country).catch((error) => console.error(error));
                  }
                })
                .catch((error) => console.error(error));
            } else {
              if (!busUrl) {
                resetCharts(country).catch((error) => console.error(error));
              }
            }
          })
          .catch((error) => console.error(error));
      }
    }
  });
}