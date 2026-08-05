// =============================================================================
// control.js – Halaman CONTROL
// Kontrol manual servo + konfigurasi kalibrasi Fuzzy
// =============================================================================

// =============================================================================
// renderControl() – Render HTML halaman Control
// =============================================================================
function renderControl() {
  const main = document.getElementById('mainContent');
  main.innerHTML = `
    <div class="page" id="controlPage">
      <div class="page-header">
        <h1 class="page-title">Control Panel</h1>
        <p class="page-subtitle">Kontrol manual pintu air dan konfigurasi parameter Fuzzy Logic</p>
      </div>

      <div class="control-layout">
        <!-- Kolom Kiri: Servo Control -->
        <div>
          <div class="section-title">Kontrol Servo Manual</div>

          <!-- All servos at once -->
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

          <!-- Individual servos -->
          <div class="servo-grid" id="servoGrid">
            ${[1, 2, 3].map(i => buildServoWidget(i)).join('')}
          </div>
        </div>

        <!-- Kolom Kanan: Kalibrasi -->
        <div>
          <div class="section-title">Konfigurasi Kalibrasi</div>
          <div class="calib-section">
            <h3>Kalibrasi Sensor TDS</h3>
            <div class="calib-grid">
              <div class="form-group">
                <label class="form-label">Slope TDS (ppm/V)</label>
                <input type="number" class="form-input" id="calibTdsSlope" step="0.01" value="500">
                <span class="form-hint">Default: 500</span>
              </div>
              <div class="form-group">
                <label class="form-label">Offset TDS (ppm)</label>
                <input type="number" class="form-input" id="calibTdsOffset" step="0.1" value="0">
              </div>
            </div>
            <h3 style="margin-top:20px">Kalibrasi Sensor pH</h3>
            <div class="calib-grid">
              <div class="form-group">
                <label class="form-label">Slope pH (/V)</label>
                <input type="number" class="form-input" id="calibPhSlope" step="0.01" value="-5.70">
              </div>
              <div class="form-group">
                <label class="form-label">Offset pH</label>
                <input type="number" class="form-input" id="calibPhOffset" step="0.01" value="0">
              </div>
            </div>
          </div>

          <div class="calib-section" style="margin-top:16px">
            <h3>Parameter Fuzzy Logic</h3>
            <div style="font-size:12px; color:var(--color-text-muted); margin-bottom:12px">
              Batas membership function TDS (ppm)
            </div>
            <div class="calib-grid">
              <div class="form-group">
                <label class="form-label">TDS Rendah (atas)</label>
                <input type="number" class="form-input" id="fzTdsLow" value="200">
              </div>
              <div class="form-group">
                <label class="form-label">TDS Sedang (puncak)</label>
                <input type="number" class="form-input" id="fzTdsMid" value="500">
              </div>
              <div class="form-group">
                <label class="form-label">TDS Tinggi (bawah)</label>
                <input type="number" class="form-input" id="fzTdsHigh" value="800">
              </div>
            </div>

            <div style="font-size:12px; color:var(--color-text-muted); margin-bottom:12px; margin-top:8px">
              Batas membership function Jarak (cm)
            </div>
            <div class="calib-grid">
              <div class="form-group">
                <label class="form-label">Jarak Rendah (atas)</label>
                <input type="number" class="form-input" id="fzDistLow" value="20">
              </div>
              <div class="form-group">
                <label class="form-label">Jarak Sedang (puncak)</label>
                <input type="number" class="form-input" id="fzDistMid" value="50">
              </div>
              <div class="form-group">
                <label class="form-label">Jarak Tinggi (bawah)</label>
                <input type="number" class="form-input" id="fzDistHigh" value="80">
              </div>
            </div>

            <div style="font-size:12px; color:var(--color-text-muted); margin-bottom:12px; margin-top:8px">
              Output Rule Base (derajat servo 0–180°) [TDS baris, Jarak kolom]
            </div>
            <div style="font-size:11px; color:var(--color-text-disabled); margin-bottom:8px">
              ↓TDS \\ Jarak→ &nbsp; Rendah &nbsp;&nbsp; Sedang &nbsp;&nbsp; Tinggi
            </div>
            <div class="calib-rule-grid">
              ${buildRuleGrid()}
            </div>
          </div>

          <div style="display:flex; gap:12px; margin-top:16px">
            <button class="btn btn-primary btn-block" onclick="saveCalibration()" id="btnSaveCalib">
              Simpan Kalibrasi
            </button>
          </div>
          <div id="calibStatus" style="text-align:center; margin-top:8px; font-size:13px; color:var(--color-text-muted); height:20px"></div>
        </div>
      </div>
    </div>
  `;

  // Load nilai kalibrasi dari Supabase
  loadCalibration();
}

