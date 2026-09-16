"use client";
import { useEffect, useMemo, useState, useRef } from "react";
import {
  Leaf,
  ArrowUpRight,
  MapPin,
  Sun,
  Route as RouteIcon,
  ArrowRight,
  Accessibility,
  Footprints,
  TreePine,
  Droplets,
  Armchair,
  Navigation,
  Check,
  Info,
  Download,
  Bookmark,
  Clock,
  ShieldCheck,
  WifiOff,
  Volume2,
  RotateCcw,
  X,
  Play,
  ArrowDownUp,
  FileCheck,
  ChevronRight,
  CloudRain,
  CheckCircle2,
  ExternalLink,
  BookOpen,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Toaster, toast } from "sonner";
import {
  defaultPreferences,
  planRoute,
  validateRoute,
  type Preferences,
  type Route,
} from "@/lib/routing";
import {
  destinations,
  edges,
  stops,
  stopAvailable,
  DATA_VERSION,
  type CoolingStop,
} from "@/lib/neighborhood";
import NeighborhoodMap from "@/components/neighborhood-map";
import WarningNote from "@/components/warning-note";
import { downloadPlan, type SavedPlan } from "@/lib/offline";
const PREP = [
  "Check your local authority’s latest warning before leaving.",
  "Agree on a contact and a meeting point with your household.",
  "Keep essential documents and regular supplies together.",
  "Charge your phone and save important contact details.",
  "Plan how anyone with mobility needs can receive assistance.",
];
const nameOf = (id: string) =>
  destinations.find((d) => d.id === id)?.name || id;
const StopIcon = ({ stop, size = 21 }: { stop: CoolingStop; size?: number }) =>
  stop.kind === "water" ? (
    <Droplets size={size} />
  ) : stop.kind === "garden" ? (
    <TreePine size={size} />
  ) : (
    <BookOpen size={size} />
  );
