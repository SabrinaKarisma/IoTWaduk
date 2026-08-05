// =============================================================================
// app.js – SPA Router & Entry Point
// Hash-based routing: #home, #control, #grafik, #data
// =============================================================================

// =============================================================================
// Router
// =============================================================================
const routes = {
  home:    { render: () => window.homeModule.renderHome(),    destroy: () => window.homeModule.destroyHome() },
  control: { render: () => window.controlModule.renderControl(), destroy: () => {} },
  grafik:  { render: () => window.grafikModule.renderGrafik(),  destroy: () => window.charts.destroyAllCharts() },
  data:    { render: () => window.dataModule.renderData(),       destroy: () => {} }
};

let currentPage  = null;

function navigate(hash) {
  const page = hash.replace('#', '') || 'home';
  const route = routes[page] || routes['home'];

  // Cleanup halaman sebelumnya
  if (currentPage && routes[currentPage] && routes[currentPage].destroy) {
    try { routes[currentPage].destroy(); } catch (e) {}
  }

  // Update active nav link
  document.querySelectorAll('.nav-link').forEach(link => {
    const pageName = link.getAttribute('data-page');
    link.classList.toggle('active', pageName === page);
  });

  // Close hamburger menu di mobile
  const navLinks = document.getElementById('navLinks');
  if (navLinks) navLinks.classList.remove('open');

  // Render halaman baru
  currentPage = page;
  try {
    route.render();
  } catch (e) {
    console.error('[Router] Render error:', e);
    document.getElementById('mainContent').innerHTML = `
      <div class="page">
        <div class="empty-state">
          <div class="empty-state-icon">⚠️</div>
          <div class="empty-state-title">Terjadi Kesalahan</div>
          <div class="empty-state-text">${e.message}</div>
        </div>
      </div>`;
  }
}

// =============================================================================
// Hamburger Menu
// =============================================================================
function initHamburger() {
  const btn = document.getElementById('navHamburger');
  const menu = document.getElementById('navLinks');
  if (!btn || !menu) return;

  btn.addEventListener('click', () => {
    menu.classList.toggle('open');
  });

  // Tutup menu saat klik link
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => menu.classList.remove('open'));
  });
}

// =============================================================================
// INIT – Dipanggil saat DOM siap
// =============================================================================
function init() {
  // Inisialisasi hamburger
  initHamburger();

  // Klik nav link → navigasi
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      const page = link.getAttribute('data-page');
      window.location.hash = page;
    });
  });

  // Hash change event
  window.addEventListener('hashchange', () => {
    navigate(window.location.hash);
  });

  // Load halaman awal
  const initPage = window.location.hash || '#home';
  navigate(initPage);
}

// DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