// =============================================================================
// buildServoWidget() – HTML untuk satu servo control
// =============================================================================
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
        <button class="btn btn-success btn-sm"  onclick="sendServo(${n}, 180)" id="btnS${n}Full">Full</button>
      </div>
      <div class="servo-adj" style="margin-top:8px">
        <button class="btn btn-secondary btn-sm" onclick="adjustServo(${n},-10)">−10</button>
        <button class="btn btn-secondary btn-sm" onclick="adjustServo(${n},-1)">−1</button>
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

// =============================================================================
// buildRuleGrid() – 9 input untuk rule base 3×3
// =============================================================================
function buildRuleGrid() {
  const labels = [
    ['TDS Rendah + Jarak Rendah','TDS Rendah + Jarak Sedang','TDS Rendah + Jarak Tinggi'],
    ['TDS Sedang + Jarak Rendah','TDS Sedang + Jarak Sedang','TDS Sedang + Jarak Tinggi'],
    ['TDS Tinggi + Jarak Rendah','TDS Tinggi + Jarak Sedang','TDS Tinggi + Jarak Tinggi'],
  ];
  const defaults = [[60,30,45],[120,90,105],[150,180,165]];

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

// =============================================================================
// sendServo() – Kirim perintah servo ke Supabase
// =============================================================================
async function sendServo(servoId, pos) {
  pos = Math.max(0, Math.min(180, Math.round(pos)));
  const statusEl = document.getElementById(`servoStatus${servoId}`);
  if (statusEl) { statusEl.textContent = '⏳ Mengirim...'; statusEl.className = 'servo-status sent'; }

  // Update slider display
  const slider = document.getElementById(`servoSlider${servoId}`);
  const display = document.getElementById(`servoPos${servoId}Display`);
  if (slider)  slider.value = pos;
  if (display) display.textContent = pos + '°';

  try {
    const { error } = await window.db.from('servo_commands').insert({
      servo_id:        servoId,
      target_position: pos,
      command_type:    'manual',
      executed:        false
    });

    if (error) throw error;
    if (statusEl) { statusEl.textContent = '✅ Terkirim – Menunggu eksekusi...'; statusEl.className = 'servo-status sent'; }
    notify.success(`Servo ${servoId} → ${pos}°`);

    // Poll status eksekusi
    pollServoExecution(servoId, statusEl);
  } catch (e) {
    if (statusEl) { statusEl.textContent = '❌ Gagal mengirim'; statusEl.className = 'servo-status error'; }
    notify.error(`Gagal kirim perintah servo ${servoId}`);
  }
}

// =============================================================================
// sendAllServos() – Kirim ke semua 3 servo
// =============================================================================
async function sendAllServos(pos) {
  pos = Math.max(0, Math.min(180, Math.round(pos)));
  for (let i = 1; i <= 3; i++) {
    await sendServo(i, pos);
    await new Promise(r => setTimeout(r, 200));
  }
}

// =============================================================================
// adjustServo() – Increment/decrement slider nilai
// =============================================================================
function adjustServo(n, delta) {
  const slider = document.getElementById(`servoSlider${n}`);
  const display = document.getElementById(`servoPos${n}Display`);
  if (!slider) return;
  const newVal = Math.max(0, Math.min(180, parseInt(slider.value) + delta));
  slider.value = newVal;
  if (display) display.textContent = newVal + '°';
}

// =============================================================================
// pollServoExecution() – Cek apakah command sudah dieksekusi (maks 30 detik)
// =============================================================================
async function pollServoExecution(servoId, statusEl) {
  const start = Date.now();
  const interval = setInterval(async () => {
    if (Date.now() - start > 30000) {
      clearInterval(interval);
      if (statusEl) { statusEl.textContent = '⏱️ Timeout'; statusEl.className = 'servo-status error'; }
      return;
    }
    try {
      const { data } = await window.db
        .from('servo_commands')
        .select('executed, executed_at')
        .eq('servo_id', servoId)
        .eq('executed', false)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (!data) {
        // Command sudah dieksekusi (tidak ada unexecuted)
        clearInterval(interval);
        if (statusEl) { statusEl.textContent = '✅ Dieksekusi!'; statusEl.className = 'servo-status executed'; }
      }
    } catch { /* ignore */ }
  }, 2000);
}

// =============================================================================
// loadCalibration() – Muat nilai kalibrasi dari Supabase calibration_config
// =============================================================================
async function loadCalibration() {
  try {
    const { data, error } = await window.db
      .from('calibration_config')
      .select('config_key, config_value');

    if (error || !data) return;

    const map = {};
    data.forEach(r => { map[r.config_key] = r.config_value; });

    const set = (id, key, def) => {
      const el = document.getElementById(id);
      if (el && map[key] !== undefined) el.value = map[key];
      else if (el && def !== undefined) el.value = def;
    };

    set('calibTdsSlope',  'tds_slope',   500);
    set('calibTdsOffset', 'tds_offset',  0);
    set('calibPhSlope',   'ph_slope',    -5.70);
    set('calibPhOffset',  'ph_offset',   0);
    set('fzTdsLow',       'fz_tds_low',  200);
    set('fzTdsMid',       'fz_tds_mid',  500);
    set('fzTdsHigh',      'fz_tds_high', 800);
    set('fzDistLow',      'fz_dist_low', 20);
    set('fzDistMid',      'fz_dist_mid', 50);
    set('fzDistHigh',     'fz_dist_high',80);

    for (let i = 0; i < 3; i++)
      for (let j = 0; j < 3; j++)
        set(`rule_${i}_${j}`, `fr_${i}${j}`);

    // Update mode badge
    notify.info('Konfigurasi kalibrasi dimuat dari cloud');
  } catch (e) {
    console.error('[Control] Gagal load kalibrasi:', e);
  }
}

// =============================================================================
// saveCalibration() – Simpan semua nilai kalibrasi ke Supabase
// =============================================================================
async function saveCalibration() {
  const btn    = document.getElementById('btnSaveCalib');
  const status = document.getElementById('calibStatus');
  if (btn) { btn.disabled = true; btn.textContent = '⏳ Menyimpan...'; }

  const entries = [
    { config_key: 'tds_slope',    config_value: +document.getElementById('calibTdsSlope').value },
    { config_key: 'tds_offset',   config_value: +document.getElementById('calibTdsOffset').value },
    { config_key: 'ph_slope',     config_value: +document.getElementById('calibPhSlope').value },
    { config_key: 'ph_offset',    config_value: +document.getElementById('calibPhOffset').value },
    { config_key: 'fz_tds_low',   config_value: +document.getElementById('fzTdsLow').value },
    { config_key: 'fz_tds_mid',   config_value: +document.getElementById('fzTdsMid').value },
    { config_key: 'fz_tds_high',  config_value: +document.getElementById('fzTdsHigh').value },
    { config_key: 'fz_dist_low',  config_value: +document.getElementById('fzDistLow').value },
    { config_key: 'fz_dist_mid',  config_value: +document.getElementById('fzDistMid').value },
    { config_key: 'fz_dist_high', config_value: +document.getElementById('fzDistHigh').value },
  ];

  // Rule outputs
  for (let i = 0; i < 3; i++)
    for (let j = 0; j < 3; j++)
      entries.push({ config_key: `fr_${i}${j}`, config_value: +document.getElementById(`rule_${i}_${j}`).value });

  try {
    for (const entry of entries) {
      const { error } = await window.db
        .from('calibration_config')
        .upsert({ ...entry, updated_at: new Date().toISOString() }, { onConflict: 'config_key' });
      if (error) throw error;
    }

    if (status) { status.textContent = '✅ Tersimpan! ESP32 akan sync dalam ≤30 detik'; status.style.color = 'var(--color-success)'; }
    notify.success('Kalibrasi berhasil disimpan ke cloud!');
  } catch (e) {
    if (status) { status.textContent = '❌ Gagal menyimpan: ' + e.message; status.style.color = 'var(--color-danger)'; }
    notify.error('Gagal menyimpan kalibrasi');
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = '💾 Simpan Kalibrasi ke Cloud'; }
  }
}

window.controlModule = { renderControl };
// Expose ke global untuk onclick handlers
window.sendServo     = sendServo;
window.sendAllServos = sendAllServos;
window.adjustServo   = adjustServo;
window.saveCalibration = saveCalibration;
