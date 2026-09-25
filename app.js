const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const header = document.querySelector('.site-header');
const menuButton = document.querySelector('.menu-toggle');
const nav = document.querySelector('.nav');
const setHeader = () => header?.classList.toggle('scrolled', window.scrollY > 30);
setHeader();
window.addEventListener('scroll', setHeader, { passive: true });

if (menuButton && nav) {
  menuButton.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  });
  nav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
    nav.classList.remove('open');
    menuButton.setAttribute('aria-expanded', 'false');
  }));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      nav.classList.remove('open');
      menuButton.setAttribute('aria-expanded', 'false');
    }
  });
}

if (!reduceMotion && 'IntersectionObserver' in window) {
  const revealObserver = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        revealObserver.unobserve(entry.target);
      }
    }
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
  document.querySelectorAll('.reveal').forEach(element => revealObserver.observe(element));
} else {
  document.querySelectorAll('.reveal').forEach(element => element.classList.add('in-view'));
}

if (!reduceMotion && matchMedia('(pointer:fine)').matches) {
  document.querySelectorAll('.service-card').forEach(card => {
    card.addEventListener('pointermove', event => {
      const rect = card.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      card.style.transform = `perspective(900px) rotateY(${x * 7}deg) rotateX(${-y * 7}deg) translateY(-8px)`;
    });
    card.addEventListener('pointerleave', () => { card.style.transform = ''; });
  });
  const orbits = document.querySelectorAll('[data-parallax]');
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      orbits.forEach(element => {
        const rect = element.getBoundingClientRect();
        if (rect.bottom > 0 && rect.top < innerHeight) {
          const offset = (innerHeight / 2 - rect.top) * Number(element.dataset.parallax || 0.06);
          element.style.translate = `0 ${offset.toFixed(1)}px`;
        }
      });
      ticking = false;
    });
  }, { passive: true });
}

const counts = document.querySelectorAll('[data-count]');
if (counts.length) {
  const animateCount = element => {
    const end = Number(element.dataset.count);
    if (reduceMotion) { element.textContent = String(end); return; }
    const start = performance.now();
    const draw = now => {
      const progress = Math.min((now - start) / 1150, 1);
      element.textContent = String(Math.round(end * (1 - Math.pow(1 - progress, 3))));
      if (progress < 1) requestAnimationFrame(draw);
    };
    requestAnimationFrame(draw);
  };
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) { animateCount(entry.target); observer.unobserve(entry.target); }
      });
    });
    counts.forEach(element => observer.observe(element));
  } else counts.forEach(animateCount);
}

const form = document.querySelector('#enquiry-form');
if (form) form.addEventListener('submit', event => {
  event.preventDefault();
  if (!form.reportValidity()) return;
  const data = new FormData(form);
  const message = [
    'Hello The Divine, I would like to enquire about an appointment.',
    `Name: ${data.get('name')}`,
    `Service: ${data.get('service')}`,
    `Message: ${data.get('message') || 'Please share availability.'}`
  ].join('\n');
  window.open(`https://wa.me/919933868118?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
});

if (!reduceMotion) {
  document.querySelectorAll('a[href$=".html"]').forEach(link => {
    link.addEventListener('click', event => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || link.target === '_blank') return;
      const url = new URL(link.href);
      if (url.origin !== location.origin || url.pathname === location.pathname) return;
      event.preventDefault();
      document.body.classList.add('page-out');
      setTimeout(() => { location.href = link.href; }, 230);
    });
  });
}
