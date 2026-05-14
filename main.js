function getPageContext() {
  return {
    page_key: document.body?.dataset.page || 'unknown',
    page_path: window.location.pathname
  };
}

function normalizeText(text) {
  return (text || '').replace(/\s+/g, ' ').trim();
}

function getLinkKind(href) {
  if (!href) return 'unknown';
  if (href.startsWith('mailto:')) return 'email';
  if (href.startsWith('tel:')) return 'phone';
  if (href.startsWith('#')) return 'anchor';

  try {
    const url = new URL(href, window.location.origin);
    return url.origin === window.location.origin ? 'internal' : 'external';
  } catch (error) {
    return 'unknown';
  }
}

function getAbsoluteUrl(href) {
  if (!href) return '';

  try {
    return new URL(href, window.location.origin).toString();
  } catch (error) {
    return href;
  }
}

function capturePostHog(eventName, properties = {}) {
  if (!eventName || !window.posthog || typeof window.posthog.capture !== 'function') return;

  const payload = { ...getPageContext(), ...properties };
  const cleanedPayload = Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== undefined && value !== null && value !== '')
  );

  window.posthog.capture(eventName, cleanedPayload);
}

/**
 * Capture business-meaningful link clicks without duplicating every anchor.
 */
(function() {
  document.addEventListener('click', (event) => {
    const link = event.target.closest('a[data-ph-event]');
    if (!link) return;

    const href = link.getAttribute('href') || '';
    capturePostHog(link.dataset.phEvent, {
      link_text: normalizeText(link.textContent),
      link_url: getAbsoluteUrl(href),
      link_kind: getLinkKind(href),
      link_context: link.dataset.phContext,
      link_location: link.dataset.phLocation
    });
  });
})();

/**
 * Theme toggle - auto-detects system preference, allows manual override
 */
(function() {
  const toggle = document.querySelector('.theme-toggle');
  const root = document.documentElement;
  if (!toggle) return;

  function getPreferredTheme() {
    const saved = localStorage.getItem('theme');
    if (saved) return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function setTheme(theme) {
    root.setAttribute('data-theme', theme);
    toggle.textContent = theme;
    localStorage.setItem('theme', theme);
  }

  setTheme(getPreferredTheme());

  toggle.addEventListener('click', () => {
    const current = root.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    setTheme(next);
    capturePostHog('theme changed', {
      from_theme: current,
      to_theme: next
    });
  });

  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (!localStorage.getItem('theme')) {
      setTheme(e.matches ? 'dark' : 'light');
    }
  });
})();

/**
 * ASCII flow field - lines follow mouse
 */
(function() {
  const canvas = document.getElementById('ascii-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const COLS = 40;
  const ROWS = 15;

  let mx = -1000, my = -1000;

  function resize() {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
  }

  function getChar(x, y, cellW, cellH) {
    const cx = x * cellW + cellW / 2;
    const cy = y * cellH + cellH / 2;
    const dx = mx - cx;
    const dy = my - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 150) return '·';

    const angle = Math.atan2(dy, dx);
    const normalized = ((angle + Math.PI) / (Math.PI * 2)) * 4;
    const idx = Math.floor(normalized) % 4;

    return ['─', '╲', '│', '╱'][idx];
  }

  function draw() {
    const rect = canvas.getBoundingClientRect();
    const cellW = rect.width / COLS;
    const cellH = rect.height / ROWS;

    ctx.clearRect(0, 0, rect.width, rect.height);
    ctx.font = '14px JetBrains Mono';
    ctx.fillStyle = '#ddd';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const char = getChar(x, y, cellW, cellH);
        const cx = x * cellW + cellW / 2;
        const cy = y * cellH + cellH / 2;
        ctx.fillText(char, cx, cy);
      }
    }

    requestAnimationFrame(draw);
  }

  canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    mx = e.clientX - rect.left;
    my = e.clientY - rect.top;
  });

  canvas.addEventListener('mouseleave', () => {
    mx = -1000;
    my = -1000;
  });

  window.addEventListener('resize', resize);
  resize();
  draw();
})();

/**
 * Load links from links.json
 */
(function() {
  const container = document.getElementById('links-archive');
  if (!container) return;

  fetch('links.json')
    .then(res => res.json())
    .then(links => {
      links.forEach(link => {
        const a = document.createElement('a');
        a.href = link.url;
        a.className = 'archive-link';
        a.dataset.phEvent = 'archive link clicked';
        a.dataset.phContext = link.tag || 'archive';
        a.dataset.phLocation = 'links archive';

        if (link.tag) {
          const tag = document.createElement('span');
          tag.className = 'link-tag';
          tag.textContent = link.tag;
          a.appendChild(tag);
        }

        a.appendChild(document.createTextNode(link.title));

        if (link.url !== '#' && !link.url.startsWith('/')) {
          a.target = '_blank';
          a.rel = 'noopener';
        }
        container.appendChild(a);
      });
    })
    .catch(err => {
      console.error('Failed to load links:', err);
    });
})();
