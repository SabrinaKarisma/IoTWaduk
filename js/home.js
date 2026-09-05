let homeOfflineTimer  = null;
let lastDataTimestamp = null;

function renderHome() {
  const main = document.getElementById('mainContent');
  main.innerHTML = `
    <div class="page" id="homePage">

      <!-- Hero Banner -->
      <div class="home-hero">
        <h1>SISTEM MONITORING KENDALI PINTU AIR WADUK <span>Berbasis Fuzzy Sugeno</span></h1>
        <p>
          Sistem monitoring real-time level air dan curah hujan dengan kontrol otomatis
          bukaan pintu air menggunakan algoritma Fuzzy Sugeno. Peringatan dini hujan
          dikirim via Telegram secara otomatis.
        </p>
      </div>

      <!-- Section: Sensor Real-Time -->
      <div class="section">
        <div class="section-title">Parameter Sensor Real-Time</div>
        <div class="sensor-grid" id="sensorGrid">
          ${buildSensorCards()}
        </div>
      </div>

      <!-- Gate Indicator -->
      <div class="gate-indicator" id="gateIndicator">
        <div class="gate-visual">
          <svg width="80" height="80" viewBox="0 0 80 80">
            <circle cx="40" cy="40" r="32" fill="none" stroke="var(--color-border)" stroke-width="8"/>
            <circle id="gateArc" cx="40" cy="40" r="32" fill="none"
              stroke="var(--color-success)" stroke-width="8"
              stroke-linecap="round"
              stroke-dasharray="201"
              stroke-dashoffset="201"
              transform="rotate(-90 40 40)"
              style="transition: stroke-dashoffset 0.8s cubic-bezier(0.4,0,0.2,1), stroke 0.4s ease"/>
          </svg>
        </div>
        <div>
          <div class="gate-label">Status Pintu Air</div>
          <div class="gate-name" id="gateName">—</div>
          <div class="gate-deg" id="gateDeg">— °</div>
          <div style="margin-top:8px">
            <span class="badge badge-muted" id="gateBadge">Menunggu data...</span>
          </div>
        </div>
        <div style="margin-left:auto; text-align:right">
          <div style="font-size:12px; color:var(--color-text-muted); margin-bottom:4px">Pintu 1</div>
          <div class="badge badge-info" id="servoS1">—°</div>
          <div style="font-size:12px; color:var(--color-text-muted); margin-top:8px; margin-bottom:4px">Pintu 2</div>
          <div class="badge badge-info" id="servoS2">—°</div>
          <div style="font-size:12px; color:var(--color-text-muted); margin-top:8px; margin-bottom:4px">Pintu 3</div>
          <div class="badge badge-info" id="servoS3">—°</div>
        </div>
      </div>

      <!-- Section: Info Sistem -->
      <div class="section">
        <div class="section-title">Tentang Sistem</div>
        <div class="info-grid">
          <div class="info-card">
            <div class="info-card-title">Sensor Level Air</div>
            <div class="info-card-text">
              JSN-SR04T ultrasonik waterproof untuk mengukur level air (cm)
              secara non-blocking. Data digunakan sebagai input utama Fuzzy Logic
              untuk menentukan bukaan pintu waduk.
            </div>
          </div>
          <div class="info-card">
            <div class="info-card-title">Sensor Hujan & Peringatan Dini</div>
            <div class="info-card-text">
              Sensor rain digital mendeteksi curah hujan secara real-time.
              Ketika hujan terdeteksi, ESP32 otomatis mengirim notifikasi
              peringatan dini ke Telegram dalam &lt;1 menit.
            </div>
          </div>
          <div class="info-card">
            <div class="info-card-title">Fuzzy Logic Sugeno</div>
            <div class="info-card-text">
              Algoritma Fuzzy Sugeno Order-0 dengan 3 rule (Rendah/Sedang/Tinggi jarak).
              Output berupa derajat servo 0–180° yang mengontrol
              3 buah servo MG996R secara serentak sebagai aktuator pintu.
            </div>
          </div>
        </div>
      </div>

      <!-- Section: Ringkasan Harian -->
      <div class="section">
        <div class="section-title">Ringkasan Harian</div>
        <div class="summary-card" id="summaryCard">
          <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:8px">
            <h3 style="font-size:16px; font-weight:600;"><span id="summaryDate">—</span></h3>
            <span class="badge badge-muted" id="summaryStatus">Memuat...</span>
          </div>
          <div id="summaryContent">
            <div class="loading-spinner" style="margin:24px auto;"></div>
          </div>
        </div>
      </div>

    </div>
  `;

  window.realtime.subscribeToSensorData(onNewSensorData);
  startOfflineDetection();
  loadLatestSensorData();
  loadDailySummary();
}

