function renderControl() {
  const main = document.getElementById('mainContent');
  main.innerHTML = `
    <div class="page" id="controlPage">
      <div class="page-header">
        <h1 class="page-title">Control Panel</h1>
        <p class="page-subtitle">Kontrol manual pintu air, pompa air, dan konfigurasi parameter Fuzzy Logic</p>
      </div>

      <!-- ===== Pompa Air + Mode Kendali ===== -->
      <div class="control-top-grid">
        <!-- Pompa Air: kiri saat desktop, atas saat mobile -->
        <div>
          <div class="section-title">Kontrol Pompa Air</div>
          <div class="pump-control-card">
            <div class="pump-control-header">
              <span class="pump-control-title">Pompa Air</span>
              <span class="badge badge-muted" id="pumpBadge">Memuat...</span>
            </div>
            <button class="pump-toggle-btn pump-off" id="btnPump" onclick="togglePump()">

              <span id="pumpLabel">OFF</span>
            </button>
            <div class="pump-status-text" id="pumpStatusText">Klik untuk menyalakan pompa</div>
          </div>
        </div>

        <!-- Mode Kendali: kanan saat desktop, bawah Pompa Air saat mobile -->
        <div>
          <div class="section-title">Mode Kendali Pintu Air</div>
          <div class="mode-control-card">
            <div class="pump-control-header">
              <span class="pump-control-title">Mode Operasi</span>
              <span class="badge badge-muted" id="modeBadge">Memuat...</span>
            </div>

            <div class="mode-switch">
              <button class="mode-btn" id="btnModeAuto" onclick="setControlMode('auto')">
                <span>AUTO</span>
                <span class="mode-btn-sub">Fuzzy Sugeno</span>
              </button>
              <button class="mode-btn" id="btnModeManual" onclick="setControlMode('manual')">
                <span>MANUAL</span>
                <span class="mode-btn-sub">Perintah dashboard</span>
              </button>
            </div>

            <div class="mode-status-text" id="modeStatusText">Memuat mode...</div>
          </div>
        </div>
      </div>

      <div class="control-layout">
        <!-- Kolom Kiri: Servo Control -->
        <div>
          <div class="section-title">Kontrol Servo Manual</div>
          <div style="font-size:12px; color:var(--color-text-muted); margin:-8px 0 16px">
            Skala sudut: <strong>0° = pintu tertutup</strong> · 90° = setengah · <strong>180° = pintu terbuka penuh</strong>
          </div>

          <!-- Semua servo sekaligus -->
          <div class="all-servo-ctrl" style="margin-bottom:16px">
            <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:12px">
              <strong>Semua Servo Serentak</strong>
              <span class="badge badge-warning" id="modeLabel">Memuat...</span>
            </div>
            <div class="servo-presets" style="margin-bottom:12px">
              <button class="btn btn-danger btn-sm"   onclick="sendAllServos(0)"   id="btnAllClose">Tutup</button>
              <button class="btn btn-secondary btn-sm" onclick="sendAllServos(90)"  id="btnAllHalf">Setengah</button>
              <button class="btn btn-success btn-sm"  onclick="sendAllServos(180)" id="btnAllFull">Buka Penuh</button>
            </div>
            <div style="display:flex; align-items:center; gap:12px">
              <input type="range" class="form-range" id="allServoSlider" min="0" max="180" value="0"
                oninput="document.getElementById('allServoSliderVal').textContent=this.value+'°'" style="flex:1">
              <span id="allServoSliderVal" style="font-family:var(--font-mono);min-width:40px">0°</span>
              <button class="btn btn-primary btn-sm" onclick="sendAllServos(+document.getElementById('allServoSlider').value)">→</button>
            </div>
          </div>

          <!-- Servo individual -->
          <div class="servo-grid" id="servoGrid">
            ${[1, 2, 3].map(i => buildServoWidget(i)).join('')}
          </div>
        </div>

        <!-- Kolom Kanan: Parameter Fuzzy -->
        <div>
          <div class="section-title">Parameter Fuzzy Logic</div>

          <div class="calib-section">
            <h3>Membership Function Jarak (cm)</h3>
            <div style="font-size:12px; color:var(--color-text-muted); margin-bottom:12px">
              Batas zona keanggotaan level air untuk input Fuzzy Logic
            </div>
            <div class="calib-grid">
              <div class="form-group">
                <label class="form-label">Jarak Rendah (atas)</label>
                <input type="number" class="form-input" id="fzDistLow" value="20">
                <span class="form-hint">Default: 20 cm</span>
              </div>
              <div class="form-group">
                <label class="form-label">Jarak Sedang (puncak)</label>
                <input type="number" class="form-input" id="fzDistMid" value="50">
                <span class="form-hint">Default: 50 cm</span>
              </div>
              <div class="form-group">
                <label class="form-label">Jarak Tinggi (bawah)</label>
                <input type="number" class="form-input" id="fzDistHigh" value="80">
                <span class="form-hint">Default: 80 cm</span>
              </div>
            </div>


            <h3 style="margin-top:20px">Output Rule Base (derajat servo 0–180°)</h3>
            <div style="font-size:12px; color:var(--color-text-muted); margin-bottom:12px; margin-top:8px">
              Jarak Rendah = air tinggi → pintu terbuka | Jarak Tinggi = air rendah → pintu tertutup
            </div>
            <div class="calib-grid">
              <div class="form-group">
                <label class="form-label">Jarak Rendah → Servo (°)</label>
                <input type="number" class="form-input" id="frLow" min="0" max="180" value="150">
                <span class="form-hint">Air tinggi → buka penuh (≈150–180°)</span>
              </div>
              <div class="form-group">
                <label class="form-label">Jarak Sedang → Servo (°)</label>
                <input type="number" class="form-input" id="frMid" min="0" max="180" value="90">
                <span class="form-hint">Level sedang → setengah (≈90°)</span>
              </div>
              <div class="form-group">
                <label class="form-label">Jarak Tinggi → Servo (°)</label>
                <input type="number" class="form-input" id="frHigh" min="0" max="180" value="30">
                <span class="form-hint">Air rendah → tutup (≈0–30°)</span>
              </div>
            </div>
          </div>

          <div style="display:flex; gap:12px; margin-top:16px">
            <button class="btn btn-primary btn-block" onclick="saveCalibration()" id="btnSaveCalib">
              Simpan ke Cloud
            </button>
          </div>
          <div id="calibStatus" style="text-align:center; margin-top:8px; font-size:13px; color:var(--color-text-muted); height:20px"></div>
        </div>
      </div>
    </div>
  `;

  loadCalibration();
  loadPumpState();
  loadModeState();
}

