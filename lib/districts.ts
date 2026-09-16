import * as riverside from "./neighborhood";
import type { Place, PathEdge, CoolingStop } from "./neighborhood";
export type District = {
  id: string;
  name: string;
  description: string;
  dataVersion: string;
  nodes: Place[];
  nodeById: Record<string, Place>;
  edges: PathEdge[];
  stops: CoolingStop[];
  destinations: { id: string; name: string; detail: string }[];
};
const nodes: Place[] = Array.from({ length: 10 }, (_, i) => ({
  id: `north-${i}`,
  name: `Corridor junction ${i + 1}`,
  x: 120 + (i % 5) * 190,
  y: i < 5 ? 260 : 440,
}));
const edges: PathEdge[] = [];
for (let i = 0; i < 9; i++)
  edges.push({
    id: `north-edge-${i}`,
    from: `north-${i}`,
    to: `north-${i + 1}`,
    length: [250, 300, 300, 300, 300, 300, 300, 300, 300][i],
    steps: false,
    access: "documented",
    shade: [0.2, 0.08, 0.25],
    street: "North Industrial corridor",
  });
// Fold the schematic back west along the second row; edge lengths are authoritative.
nodes.slice(5).forEach((n, i) => {
  n.x = 880 - i * 190;
});
const stops: CoolingStop[] = [3, 5, 7, 9].map((i, j) => ({
  id: `north-rest-${i}`,
  node: `north-${i}`,
  name: [
    "Depot community room",
    "Workers’ rest shelter",
    "Northside library",
    "Corridor health centre",
  ][j],
  kind: j === 1 ? "garden" : "library",
  description:
    "Authored sparse-stop scenario. Seating and opening hours are synthetic, not field verified.",
  seating: true,
  water: true,
  stepFree: true,
  hours: "08:00–18:00",
  openFrom: 8,
  openTo: 18,
}));
export const districts: District[] = [
  {
    id: "riverside",
    name: "Riverside",
    description: "Walkable district · closely spaced stops",
    dataVersion: riverside.DATA_VERSION,
    ...{
      nodes: riverside.nodes,
      nodeById: riverside.nodeById,
      edges: riverside.edges,
      stops: riverside.stops,
      destinations: riverside.destinations,
    },
  },
  {
    id: "north-industrial",
    name: "North Industrial",
    description: "Suburban corridor · sparse stops",
    dataVersion: "north-industrial-fixture-1.0",
    nodes,
    nodeById: Object.fromEntries(nodes.map((n) => [n.id, n])),
    edges,
    stops,
    destinations: [
      {
        id: "north-0",
        name: "Workers’ apartments",
        detail: "Home · corridor entrance",
      },
      {
        id: "north-9",
        name: "Corridor health centre",
        detail: "Essential appointment",
      },
      {
        id: "north-3",
        name: "Depot community room",
        detail: "First seated stop",
      },
      { id: "north-5", name: "Workers’ rest shelter", detail: "Seated stop" },
    ],
  },
];
export function getDistrict(id = "riverside"): District {
  const district = districts.find((d) => d.id === id);
  if (!district) throw Error("Unknown demonstration district");
  return district;
}
