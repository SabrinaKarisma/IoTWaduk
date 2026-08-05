let _realtimeChannel = null;
const _realtimeCallbacks = [];

/**
 * Subscribe ke tabel sensor_data, event INSERT
 * @param {Function} callback - fn(newRow) dipanggil setiap ada data baru
 */
function subscribeToSensorData(callback) {
  _realtimeCallbacks.push(callback);

  // Jika sudah subscribe, tidak perlu membuat channel baru
  if (_realtimeChannel) return;

  _realtimeChannel = window.db
    .channel('sensor_data_realtime')
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
      if (status === 'SUBSCRIBED') {
        console.log('[Realtime] Terhubung ke sensor_data');
      }
      if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
        console.warn('[Realtime] Koneksi terputus, mencoba reconnect...');
        _realtimeChannel = null;
        // Auto-reconnect setelah 5 detik
        setTimeout(() => {
          if (_realtimeCallbacks.length > 0) {
            const cb = _realtimeCallbacks[0];
            _realtimeCallbacks.length = 0;
            subscribeToSensorData(cb);
          }
        }, 5000);
      }
    });
}

/**
 * Unsubscribe dan bersihkan semua callback
 */
function unsubscribeAll() {
  if (_realtimeChannel) {
    window.db.removeChannel(_realtimeChannel);
    _realtimeChannel = null;
  }
  _realtimeCallbacks.length = 0;
}

window.realtime = { subscribeToSensorData, unsubscribeAll };