function buildServoWidget(n) {
  return `
    <div class="servo-control">
      <div class="servo-header">
        <span class="servo-name">Servo ${n}</span>
        <span class="badge badge-info" id="servoPos${n}Current">—°</span>
      </div>
      <div class="servo-pos-display" id="servoPos${n}Display">0°</div>
      <input type="range" class="form-range" id="servoSlider${n}" min="0" max="180" value="0"
        oninput="document.getElementById('servoPos${n}Display').textContent=this.value+'°'">
      <div class="servo-presets" style="margin-top:12px">
        <button class="btn btn-danger btn-sm"   onclick="sendServo(${n}, 0)"   id="btnS${n}Close">Tutup</button>
        <button class="btn btn-secondary btn-sm" onclick="sendServo(${n}, 90)"  id="btnS${n}Half">Setengah</button>
        <button class="btn btn-success btn-sm"  onclick="sendServo(${n}, 180)" id="btnS${n}Full">Buka</button>
      </div>
      <div class="servo-adj" style="margin-top:8px">
        <button class="btn btn-secondary btn-sm" onclick="adjustServo(${n},-10)">-10</button>
        <button class="btn btn-secondary btn-sm" onclick="adjustServo(${n},-1)">-1</button>
        <button class="btn btn-secondary btn-sm" onclick="adjustServo(${n},+1)">+1</button>
        <button class="btn btn-secondary btn-sm" onclick="adjustServo(${n},+10)">+10</button>
      </div>
      <button class="btn btn-primary btn-block" style="margin-top:12px"
        onclick="sendServo(${n}, +document.getElementById('servoSlider${n}').value)"
        id="btnS${n}Send">→ Kirim</button>
      <div class="servo-status" id="servoStatus${n}"></div>
    </div>
  `;
}

