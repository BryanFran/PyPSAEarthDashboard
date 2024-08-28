/*
 * SPDX-FileCopyrightText: 2024 Bryan Ramirez
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
let currentCountry = "United States";

export function setCurrentCountry(country) {
  currentCountry = country;
  console.log(`Current country set to: ${currentCountry}`);
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
    africa_shape: "geojson_africa_shape_US",
    offshore_shapes: "geojson_offshore_shapes_US",
    gadm_shapes: "geojson_gadm_shapes_US",
    countries: "geojson_country_shapes_US",
    all_clean_lines: "geojson_all_clean_lines_US",
    substations: "geojson_all_clean_substations_US",
    generators: "geojson_all_clean_generators_US",
    lines: "geojson_network_lines_view_US",
    buses: "geojson_Buses_geojson_data_US",
  },
};

export function createWFSDownloadUrl(layerName) {
  console.log(`Creating URL for country: ${currentCountry}, layer: ${layerName}`);
  
  if (!layerMappings[currentCountry]) {
    console.error(`No layer mappings found for country: ${currentCountry}`);
    return null;
  }

  const countrySpecificLayerName = layerMappings[currentCountry][layerName];

  if (!countrySpecificLayerName) {
    console.error(`No specific layer name found for ${layerName} in ${currentCountry}`);
    return null;
  }

  const cleanedLayerName = countrySpecificLayerName.replace(`${window.GEOSERVER_WORKSPACE}:`, '');

  console.log(`Country specific layer name: ${cleanedLayerName}`);

  return `${window.GEOSERVER_URL}/ows?service=WFS&version=2.0.0&request=GetFeature&typeName=${window.GEOSERVER_WORKSPACE}:${cleanedLayerName}&outputFormat=application/json`;
}

export function downloadLayerData(layerName) {
  const mappingLayerName = layerName.replace(/-/g, '_');
  console.log(
    `Downloading data for country: ${currentCountry}, layer: ${mappingLayerName}`
  );
  console.log(`GEOSERVER_URL: ${window.GEOSERVER_URL}`);
  console.log(`GEOSERVER_WORKSPACE: ${window.GEOSERVER_WORKSPACE}`);
  const url = createWFSDownloadUrl(mappingLayerName);
  if (!url) {
    console.error("Failed to create download URL");
    return;
  }

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
    layerControls.removeEventListener("click", handleDownloadClick);
    layerControls.addEventListener("click", handleDownloadClick);
  } else {
    console.warn(
      "Layer controls element not found. Download listeners not added."
    );
  }
}

function handleDownloadClick(event) {
  if (event.target.classList.contains("fa-download")) {
    const layerName = event.target.id.replace("download-", "");
    downloadLayerData(layerName);
  }
}