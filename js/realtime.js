let _realtimeChannel = null;
let _realtimeDestroyed = false;
const _realtimeCallbacks = [];

let _rawChannel = null;
const _rawCallbacks = [];

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
 * Subscribe ke Realtime BROADCAST (data mentah dari ESP32, ~2 detik).
 * Data ini TIDAK disimpan ke database, khusus untuk tampilan real-time
 * agar penyimpanan Supabase tidak cepat penuh.
 * @param {Function} callback - fn(payload) dipanggil setiap broadcast masuk
 */
function subscribeToRawSensor(callback) {
  if (typeof callback === 'function' && !_rawCallbacks.includes(callback)) {
    _rawCallbacks.push(callback);
  }

  if (_rawChannel) return;

  _realtimeDestroyed = false;

  const channel = window.db.channel('raw_sensor');
  _rawChannel = channel;

  channel
    .on('broadcast', { event: 'raw_data' }, (message) => {
      const row = (message && message.payload) ? message.payload : {};
      _rawCallbacks.forEach(cb => {
        try { cb(row); } catch (e) { console.error('[Realtime] Raw callback error:', e); }
      });
    })
    .subscribe((status) => {
      console.log('[Realtime] Raw status:', status);

      if (_rawChannel !== channel) return;

      if (status === 'SUBSCRIBED') {
        console.log('[Realtime] Terhubung ke broadcast raw_sensor');
        return;
      }

      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        console.warn('[Realtime] Broadcast terputus, mencoba reconnect...');
        _rawChannel = null;
        setTimeout(() => {
          if (!_realtimeDestroyed && _rawCallbacks.length > 0) {
            subscribeToRawSensor();
          }
        }, 5000);
      }
    });
}

/**
 * Unsubscribe semua channel (data tersimpan + broadcast) dan bersihkan callback
 */
function unsubscribeAll() {
  const ch = _realtimeChannel;
  // Set null lebih dulu supaya callback CLOSED dari channel ini diabaikan
  _realtimeChannel  = null;
  _realtimeCallbacks.length = 0;
  if (ch) window.db.removeChannel(ch);

  const rawCh = _rawChannel;
  _rawChannel = null;
  _rawCallbacks.length = 0;
  if (rawCh) window.db.removeChannel(rawCh);

  _realtimeDestroyed = true;
}

window.realtime = { subscribeToSensorData, subscribeToRawSensor, unsubscribeAll };
