let grafikActiveRange = '6h';

function renderGrafik() {
  const main = document.getElementById('mainContent');
  main.innerHTML = `
    <div class="page" id="grafikPage">
      <div class="page-header">
        <h1 class="page-title">Grafik Data</h1>
        <p class="page-subtitle">Visualisasi time-series parameter sensor dan output Fuzzy Logic</p>
      </div>

      <!-- Time range selector -->
      <div class="chart-toolbar">
        <span style="font-size:14px; color:var(--color-text-muted)">Rentang waktu:</span>
        <div class="time-range-btns">
          <button class="time-range-btn" id="trBtn1h"  onclick="setTimeRange('1h')">1 Jam</button>
          <button class="time-range-btn active" id="trBtn6h" onclick="setTimeRange('6h')">6 Jam</button>
          <button class="time-range-btn" id="trBtn24h" onclick="setTimeRange('24h')">24 Jam</button>
          <button class="time-range-btn" id="trBtn7d"  onclick="setTimeRange('7d')">7 Hari</button>
        </div>
        <button class="btn btn-secondary btn-sm" onclick="refreshGrafik()">Refresh</button>
      </div>

      <!-- Charts row 1: TDS + pH -->
      <div class="chart-grid-2">
        <div class="chart-card">
          <h3 style="color:var(--color-tds)">TDS</h3>
          <div class="chart-container"><canvas id="chartTDS"></canvas></div>
        </div>
        <div class="chart-card">
          <h3 style="color:var(--color-ph)">pH</h3>
          <div class="chart-container"><canvas id="chartPH"></canvas></div>
        </div>
      </div>

      <!-- Charts row 2: Suhu + Jarak -->
      <div class="chart-grid-2" style="margin-top:16px">
        <div class="chart-card">
          <h3 style="color:var(--color-temp)">Suhu Air (°C)</h3>
          <div class="chart-container"><canvas id="chartTemp"></canvas></div>
        </div>
        <div class="chart-card">
          <h3 style="color:var(--color-dist)">Level Air (cm)</h3>
          <div class="chart-container"><canvas id="chartDist"></canvas></div>
        </div>
      </div>

      <!-- Charts row 3: Fuzzy + Gate Distribution -->
      <div class="chart-grid-2" style="margin-top:16px">
        <div class="chart-card">
          <h3 style="color:var(--color-fuzzy)">Output Fuzzy Logic (°)</h3>
          <div class="chart-container"><canvas id="chartFuzzy"></canvas></div>
        </div>
        <div class="chart-card">
          <h3>Distribusi Bukaan Pintu</h3>
          <div class="chart-container"><canvas id="chartGate"></canvas></div>
        </div>
      </div>

      <div id="grafikLoading" style="text-align:center; padding:40px; color:var(--color-text-muted); display:none">
        <div class="loading-spinner" style="margin:0 auto 12px"></div>
        Memuat data grafik...
      </div>
    </div>
  `;

  loadGrafikData();
}

function setTimeRange(range) {
  grafikActiveRange = range;

  ['1h','6h','24h','7d'].forEach(r => {
    const btn = document.getElementById(`trBtn${r}`);
    if (btn) btn.classList.toggle('active', r === range);
  });

  window.charts.destroyAllCharts();
  loadGrafikData();
}

function refreshGrafik() {
  window.charts.destroyAllCharts();
  loadGrafikData();
}

async function loadGrafikData() {
  const loading = document.getElementById('grafikLoading');
  if (loading) loading.style.display = 'block';

  try {
    const since = getRangeSince(grafikActiveRange);
    const limit = grafikActiveRange === '7d' ? 1000 : 500;

    const { data, error } = await window.db
      .from('sensor_data')
      .select('timestamp, tds_ppm, ph_level, temperature_c, distance_cm, fuzzy_output, gate_position')
      .gte('timestamp', since.toISOString())
      .order('timestamp', { ascending: true })
      .limit(limit);

    if (error) throw error;
    if (!data || data.length === 0) {
      notify.warning('Tidak ada data dalam rentang waktu yang dipilih');
      if (loading) loading.style.display = 'none';
      return;
    }

    const rows = data.length > 300 ? downsample(data, 300) : data;

    const labels = rows.map(r => window.utils.fmtTimeOnly(r.timestamp));

    window.charts.createLineChart('chartTDS', {
      label: 'TDS',
      color: '#4488ff',
      unit: 'ppm',
      labels,
      data: rows.map(r => r.tds_ppm),
      min: 0
    });
    window.charts.createLineChart('chartPH', {
      label: 'pH',
      color: '#00e676',
      unit: '',
      labels,
      data: rows.map(r => r.ph_level),
      min: 0, max: 14
    });
    window.charts.createLineChart('chartTemp', {
      label: 'Suhu',
      color: '#ff8c00',
      unit: '°C',
      labels,
      data: rows.map(r => r.temperature_c)
    });
    window.charts.createLineChart('chartDist', {
      label: 'Jarak',
      color: '#b388ff',
      unit: 'cm',
      labels,
      data: rows.map(r => r.distance_cm),
      min: 0
    });
    window.charts.createLineChart('chartFuzzy', {
      label: 'Fuzzy Output',
      color: '#ff6e88',
      unit: '°',
      labels,
      data: rows.map(r => r.fuzzy_output),
      min: 0, max: 180
    });

    buildGateBarChart(rows);

  } catch (e) {
    console.error('[Grafik] Error:', e);
    notify.error('Gagal memuat data grafik: ' + e.message);
  } finally {
    if (loading) loading.style.display = 'none';
  }
}

function buildGateBarChart(rows) {
  const hourMap = {};
  rows.forEach(r => {
    const hour = new Date(r.timestamp).getHours();
    const key  = `${String(hour).padStart(2,'0')}:00`;
    if (!hourMap[key]) hourMap[key] = [0, 0, 0];
    hourMap[key][r.gate_position || 0]++;
  });

  const labels  = Object.keys(hourMap).sort();
  const closed  = labels.map(k => hourMap[k][0]);
  const half    = labels.map(k => hourMap[k][1]);
  const full    = labels.map(k => hourMap[k][2]);

  window.charts.createBarChart('chartGate', {
    labels,
    datasets: [
      { label: 'Tertutup',    data: closed, backgroundColor: 'rgba(255,68,102,0.7)',  borderRadius: 4 },
      { label: 'Setengah',    data: half,   backgroundColor: 'rgba(255,179,0,0.7)',   borderRadius: 4 },
      { label: 'Buka Penuh', data: full,   backgroundColor: 'rgba(0,230,118,0.7)',   borderRadius: 4 }
    ]
  });
}

function getRangeSince(range) {
  const now = new Date();
  switch (range) {
    case '1h':  now.setHours(now.getHours()   - 1);  break;
    case '6h':  now.setHours(now.getHours()   - 6);  break;
    case '24h': now.setHours(now.getHours()   - 24); break;
    case '7d':  now.setDate(now.getDate()     - 7);  break;
    default:    now.setHours(now.getHours()   - 6);
  }
  return now;
}

function downsample(arr, n) {
  if (arr.length <= n) return arr;
  const step = arr.length / n;
  return Array.from({ length: n }, (_, i) => arr[Math.floor(i * step)]);
}

window.grafikModule = { renderGrafik };
window.setTimeRange = setTimeRange;
window.refreshGrafik = refreshGrafik;
