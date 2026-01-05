/**
 * ASCII flow field - lines follow mouse
 */
(function() {
  const canvas = document.getElementById('ascii-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const COLS = 40;
  const ROWS = 15;
  const CHARS = ['─', '│', '╱', '╲', '·'];

  let grid = [];
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

        if (link.tag) {
          const tag = document.createElement('span');
          tag.className = 'link-tag';
          tag.textContent = link.tag;
          a.appendChild(tag);
        }

        a.appendChild(document.createTextNode(link.title));

        if (link.url !== '#') {
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