function buildRuleGrid() {
  const labels = [
    ['TDS Rendah + Jarak Rendah', 'TDS Rendah + Jarak Sedang', 'TDS Rendah + Jarak Tinggi'],
    ['TDS Sedang + Jarak Rendah', 'TDS Sedang + Jarak Sedang', 'TDS Sedang + Jarak Tinggi'],
    ['TDS Tinggi + Jarak Rendah', 'TDS Tinggi + Jarak Sedang', 'TDS Tinggi + Jarak Tinggi'],
  ];
  const defaults = [[60, 30, 45], [120, 90, 105], [150, 180, 165]];

  let html = '';
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      html += `
        <div class="calib-rule-item">
          <div class="calib-rule-label">${labels[i][j]}</div>
          <input type="number" class="form-input" id="rule_${i}_${j}"
            min="0" max="180" value="${defaults[i][j]}" title="${labels[i][j]}">
        </div>
      `;
    }
  }
  return html;
}


async function sendServo(servoId, pos) {
  pos = Math.max(0, Math.min(180, Math.round(pos)));

  // Kalau masih AUTO, pindahkan ke MANUAL dulu supaya posisi servo ini tidak
  // langsung ditimpa oleh Fuzzy Sugeno di ESP32.
  if (_controlMode !== 'manual') {
    await setControlMode('manual');
  }

  const statusEl = document.getElementById(`servoStatus${servoId}`);
  if (statusEl) { statusEl.textContent = 'Mengirim...'; statusEl.className = 'servo-status sent'; }

  const slider = document.getElementById(`servoSlider${servoId}`);
  const display = document.getElementById(`servoPos${servoId}Display`);
  if (slider) slider.value = pos;
  if (display) display.textContent = pos + '°';

  try {
    const { error } = await window.db.from('servo_commands').insert({
      servo_id: servoId,
      target_position: pos,
      command_type: 'manual',
      executed: false
    });

    if (error) throw error;
    if (statusEl) { statusEl.textContent = 'Terkirim - Menunggu eksekusi...'; statusEl.className = 'servo-status sent'; }
    notify.success(`Servo ${servoId} → ${pos}°`);

    pollServoExecution(servoId, statusEl);
  } catch (e) {
    if (statusEl) { statusEl.textContent = 'Gagal mengirim'; statusEl.className = 'servo-status error'; }
    notify.error(`Gagal kirim perintah servo ${servoId}`);
  }
}

async function sendAllServos(pos) {
  pos = Math.max(0, Math.min(180, Math.round(pos)));
  for (let i = 1; i <= 3; i++) {
    await sendServo(i, pos);
    await new Promise(r => setTimeout(r, 200));
  }
}

function adjustServo(n, delta) {
  const slider = document.getElementById(`servoSlider${n}`);
  const display = document.getElementById(`servoPos${n}Display`);
  if (!slider) return;
  const newVal = Math.max(0, Math.min(180, parseInt(slider.value) + delta));
  slider.value = newVal;
  if (display) display.textContent = newVal + '°';
}

async function pollServoExecution(servoId, statusEl) {
  const start = Date.now();
  const interval = setInterval(async () => {
    if (Date.now() - start > 30000) {
      clearInterval(interval);
      if (statusEl) { statusEl.textContent = 'Timeout'; statusEl.className = 'servo-status error'; }
      return;
    }
    try {
      // maybeSingle(): 0 baris -> data null TANPA error.
      // single() akan melempar HTTP 406 (Not Acceptable) saat 0 baris,
      // sehingga status langsung terbaca "Dieksekusi!" padahal belum.
      const { data, error } = await window.db
        .from('servo_commands')
        .select('executed')
        .eq('servo_id', servoId)
        .eq('executed', false)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      // Error jaringan/tabel: coba lagi pada siklus berikutnya
      if (error) return;

      if (!data) {
        clearInterval(interval);
        if (statusEl) { statusEl.textContent = 'Dieksekusi!'; statusEl.className = 'servo-status executed'; }
      }
    } catch { /* ignore */ }
  }, 2000);
}

