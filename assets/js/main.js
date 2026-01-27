
(() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const header = $('[data-header]');
  const nav = $('[data-nav]');
  const menuButton = $('[data-menu-button]');
  const toast = $('[data-toast]');
  const main = document.querySelector('main');
  const footer = document.querySelector('footer');

  /* Sticky header state */
  const updateHeader = () => {
    if (!header) return;
    header.classList.toggle('is-scrolled', window.scrollY > 6);
  };

  updateHeader();
  window.addEventListener('scroll', updateHeader, { passive: true });

  /* Mobile nav */
  const closeMenu = () => {
    if (!nav) return;
    nav.classList.remove('is-open');
    menuButton?.setAttribute('aria-expanded', 'false');
  };

  const toggleMenu = () => {
    if (!nav || !menuButton) return;
    const next = !nav.classList.contains('is-open');
    nav.classList.toggle('is-open', next);
    menuButton.setAttribute('aria-expanded', String(next));
  };

  if (menuButton) {
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.addEventListener('click', toggleMenu);
  }

  // Close menu after clicking a nav link
  $$('.nav-link', nav || document).forEach((a) => {
    a.addEventListener('click', () => closeMenu());
  });

  // Close menu on click outside
  document.addEventListener('click', (e) => {
    if (!nav || !menuButton) return;
    if (!nav.classList.contains('is-open')) return;
    const t = e.target;
    if (!(t instanceof Node)) return;
    if (nav.contains(t) || menuButton.contains(t)) return;
    closeMenu();
  });

  /* Toast */
  let toastTimer = null;
  const showToast = (message) => {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('is-visible');

    if (toastTimer) window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => {
      toast.classList.remove('is-visible');
    }, 2600);
  };

  /* Modal */
  const body = document.body;
  let lastActive = null;
  let trapHandler = null;

  const getModal = (name) => document.querySelector(`[data-modal="${name}"]`);

  const getFocusable = (root) =>
    $$('a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])', root)
      .filter((el) => el instanceof HTMLElement && !el.hasAttribute('disabled') && el.offsetParent !== null);

  const setBackgroundInert = (value) => {
    // Prefer inert when available. Fallback to aria-hidden.
    const targets = [header, main, footer].filter(Boolean);
    targets.forEach((el) => {
      if (!el) return;
      if ('inert' in el) {
        el.inert = value;
      } else {
        if (value) {
          el.setAttribute('aria-hidden', 'true');
        } else {
          el.removeAttribute('aria-hidden');
        }
      }
    });
  };

  const openModal = (name) => {
    const modal = getModal(name);
    if (!modal) return;

    lastActive = document.activeElement;
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    setBackgroundInert(true);

    body.style.overflow = 'hidden';

    const focusable = getFocusable(modal);
    const first = focusable[0] || $('.modal-sheet', modal);
    (first instanceof HTMLElement ? first : null)?.focus?.();

    // Focus trap
    trapHandler = (e) => {
      if (e.key !== 'Tab') return;
      const current = getFocusable(modal);
      if (!current.length) return;
      const firstEl = current[0];
      const lastEl = current[current.length - 1];
      const active = document.activeElement;
      if (!(active instanceof HTMLElement)) return;

      if (e.shiftKey && active === firstEl) {
        e.preventDefault();
        lastEl.focus();
      } else if (!e.shiftKey && active === lastEl) {
        e.preventDefault();
        firstEl.focus();
      }
    };
    document.addEventListener('keydown', trapHandler);
  };

  const closeModal = (name) => {
    const modal = getModal(name);
    if (!modal) return;

    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    setBackgroundInert(false);

    body.style.overflow = '';

    if (trapHandler) {
      document.removeEventListener('keydown', trapHandler);
      trapHandler = null;
    }

    if (lastActive && typeof lastActive.focus === 'function') {
      lastActive.focus();
    }
  };

  $$('[data-open-modal]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const name = btn.getAttribute('data-open-modal');
      if (!name) return;
      openModal(name);
    });
  });

  $$('[data-modal]').forEach((modal) => {
    modal.addEventListener('click', (e) => {
      const t = e.target;
      if (!(t instanceof Element)) return;
      if (t.matches('[data-close-modal]')) {
        const name = modal.getAttribute('data-modal');
        if (name) closeModal(name);
      }
    });
  });

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    const open = document.querySelector('[data-modal].is-open');
    if (!open) return;
    const name = open.getAttribute('data-modal');
    if (name) closeModal(name);
  });

  /* Form: demo validation (no sending) */
  const form = document.getElementById('request-form');
  const formAlert = document.getElementById('request-form-error');

  const setFieldError = (name, message) => {
    const el = document.querySelector(`[data-error-for="${name}"]`);
    if (!el) return;
    el.textContent = message || '';

    const field = form?.querySelector(`[name="${name}"]`);
    if (field instanceof HTMLElement) {
      field.setAttribute('aria-invalid', message ? 'true' : 'false');
    }
  };

  const setFormAlert = (message) => {
    if (!formAlert) return;
    formAlert.textContent = message || '';
  };

  const normalizePhone = (v) => v.replace(/\s+/g, '').trim();

  const validate = (data) => {
    const errors = {};

    if (!data.name || data.name.trim().length < 2) {
      errors.name = 'Введите имя (минимум 2 символа).';
    }

    const phone = normalizePhone(data.phone || '');
    const okPhone = /^\+?[0-9()\-]{7,}$/.test(phone);
    if (!okPhone) {
      errors.phone = 'Введите корректный номер телефона.';
    }

    if (!data.message || data.message.trim().length < 10) {
      errors.message = 'Опишите проблему (минимум 10 символов).';
    }

    return errors;
  };

  if (form) {
    const validateField = (field) => {
      const name = field.name;
      const data = {
        name: (form.querySelector('[name="name"]')?.value || '').toString(),
        phone: (form.querySelector('[name="phone"]')?.value || '').toString(),
        message: (form.querySelector('[name="message"]')?.value || '').toString(),
      };
      const errors = validate(data);
      setFieldError(name, errors[name]);
      return errors[name];
    };

    // Live validation + UX hints
    form.addEventListener('input', (e) => {
      const t = e.target;
      if (!(t instanceof HTMLInputElement || t instanceof HTMLTextAreaElement)) return;
      setFormAlert('');

      if (t.name === 'phone') {
        // Soft sanitize: keep digits, +, (), -, spaces
        const next = (t.value || '').toString().replace(/[^0-9+()\-\s]/g, '');
        if (next !== t.value) t.value = next;
      }

      // validate only after some typing
      if ((t.value || '').toString().length > 1) validateField(t);
    });

    form.addEventListener('blur', (e) => {
      const t = e.target;
      if (!(t instanceof HTMLInputElement || t instanceof HTMLTextAreaElement)) return;
      validateField(t);
    }, true);

    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const formData = new FormData(form);
      const data = Object.fromEntries(formData.entries());
      const errors = validate(data);

      setFormAlert('');

      setFieldError('name', errors.name);
      setFieldError('phone', errors.phone);
      setFieldError('message', errors.message);

      const firstErrorField = Object.keys(errors)[0];
      if (firstErrorField) {
        setFormAlert('Проверьте поля формы — есть ошибки.');
        const field = form.querySelector(`[name="${firstErrorField}"]`);
        field?.focus?.();
        return;
      }

      showToast('Заявка сохранена (демо). Отправка будет добавлена позже.');
      form.reset();
      setFormAlert('');
      ['name','phone','message'].forEach((n) => setFieldError(n, ''));
      closeModal('request');
    });
  }

  /* Smooth scroll (JS fallback + close menu on anchor) */
  const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;

  $$('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const href = a.getAttribute('href') || '';
      if (!href || href === '#') return;

      const id = href.slice(1);
      const target = document.getElementById(id);
      if (!target) return;

      // keep native behavior for new tab, etc.
      if (e.defaultPrevented) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      e.preventDefault();
      closeMenu();

      target.scrollIntoView({
        behavior: prefersReducedMotion ? 'auto' : 'smooth',
        block: 'start',
      });
    });
  });

  /* Reveal on scroll */
  const canAnimate = !prefersReducedMotion;

  const revealCandidates = [
    ...$$('section.section'),
    ...$$('.card'),
    ...$$('.review-card'),
  ];

  revealCandidates.forEach((el) => {
    el.setAttribute('data-reveal', '');
  });

  if (canAnimate && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-revealed');
          observer.unobserve(entry.target);
        });
      },
      {
        threshold: 0.12,
        rootMargin: '0px 0px -10% 0px',
      }
    );

    $$('[data-reveal]').forEach((el) => io.observe(el));
  } else {
    $$('[data-reveal]').forEach((el) => el.classList.add('is-revealed'));
  }

  /* Parallax (subtle, Apple-like) */
  const parallaxEls = [
    $('.hero-card-glass'),
    $('.hero-copy'),
  ].filter(Boolean);

  parallaxEls.forEach((el) => {
    el.setAttribute('data-parallax', '');
  });

  if (canAnimate && parallaxEls.length) {
    let raf = 0;
    const updateParallax = () => {
      raf = 0;
      const max = 18;
      const vh = Math.max(1, window.innerHeight);

      parallaxEls.forEach((el) => {
        const r = el.getBoundingClientRect();
        const mid = r.top + r.height / 2;
        const t = (mid - vh / 2) / (vh / 2); // -1..1
        const y = Math.max(-max, Math.min(max, -t * max));
        el.style.setProperty('--parallax-y', `${y.toFixed(2)}px`);
      });
    };

    const onScroll = () => {
      if (raf) return;
      raf = window.requestAnimationFrame(updateParallax);
    };

    updateParallax();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
  }
})();
