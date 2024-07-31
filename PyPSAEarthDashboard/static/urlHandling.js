/*
 * SPDX-FileCopyrightText: 2024 Bryan Ramirez
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

export function updateUrlWithCurrentView(map) {
  const view = map.getView();
  const center = ol.proj.toLonLat(view.getCenter());
  const zoom = view.getZoom();
  const queryParams = new URLSearchParams(window.location.search);
  queryParams.set('lat', center[1].toFixed(5));
  queryParams.set('lon', center[0].toFixed(5)); 
  queryParams.set('zoom', zoom.toFixed(2));
  window.history.pushState({}, '', `${window.location.pathname}?${queryParams.toString()}`);
}

export function applyUrlParameters(map) {
  const queryParams = new URLSearchParams(window.location.search);
  const lat = parseFloat(queryParams.get('lat'));
  const lon = parseFloat(queryParams.get('lon'));
  const zoom = parseFloat(queryParams.get('zoom'));

  if (!isNaN(lat) && !isNaN(lon) && !isNaN(zoom)) {
    map.getView().setCenter(ol.proj.fromLonLat([lon, lat]));
    map.getView().setZoom(zoom);
  }
}

export function initializeUrlHandling(map) {
  map.on('moveend', () => updateUrlWithCurrentView(map));
  map.on('singleclick', () => updateUrlWithCurrentView(map));
  applyUrlParameters(map);
}
