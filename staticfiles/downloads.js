/*
 * SPDX-FileCopyrightText: 2024 Bryan Ramirez
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
let currentCountry = "Nigeria"; // Valor por defecto

export function setCurrentCountry(country) {
  currentCountry = country;
}

const layerMappings = {
  Nigeria: {
    africa_shape: "africa_shape",
    offshore_shapes: "offshore_shapes",
    gadm_shapes: "gadm_shapes",
    countries: "country_shapes",
    all_clean_lines: "all_clean_lines",
    lines: "network_lines_view",
    generators: "All_clean_generators",
    substations: "all_clean_substations",
    buses: "Buses_geojson_data",
  },
  Colombia: {
    africa_shape: "geojson_africa_shape_CO",
    offshore_shapes: "geojson_offshore_shapes_CO",
    gadm_shapes: "geojson_gadm_shapes_CO",
    countries: "geojson_country_shapes_CO",
    all_clean_lines: "geojson_all_clean_lines_CO",
    lines: "geojson_network_lines_view_co_2",
    generators: "geojson_all_clean_generators_CO",
    substations: "geojson_all_clean_substations_CO",
    buses: "geojson_Buses_geojson_data_CO_2",
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

export function createWFSDownloadUrl(layerName) {
  const countrySpecificLayerName = layerMappings[currentCountry][layerName];
  return `${window.GEOSERVER_URL}/ows?service=WFS&version=2.0.0&request=GetFeature&typeName=${window.GEOSERVER_WORKSPACE}:${countrySpecificLayerName}&outputFormat=application/json`;
}

export function downloadLayerData(layerName) {
  console.log(
    `Downloading data for country: ${currentCountry}, layer: ${layerName}`
  );
  const url = createWFSDownloadUrl(layerName);
  console.log(`Download URL: ${url}`);

  fetch(url)
    .then((response) => response.blob())
    .then((blob) => {
      const downloadUrl = window.URL.createObjectURL(blob);
      const downloadLink = document.createElement("a");
      downloadLink.href = downloadUrl;
      downloadLink.download = `${currentCountry}_${layerName}.geojson`;
      document.body.appendChild(downloadLink);
      downloadLink.click();

      document.body.removeChild(downloadLink);
      window.URL.revokeObjectURL(downloadUrl);
    })
    .catch((error) => {
      console.error("Error downloading the file:", error);
    });
}

export function addDownloadEventListeners() {
  const layerControls = document.getElementById("layer-controls");
  if (layerControls) {
    layerControls.addEventListener("click", (event) => {
      if (event.target.classList.contains("fa-download")) {
        const layerName = event.target.id.replace("download-", "");
        downloadLayerData(layerName);
      }
    });
  } else {
    console.warn(
      "Layer controls element not found. Download listeners not added."
    );
  }
}
