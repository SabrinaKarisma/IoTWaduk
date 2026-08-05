// =============================================================================
// notifications.js – Toast Notification System
// =============================================================================

const ToastTypes = {
  SUCCESS: 'success',
  WARNING: 'warning',
  ERROR:   'error',
  INFO:    'info'
};

const TOAST_ICONS = {
  success: '✅',
  warning: '⚠️',
  error:   '❌',
  info:    'ℹ️'
};

/**
 * Tampilkan toast notification
 * @param {string} message  - Pesan yang ditampilkan
 * @param {'success'|'warning'|'error'|'info'} type - Tipe toast
 * @param {number} duration - Durasi tampil dalam ms (default 4000)
 */
function showToast(message, type = 'info', duration = 4000) {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${TOAST_ICONS[type] || 'ℹ️'}</span>
    <span class="toast-msg">${message}</span>
  `;

  container.appendChild(toast);

  // Auto-remove setelah duration
  setTimeout(() => {
    toast.classList.add('toast-out');
    toast.addEventListener('animationend', () => toast.remove(), { once: true });
  }, duration);
}

// Shorthand functions
const notify = {
  success: (msg, dur) => showToast(msg, 'success', dur),
  warning: (msg, dur) => showToast(msg, 'warning', dur),
  error:   (msg, dur) => showToast(msg, 'error',   dur),
  info:    (msg, dur) => showToast(msg, 'info',    dur)
};

window.notify  = notify;
window.showToast = showToast;
