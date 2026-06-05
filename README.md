# Coca‑Cola — Taste The Feeling

A world‑class, Awwwards‑grade 3D animated landing page inspired by Coca‑Cola's brand identity. Cinematic, luxurious, and highly interactive.

## ✨ Highlights

- **Hyper‑realistic 3D bottle** with glass shaders (transmission, IOR, clearcoat), 200+ animated carbonation bubbles, 250 condensation droplets, and orbiting ice cubes
- **5 cinematic 3D scenes**: Hero bottle, product cans, liquid wave shader, interactive globe with light trails, and the brand‑defining bottle composition
- **Smooth Apple‑style scrolling** with Lenis + Framer Motion + GSAP reveals
- **Custom magnetic cursor**, glassmorphism nav, and preloader
- **Bottle‑to‑particle explosion on scroll** as you leave the hero
- **Procedural HDR environment** (no external HDRIs needed)
- **Fully responsive**, GPU‑accelerated, mobile‑optimized
- **Production build verified** — 46 kB page size, 133 kB first‑load JS

## 🛠 Stack

- **Next.js 14** (App Router)
- **React Three Fiber** + **Three.js r169**
- **@react-three/drei** + **@react-three/postprocessing**
- **Framer Motion 11**
- **GSAP 3.12**
- **Lenis** smooth scroll
- **Tailwind CSS 3.4**
- **TypeScript** strict

## 🚀 Run it

```bash
cd coca-cola-premium
npm install
npm run dev    # → http://localhost:3000
npm run build  # production
npm start      # production server
```

## 📁 Structure

```
src/
├─ app/
│  ├─ layout.tsx        # fonts, metadata, providers
│  ├─ page.tsx          # main composition
│  └─ globals.css       # design system
├─ components/
│  ├─ 3d/               # all Three.js / R3F scenes
│  │  ├─ CocaColaBottle.tsx     # hyper-real bottle
│  │  ├─ FloatingBottle.tsx     # standalone bottle
│  │  ├─ CanScene.tsx           # product cans
│  │  ├─ GlobeScene.tsx         # interactive globe
│  │  ├─ LiquidWaveScene.tsx    # custom shader liquid
│  │  └─ ParticleExplosion.tsx  # particle systems
│  ├─ sections/         # page sections (Hero, Legacy, etc.)
│  └─ ui/               # Cursor, Nav, Preloader, Buttons
└─ lib/cn.ts
```

## 🎨 Customization

- **Colors** — edit `tailwind.config.ts` → `theme.extend.colors.cc`
- **Bottle contour** — `src/components/3d/CocaColaBottle.tsx` → `contourPoints`
- **Flavors** — `src/components/3d/CanScene.tsx` → `FLAVORS`
- **Copy** — edit each section file in `src/components/sections/`

Enjoy the fizz. ✦