async function loadCalibration() {
  try {
    const { data, error } = await window.db
      .from('calibration_config')
      .select('config_key, config_value');

    // Tabel belum dibuat (404) atau error lain — abaikan, gunakan nilai default
    if (error) {
      console.warn('[Control] calibration_config belum tersedia, pakai nilai default.');
      return;
    }
    if (!data) return;

    const map = {};
    data.forEach(r => { map[r.config_key] = r.config_value; });

    const set = (id, key, def) => {
      const el = document.getElementById(id);
      if (el && map[key] !== undefined) el.value = map[key];
      else if (el && def !== undefined) el.value = def;
    };

    set('calibTdsSlope', 'tds_slope', 500);
    set('calibTdsOffset', 'tds_offset', 0);
    set('calibPhSlope', 'ph_slope', -5.70);
    set('calibPhOffset', 'ph_offset', 0);
    set('fzTdsLow', 'fz_tds_low', 200);
    set('fzTdsMid', 'fz_tds_mid', 500);
    set('fzTdsHigh', 'fz_tds_high', 800);
    set('fzDistLow', 'fz_dist_low', 20);
    set('fzDistMid', 'fz_dist_mid', 50);
    set('fzDistHigh', 'fz_dist_high', 80);
    set('frLow', 'fr_low', 150);
    set('frMid', 'fr_mid', 90);
    set('frHigh', 'fr_high', 30);

    notify.info('Konfigurasi Fuzzy dimuat dari cloud');
  } catch (e) {
    console.error('[Control] Gagal load kalibrasi:', e);
  }
}

async function saveCalibration() {
  const btn = document.getElementById('btnSaveCalib');
  const status = document.getElementById('calibStatus');
  if (btn) { btn.disabled = true; btn.textContent = 'Menyimpan...'; }

  const entries = [
    { config_key: 'tds_slope', config_value: +document.getElementById('calibTdsSlope').value },
    { config_key: 'tds_offset', config_value: +document.getElementById('calibTdsOffset').value },
    { config_key: 'ph_slope', config_value: +document.getElementById('calibPhSlope').value },
    { config_key: 'ph_offset', config_value: +document.getElementById('calibPhOffset').value },
    { config_key: 'fz_tds_low', config_value: +document.getElementById('fzTdsLow').value },
    { config_key: 'fz_tds_mid', config_value: +document.getElementById('fzTdsMid').value },
    { config_key: 'fz_tds_high', config_value: +document.getElementById('fzTdsHigh').value },
    { config_key: 'fz_dist_low', config_value: +document.getElementById('fzDistLow').value },
    { config_key: 'fz_dist_mid', config_value: +document.getElementById('fzDistMid').value },
    { config_key: 'fz_dist_high', config_value: +document.getElementById('fzDistHigh').value },
    { config_key: 'fr_low', config_value: +document.getElementById('frLow').value },
    { config_key: 'fr_mid', config_value: +document.getElementById('frMid').value },
    { config_key: 'fr_high', config_value: +document.getElementById('frHigh').value },
  ];

  try {
    for (const entry of entries) {
      const { error } = await window.db
        .from('calibration_config')
        .upsert({ ...entry, updated_at: new Date().toISOString() }, { onConflict: 'config_key' });
      if (error) throw error;
    }

    if (status) { status.textContent = 'Tersimpan! ESP32 akan sync dalam ≤30 detik'; status.style.color = 'var(--color-success)'; }
    notify.success('Parameter Fuzzy berhasil disimpan ke cloud!');
  } catch (e) {
    if (status) { status.textContent = 'Gagal menyimpan: ' + e.message; status.style.color = 'var(--color-danger)'; }
    notify.error('Gagal menyimpan parameter Fuzzy');
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = 'Simpan ke Cloud'; }
  }
}

// ============================================================
//  POMPA AIR
// ============================================================

/** State lokal pompa (true = ON, false = OFF) */
let _pumpState = false;

/**
 * Toggle pompa: kirim perintah ke Supabase tabel pump_commands.
 * UI langsung berubah optimistis; status akan dikonfirmasi saat
 * ESP32 mengeksekusi dan polling berikutnya membaca state.
 */
async function togglePump() {
  const btn = document.getElementById('btnPump');
  const label = document.getElementById('pumpLabel');
  const icon = document.getElementById('pumpIcon');
  const badge = document.getElementById('pumpBadge');
  const statusText = document.getElementById('pumpStatusText');

  if (!btn) return;

  // Toggle state lokal
  _pumpState = !_pumpState;

  // Update UI optimistis
  applyPumpUI(_pumpState);
  statusText.textContent = 'Mengirim perintah...';
  statusText.className = 'pump-status-text';
  btn.disabled = true;

  try {
    const { error } = await window.db.from('pump_commands').insert({
      state: _pumpState,
      executed: false
    });

    if (error) throw error;

    statusText.textContent = _pumpState
      ? 'Perintah ON terkirim – menunggu ESP32'
      : 'Perintah OFF terkirim – menunggu ESP32';
    statusText.className = 'pump-status-text' + (_pumpState ? ' pump-status-on' : '');
    notify.success('Pompa ' + (_pumpState ? 'dinyalakan' : 'dimatikan'));
  } catch (e) {
    // Rollback UI jika gagal
    _pumpState = !_pumpState;
    applyPumpUI(_pumpState);
    statusText.textContent = 'Gagal mengirim: ' + e.message;
    statusText.className = 'pump-status-text pump-status-err';
    notify.error('Gagal kirim perintah pompa');
  } finally {
    btn.disabled = false;
  }
}

