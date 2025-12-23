import './style.css';

const pickBtn = document.getElementById('pickBtn');
const resultNumber = document.getElementById('resultNumber');
const speech = document.getElementById('speech');
const sparkles = document.getElementById('sparkles');
const gifts = Array.from(document.querySelectorAll('.gift'));

const audioToggle = document.getElementById('audioToggle');
const fireplace = document.getElementById('fireplace');
const jingle = document.getElementById('jingle');

const RANGE_MIN = 1;
const RANGE_MAX = 10;

let state = 'idle'; // "idle" | "warming" | "rolling" | "reveal"
let rollingTimer = null;
let isMuted = true;
let hasUserInteracted = false;

function setAudioToggleUI() {
  audioToggle.innerHTML = isMuted
    ? `🔇 <span class="audioToggle__text">Muted</span>`
    : `🔊 <span class="audioToggle__text">Cozy On</span>`;
}

setAudioToggleUI();

async function tryStartAmbient() {
  // Must be called after user gesture (click)
  if (isMuted) return;
  try {
    fireplace.volume = 0.35;
    await fireplace.play();
  } catch {
    // If browser blocks, user can click toggle again
  }
}

function stopAmbient() {
  fireplace.pause();
  fireplace.currentTime = 0;
}

audioToggle.addEventListener('click', async () => {
  hasUserInteracted = true;
  isMuted = !isMuted;
  setAudioToggleUI();

  if (!isMuted) {
    await tryStartAmbient();
  } else {
    stopAmbient();
  }
});

function randomInt(min, max) {
  // inclusive
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function clearActiveGift() {
  gifts.forEach((g) => g.classList.remove('is-active'));
}

function highlightGift(num) {
  clearActiveGift();
  const el = gifts.find((g) => Number(g.dataset.num) === num);
  if (el) el.classList.add('is-active');
}

function setMagicMode(on) {
  document.body.classList.toggle('magic', on);
}

function setButtonDisabled(disabled, text) {
  pickBtn.disabled = disabled;
  if (text) pickBtn.textContent = text;
}

function sparkleBurst(anchorEl) {
  // Place sparkles near the tree/santa area
  const rect = anchorEl.getBoundingClientRect();
  const baseX = rect.left + rect.width * 0.5 + window.scrollX;
  const baseY = rect.top + rect.height * 0.25 + window.scrollY;

  const emojis = ['✨', '⭐', '❄️', '💛', '🌟'];
  const count = 14;

  for (let i = 0; i < count; i += 1) {
    const s = document.createElement('span');
    s.className = 'sparkle';
    s.textContent = emojis[i % emojis.length];

    const angle = (Math.PI * 2 * i) / count;
    const radius = 40 + Math.random() * 70;
    const x = baseX + Math.cos(angle) * radius;
    const y = baseY + Math.sin(angle) * radius;

    s.style.left = `${x}px`;
    s.style.top = `${y}px`;
    s.style.animationDelay = `${Math.random() * 120}ms`;

    sparkles.appendChild(s);
    s.addEventListener('animationend', () => s.remove());
  }
}

async function playJingle() {
  if (isMuted) return;
  try {
    jingle.currentTime = 0;
    jingle.volume = 0.65;
    await jingle.play();
  } catch {
    // ignore
  }
}

async function runSequence() {
  if (state !== 'idle') return;

  state = 'warming';
  setMagicMode(true);
  clearActiveGift();

  // Ensure audio respects autoplay rules
  if (!hasUserInteracted) hasUserInteracted = true;
  await tryStartAmbient();

  speech.textContent = 'Let me check my list… 🎁';
  setButtonDisabled(true, 'Warming the magic…');
  resultNumber.textContent = '—';

  // Stage 1: warm-up pause
  await sleep(800);

  // Stage 2: rolling numbers
  state = 'rolling';
  speech.textContent = 'Shuffling the gift fate… hmm…';
  setButtonDisabled(true, 'Shuffling gifts…');

  let finalPick = randomInt(RANGE_MIN, RANGE_MAX);
  let ticks = 0;

  rollingTimer = setInterval(() => {
    ticks += 1;

    // Spin visually
    const n = randomInt(RANGE_MIN, RANGE_MAX);
    resultNumber.textContent = String(n);

    // small playful speech changes mid-roll
    if (ticks === 6) speech.textContent = 'Not this one… or this one… 👀';
    if (ticks === 12)
      speech.textContent = 'Almost there… hot cocoa says be patient ☕';

    // Slowdown feel (manual easing)
    if (ticks === 14) finalPick = randomInt(RANGE_MIN, RANGE_MAX);
  }, 90);

  // Total roll duration
  await sleep(2200);

  clearInterval(rollingTimer);
  rollingTimer = null;

  // Stage 3: reveal
  state = 'reveal';
  resultNumber.textContent = String(finalPick);
  resultNumber.animate(
    [
      { transform: 'scale(0.9)', offset: 0 },
      { transform: 'scale(1.12)', offset: 0.55 },
      { transform: 'scale(1)', offset: 1 },
    ],
    { duration: 520, easing: 'cubic-bezier(.2,.9,.2,1)' }
  );

  highlightGift(finalPick);
  speech.textContent = `Ho ho ho! Open gift #${finalPick}! ✨`;

  sparkleBurst(document.getElementById('santa'));
  await playJingle();

  // Settle back
  await sleep(900);
  setMagicMode(false);

  state = 'idle';
  setButtonDisabled(false, 'Ask Santa 🎁');
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

pickBtn.addEventListener('click', runSequence);
