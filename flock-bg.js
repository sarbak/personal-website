/**
 * Flocking background - right panel only (left-aligned layout)
 */
(function() {
  const FONT = '11px JetBrains Mono';

  // Color palettes - neutral and warm (when mouse active)
  const COLORS_NEUTRAL = ['#bbb', '#999', '#777', '#555', '#444'];
  const COLORS_WARM = ['#bbb', '#a99', '#997755', '#aa8844', '#cca030'];

  // Mouse activity tracking
  let mouseActivity = 0;

  const canvas = document.getElementById('flock-right');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let w, h;

  // Grid settings
  const COLS = 30;
  let ROWS, cellW, cellH;
  let density = [];

  // Boids
  const boids = [];
  const NUM_BOIDS = 60;

  // Crumbs left by mouse
  const crumbs = [];

  // Mouse position
  let mouseX = -1000, mouseY = -1000;
  let lastMouseX = -1000, lastMouseY = -1000;

  function resize() {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    w = rect.width;
    h = rect.height;
    if (w === 0 || h === 0) return;

    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);

    cellW = w / COLS;
    cellH = cellW;
    ROWS = Math.ceil(h / cellH);

    // Reset density grid
    density = [];
    for (let y = 0; y < ROWS; y++) {
      density[y] = [];
      for (let x = 0; x < COLS; x++) {
        density[y][x] = 0;
      }
    }
  }

  function initBoids() {
    boids.length = 0;
    for (let i = 0; i < NUM_BOIDS; i++) {
      boids.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        restTimer: Math.random() * 200,
        isResting: Math.random() > 0.5,
        boredom: 0,
        wanderAngle: Math.random() * Math.PI * 2
      });
    }
  }

  document.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    if (e.clientX >= rect.left && e.clientX <= rect.right &&
        e.clientY >= rect.top && e.clientY <= rect.bottom) {
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;

      const moved = Math.abs(mouseX - lastMouseX) + Math.abs(mouseY - lastMouseY);
      if (moved > 2) {
        mouseActivity = Math.min(1, mouseActivity + 0.15);
        if (moved > 8) {
          crumbs.push({ x: mouseX, y: mouseY, strength: 1.0 });
          if (crumbs.length > 50) crumbs.shift();
        }
      }
      lastMouseX = mouseX;
      lastMouseY = mouseY;
    } else {
      mouseX = -1000;
      mouseY = -1000;
    }
  });

  function step() {
    if (w === 0) return;

    mouseActivity *= 0.985;

    // Decay crumbs
    for (let i = crumbs.length - 1; i >= 0; i--) {
      crumbs[i].strength *= 0.995;
      if (crumbs[i].strength < 0.01) crumbs.splice(i, 1);
    }

    // Decay density
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        density[y][x] *= 0.92;
      }
    }

    boids.forEach(boid => {
      let isAttracted = false;

      // Attract to crumbs and eat them
      let crumbPullX = 0, crumbPullY = 0;
      crumbs.forEach(crumb => {
        const dx = crumb.x - boid.x;
        const dy = crumb.y - boid.y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < 200 && d > 5) {
          const pull = crumb.strength * (200 - d) / 200;
          crumbPullX += (dx / d) * pull;
          crumbPullY += (dy / d) * pull;
          isAttracted = true;
        }
        if (d < 15) crumb.strength -= 0.02;
      });

      if (isAttracted) {
        boid.isResting = false;
        boid.vx += crumbPullX * 0.03;
        boid.vy += crumbPullY * 0.03;
      }

      // Flocking behavior
      let sepX = 0, sepY = 0, sepCount = 0;
      let alignX = 0, alignY = 0, alignCount = 0;
      let cohX = 0, cohY = 0, cohCount = 0;

      boids.forEach(other => {
        if (other === boid) return;
        const dx = other.x - boid.x;
        const dy = other.y - boid.y;
        const d = Math.sqrt(dx * dx + dy * dy);

        if (d < 25) { sepX -= dx / (d + 1); sepY -= dy / (d + 1); sepCount++; }
        if (d < 60) { alignX += other.vx; alignY += other.vy; alignCount++; }
        if (d < 100) { cohX += dx; cohY += dy; cohCount++; }
      });

      if (!boid.isResting) {
        if (sepCount > 0) { boid.vx += sepX * 0.02; boid.vy += sepY * 0.02; }
        if (alignCount > 0) { boid.vx += (alignX / alignCount - boid.vx) * 0.015; boid.vy += (alignY / alignCount - boid.vy) * 0.015; }
        if (cohCount > 0) { boid.vx += (cohX / cohCount) * 0.0005; boid.vy += (cohY / cohCount) * 0.0005; }

        if (Math.random() < 0.002) {
          boid.wanderAngle += (Math.random() - 0.5) * 1.5;
          boid.vx += Math.cos(boid.wanderAngle) * 0.15;
          boid.vy += Math.sin(boid.wanderAngle) * 0.15;
        }
      } else {
        boid.vx *= 0.95;
        boid.vy *= 0.95;
      }

      boid.restTimer--;
      if (boid.restTimer <= 0) {
        boid.isResting = !boid.isResting;
        boid.restTimer = 100 + Math.random() * 300;
      }

      // Speed limits
      const speed = Math.sqrt(boid.vx ** 2 + boid.vy ** 2);
      const maxSpeed = isAttracted ? 1.2 : 0.6;
      if (speed > maxSpeed) {
        boid.vx = (boid.vx / speed) * maxSpeed;
        boid.vy = (boid.vy / speed) * maxSpeed;
      }

      boid.x += boid.vx;
      boid.y += boid.vy;

      // Wrap
      if (boid.x < 0) boid.x += w;
      if (boid.x >= w) boid.x -= w;
      if (boid.y < 0) boid.y += h;
      if (boid.y >= h) boid.y -= h;

      // Add to density
      const gx = Math.floor(boid.x / cellW);
      const gy = Math.floor(boid.y / cellH);
      if (gx >= 0 && gx < COLS && gy >= 0 && gy < ROWS) {
        density[gy][gx] = Math.min(density[gy][gx] + 0.25, 1);
      }
    });
  }

  function blendColors(neutral, warm, t) {
    const n = parseInt(neutral.slice(1), 16);
    const w = parseInt(warm.slice(1), 16);
    const nr = (n >> 16) & 255, ng = (n >> 8) & 255, nb = n & 255;
    const wr = (w >> 16) & 255, wg = (w >> 8) & 255, wb = w & 255;
    const r = Math.round(nr + (wr - nr) * t);
    const g = Math.round(ng + (wg - ng) * t);
    const b = Math.round(nb + (wb - nb) * t);
    return `rgb(${r},${g},${b})`;
  }

  function draw() {
    if (w === 0) { requestAnimationFrame(draw); return; }

    step();
    ctx.clearRect(0, 0, w, h);
    ctx.font = FONT;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const chars = ' .·:∘∙°˚*✦~';

    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const val = density[y][x];
        if (val > 0.03) {
          const charIdx = Math.min(Math.floor(val * chars.length), chars.length - 1);
          const colorIdx = Math.min(Math.floor(val * COLORS_NEUTRAL.length), COLORS_NEUTRAL.length - 1);
          ctx.fillStyle = blendColors(COLORS_NEUTRAL[colorIdx], COLORS_WARM[colorIdx], mouseActivity);
          ctx.globalAlpha = Math.min(val * 1.5 + 0.3, 0.9);
          ctx.fillText(chars[charIdx], x * cellW + cellW / 2, y * cellH + cellH / 2);
        }
      }
    }

    // Draw crumbs
    crumbs.forEach(crumb => {
      ctx.fillStyle = '#d4a24a';
      ctx.globalAlpha = crumb.strength * 0.8;
      ctx.beginPath();
      ctx.arc(crumb.x, crumb.y, 3 + crumb.strength * 2, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.globalAlpha = 1;
    requestAnimationFrame(draw);
  }

  resize();
  initBoids();
  draw();

  window.addEventListener('resize', resize);
})();
