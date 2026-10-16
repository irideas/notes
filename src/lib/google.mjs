import config from '../data/google.json' with { type: 'json' };

// These are public site identifiers, never service-account keys or API secrets.
if (typeof config.siteVerification !== 'string' || (config.siteVerification && !/^[A-Za-z0-9_-]+$/.test(config.siteVerification))) {
  throw new Error('google.json siteVerification must be empty or the Google HTML verification value');
}
if (typeof config.bingSiteVerification !== 'string' || (config.bingSiteVerification && !/^[A-Fa-f0-9]{32}$/.test(config.bingSiteVerification))) {
  throw new Error('google.json bingSiteVerification must be empty or the Bing HTML verification value');
}
export const google = config;
