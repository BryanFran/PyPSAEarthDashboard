/*
 * SPDX-FileCopyrightText: 2024 Bryan Ramirez
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
import { loadLayers, clearLayers } from "./layers.js";
import { addMapEventHandlers } from "./eventHandlers.js";
import { updateLayerToggles } from "./layerVisibility.js";
import { setCurrentCountry, addDownloadEventListeners } from "./downloads.js";

export async function searchLocation(query) {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&q=${query}`
  );
  const data = await response.json();
  return data;
}

export const countryZoomLevels = {
  Nigeria: 6.11,
  Colombia: 5.74,
  "United States": 4.4,
  // New countries here...
};

export function autocomplete(inp) {
  let currentFocus;

  inp.addEventListener("input", function (e) {
    let a,
      b,
      i,
      val = this.value;
    closeAllLists();
    if (val.length < 3) {
      return false;
    }
    currentFocus = -1;

    a = document.createElement("DIV");
    a.setAttribute("id", this.id + "autocomplete-list");
    a.setAttribute("class", "autocomplete-items");
    this.parentNode.appendChild(a);

    for (i in countryZoomLevels) {
      if (i.toUpperCase().includes(val.toUpperCase())) {
        b = document.createElement("DIV");
        b.innerHTML = "<strong>" + i.substr(0, val.length) + "</strong>";
        b.innerHTML += i.substr(val.length);
        b.innerHTML += "<input type='hidden' value='" + i + "'>";
        b.addEventListener("click", function (e) {
          inp.value = this.getElementsByTagName("input")[0].value;
          closeAllLists();
          performSearch(inp.value, map, onCountrySelected);
        });
        a.appendChild(b);
      }
    }
  });

  function closeAllLists(elmnt) {
    var x = document.getElementsByClassName("autocomplete-items");
    for (var j = 0; j < x.length; j++) {
      if (elmnt != x[j] && elmnt != inp) {
        x[j].parentNode.removeChild(x[j]);
      }
    }
  }

  document.addEventListener("click", function (e) {
    closeAllLists(e.target);
  });
}

export function initializeSearch(map, onCountrySelected) {
  const searchInput = document.getElementById("location-search");
  autocomplete(searchInput);

  searchInput.addEventListener("keypress", async function (e) {
    if (e.key === "Enter") {
      e.preventDefault();
      await performSearch(this.value, map, onCountrySelected);
    }
  });

  document
    .getElementById("location-search-form")
    .addEventListener("submit", async function (e) {
      e.preventDefault();
      await performSearch(searchInput.value, map, onCountrySelected);
    });
}

async function performSearch(searchQuery, map, onCountrySelected) {
  const locations = await searchLocation(searchQuery);

  if (locations && locations.length > 0) {
    const firstLocation = locations[0];
    const coords = [
      parseFloat(firstLocation.lon),
      parseFloat(firstLocation.lat),
    ];
    const country = firstLocation.address.country;
    const zoomLevel = countryZoomLevels[country] || 10;

    map.getView().animate({
      center: ol.proj.fromLonLat(coords),
      zoom: zoomLevel,
    });

    console.log(`Search performed, setting country to: ${country}`);
    setCurrentCountry(country);
    clearLayers(map);
    const newLayers = loadLayers(map, country);
    updateLayerToggles(country, newLayers);
    addMapEventHandlers(map, newLayers.buses, newLayers.lines);
    onCountrySelected(country);
  }
}
