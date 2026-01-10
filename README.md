# emresarbak.com

Personal website with interactive flocking ecosystem.

## Features

- Minimalist left-aligned design with JetBrains Mono
- Dark mode with auto system detection (toggle in bottom right)
- ASCII flocking boids on the right panel
- Mouse leaves crumbs that attract and feed the flock
- Boids eat, grow, reproduce, and die (ecosystem simulation)
- Theme-aware colors (adapts to light/dark mode)
- Population counter in top right
- Links loaded from `links.json` for easy updates

## The Flock

- Mouse movements leave ASCII crumbs on the grid
- Boids are attracted to crumbs and eat them
- Well-fed boids (energy > 2.0) can reproduce
- Starving boids die (but population never drops below 20)
- Population swings are visible based on feeding activity
- Population cap: 300

## Adding Links

Edit `links.json`:

```json
{
  "tag": "essay",
  "title": "Your Title Here",
  "url": "https://example.com"
}
```

Tags: `essay`, `tweet`, `talk`, `project`, `tool`, etc.

## Local Development

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000

## Deployment

Hosted on GitHub Pages at https://emresarbak.com

## Built With

Claude Code (Opus 4.5)
