Chart.defaults.font.family  = "'Inter', system-ui, sans-serif";
Chart.defaults.font.size    = 12;
Chart.defaults.color        = '#9090c0';
Chart.defaults.borderColor  = '#2a2a5a';
Chart.defaults.animation.duration = 400;

const chartRegistry = {};

/**
 * Buat atau update line chart
 * @param {string} canvasId - ID elemen canvas
 * @param {object} opts - { label, color, labels, data }
 */
function createLineChart(canvasId, opts = {}) {
  const ctx = document.getElementById(canvasId);
  if (!ctx) return null;

  if (chartRegistry[canvasId]) {
    chartRegistry[canvasId].destroy();
    delete chartRegistry[canvasId];
  }

  const color = opts.color || '#4488ff';
  const chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: opts.labels || [],
      datasets: [{
        label:           opts.label || 'Data',
        data:            opts.data  || [],
        borderColor:     color,
        backgroundColor: hexToRgba(color, 0.08),
        borderWidth:     2,
        pointRadius:     0,
        pointHoverRadius: 4,
        pointHoverBorderColor: color,
        pointHoverBackgroundColor: color,
        fill:            true,
        tension:         0.4
      }]
    },
    options: {
      responsive:          true,
      maintainAspectRatio: false,
      interaction: {
        mode:      'index',
        intersect: false
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#111128',
          borderColor:     '#2a2a5a',
          borderWidth:     1,
          titleColor:      '#9090c0',
          bodyColor:       '#e8e8f8',
          padding:         12,
          callbacks: {
            label: ctx => ` ${ctx.parsed.y !== null ? Number(ctx.parsed.y).toFixed(2) : '—'} ${opts.unit || ''}`
          }
        }
      },
      scales: {
        x: {
          grid:   { color: 'rgba(42,42,90,0.5)' },
          ticks:  {
            maxTicksLimit: 8,
            maxRotation:   0,
            color:         '#5050a0'
          }
        },
        y: {
          grid:   { color: 'rgba(42,42,90,0.5)' },
          ticks:  { color: '#5050a0' },
          ...(opts.min !== undefined ? { min: opts.min } : {}),
          ...(opts.max !== undefined ? { max: opts.max } : {})
        }
      }
    }
  });

  chartRegistry[canvasId] = chart;
  return chart;
}


function createBarChart(canvasId, opts = {}) {
  const ctx = document.getElementById(canvasId);
  if (!ctx) return null;

  if (chartRegistry[canvasId]) {
    chartRegistry[canvasId].destroy();
    delete chartRegistry[canvasId];
  }

  const chart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels:   opts.labels   || [],
      datasets: opts.datasets || []
    },
    options: {
      responsive:          true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display:   true,
          position:  'top',
          labels:    { color: '#9090c0', boxWidth: 12, padding: 16 }
        },
        tooltip: {
          backgroundColor: '#111128',
          borderColor:     '#2a2a5a',
          borderWidth:     1,
          titleColor:      '#9090c0',
          bodyColor:       '#e8e8f8',
          padding:         12
        }
      },
      scales: {
        x: { grid: { display: false }, ticks: { color: '#5050a0' } },
        y: {
          grid:  { color: 'rgba(42,42,90,0.5)' },
          ticks: { color: '#5050a0' }
        }
      }
    }
  });

  chartRegistry[canvasId] = chart;
  return chart;
}


function updateChart(canvasId, labels, data) {
  const chart = chartRegistry[canvasId];
  if (!chart) return;
  chart.data.labels = labels;
  chart.data.datasets[0].data = data;
  chart.update('none'); 
}
function destroyAllCharts() {
  Object.entries(chartRegistry).forEach(([id, chart]) => {
    chart.destroy();
    delete chartRegistry[id];
  });
}

function hexToRgba(hex, alpha = 1) {
  const r = parseInt(hex.slice(1,3), 16);
  const g = parseInt(hex.slice(3,5), 16);
  const b = parseInt(hex.slice(5,7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

window.charts = {
  createLineChart,
  createBarChart,
  updateChart,
  destroyAllCharts
};