/** Terapkan visual sesuai state pompa */
function applyPumpUI(isOn) {
  const btn = document.getElementById('btnPump');
  const label = document.getElementById('pumpLabel');
  const badge = document.getElementById('pumpBadge');
  if (!btn) return;

  if (isOn) {
    btn.className = 'pump-toggle-btn pump-on';
    if (label) label.textContent = 'ON';
    if (badge) { badge.textContent = 'AKTIF'; badge.className = 'badge badge-success'; }
  } else {
    btn.className = 'pump-toggle-btn pump-off';
    if (label) label.textContent = 'OFF';
    if (badge) { badge.textContent = 'MATI'; badge.className = 'badge badge-muted'; }
  }
}

/** Muat state pompa terakhir dari Supabase saat halaman dibuka */
async function loadPumpState() {
  try {
    // Gunakan maybeSingle() agar tidak error 406 ketika tabel kosong
    const { data, error } = await window.db
      .from('pump_commands')
      .select('state, executed, created_at')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const statusTextEl = document.getElementById('pumpStatusText');

    if (error) throw error;

    if (!data) {
      // Belum ada data – default OFF
      _pumpState = false;
      applyPumpUI(false);
      if (statusTextEl) statusTextEl.textContent = 'Belum ada riwayat perintah';
      return;
    }

    _pumpState = data.state;
    applyPumpUI(_pumpState);

    if (statusTextEl) {
      if (!data.executed) {
        statusTextEl.textContent = 'Menunggu eksekusi ESP32...';
      } else {
        statusTextEl.textContent = 'Status terakhir: pompa ' + (_pumpState ? 'ON' : 'OFF');
        statusTextEl.className = 'pump-status-text' + (_pumpState ? ' pump-status-on' : '');
      }
    }
  } catch (e) {
    console.warn('[Pump] Gagal load state:', e);
  }
}

// ============================================================
//  MODE KENDALI (AUTO / MANUAL)
//  Perintah dikirim ke tabel `mode_commands` di Supabase, lalu
//  dipoll oleh ESP32 setiap 5 detik (checkModeCommand()).
// ============================================================

/** Mode yang sedang aktif di UI: 'auto' (Fuzzy Sugeno) atau 'manual' */
let _controlMode = 'auto';
/** Timer polling konfirmasi eksekusi mode oleh ESP32 */
let _modePollTimer = null;

/** Perbarui tampilan tombol & badge sesuai mode */
function applyModeUI(mode) {
  const btnAuto = document.getElementById('btnModeAuto');
  const btnManual = document.getElementById('btnModeManual');
  const badgeEl = document.getElementById('modeBadge');

  if (btnAuto) {
    btnAuto.className = 'mode-btn' + (mode === 'auto' ? ' mode-btn-active-auto' : '');
  }
  if (btnManual) {
    btnManual.className = 'mode-btn' + (mode === 'manual' ? ' mode-btn-active-manual' : '');
  }
  if (badgeEl) {
    badgeEl.textContent = mode === 'auto' ? 'AUTO' : 'MANUAL';
    badgeEl.className = 'badge ' + (mode === 'auto' ? 'badge-success' : 'badge-warning');
  }
}

/**
 * Minta ESP32 berpindah mode.
 * @param {'auto'|'manual'} mode
 * @param {Object} [opts] - { silent: boolean }
 */
