"use client";
import { useState } from "react";
import { Plus, Minus, LocateFixed, Layers } from "lucide-react";
import {
  nodeById,
  edges,
  stops,
  stopAvailable,
  shadeAt,
} from "@/lib/neighborhood";
import { getDistrict, type District } from "@/lib/districts";
import type { Route, Preferences } from "@/lib/routing";
export default function NeighborhoodMap({
  district = getDistrict(),
  route,
  baseline,
  selected,
  onSelect,
  preferences: p,
}: {
  district?: District;
  route: Route | null;
  baseline: Route | null;
  selected: string | null;
  onSelect: (id: string) => void;
  preferences: Preferences;
}) {
  const { nodeById, edges, stops } = district;
  const north = district.id === "north-industrial";
  const [zoom, setZoom] = useState(1);
  const [shade, setShade] = useState(true);
  const points = (r: Route) =>
    r.nodes.map((id) => `${nodeById[id].x},${nodeById[id].y}`).join(" ");
  return (
    <>
      <svg
        className="neighborhood-svg"
        viewBox="0 0 1040 650"
        aria-label={`Interactive schematic map of fictional ${district.name} district`}
      >
        <defs>
          <pattern
            id="ground"
            width="24"
            height="24"
            patternUnits="userSpaceOnUse"
          >
            <rect width="24" height="24" fill="#edece4" />
            <circle cx="2" cy="2" r=".5" fill="#c8ccbf" />
          </pattern>
          <pattern
            id="water"
            width="30"
            height="24"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M0 12 Q8 7 15 12 T30 12"
              stroke="#a7c9c5"
              strokeWidth="1"
              fill="none"
            />
          </pattern>
          <filter id="pin-shadow">
            <feDropShadow
              dx="0"
              dy="3"
              stdDeviation="5"
              floodColor="#263c2a"
              floodOpacity=".2"
            />
          </filter>
        </defs>
        <rect width="1040" height="650" fill="url(#ground)" />
        <g
          transform={`translate(${520 * (1 - zoom)} ${325 * (1 - zoom)}) scale(${zoom})`}
        >
          {!north && (
            <>
              <path
                d="M -50 540 C180 555 260 600 460 555 S810 570 1110 490 L1110 750 L-50 750Z"
                fill="#c0d9d5"
              />
              <path
                d="M -50 540 C180 555 260 600 460 555 S810 570 1110 490 L1110 750 L-50 750Z"
                fill="url(#water)"
              />
              <path
                d="M-20 525 C200 540 270 585 460 540 S830 550 1080 475"
                fill="none"
                stroke="#d6d4c3"
                strokeWidth="8"
              />
              <text
                x="550"
                y="610"
                className="river-label"
                transform="rotate(-5 550 610)"
              >
                R I V E R W I L L O W
              </text>
              <rect
                x="280"
                y="158"
                width="245"
                height="78"
                rx="28"
                fill="#d1dfc1"
              />
              <rect
                x="280"
                y="158"
                width="245"
                height="78"
                rx="28"
                fill="none"
                stroke="#bfcca9"
                strokeDasharray="3 4"
              />
              <text x="402" y="202" className="park-label">
                WILLOW GARDENS
              </text>
              <path d="M550 150h118v82H550z" fill="#dce5ce" />
              <path d="M15 80h75v370H15z" fill="#dde5d3" />
              {Array.from({ length: 15 }, (_, i) => {
                const c = i % 5,
                  r = Math.floor(i / 5);
                return (
                  <g
                    key={i}
                    transform={`translate(${151 + c * 140} ${152 + r * 125})`}
                  >
                    {!(r === 0 && (c === 1 || c === 2)) && (
                      <>
                        <rect
                          x="3"
                          y="4"
                          width="92"
                          height="75"
                          rx="5"
                          fill="#d1cec4"
                        />
                        <rect
                          width="92"
                          height="75"
                          rx="5"
                          fill={i % 4 === 0 ? "#d6d7ca" : "#e1ded4"}
                          stroke="#cfcec1"
                        />
                        <path
                          d="M10 8H83V30H10z M10 40H40V65H10z M49 40H83V65H49z"
                          fill="#eae7de"
                          stroke="#d4d2c7"
                          strokeWidth=".6"
                        />
                      </>
                    )}
                  </g>
                );
              })}
            </>
          )}
          {north && (
            <g>
              <text x="520" y="125" textAnchor="middle" className="river-label">
                NORTH INDUSTRIAL CORRIDOR
              </text>
              <text x="520" y="165" textAnchor="middle" className="place-label">
                Same needs. Fewer places to pause.
              </text>
              {[0, 1, 2, 3].map((i) => (
                <rect
                  key={i}
                  x={155 + i * 190}
                  y="305"
                  width="115"
                  height="90"
                  rx="5"
                  fill="#dad5c9"
                  stroke="#c8c1b1"
                />
              ))}
            </g>
          )}
          {edges.map((e) => {
            const a = nodeById[e.from],
              b = nodeById[e.to];
            return (
              <g key={e.id}>
                <line
                  x1={a.x}
                  y1={a.y}
                  x2={b.x}
                  y2={b.y}
                  stroke="#d7d5ca"
                  strokeWidth="25"
                />
                <line
                  x1={a.x}
                  y1={a.y}
                  x2={b.x}
                  y2={b.y}
                  stroke="#faf9f2"
                  strokeWidth="21"
                />
                {shade && shadeAt(e, p.hour) > 0.5 && (
                  <line
                    x1={a.x + 3}
                    y1={a.y - 4}
                    x2={b.x + 3}
                    y2={b.y - 4}
                    stroke="#a5c794"
                    strokeOpacity=".28"
                    strokeWidth="16"
                  />
                )}
                {e.steps && (
                  <g
                    transform={`translate(${(a.x + b.x) / 2} ${(a.y + b.y) / 2})`}
                  >
                    <rect
                      x="-13"
                      y="-12"
                      width="26"
                      height="24"
                      rx="4"
                      fill="#f9e8d5"
                    />
                    <path
                      d="M-8 6h5V1h5v-5h6"
                      stroke="#b57537"
                      strokeWidth="2"
                      fill="none"
                    />
                  </g>
                )}
                {e.access === "unknown" && (
                  <circle
                    cx={(a.x + b.x) / 2}
                    cy={(a.y + b.y) / 2}
                    r="5"
                    fill="#c49657"
                  />
                )}
              </g>
            );
          })}
          {!north && (
            <>
              {Array.from({ length: 33 }, (_, i) => {
                const x = 155 + (i % 11) * 63,
                  y = i < 11 ? 239 : i < 22 ? 280 : 112;
                return (
                  <g key={i}>
                    <ellipse
                      cx={x + 4}
                      cy={y + 4}
                      rx="11"
                      ry="8"
                      fill="#638d58"
                      opacity=".12"
                    />
                    <circle
                      cx={x}
                      cy={y}
                      r={i % 3 === 0 ? 10 : 7}
                      fill={i % 2 ? "#b0c99b" : "#bed2aa"}
                    />
                    <circle
                      cx={x - 2}
                      cy={y - 2}
                      r="4"
                      fill="#ccdbb9"
                      opacity=".7"
                    />
                  </g>
                );
              })}
              <g className="street-labels">
                <text x="480" y="139">
                  FERN LANE
                </text>
                <text x="630" y="263">
                  CANOPY WALK
                </text>
                <text x="280" y="388">
                  RIVERSIDE AVENUE
                </text>
                <text x="590" y="514">
                  MARKET STREET
                </text>
                <text x="78" y="300" transform="rotate(-90 78 300)">
                  WILLOW STREET
                </text>
                <text x="899" y="310" transform="rotate(-90 899 310)">
                  EASTBANK ROAD
                </text>
              </g>
            </>
          )}
          {baseline && (
            <polyline
              points={points(baseline)}
              stroke="#92978b"
              strokeWidth="4"
              strokeDasharray="7 7"
              strokeLinejoin="round"
              fill="none"
              opacity=".75"
            />
          )}
          {route && (
            <>
              <polyline
                points={points(route)}
                stroke="white"
                strokeWidth="11"
                strokeLinejoin="round"
                strokeLinecap="round"
                fill="none"
              />
              <polyline
                key={route.nodes.join(",")}
                className="route-line"
                points={points(route)}
                stroke="#2d754e"
                strokeWidth="6"
                strokeLinejoin="round"
                strokeLinecap="round"
                fill="none"
              />
            </>
          )}
          {stops.map((s) => {
            const n = nodeById[s.node],
              open = stopAvailable(s, p.hour, p.closed);
            return (
              <g
                key={s.id}
                className="map-pin"
                role="button"
                tabIndex={0}
                aria-label={`View ${s.name}`}
                onClick={() => onSelect(s.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelect(s.id);
                  }
                }}
                transform={`translate(${n.x} ${n.y})`}
              >
                <circle
                  r={selected === s.id ? 24 : 20}
                  fill="white"
                  filter="url(#pin-shadow)"
                />
                <circle
                  r={selected === s.id ? 20 : 16}
                  fill={
                    !open
                      ? "#a4a89d"
                      : s.kind === "water"
                        ? "#648f9c"
                        : "#e1edd7"
                  }
                  stroke={selected === s.id ? "#397447" : "white"}
                  strokeWidth="2"
                />
                {s.kind === "water" ? (
                  <path
                    d="M0-8C-2-4-6 0-6 3a6 6 0 0012 0C6 0 2-4 0-8"
                    fill="white"
                  />
                ) : s.kind === "garden" ? (
                  <path d="M0-10l-7 9h4l-5 6h6v5h4V5h6L3-1h4Z" fill="#487649" />
                ) : (
                  <path
                    d="M-8-5L0-10 8-5M-7-3v10M0-3v10M7-3v10M-9 9H9"
                    fill="none"
                    stroke="#487649"
                    strokeWidth="2"
                  />
                )}
                {!open && (
                  <path d="M-10-10L10 10" stroke="#fff" strokeWidth="2" />
                )}
              </g>
            );
          })}
          {[p.origin, p.destination].map((id, i) => {
            const n = nodeById[id];
            return (
              <g
                key={`${id}-${i}`}
                transform={`translate(${n.x} ${n.y})`}
                pointerEvents="none"
              >
                <circle
                  r="14"
                  fill={i ? "#243d32" : "white"}
                  stroke={i ? "white" : "#2d754e"}
                  strokeWidth="3"
                />
                {i ? (
                  <text
                    textAnchor="middle"
                    y="5"
                    fill="white"
                    fontSize="13"
                    fontWeight="700"
                  >
                    B
                  </text>
                ) : (
                  <circle r="5" fill="#2d754e" />
                )}
              </g>
            );
          })}
          {!north && (
            <>
              <g transform="translate(870 90)">
                <rect
                  x="-93"
                  y="-19"
                  width="186"
                  height="39"
                  rx="9"
                  fill="white"
                  stroke="#e0e2d7"
                />
                <text textAnchor="middle" y="5" className="place-label">
                  Community health centre
                </text>
              </g>
              <text x="88" y="444" className="place-label">
                Riverside apartments
              </text>
              <text x="385" y="90" className="place-label">
                Fern House library
              </text>
              <text x="650" y="471" className="place-label">
                Market square
              </text>
            </>
          )}
          {north && (
            <>
              <text x="120" y="220" className="place-label">
                Workers’ apartments
              </text>
              <text x="120" y="492" className="place-label">
                Health centre
              </text>
              <text x="690" y="220" className="place-label">
                Depot community room
              </text>
            </>
          )}
        </g>
        <g transform="translate(945 565)">
          <path d="M0-13L-6 8 0 4 6 8Z" fill="#3b5240" />
          <text x="0" y="-20" textAnchor="middle" fontSize="11" fill="#536254">
            N
          </text>
        </g>
        <g transform="translate(42 603)">
          <path d="M0-4v8M0 0H100M100-4v8" stroke="#788373" />
          <text x="50" y="19" textAnchor="middle" fontSize="11" fill="#64705f">
            Schematic · not navigation
          </text>
        </g>
      </svg>
      <div className="map-controls">
        <button
          aria-label="Zoom in"
          onClick={() => setZoom((z) => Math.min(1.6, z + 0.2))}
        >
          <Plus size={19} />
        </button>
        <button
          aria-label="Zoom out"
          onClick={() => setZoom((z) => Math.max(0.8, z - 0.2))}
        >
          <Minus size={19} />
        </button>
        <button aria-label="Reset map view" onClick={() => setZoom(1)}>
          <LocateFixed size={19} />
        </button>
        <button
          aria-label="Toggle shade layer"
          aria-pressed={shade}
          onClick={() => setShade((v) => !v)}
        >
          <Layers size={19} />
        </button>
      </div>
    </>
  );
}
