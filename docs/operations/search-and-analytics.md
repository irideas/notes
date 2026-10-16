# 搜索发现与访问统计

本页记录本站的 SEO 和后续验证流程。发布权限与部署步骤仍以 [发布指南](deployment.md) 为准。

## 搜索发现

- [统一页面模板](../../src/layouts/Base.astro) 生成每页唯一的标题、描述、指向自身的 canonical，以及简中、英文和中文回退 `x-default` 的 hreflang。两语各自保留规范地址；文章既有路径和归档年月不变。
- 文章描述来自原有 Markdown；月份归档描述来自当前语言的月份和文章数量；404 页使用自己的描述并标记 `noindex, follow`。不添加关键词堆砌或虚构的来源、发布日期和评分。
- 首页以 `WebSite` JSON-LD 表达已有中英文站名和站点根地址。文章延续 `Article`，补入已有封面；分享标签复用封面的 URL、尺寸及当前语言的 alt，修改时间来自 `generated.at`。Twitter 卡片复用 Open Graph 标题、描述和图片，不再维护第二套文案。
- Git 首次登记仍只表示 `dateCreated`，不能推断为首次公开的 `datePublished`。不为满足搜索提示而虚构发布时间。
- [sitemap](../../src/pages/sitemap.xml.ts) 列出全部可索引页面和双语配对，不包含 404。文章 `lastmod` 直接使用该语言版本的真实修改时间；没有可靠修改记录的列表页不附构建时间。
- [robots.txt](../../public/robots.txt) 已允许抓取并声明正式 sitemap，无需重复修改。结构化数据与 sitemap 是发现线索，不保证收录、排名或富结果展示。

## Google 配置

[google.json](../../src/data/google.json) 是公开配置的唯一来源，构建时由 [google.mjs](../../src/lib/google.mjs) 校验。不要填入 API 密钥、服务账户文件、浏览器 Cookie 或访问令牌。

| 字段 | 含义与维护 |
|---|---|
| `siteVerification` | Search Console HTML 验证标签的 `content` 值，只有取得真实值后才填写；空值不生成标签。它独立于统计同意，不依赖 GA 验证所有权。 |

Search Console 尚无验证值，所有权验证与 sitemap 提交待完成；其他搜索引擎的站长平台验证、提交也不能由代码或 robots 存在推断为完成。若平台要求 HTML 文件，按其真实文件名和内容放入 `public/`，发布后核对响应再在平台确认。不要虚构验证文件或登记未经执行的提交。

Search Console 获得授权后，验证 `https://notes.irideas.pro/`，提交 `https://notes.irideas.pro/sitemap.xml`，检查首页与中英文文章的 URL Inspection，随后观察索引与效果报告。提交与收录是不同阶段，不承诺立即出现查询词。

官方依据：[Google Article](https://developers.google.com/search/docs/appearance/structured-data/article)、[站名](https://developers.google.com/search/docs/appearance/site-names)、[双语页面](https://developers.google.com/search/docs/specialty/international/localized-versions)、[sitemap](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap)。

返回：[开发指南](../development/guide.md) · [发布指南](deployment.md) · [项目入口](../../README.md)
