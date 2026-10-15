import { renderMermaidSVG } from 'beautiful-mermaid';

const escapeHtml = value => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const text = children => (children || []).map(child => child.value || text(child.children)).join('');

// Document-local plugin data keeps numbering stable across parallel page builds.
// SVGs inherit the site's colors; the published page needs no diagram runtime.
export default {
  name: 'notes-static-diagrams',
  heading(node, context) {
    context.data.diagramSection = text(node.children);
  },
  code(node, context) {
    if (node.lang !== 'mermaid') return;
    const number = (context.data.diagramNumber || 0) + 1;
    context.data.diagramNumber = number;
    const english = node.meta?.split(/\s+/).includes('en');
    const title = `${english ? 'Figure' : '图'} ${number}${english ? ': ' : '：'}${context.data.diagramSection || (english ? 'Relationships' : '关系图')}`;
    const hint = english ? 'Scroll horizontally for wide diagrams' : '宽图可横向滚动';
    let svg = renderMermaidSVG(node.value, {
      bg: 'var(--page)', fg: 'var(--ink)', line: 'var(--muted)',
      accent: 'var(--green)', muted: 'var(--ink)', surface: 'var(--soft)',
      border: 'var(--muted)', transparent: true,
      font: 'system-ui',
    });
    const diagramId = `notes-diagram-${number}`;
    for (const id of [...svg.matchAll(/\bid="([^"]+)"/g)].map(match => match[1])) {
      svg = svg.replaceAll(`id="${id}"`, `id="${diagramId}-${id}"`)
        .replaceAll(`url(#${id})`, `url(#${diagramId}-${id})`)
        .replaceAll(`href="#${id}"`, `href="#${diagramId}-${id}"`);
    }
    svg = svg.replace(/@import\s+url\([^)]*\);?/g, '')
      .replace(/text\s*\{[^}]*font-family:[^}]*\}/g, `#${diagramId} text { font-family: system-ui, "PingFang SC", "Microsoft YaHei", sans-serif; }`)
      .replace(/\bsvg\s*\{/g, `#${diagramId} {`)
      .replace('<svg ', `<svg id="${diagramId}" role="img" aria-label="${escapeHtml(title)}" `);
    context.replaceNode(node, {
      type: 'html',
      value: `<figure class="diagram"><div class="diagram-scroll" role="region" aria-label="${escapeHtml(title)}; ${hint}" tabindex="0">${svg}</div><figcaption>${escapeHtml(title)}<span class="diagram-hint"> · ${hint}</span></figcaption></figure>`,
    });
  },
};
