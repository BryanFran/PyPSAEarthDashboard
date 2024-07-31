/*
 * SPDX-FileCopyrightText: 2024 Bryan Ramirez
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const wmsLayers = {
  Nigeria: {
    africa_shape: "PyPSAEarthDashboard:africa_shape",
    offshore_shapes: "PyPSAEarthDashboard:offshore_shapes",
    gadm_shapes: "PyPSAEarthDashboard:gadm_shapes",
    countries: "PyPSAEarthDashboard:country_shapes",
    all_clean_lines: "PyPSAEarthDashboard:all_clean_lines",
    substations: "PyPSAEarthDashboard:all_clean_substations",
    generators: "PyPSAEarthDashboard:All_clean_generators",
    lines: "PyPSAEarthDashboard:network_lines_view",
    buses: "PyPSAEarthDashboard:Buses_geojson_data",
  },
  Colombia: {
    africa_shape: "PyPSAEarthDashboard:geojson_africa_shape_CO",
    offshore_shapes: "PyPSAEarthDashboard:geojson_offshore_shapes_CO",
    gadm_shapes: "PyPSAEarthDashboard:geojson_gadm_shapes_CO",
    countries: "PyPSAEarthDashboard:geojson_country_shapes_CO",
    all_clean_lines: "PyPSAEarthDashboard:geojson_all_clean_lines_CO",
    substations: "PyPSAEarthDashboard:geojson_all_clean_substations_CO",
    generators: "PyPSAEarthDashboard:geojson_all_clean_generators_CO",
    lines: "PyPSAEarthDashboard:geojson_network_lines_view_co_2",
    buses: "PyPSAEarthDashboard:geojson_Buses_geojson_data_CO_2",
  },
  "United States": {
    africa_shape: "PyPSAEarthDashboard:geojson_africa_shape_US",
    offshore_shapes: "PyPSAEarthDashboard:geojson_offshore_shapes_US",
    gadm_shapes: "PyPSAEarthDashboard:geojson_gadm_shapes_US",
    countries: "PyPSAEarthDashboard:geojson_country_shapes_US",
    all_clean_lines: "PyPSAEarthDashboard:geojson_all_clean_lines_US",
    substations: "PyPSAEarthDashboard:geojson_all_clean_substations_US",
    generators: "PyPSAEarthDashboard:geojson_all_clean_generators_US",
    lines: "PyPSAEarthDashboard:geojson_network_lines_view_US",
    buses: "PyPSAEarthDashboard:geojson_Buses_geojson_data_US",
  },
};

export function loadLayers(map, country) {
  if (!map) {
    console.error("Map is undefined in loadLayers");
    return;
  }
  const layers = wmsLayers[country];

  if (!layers) {
    console.error(`No layers found for country: ${country}`);
    return;
  }

  const loadedLayers = {};

  for (const [layerName, layerIdentifier] of Object.entries(layers)) {
    const source = new ol.source.ImageWMS({
      url: `${window.GEOSERVER_URL}/wms`,
      params: {
        LAYERS: layerIdentifier,
        TILED: true,
        VERSION: "1.1.0",
        FORMAT: "image/png",
      },
      serverType: "geoserver",
    });

    const layer = new ol.layer.Image({
      source: source,
    });

    layer.set("name", layerName);

    map.addLayer(layer);
    loadedLayers[layerName] = layer;
    console.log(`Layer loaded: ${layerName}, Identifier: ${layerIdentifier}`);
  }

  return loadedLayers;
}

export function clearLayers(map) {
  const layers = map.getLayers().getArray().slice();
  layers.forEach((layer) => {
    if (layer instanceof ol.layer.Image) {
      map.removeLayer(layer);
    }
  });
}
