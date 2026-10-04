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

function beatValue(progress, start, enterEnd, exitStart, end) {
  if (progress <= start || progress >= end) return 0;
  if (progress < enterEnd) return clamp((progress - start) / (enterEnd - start));
  if (progress <= exitStart) return 1;
  return clamp(1 - ((progress - exitStart) / (end - exitStart)));
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
    beatValue(sceneProgress, -.05, 0, .16, .31),
    beatValue(sceneProgress, .22, .33, .54, .68),
    beatValue(sceneProgress, .55, .67, .9, 1.01)
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

const heroSnapPoints = [0, .42, .73];
const introStage = document.getElementById('detaylar');
let heroSnapTimer;
let heroSnapActive = false;
let activeHeroSnapIndex = 0;
let heroSnapReleaseTimer;
let touchStartY = null;
let touchLastY = null;
let touchCaptured = false;

function getHeroSnapState() {
  if (!scrollStory) return null;
  const storyTop = window.scrollY + scrollStory.getBoundingClientRect().top;
  const travel = scrollStory.offsetHeight - window.innerHeight;
  if (travel <= 0 || window.scrollY < storyTop - 2 || window.scrollY > storyTop + travel + 2) return null;

  return {
    storyTop,
    travel,
    progress: clamp((window.scrollY - storyTop) / travel)
  };
}

function nearestHeroSnapIndex(progress) {
  return heroSnapPoints.reduce((bestIndex, point, index) => (
    Math.abs(point - progress) < Math.abs(heroSnapPoints[bestIndex] - progress) ? index : bestIndex
  ), 0);
}

function scheduleHeroSnapRelease(delay = 650) {
  window.clearTimeout(heroSnapReleaseTimer);
  heroSnapReleaseTimer = window.setTimeout(() => { heroSnapActive = false; }, delay);
}

function goToHeroSnap(index) {
  const state = getHeroSnapState();
  if (!state || index < 0 || index > heroSnapPoints.length || (index === heroSnapPoints.length && !introStage)) return;

  activeHeroSnapIndex = index;
  heroSnapActive = true;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const target = index === heroSnapPoints.length && introStage
    ? introStage.offsetTop
    : state.storyTop + heroSnapPoints[index] * state.travel;
  window.scrollTo({
    top: target,
    behavior: reducedMotion ? 'auto' : 'smooth'
  });
  scheduleHeroSnapRelease(reducedMotion ? 120 : 650);
}

function snapHeroScene() {
  if (heroSnapActive) return;
  const state = getHeroSnapState();
  if (!state) return;

  const index = nearestHeroSnapIndex(state.progress);
  const target = state.storyTop + heroSnapPoints[index] * state.travel;
  if (Math.abs(window.scrollY - target) < 4) return;
  goToHeroSnap(index);
}

window.addEventListener('scroll', () => {
  if (heroSnapActive) return;
  window.clearTimeout(heroSnapTimer);
  heroSnapTimer = window.setTimeout(snapHeroScene, 150);
}, { passive: true });

window.addEventListener('wheel', (event) => {
  if (!event.deltaY) return;
  const state = getHeroSnapState();
  if (!state) {
    if (heroSnapActive && activeHeroSnapIndex === heroSnapPoints.length) {
      event.preventDefault();
      scheduleHeroSnapRelease();
    }
    return;
  }

  const direction = event.deltaY > 0 ? 1 : -1;
  const currentIndex = heroSnapActive ? activeHeroSnapIndex : nearestHeroSnapIndex(state.progress);
  const nextIndex = currentIndex + direction;
  if (nextIndex < 0 || nextIndex > heroSnapPoints.length) return;

  event.preventDefault();
  scheduleHeroSnapRelease();
  if (!heroSnapActive) goToHeroSnap(nextIndex);
}, { passive: false });

window.addEventListener('touchstart', (event) => {
  const state = getHeroSnapState();
  touchStartY = state ? event.touches[0]?.clientY ?? null : null;
  touchLastY = touchStartY;
  touchCaptured = false;
}, { passive: true });

window.addEventListener('touchmove', (event) => {
  if (touchStartY === null) return;
  const currentY = event.touches[0]?.clientY;
  if (currentY === undefined) return;

  const state = getHeroSnapState();
  if (!state) {
    if (heroSnapActive && activeHeroSnapIndex === heroSnapPoints.length) {
      event.preventDefault();
      scheduleHeroSnapRelease();
    }
    return;
  }
  const direction = touchStartY - currentY > 0 ? 1 : -1;
  const currentIndex = heroSnapActive ? activeHeroSnapIndex : nearestHeroSnapIndex(state.progress);
  const nextIndex = currentIndex + direction;
  if (nextIndex < 0 || nextIndex > heroSnapPoints.length) return;

  event.preventDefault();
  touchCaptured = true;
  touchLastY = currentY;
}, { passive: false });

window.addEventListener('touchend', () => {
  if (touchCaptured && touchStartY !== null && touchLastY !== null) {
    const distance = touchStartY - touchLastY;
    if (Math.abs(distance) >= 24) {
      const state = getHeroSnapState();
      if (state) {
        const direction = distance > 0 ? 1 : -1;
        const currentIndex = heroSnapActive ? activeHeroSnapIndex : nearestHeroSnapIndex(state.progress);
        const nextIndex = currentIndex + direction;
        if (!heroSnapActive && nextIndex >= 0 && nextIndex <= heroSnapPoints.length) goToHeroSnap(nextIndex);
      }
    }
  }
  touchStartY = null;
  touchLastY = null;
  touchCaptured = false;
}, { passive: true });

window.addEventListener('keydown', (event) => {
  if (event.target instanceof Element && event.target.closest('a, button, input, textarea, select')) return;
  const down = ['ArrowDown', 'PageDown'].includes(event.key) || (event.key === ' ' && !event.shiftKey);
  const up = ['ArrowUp', 'PageUp'].includes(event.key) || (event.key === ' ' && event.shiftKey);
  if (!down && !up) return;

  const state = getHeroSnapState();
  if (!state) {
    if (heroSnapActive && activeHeroSnapIndex === heroSnapPoints.length) {
      event.preventDefault();
      scheduleHeroSnapRelease();
    }
    return;
  }
  const direction = down ? 1 : -1;
  const currentIndex = heroSnapActive ? activeHeroSnapIndex : nearestHeroSnapIndex(state.progress);
  const nextIndex = currentIndex + direction;
  if (nextIndex < 0 || nextIndex > heroSnapPoints.length) return;

  event.preventDefault();
  scheduleHeroSnapRelease();
  if (!heroSnapActive) goToHeroSnap(nextIndex);
});

const mapButton = document.getElementById('mapButton');
const mapButtonLabel = document.getElementById('mapButtonLabel');
const destination = '40.81470227696305,29.313173413263396';

if (mapButton && mapButtonLabel) {
  const isIOS = /iPad|iPhone|iPod/i.test(navigator.userAgent)
    || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isAndroid = /Android/i.test(navigator.userAgent);

  if (isIOS) {
    mapButton.href = `https://maps.apple.com/?daddr=${destination}&dirflg=d`;
    mapButtonLabel.textContent = 'Apple Maps’te Aç';
    mapButton.setAttribute('aria-label', 'Suare Event için Apple Maps navigasyonunu aç');
  } else if (isAndroid) {
    mapButton.href = `https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=driving`;
    mapButtonLabel.textContent = 'Google Maps’te Aç';
    mapButton.setAttribute('aria-label', 'Suare Event için Google Maps navigasyonunu aç');
  } else {
    mapButton.href = `https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=driving`;
    mapButtonLabel.textContent = 'Navigasyonu Aç';
    mapButton.setAttribute('aria-label', 'Suare Event için navigasyonu aç');
  }
}

const weddingDate = new Date('2026-10-31T19:00:00+03:00');
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
        text: '31 Ekim 2026, 19:00 · Suare Event Tuzla',
        files: [file]
      });
      shareStatus.textContent = 'Davetiyemiz paylaşıma hazır.';
      return;
    }
    if (navigator.share) {
      await navigator.share({
        title: 'Cansu & Çağrı — Düğün Davetiyesi',
        text: '31 Ekim 2026, 19:00 · Suare Event Tuzla',
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