function buildSensorCards() {
  const sensors = [
    { id: 'cardDist',  label: 'Level Air',    unit: 'cm', color: 'var(--color-dist)' },
    { id: 'cardRain',  label: 'Status Hujan', unit: '',   color: 'var(--color-rain)' },
    { id: 'cardFuzzy', label: 'Output Fuzzy', unit: '°',  color: 'var(--color-fuzzy)' },
  ];

  return sensors.map(s => `
    <div class="sensor-card" id="${s.id}">
      <div class="sensor-card-accent" style="background:${s.color}"></div>
      <div class="sensor-card-label">${s.label}</div>
      <div class="sensor-card-value" id="${s.id}Val" style="color:${s.color}">—</div>
      <div class="sensor-card-unit">${s.unit}</div>
      <div class="sensor-card-sub" id="${s.id}Sub"></div>
      <div class="sensor-bar">
        <div class="sensor-bar-fill" id="${s.id}Bar" style="width:0%; background:${s.color}"></div>
      </div>
    </div>
  `).join('');
}

function onNewSensorData(row) {
  lastDataTimestamp = Date.now();
  updateSensorCards(row);
  updateGateIndicator(row);
  updateOnlineStatus(true);
}

async function loadLatestSensorData() {
  try {
    const { data, error } = await window.db
      .from('sensor_data')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) return;

    const age = Date.now() - new Date(data.timestamp).getTime();
    if (age < 30000) {
      lastDataTimestamp = Date.now();
      updateOnlineStatus(true);
    }

    updateSensorCards(data);
    updateGateIndicator(data);

  } catch (e) {
    console.error('[Home] Gagal load data awal:', e);
  }
}

function updateSensorCards(row) {
  const { fmt, mapRange, clamp } = window.utils;

  // Level Air (Jarak)
  const dist = row.distance_cm;
  document.getElementById('cardDistVal').textContent = fmt(dist, 0);
  document.getElementById('cardDistSub').textContent =
    dist < 20 ? 'Kritis Tinggi' : dist < 50 ? 'Sedang' : 'Rendah/Aman';
  document.getElementById('cardDistBar').style.width =
    clamp(mapRange(dist, 0, 100, 0, 100), 0, 100) + '%';

  // Status Hujan
  const rainDig = row.rain_digital;
  document.getElementById('cardRainVal').textContent = rainDig ? 'Hujan' : 'Cerah';
  document.getElementById('cardRainSub').textContent = rainDig
    ? '⚠️ Peringatan dini aktif'
    : 'Tidak ada hujan';
  document.getElementById('cardRainBar').style.width = rainDig ? '80%' : '10%';
  document.getElementById('cardRainVal').style.color = rainDig
    ? 'var(--color-danger)'
    : 'var(--color-success)';

  // Fuzzy Output
  const fuzzy = row.fuzzy_output;
  document.getElementById('cardFuzzyVal').textContent = fmt(fuzzy, 1);
  document.getElementById('cardFuzzySub').textContent = window.utils.gateLabel(row.gate_position);
  document.getElementById('cardFuzzyBar').style.width =
    clamp(mapRange(fuzzy, 0, 180, 0, 100), 0, 100) + '%';
}

