import React, { Suspense, useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { Frost, GlassPanel } from "./components/Frost";
import WeatherIcon, { weatherKind } from "./components/WeatherIcon";
import "./styles.css";

const PeriodTabs = React.lazy(() => import("./components/GlassControls").then(module => ({ default: module.PeriodTabs })));
const telegram = window.Telegram?.WebApp;
const darkPreference = window.matchMedia("(prefers-color-scheme: dark)");

function degree(value) {
  return Number.isFinite(value) ? `${Math.round(value)}°` : "—";
}

function metricValue(value, suffix) {
  return Number.isFinite(value) ? `${Math.round(value)}${suffix}` : "—";
}

function isNight(time) {
  if (typeof time !== "string") return false;
  const hour = Number(time.slice(11, 13));
  return Number.isFinite(hour) && (hour < 6 || hour >= 19);
}

function sceneFor(forecast) {
  if (!forecast?.current) return "neutral";
  const kind = weatherKind(forecast.current.code, isNight(forecast.updatedAt));
  return ({
    sun: "sun", moon: "night", suncloud: "partly", mooncloud: "night",
    cloud: "cloud", fog: "fog", drizzle: "rain", rain: "rain",
    snow: "snow", storm: "storm"
  })[kind] || "neutral";
}

function readableError(error) {
  if (error?.type === "UNAUTHORIZED") return "Abra o Forecast dentro do Telegram para consultar o clima.";
  if (error?.type === "ENDPOINT_ERROR" && typeof error.message === "string") return error.message;
  return "Não foi possível consultar agora. Tente novamente.";
}

function callServerless(method, input) {
  return new Promise((resolve, reject) => {
    if (typeof telegram?.Serverless?.call !== "function") {
      reject({ type: "UNAUTHORIZED" });
      return;
    }
    try {
      telegram.Serverless.call(method, input, (error, data) => error ? reject(error) : resolve(data));
    } catch (error) {
      reject(error);
    }
  });
}

function useTelegramTheme() {
  const readTheme = () => telegram?.colorScheme === "dark"
    ? "dark" : telegram?.colorScheme === "light" ? "light" : darkPreference.matches ? "dark" : "light";
  const [theme, setTheme] = useState(readTheme);
  useEffect(() => {
    const update = () => setTheme(readTheme());
    telegram?.onEvent?.("themeChanged", update);
    darkPreference.addEventListener("change", update);
    return () => {
      telegram?.offEvent?.("themeChanged", update);
      darkPreference.removeEventListener("change", update);
    };
  }, []);
  useEffect(() => {
    const color = theme === "dark" ? "#142a4c" : "#a8c9df";
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", color);
    if (telegram?.isVersionAtLeast?.("6.1")) {
      const nativeColor = telegram.isVersionAtLeast("6.9") ? color : "bg_color";
      telegram.setHeaderColor?.(nativeColor);
      telegram.setBackgroundColor?.(nativeColor);
    }
  }, [theme]);
  return theme;
}

function useViewHeight() {
  useEffect(() => {
    const viewport = window.visualViewport;
    const sync = () => {
      const h = Math.max(1, Math.round(viewport?.height ?? window.innerHeight));
      const y = Math.max(0, Math.round(viewport?.offsetTop ?? 0));
      document.documentElement.style.setProperty("--view-h", h + "px");
      document.documentElement.style.setProperty("--view-y", y + "px");
    };
    sync();
    viewport?.addEventListener("resize", sync);
    viewport?.addEventListener("scroll", sync);
    window.addEventListener("resize", sync);
    telegram?.onEvent?.("viewportChanged", sync);
    return () => {
      viewport?.removeEventListener("resize", sync);
      viewport?.removeEventListener("scroll", sync);
      window.removeEventListener("resize", sync);
      telegram?.offEvent?.("viewportChanged", sync);
    };
  }, []);
}

function Brand() {
  return <div className="brand" aria-label="Forecast">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
      <path d="M3.2 15a4.1 4.1 0 0 1 4.3-4.1 6.2 6.2 0 0 1 11.8 1.5 3.9 3.9 0 0 1-.1 7.8H7A3.8 3.8 0 0 1 3.2 15Z"/>
      <path d="M7 4V2.5m3.5 3L12 4m-8 5H2"/>
    </svg>
    <span>FORECAST</span>
  </div>;
}

function SearchScreen({ query, setQuery, onSearch, onSelect, results, loading, status, showRefine, onRefine, inputRef }) {
  return <main className="landing" aria-label="Pesquisar localidade">
    <div className="landing-content">
      <h1 className="landing-title">Forecast</h1>
      <Frost className="search-glass">
        <form onSubmit={onSearch} className="search-form" role="search">
          <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 5 5"/></svg>
          <input ref={inputRef} type="search" enterKeyHint="search" autoComplete="off"
            placeholder="Busque uma cidade ou região" aria-label="Nome da cidade ou região" minLength={2} maxLength={100}
            value={query} onChange={event => setQuery(event.target.value)} />
          <button className="search-submit" type="submit" aria-label="Buscar cidade" disabled={loading}>
            {loading ? <span className="loading-spinner" aria-hidden="true"/> :
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6"/></svg>}
          </button>
        </form>
      </Frost>
      {status && <p className="search-status" role="status">{status}</p>}
      {results.length > 0 && <div className="search-results" aria-label="Localidades encontradas">
        {results.slice(0, 5).map(place =>
          <Frost key={place.id} className="search-result">
            <button type="button" onClick={() => onSelect(place)}>
              <span className="result-location"><strong>{place.name}</strong><small>{[place.admin1, place.country].filter(Boolean).join(" · ")}</small></span>
              <span className="result-arrow" aria-hidden="true">›</span>
            </button>
          </Frost>
        )}
      </div>}
      {showRefine && <button className="refine-button" type="button" onClick={onRefine}>Refinar busca</button>}
    </div>
  </main>;
}

function CurrentCard({ data, night }) {
  return <GlassPanel className="current-card">
    <div className="current-copy">
      <div className="eyebrow">AGORA</div>
      <div className="temperature">{degree(data.temperature)}<span>C</span></div>
      <div className="condition-name">{data.description || "Condição não informada"}</div>
    </div>
    <WeatherIcon code={data.code} night={night} size="hero" />
  </GlassPanel>;
}

function Metrics({ data }) {
  const entries = [
    ["MÍNIMA", degree(data.minimum) + "C"],
    ["MÁXIMA", degree(data.maximum) + "C"],
    ["SENSAÇÃO", degree(data.apparent) + "C"],
    ["UMIDADE", metricValue(data.humidity, "%")],
    ["VENTO", metricValue(data.wind, " km/h")]
  ];
  return <div className="metrics-grid">{entries.map(([label, value], i) =>
    <GlassPanel key={label} className={`metric-card metric-${i}`}>
      <span>{label}</span><strong>{value}</strong>
    </GlassPanel>)}</div>;
}

function TodayView({ data }) {
  const night = isNight(data.updatedAt);
  const periods = (data.periods || []).slice(0, 3);
  return <div className="weather-grid weather-today">
    <CurrentCard data={data.current} night={night} />
    <Metrics data={data.current} />
    <h2 className="section-title">Próximos períodos</h2>
    <div className="period-cards" style={{ "--period-count": String(Math.max(1, periods.length)) }}>
      {periods.length ? periods.map((p, i) => <GlassPanel key={i} className="period-card">
        <span className="period-label">{p.label}</span>
        <WeatherIcon code={p.code} night={/noite|madrugada/i.test(p.label)} size="small"/>
        <strong>{degree(p.temperature)}C</strong>
        <span className="period-condition">{p.description || "Condição não informada"}</span>
        <small>Chuva {metricValue(p.precipitation, "%")} · Vento {metricValue(p.wind, " km/h")}</small>
      </GlassPanel>) : <GlassPanel className="empty-card">Próximos períodos indisponíveis.</GlassPanel>}
    </div>
  </div>;
}

function ThreeDayView({ data }) {
  const days = (data.days || []).slice(0, 3);
  return <div className="weather-grid weather-three">
    <h2 className="section-title">Próximos 3 dias</h2>
    {days.map((d, i) => <GlassPanel key={d.date || i} className="day-card">
      <div className="day-copy">
        <h3>{d.fullLabel || d.label}</h3>
        <p>{d.description || "Condição não informada"}</p>
        <strong className="day-temp">{degree(d.minimum)}C – {degree(d.maximum)}C</strong>
        <small>Chuva {metricValue(d.precipitation, "%")} · Vento {metricValue(d.wind, " km/h")}</small>
      </div>
      <WeatherIcon code={d.code} size="large"/>
    </GlassPanel>)}
    {!days.length && <GlassPanel className="empty-card">Previsão de 3 dias indisponível.</GlassPanel>}
  </div>;
}

function WeekView({ data }) {
  const days = (data.days || []).slice(0, 7);
  return <div className="weather-grid weather-week" style={{ "--days-count": String(days.length) }}>
    <h2 className="section-title">Previsão da semana</h2>
    {days.map((d, i) => <GlassPanel key={d.date || i} className="week-card">
      <span className="week-day">{d.label}</span>
      <div className="week-condition"><WeatherIcon code={d.code} size="small"/><span>{d.description || "Condição não informada"}</span></div>
      <div className="week-values"><strong>{degree(d.minimum)}–{degree(d.maximum)}</strong><small>Chuva {metricValue(d.precipitation, "%")}</small></div>
    </GlassPanel>)}
    {!days.length && <GlassPanel className="empty-card">Previsão semanal indisponível.</GlassPanel>}
  </div>;
}

function StaticTabs({ value, onChange }) {
  return <Frost className="nav-glass">
    <nav className="period-tabs" aria-label="Período da previsão">
      <div className="period-indicator" aria-hidden="true" style={{ transform: `translateX(${["today", "three", "week"].indexOf(value) * 100}%)` }}/>
      {[["today", "Hoje"],["three", "3 dias"],["week", "Semana"]].map(([key, name]) =>
        <button type="button" key={key} className="period-button" aria-pressed={value === key} onClick={() => onChange(key)}>{name}</button>)}
    </nav>
  </Frost>;
}

function ForecastScreen({ selected, data, loading, error, onBack, onRetry, period, onPeriod }) {
  return <div className="forecast-screen">
    <header className="forecast-brand"><Brand /></header>
    <main className="forecast-body">
      <div className="forecast-heading">
        <div className="heading-copy"><span>PREVISÃO DO TEMPO</span><h1>{data?.location?.name || selected.name}</h1></div>
        <Frost className="back-glass"><button type="button" onClick={onBack}>Nova busca</button></Frost>
      </div>
      <div className="forecast-content" aria-live="polite">
        {loading ? <GlassPanel className="status-card">Consultando a previsão meteorológica…</GlassPanel>
          : error ? <GlassPanel className="status-card"><p>{error}</p><button type="button" onClick={onRetry}>Tentar novamente</button></GlassPanel>
          : data ? period === "today" ? <TodayView data={data} />
            : period === "three" ? <ThreeDayView data={data} /> : <WeekView data={data} /> : null}
      </div>
    </main>
    {data && <footer className="forecast-footer">
      <Suspense fallback={<StaticTabs value={period} onChange={onPeriod}/>}>
        <PeriodTabs value={period} onChange={onPeriod}/>
      </Suspense>
      <p className="source-credit">Fonte: <a href="https://open-meteo.com/" target="_blank" rel="noopener noreferrer">Open-Meteo</a> · <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer">CC BY 4.0</a>
        {typeof data.updatedAt === "string" && data.updatedAt.length >= 16 ? ` · Atualizado às ${data.updatedAt.slice(11, 16)}` : ""}
      </p>
    </footer>}
  </div>;
}

function ForecastApp() {
  const theme = useTelegramTheme();
  useViewHeight();
  const inputRef = useRef(null);
  const serial = useRef(0);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [status, setStatus] = useState("");
  const [showRefine, setShowRefine] = useState(false);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [selected, setSelected] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [loadingForecast, setLoadingForecast] = useState(false);
  const [forecastError, setForecastError] = useState("");
  const [period, setPeriod] = useState("today");

  useEffect(() => { telegram?.ready?.(); telegram?.expand?.(); }, []);

  const onQuery = value => {
    serial.current += 1;
    setQuery(value);
    setResults([]);
    setStatus("");
    setShowRefine(false);
    setLoadingSearch(false);
  };

  async function search(event) {
    event?.preventDefault?.();
    const cleaned = query.replace(/\s+/g, " ").trim();
    if (loadingSearch) return;
    if (cleaned.length < 2 || cleaned.length > 100) {
      setStatus("Digite entre 2 e 100 caracteres.");
      return;
    }
    const token = ++serial.current;
    setLoadingSearch(true);
    setShowRefine(false);
    setResults([]);
    setStatus("Buscando localidades…");
    try {
      const result = await callServerless("searchLocations", { query: cleaned });
      if (serial.current !== token) return;
      inputRef.current?.blur();
      const places = Array.isArray(result?.locations) ? result.locations.slice(0, 5) : [];
      setResults(places);
      setStatus(places.length ? "" : "Nenhuma localidade encontrada.");
      setShowRefine(true);
    } catch (error) {
      if (serial.current !== token) return;
      setStatus(readableError(error));
      setShowRefine(true);
    } finally {
      if (serial.current === token) setLoadingSearch(false);
    }
  }

  async function selectLocation(location) {
    const token = ++serial.current;
    setSelected(location);
    setForecast(null);
    setForecastError("");
    setPeriod("today");
    setLoadingForecast(true);
    inputRef.current?.blur();
    try {
      const result = await callServerless("getForecast", { id: String(location.id) });
      if (serial.current !== token) return;
      if (!result?.current || !Array.isArray(result.days)) throw new Error("Previsão indisponível.");
      setForecast(result);
    } catch (error) {
      if (serial.current !== token) return;
      setForecastError(readableError(error));
    } finally {
      if (serial.current === token) setLoadingForecast(false);
    }
  }

  function back() {
    serial.current += 1;
    setSelected(null);
    setForecast(null);
    setForecastError("");
    setResults([]);
    setShowRefine(false);
    setStatus("");
    setPeriod("today");
    setLoadingSearch(false);
  }

  const scene = sceneFor(forecast);
  return <div className="mini-app" data-screen={selected ? "forecast" : "home"} data-scenario={scene} data-theme={theme}>
    <div className="scene-background" style={{ backgroundImage: `url(/scenes/${scene}.svg)` }} aria-hidden="true"/>
    {selected ?
      <ForecastScreen selected={selected} data={forecast} loading={loadingForecast} error={forecastError}
        onBack={back} onRetry={() => selectLocation(selected)} period={period} onPeriod={setPeriod}/> :
      <SearchScreen query={query} setQuery={onQuery} onSearch={search} onSelect={selectLocation}
        results={results} loading={loadingSearch} status={status} showRefine={showRefine}
        onRefine={() => { setResults([]); setShowRefine(false); setStatus("Inclua estado ou país para refinar."); inputRef.current?.focus(); inputRef.current?.select(); }}
        inputRef={inputRef}/>
    }
  </div>;
}

createRoot(document.getElementById("root")).render(<ForecastApp />);
