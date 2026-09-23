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
  if (!parallaxStory || !parallaxScene) return;
  const rect = parallaxStory.getBoundingClientRect();
  const travel = parallaxStory.offsetHeight - window.innerHeight;
  sceneProgress = travel > 0 ? clamp(-rect.top / travel) : 0;

  parallaxScene.style.setProperty('--back-scroll', `${sceneProgress * 18}px`);
  parallaxScene.style.setProperty('--mid-scroll', `${sceneProgress * -32}px`);
  parallaxScene.style.setProperty('--front-scroll', `${sceneProgress * -68}px`);

  const sunset = smoothProgress(sceneProgress, .08, .68);
  const night = smoothProgress(sceneProgress, .5, 1);
  const textLight = smoothProgress(sceneProgress, .34, .58);
  parallaxScene.style.setProperty('--sunset', sunset.toFixed(3));
  parallaxScene.style.setProperty('--night', night.toFixed(3));
  parallaxScene.style.setProperty('--scene-ink', mixColor([19, 44, 69], [249, 240, 220], textLight));

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

function setTilt(x, y) {
  if (!parallaxScene) return;
  parallaxScene.style.setProperty('--tilt-x', `${clamp(x, -22, 22)}px`);
  parallaxScene.style.setProperty('--tilt-y', `${clamp(y, -18, 18)}px`);
}

function handleOrientation(event) {
  if (event.gamma == null || event.beta == null) return;
  confirmMotionSignal();
  setTilt(event.gamma * .65, (event.beta - 45) * .28);
}

function handleDeviceMotion(event) {
  const gravity = event.accelerationIncludingGravity;
  if (!gravity || gravity.x == null || gravity.y == null) return;
  confirmMotionSignal();
  setTilt(gravity.x * 2.2, -gravity.y * 1.35);
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
const secureLink = document.getElementById('secureLink');
let motionSignalSeen = false;
let genericSensor;

function confirmMotionSignal() {
  if (motionSignalSeen) return;
  motionSignalSeen = true;
  motionButton.hidden = true;
  motionButton.disabled = false;
  motionStatus.textContent = 'Jiroskop açık';
  window.setTimeout(() => { motionStatus.textContent = ''; }, 1800);
}

function attachMotionListeners() {
  window.addEventListener('deviceorientation', handleOrientation, { passive: true });
  window.addEventListener('deviceorientationabsolute', handleOrientation, { passive: true });
  window.addEventListener('devicemotion', handleDeviceMotion, { passive: true });
}

function startGenericSensorFallback() {
  const SensorType = window.GravitySensor || window.Accelerometer;
  if (!SensorType || genericSensor) return;
  try {
    genericSensor = new SensorType({ frequency: 30 });
    genericSensor.addEventListener('reading', () => {
      if (genericSensor.x == null || genericSensor.y == null) return;
      confirmMotionSignal();
      setTilt(genericSensor.x * 2.1, -genericSensor.y * 1.35);
    });
    genericSensor.start();
  } catch {
    genericSensor = undefined;
  }
}

async function askSensorPermission(EventType) {
  if (!EventType || typeof EventType.requestPermission !== 'function') return 'granted';
  return EventType.requestPermission();
}

async function enableMotion() {
  if (!window.isSecureContext) {
    motionStatus.textContent = 'Jiroskop için güvenli HTTPS bağlantısını açın';
    secureLink.hidden = false;
    return;
  }

  motionButton.disabled = true;
  motionButton.querySelector('span').textContent = 'Sensör bekleniyor';
  motionStatus.textContent = 'Telefonu hafifçe sağa ve sola eğin';

  try {
    const orientationPermission = await askSensorPermission(window.DeviceOrientationEvent);
    const motionPermission = await askSensorPermission(window.DeviceMotionEvent);
    if (orientationPermission !== 'granted' || motionPermission !== 'granted') {
      motionStatus.textContent = 'Hareket sensörü izni verilmedi';
      motionButton.disabled = false;
      motionButton.querySelector('span').textContent = 'Tekrar Dene';
      return;
    }

    attachMotionListeners();
    startGenericSensorFallback();

    window.setTimeout(() => {
      if (motionSignalSeen) return;
      motionButton.disabled = false;
      motionButton.querySelector('span').textContent = 'Tekrar Dene';
      motionStatus.textContent = 'Chrome site ayarlarından “Hareket sensörleri” iznini açın';
    }, 3500);
  } catch {
    motionButton.disabled = false;
    motionButton.querySelector('span').textContent = 'Tekrar Dene';
    motionStatus.textContent = 'Sensör açılamadı; Chrome site izinlerini kontrol edin';
  }
}

motionButton.addEventListener('click', enableMotion);

if (!window.isSecureContext) {
  motionStatus.textContent = 'Jiroskop için HTTPS bağlantısını kullanın';
  secureLink.hidden = false;
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
