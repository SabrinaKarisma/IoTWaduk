let _realtimeChannel = null;
let _realtimeDestroyed = false;
const _realtimeCallbacks = [];

/**
 * Subscribe ke tabel sensor_data, event INSERT
 * @param {Function} callback - fn(newRow) dipanggil setiap ada data baru
 */
function subscribeToSensorData(callback) {
  if (typeof callback === 'function' && !_realtimeCallbacks.includes(callback)) {
    _realtimeCallbacks.push(callback);
  }

  // Kalau channel sudah aktif (mis. halaman di-render ulang), callback baru
  // cukup menumpang di channel yang sama.
  if (_realtimeChannel) return;

  _realtimeDestroyed = false;

  const channel = window.db.channel('sensor_data_realtime');
  _realtimeChannel = channel;

  channel
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'sensor_data' },
      (payload) => {
        const row = payload.new;
        // Panggil semua callback yang terdaftar
        _realtimeCallbacks.forEach(cb => {
          try { cb(row); } catch (e) { console.error('[Realtime] Callback error:', e); }
        });
      }
    )
    .subscribe((status) => {
      console.log('[Realtime] Status:', status);

      // Abaikan callback dari channel lama (mis. setelah pindah halaman)
      if (_realtimeChannel !== channel) return;

      if (status === 'SUBSCRIBED') {
        console.log('[Realtime] Terhubung ke sensor_data');
        return;
      }

      // CLOSED = unsubscribe yang kita minta sendiri (pindah halaman),
      // bukan gangguan koneksi -> tidak perlu reconnect.
      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        console.warn('[Realtime] Koneksi terputus, mencoba reconnect...');
        _realtimeChannel = null;
        // Auto-reconnect setelah 5 detik
        setTimeout(() => {
          if (!_realtimeDestroyed && _realtimeCallbacks.length > 0) {
            subscribeToSensorData();
          }
        }, 5000);
      }
    });
}

/**
 * Unsubscribe dan bersihkan semua callback
 */
function unsubscribeAll() {
  const ch = _realtimeChannel;
  // Set null lebih dulu supaya callback CLOSED dari channel ini diabaikan
  _realtimeChannel  = null;
  _realtimeDestroyed = true;
  _realtimeCallbacks.length = 0;
  if (ch) window.db.removeChannel(ch);
}

window.realtime = { subscribeToSensorData, unsubscribeAll };
