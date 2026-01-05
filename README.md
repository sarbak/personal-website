# emresarbak.com

Personal website with flocking animation.

## Features

- Minimalist design with JetBrains Mono
- Flocking boids animation on side panels
- Mouse acts as predator, warm colors on movement
- Links loaded from `links.json` for easy updates

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