async function setControlMode(mode, opts = {}) {
  if (mode !== 'auto' && mode !== 'manual') return;

  const statusEl = document.getElementById('modeStatusText');
  const badgeEl = document.getElementById('modeBadge');

  // Sudah di mode ini -> tidak perlu kirim perintah baru
  if (mode === _controlMode) {
    applyModeUI(mode);
    if (statusEl) {
      statusEl.className = 'mode-status-text mode-status-ok';
      statusEl.textContent = mode === 'auto'
        ? 'Mode AUTO aktif – pintu dikontrol Fuzzy Sugeno'
        : 'Mode MANUAL aktif – pintu hanya dari perintah dashboard';
    }
    return;
  }

  const previousMode = _controlMode;

  // UI optimistis
  _controlMode = mode;
  applyModeUI(mode);
  if (badgeEl) badgeEl.className = 'badge badge-info';
  if (statusEl) {
    statusEl.className = 'mode-status-text';
    statusEl.textContent = 'Mengirim perintah ke ESP32...';
  }

  try {
    const { data, error } = await window.db
      .from('mode_commands')
      .insert({ mode: mode, executed: false })
      .select('id')
      .maybeSingle();

    if (error) throw error;

    if (!opts.silent) {
      notify.success(mode === 'auto'
        ? 'Mode AUTO dikirim – pintu akan dikontrol Fuzzy Sugeno'
        : 'Mode MANUAL dikirim – pintu dikontrol dari dashboard');
    }

    if (data && data.id) pollModeExecution(data.id, statusEl);

  } catch (e) {
    console.error('[Mode] Gagal kirim perintah mode:', e);

    // Rollback UI ke mode sebelumnya
    _controlMode = previousMode;
    applyModeUI(previousMode);

    if (statusEl) {
      statusEl.className = 'mode-status-text mode-status-err';
      statusEl.textContent = 'Gagal mengganti mode: ' + e.message;
    }
    notify.error('Gagal mengganti mode kendali');
  }
}

/** Tunggu sampai ESP32 menandai perintah mode sebagai executed */
function pollModeExecution(id, statusEl) {
  if (_modePollTimer) { clearInterval(_modePollTimer); _modePollTimer = null; }

  const start = Date.now();

  _modePollTimer = setInterval(async () => {
    if (Date.now() - start > 30000) {
      clearInterval(_modePollTimer);
      _modePollTimer = null;
      if (statusEl) {
        statusEl.className = 'mode-status-text mode-status-err';
        statusEl.textContent = 'Timeout – ESP32 belum merespons perintah mode';
      }
      return;
    }

    try {
      const { data, error } = await window.db
        .from('mode_commands')
        .select('executed')
        .eq('id', id)
        .maybeSingle();

      if (error || !data) return;

      if (data.executed) {
        clearInterval(_modePollTimer);
        _modePollTimer = null;

        applyModeUI(_controlMode);
        if (statusEl) {
          statusEl.className = 'mode-status-text mode-status-ok';
          statusEl.textContent = _controlMode === 'auto'
            ? 'Diterapkan – pintu dikontrol otomatis oleh Fuzzy Sugeno'
            : 'Diterapkan – pintu hanya bergerak dari perintah manual';
        }
      }
    } catch { /* ignore */ }
  }, 2000);
}

/** Muat mode terakhir dari Supabase saat halaman Control dibuka */
async function loadModeState() {
  const statusEl = document.getElementById('modeStatusText');

  try {
    const { data, error } = await window.db
      .from('mode_commands')
      .select('mode, executed, created_at')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      // Tabel belum dibuat -> pakai default AUTO
      console.warn('[Mode] mode_commands belum tersedia:', error.message);
      _controlMode = 'auto';
      applyModeUI('auto');
      if (statusEl) {
        statusEl.className = 'mode-status-text mode-status-err';
        statusEl.textContent = 'Tabel mode_commands belum ada di Supabase';
      }
      return;
    }

    if (!data) {
      _controlMode = 'auto';
      applyModeUI('auto');
      if (statusEl) statusEl.textContent = 'Default AUTO (Fuzzy Sugeno) – belum ada perintah mode';
      return;
    }

    _controlMode = data.mode === 'manual' ? 'manual' : 'auto';
    applyModeUI(_controlMode);

    if (statusEl) {
      if (!data.executed) {
        statusEl.textContent = 'Menunggu eksekusi ESP32...';
      } else {
        statusEl.className = 'mode-status-text mode-status-ok';
        statusEl.textContent = _controlMode === 'auto'
          ? 'Mode terakhir: AUTO (Fuzzy Sugeno)'
          : 'Mode terakhir: MANUAL';
      }
    }
  } catch (e) {
    console.warn('[Mode] Gagal load mode:', e);
  }
}

window.controlModule = { renderControl };
window.sendServo = sendServo;
window.sendAllServos = sendAllServos;
window.adjustServo = adjustServo;
window.saveCalibration = saveCalibration;
window.togglePump = togglePump;
window.setControlMode = setControlMode;
window.loadModeState = loadModeState;
