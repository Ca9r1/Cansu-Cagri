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
const scrollStory = document.querySelector('.scroll-story');
const storyScene = document.getElementById('storyScene');
const paperOrbit = document.getElementById('paperOrbit');
const scrollCue = document.getElementById('scrollCue');
const heroBeats = [...document.querySelectorAll('.hero-beat')];
let sceneProgress = 0;

function clamp(value, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

function smoothProgress(value, start, end) {
  const progress = clamp((value - start) / (end - start));
  return progress * progress * (3 - 2 * progress);
}

function mixColor(from, to, amount) {
  const mixed = from.map((channel, index) => Math.round(channel + (to[index] - channel) * amount));
  return `rgb(${mixed.join(', ')})`;
}

function beatValue(progress, start, peak, end) {
  if (progress <= start || progress >= end) return 0;
  if (progress < peak) return clamp((progress - start) / (peak - start));
  return clamp(1 - ((progress - peak) / (end - peak)));
}

function updateHeroScene() {
  if (!scrollStory || !storyScene) return;
  const rect = scrollStory.getBoundingClientRect();
  const travel = scrollStory.offsetHeight - window.innerHeight;
  sceneProgress = travel > 0 ? clamp(-rect.top / travel) : 0;

  const sunset = smoothProgress(sceneProgress, .08, .68);
  const night = smoothProgress(sceneProgress, .5, 1);
  const textLight = smoothProgress(sceneProgress, .34, .58);
  storyScene.style.setProperty('--sunset', sunset.toFixed(3));
  storyScene.style.setProperty('--night', night.toFixed(3));
  storyScene.style.setProperty('--scene-ink', mixColor([19, 44, 69], [249, 240, 220], textLight));

  const orbitY = -50 + sceneProgress * 78;
  const orbitScale = 1 - sceneProgress * .1;
  const sunFirst = mixColor([250, 244, 225], [239, 157, 91], sunset);
  const sunFinal = mixColor([239, 157, 91], [194, 86, 61], night);
  paperOrbit.style.transform = `translate3d(-50%, ${orbitY}%, 0) scale(${orbitScale})`;
  paperOrbit.style.background = night > .01 ? sunFinal : sunFirst;
  paperOrbit.style.borderColor = `rgba(189, 112, 59, ${.22 + sunset * .42})`;
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
