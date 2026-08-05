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

  if (currentPage && routes[currentPage] && routes[currentPage].destroy) {
    try { routes[currentPage].destroy(); } catch (e) {}
  }

  document.querySelectorAll('.nav-link').forEach(link => {
    const pageName = link.getAttribute('data-page');
    link.classList.toggle('active', pageName === page);
  });

  const navLinks = document.getElementById('navLinks');
  if (navLinks) navLinks.classList.remove('open');

  currentPage = page;
  try {
    route.render();
  } catch (e) {
    console.error('[Router] Render error:', e);
    document.getElementById('mainContent').innerHTML = `
      <div class="page">
        <div class="empty-state">
          <div class="empty-state-title">Terjadi Kesalahan</div>
          <div class="empty-state-text">${e.message}</div>
        </div>
      </div>`;
  }
}

function initHamburger() {
  const btn = document.getElementById('navHamburger');
  const menu = document.getElementById('navLinks');
  if (!btn || !menu) return;

  btn.addEventListener('click', () => {
    menu.classList.toggle('open');
  });

  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => menu.classList.remove('open'));
  });
}

function init() {
  initHamburger();

  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      const page = link.getAttribute('data-page');
      window.location.hash = page;
    });
  });

  window.addEventListener('hashchange', () => {
    navigate(window.location.hash);
  });

  const initPage = window.location.hash || '#home';
  navigate(initPage);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
