# ClimateReach — A gentler way there

## Inspiration

Climate-adaptation advice is only useful when people can act on it. An essential journey can be difficult when someone needs frequent rests, must avoid steps, or has little flexibility in their schedule. We wanted a planner that accounts for those requirements instead of assuming the shortest path works for everyone.

## What it does

ClimateReach computes a route around a maximum rest interval, step avoidance, unknown-access exclusions, a detour allowance, and a shade preference. Users can inspect cooling places and simulate a closure; the route changes immediately. When no path satisfies the requirements, the app explains the failure without weakening the constraints.

The app also saves a journey locally, exports a self-contained offline trip card, and preserves a household checklist and source-linked original warning text.

## How we built it

The product uses React, TypeScript, Vinext/Next-compatible components, accessible Radix-based UI primitives, a custom SVG neighborhood map, browser storage, and a service worker. The route engine is a multi-label graph search with Pareto dominance across objective cost, total distance, and distance since a usable rest.

We deliberately avoided adding an ML model without a validated purpose. The main technical challenge is resource-constrained routing, including correctly resetting the rest counter and handling closures, hours, and infeasible paths.

## Validation

The solver is compared with an independent expanded-state reference over 48 cases. Additional checks cover interval violations, refill points without seats, all stops closed, after-hours stops, zero detour, identical endpoints, invalid inputs, and escaped offline HTML. Browser validation covers the central user workflow. See the repository’s validation record for completed checks and limitations.

## Data and limitations

Riverside is a fictional demonstration neighborhood. Path lengths, access labels, hours, and shade fractions are authored fixtures. The app is not a live navigation service, medical tool, or evacuation planner. No real-world accessibility verification, user pilot, or measured environmental outcome is claimed.

The original warning text is supplied by the user and stored as entered with its link; the app does not independently certify that source. General household preparation is separate from current official instructions.

## What we learned

A single shortest-distance label per junction cannot represent rest-interval requirements. We learned to preserve nondominated labels, validate outputs independently, make infeasibility understandable, and distinguish offline availability from current information.

## What is next

Pilot one real neighborhood with verified cooling places and people with mobility needs. Replace synthetic access and shade attributes with documented observations, account for arrival-time opening hours and breaks, and evaluate route usefulness with participants.

## Build disclosure

The Sites/Vinext starter and reusable third-party UI components existed before this work. The ClimateReach-specific route engine, synthetic dataset, interface, closure workflow, offline export, preparation features, tests, and documentation were developed during this session. Review the event’s allowed build dates and your commit history before submitting this disclosure.

## Submission links

- Live demo: https://climatereach.vercel.app
- Source: https://github.com/AryanMashalkar/climatereach

## Submission items still owned by the team

- Upload the under-five-minute video (the local recording predates the district switcher).
- Add genuine user feedback only after obtaining it and permission to quote it.

## Two-district demonstration

Switch from Riverside to North Industrial while keeping the 300 m rest limit. The same engine finds no feasible corridor journey and computes the nearest seated stop at 850 m, a 550 m shortfall. Close that stop and the nearest becomes 1,450 m. Both districts are synthetic. This demonstrates infrastructure gaps without assigning a medical risk score.
