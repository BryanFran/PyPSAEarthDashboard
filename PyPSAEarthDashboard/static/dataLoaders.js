/*
 * SPDX-FileCopyrightText: 2024 Bryan Ramirez
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
import {
  displayLoadComment,
  createPieChart,
  createDatasets,
  createDualDatasets,
  initChart,
  fetchData,
  generatorColors,
  displayNoDataMessage
} from "./charts.js";

let currentCountry = "United States";

export function setCurrentCountry(country) {
  currentCountry = country;
  console.log(`Current country set to: ${currentCountry}`);
}

export function getCurrentCountry() {
  return currentCountry;
}

let chartInitialized = {
  nominalGeneratorCapacityChart: false,
  optimalGeneratorCapacityChart: false,
  nominalStorageCapacityChart: false,
  optimalStorageCapacityChart: false,
  lineDataChart: false,
};

// Reset charts function
export function resetCharts(country) {
  console.log(`Resetting charts for country: ${country}`);
  return new Promise((resolve) => {
    const charts = [
      "nominalGeneratorCapacityChart",
      "optimalGeneratorCapacityChart",
      "nominalStorageCapacityChart",
      "optimalStorageCapacityChart",
      "lineDataChart",
    ];
    charts.forEach((chartId) => {
      if (Chart.getChart(chartId)) {
        Chart.getChart(chartId).destroy();
      }
      document.getElementById(chartId).innerHTML = "";
      chartInitialized[chartId] = false;
    });
    resolve();
  }).then(() => {
    return Promise.all([
      loadNominalGeneratorCapacityData(country),
      loadOptimalGeneratorCapacityData(country),
      loadNominalStorageCapacityData(country),
      loadOptimalStorageCapacityData(country),
      loadLineData(country),
    ]).catch((error) => console.error(`Error resetting charts:`, error));
  });
}

export function loadNominalGeneratorCapacityData(
  country,
  selectedBusId = null
) {
  fetchData(`/api/nominal-generator-capacity/${country}/`)
    .then((data) => {
      if (!data) return;
      if (selectedBusId) {
        const busData = data.filter(
          (item) => item.Bus === selectedBusId && item.carrier !== "load"
        );
        const pieChartData = busData.map((item) => {
          return {
            label: item.carrier,
            value: item.p_nom,
          };
        });
        createPieChart(
          "nominalGeneratorCapacityChart",
          pieChartData,
          `Nominal Generation Capacity for Bus: ${selectedBusId}`
        );
      } else {
        const capacityByBusAndType = {};
        let loadValue = 0;
        data.forEach((item) => {
          if (item.carrier === "load") {
            loadValue += item.p_nom;
          } else {
            if (!capacityByBusAndType[item.Bus]) {
              capacityByBusAndType[item.Bus] = {};
            }
            const carrierType = item.carrier;
            capacityByBusAndType[item.Bus][carrierType] =
              (capacityByBusAndType[item.Bus][carrierType] || 0) + item.p_nom;
          }
        });
        displayLoadComment("nominalGeneratorCapacityChart", loadValue);
        const chartData = createDatasets(capacityByBusAndType);
        initChart(
          "nominalGeneratorCapacityChart",
          chartData,
          "bar",
          "Nominal Generation Capacity per Bus",
          "Capacity (MW)",
          "Generator Type"
        );
      }
    })
    .catch((error) => console.error("Error loading data:", error));
}

export function loadOptimalGeneratorCapacityData(
  country,
  selectedBusId = null
) {
  fetchData(`/api/optimal-generator-capacity/${country}/`)
    .then((data) => {
      console.log("Optimal Generator Capacity Data:", data); 
      if (!data) return;
      if (selectedBusId) {
        const busData = data.filter(
          (item) => item.Bus === selectedBusId && item.carrier !== "load"
        );
        console.log("Filtered Optimal Generator Capacity Data for Bus:", busData); 
        const pieChartData = busData.map((item) => {
          return {
            label: item.carrier,
            value: item.p_nom_opt,
          };
        });
        console.log("Pie Chart Data for Optimal Generator Capacity:", pieChartData); 
        createPieChart(
          "optimalGeneratorCapacityChart",
          pieChartData,
          `Optimal Generation Capacity for Bus: ${selectedBusId}`
        );
      } else {
        const capacityByBusAndType = {};
        let loadValue = 0;
        data.forEach((item) => {
          if (item.carrier === "load") {
            loadValue += item.p_nom_opt;
          } else {
            if (!capacityByBusAndType[item.Bus]) {
              capacityByBusAndType[item.Bus] = {};
            }
            const carrierType = item.carrier;
            capacityByBusAndType[item.Bus][carrierType] =
              (capacityByBusAndType[item.Bus][carrierType] || 0) +
              item.p_nom_opt;
          }
        });
        displayLoadComment("optimalGeneratorCapacityChart", loadValue);
        const chartData = createDatasets(capacityByBusAndType);
        initChart(
          "optimalGeneratorCapacityChart",
          chartData,
          "bar",
          "Optimal Generator Capacity per Bus",
          "Capacity (MW)",
          "Generator Type"
        );
      }
    })
    .catch((error) => console.error("Error loading data:", error));
}

export function loadNominalStorageCapacityData(country, selectedBusId = null) {
  fetchData(`/api/nominal-storage-capacity/${country}/`)
    .then((data) => {
      if (!data) {
        console.log(`No nominal storage capacity data available for ${country}`);
        displayNoDataMessage("nominalStorageCapacityChart");
        return;
      }
      if (country.toLowerCase() === "united states") {
        console.log("Storage data not available for United States");
        return;
      }
      if (selectedBusId) {
        const busData = data.filter((item) => item.Bus === selectedBusId);

        if (busData.length === 0) {
          document.getElementById(
            "nominalStorageCapacityChart"
          ).innerHTML = `No storage data available for Bus: ${selectedBusId}`;
        } else {
          const chartData = {
            labels: busData.map((item) => item.carrier),
            datasets: [
              {
                label: `Nominal Storage Capacity for Bus: ${selectedBusId}`,
                data: busData.map((item) => item.p_nom),
                backgroundColor: busData.map(
                  (item) => generatorColors[item.carrier] || "#999999"
                ),
              },
            ],
          };
          initChart(
            "nominalStorageCapacityChart",
            chartData,
            "bar",
            `Nominal Storage Capacity for Bus: ${selectedBusId}`,
            "Capacity (MW)",
            "Carrier"
          );
        }
      } else {
        const capacityByBusAndType = {};
        data.forEach((item) => {
          if (!capacityByBusAndType[item.Bus]) {
            capacityByBusAndType[item.Bus] = {};
          }
          capacityByBusAndType[item.Bus][item.carrier] =
            (capacityByBusAndType[item.Bus][item.carrier] || 0) + item.p_nom;
        });
        const chartData = createDatasets(capacityByBusAndType);
        initChart(
          "nominalStorageCapacityChart",
          chartData,
          "bar",
          "Nominal Storage Capacity per Bus",
          "Capacity (MW)",
          "Bus"
        );
      }
    })
    .catch((error) => {
      console.error("Error fetching nominal storage capacity data:", error);
      displayNoDataMessage("nominalStorageCapacityChart");
    });
}

export function loadOptimalStorageCapacityData(country, selectedBusId = null) {
  fetchData(`/api/optimal-storage-capacity/${country}/`)
    .then((data) => {
      if (!data) {
        console.log(`No optimal storage capacity data available for ${country}`);
        displayNoDataMessage("optimalStorageCapacityChart");
        return;
      }
      if (country.toLowerCase() === "united states") {
        console.log("Storage data not available for United States");
        return;
      }
      if (selectedBusId) {
        const busData = data.filter((item) => item.Bus === selectedBusId);

        if (busData.length === 0) {
          document.getElementById(
            "optimalStorageCapacityChart"
          ).innerHTML = `No storage data available for Bus: ${selectedBusId}`;
        } else {
          const chartData = {
            labels: busData.map((item) => item.carrier),
            datasets: [
              {
                label: `Optimal Storage Capacity for Bus: ${selectedBusId}`,
                data: busData.map((item) => item.p_nom_opt),
                backgroundColor: busData.map(
                  (item) => generatorColors[item.carrier] || "#999999"
                ),
              },
            ],
          };
          initChart(
            "optimalStorageCapacityChart",
            chartData,
            "bar",
            `Optimal Storage Capacity for Bus: ${selectedBusId}`,
            "Capacity (MW)",
            "Carrier"
          );
        }
      } else {
        const capacityByBusAndType = {};
        data.forEach((item) => {
          if (!capacityByBusAndType[item.Bus]) {
            capacityByBusAndType[item.Bus] = {};
          }
          capacityByBusAndType[item.Bus][item.carrier] =
            (capacityByBusAndType[item.Bus][item.carrier] || 0) +
            item.p_nom_opt;
        });
        const chartData = createDatasets(capacityByBusAndType);
        initChart(
          "optimalStorageCapacityChart",
          chartData,
          "bar",
          "Optimal Storage Capacity per Bus",
          "Capacity (MW)",
          "Bus"
        );
      }
    })
    .catch((error) => {
      console.error("Error fetching optimal storage capacity data:", error);
      displayNoDataMessage("optimalStorageCapacityChart");
    });
}

export function loadLineData(country, selectedLineId = null) {
  return fetchData(`/api/line-data/${country}/`)
    .then((data) => {
      console.log(`Received line data for ${country}:`, data);
      if (!data || data.length === 0) {
        console.log(`No line data available for ${country}`);
        displayNoDataMessage("lineDataChart");
        return Promise.resolve();
      }

      if (selectedLineId) {
        const lineData = data.find((item) => item.Line == selectedLineId);
        if (lineData) {
          const pieChartData = [
            { label: "Nominal Capacity", value: lineData.s_nom },
            { label: "Optimal Capacity", value: lineData.s_nom_opt },
          ];
          createPieChart(
            "lineDataChart",
            pieChartData,
            `Nominal vs. Optimal Capacity for Line: ${selectedLineId}`
          );
        } else {
          displayNoDataMessage("lineDataChart");
        }
      } else {
        const sNomData = {};
        const sNomOptData = {};
        data.forEach((item) => {
          sNomData[item.Line] = item.s_nom;
          sNomOptData[item.Line] = item.s_nom_opt;
        });
        const chartData = createDualDatasets(sNomData, sNomOptData);
        initChart(
          "lineDataChart",
          chartData,
          "bar",
          "Line Capacities Comparison",
          "Capacity (MW)",
          "Line"
        );
      }

      return Promise.resolve();
    })
    .catch((error) => {
      console.error(`Error fetching line data for ${country}:`, error);
      displayNoDataMessage("lineDataChart");
      return Promise.reject(error);
    });
}