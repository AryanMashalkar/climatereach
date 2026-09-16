import { buildSync } from "esbuild";
import { createRequire } from "node:module";
import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
mkdirSync("work", { recursive: true });
buildSync({
  entryPoints: ["lib/routing.ts"],
  bundle: true,
  platform: "node",
  format: "cjs",
  outfile: "work/routing.cjs",
});
buildSync({
  entryPoints: ["lib/neighborhood.ts"],
  bundle: true,
  platform: "node",
  format: "cjs",
  outfile: "work/neighborhood.cjs",
});
buildSync({
  entryPoints: ["lib/offline.ts"],
  bundle: true,
  platform: "node",
  format: "cjs",
  outfile: "work/offline.cjs",
});
const require = createRequire(import.meta.url);
const {
  planRoute,
  defaultPreferences: defaults,
  validateRoute,
} = require("../work/routing.cjs");
const {
  edges,
  stops,
  shadeAt,
  stopAvailable,
  destinations,
} = require("../work/neighborhood.cjs");
const { offlineHTML } = require("../work/offline.cjs");
const checks = [];
function test(name, fn) {
  fn();
  checks.push(name);
  console.log("PASS", name);
}
test("Default route satisfies independent constraints", () => {
  const r = planRoute(defaults);
  assert.ok(r.route);
  assert.deepEqual(validateRoute(r.route, defaults, r.budget), []);
  assert.ok(r.route.maxLeg <= 300);
});
test("Impossible rest interval returns explicit failure", () => {
  const r = planRoute({ ...defaults, maxRest: 150 });
  assert.equal(r.route, null);
  assert.match(r.reason, /rest/i);
});
test("Closing a stop changes the feasible route without relaxing preferences", () => {
  const p = { ...defaults };
  const before = planRoute(p);
  const after = planRoute({ ...p, closed: ["cedar"] });
  assert.ok(before.route);
  assert.ok(after.route);
  assert.notDeepEqual(before.route.nodes, after.route.nodes);
  assert.ok(!after.route.restStops.includes("cedar"));
  assert.deepEqual(
    validateRoute(after.route, { ...p, closed: ["cedar"] }, after.budget),
    [],
  );
});
test("All stops closed never silently relaxes rest limit", () => {
  assert.equal(
    planRoute({ ...defaults, closed: stops.map((s) => s.id) }).route,
    null,
  );
});
test("Refill-only point cannot reset rest distance", () => {
  const p = {
    ...defaults,
    maxRest: 300,
    closed: stops.filter((s) => s.seating).map((s) => s.id),
  };
  assert.equal(planRoute(p).route, null);
});
test("Zero detour is enforced", () => {
  const p = { ...defaults, detour: 0 };
  const r = planRoute(p);
  assert.ok(!r.route || r.route.distance <= r.baseline.distance);
});
test("Arrival at starting point is valid zero-distance route", () => {
  const r = planRoute({ ...defaults, destination: defaults.origin });
  assert.equal(r.route.distance, 0);
  assert.equal(r.route.maxLeg, 0);
});
test("After-hours closures exclude library rest stops", () => {
  const r = planRoute({ ...defaults, hour: 19, maxRest: 600 });
  assert.ok(r.route);
  assert.ok(!r.route.restStops.includes("fern"));
  assert.ok(!r.route.restStops.includes("cedar"));
});
test("Invalid inputs rejected", () => {
  assert.throws(() => planRoute({ ...defaults, origin: "missing" }));
  assert.throws(() => planRoute({ ...defaults, speed: 0 }));
  assert.throws(() => planRoute({ ...defaults, detour: -1 }));
});
// Independent finite expanded-state DP. No Pareto pruning. Every edge length is
// a multiple of five; each total-distance layer is visited in ascending order.
function reference(p, budget) {
  const layers = Array.from(
    { length: Math.floor(budget / 5) + 1 },
    () => new Map(),
  );
  const rests = new Set(
    stops
      .filter(
        (s) =>
          s.seating &&
          stopAvailable(s, p.hour, p.closed) &&
          (!p.stepFree || s.stepFree),
      )
      .map((s) => s.node),
  );
  layers[0].set(p.origin + "|0", 0);
  let best = Infinity;
  for (let di = 0; di < layers.length; di++)
    for (const [key, cost] of layers[di]) {
      const [node, restText] = key.split("|");
      const since = Number(restText);
      if (node === p.destination) best = Math.min(best, cost);
      for (const e of edges) {
        const next = e.from === node ? e.to : e.to === node ? e.from : null;
        if (
          !next ||
          (p.stepFree && e.steps) ||
          (p.excludeUnknown && e.access === "unknown")
        )
          continue;
        const nd = di + e.length / 5,
          leg = since + e.length;
        if (nd >= layers.length || (p.maxRest > 0 && leg > p.maxRest)) continue;
        const k = next + "|" + (rests.has(next) ? 0 : leg);
        const nc =
          cost +
          e.length +
          (p.preferShade ? 1.5 * e.length * (1 - shadeAt(e, p.hour)) : 0);
        if (nc < (layers[nd].get(k) ?? Infinity)) layers[nd].set(k, nc);
      }
    }
  return best;
}
test("Pareto solver matches independent expanded-state oracle on 48 cases", () => {
  for (let i = 0; i < 48; i++) {
    const p = {
      ...defaults,
      origin: destinations[i % 5].id,
      destination: destinations[(i + 1) % 5].id,
      maxRest: [150, 275, 300, 400, 600, 0][i % 6],
      detour: i % 7,
      stepFree: i % 3 !== 0,
      excludeUnknown: i % 4 !== 0,
      preferShade: i % 2 === 0,
      hour: [9, 13, 17, 19][i % 4],
      closed: i % 3 === 0 ? ["willow"] : [],
    };
    const r = planRoute(p),
      expected = reference(p, r.budget);
    if (Number.isFinite(expected)) {
      assert.ok(r.route, `missing route case ${i}`);
      assert.ok(
        Math.abs(r.route.objective - expected) < 1e-6,
        `non-optimal case ${i}`,
      );
      assert.deepEqual(validateRoute(r.route, p, r.budget), []);
    } else assert.equal(r.route, null, `unexpected route case ${i}`);
  }
});
test("Offline card escapes arbitrary checklist content", () => {
  const r = planRoute(defaults);
  const html = offlineHTML({
    version: "test",
    savedAt: new Date().toISOString(),
    preferences: defaults,
    route: r.route,
    checklist: ["<script>alert(1)</script>"],
  });
  assert.ok(html.includes("&lt;script&gt;"));
  assert.ok(!html.includes("<script>alert"));
  assert.ok(html.includes("Fictional demonstration"));
});
// A separate graph must drive both diagnosis and route validation.
buildSync({
  entryPoints: ["lib/districts.ts"],
  bundle: true,
  platform: "node",
  format: "cjs",
  outfile: "work/districts.cjs",
});
const { getDistrict } = require("../work/districts.cjs");
const north = getDistrict("north-industrial");
const np = { ...defaults, origin: "north-0", destination: "north-9" };
test("Sparse district computes 850m first rest and 550m shortfall", () => {
  const r = planRoute(np, north);
  assert.equal(r.route, null);
  assert.equal(r.nearestRest.distance, 850);
  assert.match(r.suggestion, /550 m beyond/);
});
test("Nearest rest changes with closures and opening hours", () => {
  assert.equal(
    planRoute({ ...np, closed: ["north-rest-3"] }, north).nearestRest.distance,
    1450,
  );
  assert.equal(planRoute({ ...np, hour: 19 }, north).nearestRest, null);
});
test("Sparse district can produce a feasible shorter journey", () => {
  const p = { ...np, origin: "north-3", destination: "north-5", maxRest: 600 };
  const r = planRoute(p, north);
  assert.equal(r.route.distance, 600);
  assert.deepEqual(validateRoute(r.route, p, r.budget, north), []);
  const card = offlineHTML({
    districtId: north.id,
    version: north.dataVersion,
    savedAt: new Date().toISOString(),
    preferences: p,
    route: r.route,
    checklist: [],
  });
  assert.match(card, /North Industrial/);
  assert.match(card, /Workers’ rest shelter/);
  assert.ok(!card.includes("Cedar"));
});
test("District graphs remain isolated", () => {
  assert.throws(() => planRoute(defaults, north));
  assert.ok(planRoute(defaults).route);
  assert.equal(
    planRoute({ ...np, closed: ["cedar"] }, north).nearestRest.distance,
    850,
  );
});

const timings = [];
for (let i = 0; i < 100; i++) {
  const t = performance.now();
  planRoute(defaults);
  timings.push(performance.now() - t);
}
timings.sort((a, b) => a - b);
const report = {
  passed: checks.length,
  checks,
  oracleCases: 48,
  benchmark: {
    samples: 100,
    p50ms: timings[49],
    p95ms: timings[94],
    runtime: process.version,
    platform: process.platform,
    scope:
      "Default fixture on this machine; not a device-wide performance guarantee",
  },
};
writeFileSync("work/test-report.json", JSON.stringify(report, null, 2));
console.log(JSON.stringify(report.benchmark));
