# Validation record

Validated on September 16, 2026 with Node.js v24.19.0 on Windows and headless Google Chrome.

## Completed

- TypeScript check: passed.
- Production Vinext/Cloudflare Worker build: completed.
- Route unit/integration checks: 15 passed.
- Independent expanded-state oracle: matched on 48 configurations covering endpoints, rest limits, step restrictions, unknown-access exclusions, shade preferences, departure windows, closures, and detour budgets.
- Production browser checks: 16 passed against the locally served compiled Worker.
- Browser page errors during that flow: none.
- Mobile: 390 px viewport, no horizontal document overflow; screenshot visually reviewed.
- Desktop: 1440 px viewport, screenshot visually reviewed.
- Offline: service worker installed; browser disconnected and reloaded; saved original warning remained readable and route recalculation still worked.
- Download: standalone HTML trip card generated and checked for scenario disclosure.
- Original warning: HTTPS validation, preserved text, local persistence, and saved-copy label checked.

## Browser scenarios

1. Initial feasible route.
2. Closing Cedar reroutes without relaxing preferences.
3. A 150 m rest interval produces an explicit no-route state.
4. Save and standalone HTML download.
5. Cooling-place amenity filter.
6. Checklist and source-linked warning save.
7. Saved preparation survives refresh.
8. Four-part demo story drives the real planner state.
9. Departure-time change updates the shade scenario.
10. Mobile layout has no horizontal overflow.
11. Offline refresh and further local routing.
12. No browser runtime errors.

## Measured local solver timing

For 100 successive default-fixture calculations on the development machine: median approximately 0.184 ms, p95 approximately 0.484 ms. These measure the small local graph solver, not network latency, rendering time, or performance on other devices. The UI reports its own actual calculation time rather than displaying these as a fixed badge.

## Not claimed

- No real-world mobility/accessibility or environmental-impact trial.
- No real-world shade, stop, forecast, or warning validation.
- No screen-reader audit or broad assistive-technology certification.
- WebMCP registration is feature-detected, but the tested browser did not provide a supported modelContext. Native WebMCP execution validation was therefore unavailable.
- Browser speech availability depends on the user’s browser and installed voices.
- GitHub publication requires restored user authentication; the existing credential was invalid.
- The hosted site’s audience must be checked before giving its link to judges.

## Reproduce

```sh
npm ci
npm test
npm run typecheck
npm run build
npm start
```

In another shell, set `QA_URL` to the exact local production URL printed by Wrangler, set `CHECK_OFFLINE=1`, and run `npm run test:browser`. On Windows the script defaults to installed Google Chrome; override `PLAYWRIGHT_CHROMIUM_EXECUTABLE` as needed. On other platforms install Playwright Chromium with `npx playwright install chromium`.

## District expansion

Verified computed 850 m nearest seated stop and 550 m shortfall; closure moves it to 1,450 m; after-hours returns no available stop; a shorter 600 m corridor journey is feasible; graph IDs remain isolated; offline export resolves corridor stop names. Browser checks cover preserved rest preferences, responsive corridor layout, closure diagnosis, switch-back routing, and saved district restoration across reloads. The 48-case independent oracle remains a Riverside comparison, not a claim of global routing validation.
