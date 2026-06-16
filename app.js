// ── Config ────────────────────────────────────────────────────────────────────
// After deploying the Cloudflare Worker, replace this URL with your Worker URL.
// Example: 'https://sabina-wishlist.yourname.workers.dev'
const WORKER_URL = 'https://sabina-wishlist.YOUR_SUBDOMAIN.workers.dev';

const POLL_INTERVAL = 7000; // ms between background polls

// ── State ─────────────────────────────────────────────────────────────────────
const claimed = {}; // { id: true/false }

// ── Render ────────────────────────────────────────────────────────────────────
function pad(n) {
  return String(n).padStart(2, '0');
}

function renderList() {
  const list = document.getElementById('item-list');
  list.innerHTML = '';

  ITEMS.forEach(item => {
    const li = document.createElement('li');
    li.className = 'item';
    li.dataset.id = item.id;

    const hasDetail = item.note || item.link;

    li.innerHTML = `
      <div class="item-main">
        <span class="item-num">${pad(item.id)}</span>
        <span class="item-emoji">${item.emoji}</span>
        <span class="item-name">${item.name}</span>
        ${hasDetail ? '<span class="item-chevron">▾</span>' : ''}
        <button class="claim-btn" aria-label="Дарю ${item.name}">Дарю</button>
      </div>
      ${hasDetail ? `
      <div class="item-detail">
        ${item.note ? `<span class="item-note">${item.note}</span>` : ''}
        ${item.link ? `<a class="item-link" href="${item.link}" target="_blank" rel="noopener noreferrer">↗ смотреть</a>` : ''}
      </div>` : ''}
    `;

    // Expand/collapse — clicking anywhere on item-main EXCEPT the button
    li.querySelector('.item-main').addEventListener('click', e => {
      if (e.target.closest('.claim-btn')) return;
      if (!hasDetail) return;
      li.classList.toggle('expanded');
    });

    // Claim button — separate handler, stops propagation
    li.querySelector('.claim-btn').addEventListener('click', e => {
      e.stopPropagation();
      toggle(item.id);
    });

    list.appendChild(li);
  });

  applyState();
}

function applyState() {
  ITEMS.forEach(item => {
    const li = document.querySelector(`.item[data-id="${item.id}"]`);
    if (!li) return;
    const btn = li.querySelector('.claim-btn');
    const isClaimed = !!claimed[item.id];

    li.classList.toggle('claimed', isClaimed);
    btn.classList.toggle('claimed', isClaimed);
    btn.textContent = isClaimed ? '✓ Занято' : 'Дарю';
    btn.setAttribute('aria-label', isClaimed
      ? `Отменить: ${item.name}`
      : `Дарю: ${item.name}`);
  });
}

// ── Network ───────────────────────────────────────────────────────────────────
async function fetchClaims() {
  try {
    const res = await fetch(`${WORKER_URL}/claims`);
    if (!res.ok) return;
    const data = await res.json();
    Object.keys(data).forEach(id => {
      claimed[id] = !!data[id];
    });
    applyState();
  } catch (_) {
    // network error — keep current state, retry on next poll
  }
}

async function toggle(id) {
  // Optimistic update so the button feels instant
  claimed[id] = !claimed[id];
  applyState();

  try {
    const res = await fetch(`${WORKER_URL}/claim`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    if (!res.ok) throw new Error('bad response');
    const data = await res.json();
    claimed[id] = !!data.claimed;
    applyState();
  } catch (_) {
    // Roll back optimistic update on failure
    claimed[id] = !claimed[id];
    applyState();
  }

  // Re-fetch immediately so other guests' changes also land
  fetchClaims();
}

// ── Boot ──────────────────────────────────────────────────────────────────────
renderList();
fetchClaims();
setInterval(fetchClaims, POLL_INTERVAL);
