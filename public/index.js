/* global BareMux, __uv$config */

// ---- bare-mux transport ----
const connection = new BareMux.BareMuxConnection('/baremux/worker.js');

async function ensureTransport() {
  const current = await connection.getTransport();
  if (current !== '/baremod/index.mjs') {
    // Route through our local bare-server-node at /bare/
    await connection.setTransport('/baremod/index.mjs', [{ bare: '/bare/' }]);
  }
}

// ---- service worker ----
async function registerSW() {
  if (!navigator.serviceWorker) {
    throw new Error('Service workers are not supported in this browser (or not on HTTPS / localhost).');
  }
  const reg = await navigator.serviceWorker.register('/uv/sw.js', { scope: __uv$config.prefix });
  await navigator.serviceWorker.ready;
  return reg;
}

// ---- URL helpers ----
function isValidURL(str) {
  try { new URL(str); return true; } catch { return false; }
}
function resolveInput(input) {
  const raw = input.trim();
  if (!raw) return null;
  if (isValidURL(raw)) return raw;
  if (/^[^\s]+\.[^\s]+/.test(raw) && !raw.includes(' ')) {
    return `https://${raw}`;
  }
  return `https://www.google.com/search?q=${encodeURIComponent(raw)}`;
}

// ---- tab management ----
const framesEl = document.getElementById('frames');
const tabsEl = document.querySelector('.tabs');
const newTabBtn = document.getElementById('new-tab');
const homePage = document.getElementById('home-page');
const errorPage = document.getElementById('error-page');
const errorText = document.getElementById('error-text');
const addressInput = document.getElementById('address');
const homeForm = document.getElementById('home-form');
const homeInput = document.getElementById('home-query');
const omnibox = document.getElementById('omnibox');

const tabs = new Map(); // id -> { id, title, url, iframe, history:[], historyIndex:-1 }
let activeTabId = null;

function uid() { return 't_' + Math.random().toString(36).slice(2, 9); }

function renderTabs() {
  tabsEl.querySelectorAll('.tab').forEach(el => el.remove());
  for (const tab of tabs.values()) {
    const el = document.createElement('div');
    el.className = 'tab' + (tab.id === activeTabId ? ' active' : '');
    el.dataset.tabId = tab.id;
    el.innerHTML = `<span class="tab-title"></span><button class="tab-close" title="Close">×</button>`;
    el.querySelector('.tab-title').textContent = tab.title || 'New Tab';
    el.addEventListener('click', (e) => {
      if (e.target.classList.contains('tab-close')) return;
      activateTab(tab.id);
    });
    el.querySelector('.tab-close').addEventListener('click', (e) => {
      e.stopPropagation();
      closeTab(tab.id);
    });
    tabsEl.insertBefore(el, newTabBtn);
  }
}

function showHome() {
  homePage.classList.remove('hidden');
  framesEl.classList.add('hidden');
  errorPage.classList.add('hidden');
  framesEl.querySelectorAll('iframe').forEach(f => f.classList.remove('active'));
  addressInput.value = '';
}
function showFrame(iframe) {
  homePage.classList.add('hidden');
  errorPage.classList.add('hidden');
  framesEl.classList.remove('hidden');
  framesEl.querySelectorAll('iframe').forEach(f => f.classList.remove('active'));
  iframe.classList.add('active');
}
function showError(err) {
  homePage.classList.add('hidden');
  framesEl.classList.add('hidden');
  errorPage.classList.remove('hidden');
  errorText.textContent = err?.stack || err?.message || String(err);
}

function activateTab(id) {
  const tab = tabs.get(id);
  if (!tab) return;
  activeTabId = id;
  if (!tab.url) {
    showHome();
  } else {
    showFrame(tab.iframe);
    addressInput.value = tab.url;
  }
  renderTabs();
}

