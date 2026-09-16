# Architecture and correctness

## Product boundary

One working, explicitly synthetic district. No API key, external basemap, model server, or network request is needed to compute a route. This gives the demo deterministic behavior and makes offline use possible. A real pilot requires replacement data and independent accessibility review.

## Pipeline

```text
Typed graph + scenario stop directory
                  ↓
Profile, endpoints, departure hour, local closures
                  ↓
Unconstrained shortest route → distance budget
                  ↓
Multi-label search with rest state and Pareto pruning
                  ↓
Independent route validation
                  ↓
SVG overlay + metrics + segment instructions
                  ↓
Local snapshot / evidence JSON / standalone HTML
```

## Search state

Each label stores node, total length, unshaded length, length since a usable rest, objective cost, and its path. The frontier is ordered by nonnegative objective cost:

`cost = distance + (preferShade ? 1.5 × unshadedDistance : 0)`

The coefficient 1.5 is an explicit product preference weight, not a physiological parameter. Shade is an authored fraction at the selected time window. Estimated shaded fraction is `1 - unshadedDistance / distance`.

Hard constraints are checked before an edge is accepted:

1. Exclude steps when requested.
2. Exclude unknown-access edges when requested.
3. Reject arrival past the maximum rest interval **before** resetting the rest counter.
4. Reject total length past `shortestUnconstrainedLength + extraMinutes × movementSpeed`.

A rest counter resets only at an open, non-closed stop with seating and compatible step access. Water alone does not reset it. Start and destination are not counted as intermediate rests.

At the same node, a label is dominated only if another has no greater objective, no greater total distance, and no greater distance since rest. Keeping total distance in this comparison is necessary because the detour budget is a separate hard constraint. Labels are not collapsed to one distance per node.

All edge costs are positive. Dominance removes redundant cycles; the finite fixture and bounded route budget keep searches small. The queue is sorted for clarity rather than using a heap; a heap and indexed adjacency would be appropriate for large graphs.

## Independent validation

The route validator checks endpoint identity, consecutive edge connectivity, steps, unknown access, each rest leg, and the detour bound. Tests compare the optimized search with an independent distance-layer dynamic program over 48 configurations. The reference explores `(node, total distance, distance since rest)` without Pareto pruning. The 5 m distance discretization is exact for this fixture because every edge length is a multiple of five.

## Availability and timing

- Hours and shade are held fixed at departure time across the trip.
- Profile speeds are 60 or 80 m/min; these are scenario settings, not estimates of an individual’s capability.
- Moving-time comparisons exclude time resting.
- Closure controls change local scenario state only.
- Unknown geometry cannot be inferred from the absence of a recorded barrier.

## Offline behavior

The service worker caches the root and favicon on installation. The client sends loaded same-origin resources over a MessageChannel; readiness is reported only after all requested assets cache successfully. Navigation is network-first with a saved-shell fallback. Same-origin scripts, styles, images and fonts are cache-first; hashed production assets avoid version confusion. Cache version changes clear previous ClimateReach shell caches.

Saved route data is versioned. The printable offline HTML is escaped and self-contained. Warning URLs are restricted to HTTPS without embedded credentials and are never server-fetched. Warning text is preserved, not interpreted or summarized. Local-storage failure is surfaced to the user.

## Real neighborhood migration

Before replacing the fixture:

1. Obtain licensed pedestrian geometry and its attribution requirements.
2. Measure segment distances from coordinates rather than the schematic.
3. Audit steps, crossing conditions, curb ramps, surface quality, widths, and gradients with local users.
4. Verify seating, drinking water, entrance access, permissions, and opening hours.
5. Record a reviewer and observation date for each attribute, including unknowns.
6. Measure shade for declared time windows or implement a documented shadow model with uncertainty.
7. Extend availability to predicted arrival times and account for break duration.
8. Run route audits with people who have the intended mobility requirements before any navigation claim.

Do not relabel this fixture as real OSM data or field-verified information.
