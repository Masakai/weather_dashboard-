# CLAUDE.md - AI Assistant Guide

**Project**: 天体観測できるかな？ (Astronomical Observation Weather Dashboard)
**Version**: 3.1.5
**Organization**: 株式会社リバーランズ・コンサルティング
**Last Updated**: 2026-01-17

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Repository Structure](#repository-structure)
3. [Architecture & Design](#architecture--design)
4. [Code Organization](#code-organization)
5. [Development Workflow](#development-workflow)
6. [Coding Conventions](#coding-conventions)
7. [Technology Stack](#technology-stack)
8. [File Reference](#file-reference)
9. [Common Development Tasks](#common-development-tasks)
10. [Important Notes for AI Assistants](#important-notes-for-ai-assistants)

---

## Project Overview

### What is This Project?

This is an **astronomical observation weather dashboard** that helps users determine optimal conditions for stargazing. It integrates:

- **Weather data** (cloud cover, humidity, visibility, wind speed)
- **Astronomical calculations** (sun/moon positions, twilight times, planetary positions)
- **ISS tracking** (International Space Station orbital predictions)
- **Comprehensive scoring** (0-100 scale for stargazing visibility)

### Key Features

1. **Starry Sky Visibility Score**: Weighted evaluation of multiple weather factors
2. **Astronomical Twilight Calculation**: Precise timing for observation windows
3. **24-Hour Timeline Visualization**: Color-coded observation suitability
4. **ISS Pass Predictions**: 7-day forecast with sky map visualization
5. **Interactive Sky Map**: Canvas-based celestial object plotting
6. **Night Vision Mode**: Red-tinted display to preserve dark adaptation
7. **Favorite Locations**: Save up to 5 observation sites
8. **Milky Way Visibility**: Galactic center position and viewing predictions

### Language

- **UI Language**: Japanese (ja)
- **Code Comments**: Mixed Japanese/English (prefer Japanese for user-facing features)
- **Documentation**: Primarily Japanese

---

## Repository Structure

```
weather_dashboard/
├── CHANGELOG.md              # Version history (semantic versioning)
├── README.md                 # User-facing documentation (Japanese)
├── CLAUDE.md                 # This file - AI assistant guide
└── docs/                     # Application root (served as static site)
    ├── index.html            # Main HTML file
    ├── main.js               # Entry point (ES Module)
    ├── state.js              # Centralized application state
    ├── constants.js          # Static data (meteor showers, seasonal objects)
    ├── ui-utils.js           # Common UI controls (accordion, night vision)
    ├── location-service.js   # Location, map, favorites management
    ├── weather-service.js    # Weather data fetching, dashboard rendering
    ├── iss-service.js        # ISS orbit calculation, notifications
    ├── astronomy-service.js  # Planets, galaxy, astronomical events
    ├── CHANGELOG.md          # Duplicate changelog in docs folder
    └── internal_spec.md      # Technical specification (Japanese)
```

### Key Points

- **No build process**: Pure HTML/CSS/JS served directly from `docs/` folder
- **ES Modules**: All JavaScript files use `export`/`import` syntax
- **Version parameters**: Module imports include `?v=X.X.X` for cache busting
- **GitHub Pages compatible**: Designed to be deployed as static site

---

## Architecture & Design

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         User Browser                         │
├─────────────────────────────────────────────────────────────┤
│  index.html (UI Layer)                                      │
│    ↓                                                         │
│  main.js (Entry Point)                                      │
│    ├── Imports all modules                                  │
│    ├── Registers functions to window (backward compat)      │
│    └── Initializes app on load                             │
├─────────────────────────────────────────────────────────────┤
│                    Service Layer                             │
│  ┌──────────────┬──────────────┬──────────────┐            │
│  │ ui-utils.js  │ location-    │ weather-     │            │
│  │              │ service.js   │ service.js   │            │
│  └──────────────┴──────────────┴──────────────┘            │
│  ┌──────────────┬──────────────┐                           │
│  │ iss-service  │ astronomy-   │                           │
│  │ .js          │ service.js   │                           │
│  └──────────────┴──────────────┘                           │
├─────────────────────────────────────────────────────────────┤
│                    State Layer                               │
│  state.js (AppState object)                                 │
│    ├── location (lat, lon, favorites)                       │
│    ├── weather (data, selectedDatetime)                     │
│    ├── iss (tle, passes, notifications)                     │
│    └── ui (map, charts, intervals)                         │
├─────────────────────────────────────────────────────────────┤
│                   External APIs                              │
│  ├── Open-Meteo API (weather forecasts)                    │
│  ├── Nominatim API (reverse geocoding)                     │
│  └── CelesTrak API (ISS TLE data)                          │
└─────────────────────────────────────────────────────────────┘
```

### Design Principles

1. **Service-Oriented Architecture**: Each module handles a specific domain (weather, ISS, astronomy)
2. **Centralized State**: All app state lives in `AppState` object (no scattered globals)
3. **Functional Decomposition**: Large functions split into focused, single-purpose functions
4. **Backward Compatibility**: Functions exposed to `window` for inline HTML event handlers
5. **Cache Management**: Version parameters on imports to prevent stale module loading

### Major Refactoring (v3.0.0)

In version 3.0.0, the codebase underwent a **major refactoring**:

**Before**: Single `functions.js` file (~3,000 lines) with mixed responsibilities
**After**: 5 modular service files with clear separation of concerns

This was done while maintaining **100% backward compatibility** with existing HTML event handlers.

---

## Code Organization

### Module Breakdown

#### `state.js` - Application State

**Purpose**: Centralized state management

```javascript
export const AppState = {
    location: { lat, lon, favoriteLocations },
    weather: { data, selectedDatetime },
    iss: { tle, calculatedPasses, notificationInterval, ... },
    ui: { map, marker, charts, intervals }
};
```

**Key Conventions**:
- Always import from other modules: `import { AppState } from './state.js?v=X.X.X';`
- Never create new global variables; add to AppState instead
- Use `localStorage` for persistence (favorites, night vision mode)

---

#### `constants.js` - Static Data

**Purpose**: Immutable reference data

**Exports**:
- `METEOR_SHOWERS`: Array of major meteor showers with peak dates
- `SEASONAL_OBJECTS`: Seasonal celestial objects categorized by moon phase

**Convention**: Use `export const` for all constants

---

#### `ui-utils.js` - Common UI Controls

**Purpose**: Shared UI functionality

**Key Functions**:
- `toggleAccordion(id)`: Expand/collapse accordion panels
- `toggleNightVision()`: Switch red-tinted night mode
- `escapeHtml(text)`: Sanitize user input (guards against null/undefined)
- `updateDateTime(datetime)`: Synchronize datetime picker with app state

**Convention**: Pure utility functions with no side effects beyond DOM manipulation

---

#### `location-service.js` - Location Management

**Purpose**: Geolocation, maps, and favorites

**Key Functions**:
- `getCurrentLocation(isInitial)`: Request browser geolocation
- `updateAppLocation(lat, lon)`: Central location change handler
- `addFavoriteLocation()`: Save location to favorites (max 5)
- `renderFavoriteLocations()`: Display favorite location list
- `initMap()`: Initialize Leaflet map

**Dependencies**:
- Leaflet.js for map rendering
- OpenStreetMap Nominatim for reverse geocoding
- `localStorage` for favorite persistence

**Convention**: All functions that change location should call `updateAppLocation()`

---

#### `weather-service.js` - Weather Data & Dashboard

**Purpose**: Fetch weather data and render main dashboard

**Key Functions**:
- `fetchWeather()`: Retrieve forecast from Open-Meteo API
- `renderDashboard()`: Orchestrate rendering of all dashboard elements
- `calculateStarryScore()`: Compute 0-100 visibility score
- `renderRadarChart()`: Draw 5-axis radar chart (Chart.js)
- `renderTimeline()`: Create 24-hour observation timeline
- `renderTemperatureChart()`: Temperature/humidity line graph
- `renderCloudChart()`: Cloud cover layer graph

**Scoring Algorithm**:
```javascript
score = cloudScore(40%) + moonScore(30%) + humidityScore(15%)
        + visibilityScore(10%) + windScore(5%)
```

**Convention**: Weather data is stored in `AppState.weather.data` after fetching

---

#### `iss-service.js` - ISS Tracking

**Purpose**: ISS orbit calculation and pass predictions

**Key Functions**:
- `updateISSInfo()`: Fetch latest TLE from CelesTrak (cached 24h)
- `calculateISSPasses()`: Predict 7-day passes using satellite.js
- `drawISSSkymapCanvas(pass)`: Render sky map with ISS trajectory
- `checkISSNotifications()`: Monitor for upcoming passes (1-hour warning)
- `requestNotificationPermission()`: Request browser notification permission

**TLE Caching**:
- TLE data stored in `localStorage` with timestamp
- Refreshed only if >24 hours old (reduces API calls)

**Pass Prediction Logic**:
1. Propagate ISS position every 1 minute for 7 days
2. Convert ECI → ECF → Look Angles (azimuth, elevation)
3. Detect passes: elevation > 0° (above horizon)
4. Filter: only passes with max elevation > 10° (observable)
5. Store in `AppState.iss.calculatedPasses`

**Sky Map Coordinate Transform**:
```javascript
// Azimuth/Altitude → Canvas (X, Y)
radius = ((90 - altitude) / 90) * maxRadius;
x = centerX + radius * sin(azimuth);
y = centerY - radius * cos(azimuth);
```

**Convention**: Always check for TLE data before calculations

---

#### `astronomy-service.js` - Astronomical Calculations

**Purpose**: Celestial events, planets, Milky Way visibility

**Key Functions**:
- `calculateSunMoonTimes()`: Sunrise, sunset, twilight times (Astronomy Engine)
- `calculateMoonData()`: Moon phase, age, illumination
- `calculateMilkyWayVisibility()`: Galactic center visibility score
- `updateAstronomicalEvents()`: Render planet positions, meteor showers
- `calculateExposureSettings()`: Astrophotography exposure calculator

**Astronomical Twilight**:
- **Civil**: Sun at -6° (bright stars visible)
- **Nautical**: Sun at -12° (horizon still visible)
- **Astronomical**: Sun at -18° (true darkness, optimal for observation)

**Milky Way Visibility Factors**:
1. Moon phase (prefer new moon)
2. Moon altitude (lower is better)
3. Angular distance between moon and galactic center
4. Cloud cover
5. Galactic center altitude (must be above horizon)

**Convention**: Use Astronomy Engine library for all celestial calculations

---

#### `main.js` - Entry Point

**Purpose**: Initialize app and bridge modules to global scope

**What It Does**:
1. Import all service modules
2. Merge all exports into `window` object (for HTML onclick handlers)
3. Register `AppState` to `window`
4. Initialize Lucide icons
5. Set Moment.js locale to Japanese
6. Restore night vision mode from localStorage
7. Start clock update interval
8. Get user location on page load

**Convention**: Keep this file minimal; logic belongs in service modules

---

### ES Module Import Convention

**Always use version parameters for cache busting**:

```javascript
import { AppState } from './state.js?v=3.1.5';
import * as weatherService from './weather-service.js?v=3.1.5';
```

**Why?**: GitHub Pages and CDNs aggressively cache JS files. Version parameters force browser to fetch new versions.

**When to Update Version**:
- On every release, update version in all module imports
- Version should match the version in README.md and CHANGELOG.md

---

## Development Workflow

### Branching Strategy

**Branch Naming Convention**: `claude/<feature-description>-<session-id>`

Examples:
- `claude/refactor-js-modularize-Xsh2o`
- `claude/add-claude-documentation-NF21K`
- `claude/realtime-skymap-7UDHG`

**Why this convention?**:
- Prefix `claude/` indicates AI-assisted development
- Session ID prevents branch name collisions
- Git operations require matching session ID for security

### Commit Message Style

**Language**: Japanese
**Format**: Semantic, descriptive

Good examples from recent history:
```
ISS星座図のリアルタイム更新モードを実装し、パス予測切り替え機能を改善。バージョンを3.1.5に更新。
バージョンを3.1.3に更新。全モジュールのインポートにバージョンパラメータを追加し、リモート環境でのキャッシュ問題を解消。
escapeHtml関数にnull/undefinedガードを追加し、main.jsのキャッシュ対策としてバージョンパラメータを追加。バージョンを3.1.2に更新。
```

**Commit Message Guidelines**:
1. Write in Japanese
2. Start with main change, then list supporting changes
3. Always mention version number if bumped
4. Be specific about what was fixed/added/changed

### Versioning (Semantic Versioning)

**Format**: `MAJOR.MINOR.PATCH`

- **MAJOR** (X.0.0): Breaking changes, major refactors (e.g., v3.0.0 modularization)
- **MINOR** (x.Y.0): New features, enhancements (e.g., v2.11.0 exposure calculator)
- **PATCH** (x.y.Z): Bug fixes, small improvements (e.g., v3.1.2 null guard)

**Files to Update**:
1. `README.md` (badge and version header)
2. `CHANGELOG.md` (add new entry at top)
3. `docs/CHANGELOG.md` (keep in sync)
4. All module imports in JS files (update `?v=X.Y.Z`)

### Pull Request Workflow

1. **Develop on feature branch** (e.g., `claude/feature-name-ABC123`)
2. **Commit changes** with descriptive Japanese messages
3. **Update CHANGELOG.md** with all changes
4. **Bump version** in all files
5. **Push to remote** (`git push -u origin claude/feature-name-ABC123`)
6. **Create PR** to main branch with summary in Japanese

---

## Coding Conventions

### JavaScript Style

**ES6+ Features**: Use modern JavaScript
- Arrow functions: `const func = () => {}`
- Template literals: `` `Hello ${name}` ``
- Destructuring: `const { lat, lon } = AppState.location;`
- Async/await: Prefer over raw Promises
- Optional chaining: `obj?.prop?.nested`

**Naming**:
- **Functions**: camelCase (`calculateStarryScore`)
- **Constants**: UPPER_SNAKE_CASE (`METEOR_SHOWERS`)
- **Files**: kebab-case (`weather-service.js`)
- **Modules**: camelCase when imported (`weatherService`)

**No Semicolons**: This project omits semicolons (ASI - Automatic Semicolon Insertion)

**Comments**:
- Use Japanese for user-facing logic
- Use English for technical/algorithmic comments
- JSDoc-style comments for complex functions

### HTML Conventions

**Structure**:
- Use TailwindCSS utility classes extensively
- Glass-morphism design pattern (`.glass-panel`)
- Responsive breakpoints: `md:`, `lg:` prefixes

**Event Handlers**:
- Inline handlers are acceptable (legacy compatibility)
- Example: `onclick="toggleAccordion('iss-panel')"`

**Accessibility**:
- Use semantic HTML (`<section>`, `<header>`, `<main>`)
- Lucide icons with aria labels

### CSS Conventions

**Night Vision Mode**:
```css
body.night-vision {
    filter: hue-rotate(180deg) invert(1);
    background: #300000 !important;
}
```

**Custom Styles**:
- Defined in `<style>` tag in `index.html`
- Minimal custom CSS (leverage TailwindCSS)

### Error Handling

**Best Practices**:
1. Always validate null/undefined (e.g., `escapeHtml` function)
2. Graceful fallbacks for API failures
3. Console errors for debugging (not user-facing)
4. User-friendly error messages in Japanese

**Example**:
```javascript
try {
    const response = await fetch(url);
    if (!response.ok) throw new Error('API error');
    const data = await response.json();
    return data;
} catch (error) {
    console.error('Weather fetch failed:', error);
    alert('天気データの取得に失敗しました');
    return null;
}
```

---

## Technology Stack

### Core Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| **HTML5** | - | Structure |
| **CSS3** | - | Styling |
| **JavaScript** | ES6+ | Logic |
| **TailwindCSS** | latest (CDN) | Utility-first CSS framework |

### Libraries (CDN)

| Library | Version | Usage |
|---------|---------|-------|
| [Chart.js](https://www.chartjs.org/) | 4.4.1 | Temperature, cloud, radar charts |
| [Moment.js](https://momentjs.com/) | 2.29.4 | Date/time manipulation, Japanese locale |
| [Leaflet](https://leafletjs.com/) | 1.9.4 | Interactive maps |
| [Lucide Icons](https://lucide.dev/) | latest | Icon library |
| [Astronomy Engine](https://github.com/cosinekitty/astronomy) | 2.1.19 | Planetary positions, twilight calculations |
| [Satellite.js](https://github.com/shashwatak/satellite-js) | 5.0.0 | ISS orbit calculations (TLE propagation) |

### External APIs

| API | Rate Limit | Usage | Documentation |
|-----|------------|-------|---------------|
| **Open-Meteo** | Generous (free) | Weather forecasts (hourly, daily) | [open-meteo.com](https://open-meteo.com/) |
| **Nominatim** | 1 req/sec | Reverse geocoding (coordinates → address) | [nominatim.org](https://nominatim.openstreetmap.org/) |
| **CelesTrak** | No strict limit | ISS TLE data (cached 24h) | [celestrak.org](https://celestrak.org/) |

**API Guidelines**:
- Always handle rate limits gracefully
- Cache responses when possible (TLE caching example)
- Provide user feedback on API failures

---

## File Reference

### Quick Reference

| File | Lines | Purpose | Key Exports |
|------|-------|---------|-------------|
| `index.html` | ~1200 | Main UI | - |
| `main.js` | ~52 | Entry point | - |
| `state.js` | ~35 | State management | `AppState` |
| `constants.js` | ~66 | Static data | `METEOR_SHOWERS`, `SEASONAL_OBJECTS` |
| `ui-utils.js` | ~100 | UI utilities | `toggleAccordion`, `toggleNightVision`, `escapeHtml` |
| `location-service.js` | ~300 | Location/maps | `getCurrentLocation`, `updateAppLocation`, `initMap` |
| `weather-service.js` | ~800 | Weather/dashboard | `fetchWeather`, `renderDashboard`, `calculateStarryScore` |
| `iss-service.js` | ~700 | ISS tracking | `updateISSInfo`, `calculateISSPasses`, `drawISSSkymapCanvas` |
| `astronomy-service.js` | ~600 | Astronomical events | `calculateSunMoonTimes`, `updateAstronomicalEvents` |

### Documentation Files

| File | Purpose |
|------|---------|
| `README.md` | User-facing documentation (Japanese) |
| `CHANGELOG.md` | Version history (Keep a Changelog format) |
| `docs/internal_spec.md` | Technical specification (Japanese) |
| `CLAUDE.md` | This file - AI assistant guide |

---

## Common Development Tasks

### Adding a New Feature

1. **Determine which service module** it belongs to:
   - UI-related → `ui-utils.js`
   - Location/maps → `location-service.js`
   - Weather → `weather-service.js`
   - ISS → `iss-service.js`
   - Astronomy → `astronomy-service.js`

2. **Write the function** in the appropriate module:
   ```javascript
   export function myNewFeature() {
       // Implementation
   }
   ```

3. **If it needs state**, add to `AppState` in `state.js`

4. **If it uses static data**, add to `constants.js`

5. **Test** by calling from browser console or HTML

6. **Update CHANGELOG.md**

7. **Bump version** and update imports

### Fixing a Bug

1. **Locate the bug** (check browser console for errors)

2. **Identify the module** responsible

3. **Fix the issue**:
   - Add null checks if data might be missing
   - Validate API responses
   - Handle edge cases

4. **Test thoroughly**:
   - Different locations
   - Different times/dates
   - Edge cases (null data, API failures)

5. **Update CHANGELOG.md** under `### Fixed`

6. **Bump PATCH version** (e.g., 3.1.2 → 3.1.3)

### Updating Dependencies

**CDN Libraries**: Update version in `index.html` `<script>` tags

Example:
```html
<!-- Old -->
<script src="https://cdn.jsdelivr.net/npm/astronomy-engine@2.1.18/..."></script>

<!-- New -->
<script src="https://cdn.jsdelivr.net/npm/astronomy-engine@2.1.19/..."></script>
```

**Testing**: Always test critical paths after updating

### Refactoring

**Guidelines**:
1. **Maintain backward compatibility** (unless major version bump)
2. **Keep functions in window scope** for HTML event handlers
3. **Update all imports** if moving code between modules
4. **Run full regression testing**

**Recent Example**: v3.0.0 refactoring
- Split 3000-line file into 5 modules
- Maintained 100% backward compatibility
- Updated all imports with version parameters

---

## Important Notes for AI Assistants

### Critical Rules

1. **Always update version parameters** when modifying JS files:
   ```javascript
   import { AppState } from './state.js?v=3.1.5';  // Update this!
   ```

2. **Maintain Japanese language** for:
   - Commit messages
   - CHANGELOG entries
   - User-facing comments
   - Error messages shown to users

3. **Never break backward compatibility** without major version bump:
   - Keep functions in `window` scope (even if also exported)
   - Don't remove or rename public functions

4. **Follow semantic versioning strictly**:
   - PATCH: Bug fixes, typos, small improvements
   - MINOR: New features, enhancements
   - MAJOR: Breaking changes, architectural refactors

5. **Update all three version locations**:
   - `README.md` (header and badge)
   - `CHANGELOG.md` (new entry at top)
   - Module imports (all `?v=X.Y.Z`)

### Cache Busting Strategy

**Problem**: Browsers and CDNs cache JavaScript modules aggressively

**Solution**: Version query parameters on ALL imports

**Example**:
```javascript
// main.js
import { AppState } from './state.js?v=3.1.5';
import * as uiUtils from './ui-utils.js?v=3.1.5';
import * as locationService from './location-service.js?v=3.1.5';
// ... update all imports when version changes
```

**When to Update**: Every time you make a change that needs to be reflected immediately (which is almost always)

### Testing Checklist

Before committing changes:

- [ ] Test on different browsers (Chrome, Firefox, Safari)
- [ ] Test responsive design (mobile, tablet, desktop)
- [ ] Test with different locations (Tokyo, London, New York)
- [ ] Test ISS pass predictions (should show results within 7 days)
- [ ] Test night vision mode toggle
- [ ] Test favorite locations (add, remove, load)
- [ ] Check browser console for errors
- [ ] Verify all charts render correctly
- [ ] Test datetime picker (past, present, future dates)
- [ ] Verify CHANGELOG.md updated
- [ ] Verify version numbers match across all files

### Common Pitfalls

1. **Forgetting version parameters**: Leads to cached old code
2. **Breaking HTML event handlers**: They rely on window scope
3. **Not handling null/undefined**: APIs can fail or return incomplete data
4. **Hardcoding dates**: Use Moment.js for date calculations
5. **Ignoring localStorage limits**: Keep favorite locations ≤ 5
6. **Not respecting API rate limits**: Nominatim is 1 req/sec
7. **Forgetting to update CHANGELOG**: Every release needs documentation

### Debugging Tips

**Browser Console Commands**:
```javascript
// Check AppState
console.log(AppState);

// Check weather data
console.log(AppState.weather.data);

// Check ISS passes
console.log(AppState.iss.calculatedPasses);

// Force weather refresh
fetchWeather();

// Force ISS update
updateISSInfo();
```

**Common Issues**:
- **ISS passes not showing**: Check TLE data loaded (`AppState.iss.tle`)
- **Charts not rendering**: Check Chart.js loaded, data not null
- **Location not updating**: Check geolocation permissions
- **Stale JavaScript**: Clear browser cache, check version parameters

### Performance Considerations

1. **Minimize API calls**:
   - Cache TLE data (24h)
   - Debounce map interactions
   - Reuse weather data for different visualizations

2. **Canvas rendering**:
   - Only redraw sky map when needed
   - Clear intervals on component unmount

3. **Memory leaks**:
   - Clear intervals: `clearInterval(AppState.ui.skymapUpdateInterval)`
   - Destroy charts before recreating: `chart.destroy()`

### Accessibility

**Current State**: Basic accessibility implemented

**Improvements Needed**:
- Add ARIA labels to all interactive elements
- Keyboard navigation for map
- Screen reader support for charts (alt text, data tables)
- High contrast mode support

**Color Blindness**: Night vision mode helps, but consider additional modes

---

## Version History Highlights

### v3.1.5 (2026-01-17)
- ISS sky map real-time update mode
- Pass prediction toggle improvements

### v3.1.3 (2026-01-17)
- Module import version parameters across all files
- ISS orbit calculation timeout and async improvements

### v3.0.0 (2026-01-17) - MAJOR REFACTOR
- Split monolithic `functions.js` into 5 service modules
- Introduced ES Modules architecture
- Centralized state management (`AppState`)
- Maintained 100% backward compatibility

### v2.14.0 (2026-01-17)
- Night observation timeline with cloud cover data
- 4-tier color coding based on cloud density

### v2.12.0 (2026-01-16)
- ISS pass notifications (1-hour advance warning)
- Browser and in-app banner notifications

### v2.11.0 (2026-01-16)
- Astrophotography exposure calculator
- 500 rule + NPF method implementation

### v2.10.0 (2026-01-16)
- Atmospheric transparency and seeing indicators
- Observation-type specific advice

---

## Contact & Support

**Project Repository**: [github.com/Masakai/weather_dashboard](https://github.com/Masakai/weather_dashboard)

**Organization**: 株式会社リバーランズ・コンサルティング

**License**: MIT License

---

## For Future AI Assistants

When working on this project:

1. **Read this file first** before making changes
2. **Understand the module structure** - don't add code to random files
3. **Respect the Japanese language requirements** - commit messages, user-facing text
4. **Test thoroughly** - this is a user-facing application
5. **Document your changes** - update CHANGELOG.md
6. **Version properly** - semantic versioning is not optional
7. **Think about cache** - always update version parameters
8. **Maintain quality** - this is production code used by real stargazers

**Remember**: This application helps people experience the wonder of the night sky. Handle it with care and attention to detail.

---

**Happy coding! 🌟**

*Last updated: 2026-01-17 by Claude (AI Assistant)*
