const DATA_PAGE_SIZE = 50;
let dataCurrentPage  = 1;
let dataTotalCount   = 0;
let _rawBroadcastChannel = null;
let _rawLastUpdate = null;
let _rawOfflineTimer = null;

const CSV_COLUMNS = [
  'timestamp', 'distance_cm', 'rain_state',
  'servo1_pos', 'servo2_pos', 'servo3_pos',
  'fuzzy_output', 'gate_position'
];

function renderData() {
  const main = document.getElementById('mainContent');
  main.innerHTML = `
    <div class="page" id="dataPage">
      <div class="page-header">
        <h1 class="page-title">Data Sensor</h1>
        <p class="page-subtitle">Monitor data real-time &amp; seluruh data historis pembacaan sensor</p>
      </div>

      <!-- Section: Data Sensor Live -->
      <div class="card" id="rawSensorSection" style="margin-bottom: var(--space-8); padding: var(--space-6); border-radius: var(--radius-xl);">
        <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom: var(--space-6); border-bottom: 1px solid var(--color-border); padding-bottom: var(--space-4);">
          <div style="display:flex; align-items:center; gap:var(--space-3)">
            <span id="rawLiveDot" style="width:12px; height:12px; border-radius:50%; background:var(--color-text-muted); display:inline-block; transition: all 0.3s ease;"></span>
            <h2 style="font-size:16px; font-weight:600; margin:0; color:var(--color-text-primary); text-transform:uppercase; letter-spacing:0.5px;">Data Sensor Real-Time</h2>
          </div>
          <div id="rawLastUpdate" style="font-size:12px; color:var(--color-text-muted); font-family:var(--font-mono); background:var(--color-bg-elevated); padding:4px 10px; border-radius:var(--radius-full);">Menunggu data...</div>
        </div>

        <div class="sensor-grid" id="rawSensorGrid" style="margin-bottom: 0;">
          <!-- Level Air -->
          <div class="sensor-card" id="rawCardDist">
            <div class="sensor-card-accent" style="background:var(--color-dist)"></div>
            <div class="sensor-card-label">Level Air (JSN-SR04T)</div>
            <div class="sensor-card-value" id="rawDist" style="color:var(--color-dist); font-size:28px; padding:4px 0;">—</div>
            <div class="sensor-card-sub" style="margin-top:4px;">Sensor Ultrasonik</div>
          </div>

          <!-- Status Hujan -->
          <div class="sensor-card" id="rawCardRain">
            <div class="sensor-card-accent" style="background:var(--color-rain)"></div>
            <div class="sensor-card-label">Status Hujan</div>
            <div class="sensor-card-value" id="rawRain" style="color:var(--color-rain); font-size:28px; padding:4px 0;">—</div>
            <div class="sensor-card-sub" id="rawRainSub" style="margin-top:4px;">Sensor Rain Digital</div>
          </div>

          <!-- Fuzzy Output -->
          <div class="sensor-card" id="rawCardFuzzy">
            <div class="sensor-card-accent" style="background:var(--color-fuzzy)"></div>
            <div class="sensor-card-label">Output Fuzzy</div>
            <div class="sensor-card-value" id="rawFuzzy" style="color:var(--color-fuzzy); font-size:28px; padding:4px 0;">—</div>
            <div class="sensor-card-sub" id="rawFuzzySub" style="margin-top:4px;">Derajat Servo (0-180°)</div>
          </div>
        </div>
      </div>

      <!-- Section: Data Historis -->
      <div class="raw-historis-header">
        <div class="section-title" style="margin-bottom:var(--space-3)">Data Historis</div>
      </div>

      <div class="data-toolbar">
        <div id="dataCountInfo" style="font-size:14px; color:var(--color-text-muted)">
          Memuat data...
        </div>
        <div class="data-actions">
          <button class="btn btn-secondary" onclick="downloadCSV()" id="btnDownload">
            Download Data
          </button>
          <button class="btn btn-danger" onclick="executeDeleteAll()" id="btnDelete">
            Hapus Semua Data
          </button>
        </div>
      </div>

      <!-- Tabel -->
      <div class="table-wrapper" id="dataTableWrapper">
        <table class="table" id="dataTable">
          <thead>
            <tr>
              <th>Waktu</th>
              <th>Level Air (cm)</th>
              <th>Hujan</th>
              <th>Servo 1</th>
              <th>Servo 2</th>
              <th>Servo 3</th>
              <th>Fuzzy (°)</th>
              <th>Status Pintu</th>
            </tr>
          </thead>
          <tbody id="dataTableBody">
            <tr><td colspan="8" style="text-align:center; padding:40px; color:var(--color-text-muted)">
              <div class="loading-spinner" style="margin:0 auto 12px"></div>
              Memuat data...
            </td></tr>
          </tbody>
        </table>
        <div class="pagination" id="dataPagination" style="display:none">
          <span class="pagination-info" id="paginationInfo">—</span>
          <div class="pagination-btns">
            <button class="btn btn-secondary btn-sm" id="btnPrevPage" onclick="goToPage(dataCurrentPage - 1)">
              ← Sebelumnya
            </button>
            <button class="btn btn-secondary btn-sm" id="btnNextPage" onclick="goToPage(dataCurrentPage + 1)">
              Berikutnya →
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  loadDataPage(1);
  subscribeRawBroadcast();
}

async function loadDataPage(page) {
  dataCurrentPage = page;
  const from = (page - 1) * DATA_PAGE_SIZE;
  const to   = from + DATA_PAGE_SIZE - 1;

  const tbody = document.getElementById('dataTableBody');
  if (tbody) tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:24px; color:var(--color-text-muted)">
    <div class="loading-spinner" style="margin:0 auto 8px"></div>Memuat...
  </td></tr>`;

  try {
    const { data, count, error } = await window.db
      .from('sensor_data')
      .select('*', { count: 'exact' })
      .order('timestamp', { ascending: false })
      .range(from, to);

    if (error) throw error;

    dataTotalCount = count || 0;
    const totalPages = Math.ceil(dataTotalCount / DATA_PAGE_SIZE);

    const infoEl = document.getElementById('dataCountInfo');
    if (infoEl) infoEl.textContent = `Total: ${dataTotalCount.toLocaleString('id-ID')} baris`;

    renderTable(data || []);

    const paginEl = document.getElementById('dataPagination');
    const infoPage = document.getElementById('paginationInfo');
    const prevBtn  = document.getElementById('btnPrevPage');
    const nextBtn  = document.getElementById('btnNextPage');

    if (paginEl) paginEl.style.display = dataTotalCount > DATA_PAGE_SIZE ? '' : 'none';
    if (infoPage) infoPage.textContent = `Halaman ${page} dari ${totalPages} (${dataTotalCount.toLocaleString('id-ID')} baris)`;
    if (prevBtn)  prevBtn.disabled  = page <= 1;
    if (nextBtn)  nextBtn.disabled  = page >= totalPages;

  } catch (e) {
    console.error('[Data] Error:', e);
    const tbody = document.getElementById('dataTableBody');
    if (tbody) tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:24px; color:var(--color-danger)">
      Gagal memuat data: ${e.message}
    </td></tr>`;
    notify.error('Gagal memuat data tabel');
  }
}

function renderTable(rows) {
  const tbody = document.getElementById('dataTableBody');
  if (!tbody) return;

  if (rows.length === 0) {
    tbody.innerHTML = `
      <tr><td colspan="8">
        <div class="empty-state" style="padding:40px">
          <div class="empty-state-icon"></div>
          <div class="empty-state-title">Tidak Ada Data</div>
          <div class="empty-state-text">Belum ada data sensor yang tersimpan</div>
        </div>
      </td></tr>`;
    return;
  }

  const { fmt, fmtTime, gateLabel, gateColor } = window.utils;

  tbody.innerHTML = rows.map(r => {
    const gateClass = ['gate-closed', 'gate-half', 'gate-full'][r.gate_position] || '';
    return `
      <tr class="${gateClass}">
        <td>${fmtTime(r.timestamp)}</td>
        <td class="cell-dist">${fmt(r.distance_cm, 0)}</td>
        <td class="cell-rain">${r.rain_state === 2 ? 'Hujan' : (r.rain_state === 1 ? 'Gerimis' : 'Kering')}</td>
        <td>${r.servo1_pos ?? '—'}°</td>
        <td>${r.servo2_pos ?? '—'}°</td>
        <td>${r.servo3_pos ?? '—'}°</td>
        <td class="cell-fuzzy">${fmt(r.fuzzy_output, 1)}</td>
        <td style="color:${gateColor(r.gate_position)}">${gateLabel(r.gate_position)}</td>
      </tr>
    `;
  }).join('');
}

function goToPage(page) {
  const totalPages = Math.ceil(dataTotalCount / DATA_PAGE_SIZE);
  if (page < 1 || page > totalPages) return;
  loadDataPage(page);
}

/* ============================================================
   REALTIME – Subscribe ke data Supabase Realtime
   ============================================================ */
function subscribeRawBroadcast() {
  // Bersihkan channel lama dulu supaya tidak ada channel ganda
  unsubscribeRawBroadcast();

  // 1) REALTIME BROADCAST (data mentah ESP32 ~2 detik, TIDAK disimpan ke DB)
  window.realtime.subscribeToRawSensor((d) => updateRawCards(d));

  // 2) Cadangan: INSERT ke tabel sensor_data (data tersimpan tiap 30 detik)
  window.realtime.subscribeToSensorData((row) => updateRawCards(row, { fromHistory: true }));

  setRawStatus(true);

  // Tampilkan pembacaan terakhir yang tersimpan agar kartu tidak kosong
  // saat halaman baru dibuka.
  loadRawLatest();

  if (_rawOfflineTimer) clearInterval(_rawOfflineTimer);
  _rawOfflineTimer = setInterval(() => {
    if (_rawLastUpdate === null) return;
    const age = Date.now() - _rawLastUpdate;
    setRawStatus(age < 45000);
  }, 5000);
}

/**
 * Ambil 1 baris terakhir dari sensor_data dan tampilkan di kartu real-time.
 * Ini melengkapi Realtime: kartu langsung terisi walau belum ada INSERT baru.
 */
async function loadRawLatest() {
  try {
    const { data, error } = await window.db
      .from('sensor_data')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) return;

    updateRawCards(data, { fromHistory: true });

    // Dot "live" hanya menyala kalau data di DB memang masih segar
    const age = Date.now() - new Date(data.timestamp).getTime();
    _rawLastUpdate = age < 45000 ? Date.now() : null;
    setRawStatus(age < 45000);

  } catch (e) {
    console.warn('[Data] Gagal memuat pembacaan terakhir:', e);
  }
}

function unsubscribeRawBroadcast() {
  // Berhenti berlangganan broadcast mentah + INSERT sensor_data
  window.realtime.unsubscribeAll();

  if (_rawOfflineTimer) {
    clearInterval(_rawOfflineTimer);
    _rawOfflineTimer = null;
  }
  _rawLastUpdate = null;
}

function setRawStatus(isOnline) {
  const dot = document.getElementById('rawLiveDot');
  if (!dot) return;
  dot.className = isOnline ? 'raw-live-dot live' : 'raw-live-dot offline';
  dot.style.background = isOnline ? 'var(--color-success)' : 'var(--color-text-muted)';
  dot.style.boxShadow = isOnline ? '0 0 8px var(--color-success)' : 'none';
}

function updateRawCards(d, opts = {}) {
  // fromHistory = true -> nilai berasal dari baris terakhir di DB,
  // bukan dari INSERT realtime, jadi jangan tandai sebagai "baru".
  if (!opts.fromHistory) {
    _rawLastUpdate = Date.now();
    setRawStatus(true);
  }

  const { fmt } = window.utils;

  const metaEl = document.getElementById('rawLastUpdate');
  if (metaEl) {
    const ts = opts.fromHistory && d.timestamp ? new Date(d.timestamp) : new Date();
    metaEl.textContent = `Update terakhir: ${
      ts.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    }`;
  }

  // Level Air
  const distEl = document.getElementById('rawDist');
  if (distEl) distEl.textContent = d.distance_cm != null ? fmt(d.distance_cm, 1) + ' cm' : '—';

  // Status Hujan
  const rainEl  = document.getElementById('rawRain');
  const rainSub = document.getElementById('rawRainSub');
  if (rainEl) {
    if (d.rain_state === 2) {
      rainEl.textContent = 'HUJAN';
      rainEl.style.color = 'var(--color-danger)';
    } else if (d.rain_state === 1) {
      rainEl.textContent = 'GERIMIS';
      rainEl.style.color = 'var(--color-warning)';
    } else {
      rainEl.textContent = 'KERING';
      rainEl.style.color = 'var(--color-success)';
    }
  }
  if (rainSub) {
    if (d.rain_volt != null) {
      rainSub.textContent = `Tegangan ${fmt(d.rain_volt, 3)} V` +
        (d.rain_adc != null ? ` · ADC ${Math.round(d.rain_adc)}` : '');
    } else if (d.rain_state === 2) {
      rainSub.textContent = 'Notifikasi Telegram dikirim!';
    } else if (d.rain_state === 1) {
      rainSub.textContent = 'Hujan rintik';
    } else {
      rainSub.textContent = 'Tidak ada hujan';
    }
  }

  // Fuzzy Output
  const fuzzyEl  = document.getElementById('rawFuzzy');
  const fuzzySub = document.getElementById('rawFuzzySub');
  if (fuzzyEl) fuzzyEl.textContent = d.fuzzy_output != null ? fmt(d.fuzzy_output, 1) + '°' : '—';
  if (fuzzySub) fuzzySub.textContent = window.utils.gateLabel(d.gate_position);
}

/* ============================================================
   CSV Download
   ============================================================ */
async function downloadCSV() {
  const btn = document.getElementById('btnDownload');
  if (btn) { btn.disabled = true; btn.textContent = 'Mengunduh...'; }

  try {
    const { data, error } = await window.db
      .from('sensor_data')
      .select('*')
      .order('timestamp', { ascending: false });

    if (error) throw error;

    const csv = window.utils.toCSV(data || [], CSV_COLUMNS);
    const filename = `sensor_data_${window.utils.fmtDateISO()}.csv`;
    window.utils.downloadFile('\uFEFF' + csv, filename, 'text/csv;charset=utf-8');
    notify.success(`CSV berhasil diunduh (${(data || []).length} baris)`);
  } catch (e) {
    notify.error('Gagal mengunduh CSV: ' + e.message);
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = 'Download Data'; }
  }
}

/* ============================================================
   Hapus Semua Data
   Menghapus seluruh data sensor langsung TANPA dialog konfirmasi.
   Cukup tekan tombol "Hapus Semua Data" lalu muncul notifikasi sukses.
   ============================================================ */
async function executeDeleteAll() {
  const btn = document.getElementById('btnDelete');
  if (btn) { btn.disabled = true; btn.textContent = 'Menghapus...'; }

  try {
    const { error } = await window.db
      .from('sensor_data')
      .delete()
      .gte('id', 0);
    if (error) throw error;

    notify.success('Semua data berhasil dihapus!');
    dataTotalCount = 0;
    loadDataPage(1);

    await window.db.from('daily_summary').delete().gte('id', 0);

  } catch (e) {
    notify.error('Gagal menghapus data: ' + e.message);
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = 'Hapus Semua Data'; }
  }
}

window.dataModule   = { renderData, destroyData: unsubscribeRawBroadcast };
window.goToPage     = goToPage;
window.downloadCSV  = downloadCSV;
window.executeDeleteAll = executeDeleteAll;
