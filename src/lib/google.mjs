import config from '../data/google.json' with { type: 'json' };

// These are public site identifiers, never service-account keys or API secrets.
if (typeof config.measurementId !== 'string' || (config.measurementId && !/^G-[A-Z0-9]+$/.test(config.measurementId))) {
  throw new Error('google.json measurementId must be empty or a real GA4 measurement ID');
}
if (typeof config.siteVerification !== 'string' || (config.siteVerification && !/^[A-Za-z0-9_-]+$/.test(config.siteVerification))) {
  throw new Error('google.json siteVerification must be empty or the Google HTML verification value');
}
export const google = config;
