import crypto from 'node:crypto';

const BASE_FONT = 'Verdana, Arial, sans-serif';

export const PRESETS = {
  default: {
    description: 'Neutral blue-gray on white. Safe for any document.',
    colors: {
      background: '#FFFFFF', text: '#1F2937', line: '#475569', border: '#475569',
      primary: '#E8F0FA', secondary: '#F3F4F6', accent: '#2563EB', note: '#FEF9C3',
      levels: ['#DBEAFE', '#E0F2FE', '#F1F5F9', '#F8FAFC'],
    },
  },
  ocean: {
    description: 'Blues and teals.',
    colors: {
      background: '#F5FAFF', text: '#0B2540', line: '#1E4E79', border: '#1E4E79',
      primary: '#CFE6FF', secondary: '#E6F2FF', accent: '#0077B6', note: '#E0F7FA',
      levels: ['#B8DAFF', '#D4E8FF', '#E6F2FF', '#F2F8FF'],
    },
  },
  forest: {
    description: 'Greens, calm and low contrast.',
    colors: {
      background: '#F7FBF5', text: '#1B3A24', line: '#2E5E3A', border: '#2E5E3A',
      primary: '#D3EDCB', secondary: '#E8F5E3', accent: '#2F855A', note: '#FFF8DC',
      levels: ['#BFE3B4', '#D3EDCB', '#E4F4DE', '#F1F9EE'],
    },
  },
  sunset: {
    description: 'Warm oranges and reds.',
    colors: {
      background: '#FFF9F3', text: '#3B1F14', line: '#8A3B12', border: '#8A3B12',
      primary: '#FFD9B3', secondary: '#FFEBD6', accent: '#E4572E', note: '#FFF3C4',
      levels: ['#FFC48C', '#FFD9B3', '#FFE8D0', '#FFF3E6'],
    },
  },
  grape: {
    description: 'Purples.',
    colors: {
      background: '#FAF7FF', text: '#2A1A4A', line: '#5B3FA0', border: '#5B3FA0',
      primary: '#E2D4FA', secondary: '#EFE6FD', accent: '#7C3AED', note: '#FDF4FF',
      levels: ['#D3BFF5', '#E2D4FA', '#EEE5FC', '#F6F1FE'],
    },
  },
  mono: {
    description: 'Grayscale. Prints well in black and white.',
    colors: {
      background: '#FFFFFF', text: '#111111', line: '#222222', border: '#222222',
      primary: '#EEEEEE', secondary: '#F7F7F7', accent: '#000000', note: '#FFFFFF',
      levels: ['#D0D0D0', '#E2E2E2', '#EFEFEF', '#F8F8F8'],
    },
  },
  dark: {
    description: 'Dark background, light lines.',
    colors: {
      background: '#0F172A', text: '#E2E8F0', line: '#94A3B8', border: '#94A3B8',
      primary: '#25436E', secondary: '#1E293B', accent: '#38BDF8', note: '#3B3A1A',
      levels: ['#2B4C7E', '#233E66', '#1B314F', '#15243B'],
    },
  },
  'high-contrast': {
    description: 'Black on white and yellow, for accessibility.',
    colors: {
      background: '#FFFFFF', text: '#000000', line: '#000000', border: '#000000',
      primary: '#FFFF99', secondary: '#FFFFFF', accent: '#0000CC', note: '#CCFFCC',
      levels: ['#FFD54F', '#FFF59D', '#FFFDE7', '#FFFFFF'],
    },
  },
};

const COLOR_KEYS = ['background', 'text', 'line', 'border', 'primary', 'secondary', 'accent', 'note'];
const HEX = /^#[0-9a-fA-F]{6}$/;

export function resolveTheme(settings = {}) {
  const presetName = settings.preset ?? 'default';
  const preset = PRESETS[presetName];
  if (!preset) throw new Error(`Unknown theme preset "${presetName}". Available: ${Object.keys(PRESETS).join(', ')}`);
  const colors = { ...preset.colors, levels: [...preset.colors.levels] };
  const overrides = settings.colors ?? {};
  for (const key of COLOR_KEYS) if (overrides[key] !== undefined) colors[key] = overrides[key];
  if (overrides.levels !== undefined) {
    if (!Array.isArray(overrides.levels) || overrides.levels.length !== 4) throw new Error('theme.colors.levels needs exactly 4 colors');
    colors.levels = [...overrides.levels];
  }
  for (const value of [...COLOR_KEYS.map((k) => colors[k]), ...colors.levels]) {
    if (!HEX.test(value)) throw new Error(`Theme colors must be #RRGGBB hex values, got "${value}"`);
  }
  return {
    preset: presetName,
    colors,
    font: settings.font || BASE_FONT,
    fontSize: Number(settings.fontSize) || 14,
    roundCorner: settings.roundCorner === undefined || settings.roundCorner === null ? 6 : Number(settings.roundCorner),
  };
}

