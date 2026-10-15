// URLs live once, in sources. Raw footnotes carry the reading purpose; HTML adds the link.
export const sourceFootnotes = {
  name: 'notes-source-footnotes',
  footnoteDefinition(node, context) {
    const sources = context.data.astro?.frontmatter?.sources || [];
    const source = sources.find(item => item.id === node.identifier);
    if (!source) return;
    const link = { type: 'link', url: source.resource, children: [{ type: 'text', value: source.title }] };
    const first = node.children[0];
    if (first?.type === 'paragraph') context.replaceNode(node, {
      type: 'footnoteDefinition', identifier: node.identifier, label: node.label,
      children: [{ type: 'paragraph', children: [link, { type: 'text', value: ' — ' }, ...first.children] }, ...node.children.slice(1)],
    });
  },
};
export const footnoteLabels = {
  name: 'notes-footnote-labels',
  element: { filter: ['h2','a'], visit(node, context) {
    const chinese = context.data.astro?.frontmatter?.language === 'zh-CN';
    if (node.tagName === 'a') {
      const label = node.properties?.ariaLabel || node.properties?.['aria-label'];
      if (chinese && label?.startsWith('Back to reference ')) context.replaceNode(node, {
        type: 'element', tagName: 'a', properties: { ...node.properties, ariaLabel: label.replace('Back to reference ', '返回引用 ') }, children: [...node.children],
      });
      return;
    }
    if (node.properties?.id !== 'footnote-label') return;
    context.replaceNode(node, {
      type: 'element', tagName: 'h2', properties: { ...node.properties, className: ['sr-only'] },
      children: [{ type: 'text', value: chinese ? '来源与用途' : 'Source notes' }],
    });
  } },
};
