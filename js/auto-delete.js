async function runAutoDelete() {
  try {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);
    const cutoffISO = cutoff.toISOString();

    const { count, error: countErr } = await window.db
      .from('sensor_data')
      .select('id', { count: 'exact', head: true })
      .lt('timestamp', cutoffISO);

    if (countErr) return;
    if (!count || count === 0) return;

    console.log(`[AutoDelete] Ditemukan ${count} data > 30 hari`);

    const { error: delErr } = await window.db
      .from('sensor_data')
      .delete()
      .lt('timestamp', cutoffISO);

    if (delErr) {
      console.error('[AutoDelete] Gagal menghapus:', delErr.message);
      return;
    }

    console.log(`[AutoDelete] ${count} data lama dihapus`);
    window.notify.info(`${count} data lama (>30 hari) berhasil dihapus`, 5000);

  } catch (e) {
    console.error('[AutoDelete] Error:', e);
  }
}

setTimeout(runAutoDelete, 5000);

window.autoDelete = { runAutoDelete };
