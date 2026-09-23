const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) entry.target.classList.add('is-visible');
  });
}, { threshold: 0.18 });

document.querySelectorAll('.reveal:not(.is-visible)').forEach((el) => revealObserver.observe(el));

const stageObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => entry.target.classList.toggle('in-view', entry.isIntersecting));
}, { threshold: 0.24 });

document.querySelectorAll('.stage').forEach((stage) => stageObserver.observe(stage));

const progressBar = document.getElementById('progressBar');
const parallaxStory = document.querySelector('.parallax-story');
const parallaxScene = document.getElementById('parallaxScene');
const paperOrbit = document.getElementById('paperOrbit');
const scrollCue = document.getElementById('scrollCue');
const heroBeats = [...document.querySelectorAll('.hero-beat')];
let sceneProgress = 0;

function clamp(value, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

function beatValue(progress, start, peak, end) {
  if (progress <= start || progress >= end) return 0;
  if (progress < peak) return clamp((progress - start) / (peak - start));
  return clamp(1 - ((progress - peak) / (end - peak)));
}

function updateHeroScene() {
  if (!parallaxStory || !parallaxScene) return;
  const rect = parallaxStory.getBoundingClientRect();
  const travel = parallaxStory.offsetHeight - window.innerHeight;
  sceneProgress = travel > 0 ? clamp(-rect.top / travel) : 0;

  parallaxScene.style.setProperty('--back-scroll', `${sceneProgress * 18}px`);
  parallaxScene.style.setProperty('--mid-scroll', `${sceneProgress * -32}px`);
  parallaxScene.style.setProperty('--front-scroll', `${sceneProgress * -68}px`);

  const orbitY = -50 + sceneProgress * 78;
  const orbitScale = 1 - sceneProgress * .1;
  paperOrbit.style.transform = `translate3d(-50%, ${orbitY}%, 0) scale(${orbitScale})`;
  paperOrbit.style.opacity = String(1 - Math.max(0, sceneProgress - .8) * 2.7);

  const values = [
    beatValue(sceneProgress, -0.25, 0, .34),
    beatValue(sceneProgress, .22, .42, .68),
    beatValue(sceneProgress, .55, .73, 1.01)
  ];

  heroBeats.forEach((beat, index) => {
    const opacity = values[index];
    const center = [0.04, 0.42, 0.73][index];
    const translate = (center - sceneProgress) * 150;
    beat.style.opacity = opacity.toFixed(3);
    beat.style.transform = `translate3d(0, ${translate}px, 0)`;
  });

  if (scrollCue) scrollCue.style.opacity = String(clamp(1 - sceneProgress * 7));
}

function updateScrollEffects() {
  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  const progress = scrollable > 0 ? (window.scrollY / scrollable) * 100 : 0;
  progressBar.style.width = `${Math.min(100, progress)}%`;
  updateHeroScene();
}

window.addEventListener('scroll', updateScrollEffects, { passive: true });
updateScrollEffects();

function setTilt(x, y) {
  if (!parallaxScene) return;
  parallaxScene.style.setProperty('--tilt-x', `${clamp(x, -22, 22)}px`);
  parallaxScene.style.setProperty('--tilt-y', `${clamp(y, -18, 18)}px`);
}

function handleOrientation(event) {
  if (event.gamma == null || event.beta == null) return;
  setTilt(event.gamma * .65, (event.beta - 45) * .28);
}

if (window.matchMedia('(pointer: fine)').matches) {
  parallaxScene?.addEventListener('pointermove', (event) => {
    const x = ((event.clientX / window.innerWidth) - .5) * 30;
    const y = ((event.clientY / window.innerHeight) - .5) * 24;
    setTilt(x, y);
  });
  parallaxScene?.addEventListener('pointerleave', () => setTilt(0, 0));
}

const motionButton = document.getElementById('motionButton');
const motionStatus = document.getElementById('motionStatus');

if ('DeviceOrientationEvent' in window) {
  if (typeof DeviceOrientationEvent.requestPermission === 'function') {
    motionButton.hidden = false;
    motionButton.addEventListener('click', async () => {
      try {
        const permission = await DeviceOrientationEvent.requestPermission();
        if (permission === 'granted') {
          window.addEventListener('deviceorientation', handleOrientation, { passive: true });
          motionButton.hidden = true;
          motionStatus.textContent = 'Hareket açık';
        } else {
          motionStatus.textContent = 'Hareket izni verilmedi';
        }
      } catch {
        motionStatus.textContent = 'Hareket yalnızca güvenli bağlantıda açılır';
      }
    });
  } else {
    window.addEventListener('deviceorientation', handleOrientation, { passive: true });
  }
}

const weddingDate = new Date('2026-10-31T18:30:00+03:00');
const parts = {
  days: document.getElementById('days'),
  hours: document.getElementById('hours'),
  minutes: document.getElementById('minutes'),
  seconds: document.getElementById('seconds')
};

function updateCountdown() {
  const difference = weddingDate.getTime() - Date.now();
  if (difference <= 0) {
    Object.values(parts).forEach((part) => { part.textContent = '00'; });
    document.getElementById('countdownNote').textContent = 'Bugün bizim günümüz.';
    return;
  }
  const day = 1000 * 60 * 60 * 24;
  parts.days.textContent = String(Math.floor(difference / day)).padStart(2, '0');
  parts.hours.textContent = String(Math.floor((difference % day) / (1000 * 60 * 60))).padStart(2, '0');
  parts.minutes.textContent = String(Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))).padStart(2, '0');
  parts.seconds.textContent = String(Math.floor((difference % (1000 * 60)) / 1000)).padStart(2, '0');
}

updateCountdown();
setInterval(updateCountdown, 1000);

const shareButton = document.getElementById('shareButton');
const shareStatus = document.getElementById('shareStatus');

shareButton.addEventListener('click', async () => {
  const invitationUrl = new URL('./assets/invitation.png', window.location.href);
  try {
    const response = await fetch(invitationUrl);
    const blob = await response.blob();
    const file = new File([blob], 'Cansu-ve-Cagri-Dugun-Davetiyesi.png', { type: 'image/png' });
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({
        title: 'Cansu & Çağrı — Düğün Davetiyesi',
        text: '31 Ekim 2026, 18.30 · Suare Event Tuzla',
        files: [file]
      });
      shareStatus.textContent = 'Davetiyemiz paylaşıma hazır.';
      return;
    }
    if (navigator.share) {
      await navigator.share({
        title: 'Cansu & Çağrı — Düğün Davetiyesi',
        text: '31 Ekim 2026, 18.30 · Suare Event Tuzla',
        url: window.location.href
      });
      return;
    }
    await navigator.clipboard.writeText(window.location.href);
    shareStatus.textContent = 'Davet bağlantısı panoya kopyalandı.';
  } catch (error) {
    if (error.name !== 'AbortError') shareStatus.textContent = 'Paylaşım açılamadı; davetiyeyi indirebilirsiniz.';
  }
});
