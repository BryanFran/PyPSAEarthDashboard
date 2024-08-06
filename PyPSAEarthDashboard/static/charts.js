/*
 * SPDX-FileCopyrightText: 2024 Bryan Ramirez
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
export const generatorColors = {
  onwind: "#235ebc",
  "onshore wind": "#235ebc",
  offwind: "#6895dd",
  "offwind-ac": "#6895dd",
  "offshore wind": "#6895dd",
  "offshore wind ac": "#6895dd",
  "offwind-dc": "#74c6f2",
  "offshore wind dc": "#74c6f2",
  hydro: "#08ad97",
  "hydro+PHS": "#08ad97",
  PHS: "#08ad97",
  "hydro reservoir": "#08ad97",
  hydroelectricity: "#08ad97",
  ror: "#4adbc8",
  "run of river": "#4adbc8",
  solar: "#f9d002",
  "solar PV": "#f9d002",
  "solar thermal": "#ffef60",
  biomass: "#0c6013",
  "solid biomass": "#06540d",
  biogas: "#23932d",
  waste: "#68896b",
  geothermal: "#ba91b1",
  OCGT: "#d35050",
  gas: "#d35050",
  "natural gas": "#d35050",
  CCGT: "#b20101",
  nuclear: "#ff9000",
  coal: "#707070",
  lignite: "#9e5a01",
  oil: "#262626",
  H2: "#ea048a",
  "hydrogen storage": "#ea048a",
  battery: "#b8ea04",
  "Electric load": "#f9d002",
  electricity: "#f9d002",
  lines: "#70af1d",
  "transmission lines": "#70af1d",
  "AC-AC": "#70af1d",
  "AC line": "#70af1d",
  links: "#8a1caf",
  "HVDC links": "#8a1caf",
  "DC-DC": "#8a1caf",
  "DC link": "#8a1caf",
  load: "#FF0000",

  "Nominal Capacity": "#7ec8e3",
  "Optimal Capacity": "#a4d65e",
};

let chartCount = 0;

export function initChart(
  chartId,
  chartData,
  chartType,
  chartTitle,
  yAxisLabel = "",
  xAxisLabel = ""
) {
  const canvas = document.getElementById(chartId);
  const ctx = canvas.getContext("2d");

  if (Chart.getChart(chartId)) {
    Chart.getChart(chartId).destroy();
  }

  if (
    !chartData ||
    (Array.isArray(chartData) && chartData.length === 0) ||
    (chartData.datasets && chartData.datasets.length === 0)
  ) {
    displayNoDataMessage(chartId);
    return;
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      zoom: {
        pan: {
          enabled: true,
          mode: "xy",
          speed: 10,
          threshold: 10,
          options: { passive: true },
        },
        zoom: {
          wheel: {
            enabled: true,
            events: ["wheel"],
            options: { passive: true },
          },
          pinch: {
            enabled: true,
          },
          mode: "xy",
        },
      },
      tooltip: {
        enabled: true,
        mode: "index",
        callbacks: {
          label: function (context) {
            let label = context.dataset.label || "";
            if (label) {
              label += ": ";
            }
            label += context.parsed.y;
            return label;
          },
        },
      },
      legend: {
        position: "top",
      },
      title: {
        display: true,
        text: chartTitle,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: yAxisLabel,
        },
      },
      x: {
        title: {
          display: true,
          text: xAxisLabel,
        },
      },
    },
    animation: {
      duration: 1000,
      easing: "easeOutCubic",
    },
  };

  let data;
  if (Array.isArray(chartData)) {
    data = {
      labels: chartData.map((item) => item.label),
      datasets: [
        {
          label: "Dataset",
          data: chartData.map((item) => item.value),
          backgroundColor: chartData.map(
            (item) => generatorColors[item.label] || "#999999"
          ),
          borderColor: chartData.map((item) => "rgba(0, 150, 255, 1)"),
          borderWidth: 1,
        },
      ],
    };
  } else {
    data = chartData;
  }

  new Chart(ctx, {
    type: chartType,
    data: data,
    options: options,
  });

  chartCount++;
  console.log(`Chart count: ${chartCount}`);
}

export function fetchData(url) {
  return fetch(url)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      if (!data || (Array.isArray(data) && data.length === 0)) {
        throw new Error("No data available");
      }
      return data;
    });
}

export function displayLoadComment(chartId, loadValue) {
  const commentElement = document.getElementById(chartId + "Comment");
  if (commentElement) {
    commentElement.textContent = "Load: " + loadValue;
  }
}

export function createPieChart(chartId, pieChartData, chartTitle) {
  console.log(`Creating pie chart with ID: ${chartId}`);
  const canvas = document.getElementById(chartId);
  const ctx = canvas.getContext("2d");

  if (Chart.getChart(chartId)) {
    Chart.getChart(chartId).destroy();
  }

  if (!pieChartData || pieChartData.length === 0) {
    displayNoDataMessage(chartId);
    return;
  }

  new Chart(ctx, {
    type: "pie",
    data: {
      labels: pieChartData.map((d) => d.label),
      datasets: [
        {
          data: pieChartData.map((d) => d.value),
          backgroundColor: pieChartData.map(
            (item) => generatorColors[item.label] || "#999999"
          ),
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: "right" },
        title: { display: true, text: chartTitle },
      },
      animation: {
        duration: 500,
        easing: "easeInOutQuad",
      },
    },
  });

  chartCount++;
  console.log(`Chart count: ${chartCount}`);
}

export function createDatasets(processedData) {
  const carriers = new Set();
  const buses = Object.keys(processedData);
  buses.forEach((bus) => {
    Object.keys(processedData[bus]).forEach((carrier) => {
      carriers.add(carrier);
    });
  });

  const datasets = Array.from(carriers).map((carrier) => {
    const data = buses.map((bus) => processedData[bus][carrier] || 0);
    return {
      label: carrier,
      data: data,
      backgroundColor: generatorColors[carrier] || "#999999",
    };
  });

  return { labels: buses, datasets: datasets };
}

export function createDualDatasets(sNomData, sNomOptData) {
  const lines = Object.keys(sNomData);

  const sNomDataset = {
    label: "Nom. Capacity",
    data: lines.map((line) => sNomData[line] || 0),
    backgroundColor: "#7ec8e3",
  };

  const sNomOptDataset = {
    label: "Opt. Capacity",
    data: lines.map((line) => sNomOptData[line] || 0),
    backgroundColor: "#a4d65e",
  };

  return {
    labels: lines,
    datasets: [sNomDataset, sNomOptDataset],
  };
}

export function displayNoDataMessage(chartId) {
  const canvas = document.getElementById(chartId);
  const ctx = canvas.getContext("2d");

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#999";
  ctx.font = "20px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("No data available", canvas.width / 2, canvas.height / 2);
}

export function createScenarioCapexOpexChart(data, chartId) {
  const canvas = document.getElementById(chartId);
  if (!canvas) {
    console.error(`Canvas element with id ${chartId} not found`);
    return;
  }
  const existingChart = Chart.getChart(chartId);
  if (existingChart) {
    existingChart.destroy();
  }

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    console.error(`Unable to get 2D context for canvas with id ${chartId}`);
    return;
  }

  const chartData = {
    labels: data.map((_, index) => `Generator ${index + 1}`),
    datasets: [
      {
        label: "CAPEX",
        data: data.map((item) => item["Capital Expenditure"]),
        backgroundColor: "rgba(75, 192, 192, 0.6)",
      },
      {
        label: "OPEX",
        data: data.map((item) => item["Operational Expenditure"]),
        backgroundColor: "rgba(255, 99, 132, 0.6)",
      },
    ],
  };

  new Chart(ctx, {
    type: "bar",
    data: chartData,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: "CAPEX vs OPEX per Generator",
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              let label = context.dataset.label || "";
              if (label) {
                label += ": ";
              }
              if (context.parsed.y !== null) {
                label += new Intl.NumberFormat("en-US", {
                  style: "currency",
                  currency: "USD",
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                }).format(context.parsed.y);
              }
              return label;
            },
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: "Cost ($)",
          },
          ticks: {
            callback: function (value, index, values) {
              return new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              }).format(value);
            },
          },
        },
        x: {
          title: {
            display: true,
            text: "Generator",
          },
        },
      },
    },
  });
}

export function createScenarioCostDistributionChart(data, chartId) {
  const canvas = document.getElementById(chartId);
  if (!canvas) {
    console.error(`Canvas element with id ${chartId} not found`);
    return;
  }

  const existingChart = Chart.getChart(chartId);
  if (existingChart) {
    existingChart.destroy();
  }

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    console.error(`Unable to get 2D context for canvas with id ${chartId}`);
    return;
  }

  const totalCosts = data.map((item, index) => ({
    label: `Generator ${index + 1}`,
    value: item["Capital Expenditure"] + item["Operational Expenditure"],
  }));

  new Chart(ctx, {
    type: "pie",
    data: {
      labels: totalCosts.map((item) => item.label),
      datasets: [
        {
          data: totalCosts.map((item) => item.value),
          backgroundColor: totalCosts.map(
            (_, index) =>
              `hsl(${((index * 360) / totalCosts.length) % 360}, 70%, 60%)`
          ),
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "right",
          labels: {
            boxWidth: 15,
            font: {
              size: 10,
            },
          },
        },
        title: {
          display: true,
          text: "Total Cost Distribution per Generator",
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              let label = context.label || "";
              if (label) {
                label += ": ";
              }
              if (context.parsed !== null) {
                label += new Intl.NumberFormat("en-US", {
                  style: "currency",
                  currency: "USD",
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                }).format(context.parsed);
              }
              return label;
            },
          },
        },
      },
    },
  });
}

export function createScenarioCapacityComparisonChart(data, chartId) {
  const canvas = document.getElementById(chartId);
  if (!canvas) {
    console.error(`Canvas element with id ${chartId} not found`);
    return;
  }

  const existingChart = Chart.getChart(chartId);
  if (existingChart) {
    existingChart.destroy();
  }

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    console.error(`Unable to get 2D context for canvas with id ${chartId}`);
    return;
  }

  const chartData = {
    labels: data.map((_, index) => `Generator ${index + 1}`),
    datasets: [
      {
        label: "Installed Capacity",
        data: data.map((item) => item["Installed Capacity"]),
        backgroundColor: "rgba(54, 162, 235, 0.6)",
      },
      {
        label: "Optimal Capacity",
        data: data.map((item) => item["Optimal Capacity"]),
        backgroundColor: "rgba(255, 206, 86, 0.6)",
      },
    ],
  };

  new Chart(ctx, {
    type: "bar",
    data: chartData,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: "Installed vs Optimal Capacity per Generator",
        },
        legend: {
          position: "top",
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              let label = context.dataset.label || "";
              if (label) {
                label += ": ";
              }
              if (context.parsed.y !== null) {
                label += new Intl.NumberFormat("en-US", {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 2,
                }).format(context.parsed.y);
              }
              return label;
            },
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: "Capacity",
          },
          ticks: {
            callback: function (value, index, values) {
              return new Intl.NumberFormat("en-US", {
                minimumFractionDigits: 0,
                maximumFractionDigits: 2,
              }).format(value);
            },
          },
        },
        x: {
          title: {
            display: true,
            text: "Generator",
          },
        },
      },
    },
  });
}