function updateGateIndicator(row) {
  const { gateLabel, gateColor, fmt } = window.utils;

  const fuzzy  = row.fuzzy_output || 0;
  const cat    = row.gate_position ?? 0;
  const color  = gateColor(cat);
  const label  = gateLabel(cat);
  const circ   = 201;
  const pct    = Math.min(fuzzy / 180, 1);
  const offset = circ * (1 - pct);

  const arc = document.getElementById('gateArc');
  if (arc) {
    arc.setAttribute('stroke-dashoffset', offset);
    arc.setAttribute('stroke', color);
  }

  const nameEl = document.getElementById('gateName');
  if (nameEl) { nameEl.textContent = label; nameEl.style.color = color; }

  const degEl = document.getElementById('gateDeg');
  if (degEl) degEl.textContent = `${fmt(fuzzy, 1)}°`;

  const badgeEl = document.getElementById('gateBadge');
  if (badgeEl) {
    const cls = ['badge-danger', 'badge-warning', 'badge-success'][cat] || 'badge-muted';
    badgeEl.className = `badge ${cls}`;
    badgeEl.textContent = label;
  }

  const s1 = document.getElementById('servoS1');
  const s2 = document.getElementById('servoS2');
  const s3 = document.getElementById('servoS3');
  if (s1) s1.textContent = `${row.servo1_pos ?? '—'}°`;
  if (s2) s2.textContent = `${row.servo2_pos ?? '—'}°`;
  if (s3) s3.textContent = `${row.servo3_pos ?? '—'}°`;
}

function startOfflineDetection() {
  if (homeOfflineTimer) clearInterval(homeOfflineTimer);
  homeOfflineTimer = setInterval(() => {
    if (lastDataTimestamp === null) return;
    const age = Date.now() - lastDataTimestamp;
    updateOnlineStatus(age < 30000);
  }, 5000);
}

function updateOnlineStatus(isOnline) {
  const dot  = document.getElementById('statusDot');
  const text = document.getElementById('statusText');
  if (!dot || !text) return;

  if (isOnline) {
    dot.className  = 'status-dot online';
    text.textContent = 'ONLINE';
    text.style.color = 'var(--color-success)';
    document.querySelectorAll('.sensor-card').forEach(c => c.classList.remove('offline'));
  } else {
    dot.className  = 'status-dot offline';
    text.textContent = 'OFFLINE';
    text.style.color = 'var(--color-danger)';
    document.querySelectorAll('.sensor-card').forEach(c => c.classList.add('offline'));
  }
}

async function loadDailySummary() {
  const todayStr = window.utils.fmtDateISO();
  document.getElementById('summaryDate').textContent =
    new Date().toLocaleDateString('id-ID', { weekday:'long', day:'numeric', month:'long', year:'numeric' });

  try {
    const { data: cached } = await window.db
      .from('daily_summary')
      .select('*')
      .eq('date', todayStr)
      .single();

    if (cached) {
      renderSummary(cached);
      document.getElementById('summaryStatus').textContent = 'Dari cache';
      return;
    }

    const since = new Date();
    since.setHours(0, 0, 0, 0);

    const { data: rows, error } = await window.db
      .from('sensor_data')
      .select('distance_cm, gate_position, rain_digital')
      .gte('timestamp', since.toISOString())
      .order('timestamp', { ascending: false })
      .limit(5000);

    if (error || !rows || rows.length === 0) {
      document.getElementById('summaryContent').innerHTML =
        '<p style="color:var(--color-text-muted); text-align:center; padding:16px">Belum ada data hari ini</p>';
      document.getElementById('summaryStatus').textContent = 'Tidak ada data';
      return;
    }

    const { calcStats } = window.utils;
    const distStats  = calcStats(rows.map(r => r.distance_cm));

    const rainCount   = rows.filter(r => r.rain_digital === true).length;
    const gateClosed  = rows.filter(r => r.gate_position === 0).length;
    const gateHalf    = rows.filter(r => r.gate_position === 1).length;
    const gateFull    = rows.filter(r => r.gate_position === 2).length;
    const total       = rows.length;

    const summaryRow = {
      date: todayStr,
      dist_avg: distStats.avg, dist_min: distStats.min, dist_max: distStats.max,
      rain_count: rainCount,
      gate_closed_count: gateClosed,
      gate_half_count:   gateHalf,
      gate_full_count:   gateFull
    };

    await window.db.from('daily_summary').upsert(summaryRow, { onConflict: 'date' });

    renderSummary(summaryRow);
    document.getElementById('summaryStatus').textContent = `${total} data`;

  } catch (e) {
    console.error('[Summary] Error:', e);
    document.getElementById('summaryContent').innerHTML =
      '<p style="color:var(--color-danger);">Gagal memuat ringkasan</p>';
  }
}

