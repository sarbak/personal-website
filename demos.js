/**
 * Complex System ASCII Demos - with balanced dynamics
 */
(function() {
  const FONT = '12px JetBrains Mono';
  const COLOR = '#111';

  function setupCanvas(id) {
    const canvas = document.getElementById(id);
    if (!canvas) return null;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    return { canvas, ctx, w: rect.width, h: rect.height };
  }

  // 1. Metaballs (already balanced - continuous motion)
  (function() {
    const s = setupCanvas('demo-metaballs');
    if (!s) return;
    const { ctx, w, h } = s;
    const COLS = 50, ROWS = 15;
    const cellW = w / COLS, cellH = h / ROWS;
    const chars = ' ░▒▓█';
    const balls = [
      { x: w * 0.3, y: h * 0.5, vx: 1.2, vy: 0.8, r: 60 },
      { x: w * 0.7, y: h * 0.5, vx: -0.9, vy: 1.1, r: 50 },
      { x: w * 0.5, y: h * 0.3, vx: 0.7, vy: -1.3, r: 40 }
    ];

    function draw() {
      balls.forEach(b => {
        b.x += b.vx; b.y += b.vy;
        if (b.x < 0 || b.x > w) b.vx *= -1;
        if (b.y < 0 || b.y > h) b.vy *= -1;
      });

      ctx.clearRect(0, 0, w, h);
      ctx.font = FONT; ctx.fillStyle = COLOR;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';

      for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
          const cx = x * cellW + cellW / 2;
          const cy = y * cellH + cellH / 2;
          let sum = 0;
          balls.forEach(b => {
            const d = Math.sqrt((cx - b.x) ** 2 + (cy - b.y) ** 2);
            sum += b.r / (d + 1);
          });
          const idx = Math.min(Math.floor(sum * 0.8), chars.length - 1);
          ctx.fillText(chars[idx], cx, cy);
        }
      }
      requestAnimationFrame(draw);
    }
    draw();
  })();

  // 2. Reaction-Diffusion - unstable, keeps evolving
  (function() {
    const s = setupCanvas('demo-reaction');
    if (!s) return;
    const { canvas, ctx, w, h } = s;
    const COLS = 80, ROWS = 30;
    const cellW = w / COLS, cellH = h / ROWS;
    const chars = ' ·:░▒▓█';

    let gridA = [], gridB = [];
    for (let y = 0; y < ROWS; y++) {
      gridA[y] = []; gridB[y] = [];
      for (let x = 0; x < COLS; x++) {
        gridA[y][x] = 1;
        gridB[y][x] = Math.random() < 0.02 ? 1 : 0;
      }
    }

    // Parameters that create unstable, evolving patterns
    const dA = 1.0, dB = 0.5;
    let feed = 0.034, kill = 0.059;
    let t = 0;

    canvas.addEventListener('mousemove', e => {
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const gx = Math.floor(mx / cellW);
      const gy = Math.floor(my / cellH);
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const nx = gx + dx, ny = gy + dy;
          if (nx >= 0 && nx < COLS && ny >= 0 && ny < ROWS) {
            gridB[ny][nx] = 1;
          }
        }
      }
    });

    function laplacian(grid, x, y) {
      let sum = grid[y][x] * -1;
      sum += (grid[y][(x+1) % COLS] || 0) * 0.2;
      sum += (grid[y][(x-1+COLS) % COLS] || 0) * 0.2;
      sum += (grid[(y+1) % ROWS]?.[x] || 0) * 0.2;
      sum += (grid[(y-1+ROWS) % ROWS]?.[x] || 0) * 0.2;
      sum += (grid[(y+1) % ROWS]?.[(x+1) % COLS] || 0) * 0.05;
      sum += (grid[(y+1) % ROWS]?.[(x-1+COLS) % COLS] || 0) * 0.05;
      sum += (grid[(y-1+ROWS) % ROWS]?.[(x+1) % COLS] || 0) * 0.05;
      sum += (grid[(y-1+ROWS) % ROWS]?.[(x-1+COLS) % COLS] || 0) * 0.05;
      return sum;
    }

    function step() {
      const nextA = [], nextB = [];
      for (let y = 0; y < ROWS; y++) {
        nextA[y] = []; nextB[y] = [];
        for (let x = 0; x < COLS; x++) {
          const a = gridA[y][x], b = gridB[y][x];
          const lapA = laplacian(gridA, x, y);
          const lapB = laplacian(gridB, x, y);
          const reaction = a * b * b;
          nextA[y][x] = Math.min(1, Math.max(0, a + dA * lapA - reaction + feed * (1 - a)));
          nextB[y][x] = Math.min(1, Math.max(0, b + dB * lapB + reaction - (kill + feed) * b));
        }
      }
      gridA = nextA; gridB = nextB;
    }

    function draw() {
      // Slowly oscillate parameters to prevent stabilization
      t += 0.002;
      feed = 0.034 + Math.sin(t) * 0.008;
      kill = 0.059 + Math.cos(t * 0.7) * 0.006;

      // Random perturbations
      if (Math.random() < 0.01) {
        const rx = Math.floor(Math.random() * COLS);
        const ry = Math.floor(Math.random() * ROWS);
        gridB[ry][rx] = 1;
      }

      for (let i = 0; i < 8; i++) step();
      ctx.clearRect(0, 0, w, h);
      ctx.font = FONT; ctx.fillStyle = COLOR;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';

      for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
          const idx = Math.min(Math.floor(gridB[y][x] * chars.length), chars.length - 1);
          ctx.fillText(chars[idx], x * cellW + cellW / 2, y * cellH + cellH / 2);
        }
      }
      requestAnimationFrame(draw);
    }
    draw();
  })();

  // 3. Predator-Prey (Lotka-Volterra) - perpetual oscillation
  (function() {
    const s = setupCanvas('demo-crystal');
    if (!s) return;
    const { canvas, ctx, w, h } = s;
    const COLS = 60, ROWS = 20;
    const cellW = w / COLS, cellH = h / ROWS;

    // Grid: 0 = empty, 1 = prey (rabbit), 2 = predator (fox)
    let grid = [];
    for (let y = 0; y < ROWS; y++) {
      grid[y] = [];
      for (let x = 0; x < COLS; x++) {
        const r = Math.random();
        grid[y][x] = r < 0.3 ? 1 : r < 0.35 ? 2 : 0;
      }
    }

    canvas.addEventListener('click', e => {
      const rect = canvas.getBoundingClientRect();
      const gx = Math.floor((e.clientX - rect.left) / cellW);
      const gy = Math.floor((e.clientY - rect.top) / cellH);
      if (gx >= 0 && gx < COLS && gy >= 0 && gy < ROWS) {
        // Add cluster of prey
        for (let dy = -2; dy <= 2; dy++) {
          for (let dx = -2; dx <= 2; dx++) {
            const nx = (gx + dx + COLS) % COLS;
            const ny = (gy + dy + ROWS) % ROWS;
            if (grid[ny][nx] === 0) grid[ny][nx] = 1;
          }
        }
      }
    });

    function step() {
      const next = grid.map(row => [...row]);

      for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
          const cell = grid[y][x];
          const neighbors = [];
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              if (dx === 0 && dy === 0) continue;
              neighbors.push({
                x: (x + dx + COLS) % COLS,
                y: (y + dy + ROWS) % ROWS,
                val: grid[(y + dy + ROWS) % ROWS][(x + dx + COLS) % COLS]
              });
            }
          }

          if (cell === 1) { // Prey
            // Reproduce into empty neighbor
            if (Math.random() < 0.1) {
              const empty = neighbors.filter(n => n.val === 0);
              if (empty.length > 0) {
                const target = empty[Math.floor(Math.random() * empty.length)];
                next[target.y][target.x] = 1;
              }
            }
          } else if (cell === 2) { // Predator
            // Hunt prey neighbor
            const prey = neighbors.filter(n => n.val === 1);
            if (prey.length > 0) {
              const target = prey[Math.floor(Math.random() * prey.length)];
              next[target.y][target.x] = 2; // Predator reproduces
            } else if (Math.random() < 0.05) {
              next[y][x] = 0; // Starve
            }
            // Move randomly
            if (Math.random() < 0.3) {
              const empty = neighbors.filter(n => n.val === 0);
              if (empty.length > 0) {
                const target = empty[Math.floor(Math.random() * empty.length)];
                next[target.y][target.x] = 2;
                next[y][x] = 0;
              }
            }
          } else { // Empty
            // Spontaneous prey spawn (keeps ecosystem alive)
            if (Math.random() < 0.002) {
              next[y][x] = 1;
            }
          }
        }
      }
      grid = next;
    }

    function draw() {
      step();
      ctx.clearRect(0, 0, w, h);
      ctx.font = FONT;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';

      for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
          const cell = grid[y][x];
          ctx.fillStyle = cell === 2 ? '#c00' : COLOR;
          const char = cell === 0 ? '·' : cell === 1 ? '░' : '█';
          ctx.globalAlpha = cell === 0 ? 0.2 : 1;
          ctx.fillText(char, x * cellW + cellW / 2, y * cellH + cellH / 2);
        }
      }
      ctx.globalAlpha = 1;
      requestAnimationFrame(draw);
    }
    draw();
  })();

  // 4. Wave Interference - perpetual motion
  (function() {
    const s = setupCanvas('demo-erosion');
    if (!s) return;
    const { canvas, ctx, w, h } = s;
    const COLS = 60, ROWS = 20;
    const cellW = w / COLS, cellH = h / ROWS;
    const chars = ' ·∙░▒▓█▓▒░∙·';

    let t = 0;
    let sources = [
      { x: COLS * 0.25, y: ROWS * 0.5, freq: 0.15, phase: 0 },
      { x: COLS * 0.75, y: ROWS * 0.5, freq: 0.12, phase: Math.PI }
    ];
    let mx = -1, my = -1;

    canvas.addEventListener('mousemove', e => {
      const rect = canvas.getBoundingClientRect();
      mx = (e.clientX - rect.left) / cellW;
      my = (e.clientY - rect.top) / cellH;
    });
    canvas.addEventListener('mouseleave', () => { mx = -1; my = -1; });

    function draw() {
      ctx.clearRect(0, 0, w, h);
      ctx.font = FONT; ctx.fillStyle = COLOR;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';

      for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
          let wave = 0;
          sources.forEach(src => {
            const d = Math.sqrt((x - src.x) ** 2 + (y - src.y) ** 2);
            wave += Math.sin(d * src.freq - t + src.phase);
          });
          // Mouse as third source
          if (mx > 0) {
            const d = Math.sqrt((x - mx) ** 2 + (y - my) ** 2);
            wave += Math.sin(d * 0.2 - t * 1.5);
          }
          const normalized = (wave / (mx > 0 ? 3 : 2) + 1) / 2;
          const idx = Math.floor(normalized * (chars.length - 1));
          ctx.fillText(chars[idx], x * cellW + cellW / 2, y * cellH + cellH / 2);
        }
      }
      t += 0.1;
      requestAnimationFrame(draw);
    }
    draw();
  })();

  // 5. Flocking - mouse is predator
  (function() {
    const s = setupCanvas('demo-slime');
    if (!s) return;
    const { canvas, ctx, w, h } = s;
    const chars = ' ·∙░';

    // Boids
    const boids = [];
    for (let i = 0; i < 100; i++) {
      boids.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2
      });
    }

    // Predator follows mouse
    let predator = { x: w / 2, y: h / 2 };
    let mouseInCanvas = false;

    canvas.addEventListener('mousemove', e => {
      const rect = canvas.getBoundingClientRect();
      predator.x = e.clientX - rect.left;
      predator.y = e.clientY - rect.top;
      mouseInCanvas = true;
    });
    canvas.addEventListener('mouseleave', () => {
      mouseInCanvas = false;
    });

    // Trail grid for visualization
    const COLS = 60, ROWS = 20;
    const cellW = w / COLS, cellH = h / ROWS;
    const density = [];
    for (let y = 0; y < ROWS; y++) {
      density[y] = [];
      for (let x = 0; x < COLS; x++) {
        density[y][x] = 0;
      }
    }

    function step() {
      // Decay density
      for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
          density[y][x] *= 0.85;
        }
      }

      // Update boids
      boids.forEach(boid => {
        let sepX = 0, sepY = 0, sepCount = 0;
        let alignX = 0, alignY = 0, alignCount = 0;
        let cohX = 0, cohY = 0, cohCount = 0;

        boids.forEach(other => {
          if (other === boid) return;
          const dx = other.x - boid.x, dy = other.y - boid.y;
          const d = Math.sqrt(dx * dx + dy * dy);

          if (d < 20) { // Separation
            sepX -= dx / d; sepY -= dy / d; sepCount++;
          }
          if (d < 50) { // Alignment
            alignX += other.vx; alignY += other.vy; alignCount++;
          }
          if (d < 80) { // Cohesion
            cohX += other.x; cohY += other.y; cohCount++;
          }
        });

        // Flee from mouse predator
        if (mouseInCanvas) {
          const predDx = boid.x - predator.x, predDy = boid.y - predator.y;
          const predD = Math.sqrt(predDx * predDx + predDy * predDy);
          if (predD < 100 && predD > 0) {
            boid.vx += (predDx / predD) * 0.8;
            boid.vy += (predDy / predD) * 0.8;
          }
        }

        if (sepCount > 0) { boid.vx += sepX * 0.05; boid.vy += sepY * 0.05; }
        if (alignCount > 0) { boid.vx += (alignX / alignCount - boid.vx) * 0.05; boid.vy += (alignY / alignCount - boid.vy) * 0.05; }
        if (cohCount > 0) { boid.vx += (cohX / cohCount - boid.x) * 0.002; boid.vy += (cohY / cohCount - boid.y) * 0.002; }

        // Limit speed
        const speed = Math.sqrt(boid.vx ** 2 + boid.vy ** 2);
        if (speed > 4) { boid.vx = (boid.vx / speed) * 4; boid.vy = (boid.vy / speed) * 4; }

        boid.x += boid.vx; boid.y += boid.vy;
        boid.x = (boid.x + w) % w; boid.y = (boid.y + h) % h;

        // Add to density
        const gx = Math.floor(boid.x / cellW), gy = Math.floor(boid.y / cellH);
        if (gx >= 0 && gx < COLS && gy >= 0 && gy < ROWS) {
          density[gy][gx] = Math.min(density[gy][gx] + 0.3, 1);
        }
      });
    }

    function draw() {
      step();
      ctx.clearRect(0, 0, w, h);
      ctx.font = FONT;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';

      // Draw density
      ctx.fillStyle = COLOR;
      for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
          const idx = Math.min(Math.floor(density[y][x] * chars.length), chars.length - 1);
          ctx.fillText(chars[idx], x * cellW + cellW / 2, y * cellH + cellH / 2);
        }
      }

      // Draw predator (mouse position) only when mouse is in canvas
      if (mouseInCanvas) {
        ctx.fillStyle = '#c00';
        ctx.fillText('◉', predator.x, predator.y);
      }

      requestAnimationFrame(draw);
    }
    draw();
  })();

})();
