const DATA_PAGE_SIZE = 50;
let dataCurrentPage  = 1;
let dataTotalCount   = 0;
let _rawBroadcastChannel = null;
let _rawLastUpdate = null;
let _rawOfflineTimer = null;

const CSV_COLUMNS = [
  'timestamp', 'distance_cm', 'rain_digital',
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
      <div class="raw-sensor-section" id="rawSensorSection">
        <div class="raw-sensor-header">
          <div class="raw-sensor-title">
            <span class="raw-live-dot" id="rawLiveDot"></span>
            Data Sensor Real-Time
            <span class="raw-badge">LIVE</span>
          </div>
          <div class="raw-sensor-meta" id="rawLastUpdate">Menunggu data...</div>
        </div>

        <div class="raw-sensor-grid" id="rawSensorGrid">
          <!-- Level Air -->
          <div class="raw-sensor-card raw-sensor-card--small" id="rawCardDist">
            <div class="raw-card-label">Level Air (JSN-SR04T)</div>
            <div class="raw-col-value calibrated" id="rawDist" style="color:var(--color-dist)">—</div>
            <div class="raw-col-unit">cm (ultrasonik)</div>
            <div class="raw-card-accent" style="background:var(--color-dist)"></div>
          </div>

          <!-- Status Hujan -->
          <div class="raw-sensor-card raw-sensor-card--small" id="rawCardRain">
            <div class="raw-card-label">Status Hujan</div>
            <div class="raw-col-value calibrated" id="rawRain" style="color:var(--color-rain)">—</div>
            <div class="raw-col-unit" id="rawRainSub">Sensor Rain Digital</div>
            <div class="raw-card-accent" style="background:var(--color-rain)"></div>
          </div>

          <!-- Fuzzy Output -->
          <div class="raw-sensor-card raw-sensor-card--small" id="rawCardFuzzy">
            <div class="raw-card-label">Output Fuzzy</div>
            <div class="raw-col-value calibrated" id="rawFuzzy" style="color:var(--color-fuzzy)">—</div>
            <div class="raw-col-unit" id="rawFuzzySub">derajat servo (0-180°)</div>
            <div class="raw-card-accent" style="background:var(--color-fuzzy)"></div>
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
          <button class="btn btn-danger" onclick="confirmDeleteAll()" id="btnDelete">
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
          <div class="empty-state-icon">📭</div>
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
        <td class="cell-rain">${r.rain_digital ? '🌧️ Hujan' : '☀️ Cerah'}</td>
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
  if (_rawBroadcastChannel) {
    window.db.removeChannel(_rawBroadcastChannel);
    _rawBroadcastChannel = null;
  }

  // Subscribe ke tabel sensor_data via Realtime postgres_changes
  _rawBroadcastChannel = window.db
    .channel('realtime-sensor')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'sensor_data' }, (payload) => {
      updateRawCards(payload.new);
    })
    .subscribe((status) => {
      console.log('[Realtime] Status:', status);
      if (status === 'SUBSCRIBED') setRawStatus(true);
      if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
        setRawStatus(false);
        setTimeout(() => {
          if (document.getElementById('rawSensorGrid')) subscribeRawBroadcast();
        }, 5000);
      }
    });

  if (_rawOfflineTimer) clearInterval(_rawOfflineTimer);
  _rawOfflineTimer = setInterval(() => {
    if (_rawLastUpdate === null) return;
    const age = Date.now() - _rawLastUpdate;
    setRawStatus(age < 15000);
  }, 5000);
}

function unsubscribeRawBroadcast() {
  if (_rawBroadcastChannel) {
    window.db.removeChannel(_rawBroadcastChannel);
    _rawBroadcastChannel = null;
  }
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
}

function updateRawCards(d) {
  _rawLastUpdate = Date.now();
  setRawStatus(true);

  const { fmt } = window.utils;

  const metaEl = document.getElementById('rawLastUpdate');
  if (metaEl) {
    const now = new Date();
    metaEl.textContent = `Update terakhir: ${
      now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    }`;
  }

  // Level Air
  const distEl = document.getElementById('rawDist');
  if (distEl) distEl.textContent = d.distance_cm != null ? fmt(d.distance_cm, 1) + ' cm' : '—';

  // Status Hujan
  const rainEl  = document.getElementById('rawRain');
  const rainSub = document.getElementById('rawRainSub');
  if (rainEl) {
    rainEl.textContent = d.rain_digital ? '🌧️ HUJAN' : '☀️ Cerah';
    rainEl.style.color = d.rain_digital ? 'var(--color-danger)' : 'var(--color-success)';
  }
  if (rainSub) rainSub.textContent = d.rain_digital ? '⚠️ Notifikasi Telegram dikirim!' : 'Tidak ada hujan';

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
  if (btn) { btn.disabled = true; btn.textContent = '⏳ Mengunduh...'; }

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
   ============================================================ */
function confirmDeleteAll() {
  const overlay = document.createElement('div');
  overlay.className = 'confirm-overlay';
  overlay.id = 'confirmOverlay';
  overlay.innerHTML = `
    <div class="confirm-box">
      <div class="confirm-title">Hapus Semua Data?</div>
      <div class="confirm-text">
        Anda akan menghapus <strong style="color:var(--color-danger)">${dataTotalCount.toLocaleString('id-ID')} baris</strong> data sensor secara permanen.<br><br>
        <span style="color:var(--color-warning)">PERINGATAN: Tindakan ini tidak dapat dibatalkan!</span>
      </div>
      <div class="confirm-btns">
        <button class="btn btn-secondary" onclick="closeConfirm()">Batal</button>
        <button class="btn btn-danger" onclick="confirmDeleteStep2()">Ya, Hapus Semua</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
}

function confirmDeleteStep2() {
  closeConfirm();
  const overlay2 = document.createElement('div');
  overlay2.className = 'confirm-overlay';
  overlay2.id = 'confirmOverlay';
  overlay2.innerHTML = `
    <div class="confirm-box">
      <div class="confirm-icon">🗑️</div>
      <div class="confirm-title">Konfirmasi Akhir</div>
      <div class="confirm-text">
        Ketik <strong style="color:var(--color-danger)">HAPUS</strong> untuk mengkonfirmasi penghapusan permanen.
      </div>
      <div class="form-group" style="margin-bottom:20px">
        <input type="text" class="form-input" id="confirmDeleteInput" placeholder="Ketik HAPUS di sini..." autocomplete="off">
      </div>
      <div class="confirm-btns">
        <button class="btn btn-secondary" onclick="closeConfirm()">Batal</button>
        <button class="btn btn-danger" id="btnFinalDelete" onclick="executeDeleteAll()" disabled>🗑️ Hapus Sekarang</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay2);

  const input  = document.getElementById('confirmDeleteInput');
  const btnDel = document.getElementById('btnFinalDelete');
  input.addEventListener('input', () => {
    btnDel.disabled = input.value.trim() !== 'HAPUS';
  });
}

function closeConfirm() {
  const el = document.getElementById('confirmOverlay');
  if (el) el.remove();
}

async function executeDeleteAll() {
  closeConfirm();
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
window.confirmDeleteAll   = confirmDeleteAll;
window.confirmDeleteStep2 = confirmDeleteStep2;
window.closeConfirm = closeConfirm;
window.executeDeleteAll   = executeDeleteAll;
