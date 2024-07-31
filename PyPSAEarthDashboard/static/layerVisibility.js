/*
 * SPDX-FileCopyrightText: 2024 Bryan Ramirez
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
export function addLayerVisibilityHandlers(layers) {
  const layerToggles = [
    { id: "toggle-africa-shape", layer: layers.africa_shape },
    { id: "toggle-offshore-shapes", layer: layers.offshore_shapes },
    { id: "toggle-gadm-shapes", layer: layers.gadm_shapes },
    { id: "toggle-countries", layer: layers.countries },
    { id: "toggle-all-clean-lines", layer: layers.all_clean_lines },
    { id: "toggle-lines", layer: layers.lines },
    { id: "toggle-all-clean-generators", layer: layers.generators },
    { id: "toggle-all-clean-substations", layer: layers.substations },
    { id: "toggle-buses", layer: layers.buses },
  ];

  layerToggles.forEach((toggle) => {
    const toggleElement = document.getElementById(toggle.id);
    if (toggleElement) {
      toggleElement.addEventListener("change", function () {
        console.log(`Layer ${toggle.id} visibility changed to ${this.checked}`);
        if (toggle.layer) {
          toggle.layer.setVisible(this.checked);
        }
      });
    } else {
      console.warn(`Toggle element with id ${toggle.id} not found`);
    }
  });
}

export function updateLayerToggles(country, layers) {
  const layerMappings = {
    Nigeria: {
      africa_shape: "Territorial Extent",
      offshore_shapes: "Offshore Land",
      gadm_shapes: "GADM Shapes",
      countries: "Country",
      all_clean_lines: "OSM Electric Lines",
      lines: "PyPSA Electric Lines",
      generators: "OSM Generators",
      substations: "OSM Substations",
      buses: "Electric Buses",
    },
    Colombia: {
      africa_shape: "Territorial Extent",
      offshore_shapes: "Offshore Land",
      gadm_shapes: "GADM Shapes",
      countries: "Country",
      all_clean_lines: "OSM Electric Lines",
      lines: "PyPSA Electric Lines",
      generators: "OSM Generators",
      substations: "OSM Substations",
      buses: "Electric Buses",
    },
    "United States": {
      africa_shape: "Territorial Extent",
      offshore_shapes: "Offshore Land",
      gadm_shapes: "GADM Shapes",
      countries: "Country",
      all_clean_lines: "OSM Electric Lines",
      lines: "PyPSA Electric Lines",
      generators: "OSM Generators",
      substations: "OSM Substations",
      buses: "Electric Buses",
    },
  };

  const layerControlsElement = document.getElementById("layer-controls");
  layerControlsElement.innerHTML = ""; 

  Object.entries(layers).forEach(([layerName, layer]) => {
    const mappedName = layerMappings[country][layerName] || layerName;
    const layerToggle = document.createElement("div");
    layerToggle.className = "layer-toggle";
    layerToggle.innerHTML = `
    <input type="checkbox" id="toggle-${layerName}" ${
      layer.getVisible() ? "checked" : ""
    }>
    <label for="toggle-${layerName}">${mappedName}</label>
    <i class="fas fa-download" id="download-${layerName}" style="cursor: pointer; margin-left: 5px;"></i>
  `;
    layerControlsElement.appendChild(layerToggle);

    const toggleElement = layerToggle.querySelector('input[type="checkbox"]');
    toggleElement.addEventListener("change", function () {
      layer.setVisible(this.checked);
      updateLayerVisibility(layers);
    });
  });

  updateLayerVisibility(layers);
}

export function updateLayerVisibility(layers) {
  const legendElement = document.getElementById("geographic-layers-legend");
  let legendHTML = "<h5>Legend</h5>";

  Object.entries(layers).forEach(([layerName, layer]) => {
    if (layer.getVisible()) {
      const source = layer.getSource();
      const params = source.getParams();
      const geoserverLayerName = params.LAYERS;
      const legendUrl = `${window.GEOSERVER_URL}/wms?REQUEST=GetLegendGraphic&VERSION=1.0.0&FORMAT=image/png&WIDTH=20&HEIGHT=20&LAYER=${geoserverLayerName}`;
      legendHTML += `
        <div class="geographic-legend-item">
          <img src="${legendUrl}" alt="${layerName}" class="geographic-legend-symbol" onerror="this.onerror=null;this.textContent='■';">
          <span class="geographic-legend-label">${layerName}</span>
        </div>
      `;
    }
  });

  legendElement.innerHTML = legendHTML;
}

export function adjustLegendPosition() {
  const legend = document.getElementById('geographic-layers-legend');
  const body = document.body;
  const leftSidebar = document.getElementById('left-sidebar');
  const rightSidebar = document.getElementById('right-sidebar');
  const toolSidebar = document.getElementById('tool-sidebar') || document.querySelector('.sidebar-tool');

  const isLeftSidebarOpen = body.classList.contains('show-left-sidebar');
  const isRightSidebarOpen = body.classList.contains('show-right-sidebar');

  if (isRightSidebarOpen) {
    
    legend.style.right = `${rightSidebar.offsetWidth + 10}px`;
    legend.style.left = 'auto';
  } else if (isLeftSidebarOpen) {
    legend.style.right = '10px';
    legend.style.left = 'auto';
  } else {
    legend.style.right = '10px';
    legend.style.left = 'auto';
  }

  if (isLeftSidebarOpen) {
    legend.style.top = '130px'; 
  } else {
    legend.style.top = '130px';
  }
}
