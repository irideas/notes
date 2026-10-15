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
export const rawUrl = id => `/raw/${id}.md`;
export const primarySource = data => data.sources?.find(source => source.id === data.primary_source);
export const isActor = value => typeof value === 'string' && /^(?:human:[^\s]+|process:[^\s]+|[^\s:/]+\/[^\s/]+)$/.test(value);

export function metadataErrors(data) {
  const errors = [];
  if (!!data.created_at === !!data.first_recorded_at) errors.push('Provide exactly one of created_at or first_recorded_at; do not infer creation from Git');
  if (!!data.first_recorded_at !== !!data.first_recorded_commit) errors.push('first_recorded_at requires its full first_recorded_commit evidence');
  if (isInstant(data.created_at) && isInstant(data.generated?.at) && Date.parse(data.created_at) > Date.parse(data.generated.at)) errors.push('Content modification precedes known creation');
  if (data.revision && !data.generated) errors.push('A revision requires generated.by and generated.at');
  const sources = data.sources || [];
  if (new Set(sources.map(source => source.id)).size !== sources.length) errors.push('Source IDs must be unique');
  if (data.primary_source && !primarySource(data)) errors.push('primary_source must reference an existing sources[].id');
  return errors;
}
