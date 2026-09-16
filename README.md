# ClimateReach

**A gentler way there.** A climate-adaptation journey planner that accounts for shade, steps, rest intervals, and available cooling places.

Built for NextStep Hacks 2026 / Earth Forward. This repository contains a working application and a deterministic route engine, not a set of screen mockups.

## Try the core experience

1. Open the planner. The default example runs from Riverside apartments to the community health centre.
2. Inspect the green personal route against the dashed unconstrained shortest route.
3. Click Cedar community room and choose **Mark unavailable & recalculate**. The route goes through the northern rest stops while keeping the same 300 m rest limit.
4. Set the maximum rest distance to 150 m. The planner explains why no feasible route exists; it does not silently relax the constraint.
5. Restore the example, save the journey, and download the standalone HTML trip card.
6. Open My preparedness, tick a checklist item, and preserve a source-linked warning as entered. Refresh to confirm local persistence.

The **Try the story** button walks through these route scenarios using the same planner state and engine as the controls.

## Important data boundary

Riverside is a **fictional demonstration neighborhood**. Its geometry, distances, opening hours, access labels, and three shade time windows are authored fixtures. No location is field verified. The map does not use live weather, medical predictions, satellite-derived shade, or live emergency warnings.

The route engine is real: changing inputs computes a new constrained path. The data is synthetic: a route on this map is not suitable for real-world navigation. “No steps” does not establish wheelchair accessibility; gradients, curb ramps, surface quality, crossings, and doorway widths are not modeled.

## Run locally

Requires Node.js 22.13+ (tested with Node 24) and npm.

```sh
npm ci
npm run dev
```

Open http://localhost:5173. On Windows, `start-climatereach.cmd` runs the installed project. If an npm shell shim is broken, invoke the installed npm CLI directly with Node; this is an environment problem rather than an application dependency.

```sh
npm test
npm run typecheck
npm run build
npm start
```

The production start command uses Wrangler and the compiled Cloudflare Worker. The repository retains the Sites/Vinext deployment configuration. `next.config.ts` and standard React components also keep the source familiar to Next.js developers.

## What works

- Multi-label route search with hard rest-distance, step, unknown-access, and detour constraints.
- Distance-weighted shade preference over three explicitly illustrative time windows.
- Cooling stop hours, seating, water, and local closure simulation.
- Unconstrained shortest-path baseline and per-segment route explanations.
- Independent validation and downloadable JSON evidence, including measured local calculation time.
- Responsive, keyboard-operable controls, dialogs, and map markers.
- Two movement profiles, adjustable preferences, endpoint selection, and endpoint swap.
- Save/restore a journey on this device; download a standalone printable HTML trip card.
- Service-worker shell and asset caching for offline use after installation.
- Household checklist, read-aloud where supported, and source-linked original warning storage.
- Four-step interactive demonstration story.
- Optional feature-detected WebMCP tools for reading the route and configuring the rest interval.

## Structure

```text
app/
  page.tsx                   Product flows and shared UI state
  globals.css                Responsive visual system
  layout.tsx                 Metadata and page shell
components/
  neighborhood-map.tsx       Interactive SVG schematic and route overlays
  warning-note.tsx           Source-preserving local warning note
  ui/                       Accessible component primitives
lib/
  neighborhood.ts            Typed demonstration graph and provenance
  routing.ts                 Pareto-label route solver and validator
  offline.ts                 Escaped, self-contained trip-card export
public/
  sw.js                      Offline shell and asset caching
  favicon.svg                ClimateReach identity
scripts/
  test-routing.mjs           Tests and independent expanded-state oracle
docs/
  ARCHITECTURE.md             Algorithm, limits, and real-data migration
  DEMO_SCRIPT.md              Four-minute recording plan
  DEVPOST.md                  Submission draft with honest scope
  VALIDATION.md               Recorded validation and remaining checks
```

## Privacy and reliability

Preferences, saved journeys, checklists, closure simulations, and pasted warning text stay in this browser’s local storage. There is no application analytics pipeline, account system, or warning-text upload. External links open only when clicked; hosting infrastructure can still process normal request metadata.

The offline card contains no external assets. The service worker additionally caches the app shell and loaded same-origin resources. An installation or browser-storage restriction can prevent offline caching; the UI does not claim readiness until the asset-cache handshake succeeds. Saved warnings are snapshots, not current alerts.

## Submission readiness

The code and recording script are ready locally. Before submitting, publish a public repository, make sure the hosted demo can be opened by judges, record the video, and add any genuine user feedback. Do not claim real-world access verification or a completed pilot without doing that work.

The original template and reusable UI primitives predate this project. The ClimateReach application, fixture, algorithm, tests, export, story, and documentation were authored in this work session. See `docs/DEVPOST.md` for the disclosure language.

## Two-district demonstration

Switch from Riverside to North Industrial while keeping the 300 m rest limit. The same engine finds no feasible corridor journey and computes the nearest seated stop at 850 m, a 550 m shortfall. Close that stop and the nearest becomes 1,450 m. Both districts are synthetic. This demonstrates infrastructure gaps without assigning a medical risk score.
