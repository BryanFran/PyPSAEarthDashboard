/*
 * SPDX-FileCopyrightText: 2024 Bryan Ramirez
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

export async function init(mapId = 'js-map', carrier = 'solar', variable = 'cf', scenario = '2021') {
    const mapElement = document.getElementById(mapId);
    if (!mapElement) {
        console.error(`Map element with id ${mapId} not found`);
        return;
    }

    const labelElement = document.createElement("div");
    labelElement.id = `${mapId}-label`;
    labelElement.style.position = "absolute";
    labelElement.style.backgroundColor = "rgba(255, 255, 255, 0.7)";
    labelElement.style.padding = "2px";
    labelElement.style.borderRadius = "5px";
    labelElement.style.fontSize = "0.7rem";
    labelElement.style.whiteSpace = "nowrap";
    labelElement.style.fontWeight = "bold";
    labelElement.style.display = "none";
    mapElement.appendChild(labelElement);

    const lineLabelElement = document.createElement("div");
    lineLabelElement.id = `${mapId}-line-label`;
    lineLabelElement.style.position = "absolute";
    lineLabelElement.style.backgroundColor = "rgba(255, 255, 255, 0.7)";
    lineLabelElement.style.padding = "2px";
    lineLabelElement.style.borderRadius = "5px";
    lineLabelElement.style.fontSize = "0.7rem";
    lineLabelElement.style.whiteSpace = "nowrap";
    lineLabelElement.style.fontWeight = "bold";
    lineLabelElement.style.display = "none";
    mapElement.appendChild(lineLabelElement);

    const fullScreenControl = new ol.control.FullScreen();
    const overViewMapControl = new ol.control.OverviewMap({
        collapsed: false,
        layers: [
            new ol.layer.Tile({
                source: new ol.source.OSM(),
                zIndex: 1,
                visible: true,
                opacity: 1,
            }),
        ],
    });
    const scaleLineControl = new ol.control.ScaleLine();
    const zoomSliderControl = new ol.control.ZoomSlider();
    const zoomToExtentControl = new ol.control.ZoomToExtent();

    const map = new ol.Map({
        target: mapId,
        view: new ol.View({
            multiWorld: false,
            center: ol.proj.fromLonLat([-98.5795, 39.8283]),  // Center of USA
            zoom: 4.4,
            maxZoom: 20,
            minZoom: 1,
            rotation: 0,
        }),
        layers: [
            new ol.layer.Tile({
                source: new ol.source.OSM(),
            }),
        ],
        keyboardEventTarget: document,
        controls: ol.control.defaults().extend([
            fullScreenControl,
            overViewMapControl,
            scaleLineControl,
            zoomSliderControl,
            zoomToExtentControl,
        ]),
    });

    return map;
}

export async function loadScenarioData(map, carrier, variable, scenario) {
    console.log(`Loading scenario data for ${carrier}, ${variable}, ${scenario}`);

    const url = `${window.GEOSERVER_URL}/wfs?service=WFS&version=1.0.0&request=GetFeature&typeName=${window.GEOSERVER_WORKSPACE}:geojson_generators_combined_data_US_${scenario}&outputFormat=application/json`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        const vectorSource = new ol.source.Vector({
            features: new ol.format.GeoJSON().readFeatures(data, {
                featureProjection: 'EPSG:3857'
            })
        });

        const vectorLayer = new ol.layer.Vector({
            source: vectorSource,
            style: function(feature) {
                return new ol.style.Style({
                    fill: new ol.style.Fill({
                        color: 'rgba(255, 255, 255, 0.2)'
                    }),
                    stroke: new ol.style.Stroke({
                        color: '#ffcc33',
                        width: 2
                    })
                });
            }
        });

        map.addLayer(vectorLayer);
    } catch (error) {
        console.error('Error loading scenario data:', error);
    }
}