// popup.js — fixed 12-character deterministic passwords. No password storage.

const PASSWORD_LENGTH = 12;
const KDF_ITERATIONS = 600000;
const CLIPBOARD_CLEAR_MS = 20000;
const CAT_MASK_COUNT = PASSWORD_LENGTH;
const CAT_MASK_IMAGE = 'icons/cat-mask.png';

const secretInput = document.getElementById('secret');
const siteInput = document.getElementById('site');
const genBtn = document.getElementById('gen');
const passDiv = document.getElementById('pass');
const clickText = document.getElementById('click');
const icon = document.getElementById('icon');
const gene = document.getElementById('gene');
const setupLink = document.getElementById('setupLink');
const backLink = document.getElementById('backLink');
const mainPage = document.getElementById('mainPage');
const setupPage = document.getElementById('setupPage');
const newExampleBtn = document.getElementById('newExample');
const secretExample = document.getElementById('secretExample');

let currentPassword = '';
let revealTimer = null;
let didLongReveal = false;
let clearTimer = null;

icon.style.display = 'none';
passDiv.style.display = 'none';
clickText.textContent = 'Enter Details to Generate Password';

function showSetupPage(event) {
  event.preventDefault();
  mainPage.classList.add('hidden');
  setupPage.classList.remove('hidden');
}

function showMainPage(event) {
  event.preventDefault();
  setupPage.classList.add('hidden');
  mainPage.classList.remove('hidden');
}

setupLink.addEventListener('click', showSetupPage);
backLink.addEventListener('click', showMainPage);

const exampleWords = [
  'river', 'mango', 'pencil', 'orbit', 'forest', 'glass', 'planet', 'candle',
  'window', 'coffee', 'silver', 'turtle', 'rocket', 'paper', 'banana', 'winter',
  'camera', 'cotton', 'garden', 'marble', 'pillow', 'velvet', 'island', 'lantern',
  'orange', 'castle', 'thunder', 'bottle', 'magnet', 'sunset', 'anchor', 'helmet'
];

function secureRandomIndex(max) {
  const values = new Uint32Array(1);
  crypto.getRandomValues(values);
  return values[0] % max;
}

function makeExampleSecret() {
  const chosen = [];
  while (chosen.length < 4) {
    const word = exampleWords[secureRandomIndex(exampleWords.length)];
    if (!chosen.includes(word)) chosen.push(word);
  }
  secretExample.textContent = chosen.join(' ');
}

newExampleBtn.addEventListener('click', makeExampleSecret);

function scheduleLocalClear() {
  if (clearTimer) clearTimeout(clearTimer);
  clearTimer = setTimeout(clearSensitiveUi, CLIPBOARD_CLEAR_MS);
}

function clearSensitiveUi() {
  currentPassword = '';
  secretInput.value = '';
  passDiv.textContent = '';
  passDiv.style.display = 'none';
  passDiv.onclick = null;
  gene.style.display = 'block';
  icon.style.display = 'none';
  clickText.textContent = 'Enter Details to Generate Password';
}

window.addEventListener('pagehide', clearSensitiveUi);
window.addEventListener('blur', () => {
  // Popups usually close on blur. Clear immediately when that happens.
  setTimeout(clearSensitiveUi, 50);
});

(async function fillSiteFromTab() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.url) {
      const site = siteKeyFromUrl(tab.url);
      if (site) siteInput.value = site;
    }
  } catch (_) {
    // Protected browser pages may not expose a usable URL. Manual entry remains available.
  }
})();

function siteKeyFromUrl(rawUrl) {
  try {
    const url = new URL(rawUrl);
    if (!url.protocol.startsWith('http')) return '';
    return normalizeSite(url.hostname);
  } catch (_) {
    return normalizeSite(rawUrl);
  }
}

