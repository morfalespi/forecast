import React from "react";
import { FROST, frost, saturate } from "../lib/vidro";

export function Frost({ className = "", optics = FROST, style, children, ...props }) {
  const blur = Math.max(0, Number(optics.frost ?? frost));
  const sat = Number(optics.saturate ?? saturate);
  const filter = [blur ? `blur(${blur}px)` : "", sat !== 1 ? `saturate(${sat})` : ""].filter(Boolean).join(" ") || "none";
  return (
    <div className={className} {...props} style={{ backdropFilter: filter, WebkitBackdropFilter: filter, ...style }}>
      {children}
    </div>
  );
}

export function GlassPanel({ children, className = "" }) {
  return <Frost className={`glass-panel ${className}`}>{children}</Frost>;
}
