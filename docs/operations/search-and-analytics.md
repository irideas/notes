# 搜索发现与访问统计

本页记录本站的 SEO、Google 访问统计配置和后续验证流程。发布权限与部署步骤仍以 [发布指南](deployment.md) 为准。

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
| `measurementId` | GA4 网站数据流的公开测量 ID，必须与正式域名的数据流一致。留空关闭统计控件及采集，不发送占位 ID。 |
| `siteVerification` | Search Console HTML 验证标签的 `content` 值，只有取得真实值后才填写；空值不生成标签。它独立于统计同意，不依赖 GA 验证所有权。 |

当前已配置站点的真实 GA4 测量 ID。Search Console 尚无验证值，所有权验证与 sitemap 提交待完成；其他搜索引擎的站长平台验证、提交也不能由代码或 robots 存在推断为完成。若平台要求 HTML 文件，按其真实文件名和内容放入 `public/`，发布后核对响应再在平台确认。不要虚构验证文件或登记未经执行的提交。

GA 用于已同意访问者的页面访问与来源；Google 搜索查询词、展示、点击和搜索排名需在 Search Console 的效果报告查看，不可从 GA referrer 还原全部搜索词。两个系统口径不同，也不会补回接入之前的访问记录。

## 同意、拒绝与撤回

[统计组件](../../src/components/GoogleAnalytics.astro) 与 [浏览器逻辑](../../src/lib/analytics-consent.mjs) 采用 Basic Consent Mode：

1. 首次访问展示当前语言的同意、拒绝和隐私说明入口；未同意或已拒绝时，不加载 Google tag、不预连接 Google、不发送无 Cookie ping。JavaScript 不运行时同样不采集。
2. 同意后才加载一次 gtag.js，按顺序设置默认拒绝、更新 `analytics_storage` 为 `granted`、初始化统计。`ad_storage`、`ad_user_data`、`ad_personalization` 始终为 `denied`；关闭 Google signals、广告个性化；不传账户 User-ID 或添加自定义身份字段。
3. 选择只以 `notes.analytics-consent` 保存在浏览器本地存储。页脚“统计设置 / Statistics settings”可重新打开控件；拒绝并停用会设置 GA 停用标记、清除本站 `_ga` 与该数据流的 Cookie、重载页面移除已加载标签。不会把已加载的标签切成会继续发送 ping 的拒绝模式。其他标签页同步撤回。
4. Cookie 域限制为当前正式主机。只有 `Astro.site` 的正式 origin 允许启用；localhost、预览域名和 404 页不采集。没有可用本地存储时，每次访问重新征求选择；当前访问仍执行同意或拒绝。
5. 中英文关于页披露统计用途、Google 处理的数据、Cookie、撤回入口及 Google 隐私说明。统计会受到拒绝、广告拦截、网络限制影响，不能当成全量访问量。

GA 后台的增强型衡量、保留期、Google signals 和广告关联需另行核验；本站代码不能证明这些后台选项已按要求保存。维护时不增加广告、跨站身份或额外事件；调整采集范围时同步更新双语披露并重新审视已有同意。

## 验证与日常维护

运行 `npm run check`：执行元信息及同意行为回归测试，重新构建，再检查所有页面、图片、结构化数据、robots 与 XML sitemap。检查器要求 sitemap 与可索引页面完全对应，双语链接与 HTML 一致，文章修改时间一致；Google 标记必须与配置一致，静态 HTML 不得提前加载或预连接 Google。

发布前在桌面、手机和两种语言检查：未选择时零 Google 请求；拒绝后及刷新后仍为零；同意后只加载一次正确 ID 的脚本；页脚重新打开并撤回后不再请求，Cookie 清除；语言切换定位对应页面。还要测试预览域名、存储不可用、跨标签页撤回。自动测试拦截 Google 请求，避免把测试流量发送到正式数据流。

发布后按本次合并 SHA 确认 Pages 工作流成功，再检查线上双语页面、robots、sitemap、404 和统计控件；用一次明确同意的测试访问检查网络请求和 GA 实时报告。浏览器请求成功不等于后台报表已确认；记录尚待完成的后台验证，不用旧部署的成功结果替代本次发布证据。

Search Console 获得授权后，验证 `https://notes.irideas.pro/`，提交 `https://notes.irideas.pro/sitemap.xml`，检查首页与中英文文章的 URL Inspection，随后观察索引与效果报告。提交与收录是不同阶段，不承诺立即出现查询词。

## 本次本地验证记录

2026-10-15 22:11（北京时间），Node.js 22.22.2：

- `npm ci` 成功；使用工作区 npm 缓存与 `XDG_CONFIG_HOME`。当前 shell 默认 Node 24，不作为本次验证运行时。
- `npm run check` 通过：13 项回归测试，Astro 构建 16 页，15 份 Markdown 与 1 对双语文章检查通过。sitemap 共 14 个可索引 URL、2 个文章实际修改时间；双语 404 均排除。
- 临时注入重复 canonical、缺失 404 noindex、缺失分享图 alt、错误 lastmod、无效 XML、提前加载 Google、无效 JSON-LD，七种错误全部被拒绝；恢复产物后检查通过。错误样例未提交。
- Chromium 在 390px 和 1440px 检查 14 个路由，无横向溢出；语言切换与手机文章目录有效。两语控件的同意前、拒绝及刷新后、撤回后均无 Google 请求；同意后仅加载一次正确脚本，撤回清除 Cookie。预览域名、不可用本地存储、跨标签页撤回、隐私说明入口均通过。
- 浏览器测试将站点资源映射到本地构建产物，并拦截、模拟 Google 脚本；没有向真实数据流发送测试流量。它证明控件和加载行为，不代表 GA 后台已经收到线上数据。线上发布与实时报告另按本次 PR/部署记录核验。
- `npm run discussion:check` 已尝试，环境的 GitHub GraphQL 请求返回 `Forbidden`，未记为通过。现有公开讨论 #1 可访问，包含两语文章回链；这不替代分类 ID、讨论唯一性的远端校验。本次未改文章内容、讨论登记或评论组件，本地双语同讨论检查通过。

界面截图：[中文手机](../development/screenshots/analytics-zh-mobile.png) · [英文桌面](../development/screenshots/analytics-en-desktop.png)。

官方依据：[Google Article](https://developers.google.com/search/docs/appearance/structured-data/article)、[站名](https://developers.google.com/search/docs/appearance/site-names)、[双语页面](https://developers.google.com/search/docs/specialty/international/localized-versions)、[sitemap](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap)、[Basic Consent Mode](https://developers.google.com/tag-platform/security/concepts/consent-mode)、[GA 配置字段](https://developers.google.com/analytics/devguides/collection/ga4/reference/config)。

返回：[开发指南](../development/guide.md) · [发布指南](deployment.md) · [项目入口](../../README.md)
