# 🎨 Live Audio Visualizer

A modern, real-time audio-reactive visual effects web application featuring 18 unique visualization modes powered by Web Audio API and advanced canvas rendering.

![Version](https://img.shields.io/badge/version-2.0.0-blue)
![React](https://img.shields.io/badge/React-19.2-61dafb)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178c6)
![License](https://img.shields.io/badge/license-MIT-green)

[🎬 Live Demo](#) | [📖 Documentation](#features) | [🐛 Report Bug](https://github.com/yourusername/repo/issues) | [✨ Request Feature](https://github.com/yourusername/repo/issues)

---

## ✨ Features

### 🎵 Audio Processing
- **Live microphone input** with real-time FFT analysis (Web Audio API)
- **Advanced frequency separation** - Isolated bass (20-250Hz), mid (250-2kHz), and high (2kHz-16kHz) bands
- **2048 sample FFT** with configurable smoothing (0.8 default)
- **60 FPS rendering** with smooth interpolation
- **Privacy-first** - All processing happens locally in your browser
- **No recording** - Audio is analyzed in real-time, never stored

### 🎨 Visual Effects (18 Modes)

#### 🌟 Advanced Effects
1. **Morphing Kaleidoscope** ⭐ *Featured*
   - 20 unique geometric shapes with random sequencing
   - 6 oddish/unusual patterns (Fractals, Voronoi, Spirograph, Lissajous, Strange Attractor, Hypnotic Spiral)
   - 14 standard geometric patterns (Hexagons, Pentagons, Triangles, Stars, etc.)
   - 8-segment kaleidoscope symmetry with smooth crossfade transitions
   - 12-28 second hold times per shape (randomized)

2. **Fluid Dynamics**
   - Optimized metaball simulation with audio-driven turbulence
   - Adaptive resolution scaling for fullscreen performance
   - Offscreen canvas rendering with spatial culling
   - 45% resolution on 1080p, 35% on 1440p, 28% on 4K

3. **Vortex Tunnel**
   - 140 depth rings with 3D perspective
   - Multi-harmonic wave distortion (3 harmonics + bass wave)
   - Dynamic complexity (6-20 sides per ring)
   - 3 inner energy rings with gradient fills
   - Professional 3D particle system (250 particles)

4. **Particle Galaxy**
   - 800 flowing particles with natural motion physics (optimized for performance)
   - 4 force systems: spiral flow, center attraction, turbulence, wave field
   - 10-frame gradient trails per particle
   - Depth-based rendering with central energy core
   - Nebula cloud glows and energy field visualization

5. **Neural Network**
   - Natural flowing network with proximity-based connections
   - Audio-reactive firing across different zones
   - Flow field guidance with boundary constraints
   - Gradient connection lines with distance fade
   - Smooth floating motion with energy visualization

6. **Chromatic Waves**
   - RGB channel separation with interference patterns
   - Multi-wave harmonic synthesis
   - Dynamic color channel shifting

#### 🎵 Classic Spectrum Visualizers
7. **Spectrum Bars** - 128 FFT bars with gradient glow and peak hold
8. **Oscilloscope** - Flowing waveform with neon bloom effects
9. **Radial Bloom** - Clean circular equalizer with 180 bars radiating from center
10. **Frequency Rings** - Concentric rings mapped to bass/mid/high frequencies

#### 🌊 Particle Systems
11. **Orbital Particles** - Swarm physics driven by frequency bands
12. **Constellation** - Connected starfield with transient detection

#### 🔷 Geometric Visualizers
13. **Reactive Grid** - 3D grid tiles rising with audio intensity
14. **Kaleidoscope Mirror** - 8-segment mirror with 6 morphing shapes

#### 🏙️ Thematic Visualizers
15. **Spectrum City** - Night cityscape with 96 buildings (3 architectural styles)
16. **Liquid Aurora** - Fluid shader ripples with spectrum mapping
17. **DNA Helix** - Endless scrolling tunnel through DNA structure with obstacles
18. **Matrix Rain** - Falling matrix code with beat detection

### 🎮 User Interface

#### Controls
- **Sensitivity slider** (0.5x - 2.0x) - Adjust audio reactivity
- **Smooth motion toggle** - Balance responsiveness vs. stability
- **Auto-cycle mode** - Rotate through effects every 30 seconds
- **Dark/Light themes** - Seamless theme switching
- **Fullscreen mode** - Immersive viewing experience

#### Keyboard Shortcuts
- **1-9, 0** - Quick switch to visual modes 1-10
- **Arrow Keys** - Navigate through modes
- **T** - Toggle theme
- **F** - Toggle fullscreen
- **+/=** - Increase sensitivity
- **-/_** - Decrease sensitivity
- **Space** - Pause/resume auto-cycle

#### Responsive Design
- **Desktop-first** layout with mobile optimization
- **Portrait/Landscape** support
- **Touch-optimized** controls for mobile devices
- **Adaptive layouts** for different screen sizes

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** 18.0.0 or higher
- **npm** 9.0.0 or higher
- **Modern browser** with Web Audio API support:
  - Chrome/Edge 90+
  - Firefox 88+
  - Safari 14+ (with limitations)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/audio-visualizer.git
cd audio-visualizer
```

2. **Install dependencies**
```bash
npm install
```

3. **Start development server**
```bash
npm run dev
```
The app will be available at `http://localhost:6001`

### Production Build

```bash
# Build optimized production bundle
npm run build

# Preview production build locally
npm run preview
```

### Environment Variables

Create a `.env` file for custom configuration:

```env
# Custom port (default: 6001)
VITE_PORT=6001

# Enable debug mode (default: false)
VITE_DEBUG=false
```

---

## 🏗️ Architecture

### Project Structure

```
visual-effects-page/
├── src/
│   ├── audio/                  # Audio engine and analysis
│   │   ├── AudioEngine.ts      # Core Web Audio API implementation
│   │   └── useAudioActivity.ts # React hook for audio state
│   │
│   ├── components/             # React UI components
│   │   ├── HeaderBar.tsx       # Top navigation bar
│   │   ├── ControlsPanel.tsx   # Settings and mode selector
│   │   ├── VisualHost.tsx      # Visual effect renderer
│   │   ├── PermissionOverlay.tsx # Microphone permission UI
│   │   └── PrivacyNotice.tsx   # Privacy information
│   │
│   ├── hooks/                  # Custom React hooks
│   │   ├── useKeyboardShortcuts.ts # Keyboard navigation
│   │   └── useAutoCycle.ts     # Auto-rotation logic
│   │
│   ├── state/                  # State management
│   │   ├── types.ts            # TypeScript type definitions
│   │   └── useAppStore.ts      # Zustand store
│   │
│   ├── visuals/                # Visual effect system
│   │   ├── modes/              # Individual visual effects (17 files)
│   │   │   ├── MorphingKaleidoscope.tsx
│   │   │   ├── FluidDynamics.tsx
│   │   │   ├── TunnelVortex.tsx
│   │   │   ├── ParticleGalaxy.tsx
│   │   │   ├── NeuralNetwork.tsx
│   │   │   ├── GeometricPulse.tsx
│   │   │   ├── BarsSpectrum.tsx
│   │   │   ├── WaveformOscilloscope.tsx
│   │   │   ├── RadialSpectrum.tsx
│   │   │   ├── FrequencyRings.tsx
│   │   │   ├── OrbitalParticles.tsx
│   │   │   ├── KaleidoscopeMirror.tsx
│   │   │   ├── SpectrumCity.tsx
│   │   │   ├── ChromaticWaves.tsx
│   │   │   ├── AudioGrid.tsx
│   │   │   ├── Constellation.tsx
│   │   │   └── LiquidSurface.tsx
│   │   │
│   │   ├── registry.ts         # Visual effect registry
│   │   ├── types.ts            # Visual effect type definitions
│   │   └── useCanvasLoop.ts    # Canvas animation hook
│   │
│   ├── App.tsx                 # Main application component
│   ├── main.tsx                # Application entry point
│   └── index.css               # Global styles (Tailwind)
│
├── public/                     # Static assets
├── dist/                       # Production build output
├── AUDIT.md                    # Codebase audit report
├── package.json                # Project dependencies
├── tsconfig.json               # TypeScript configuration
├── vite.config.ts              # Vite build configuration
├── tailwind.config.js          # Tailwind CSS configuration
└── README.md                   # This file
```

### Technology Stack

#### Frontend
- **React 19.2** - UI framework with latest features
- **TypeScript 5.9** - Type-safe development
- **Vite 7.2** - Ultra-fast build tool and dev server
- **Tailwind CSS 3.4** - Utility-first styling

#### State Management
- **Zustand 5.0** - Lightweight state management (<1KB)

#### Graphics & Audio
- **Web Audio API** - Real-time audio analysis
  - `AudioContext` for audio graph
  - `AnalyserNode` for FFT analysis
  - `MediaStream` for microphone input
- **HTML5 Canvas** - 2D rendering with `requestAnimationFrame`
- **Canvas 2D API** - All visual modes use optimized canvas rendering

#### Utilities
- **clsx 2.1** - Conditional className handling

#### Development
- **ESLint 9** - Code linting
- **TypeScript ESLint 8** - TypeScript-specific linting
- **PostCSS 8** - CSS processing
- **Autoprefixer** - CSS vendor prefixing

---

## 🎛️ Configuration

### Audio Engine Settings

Edit `src/audio/AudioEngine.ts` to customize:

```typescript
// FFT Configuration
this.analyser.fftSize = 2048        // 2048, 4096, 8192
this.analyser.smoothingTimeConstant = 0.8  // 0.0 - 1.0

// Frequency Band Definitions
const BASS_RANGE: [number, number] = [20, 250]    // Hz
const MID_RANGE: [number, number] = [250, 2000]   // Hz
const HIGH_RANGE: [number, number] = [2000, 16000] // Hz
```

### Visual Effect Parameters

Each visual mode accepts these props:

```typescript
interface VisualComponentProps {
  sensitivity: number    // 0.5 - 2.0 (default: 1.0)
  smoothMotion: boolean  // Smoothing toggle
  theme: 'dark' | 'light'
}
```

### Port Configuration

Change server port in `vite.config.ts`:

```typescript
export default defineConfig({
  server: { port: 6001 },
  preview: { port: 6001 },
})
```

Or use environment variable:
```bash
VITE_PORT=3000 npm run dev
```

---

## 🎨 Visual Modes Deep Dive

### Morphing Kaleidoscope
**20 unique shapes in 8-segment symmetry**

**Standard Geometric (14 shapes):**
- Frequency Spikes, Nested Polygons, Hexagonal Honeycomb
- Triangular Grid, Rotating Squares, Star Points
- Petal Mandala, Diamond Lattice, Pentagon Spiral
- Octagonal Web, Cross Pattern, Gear Teeth
- Zigzag Rings, Lotus Geometry

**Oddish/Unusual (6 shapes):**
- Fractal Branches (recursive 4-level branching)
- Voronoi Cells (organic polygon cells)
- Spirograph (mathematical curve pattern)
- Lissajous Curves (parametric wave harmonics)
- Strange Attractor (chaotic system, 800 iterations)
- Hypnotic Spiral (wobbling spiral paths)

**Features:**
- Random shuffle system (no repetitive patterns)
- 12-28 second hold times (randomized)
- 2-second smooth crossfade transitions
- Bass-reactive rotation (0.3× sensitivity)
- Vertical mirroring per segment

### Fluid Dynamics
**Optimized metaball simulation**

- Adaptive resolution scaling (28-60% based on screen size)
- Offscreen canvas with desynchronized context
- Spatial culling for performance
- 12-35 metaballs (varies by resolution)
- Reduced sensitivity (60-70% multipliers)
- Vortex motion and attraction forces

### Neural Network
**Natural flowing network**

- 150 neurons in 3×2 cluster grid
- Proximity-based connections (not layered)
- Flow field guidance (sine/cosine waves)
- Mutual attraction between active neurons
- Gradient connection lines
- Energy field visualization

### Performance Optimizations

| Mode | Technique | Impact |
|------|-----------|--------|
| Fluid Dynamics | Resolution scaling | 3-5x faster fullscreen |
| Particle Galaxy | Depth sorting | Proper layering |
| Neural Network | Connection culling | 2x render speed |
| Frequency Rings | Segment filtering | 40% fewer draws |
| Geometric Pulse | Fog system | Better depth perception |

---

## 🔒 Privacy & Security

This application is designed with privacy as a priority:

- ✅ **Local processing** - All audio analysis happens in your browser
- ✅ **No recording** - Audio is never recorded or stored
- ✅ **No tracking** - No analytics, cookies, or tracking scripts
- ✅ **No external requests** - No data sent to servers
- ✅ **Open source** - Full transparency of code
- ✅ **Microphone only** - Permission used solely for visualization

### Microphone Access
The app requests microphone permission to analyze audio in real-time using Web Audio API. The audio stream:
- Is processed locally via `AnalyserNode`
- Is never recorded or saved
- Is never transmitted over network
- Can be revoked anytime in browser settings

---

## 🐛 Troubleshooting

### No Visuals / Black Screen

**Symptoms:** Canvas shows nothing after granting mic permission

**Solutions:**
1. **Hard refresh** - `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
2. **Check console** - Open DevTools (F12) and look for errors
3. **Try different browser** - Chrome/Edge recommended
4. **Update graphics drivers** - Especially for Three.js modes
5. **Disable hardware acceleration** - Test if GPU issue

### Audio Not Responsive

**Symptoms:** Visuals render but don't react to sound

**Solutions:**
1. **Check microphone** - Test in system settings
2. **Increase sensitivity** - Slide to 1.5x or 2.0x
3. **Make louder sounds** - Music, clapping, or speaking
4. **Check browser permissions** - Ensure mic access granted
5. **Try different mic** - If using external mic
6. **Refresh page** - Restart audio context

### Performance Issues / Low FPS

**Symptoms:** Choppy animations, stuttering

**Solutions:**
1. **Close other tabs** - Free up browser resources
2. **Reduce sensitivity** - Lower visual complexity
3. **Enable smooth motion** - Toggle in controls
4. **Try simpler modes** - Start with Spectrum Bars or Waveform
5. **Lower resolution** - Resize window for better performance
6. **Check CPU usage** - Close background apps
7. **Update browser** - Ensure latest version

### Safari-Specific Issues

**Symptoms:** Audio context suspended, no sound detection

**Solutions:**
1. **Click anywhere** - Safari requires user interaction to start AudioContext
2. **Check iOS restrictions** - Some features limited on mobile Safari
3. **Use desktop Safari** - Better Web Audio API support
4. **Try Chrome/Firefox** - Better compatibility

### Microphone Permission Denied

**Symptoms:** Permission overlay persists

**Solutions:**
1. **Reset permissions** - Browser settings → Site settings → Camera/Mic
2. **Check system settings** - OS-level mic access (Mac: System Preferences)
3. **Try incognito mode** - Test without extensions
4. **Clear site data** - Remove cached permissions

---

## 🚧 Known Limitations

1. **Safari mobile** - Limited Web Audio API support on iOS
2. **Firefox Android** - Performance may vary on mobile
3. **3D modes** - Require WebGL support (GeometricPulse)
4. **High refresh rates** - Capped at 60 FPS rendering
5. **Multiple tabs** - Audio context may suspend when tab inactive

---

## 📊 Performance & Bundle Size

### Build Metrics
- **Initial Bundle:** 251.25 kB (79.02 kB gzipped)
- **Time to Interactive (4G):** ~3.5 seconds
- **Time to Interactive (WiFi):** ~1 second
- **Build Time:** 4.84 seconds (30% faster after optimizations)
- **Code Splitting:** ✅ 18 lazy-loaded visual modes

### Bundle Breakdown
| Component | Size | Gzipped | Load Strategy |
|-----------|------|---------|---------------|
| Main bundle | 239.14 kB | 74.44 kB | Immediate |
| React vendor | 11.37 kB | 4.11 kB | Immediate |
| Zustand | 0.74 kB | 0.47 kB | Immediate |
| **Initial Load Total** | **251.25 kB** | **79.02 kB** | - |
| Visual modes (18) | ~58 kB | ~24 kB | Lazy loaded |

### Runtime Performance
Tested on i5-11400 CPU, integrated graphics, 1080p fullscreen:

| Visual Mode | CPU Usage | Notes |
|-------------|-----------|-------|
| Spectrum Bars | 5-10% | Simple, very efficient |
| Waveform | 5-8% | Line drawing, fast |
| Morphing Kaleidoscope | 12-20% | Complex shape rendering |
| Fluid Dynamics | 20-35% | Pixel iteration (adaptive scaling) |
| Particle Galaxy | 15-25% | 800 particles × 10 trail segments |
| Neural Network | 10-18% | Connection rendering |

*Performance varies based on hardware and browser. See [docs/PERFORMANCE.md](docs/PERFORMANCE.md) for detailed audit.*

### Recent Optimizations Applied ✅
- **Device Pixel Ratio:** Capped at 2× (prevents 4× overhead on high-DPI displays)
- **Resize Debouncing:** 100ms throttle (prevents excessive canvas reallocation)
- **FluidDynamics:** Spatial culling added (20-30% CPU reduction)
- **ParticleGalaxy:** Trail length reduced 10→5 (50% fewer draw calls)
- **Memory Management:** Fixed AudioEngine blob URL leaks
- **Dead Code Removed:** Three.js eliminated (600 KB freed)

> 📖 **For detailed performance analysis, optimization recommendations, and known issues, see [docs/PERFORMANCE.md](docs/PERFORMANCE.md)**

---

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) first.

### Development Workflow

1. **Fork the repository**
2. **Create feature branch** (`git checkout -b feature/AmazingFeature`)
3. **Commit changes** (`git commit -m 'Add AmazingFeature'`)
4. **Push to branch** (`git push origin feature/AmazingFeature`)
5. **Open Pull Request**

### Adding New Visual Modes

1. Create new file in `src/visuals/modes/YourMode.tsx`
2. Implement the component following existing patterns
3. Add to `src/visuals/registry.ts`
4. Test performance across different screen sizes
5. Document audio reactivity and features

### Code Style

- Use **TypeScript** for type safety
- Follow **React hooks** patterns
- Write **functional components**
- Use **ESLint** for linting
- Keep **files under 500 lines** when possible
- Add **comments** for complex logic

---

## 📝 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Web Audio API** - Mozilla and browser vendors
- **React team** - Modern UI framework
- **Vite team** - Lightning-fast build tool
- **Tailwind CSS** - Utility-first styling
- **Winamp visualizers** - Classic inspiration
- **Shadertoy community** - Shader art inspiration

---

## 📞 Support

- **Issues:** [GitHub Issues](https://github.com/yourusername/repo/issues)
- **Discussions:** [GitHub Discussions](https://github.com/yourusername/repo/discussions)
- **Email:** support@yourproject.com

---

## 🗺️ Roadmap

### Completed ✅
- [x] 18 unique visual modes
- [x] Advanced audio analysis (bass/mid/high separation)
- [x] Fullscreen support
- [x] Auto-cycle mode
- [x] Keyboard shortcuts
- [x] Dark/Light themes
- [x] Performance optimizations
- [x] 20 shapes in Morphing Kaleidoscope
- [x] Clean circular equalizer (Radial Bloom)

### In Progress 🚧
- [ ] Testing infrastructure (Vitest)
- [ ] Accessibility improvements (ARIA labels)
- [ ] Mobile optimizations

### Planned 🎯
- [ ] Visual mode favorites/bookmarks
- [ ] Preset configurations for different music genres
- [ ] Export/import settings via URL
- [ ] Screenshot capture feature
- [ ] Audio file upload support (visualize files, not just mic)
- [ ] BPM detection and beat sync
- [ ] Custom color schemes
- [ ] Recording video output
- [ ] Performance metrics overlay (FPS counter)
- [ ] Visual mode marketplace/sharing

---

## 📈 Changelog

### v2.0.1 (November 2024)
- Added 20 shapes to Morphing Kaleidoscope
- Optimized Fluid Dynamics for fullscreen (adaptive resolution scaling)
- Optimized Particle Galaxy (reduced from 2500 to 800 particles)
- Rewrote Neural Network with natural flow
- Fixed BarsSpectrum reflection
- Comprehensive performance audit
- Updated documentation with real build metrics

### v1.0.0 (Initial Release)
- 18 visual modes
- Web Audio API integration
- React 19 + TypeScript
- Responsive UI with Tailwind
- Dark/Light theme support

---

**Built with ❤️**