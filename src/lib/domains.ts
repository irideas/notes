export const domainNames = ['组织学习', '知识管理'] as const;
export const domains: Record<typeof domainNames[number], { english: string; slug: string; description: string; descriptionEn: string }> = {
  组织学习: {
    english: 'Organizational Learning', slug: 'organizational-learning',
    description: '组织如何从实践中获得认识，将其保留、共享，并据此改变行动。',
    descriptionEn: 'How organizations learn from practice, retain and share understanding, and change their actions accordingly.',
  },
  知识管理: {
    english: 'Knowledge Management', slug: 'knowledge-management',
    description: '组织如何获取、组织、共享和使用知识，以及维护其适用条件。',
    descriptionEn: 'How organizations acquire, organize, share and use knowledge, while maintaining its conditions of applicability.',
  },
};
