import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { XMLParser, XMLValidator } from 'fast-xml-parser';
import { google } from '../src/lib/google.mjs';
import analytics from '../src/data/analytics.json' with { type: 'json' };

const text = node => node.nodeName === '#text' ? node.value : (node.childNodes || []).map(text).join('');
export async function checkSeo({ dist, site, pages, report, publicLink }) {
  const indexable = new Map();
  const schemas = new Map();
  for (const [file, page] of pages) {
    const one = (matches, label) => {
      if (matches.length !== 1) report(file, `Expected exactly one ${label}`);
      return matches[0];
    };
    const meta = key => one(page.tags.filter(t => t.name === 'meta' && (t.a.name === key || t.a.property === key)), key)?.a.content;
    const title = one(page.tags.filter(t => t.name === 'title'), 'title');
    const description = meta('description');
    one(page.tags.filter(t => t.name === 'link' && t.a.rel === 'canonical'), 'canonical');
    for (const lang of ['zh-CN', 'en', 'x-default']) one(page.tags.filter(t => t.name === 'link' && t.a.hreflang === lang), `${lang} hreflang`);
    if (page.alternates.get('x-default') !== page.alternates.get('zh-CN')) report(file, 'x-default must reference the Chinese edition');
    if (meta('og:title') !== (title && text(title.node))) report(file, 'Open Graph title differs from title');
    if (meta('og:description') !== description) report(file, 'Open Graph description differs from description');
    if (meta('og:url') !== page.canonical) report(file, 'Open Graph URL differs from canonical');
    if (!meta('og:site_name')?.trim()) report(file, 'Missing Open Graph site name');
    if (meta('og:locale') !== (page.lang === 'en' ? 'en_US' : 'zh_CN')) report(file, 'Open Graph locale mismatch');
    if (meta('og:locale:alternate') !== (page.lang === 'en' ? 'zh_CN' : 'en_US')) report(file, 'Open Graph alternate locale mismatch');
    const type = meta('og:type');
    if (!['article', 'website'].includes(type)) report(file, 'Unexpected Open Graph type');
    const images = page.tags.filter(t => t.name === 'meta' && t.a.property === 'og:image');
    if (meta('twitter:card') !== (images.length ? 'summary_large_image' : 'summary')) report(file, 'Twitter card does not match image availability');
    if (images.length) {
      const image = meta('og:image');
      if (!image?.startsWith(`${site.origin}/`)) report(file, 'Share image must be an absolute site URL');
      else await publicLink(file, image, site);
      for (const dimension of ['width', 'height']) if (!(Number(meta(`og:image:${dimension}`)) > 0)) report(file, `Invalid share image ${dimension}`);
      if (!meta('og:image:alt')?.trim()) report(file, 'Share image needs alternative text');
    }
    const robotTags = page.tags.filter(t => t.name === 'meta' && t.a.name === 'robots');
    const isError = /\/(?:en\/)?404(?:\.html|\/)$/.test(new URL(page.canonical).pathname);
    const consent = page.tags.filter(t => t.a.id === 'analytics-consent');
    const settings = page.tags.filter(t => 'data-analytics-settings' in t.a);
    if (consent.length || settings.length) report(file, 'Retired analytics consent controls must be absent');
    if (page.tags.some(t => ['script', 'link', 'iframe', 'img'].includes(t.name) && /(?:googletagmanager|google-analytics)\.com/.test(t.a.src || t.a.href || ''))) report(file, 'Retired Google Analytics must not be loaded');
    if (page.tags.some(t => t.name === 'script' && /googletagmanager|google-analytics\.com|dataLayer|\bgtag\s*\(/.test(text(t.node)))) report(file, 'Retired Google Analytics initialization remains');
    const configTag = one(page.tags.filter(t => t.name === 'script' && t.a.id === 'web-analytics-config' && t.a.type === 'application/json'), 'Cloudflare analytics configuration');
    try {
      const config = JSON.parse(text(configTag?.node || {}));
      if (config.token !== analytics.cloudflareToken || config.productionOrigin !== site.origin || config.enabled !== !isError) report(file, 'Cloudflare analytics configuration differs from site settings');
    } catch { report(file, 'Invalid Cloudflare analytics configuration'); }
    for (const [name, value] of [['google-site-verification', google.siteVerification], ['msvalidate.01', google.bingSiteVerification]]) {
      const verification = page.tags.filter(t => t.name === 'meta' && t.a.name === name);
      const expected = new URL(page.canonical).pathname === '/' && value;
      if (expected ? verification.length !== 1 || verification[0].a.content !== expected || verification[0].node.parentNode?.tagName !== 'head' : verification.length) report(file, `${name} must match configuration and appear once in the root homepage head only`);
    }
    if (isError) {
      if (one(robotTags, '404 robots tag')?.a.content !== 'noindex, follow') report(file, '404 must be noindex, follow');
    } else {
      if (robotTags.some(t => /noindex|none/i.test(t.a.content))) report(file, 'Content page must remain indexable');
      indexable.set(page.canonical, page);
    }
    const json = [];
    for (const tag of page.tags.filter(t => t.name === 'script' && t.a.type === 'application/ld+json')) {
      try { json.push(JSON.parse(text(tag.node))); } catch { /* The project checker reports invalid JSON. */ }
    }
    schemas.set(page.canonical, json);
    if (type === 'article') {
      const article = one(json.filter(s => s['@type'] === 'Article'), 'Article JSON-LD');
      if (article) {
        if (article['@context'] !== 'https://schema.org' || article.inLanguage !== page.lang || article.mainEntityOfPage !== page.canonical) report(file, 'Article identity differs from page');
        if (article.description !== description) report(file, 'Article description differs from page');
        if (article.image !== images[0]?.a.content) report(file, 'Article image differs from share image');
        if (meta('article:modified_time') !== article.dateModified) report(file, 'Article share date differs from JSON-LD');
      }
    }
    if (['/', '/en/'].includes(new URL(page.canonical).pathname)) {
      const website = one(json.filter(s => s['@type'] === 'WebSite'), 'WebSite JSON-LD');
      if (!website?.name?.trim() || !website?.alternateName?.trim() || website?.url !== site.href) report(file, 'WebSite must name the site and its root homepage');
    }
    if (page.ids.has('analytics-privacy')) report(file, 'Removed analytics privacy section must stay absent');
  }
  const robotsFile = resolve(dist, 'robots.txt');
  const robots = await readFile(robotsFile, 'utf8').catch(() => '');
  if (!robots.split(/\r?\n/).includes(`Sitemap: ${new URL('/sitemap.xml', site).href}`)) report(robotsFile, 'Missing canonical sitemap discovery');
  if (!/^User-agent: \*$/m.test(robots) || !/^Allow: \/$/m.test(robots) || /^Disallow:\s*\/\s*$/m.test(robots)) report(robotsFile, 'robots.txt must allow public crawling');

  const sitemapFile = resolve(dist, 'sitemap.xml');
  const source = await readFile(sitemapFile, 'utf8').catch(() => '');
  const valid = XMLValidator.validate(source);
  if (valid !== true) { report(sitemapFile, `Invalid sitemap XML: ${valid.err.msg}`); return; }
  const parsed = new XMLParser({ ignoreAttributes: false, parseTagValue: false, isArray: name => ['url', 'xhtml:link'].includes(name) }).parse(source);
  if (parsed.urlset?.['@_xmlns'] !== 'http://www.sitemaps.org/schemas/sitemap/0.9' || parsed.urlset?.['@_xmlns:xhtml'] !== 'http://www.w3.org/1999/xhtml') report(sitemapFile, 'Missing sitemap namespaces');
  const seen = new Set();
  for (const entry of parsed.urlset?.url || []) {
    const page = indexable.get(entry.loc);
    if (!page || seen.has(entry.loc)) report(sitemapFile, `Unexpected or duplicate sitemap URL: ${entry.loc}`);
    seen.add(entry.loc);
    if (!page) continue;
    const article = schemas.get(entry.loc)?.find(s => s['@type'] === 'Article');
    if (entry.lastmod !== article?.dateModified) report(sitemapFile, `lastmod must use the article's actual modification time: ${entry.loc}`);
    const alternates = entry['xhtml:link'] || [];
    for (const lang of ['zh-CN', 'en']) {
      const links = alternates.filter(link => link['@_hreflang'] === lang);
      if (links.length !== 1 || links[0]['@_rel'] !== 'alternate' || links[0]['@_href'] !== page.alternates.get(lang)) report(sitemapFile, `Sitemap ${lang} alternate differs from HTML: ${entry.loc}`);
    }
  }
  for (const url of indexable.keys()) if (!seen.has(url)) report(sitemapFile, `Indexable page missing from sitemap: ${url}`);
}