export function themeHash(theme) {
  return crypto.createHash('sha256').update(JSON.stringify(theme)).digest('hex').slice(0, 12);
}

export function plantumlSkin(theme) {
  const { colors: c } = theme;
  const element = (name) => `skinparam ${name} {\n  BackgroundColor ${c.primary}\n  BorderColor ${c.border}\n  FontColor ${c.text}\n}`;
  const lines = [
    `skinparam backgroundColor ${c.background}`,
    `skinparam defaultFontName ${theme.font.split(',')[0].trim()}`,
    `skinparam defaultFontSize ${theme.fontSize}`,
    `skinparam defaultFontColor ${c.text}`,
    'skinparam shadowing false',
    `skinparam roundCorner ${theme.roundCorner}`,
    `skinparam ArrowColor ${c.line}`,
    `skinparam ArrowFontColor ${c.text}`,
    `skinparam NoteBackgroundColor ${c.note}`,
    `skinparam NoteBorderColor ${c.border}`,
    `skinparam NoteFontColor ${c.text}`,
    ...['class', 'entity', 'participant', 'actor', 'database', 'component', 'node', 'usecase', 'interface'].map(element),
    `skinparam state {\n  BackgroundColor ${c.primary}\n  BorderColor ${c.border}\n  FontColor ${c.text}\n  StartColor ${c.line}\n  EndColor ${c.line}\n  ArrowColor ${c.line}\n}`,
    `skinparam package {\n  BackgroundColor ${c.secondary}\n  BorderColor ${c.border}\n  FontColor ${c.text}\n}`,
    `skinparam sequence {\n  LifeLineBorderColor ${c.line}\n  LifeLineBackgroundColor ${c.primary}\n  ArrowColor ${c.line}\n  GroupBorderColor ${c.border}\n  GroupBackgroundColor ${c.secondary}\n}`,
  ];
  c.levels.forEach((color, index) => {
    lines.push(`skinparam package<<level${index + 1}>> {\n  BackgroundColor ${color}\n  BorderColor ${c.border}\n  FontColor ${c.text}\n}`);
  });
  c.levels.forEach((_, index) => lines.push(`hide <<level${index + 1}>> stereotype`));
  return lines.join('\n');
}

export function applyPlantumlTheme(source, theme) {
  if (!/^@startuml/m.test(source)) return source;
  const skin = plantumlSkin(theme);
  const themeLine = /^!theme .*$/m.exec(source);
  if (themeLine) {
    const end = themeLine.index + themeLine[0].length;
    return `${source.slice(0, end)}\n${skin}${source.slice(end)}`;
  }
  return source.replace(/^@startuml[^\n]*/m, (m) => `${m}\n${skin}`);
}

export function mermaidConfig(theme) {
  const { colors: c } = theme;
  return {
    theme: 'base',
    themeVariables: {
      background: c.background,
      fontFamily: theme.font,
      fontSize: `${theme.fontSize + 2}px`,
      primaryColor: c.primary,
      primaryTextColor: c.text,
      primaryBorderColor: c.border,
      secondaryColor: c.secondary,
      secondaryTextColor: c.text,
      secondaryBorderColor: c.border,
      tertiaryColor: c.secondary,
      tertiaryTextColor: c.text,
      lineColor: c.line,
      textColor: c.text,
      noteBkgColor: c.note,
      noteTextColor: c.text,
      noteBorderColor: c.border,
      actorBkg: c.primary,
      actorBorder: c.border,
      actorTextColor: c.text,
      signalColor: c.line,
      signalTextColor: c.text,
      labelBoxBkgColor: c.secondary,
      labelBoxBorderColor: c.border,
      altBackground: c.secondary,
      activationBkgColor: c.primary,
      activationBorderColor: c.border,
      attributeBackgroundColorOdd: c.primary,
      attributeBackgroundColorEven: c.secondary,
    },
  };
}

export function mermaidClassDefs(theme) {
  const { colors: c } = theme;
  return c.levels.map((color, index) => `classDef level${index + 1} fill:${color},stroke:${c.border},color:${c.text}`).join('\n');
}

export function applyMermaidTheme(source, theme) {
  if (!/:::level[1-4]/.test(source)) return source;
  return `${source.replace(/\s+$/, '')}\n${mermaidClassDefs(theme).split('\n').map((l) => `  ${l}`).join('\n')}\n`;
}

export function cssVariables(theme) {
  const { colors: c } = theme;
  return [
    `--bg:${c.background}`, `--text:${c.text}`, `--line:${c.line}`, `--border:${c.border}`,
    `--primary:${c.primary}`, `--secondary:${c.secondary}`, `--accent:${c.accent}`, `--note:${c.note}`,
    ...c.levels.map((color, i) => `--level${i + 1}:${color}`),
    `--font:${theme.font}`,
  ].join(';');
}
