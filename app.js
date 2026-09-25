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

// The full menu keeps every service reachable from the main navigation.
const serviceMenu = document.querySelector('.nav-service-wrap');
const serviceToggle = document.querySelector('.nav-service-toggle');
if (serviceMenu && serviceToggle) {
  const closeServices = () => {
    serviceMenu.classList.remove('open');
    serviceToggle.setAttribute('aria-expanded', 'false');
  };
  serviceToggle.addEventListener('click', event => {
    event.stopPropagation();
    const open = serviceMenu.classList.toggle('open');
    serviceToggle.setAttribute('aria-expanded', String(open));
  });
  document.addEventListener('click', event => {
    if (!serviceMenu.contains(event.target)) closeServices();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') closeServices();
  });
  if (location.pathname.endsWith('/services.html')) {
    serviceMenu.querySelector('a[href="services.html"]')?.setAttribute('aria-current', 'page');
  } else if (document.querySelector('.service-page-intro')) {
    serviceMenu.classList.add('section-current');
  }
}

const bookingDialog = document.querySelector('#booking-dialog');
const bookingForm = document.querySelector('#booking-form');
const bookingService = document.querySelector('#booking-service');
const bookingDate = document.querySelector('#booking-date');
if (bookingDialog && bookingForm && bookingService && bookingDate) {
  const serviceGroups = [...bookingService.querySelectorAll('optgroup')].map(group => ({
    name: group.label,
    services: [...group.querySelectorAll('option')].map(option => ({ value: option.value, name: option.textContent.trim() }))
  }));
  const serviceField = bookingService.closest('.field');
  const servicePicker = document.createElement('div');
  const categoryTabs = document.createElement('div');
  const serviceChoices = document.createElement('div');
  const serviceError = document.createElement('p');
  let activeCategory = serviceGroups[0]?.name || '';
  serviceField.classList.add('booking-service-field');
  serviceField.querySelector('label')?.setAttribute('hidden', '');
  bookingService.hidden = true;
  bookingService.required = false;
  servicePicker.className = 'booking-service-picker';
  servicePicker.setAttribute('role', 'group');
  servicePicker.setAttribute('aria-labelledby', 'booking-service-title');
  const pickerTitle = document.createElement('strong');
  pickerTitle.id = 'booking-service-title';
  pickerTitle.className = 'booking-service-title';
  pickerTitle.textContent = 'Select service category *';
  categoryTabs.className = 'booking-category-tabs';
  categoryTabs.setAttribute('aria-label', 'Service categories');
  serviceChoices.className = 'booking-service-choices';
  serviceError.className = 'booking-service-error';
  serviceError.id = 'booking-service-error';
  serviceError.setAttribute('role', 'alert');
  serviceError.textContent = 'Please choose a service.';
  serviceError.hidden = true;
  servicePicker.append(pickerTitle, categoryTabs, serviceChoices, serviceError);
  bookingService.after(servicePicker);
  const renderServicePicker = () => {
    categoryTabs.replaceChildren();
    serviceChoices.replaceChildren();
    serviceGroups.forEach(group => {
      const tab = document.createElement('button');
      tab.type = 'button';
      tab.className = 'booking-category-tab';
      tab.textContent = group.name;
      tab.setAttribute('aria-pressed', String(group.name === activeCategory));
      tab.addEventListener('click', () => {
        if (activeCategory !== group.name) {
          activeCategory = group.name;
          bookingService.value = '';
          serviceError.hidden = true;
          renderServicePicker();
        }
      });
      categoryTabs.append(tab);
    });
    const group = serviceGroups.find(item => item.name === activeCategory);
    serviceChoices.setAttribute('aria-label', `Choose a ${activeCategory} service`);
    group?.services.forEach(service => {
      const choice = document.createElement('button');
      choice.type = 'button';
      choice.className = 'booking-service-choice';
      choice.textContent = service.name;
      choice.setAttribute('aria-pressed', String(bookingService.value === service.value));
      choice.addEventListener('click', () => {
        bookingService.value = service.value;
        serviceError.hidden = true;
        serviceChoices.querySelectorAll('button').forEach(button => {
          button.setAttribute('aria-pressed', String(button === choice));
        });
      });
      serviceChoices.append(choice);
    });
  };
  const selectBookingService = service => {
    const option = service ? [...bookingService.options].find(item => item.value === service) : null;
    bookingService.value = option ? service : '';
    activeCategory = option?.parentElement?.label || serviceGroups[0]?.name || '';
    serviceError.hidden = true;
    renderServicePicker();
  };
  renderServicePicker();
  const today = new Date();
  const localDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  bookingDate.min = localDate;
  let previousFocus = null;
  const openBooking = service => {
    previousFocus = document.activeElement;
    selectBookingService(service || new URLSearchParams(location.search).get('service'));
    bookingDialog.showModal();
    document.body.classList.add('modal-open');
    bookingDialog.querySelector('#booking-name')?.focus();
  };
  document.querySelectorAll('[data-open-booking]').forEach(button => {
    button.addEventListener('click', () => openBooking(button.dataset.service));
  });
  document.querySelector('[data-close-booking]')?.addEventListener('click', () => bookingDialog.close());
  bookingDialog.addEventListener('click', event => {
    if (event.target === bookingDialog) bookingDialog.close();
  });
  bookingDialog.addEventListener('close', () => {
    document.body.classList.remove('modal-open');
    previousFocus?.focus?.();
  });
  bookingForm.addEventListener('submit', event => {
    event.preventDefault();
    if (!bookingService.value) {
      serviceError.hidden = false;
      categoryTabs.querySelector('button[aria-pressed="true"]')?.focus();
      servicePicker.scrollIntoView({ block: 'nearest', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
      return;
    }
    if (!bookingForm.reportValidity()) return;
    const data = new FormData(bookingForm);
    const serviceName = bookingService.selectedOptions[0]?.textContent || 'Service enquiry';
    const groupName = bookingService.selectedOptions[0]?.parentElement?.label || '';
    const message = [
      'Hello The Divine, I would like to enquire about an appointment.',
      `Name: ${data.get('name')}`,
      `Phone: ${data.get('phone')}`,
      `Service: ${groupName ? groupName + ' — ' : ''}${serviceName}`,
      `Preferred date: ${data.get('date')}`,
      `Preferred time: ${data.get('time')}`,
      `Message: ${data.get('message') || 'Please share availability and details.'}`,
      'Please confirm availability, service details and pricing.'
    ].join('\n');
    window.open(`https://wa.me/919933868118?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
  });
}

document.querySelectorAll('.directory-filter button').forEach(button => {
  button.addEventListener('click', () => {
    const filter = button.dataset.filter;
    document.querySelectorAll('.directory-filter button').forEach(item => {
      const active = item === button;
      item.classList.toggle('active', active);
      item.setAttribute('aria-pressed', String(active));
    });
    document.querySelectorAll('[data-service-group]').forEach(group => {
      group.hidden = filter !== 'all' && group.dataset.serviceGroup !== filter;
    });
  });
});

document.querySelectorAll('.rail-controls button').forEach(button => {
  button.addEventListener('click', () => {
    const rail = document.getElementById(button.dataset.rail);
    if (!rail) return;
    const item = rail.firstElementChild;
    const distance = (item?.getBoundingClientRect().width || 320) + 18;
    rail.scrollBy({ left: button.classList.contains('rail-next') ? distance : -distance, behavior: reduceMotion ? 'auto' : 'smooth' });
  });
});

// A single keyboard-friendly viewer replaces new-tab image navigation.
const mediaDialog = document.querySelector('#media-dialog');
if (mediaDialog) {
  const mediaImage = mediaDialog.querySelector('img');
  const mediaCaption = mediaDialog.querySelector('figcaption');
  const previous = mediaDialog.querySelector('.media-prev');
  const next = mediaDialog.querySelector('.media-next');
  const items = [];
  let current = 0;
  let previousFocus = null;
  const addMedia = (element, source, caption, preventLink = false) => {
    const index = items.push({ source, caption }) - 1;
    element.addEventListener('click', event => {
      if (preventLink) event.preventDefault();
      previousFocus = document.activeElement;
      current = index;
      showMedia();
      mediaDialog.showModal();
      document.body.classList.add('modal-open');
    });
    if (!preventLink) {
      element.tabIndex = 0;
      element.setAttribute('role', 'button');
      element.setAttribute('aria-label', `Open photo: ${caption}`);
      element.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          element.click();
        }
      });
    }
  };
  const showMedia = () => {
    const item = items[current];
    mediaImage.src = item.source;
    mediaImage.alt = item.caption;
    mediaCaption.textContent = item.caption;
    previous.hidden = next.hidden = items.length < 2;
  };
  document.querySelectorAll('.salon-photo a[href]').forEach(link => {
    const image = link.querySelector('img');
    addMedia(link, link.href, image?.alt || link.textContent.trim(), true);
    link.removeAttribute('target');
  });
  document.querySelectorAll('.editorial-grid figure img, .image-frame img, .service-detail-img img, .service-photo-composition img').forEach(image => {
    if (image.closest('a')) return;
    addMedia(image, image.currentSrc || image.src, image.alt || 'The Divine image');
  });
  const move = direction => {
    current = (current + direction + items.length) % items.length;
    showMedia();
  };
  previous.addEventListener('click', () => move(-1));
  next.addEventListener('click', () => move(1));
  mediaDialog.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft') move(-1);
    if (event.key === 'ArrowRight') move(1);
  });
  mediaDialog.querySelector('[data-close-media]')?.addEventListener('click', () => mediaDialog.close());
  mediaDialog.addEventListener('click', event => {
    if (event.target === mediaDialog) mediaDialog.close();
  });
  mediaDialog.addEventListener('close', () => {
    document.body.classList.remove('modal-open');
    previousFocus?.focus?.();
  });
}

if (reduceMotion) {
  document.querySelector('.hero-media video')?.pause();
}