export default function Home() {
  const [p, setP] = useState<Preferences>(defaultPreferences);
  const [tab, setTab] = useState("journey");
  const [selected, setSelected] = useState<string | null>(null);
  const [modal, setModal] = useState<
    "evidence" | "directions" | "saved" | null
  >(null);
  const [saved, setSaved] = useState<SavedPlan | null>(null);
  const [checks, setChecks] = useState<string[]>([]);
  const [offline, setOffline] = useState(false);
  const [readyOffline, setReadyOffline] = useState(false);
  const [demo, setDemo] = useState(-1);
  const [filter, setFilter] = useState("all");
  const [reading, setReading] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);
  const result = useMemo(() => {
    const started = typeof performance === "undefined" ? 0 : performance.now();
    const answer = planRoute(p);
    return {
      ...answer,
      elapsed:
        typeof performance === "undefined" ? 0 : performance.now() - started,
    };
  }, [p]);
  const route = result.route;
  const patch = (v: Partial<Preferences>) => setP((x) => ({ ...x, ...v }));
  const selectedStop = stops.find((s) => s.id === selected);
  const issues = route ? validateRoute(route, p, result.budget) : [];
  useEffect(() => {
    try {
      const stored = localStorage.getItem("climatereach-saved-v1");
      if (stored) {
        const value = JSON.parse(stored);
        if (
          value.version === DATA_VERSION &&
          value.preferences &&
          value.route?.nodes
        )
          setSaved(value);
      }
      const done = JSON.parse(
        localStorage.getItem("climatereach-checklist-v1") || "[]",
      );
      if (Array.isArray(done))
        setChecks(done.filter((x) => typeof x === "string"));
    } catch {
      toast.error("A saved plan could not be read. You can create a new one.");
    }
    const update = () => setOffline(!navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then(() => navigator.serviceWorker.ready)
        .then((reg) => {
          const channel = new MessageChannel();
          channel.port1.onmessage = (e) => setReadyOffline(!!e.data.ready);
          const urls = performance
            .getEntriesByType("resource")
            .map((e) => e.name);
          (reg.active || navigator.serviceWorker.controller)?.postMessage(
            { type: "CACHE_ASSETS", urls },
            [channel.port2],
          );
        })
        .catch(() => setReadyOffline(false));
    }
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);
  useEffect(() => {
    const context = (
      document as unknown as {
        modelContext?: {
          registerTool: (
            tool: unknown,
            options: unknown,
          ) => Promise<void> | void;
        };
      }
    ).modelContext;
    if (!context?.registerTool) return;
    const controller = new AbortController();
    const tools = [
      {
        name: "read_journey",
        description:
          "Read the currently displayed ClimateReach demonstration route and its assumptions.",
        inputSchema: {
          type: "object",
          properties: {},
          additionalProperties: false,
        },
        annotations: { readOnlyHint: true },
        execute: () => ({
          preferences: p,
          route: result.route,
          reason: result.reason,
          provenance: DATA_VERSION,
        }),
      },
      {
        name: "configure_rest_interval",
        description:
          "Change the visible maximum rest interval in the demonstration planner. Does not book or start a journey.",
        inputSchema: {
          type: "object",
          properties: {
            metres: { type: "integer", minimum: 150, maximum: 600 },
          },
          required: ["metres"],
          additionalProperties: false,
        },
        annotations: { readOnlyHint: false },
        execute: async (input: unknown) => {
          const v = input as { metres?: number };
          if (
            !Number.isInteger(v?.metres) ||
            v.metres! < 150 ||
            v.metres! > 600
          )
            throw Error("metres must be an integer between 150 and 600");
          const next = { ...p, maxRest: v.metres! };
          const answer = planRoute(next);
          setP(next);
          await new Promise((resolve) =>
            requestAnimationFrame(() => requestAnimationFrame(resolve)),
          );
          return {
            maxRest: next.maxRest,
            feasible: !!answer.route,
            distance: answer.route?.distance ?? null,
          };
        },
      },
    ];
    for (const tool of tools) {
      try {
        Promise.resolve(
          context.registerTool(tool, { signal: controller.signal }),
        ).catch(() => {});
      } catch {}
    }
    return () => controller.abort();
  }, [p, result]);
  const closeStop = (id: string) => {
    const closing = !p.closed.includes(id);
    patch({
      closed: closing ? [...p.closed, id] : p.closed.filter((x) => x !== id),
    });
    toast(
      closing
        ? "Stop marked unavailable. Route recalculated."
        : "Stop reopened in this scenario.",
    );
  };
  const savePlan = () => {
    if (!route) return;
    const plan: SavedPlan = {
      version: DATA_VERSION,
      savedAt: new Date().toISOString(),
      preferences: { ...p },
      route,
      checklist: checks,
    };
    try {
      localStorage.setItem("climatereach-saved-v1", JSON.stringify(plan));
      setSaved(plan);
      toast.success("Journey saved on this device.");
    } catch {
      toast.error(
        "Device storage is unavailable. Download a trip card instead.",
      );
    }
  };
  const changeCheck = (item: string) => {
    const next = checks.includes(item)
      ? checks.filter((x) => x !== item)
      : [...checks, item];
    setChecks(next);
    try {
      localStorage.setItem("climatereach-checklist-v1", JSON.stringify(next));
    } catch {
      toast.error("Checklist could not be saved on this device.");
    }
  };
  const speak = () => {
    if (!("speechSynthesis" in window)) {
      toast.error("Read-aloud is not supported by this browser.");
      return;
    }
    if (reading) {
      speechSynthesis.cancel();
      setReading(false);
      return;
    }
    const text =
      tab === "preparedness"
        ? `Household preparation. General checklist, not a current warning. ${PREP.join(" ")}`
        : route
          ? `Your demonstration journey from ${nameOf(p.origin)} to ${nameOf(p.destination)} is ${route.distance} metres, about ${Math.ceil(route.walkingMinutes)} minutes of movement. ${route.restStops.length} places to rest. Longest stretch between rests is ${route.maxLeg} metres. This is a fictional neighborhood, not real-world navigation.`
          : result.reason;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onend = () => setReading(false);
    utterance.onerror = () => setReading(false);
    setReading(true);
    speechSynthesis.speak(utterance);
  };
  const demoSteps = [
    {
      title: "An essential journey, with room to pause.",
      body: "Start with a 300 m rest interval and paths without steps.",
      prefs: { ...defaultPreferences },
    },
    {
      title: "A stop closes. The route adapts.",
      body: "Cedar community room is unavailable. The planner finds a route via Fern Lane.",
      prefs: { ...defaultPreferences, closed: ["cedar"] },
    },
    {
      title: "Sometimes the honest answer is no.",
      body: "A 150 m rest interval cannot be met here. Your requirements stay intact.",
      prefs: { ...defaultPreferences, maxRest: 150 },
    },
    {
      title: "Take your plan with you.",
      body: "Restore a feasible journey, then save it or download a standalone trip card.",
      prefs: { ...defaultPreferences },
    },
  ];
  const goDemo = (step: number) => {
    setDemo(step);
    setTab("journey");
    setSelected(null);
    if (step >= 0) setP(demoSteps[step].prefs);
  };
  const available = stops.filter((s) => stopAvailable(s, p.hour, p.closed));
  const filtered = stops.filter(
    (s) =>
      filter === "all" ||
      (filter === "water" && s.water) ||
      (filter === "seating" && s.seating) ||
      (filter === "stepfree" && s.stepFree),
  );
  return (
    <main className="app-shell">
      <Toaster position="bottom-center" richColors />
      <header className="topbar">
        <a className="brand" href="/" aria-label="ClimateReach home">
          <span className="brand-symbol">
            <Leaf size={24} />
          </span>
          climate<span>reach</span>
          <span className="brand-dot" />
        </a>
        <nav aria-label="Main navigation">
          {[
            ["journey", "Plan a journey"],
            ["places", "Cooling places"],
            ["preparedness", "My preparedness"],
          ].map(([id, label]) => (
            <button
              key={id}
              className={tab === id ? "nav-active" : ""}
              onClick={() => setTab(id)}
            >
              {label}
            </button>
          ))}
        </nav>
        <button className="demo-pill" onClick={() => goDemo(demo < 0 ? 0 : -1)}>
          <Play size={12} />
          {demo < 0 ? "Try the story" : "Exit story"}
        </button>
      </header>
      <div className="mobile-nav">
        {[
          ["journey", "Journey"],
          ["places", "Cooling places"],
          ["preparedness", "Prepare"],
        ].map(([id, label]) => (
          <button
            key={id}
            className={tab === id ? "active" : ""}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </div>
      {offline && (
        <div className="offline-banner">
          <WifiOff size={15} />
          You’re offline. The demonstration planner still works. Saved
          information may be out of date.
        </div>
      )}
      {demo >= 0 && (
        <section className="story-strip" aria-live="polite">
          <span className="story-count">0{demo + 1} / 04</span>
          <div>
            <strong>{demoSteps[demo].title}</strong>
            <span>{demoSteps[demo].body}</span>
          </div>
          <button onClick={() => (demo < 3 ? goDemo(demo + 1) : goDemo(-1))}>
            {demo < 3 ? "Next chapter" : "Finish story"}
            <ArrowRight size={16} />
          </button>
          <button aria-label="Close story" onClick={() => goDemo(-1)}>
            <X size={16} />
          </button>
        </section>
      )}
      <div className="workspace">
        <aside className="planner">
          <div className="eyebrow">
            <span /> A LITTLE SHADE. A BETTER JOURNEY.
          </div>
          <h1>
            The way there,
            <br />
            <em>with you in mind.</em>
          </h1>
          <p className="intro">
            More shade. A place to pause.
            <br />A route that works for you.
          </p>
          <div className="location-stack">
            {(["origin", "destination"] as const).map((key, i) => (
              <div className="location-row" key={key}>
                <span className={"location-icon " + (i ? "end" : "")}>
                  {i ? <MapPin size={17} /> : <span />}
                </span>
                <div>
                  <label>{i ? "WHERE TO?" : "STARTING FROM"}</label>
                  <Select
                    value={p[key]}
                    onValueChange={(v) => patch({ [key]: v })}
                  >
                    <SelectTrigger
                      aria-label={i ? "Destination" : "Starting point"}
                      className="place-select"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {destinations.map((d) => (
                        <SelectItem key={d.id} value={d.id}>
                          {d.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {i === 0 && (
                  <button
                    className="swap-button"
                    aria-label="Swap start and destination"
                    onClick={() =>
                      patch({ origin: p.destination, destination: p.origin })
                    }
                  >
                    <ArrowDownUp size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
          <div className="section-label">MAKE IT YOUR JOURNEY</div>
          <div className="profiles">
            <button
              className={p.speed === 60 ? "selected" : ""}
              onClick={() => patch({ speed: 60, stepFree: true, maxRest: 300 })}
            >
              <Accessibility size={20} />
              Gentler journey
            </button>
            <button
              className={p.speed === 80 ? "selected" : ""}
              onClick={() => patch({ speed: 80, maxRest: 500 })}
            >
              <Footprints size={20} />
              On the move
            </button>
          </div>
          <div className="toggle-row">
            <div>
              <Accessibility size={18} />
              <span>Avoid steps</span>
            </div>
            <Switch
              aria-label="Avoid steps"
              checked={p.stepFree}
              onCheckedChange={(v) => patch({ stepFree: v })}
            />
          </div>
          <div className="toggle-row">
            <div>
              <TreePine size={18} />
              <span>Prefer more shade</span>
            </div>
            <Switch
              aria-label="Prefer more shade"
              checked={p.preferShade}
              onCheckedChange={(v) => patch({ preferShade: v })}
            />
          </div>
          <div className="toggle-row">
            <div>
              <ShieldCheck size={18} />
              <span>Exclude unknown access</span>
            </div>
            <Switch
              aria-label="Exclude unknown access"
              checked={p.excludeUnknown}
              onCheckedChange={(v) => patch({ excludeUnknown: v })}
            />
          </div>
          <div className="slider-label">
            <label htmlFor="rest-range">A place to rest every</label>
            <strong>
              {p.maxRest} <small>m</small>
            </strong>
          </div>
          <Slider
            ref={(el) => {
              el?.querySelector('[role="slider"]')?.setAttribute(
                "aria-label",
                "Maximum distance between rests",
              );
            }}
            id="rest-range"
            aria-label="Maximum distance between rests"
            min={150}
            max={600}
            step={25}
            value={[p.maxRest]}
            onValueChange={(v) => patch({ maxRest: v[0] })}
          />
          <div className="slider-ends">
            <span>Frequent rests</span>
            <span>Longer stretches</span>
          </div>
          <div className="slider-label">
            <label htmlFor="detour-range">Extra moving time</label>
            <strong>
              {p.detour} <small>min</small>
            </strong>
          </div>
          <Slider
            ref={(el) => {
              el?.querySelector('[role="slider"]')?.setAttribute(
                "aria-label",
                "Extra moving time",
              );
            }}
            id="detour-range"
            aria-label="Extra moving time"
            min={0}
            max={10}
            step={1}
            value={[p.detour]}
            onValueChange={(v) => patch({ detour: v[0] })}
          />
          <button
            className="primary-action"
            onClick={() => {
              setTab("journey");
              resultRef.current?.scrollIntoView({
                behavior: "smooth",
                block: "nearest",
              });
              setModal("directions");
            }}
          >
            <RouteIcon size={18} />
            Explore my journey
            <ArrowRight size={19} />
          </button>
          <div className="planner-footnote">
            <Info size={15} />
            <span>
              Fictional neighborhood. Illustrative shade and access data.{" "}
              <button onClick={() => setModal("evidence")}>
                See what we know.
              </button>
            </span>
          </div>
          <button className="saved-link" onClick={() => setModal("saved")}>
            <Bookmark size={15} />
            {saved ? "Open saved journey" : "Your saved journey"}
            <ChevronRight size={14} />
          </button>
        </aside>
        <section className="map-workspace">
          {tab === "journey" ? (
            <>
              <div className="map-heading">
                <div>
                  <span className="eyebrow">
                    YOUR NEIGHBORHOOD, RECONSIDERED
                  </span>
                  <h2>A little shade goes a long way.</h2>
                </div>
                <button
                  className="location-chip"
                  onClick={() => setModal("evidence")}
                >
                  <MapPin size={15} />
                  Riverside · demo district
                </button>
              </div>
              <div className="map-canvas">
                <NeighborhoodMap
                  route={route}
                  baseline={result.baseline}
                  selected={selected}
                  onSelect={setSelected}
                  preferences={p}
                />
                <div className="map-top-left">
                  <span className="weather-icon">
                    <Sun size={24} />
                  </span>
                  <div>
                    <strong>
                      {p.hour < 12
                        ? "Morning"
                        : p.hour < 16
                          ? "Afternoon"
                          : "Evening"}{" "}
                      shade
                    </strong>
                    <span>Illustrative · no live weather</span>
                  </div>
                  <Select
                    value={String(p.hour)}
                    onValueChange={(v) => patch({ hour: Number(v) })}
                  >
                    <SelectTrigger
                      aria-label="Departure time"
                      className="time-select"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[9, 11, 13, 15, 17, 19].map((h) => (
                        <SelectItem key={h} value={String(h)}>
                          {String(h).padStart(2, "0")}:00
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="map-legend">
                  <span>
                    <i className="green-line" />
                    Your route
                  </span>
                  <span>
                    <i className="dashed-line" />
                    Shortest · unconstrained
                  </span>
                </div>
                <div className="map-status">
                  <span /> Preferences applied locally
                </div>
              </div>
              <div
                className="journey-result"
                ref={resultRef}
                aria-live="polite"
              >
                {route ? (
                  <>
                    <div className="result-main">
                      <span className="result-icon">
                        <Navigation size={23} />
                      </span>
                      <div>
                        <span className="eyebrow">YOUR GENTLER JOURNEY</span>
                        <h3>
                          {Math.ceil(route.walkingMinutes)} min{" "}
                          <span>· {(route.distance / 1000).toFixed(2)} km</span>
                        </h3>
                      </div>
                      <span className="recommended">
                        {issues.length
                          ? "Review needed"
                          : "Fits your preferences"}
                      </span>
                    </div>
                    <div className="result-metrics">
                      <div>
                        <TreePine />
                        <strong>{Math.round(route.shade * 100)}%</strong>
                        <span>scenario shade</span>
                      </div>
                      <div>
                        <Armchair />
                        <strong>{route.restStops.length}</strong>
                        <span>places to pause</span>
                      </div>
                      <div>
                        <Accessibility />
                        <strong>
                          {route.edges.some((e) => e.steps)
                            ? "Steps"
                            : "No steps"}
                        </strong>
                        <span>in this scenario</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="empty-result">
                    <span className="empty-icon">
                      <RouteIcon size={24} />
                    </span>
                    <h3>{result.reason}</h3>
                    <p>{result.suggestion}</p>
                    <button
                      className="text-action"
                      onClick={() => setP({ ...defaultPreferences })}
                    >
                      <RotateCcw size={14} />
                      Restore example journey
                    </button>
                  </div>
                )}
              </div>
              {route && (
                <div className="route-detail-row">
                  <span>
                    <CheckCircle2 size={15} />
                    Longest stretch: <strong>{route.maxLeg} m</strong>
                    <span className="dot-separator">·</span>Moving time excludes
                    rests
                  </span>
                  <div>
                    <button
                      onClick={speak}
                      aria-label={
                        reading ? "Stop reading" : "Read journey aloud"
                      }
                    >
                      <Volume2 size={17} />
                    </button>
                    <button onClick={savePlan}>
                      <Bookmark size={15} />
                      Save journey
                    </button>
                    <button onClick={() => setModal("directions")}>
                      Details
                      <ArrowUpRight size={15} />
                    </button>
                  </div>
                </div>
              )}
              <section className="stops-preview">
                <div className="section-heading">
                  <h3>A little support along the way</h3>
                  <button onClick={() => setTab("places")}>
                    All cooling places
                    <ArrowRight size={15} />
                  </button>
                </div>
                <div className="stop-grid">
                  {(route?.restStops.length
                    ? route.restStops
                        .slice(0, 3)
                        .map((id) => stops.find((s) => s.id === id)!)
                    : stops.slice(0, 3)
                  ).map((s) => (
                    <button
                      className="stop-mini"
                      key={s.id}
                      onClick={() => setSelected(s.id)}
                    >
                      <span className={"stop-mini-icon " + s.kind}>
                        <StopIcon stop={s} />
                      </span>
                      <div>
                        <strong>{s.name}</strong>
                        <span>
                          {s.water ? "Water & seating" : "Shaded seating"} ·
                          scenario
                        </span>
                      </div>
                      <ChevronRight size={15} />
                    </button>
                  ))}
                </div>
              </section>
            </>
          ) : tab === "places" ? (
            <>
              <div className="page-intro">
                <span className="eyebrow">A PLACE TO PAUSE</span>
                <h2>Small stops. A real difference.</h2>
                <p>
                  Explore the scenario’s cooling places. Closing a stop updates
                  your journey immediately.
                </p>
              </div>
              <Tabs value={filter} onValueChange={setFilter}>
                <TabsList className="filter-tabs">
                  <TabsTrigger value="all">All places</TabsTrigger>
                  <TabsTrigger value="seating">Seating</TabsTrigger>
                  <TabsTrigger value="water">Water</TabsTrigger>
                  <TabsTrigger value="stepfree">No steps</TabsTrigger>
                </TabsList>
              </Tabs>
              <p className="place-count">
                {available.length} open at {p.hour}:00 in the scenario ·{" "}
                {p.closed.length} manually unavailable
              </p>
              <div className="places-grid">
                {filtered.map((s) => (
                  <article className="place-card" key={s.id}>
                    <div className={"place-art " + s.kind}>
                      <StopIcon stop={s} size={45} />
                      <span
                        className={
                          stopAvailable(s, p.hour, p.closed)
                            ? "open-badge"
                            : "closed-badge"
                        }
                      >
                        {stopAvailable(s, p.hour, p.closed)
                          ? "Open in scenario"
                          : "Unavailable"}
                      </span>
                    </div>
                    <div className="place-card-body">
                      <h3>{s.name}</h3>
                      <p>{s.description}</p>
                      <div className="amenities">
                        {s.seating && (
                          <span>
                            <Armchair size={14} />
                            Seating
                          </span>
                        )}
                        {s.water && (
                          <span>
                            <Droplets size={14} />
                            Water
                          </span>
                        )}
                        <span>
                          <Accessibility size={14} />
                          {s.stepFree ? "No steps" : "Steps"}
                        </span>
                      </div>
                      <div className="place-card-footer">
                        <span>
                          <Clock size={13} />
                          {s.hours}
                        </span>
                        <button onClick={() => setSelected(s.id)}>
                          Details
                          <ArrowUpRight size={15} />
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </>
          ) : (
            <>
              <div className="page-intro">
                <span className="eyebrow">PREPARED, EVEN WITHOUT A SIGNAL</span>
                <h2>
                  A little preparation.
                  <br />
                  <em>One less thing to worry about.</em>
                </h2>
                <p>
                  Keep a household checklist and your saved journey close at
                  hand.
                </p>
              </div>
              <div className="prep-layout">
                <section className="prep-card">
                  <span className="prep-icon">
                    <CloudRain size={26} />
                  </span>
                  <h3>Your household checklist</h3>
                  <p className="muted">
                    General preparation, not a current warning or an evacuation
                    plan.
                  </p>
                  <div className="checklist">
                    {PREP.map((item) => (
                      <label key={item}>
                        <Checkbox
                          checked={checks.includes(item)}
                          onCheckedChange={() => changeCheck(item)}
                        />
                        <span>{item}</span>
                      </label>
                    ))}
                  </div>
                  <div className="checklist-bottom">
                    <span>
                      {PREP.filter((x) => checks.includes(x)).length} of{" "}
                      {PREP.length} complete
                    </span>
                    <button className="text-action" onClick={speak}>
                      <Volume2 size={16} />
                      {reading ? "Stop reading" : "Read aloud"}
                    </button>
                  </div>
                </section>
                <section className="prep-card olive">
                  <Bookmark size={27} />
                  <h3>Your journey, within reach.</h3>
                  <p>
                    {saved
                      ? `${nameOf(saved.preferences.origin)} to ${nameOf(saved.preferences.destination)}`
                      : "Save a journey to keep its route and stops on this device."}
                  </p>
                  {saved && (
                    <span className="saved-date">
                      Saved {new Date(saved.savedAt).toLocaleString()} ·
                      scenario snapshot
                    </span>
                  )}
                  <button
                    className="secondary-action"
                    onClick={() => setModal("saved")}
                  >
                    {saved ? "Open saved journey" : "View saved journeys"}
                    <ArrowRight size={16} />
                  </button>
                  <div className="offline-note">
                    <WifiOff size={16} />
                    {readyOffline
                      ? "Offline shell installed. Download a trip card for a separate copy."
                      : "Download a trip card for a standalone offline copy."}
                  </div>
                </section>
              </div>
              <section className="source-banner">
                <ShieldCheck size={23} />
                <div>
                  <h3>Start with an official source.</h3>
                  <p>
                    Read your local authority’s current instructions. This
                    checklist does not fetch, interpret, or replace local
                    warnings.
                  </p>
                </div>
                <a
                  href="https://www.ready.gov/floods"
                  target="_blank"
                  rel="noreferrer"
                >
                  Ready.gov guidance
                  <ExternalLink size={15} />
                </a>
              </section>
              <WarningNote />
            </>
          )}
          <footer className="below-map">
            <span>
              <Leaf size={16} />
              Climate resilience starts with everyday journeys.
            </span>
            <button onClick={() => setModal("evidence")}>
              Data & methodology
              <ArrowUpRight size={12} />
            </button>
          </footer>
        </section>
      </div>
      <Dialog
        open={!!selectedStop}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      >
        <DialogContent className="detail-dialog">
          <DialogHeader>
            <span className="eyebrow">COOLING PLACE · DEMONSTRATION DATA</span>
            <DialogTitle>{selectedStop?.name}</DialogTitle>
            <DialogDescription>{selectedStop?.description}</DialogDescription>
          </DialogHeader>
          {selectedStop && (
            <>
              <div className={"detail-art " + selectedStop.kind}>
                <StopIcon stop={selectedStop} size={65} />
              </div>
              <div className="amenities large">
                <span>
                  <Armchair size={17} />
                  {selectedStop.seating ? "Seating available" : "No seating"}
                </span>
                <span>
                  <Droplets size={17} />
                  {selectedStop.water ? "Water refill" : "No water listed"}
                </span>
                <span>
                  <Accessibility size={17} />
                  {selectedStop.stepFree
                    ? "No steps in fixture"
                    : "Reached by steps"}
                </span>
              </div>
              <div className="detail-facts">
                <span>
                  Scenario hours<strong>{selectedStop.hours}</strong>
                </span>
                <span>
                  Status at {p.hour}:00
                  <strong>
                    {stopAvailable(selectedStop, p.hour, p.closed)
                      ? "Available"
                      : "Unavailable"}
                  </strong>
                </span>
                <span>
                  Verification
                  <strong>Synthetic fixture · not field verified</strong>
                </span>
              </div>
              <p className="muted">
                Closing this stop changes only your local scenario. It does not
                report a real-world closure.
              </p>
              <button
                className="secondary-action"
                onClick={() => closeStop(selectedStop.id)}
              >
                {p.closed.includes(selectedStop.id)
                  ? "Reopen in scenario"
                  : "Mark unavailable & recalculate"}
                <ArrowRight size={16} />
              </button>
            </>
          )}
        </DialogContent>
      </Dialog>
      <Dialog
        open={modal !== null}
        onOpenChange={(open) => {
          if (!open) setModal(null);
        }}
      >
        <DialogContent className="detail-dialog wide-dialog">
          <DialogHeader>
            <span className="eyebrow">CLIMATEREACH</span>
            <DialogTitle>
              {modal === "evidence"
                ? "Clear about what we know."
                : modal === "saved"
                  ? "Your saved journey."
                  : "Every stretch, accounted for."}
            </DialogTitle>
            <DialogDescription>
              {modal === "evidence"
                ? "A working planner on a fictional neighborhood. Here is what is calculated, what is assumed, and what remains unknown."
                : modal === "saved"
                  ? "A snapshot on this device. Recheck conditions before any real journey."
                  : "A breakdown of the current scenario route and your requirements."}
            </DialogDescription>
          </DialogHeader>
          {modal === "evidence" ? (
            <div className="evidence-content">
              <div className="evidence-grid">
                <div>
                  <strong>{edges.length}</strong>
                  <span>connected path segments</span>
                </div>
                <div>
                  <strong>{stops.length}</strong>
                  <span>scenario cooling places</span>
                </div>
                <div>
                  <strong>{result.elapsed.toFixed(2)} ms</strong>
                  <span>measured local calculation</span>
                </div>
              </div>
              <h4>Calculated, not animated answers</h4>
              <p>
                The search tracks location, distance since the last usable rest,
                total distance, and shade cost. It prunes dominated states and
                respects your detour budget. Closed places and refill points
                without seating cannot reset the rest counter.
              </p>
              <h4>What the data can tell you</h4>
              <p>
                Distances, opening hours, access labels, and three shade time
                windows are authored test fixtures. They are not observations of
                a real district. Shade percentage is distance-weighted; it does
                not estimate temperature or medical risk.
              </p>
              <h4>What “no steps” does not establish</h4>
              <p>
                Surface quality, curb ramps, crossing safety, gradients, and
                doorway widths are not modeled. The result is not a
                certification of wheelchair accessibility.
              </p>
              <h4>Time and route assumptions</h4>
              <p>
                Moving speeds are {p.speed === 60 ? "60" : "80"} metres per
                minute according to the selected profile. Break duration is not
                included. Stop availability and shade use the selected departure
                hour throughout the journey. The dashed baseline ignores all
                personal constraints.
              </p>
              <div className="evidence-status">
                <CheckCircle2 size={18} />
                {route
                  ? issues.length
                    ? issues.join(", ")
                    : "Independent route checks passed."
                  : "No feasible route; constraints have not been relaxed."}
              </div>
              <button
                className="secondary-action"
                onClick={() => {
                  const blob = new Blob(
                    [
                      JSON.stringify(
                        {
                          dataVersion: DATA_VERSION,
                          preferences: p,
                          result,
                          validation: issues,
                        },
                        null,
                        2,
                      ),
                    ],
                    { type: "application/json" },
                  );
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = "climatereach-evidence.json";
                  a.click();
                  setTimeout(() => URL.revokeObjectURL(url), 1000);
                }}
              >
                <Download size={16} />
                Download route evidence
              </button>
            </div>
          ) : modal === "saved" ? (
            saved ? (
              <>
                <div className="saved-summary">
                  <span className="eyebrow">SAVED ON THIS DEVICE</span>
                  <h3>
                    {nameOf(saved.preferences.origin)}
                    <ArrowRight size={18} />
                    {nameOf(saved.preferences.destination)}
                  </h3>
                  <p>
                    {saved.route.distance} m ·{" "}
                    {Math.ceil(saved.route.walkingMinutes)} min moving ·{" "}
                    {saved.route.restStops.length} rest stops
                  </p>
                  <span className="muted">
                    {new Date(saved.savedAt).toLocaleString()}
                  </span>
                </div>
                <div className="dialog-actions">
                  <button
                    className="secondary-action"
                    onClick={() => downloadPlan(saved)}
                  >
                    <Download size={16} />
                    Download offline trip card
                  </button>
                  <button
                    className="secondary-action"
                    onClick={() => {
                      setP(saved.preferences);
                      setTab("journey");
                      setModal(null);
                      toast(
                        "Saved preferences restored and route recalculated.",
                      );
                    }}
                  >
                    Restore preferences
                    <ArrowRight size={16} />
                  </button>
                </div>
                <p className="muted">
                  The downloaded HTML card opens without a connection. It
                  contains your route, stop information, and saved checklist; it
                  is not live navigation.
                </p>
              </>
            ) : (
              <div className="empty-result">
                <Bookmark size={32} />
                <h3>No saved journey yet.</h3>
                <p>
                  Choose a feasible route and select Save journey. It stays on
                  this device.
                </p>
                <button
                  className="text-action"
                  onClick={() => {
                    setTab("journey");
                    setModal(null);
                  }}
                >
                  Back to planner
                  <ArrowRight size={16} />
                </button>
              </div>
            )
          ) : route ? (
            <>
              <div className="evidence-grid">
                <div>
                  <strong>{route.distance} m</strong>
                  <span>total distance</span>
                </div>
                <div>
                  <strong>{route.maxLeg} m</strong>
                  <span>longest rest interval</span>
                </div>
                <div>
                  <strong>
                    +
                    {Math.max(
                      0,
                      route.walkingMinutes -
                        (result.baseline?.walkingMinutes || 0),
                    ).toFixed(1)}{" "}
                    min
                  </strong>
                  <span>versus shortest route</span>
                </div>
              </div>
              <ol className="directions-list">
                {route.edges.map((edge, i) => {
                  const stop = stops.find(
                    (s) =>
                      s.node === route.nodes[i + 1] &&
                      route.restStops.includes(s.id),
                  );
                  return (
                    <li key={`${edge.id}-${i}`}>
                      <span className="direction-number">{i + 1}</span>
                      <div>
                        <strong>
                          Continue {edge.length} m along {edge.street}
                        </strong>
                        <span>
                          {edge.steps
                            ? "Includes steps"
                            : "No steps in scenario"}{" "}
                          ·{" "}
                          {edge.access === "unknown"
                            ? "Access unknown"
                            : "Access documented in fixture"}
                        </span>
                        {stop && (
                          <button
                            onClick={() => {
                              setModal(null);
                              setSelected(stop.id);
                            }}
                          >
                            <Armchair size={14} />
                            Pause at {stop.name}
                            <ArrowUpRight size={13} />
                          </button>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ol>
              <div className="dialog-actions">
                <button className="secondary-action" onClick={savePlan}>
                  <Bookmark size={16} />
                  Save journey
                </button>
                <button
                  className="secondary-action"
                  onClick={() =>
                    downloadPlan({
                      version: DATA_VERSION,
                      savedAt: new Date().toISOString(),
                      preferences: p,
                      route,
                      checklist: checks,
                    })
                  }
                >
                  <Download size={16} />
                  Offline trip card
                </button>
              </div>
            </>
          ) : (
            <div className="empty-result">
              <h3>{result.reason}</h3>
              <p>{result.suggestion}</p>
              <button
                className="text-action"
                onClick={() => {
                  setP(defaultPreferences);
                  setModal(null);
                }}
              >
                Restore example journey
                <RotateCcw size={15} />
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
}
