export const domainNames = ['组织学习', '知识管理'] as const;

export const domains: Record<typeof domainNames[number], { english: string; description: string }> = {
  组织学习: {
    english: 'Organizational Learning',
    description: '组织如何从实践中获得认识，将其保留、共享，并据此改变行动。',
  },
  知识管理: {
    english: 'Knowledge Management',
    description: '组织如何获取、组织、共享和使用知识，以及维护其适用条件。',
  },
};
