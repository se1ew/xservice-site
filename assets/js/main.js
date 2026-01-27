
(() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const header = $('[data-header]');
  const nav = $('[data-nav]');
  const menuButton = $('[data-menu-button]');
  const toast = $('[data-toast]');

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

  const getModal = (name) => document.querySelector(`[data-modal="${name}"]`);

  const openModal = (name) => {
    const modal = getModal(name);
    if (!modal) return;

    lastActive = document.activeElement;
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    body.style.overflow = 'hidden';

    const focusable = $('input, textarea, button, [href], [tabindex]:not([tabindex="-1"])', modal);
    focusable?.focus?.();
  };

  const closeModal = (name) => {
    const modal = getModal(name);
    if (!modal) return;

    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    body.style.overflow = '';

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

  const setFieldError = (name, message) => {
    const el = document.querySelector(`[data-error-for="${name}"]`);
    if (!el) return;
    el.textContent = message || '';
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
    form.addEventListener('input', (e) => {
      const t = e.target;
      if (!(t instanceof HTMLInputElement || t instanceof HTMLTextAreaElement)) return;
      setFieldError(t.name, '');
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const formData = new FormData(form);
      const data = Object.fromEntries(formData.entries());
      const errors = validate(data);

      setFieldError('name', errors.name);
      setFieldError('phone', errors.phone);
      setFieldError('message', errors.message);

      const firstErrorField = Object.keys(errors)[0];
      if (firstErrorField) {
        const field = form.querySelector(`[name="${firstErrorField}"]`);
        field?.focus?.();
        return;
      }

      showToast('Заявка сохранена (демо). Отправка будет добавлена позже.');
      form.reset();
      closeModal('request');
    });
  }
})();
