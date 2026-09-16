# Four-minute demonstration

Record the actual running application. Keep the fictional-neighborhood label visible. The story is an illustrative scenario, not a testimonial.

## 0:00–0:35 — The person

“Getting to an appointment should not depend on how far you can walk without resting. On a hot day, the shortest route may ignore the person taking it. ClimateReach plans around shade, steps, and places to pause.”

Show the app, not a slide deck. Select Gentler journey. Explain that Riverside is a fictional test district.

## 0:35–1:20 — A route that fits

Show the apartment-to-health-centre journey with a 300 m rest interval, step avoidance, and unknown-access exclusion. Point to the green route and dashed baseline. Open Details and show actual per-segment instructions and the longest interval.

“These are real calculations on an explicitly synthetic graph. We have not claimed that a road is accessible because a map forgot to record its steps.”

## 1:20–2:05 — The hero moment

Click Cedar community room. Show its scenario hours and seating. Mark it unavailable, close the dialog, and let the route animation finish. The path detours via the northern stops while retaining the same rest limit.

“A place closes. The answer changes. The requirement does not.”

Now set the rest interval to 150 m. Show the no-route state.

“When there is no route that meets these needs, we explain why. We do not silently send the person down a route they cannot complete.”

## 2:05–2:40 — Without a connection

Restore the example. Save it and download the trip card. Open the downloaded HTML file. Show that route information and stops are present without external assets. Briefly show the household checklist and a labelled example warning copied with its source.

“Preparation stays on this device. Original instructions are preserved. Saved text is a snapshot, not a new live alert.”

## 2:40–3:20 — The engineering

Open Data & methodology. Show measured local computation time and download the evidence JSON.

“Our search keeps multiple states at a junction: distance, shade cost, and distance since the last usable rest. It prunes a state only when another is no worse on all relevant resources. We tested the solver against an independent expanded-state reference across 48 cases.”

Show the passing test output briefly. Do not present development-machine timing as a universal speed guarantee.

## 3:20–4:00 — Honest impact

“The climate-adaptation goal is practical: helping people make essential journeys when environmental conditions and mobility needs constrain their choices. The next step is one real neighborhood, verified with its residents. This prototype already demonstrates the complete decision loop—and clearly marks where real-world evidence is still needed.”

End on the route and its rest stops.

## Recording checklist

- Use the production build and a clean browser profile.
- Restore default preferences before recording.
- Avoid showing a fabricated forecast, invented user quote, or real-world accessibility certification.
- Keep important text readable in the final video.
- Check the exported card before recording the offline segment.
- Test the hosted demo in a signed-out browser before submitting its URL.

## Optional 20-second district comparison

After the Riverside reroute, switch to North Industrial with the same 300 m rest requirement: “Same person. Same needs. Different neighborhood. Here the first place to sit is 850 metres away. The planner tells us the infrastructure cannot meet this requirement.” Switch back to Riverside before saving. Replace 20 seconds of the existing explanation to remain under four minutes. The earlier exported video predates this feature.
