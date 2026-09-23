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
const heroArt = document.querySelector('.hero-art');

function updateScrollEffects() {
  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  const progress = scrollable > 0 ? (window.scrollY / scrollable) * 100 : 0;
  progressBar.style.width = `${Math.min(100, progress)}%`;
  if (heroArt && window.scrollY < window.innerHeight) {
    heroArt.style.transform = `scale(1.02) translateY(${window.scrollY * 0.06}px)`;
  }
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
