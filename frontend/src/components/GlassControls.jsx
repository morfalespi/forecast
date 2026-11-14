import React, { useEffect, useMemo, useRef, useState } from "react";
import { Glass, animateGlassValue, cubicBezier, glassValue } from "@samasante/liquid-glass";
import { Frost } from "./Frost";
import { SEGMENT, CONTROL } from "../lib/vidro";

export function isBlink() {
  const ua = navigator.userAgent;
  const data = navigator.userAgentData != null;
  return data || (/\b(?:Chrome|Chromium|Edg)\//.test(ua) && !/\b(?:CriOS|EdgiOS|FxiOS|OPiOS)\b/.test(ua) && !/iPhone|iPad|iPod/.test(ua));
}

export function GlassPill({ children, className = "" }) {
  return isBlink()
    ? <Glass className={`glass-pill ${className}`} optics={CONTROL}>{children}</Glass>
    : <Frost className={`glass-pill ${className}`} optics={CONTROL}>{children}</Frost>;
}

const PERIODS = [
  { key: "today", label: "Hoje" },
  { key: "three", label: "3 dias" },
  { key: "week", label: "Semana" }
];
const ease = cubicBezier(0.34, 1.36, 0.42, 1);

export function PeriodTabs({ value, onChange }) {
  const ref = useRef(null);
  const [measure, setMeasure] = useState({ w: 0, h: 0 });
  const [lensReady, setLensReady] = useState(false);
  const index = PERIODS.findIndex(period => period.key === value);
  const x = useMemo(() => glassValue((Math.max(0, index) + .5) / 3), []);
  const reduce = useMemo(() => window.matchMedia("(prefers-reduced-motion: reduce)"), []);
  const blink = useMemo(isBlink, []);
  const [reduced, setReduced] = useState(reduce.matches);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new ResizeObserver(entries => {
      const rect = entries[0]?.contentRect;
      if (rect) setMeasure({ w: rect.width, h: rect.height });
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    const listener = () => setReduced(reduce.matches);
    reduce.addEventListener("change", listener);
    return () => reduce.removeEventListener("change", listener);
  }, [reduce]);
  useEffect(() => {
    if (!blink) return;
    if ("requestIdleCallback" in window) {
      const id = window.requestIdleCallback(() => setLensReady(true), { timeout: 800 });
      return () => window.cancelIdleCallback?.(id);
    }
    const id = window.setTimeout(() => setLensReady(true), 280);
    return () => window.clearTimeout(id);
  }, [blink]);
  useEffect(() => {
    const target = (Math.max(0, index) + .5) / 3;
    if (reduced) {
      x.set(target);
      return;
    }
    const animation = animateGlassValue(x, target, { ease, duration: .52 });
    return () => animation.stop();
  }, [index, reduced, x]);

  const lensWidth = Math.max(0, measure.w / 3 - 6);
  const lensHeight = Math.max(0, measure.h - 6);
  const optics = useMemo(() => {
    const strength = SEGMENT.strength ?? .022;
    const narrow = Math.min(measure.w, measure.h);
    return measure.w && measure.h
      ? { ...SEGMENT, scaleX: strength * narrow / measure.w, scaleY: strength * narrow / measure.h }
      : SEGMENT;
  }, [measure.w, measure.h]);

  return (
    <Frost className="nav-glass">
      <nav className="period-tabs" ref={ref} aria-label="Período da previsão">
        <div className="period-indicator" aria-hidden="true" style={{ transform: `translateX(${Math.max(0, index) * 100}%)` }} />
        {blink && lensReady && lensWidth > 0 && (
          <div className="nav-optical-layer" aria-hidden="true">
            <Glass optics={optics} size={[lensWidth, lensHeight]} radius={lensHeight / 2} center={{ x, y: .5 }} filterResolution={1} style={{ position: "absolute", inset: 0, pointerEvents: "none" }} />
          </div>
        )}
        {PERIODS.map(period => (
          <button key={period.key} type="button" className="period-button"
            aria-pressed={period.key === value} onClick={() => onChange(period.key)}>
            {period.label}
          </button>
        ))}
      </nav>
    </Frost>
  );
}
