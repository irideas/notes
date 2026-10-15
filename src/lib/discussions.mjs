import settings from '../data/discussions.json' with { type: 'json' };

export const discussionConfig = settings;
export const discussionKey = id => id.replace(/^en\//, '');
export const discussionMarker = key => `<!-- notes-article: ${key} -->`;
export const discussionUrl = number => `https://github.com/${settings.repository}/discussions/${number}`;

export function discussionFor(id) {
  const key = discussionKey(id);
  const number = settings.articles[key];
  if (!Number.isSafeInteger(number) || number < 1) throw new Error(`Missing discussion for ${key}. See docs/operations/discussions.md.`);
  return { key, number, url: discussionUrl(number) };
}

export function validateDiscussions(keys) {
  const errors = [];
  if (!/^[\w.-]+\/[\w.-]+$/.test(settings.repository)) errors.push('Invalid discussion repository');
  if (!settings.repositoryId || !settings.category || !settings.categoryId) errors.push('Missing repository/category configuration');
  const used = new Set();
  for (const [key, number] of Object.entries(settings.articles)) {
    if (!keys.has(key)) errors.push(`Discussion has no article pair: ${key}`);
    if (!Number.isSafeInteger(number) || number < 1) errors.push(`Invalid discussion number: ${key}`);
    if (used.has(number)) errors.push(`Discussion #${number} is assigned to multiple articles`);
    used.add(number);
  }
  for (const key of keys) if (!Object.hasOwn(settings.articles, key)) errors.push(`Missing discussion for ${key}`);
  return errors;
}