function normalizeSite(value) {
  let site = String(value || '').trim().toLowerCase();
  site = site.replace(/^https?:\/\//, '');
  site = site.split('/')[0];
  site = site.split(':')[0];
  site = site.replace(/^www\./, '');
  return site;
}

async function derivePassword(secret, site) {
  const cleanSecret = String(secret || '');
  const cleanSite = normalizeSite(site);
  if (!cleanSecret || !cleanSite) throw new Error('Enter Details');

  const enc = new TextEncoder();
  const saltStr = `detpass-v2|${cleanSite}|len:${PASSWORD_LENGTH}`;
  const secretKey = await crypto.subtle.importKey(
    'raw',
    enc.encode(cleanSecret),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );

  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: enc.encode(saltStr), iterations: KDF_ITERATIONS, hash: 'SHA-256' },
    secretKey,
    512
  );

  const bytes = new Uint8Array(bits);
  const lower = 'abcdefghijklmnopqrstuvwxyz';
  const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const digits = '0123456789';
  const specials = '@$-_';
  const all = lower + upper + digits + specials;

  const out = [];
  let cursor = 0;

  function nextByte() {
    if (cursor >= bytes.length) {
      // 512 derived bits is enough for 12 chars, but this keeps the function safe.
      cursor = 0;
    }
    return bytes[cursor++];
  }

  function pick(set) {
    const limit = Math.floor(256 / set.length) * set.length;
    let b = nextByte();
    while (b >= limit) b = nextByte();
    return set[b % set.length];
  }

  out.push(pick(lower));
  out.push(pick(upper));
  out.push(pick(digits));
  out.push(pick(specials));

  while (out.length < PASSWORD_LENGTH) {
    out.push(pick(all));
  }

  // Deterministic Fisher-Yates shuffle.
  for (let i = out.length - 1; i > 0; i--) {
    const j = nextByte() % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }

  return out.join('');
}

function renderCatMask(count = CAT_MASK_COUNT) {
  passDiv.innerHTML = '';
  const wrap = document.createElement('div');
  wrap.className = 'mask-cats';
  for (let i = 0; i < count; i++) {
    const dot = document.createElement('span');
    dot.className = 'mask-cat';
    dot.setAttribute('aria-hidden', 'true');
    wrap.appendChild(dot);
  }
  passDiv.appendChild(wrap);
}

function maskPassword() {
  renderCatMask();
}

function revealPassword() {
  if (!currentPassword) return;
  passDiv.textContent = currentPassword;
}

function hidePassword() {
  if (!currentPassword) return;
  maskPassword();
}

async function copyPassword(pwd) {
  try {
    await navigator.clipboard.writeText(pwd);
    if (chrome?.runtime?.sendMessage) {
      chrome.runtime.sendMessage({ type: 'clearClipboardLater', text: pwd, delayMs: CLIPBOARD_CLEAR_MS });
    }
    clickText.textContent = 'COPIED';
    clickText.classList.add('copied');
    setTimeout(() => {
      if (currentPassword) clickText.textContent = 'CLICK TO COPY';
      clickText.classList.remove('copied');
    }, 1500);
  } catch (_) {
    clickText.textContent = 'COPY FAILED';
  }
}

async function generatePassword() {
  try {
    const pwd = await derivePassword(secretInput.value, siteInput.value);
    currentPassword = pwd;
    passDiv.innerHTML = '';

    gene.style.display = 'none';
    icon.style.display = 'block';
    passDiv.classList.remove('animate', 'mask-ready');
    void passDiv.offsetWidth;
    passDiv.style.display = 'block';
    passDiv.classList.add('animate');
    window.setTimeout(() => {
      if (currentPassword === pwd) {
        maskPassword();
        passDiv.classList.add('mask-ready');
      }
    }, 920);
    clickText.textContent = 'CLICK TO COPY';
  } catch (e) {
    currentPassword = '';
    renderCatMask(1);
    passDiv.style.display = 'block';
    clickText.textContent = e.message;
  }
}

genBtn.addEventListener('click', generatePassword);

[secretInput, siteInput].forEach(input => {
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') generatePassword();
  });
});

passDiv.addEventListener('pointerdown', (event) => {
  if (!currentPassword) return;
  event.preventDefault();
  didLongReveal = false;
  revealTimer = setTimeout(() => {
    didLongReveal = true;
    revealPassword();
  }, 350);
});

passDiv.addEventListener('pointerup', async (event) => {
  if (!currentPassword) return;
  event.preventDefault();
  clearTimeout(revealTimer);
  if (didLongReveal) {
    hidePassword();
  } else {
    await copyPassword(currentPassword);
  }
});

passDiv.addEventListener('pointerleave', () => {
  clearTimeout(revealTimer);
  hidePassword();
});

passDiv.addEventListener('contextmenu', (event) => event.preventDefault());
