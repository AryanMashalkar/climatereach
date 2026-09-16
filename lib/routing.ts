import {
  nodes,
  edges,
  stops,
  shadeAt,
  stopAvailable,
  type PathEdge,
} from "./neighborhood";
export type Preferences = {
  origin: string;
  destination: string;
  stepFree: boolean;
  excludeUnknown: boolean;
  preferShade: boolean;
  maxRest: number;
  detour: number;
  hour: number;
  speed: number;
  closed: string[];
};
export type Route = {
  nodes: string[];
  edges: PathEdge[];
  distance: number;
  exposed: number;
  shade: number;
  walkingMinutes: number;
  restStops: string[];
  maxLeg: number;
  objective: number;
  explored: number;
};
type Label = {
  node: string;
  distance: number;
  exposed: number;
  sinceRest: number;
  cost: number;
  path: string[];
  used: PathEdge[];
  active: boolean;
};
export const defaultPreferences: Preferences = {
  origin: "n0-2",
  destination: "n5-1",
  stepFree: true,
  excludeUnknown: true,
  preferShade: true,
  maxRest: 300,
  detour: 5,
  hour: 13,
  speed: 60,
  closed: [],
};
function validate(p: Preferences) {
  if (
    !nodes.some((n) => n.id === p.origin) ||
    !nodes.some((n) => n.id === p.destination)
  )
    throw Error("Choose a location inside the demonstration neighborhood.");
  if (
    !Number.isFinite(p.maxRest) ||
    p.maxRest < 0 ||
    !Number.isFinite(p.detour) ||
    p.detour < 0 ||
    p.detour > 60 ||
    !Number.isFinite(p.speed) ||
    p.speed < 20 ||
    p.speed > 150 ||
    !Number.isFinite(p.hour) ||
    p.hour < 0 ||
    p.hour > 23
  )
    throw Error("Route preferences are outside the supported range.");
}
function search(p: Preferences, budget: number): Route | null {
  const restNodes = new Map(
    stops
      .filter(
        (s) =>
          s.seating &&
          stopAvailable(s, p.hour, p.closed) &&
          (!p.stepFree || s.stepFree),
      )
      .map((s) => [s.node, s.id]),
  );
  const initial: Label = {
    node: p.origin,
    distance: 0,
    exposed: 0,
    sinceRest: 0,
    cost: 0,
    path: [p.origin],
    used: [],
    active: true,
  };
  const labels = new Map<string, Label[]>([[p.origin, [initial]]]);
  const queue = [initial];
  let explored = 0;
  while (queue.length) {
    queue.sort((a, b) => a.cost - b.cost || a.distance - b.distance);
    const state = queue.shift()!;
    if (!state.active) continue;
    explored++;
    if (state.node === p.destination) {
      let leg = 0,
        maxLeg = 0;
      const restStops: string[] = [];
      state.used.forEach((e, i) => {
        leg += e.length;
        maxLeg = Math.max(maxLeg, leg);
        const stop = restNodes.get(state.path[i + 1]);
        if (stop && i < state.used.length - 1) {
          restStops.push(stop);
          leg = 0;
        }
      });
      return {
        nodes: state.path,
        edges: state.used,
        distance: state.distance,
        exposed: state.exposed,
        shade: state.distance ? 1 - state.exposed / state.distance : 0,
        walkingMinutes: state.distance / p.speed,
        restStops,
        maxLeg,
        objective: state.cost,
        explored,
      };
    }
    for (const edge of edges) {
      const next =
        edge.from === state.node
          ? edge.to
          : edge.to === state.node
            ? edge.from
            : null;
      if (
        !next ||
        (p.stepFree && edge.steps) ||
        (p.excludeUnknown && edge.access === "unknown")
      )
        continue;
      const distance = state.distance + edge.length,
        leg = state.sinceRest + edge.length;
      if (distance > budget + 1e-8 || (p.maxRest > 0 && leg > p.maxRest + 1e-8))
        continue;
      const exposed = state.exposed + edge.length * (1 - shadeAt(edge, p.hour));
      const cost = distance + (p.preferShade ? 1.5 * exposed : 0);
      const sinceRest = restNodes.has(next) ? 0 : leg;
      const current = labels.get(next) || [];
      if (
        current.some(
          (l) =>
            l.active &&
            l.distance <= distance &&
            l.sinceRest <= sinceRest &&
            l.cost <= cost + 1e-8,
        )
      )
        continue;
      for (const l of current)
        if (
          distance <= l.distance &&
          sinceRest <= l.sinceRest &&
          cost <= l.cost + 1e-8
        )
          l.active = false;
      const candidate: Label = {
        node: next,
        distance,
        exposed,
        sinceRest,
        cost,
        path: [...state.path, next],
        used: [...state.used, edge],
        active: true,
      };
      current.push(candidate);
      labels.set(next, current);
      queue.push(candidate);
    }
  }
  return null;
}
export function planRoute(p: Preferences) {
  validate(p);
  const baseline = search(
    {
      ...p,
      stepFree: false,
      excludeUnknown: false,
      preferShade: false,
      maxRest: 0,
    },
    Infinity,
  );
  const budget = (baseline?.distance || 0) + p.detour * p.speed;
  const route = search(p, budget);
  let reason = "";
  let suggestion = "";
  if (!route) {
    const withoutRest = search({ ...p, maxRest: 0 }, budget);
    const withoutBudget = search({ ...p, preferShade: false }, Infinity);
    if (withoutBudget) {
      reason = "The available route needs a little more time.";
      suggestion = `Allow at least ${Math.ceil((withoutBudget.distance - (baseline?.distance || 0)) / p.speed)} extra walking minutes, or change your stop preferences.`;
    } else if (withoutRest) {
      reason = "There is no route with rests this close together.";
      suggestion =
        "Increase the distance between rests or reopen a suitable stop. We have not relaxed your requirements.";
    } else {
      reason = "No route meets the current access requirements.";
      suggestion =
        "Try a different destination or review unknown segments. Unknown access is not confirmed access.";
    }
  }
  return { route, baseline, budget, reason, suggestion };
}
export function validateRoute(route: Route, p: Preferences, budget: number) {
  let distance = 0,
    leg = 0;
  const available = new Set(
    stops
      .filter(
        (s) =>
          s.seating &&
          stopAvailable(s, p.hour, p.closed) &&
          (!p.stepFree || s.stepFree),
      )
      .map((s) => s.node),
  );
  const issues: string[] = [];
  if (route.nodes[0] !== p.origin || route.nodes.at(-1) !== p.destination)
    issues.push("Wrong endpoints");
  route.edges.forEach((e, i) => {
    const a = route.nodes[i],
      b = route.nodes[i + 1];
    if (!((e.from === a && e.to === b) || (e.to === a && e.from === b)))
      issues.push("Disconnected segment");
    if (p.stepFree && e.steps) issues.push("Steps");
    if (p.excludeUnknown && e.access === "unknown")
      issues.push("Unknown access");
    distance += e.length;
    leg += e.length;
    if (p.maxRest > 0 && leg > p.maxRest) issues.push("Rest interval exceeded");
    if (available.has(b)) leg = 0;
  });
  if (distance > budget + 1e-8) issues.push("Detour exceeded");
  return issues;
}
