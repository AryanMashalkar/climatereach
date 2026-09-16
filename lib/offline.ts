import { getDistrict } from "./districts";
import { destinations, stops } from "./neighborhood";
import type { Preferences, Route } from "./routing";
export type SavedPlan = {
  districtId?: string;
  version: string;
  savedAt: string;
  preferences: Preferences;
  route: Route;
  checklist: string[];
};
const escape = (s: unknown) =>
  String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
export function offlineHTML(plan: SavedPlan) {
  const {
    destinations,
    stops,
    name: districtName,
  } = getDistrict(plan.districtId);
  const name = (id: string) =>
    destinations.find((d) => d.id === id)?.name || id;
  return `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>ClimateReach · Offline journey</title><style>body{font:17px/1.65 system-ui,sans-serif;max-width:740px;margin:40px auto;padding:0 24px;color:#2a4032;background:#f7f8f0}h1{font-size:36px;line-height:1.2}h2{font-size:21px;margin-top:30px}.notice{background:#e9eddb;padding:18px;border-radius:12px}li{padding:9px 0}small{color:#66735d}button{background:#31593b;color:white;padding:12px 20px;border:0;border-radius:8px;font:inherit}@media print{button{display:none}}</style><header><strong>climatereach / OFFLINE TRIP CARD</strong></header><h1>${escape(name(plan.preferences.origin))}<br>→ ${escape(name(plan.preferences.destination))}</h1><p>${plan.route.distance} m · ${Math.ceil(plan.route.walkingMinutes)} minutes moving · ${plan.route.restStops.length} rest stops</p><div class="notice"><strong>Fictional demonstration neighborhood: ${escape(districtName)}.</strong> Not real-world navigation. Saved ${escape(new Date(plan.savedAt).toLocaleString())}. Data version: ${escape(plan.version)}. Moving time excludes breaks. Availability is a snapshot at ${plan.preferences.hour}:00.</div><h2>Your preferences</h2><p>Rest at most every ${plan.preferences.maxRest} m. ${plan.preferences.stepFree ? "Avoid steps." : "Steps permitted."} ${plan.preferences.excludeUnknown ? "Unknown-access paths excluded." : "Unknown-access paths permitted."} Up to ${plan.preferences.detour} extra moving minutes.</p><h2>Your route</h2><ol>${plan.route.edges
    .map((e, i) => {
      const stop = stops.find(
        (s) =>
          s.node === plan.route.nodes[i + 1] &&
          plan.route.restStops.includes(s.id),
      );
      return `<li>Continue ${e.length} m on <strong>${escape(e.street)}</strong>. ${e.steps ? "Includes steps." : ""}${stop ? `<br>Rest at <strong>${escape(stop.name)}</strong>. ${escape(stop.hours)}. ${stop.water ? "Water refill available in scenario." : ""}` : ""}</li>`;
    })
    .join("")}</ol><h2>Selected rest stops</h2>${
    plan.route.restStops
      .map((id) => {
        const s = stops.find((x) => x.id === id)!;
        return `<p><strong>${escape(s.name)}</strong><br>${escape(s.description)}<br><small>Scenario hours ${escape(s.hours)} · synthetic, not field verified</small></p>`;
      })
      .join("") || "<p>No intermediate rest stops.</p>"
  }<h2>Completed preparation items</h2><ul>${plan.checklist.map((item) => `<li>${escape(item)}</li>`).join("") || "<li>No items marked complete when this card was saved.</li>"}</ul><p>Use your local authority’s current warnings. This card provides no evacuation routing or medical assessment.</p><button onclick="window.print()">Print / save as PDF</button></html>`;
}
export function downloadPlan(plan: SavedPlan) {
  const url = URL.createObjectURL(
    new Blob([offlineHTML(plan)], { type: "text/html;charset=utf-8" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = "climatereach-offline-journey.html";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
