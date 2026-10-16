import { domains } from './domains';
export type Locale = 'zh-CN' | 'en';
export const locales: Locale[] = ['zh-CN', 'en'];
export const localeOf = (id: string): Locale => id.startsWith('en/') ? 'en' : 'zh-CN';
export const pairKey = (id: string) => id.replace(/^en\//, '');
export const prefix = (locale: Locale) => locale === 'en' ? '/en' : '';
export const homeUrl = (locale: Locale) => `${prefix(locale)}/`;
export const localeFromPath = (path: string): Locale => path.startsWith('/en/') ? 'en' : 'zh-CN';
export function alternatePath(path: string, target: Locale) {
  const local = path.replace(/^\/en(?=\/)/, '');
  if (local.startsWith('/tags/')) {
    const value = decodeURIComponent(local.split('/')[2]);
    const entry = Object.entries(domains).find(([name, domain]) => value === name || value === domain.slug);
    if (entry) return `${prefix(target)}/tags/${target === 'en' ? entry[1].slug : encodeURIComponent(entry[0])}/`;
  }
  if (local === '/404.html' || local === '/404/') return target === 'en' ? '/en/404/' : '/404.html';
  return `${prefix(target)}${local}`;
}
const en = {
  siteTitle: 'Notes', siteDescription: 'Concepts, models and evidence for understanding how systems, organizations and human activities work—and forming judgments that can be revised.',
  skip: 'Skip to content', homeLabel: 'Notes, home', articles: 'Articles', archive: 'Archive', about: 'About', switchLanguage: '切换为简体中文', footer: 'Traceable sources. Revisable understanding.',
  eyebrow: 'EXPLANATION & ANALYSIS', titleFirst: 'Understand how ', titleLast: 'things work', dot: '.',
  introFirst: 'Clarify concepts and models. Examine mechanisms and change.', introLast: 'Form judgments grounded in evidence and open to revision.',
  latest: 'Latest article', allArticles: 'All articles', empty: 'No articles yet.', read: 'Read article', readLabel: 'Read: ', domains: 'Domains', months: 'By month', byPublication: 'By month',
  homeAsideFirst: 'Systems, organizations and human activity.', homeAsideLast: 'Start with concrete questions. Connect understanding with practice.', aboutSite: 'About this site',
  archiveTitle: 'Archive', archiveDescription: 'Browse by month. Updates retain their original links.', monthlyFirst: 'Articles in this month:',
  published: 'Published', updated: 'Updated', asOf: 'Evidence as of', minutes: 'About {n} min', source: 'Primary source', sourcePublished: 'Originally published', toc: 'On this page',
  created: 'Created', timeZone: 'Times in Asia/Shanghai (UTC+08:00)', tocButton: 'Contents',
  compiled: 'Compiled by irideas', revision: 'This revision:', markdown: 'Markdown (Raw)', history: 'Revision history', correction: 'Suggest a correction', correctionTitle: 'Correction: ',
  discussion: 'Discussion', discussionLink: 'View on GitHub', discussionIntro: 'Both language editions share this discussion. Sign in with GitHub to comment; comments remain in their original language.', discussionNoScript: 'Read and join the discussion on GitHub.',
  aboutTitle: 'From understanding to practice.', aboutDescription: 'Organizing concepts, models and evidence around concrete questions, and revising understanding through practice.',
  aboutOne: 'Notes is maintained by irideas. It organizes concepts, models and evidence to understand how things work, supporting everyday life, growth and shared practice.',
  aboutTwo: 'Current interests include systems engineering, business operations, organizational capabilities, human activity, and collaboration between people and AI, alongside relevant questions in economics, science and technology.',
  aboutHeading: 'From information to judgment', aboutThree: 'Materials come from courses, books, research, industry sources and observations from practice. Retain sources and context, clarify concepts and relationships, and develop usable understanding. Make judgments in light of goals and constraints, then revise them through feedback from practice.',
  aboutFour: 'Facts, source authors’ views and this site’s judgments are distinguished. Significant revisions are recorded.',
  subscribe: 'Subscribe via', viewHistory: 'View content and revision history on', or: 'or submit corrections and supporting evidence through',
  notFound: 'Page not found', notFoundDescription: 'Check the address or find an article in the archive.', backHome: 'Back to home',
};
const zh: Record<keyof typeof en, string> = {
  siteTitle: '记点儿信息', siteDescription: '梳理概念与模型，分析系统、组织与人类活动中的机制和变化，形成有依据、可修正的判断。',
  skip: '跳到正文', homeLabel: '记点儿信息，首页', articles: '文章', archive: '归档', about: '关于', switchLanguage: 'Switch to English', footer: '来源可追溯，认识可修正。',
  eyebrow: '解释与分析', titleFirst: '理解事物', titleLast: '如何运转', dot: '。', introFirst: '梳理概念与模型，分析机制与变化。', introLast: '形成有依据、可修正的判断。',
  latest: '最新文章', allArticles: '全部文章', empty: '暂无文章。', read: '阅读全文', readLabel: '阅读：', domains: '领域关键词', months: '按月归档', byPublication: '按年月归档',
  homeAsideFirst: '关注系统、组织与人类活动。', homeAsideLast: '从具体问题出发，连接认识与实践。', aboutSite: '关于本站',
  archiveTitle: '年月归档', archiveDescription: '按年月组织，内容更新保留原有链接。', monthlyFirst: '本月文章：',
  published: '发布', updated: '更新', asOf: '资料截至', minutes: '约 {n} 分钟', source: '主要来源', sourcePublished: '原文发布于', toc: '文章目录',
  created: '创建', timeZone: '时间为 Asia/Shanghai（UTC+08:00）', tocButton: '目录',
  compiled: '整理：irideas', revision: '本次更新：', markdown: 'Markdown 原稿（Raw）', history: '修订记录', correction: '更正建议', correctionTitle: '更正建议：',
  discussion: '讨论', discussionLink: '在 GitHub 中查看', discussionIntro: '中英文版本共用此讨论。登录 GitHub 后可发表评论；评论保留原文。', discussionNoScript: '可在 GitHub 中阅读和参与讨论。',
  aboutTitle: '从理解到实践。', aboutDescription: '围绕具体问题整理概念、模型与证据，理解事物如何运转，并在实践中修正认识。',
  aboutOne: '记点儿信息由 irideas 维护，整理概念、模型与证据，理解事物如何运转，服务于生活、成长与共同实践。',
  aboutTwo: '关注系统工程、企业经营、组织能力、人类活动及人与 AI 的协作，也涉及相关的经济、科学与技术问题。',
  aboutHeading: '从信息到判断', aboutThree: '材料来自课程、书籍、研究、行业资料与实践观察。保留来源与语境，理清概念与关系，积累可应用的认识；结合具体目标与约束作出判断，再通过实践反馈修正。',
  aboutFour: '事实、来源观点与本站判断分别说明，重要修改保留记录。',
  subscribe: '可以通过', viewHistory: '订阅更新，在', or: '查看内容与修改记录，或通过',
  notFound: '页面未找到', notFoundDescription: '请检查链接，或通过年月归档查找文章。', backHome: '返回首页',
};
export const ui = (locale: Locale) => locale === 'en' ? en : zh;
export const articleCount = (n: number, locale: Locale) => locale === 'en' ? `${n} article${n === 1 ? '' : 's'}` : `${n} 篇文章`;
