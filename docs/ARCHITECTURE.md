# Architecture and correctness

## Product boundary

Two working, explicitly synthetic districts. No API key, external basemap, model server, or network request is needed to compute a route. This gives the demo deterministic behavior and makes offline use possible. A real pilot requires replacement data and independent accessibility review.

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

## District switching (implemented)

`lib/districts.ts` supplies a graph to the same search, validator, map, stop directory and offline exporter. Riverside has 24 nodes and 38 edges. North Industrial has 10 nodes and 9 edges: the first seated stop is 850 m from its default origin; subsequent seated stops are 600 m apart. These are authored network distances, not geographic measurements.

Switching resets endpoints to district defaults and clears district-specific closures, while preserving rest interval, access requirements, shade preference, detour, hour and speed. Saved plans carry the district ID and data version; old Riverside snapshots without a district ID remain supported. Rest-gap diagnosis searches the eligible network to each available seated stop, with rest and detour limits removed only for this diagnostic. It reports the minimum distance; it never offers that diagnostic path as a feasible journey. Origin stops are excluded from this next-rest calculation. A nearby stop does not establish a complete feasible route.

## Future integration: Overpass acquisition (not shipped)

This bounded example fetches candidate pedestrian ways, buildings and amenities around central Pune. It has not been run or validated as a routable district. Bounding-box order is south, west, north, east. Syntax reference: [Overpass QL](https://wiki.openstreetmap.org/wiki/Overpass_API/Overpass_QL).

```overpass
[out:json][timeout:25][bbox:18.515,73.845,18.525,73.860];
(
  way[highway~"^(footway|pedestrian|path|steps|living_street|residential|service)$"];
  nwr[amenity~"^(bench|drinking_water|library|community_centre)$"];
  way[building];
  relation[building];
);
out body;
>;
out skel qt;
```

A future importer must retain OSM IDs, timestamps and attribution; assemble relation geometry; split ways at actual shared nodes; respect levels, crossings, legal access and direction; calculate metric lengths; and record missing tags as unknown. A bench tag is a candidate for review, not verified availability. Review major-road sidewalks, missing crossings and disconnected components before routing. Cache a reviewed snapshot instead of requesting Overpass during a demonstration.

## Future integration: SunCalc shadow geometry (not shipped)

Pin `suncalc@1.9.0` for the convention below: altitude and azimuth are radians, with azimuth measured from south toward west. [Version 1.9.0 reference](https://github.com/mourner/suncalc/blob/v1.9.0/README.md). Do not silently upgrade: other versions may use different conventions.

For a vertical building of height H on flat ground, solar altitude a gives horizontal shadow length L = H / tan(a). With that version's azimuth z, the shadow displacement in a local east/north metric coordinate system is `(L sin(z), L cos(z))`. This is a geometric derivation under the flat-ground assumption, not a temperature model.

```ts
const { altitude: a, azimuth: z } = SunCalc.getPosition(
  instant,
  latitude,
  longitude,
);
if (a <= (5 * Math.PI) / 180 || !Number.isFinite(heightMetres)) {
  return { status: "unknown" }; // low sun/night or missing height
}
const L = heightMetres / Math.tan(a);
const shadowOffset = { east: L * Math.sin(z), north: L * Math.cos(z) };
```

Project building footprints into local metric coordinates, sweep each footprint along the displacement, union the resulting shadow polygons, and intersect that union with pedestrian segment geometry. Divide the covered length by total segment length, without double-counting overlapping shadows. Validate cardinal-direction examples and field observations at declared times. Missing heights, terrain, trees, cloud cover, seasons and position uncertainty prevent a claim of observed shade. Current ClimateReach uses authored shade fractions; no SunCalc or Overpass integration runs in the app.
