import raw from "../../vidro.ini?raw";

const sections = {};
let section = "";
for (const line of raw.split("\n")) {
  const text = line.trim();
  if (!text || text.startsWith("#")) continue;
  const next = text.match(/^\[(.+)\]$/);
  if (next) {
    section = next[1];
    sections[section] = {};
    continue;
  }
  const match = text.match(/^(\w+)\s*=\s*(.+)$/);
  if (!match || !sections[section]) continue;
  const input = match[2].trim();
  const value = input === "true" ? true : input === "false" ? false : /^[+-]?(?:\d+\.?\d*|\.\d+)$/.test(input) ? Number(input) : input;
  sections[section][match[1]] = value;
}
export const frost = Number(sections.vidro.frost);
export const saturate = Number(sections.vidro.saturate);
export const glassTint = {
  light: sections.vidro.tintClaro,
  dark: sections.vidro.tintEscuro
};
export const otica = (...groups) => Object.assign({}, sections.brilho, ...groups.map(group => sections[group] || {}));
export const FROST = { ...otica("fosco"), frost, saturate };
export const CONTROL = { ...otica("controles"), frost, saturate };
export const SEGMENT = otica("segmentado");

document.documentElement.style.setProperty("--vidro-frost", frost + "px");
document.documentElement.style.setProperty("--vidro-saturate", String(saturate));
document.documentElement.style.setProperty("--vidro-tint-claro", glassTint.light);
document.documentElement.style.setProperty("--vidro-tint-escuro", glassTint.dark);
