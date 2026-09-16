export type Place = { id: string; name: string; x: number; y: number };
export type PathEdge = {
  id: string;
  from: string;
  to: string;
  length: number;
  steps: boolean;
  access: "documented" | "unknown";
  shade: [number, number, number];
  street: string;
};
export type CoolingStop = {
  id: string;
  node: string;
  name: string;
  kind: "garden" | "library" | "water" | "cafe";
  description: string;
  seating: boolean;
  water: boolean;
  stepFree: boolean;
  hours: string;
  openFrom: number;
  openTo: number;
};
export const DATA_VERSION = "riverside-fixture-1.0";
export const nodes: Place[] = Array.from({ length: 24 }, (_, i) => {
  const c = i % 6,
    r = Math.floor(i / 6);
  return {
    id: `n${c}-${r}`,
    name: `Junction ${c + 1}.${r + 1}`,
    x: 130 + c * 140,
    y: 135 + r * 125,
  };
});
export const nodeById = Object.fromEntries(nodes.map((n) => [n.id, n]));
export const destinations = [
  { id: "n0-2", name: "Riverside apartments", detail: "Home · west entrance" },
  {
    id: "n5-1",
    name: "Community health centre",
    detail: "Clinic · main entrance",
  },
  { id: "n4-3", name: "Market square", detail: "Daily essentials" },
  { id: "n2-0", name: "Fern House library", detail: "Library · cooling space" },
  { id: "n5-3", name: "Eastbank transit stop", detail: "Public transport" },
];
export const edges: PathEdge[] = [];
for (let r = 0; r < 4; r++)
  for (let c = 0; c < 6; c++) {
    if (c < 5)
      edges.push({
        id: `h${c}-${r}`,
        from: `n${c}-${r}`,
        to: `n${c + 1}-${r}`,
        length: r === 1 ? 145 : 140,
        steps: r === 2 && c === 2,
        access: r === 3 && c === 1 ? "unknown" : "documented",
        shade:
          r === 1
            ? [0.8, 0.72, 0.84]
            : r === 0
              ? [0.65, 0.48, 0.7]
              : r === 2
                ? [0.3, 0.14, 0.4]
                : [0.38, 0.24, 0.55],
        street: [
          "Fern Lane",
          "Canopy Walk",
          "Riverside Avenue",
          "Market Street",
        ][r],
      });
    if (r < 3)
      edges.push({
        id: `v${c}-${r}`,
        from: `n${c}-${r}`,
        to: `n${c}-${r + 1}`,
        length: 125,
        steps: c === 4 && r === 0,
        access: c === 3 && r === 2 ? "unknown" : "documented",
        shade: c === 1 || c === 4 ? [0.7, 0.62, 0.75] : [0.3, 0.2, 0.52],
        street: [
          "Willow Street",
          "Garden Passage",
          "Library Street",
          "Cedar Street",
          "Olive Passage",
          "Eastbank Road",
        ][c],
      });
  }
export const stops: CoolingStop[] = [
  {
    id: "terrace",
    node: "n3-0",
    name: "Fern Lane terrace",
    kind: "garden",
    description:
      "A seated pause on the quieter northern path, providing an alternative when Canopy Walk stops are unavailable.",
    seating: true,
    water: false,
    stepFree: true,
    hours: "07:00–20:00",
    openFrom: 7,
    openTo: 20,
  },
  {
    id: "market-bench",
    node: "n4-2",
    name: "Olive Passage bench",
    kind: "garden",
    description:
      "A shaded bench on the passage between the health centre and market square.",
    seating: true,
    water: false,
    stepFree: true,
    hours: "Always open",
    openFrom: 0,
    openTo: 24,
  },
  {
    id: "willow",
    node: "n1-1",
    name: "Willow pocket garden",
    kind: "garden",
    description:
      "A quiet planted courtyard with benches under a broad tree canopy.",
    seating: true,
    water: false,
    stepFree: true,
    hours: "07:00–20:00",
    openFrom: 7,
    openTo: 20,
  },
  {
    id: "fern",
    node: "n2-0",
    name: "Fern House library",
    kind: "library",
    description:
      "An indoor place to pause, with seating and a drinking-water refill point.",
    seating: true,
    water: true,
    stepFree: true,
    hours: "09:00–18:00",
    openFrom: 9,
    openTo: 18,
  },
  {
    id: "cedar",
    node: "n3-1",
    name: "Cedar community room",
    kind: "library",
    description:
      "A community space beside Canopy Walk with seating and drinking water.",
    seating: true,
    water: true,
    stepFree: true,
    hours: "08:00–19:00",
    openFrom: 8,
    openTo: 19,
  },
  {
    id: "olive",
    node: "n4-1",
    name: "Olive courtyard",
    kind: "garden",
    description:
      "A sheltered bench beneath the courtyard pergola, near the health centre.",
    seating: true,
    water: false,
    stepFree: true,
    hours: "06:00–21:00",
    openFrom: 6,
    openTo: 21,
  },
  {
    id: "fountain",
    node: "n2-2",
    name: "Riverside refill point",
    kind: "water",
    description:
      "A drinking-water point. There is no seating here, so it does not reset your rest interval.",
    seating: false,
    water: true,
    stepFree: true,
    hours: "Always open",
    openFrom: 0,
    openTo: 24,
  },
  {
    id: "market",
    node: "n4-3",
    name: "Market community table",
    kind: "cafe",
    description:
      "Outdoor seating beside the market stalls. Water is available during market hours.",
    seating: true,
    water: true,
    stepFree: true,
    hours: "08:00–17:00",
    openFrom: 8,
    openTo: 17,
  },
  {
    id: "quay",
    node: "n1-3",
    name: "Quay steps terrace",
    kind: "garden",
    description:
      "A riverside seating terrace reached by steps. Excluded as a rest stop in step-free mode.",
    seating: true,
    water: false,
    stepFree: false,
    hours: "Always open",
    openFrom: 0,
    openTo: 24,
  },
  {
    id: "clinic",
    node: "n5-1",
    name: "Health centre lobby",
    kind: "library",
    description:
      "Seating and water at your destination during the centre’s opening hours.",
    seating: true,
    water: true,
    stepFree: true,
    hours: "08:00–18:00",
    openFrom: 8,
    openTo: 18,
  },
];
export function shadeAt(edge: PathEdge, hour: number) {
  return edge.shade[hour < 12 ? 0 : hour < 16 ? 1 : 2];
}
export function stopAvailable(
  stop: CoolingStop,
  hour: number,
  closed: string[],
) {
  return (
    !closed.includes(stop.id) && hour >= stop.openFrom && hour < stop.openTo
  );
}