function renderSummary(s) {
  const { fmt } = window.utils;
  const total     = (s.gate_closed_count || 0) + (s.gate_half_count || 0) + (s.gate_full_count || 0);
  const pctClosed = total ? Math.round(s.gate_closed_count / total * 100) : 0;
  const pctHalf   = total ? Math.round(s.gate_half_count   / total * 100) : 0;
  const pctFull   = total ? Math.round(s.gate_full_count   / total * 100) : 0;

  document.getElementById('summaryContent').innerHTML = `
    <div class="summary-stats">
      <div class="summary-stat-item">
        <div class="summary-stat-label">Level Air Rata-rata</div>
        <div class="summary-stat-value" style="color:var(--color-dist)">${fmt(s.dist_avg, 0)} cm</div>
        <div style="font-size:11px;color:var(--color-text-muted);margin-top:4px">
          Min: ${fmt(s.dist_min, 0)} | Max: ${fmt(s.dist_max, 0)}
        </div>
      </div>
      <div class="summary-stat-item">
        <div class="summary-stat-label">Kejadian Hujan</div>
        <div class="summary-stat-value" style="color:var(--color-rain)">${s.rain_count || 0} data</div>
        <div style="font-size:11px;color:var(--color-text-muted);margin-top:4px">
          Terdeteksi ${s.rain_count || 0}x hari ini
        </div>
      </div>
    </div>

    <div style="margin-top:20px">
      <div style="font-size:13px;font-weight:600;color:var(--color-text-secondary);margin-bottom:8px">
        Distribusi Status Pintu Air
      </div>
      <div class="gate-dist-bar">
        <div class="gate-dist-seg" style="flex:${pctClosed||1}; background:var(--color-danger);">${pctClosed > 8 ? pctClosed+'%' : ''}</div>
        <div class="gate-dist-seg" style="flex:${pctHalf||1}; background:var(--color-warning);">${pctHalf > 8 ? pctHalf+'%' : ''}</div>
        <div class="gate-dist-seg" style="flex:${pctFull||1}; background:var(--color-success);">${pctFull > 8 ? pctFull+'%' : ''}</div>
      </div>
      <div style="display:flex;gap:16px;margin-top:8px;font-size:12px;color:var(--color-text-muted)">
        <span>Tertutup: ${pctClosed}% (${s.gate_closed_count})</span>
        <span>⚡ Setengah: ${pctHalf}% (${s.gate_half_count})</span>
        <span>Penuh: ${pctFull}% (${s.gate_full_count})</span>
      </div>
    </div>
  `;
}

function destroyHome() {
  if (homeOfflineTimer) {
    clearInterval(homeOfflineTimer);
    homeOfflineTimer = null;
  }
  window.realtime.unsubscribeAll();
}

window.homeModule = { renderHome, destroyHome };
