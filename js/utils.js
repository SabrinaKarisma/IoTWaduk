/**
 * Format angka desimal dengan jumlah digit tertentu
 * @param {number} val - Nilai
 * @param {number} decimals - Jumlah desimal
 * @returns {string}
 */
function fmt(val, decimals = 1) {
  if (val === null || val === undefined || isNaN(val)) return '—';
  return Number(val).toFixed(decimals);
}

/**
 * Format timestamp ISO ke tampilan lokal Indonesia
 * @param {string} isoString
 * @returns {string}
 */
function fmtTime(isoString) {
  if (!isoString) return '—';
  const d = new Date(isoString);
  return d.toLocaleString('id-ID', {
    day:    '2-digit',
    month:  '2-digit',
    year:   'numeric',
    hour:   '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

/**
 * Format timestamp ke waktu saja (HH:MM:SS)
 */
function fmtTimeOnly(isoString) {
  if (!isoString) return '—';
  const d = new Date(isoString);
  return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

/**
 * Format tanggal ke YYYY-MM-DD (untuk nama file CSV)
 */
function fmtDateISO(date = new Date()) {
  return date.toISOString().split('T')[0];
}

/**
 * Clamp nilai antara min dan max
 */
function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

/**
 * Map nilai dari satu range ke range lain
 */
function mapRange(val, inMin, inMax, outMin, outMax) {
  return outMin + ((val - inMin) / (inMax - inMin)) * (outMax - outMin);
}

/**
 * Warna threshold untuk TDS
 * < 300: hijau | 300–600: kuning | > 600: merah
 */
function tdsColor(ppm) {
  if (ppm < 300) return 'var(--color-success)';
  if (ppm < 600) return 'var(--color-warning)';
  return 'var(--color-danger)';
}

/**
 * Warna threshold untuk pH
 * 6–8: hijau | 5–6 atau 8–9: kuning | di luar itu: merah
 */
function phColor(ph) {
  if (ph >= 6 && ph <= 8) return 'var(--color-success)';
  if (ph >= 5 && ph <= 9) return 'var(--color-warning)';
  return 'var(--color-danger)';
}

/**
 * Label kategori bukaan pintu
 */
function gateLabel(cat) {
  return ['🔒 Tertutup', '⚡ Setengah', '✅ Terbuka Penuh'][cat] || '—';
}

/**
 * Warna kategori bukaan pintu
 */
function gateColor(cat) {
  return [
    'var(--color-danger)',
    'var(--color-warning)',
    'var(--color-success)'
  ][cat] || 'var(--color-text-muted)';
}

/**
 * Konversi array of objects ke CSV string
 * @param {Object[]} rows
 * @param {string[]} columns - Urutan kolom
 * @returns {string}
 */
function toCSV(rows, columns) {
  if (!rows || rows.length === 0) return '';
  const header = columns.join(',');
  const body = rows.map(row =>
    columns.map(col => {
      const v = row[col];
      if (v === null || v === undefined) return '';
      const s = String(v);
      // Escape jika mengandung koma, newline, atau kutip
      return s.includes(',') || s.includes('\n') || s.includes('"')
        ? `"${s.replace(/"/g, '""')}"`
        : s;
    }).join(',')
  ).join('\n');
  return header + '\n' + body;
}

/**
 * Trigger download file di browser
 */
function downloadFile(content, filename, mimeType = 'text/csv') {
  const blob = new Blob([content], { type: mimeType });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Debounce function
 */
function debounce(fn, delay = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Hitung statistik dari array angka
 */
function calcStats(arr) {
  const nums = arr.filter(v => v !== null && v !== undefined && !isNaN(v));
  if (nums.length === 0) return { avg: 0, min: 0, max: 0, count: 0 };
  const sum = nums.reduce((a, b) => a + b, 0);
  return {
    avg:   sum / nums.length,
    min:   Math.min(...nums),
    max:   Math.max(...nums),
    count: nums.length
  };
}

/**
 * Tampilkan / sembunyikan elemen
 */
function show(id) { const el = document.getElementById(id); if (el) el.style.display = ''; }
function hide(id) { const el = document.getElementById(id); if (el) el.style.display = 'none'; }

/**
 * Set teks elemen by ID
 */
function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

/**
 * Set atribut style elemen by ID
 */
function setStyle(id, prop, val) {
  const el = document.getElementById(id);
  if (el) el.style[prop] = val;
}

// Ekspos ke global scope
window.utils = {
  fmt, fmtTime, fmtTimeOnly, fmtDateISO,
  clamp, mapRange,
  tdsColor, phColor, gateLabel, gateColor,
  toCSV, downloadFile, debounce, calcStats,
  show, hide, setText, setStyle
};