function closeTab(id) {
  const tab = tabs.get(id);
  if (!tab) return;
  tab.iframe?.remove();
  tabs.delete(id);
  if (tabs.size === 0) {
    createTab();
    return;
  }
  if (activeTabId === id) {
    activateTab([...tabs.keys()][tabs.size - 1]);
  } else {
    renderTabs();
  }
}

function createTab({ url } = {}) {
  const id = uid();
  const tab = { id, title: 'New Tab', url: null, iframe: null, history: [], historyIndex: -1 };
  tabs.set(id, tab);
  activeTabId = id;
  renderTabs();
  if (url) {
    navigate(url);
  } else {
    showHome();
  }
  return tab;
}

async function navigate(rawInput, { pushHistory = true } = {}) {
  const url = resolveInput(rawInput);
  if (!url) return;

  try {
    await ensureTransport();
    await registerSW();
  } catch (err) {
    showError(err);
    return;
  }

  const tab = tabs.get(activeTabId) || createTab();
  const encoded = __uv$config.prefix + __uv$config.encodeUrl(url);

  if (!tab.iframe) {
    const iframe = document.createElement('iframe');
    iframe.setAttribute('allow', 'clipboard-read; clipboard-write; fullscreen; autoplay; camera; microphone; geolocation; payment');
    iframe.setAttribute('allowfullscreen', '');
    framesEl.appendChild(iframe);
    tab.iframe = iframe;

    iframe.addEventListener('load', () => {
      try {
        const docTitle = iframe.contentDocument?.title;
        if (docTitle) {
          tab.title = docTitle;
          renderTabs();
        }
      } catch { /* cross-origin — ignore */ }
    });
  }

  tab.iframe.src = encoded;
  tab.url = url;
  tab.title = new URL(url).hostname;
  if (pushHistory) {
    tab.history = tab.history.slice(0, tab.historyIndex + 1);
    tab.history.push(url);
    tab.historyIndex = tab.history.length - 1;
  }
  addressInput.value = url;
  showFrame(tab.iframe);
  renderTabs();
}

// ---- toolbar ----
document.getElementById('back').addEventListener('click', () => {
  const tab = tabs.get(activeTabId); if (!tab) return;
  if (tab.historyIndex > 0) {
    tab.historyIndex--;
    navigate(tab.history[tab.historyIndex], { pushHistory: false });
  }
});
document.getElementById('forward').addEventListener('click', () => {
  const tab = tabs.get(activeTabId); if (!tab) return;
  if (tab.historyIndex < tab.history.length - 1) {
    tab.historyIndex++;
    navigate(tab.history[tab.historyIndex], { pushHistory: false });
  }
});
document.getElementById('reload').addEventListener('click', () => {
  const tab = tabs.get(activeTabId); if (!tab?.iframe) return;
  // eslint-disable-next-line no-self-assign
  tab.iframe.src = tab.iframe.src;
});
document.getElementById('home').addEventListener('click', () => {
  const tab = tabs.get(activeTabId); if (!tab) return;
  tab.url = null; tab.title = 'New Tab';
  renderTabs(); showHome();
});
document.getElementById('err-back').addEventListener('click', showHome);

newTabBtn.addEventListener('click', () => createTab());

omnibox.addEventListener('submit', (e) => {
  e.preventDefault();
  if (addressInput.value.trim()) navigate(addressInput.value);
});
homeForm.addEventListener('submit', (e) => {
  e.preventDefault();
  if (homeInput.value.trim()) navigate(homeInput.value);
});
document.querySelectorAll('.shortcut').forEach(s => {
  s.addEventListener('click', () => navigate(s.dataset.url));
});

// keyboard shortcuts
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'l') {
    e.preventDefault(); addressInput.focus(); addressInput.select();
  }
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 't') {
    e.preventDefault(); createTab();
  }
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'w') {
    e.preventDefault(); if (activeTabId) closeTab(activeTabId);
  }
});

// bootstrap
createTab();
ensureTransport().catch(console.warn);
