export const displayTimeZone = 'Asia/Shanghai';
export const displayOffset = 'UTC+08:00';
export const okfVersion = '0.2';
export const okfSpec = 'https://github.com/GoogleCloudPlatform/open-knowledge-format/blob/ad30107c31c06aec8a7d5636e0d1058118604e6f/SPEC.md';

export function isDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

// The publishing profile uses RFC 3339 seconds, a known UTC offset and no leap seconds.
export function isInstant(value) {
  if (typeof value !== 'string') return false;
  const match = value.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2}):(\d{2})(Z|[+-](\d{2}):(\d{2}))$/);
  return !!match && isDate(match[1]) && +match[2] < 24 && +match[3] < 60 && +match[4] < 60
    && (!match[6] || (+match[6] < 24 && +match[7] < 60)) && match[5] !== '-00:00'
    && Number.isFinite(Date.parse(value));
}

export const localDay = instant => new Intl.DateTimeFormat('en-CA', {
  timeZone: displayTimeZone, year: 'numeric', month: '2-digit', day: '2-digit',
}).format(new Date(instant));
export const formatInstant = (instant, language = 'zh-CN') => new Intl.DateTimeFormat(language, {
  timeZone: displayTimeZone, year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
}).format(new Date(instant));
export const rawUrl = id => `https://raw.githubusercontent.com/irideas/notes/main/src/content/notes/${id}.md`;
export const primarySource = data => data.sources?.[0];
export const isActor = value => typeof value === 'string' && /^(?:human:[^\s]+|process:[^\s]+|[^\s:/]+\/[^\s/]+)$/.test(value);
export function metadataErrors(data) {
  const sources = data.sources || [];
  return new Set(sources.map(source => source.id)).size === sources.length ? [] : ['Source IDs must be unique'];
}
