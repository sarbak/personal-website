/**
 * Flocking background - left and right panels as continuous space
 */
(function() {
  const FONT = '11px JetBrains Mono';

  // Color palettes - neutral and warm (when mouse active)
  const COLORS_NEUTRAL = ['#bbb', '#999', '#777', '#555', '#444'];
  const COLORS_WARM = ['#bbb', '#a99', '#997755', '#aa8844', '#cca030'];

  // Mouse activity tracking
  let mouseActivity = 0;

  const leftCanvas = document.getElementById('flock-left');
  const rightCanvas = document.getElementById('flock-right');
  if (!leftCanvas || !rightCanvas) return;

  const leftCtx = leftCanvas.getContext('2d');
  const rightCtx = rightCanvas.getContext('2d');

  let leftW, leftH, rightW, rightH, totalW, h;

  // Grid settings
  const COLS_PER_PANEL = 25;
  let ROWS, cellW, cellH;
  let leftDensity = [];
  let rightDensity = [];

  // Shared boids across both panels
  const boids = [];
  const NUM_BOIDS = 80;

  // Mouse position in combined coordinate space
  let mouseX = -1000, mouseY = -1000;

  function resize() {
    const dpr = window.devicePixelRatio || 1;

    const leftRect = leftCanvas.getBoundingClientRect();
    const rightRect = rightCanvas.getBoundingClientRect();

    leftW = leftRect.width;
    leftH = leftRect.height;
    rightW = rightRect.width;
    rightH = rightRect.height;
    h = leftH;
    totalW = leftW + rightW;

    leftCanvas.width = leftW * dpr;
    leftCanvas.height = leftH * dpr;
    leftCtx.scale(dpr, dpr);

    rightCanvas.width = rightW * dpr;
    rightCanvas.height = rightH * dpr;
    rightCtx.scale(dpr, dpr);

    cellW = leftW / COLS_PER_PANEL;
    cellH = cellW;
    ROWS = Math.ceil(h / cellH);

    // Reset density grids
    leftDensity = [];
    rightDensity = [];
    for (let y = 0; y < ROWS; y++) {
      leftDensity[y] = [];
      rightDensity[y] = [];
      for (let x = 0; x < COLS_PER_PANEL; x++) {
        leftDensity[y][x] = 0;
        rightDensity[y][x] = 0;
      }
    }
  }

  function initBoids() {
    boids.length = 0;
    for (let i = 0; i < NUM_BOIDS; i++) {
      boids.push({
        x: Math.random() * totalW,
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

  // Find empty regions to explore
  function findEmptyDirection(boid) {
    let bestAngle = boid.wanderAngle;
    let lowestDensity = 1;

    // Sample 8 directions
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const checkDist = 80;
      const checkX = boid.x + Math.cos(angle) * checkDist;
      const checkY = boid.y + Math.sin(angle) * checkDist;

      // Wrap coordinates
      const wrappedX = ((checkX % totalW) + totalW) % totalW;
      const wrappedY = ((checkY % h) + h) % h;

      // Check density at that location
      let density = 0;
      if (wrappedX < leftW) {
        const gx = Math.floor(wrappedX / cellW);
        const gy = Math.floor(wrappedY / cellH);
        if (gx >= 0 && gx < COLS_PER_PANEL && gy >= 0 && gy < ROWS) {
          density = leftDensity[gy][gx];
        }
      } else {
        const gx = Math.floor((wrappedX - leftW) / cellW);
        const gy = Math.floor(wrappedY / cellH);
        if (gx >= 0 && gx < COLS_PER_PANEL && gy >= 0 && gy < ROWS) {
          density = rightDensity[gy][gx];
        }
      }

      if (density < lowestDensity) {
        lowestDensity = density;
        bestAngle = angle;
      }
    }

    return bestAngle;
  }

  // Track mouse in combined coordinate space
  let lastMouseX = -1000, lastMouseY = -1000;

  document.addEventListener('mousemove', e => {
    const leftRect = leftCanvas.getBoundingClientRect();
    const rightRect = rightCanvas.getBoundingClientRect();

    // Check if mouse is over left panel
    if (e.clientX >= leftRect.left && e.clientX <= leftRect.right &&
        e.clientY >= leftRect.top && e.clientY <= leftRect.bottom) {
      mouseX = e.clientX - leftRect.left;
      mouseY = e.clientY - leftRect.top;
    }
    // Check if mouse is over right panel
    else if (e.clientX >= rightRect.left && e.clientX <= rightRect.right &&
             e.clientY >= rightRect.top && e.clientY <= rightRect.bottom) {
      mouseX = leftW + (e.clientX - rightRect.left);
      mouseY = e.clientY - rightRect.top;
    }
    else {
      mouseX = -1000;
      mouseY = -1000;
    }

    // Detect movement to boost activity
    if (mouseX >= 0) {
      const moved = Math.abs(mouseX - lastMouseX) + Math.abs(mouseY - lastMouseY);
      if (moved > 2) {
        mouseActivity = Math.min(1, mouseActivity + 0.15);
      }
      lastMouseX = mouseX;
      lastMouseY = mouseY;
    }
  });

  function step() {
    // Decay mouse activity
    mouseActivity *= 0.985;

    // Decay density
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS_PER_PANEL; x++) {
        leftDensity[y][x] *= 0.92;
        rightDensity[y][x] *= 0.92;
      }
    }

    boids.forEach(boid => {
      let sepX = 0, sepY = 0, sepCount = 0;
      let alignX = 0, alignY = 0, alignCount = 0;
      let cohX = 0, cohY = 0, cohCount = 0;
      let isFleeing = false;

      // Check for predator
      if (mouseX >= 0 && mouseY >= 0 && mouseY < h) {
        const predDx = boid.x - mouseX;
        const predDy = boid.y - mouseY;
        const predD = Math.sqrt(predDx * predDx + predDy * predDy);
        if (predD < 180 && predD > 0) {
          isFleeing = true;
          boid.isResting = false;
          const fleeFactor = (180 - predD) / 180;
          boid.vx += (predDx / predD) * fleeFactor * 2.5;
          boid.vy += (predDy / predD) * fleeFactor * 2.5;
        }
      }

      if (!isFleeing) {
        // Count nearby neighbors first
        let neighborCount = 0;
        boids.forEach(other => {
          if (other === boid) return;
          let dx = other.x - boid.x;
          if (Math.abs(dx) > totalW / 2) dx = dx > 0 ? dx - totalW : dx + totalW;
          const dy = other.y - boid.y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 60) neighborCount++;
        });

        // Boredom increases when stationary or in crowded areas
        const currentSpeed = Math.sqrt(boid.vx ** 2 + boid.vy ** 2);
        if (currentSpeed < 0.1 || neighborCount > 4) {
          boid.boredom += 0.5;
        } else {
          boid.boredom = Math.max(0, boid.boredom - 0.1);
        }

        // When bored enough, seek empty spaces
        const isBored = boid.boredom > 100;
        if (isBored) {
          boid.isResting = false;
          boid.wanderAngle = findEmptyDirection(boid);
          // Move towards empty space
          boid.vx += Math.cos(boid.wanderAngle) * 0.08;
          boid.vy += Math.sin(boid.wanderAngle) * 0.08;
          // Reset boredom gradually
          boid.boredom -= 2;
        }

        boid.restTimer--;
        if (boid.restTimer <= 0) {
          boid.isResting = !boid.isResting;
          boid.restTimer = 100 + Math.random() * 300;
        }

        if (!boid.isResting && !isBored) {
          boids.forEach(other => {
            if (other === boid) return;

            // Handle wraparound distance
            let dx = other.x - boid.x;
            let dy = other.y - boid.y;

            // Check if wrapping gives shorter distance
            if (Math.abs(dx) > totalW / 2) {
              dx = dx > 0 ? dx - totalW : dx + totalW;
            }

            const d = Math.sqrt(dx * dx + dy * dy);

            if (d < 25) {
              sepX -= dx / (d + 1);
              sepY -= dy / (d + 1);
              sepCount++;
            }
            if (d < 60) {
              alignX += other.vx;
              alignY += other.vy;
              alignCount++;
            }
            if (d < 100) {
              cohX += dx;
              cohY += dy;
              cohCount++;
            }
          });

          if (sepCount > 0) {
            boid.vx += sepX * 0.02;
            boid.vy += sepY * 0.02;
          }
          if (alignCount > 0) {
            boid.vx += (alignX / alignCount - boid.vx) * 0.015;
            boid.vy += (alignY / alignCount - boid.vy) * 0.015;
          }
          if (cohCount > 0) {
            boid.vx += (cohX / cohCount) * 0.0005;
            boid.vy += (cohY / cohCount) * 0.0005;
          }

          // Occasional random wander impulse
          if (Math.random() < 0.002) {
            boid.wanderAngle += (Math.random() - 0.5) * 1.5;
            boid.vx += Math.cos(boid.wanderAngle) * 0.15;
            boid.vy += Math.sin(boid.wanderAngle) * 0.15;
          }
        } else if (boid.isResting && !isBored) {
          boid.vx *= 0.95;
          boid.vy *= 0.95;
        }
      }

      // Speed limits
      const speed = Math.sqrt(boid.vx ** 2 + boid.vy ** 2);
      const maxSpeed = isFleeing ? 4.0 : 0.6;
      if (speed > maxSpeed) {
        boid.vx = (boid.vx / speed) * maxSpeed;
        boid.vy = (boid.vy / speed) * maxSpeed;
      }

      // Gradual slowdown after fleeing
      if (!isFleeing && speed > 0.7) {
        boid.vx *= 0.97;
        boid.vy *= 0.97;
      }

      boid.x += boid.vx;
      boid.y += boid.vy;

      // Wrap horizontally across combined space
      if (boid.x < 0) boid.x += totalW;
      if (boid.x >= totalW) boid.x -= totalW;

      // Wrap vertically
      if (boid.y < 0) boid.y += h;
      if (boid.y >= h) boid.y -= h;

      // Add to appropriate density grid
      if (boid.x < leftW) {
        const gx = Math.floor(boid.x / cellW);
        const gy = Math.floor(boid.y / cellH);
        if (gx >= 0 && gx < COLS_PER_PANEL && gy >= 0 && gy < ROWS) {
          leftDensity[gy][gx] = Math.min(leftDensity[gy][gx] + 0.25, 1);
        }
      } else {
        const gx = Math.floor((boid.x - leftW) / cellW);
        const gy = Math.floor(boid.y / cellH);
        if (gx >= 0 && gx < COLS_PER_PANEL && gy >= 0 && gy < ROWS) {
          rightDensity[gy][gx] = Math.min(rightDensity[gy][gx] + 0.25, 1);
        }
      }
    });
  }

  // Blend two hex colors
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

  function drawPanel(ctx, density, w) {
    ctx.clearRect(0, 0, w, h);
    ctx.font = FONT;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const chars = ' .·:∘∙°˚*✦~';

    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS_PER_PANEL; x++) {
        const val = density[y][x];
        if (val > 0.03) {
          const charIdx = Math.min(Math.floor(val * chars.length), chars.length - 1);
          const colorIdx = Math.min(Math.floor(val * COLORS_NEUTRAL.length), COLORS_NEUTRAL.length - 1);
          const color = blendColors(COLORS_NEUTRAL[colorIdx], COLORS_WARM[colorIdx], mouseActivity);
          ctx.fillStyle = color;
          ctx.globalAlpha = Math.min(val * 1.5 + 0.3, 0.9);
          ctx.fillText(chars[charIdx], x * cellW + cellW / 2, y * cellH + cellH / 2);
        }
      }
    }
    ctx.globalAlpha = 1;
  }

  function draw() {
    step();
    drawPanel(leftCtx, leftDensity, leftW);
    drawPanel(rightCtx, rightDensity, rightW);
    requestAnimationFrame(draw);
  }

  resize();
  initBoids();
  draw();

  window.addEventListener('resize', () => {
    const dpr = window.devicePixelRatio || 1;
    leftCtx.setTransform(1, 0, 0, 1, 0, 0);
    rightCtx.setTransform(1, 0, 0, 1, 0, 0);
    resize();
  });
})();
