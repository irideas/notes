# 开发与验证

环境和操作均以仓库为单位，不需要维护者的本机目录或专用 Agent 工具。开始前按 [贡献指南](../../CONTRIBUTING.md) 确定任务范围。

## 环境与命令

Node.js 默认版本在 [.nvmrc](../../.nvmrc)，最低兼容约束在 [package.json](../../package.json)。CI 使用 `.nvmrc`；修改运行时要求时同步检查两者。已有版本管理器可执行 `nvm use`，也可自行安装该版本，不强制使用 nvm。

在仓库根目录执行 `npm ci`，使用锁文件安装依赖。调整依赖时用 npm 同步更新 `package.json` 和 `package-lock.json`，不要只改锁文件或依赖已安装的间接包。

| 命令 | 用途 |
|---|---|
| `npm run dev` | 本地开发，打开输出的 Local 地址 |
| `npm run dev:stop` | 停止本仓库的开发服务 |
| `npm run build` | 生成静态阅读页，强制刷新内容缓存 |
| `npm run preview` | 预览上一次构建产物，不自动重新构建 |
| `npm run preview:stop` | 停止本仓库的预览服务 |
| `npm run check` | 重新构建一次，再检查文档与生成产物 |
| `npm run discussion:ensure -- KEY` | 查询文章讨论；显式 `--create` 才创建或恢复登记，见 [讨论指南](../operations/discussions.md) |
| `npm run discussion:check` | 发布前只读核验远端讨论，需 GitHub CLI |

端口被占用时，可使用 `npm run dev -- --port 4322`。服务可能在后台继续运行，即使命令已经退出；任务结束时停止自己启动的服务，保留他人服务。改动代码或资源后，开发页确认已热更新；预览产物则先重新构建再刷新。

## 文件地图

| 对象 | 维护位置 |
|---|---|
| 中文文章与共享封面 | `src/content/notes/YYYY/MM/` |
| 对应英文文章 | `src/content/notes/en/YYYY/MM/` |
| 语言、界面文案与配对路由 | `src/lib/i18n.ts` |
| 标准元信息与共用时间约束 | `src/content.config.ts`、`src/lib/content-metadata.mjs` |
| 源文档解析、Markdown 封面与 Git 创建记录 | `src/lib/article-source.mjs` |
| 来源脚注的链接与界面语言 | `src/lib/source-footnotes.mjs` |
| 领域词、中英文定义和范围 | `src/lib/domains.ts` |
| 列表语言过滤、排序、URL 与日期工具 | `src/lib/notes.ts` |
| 通用页面、导航、SEO 与语言切换 | `src/layouts/Base.astro` |
| 页面路由入口及文章渲染 | `src/pages/`，文章模板为 `src/pages/[...id].astro` |
| 中英文共用的首页、关于、归档、月份与领域页面主体 | `src/components/Home.astro`、`About.astro`、`Archive.astro`、`Month.astro`、`Domain.astro` |
| 列表卡片 | `src/components/NoteCard.astro` |
| 文章评论与共用讨论登记 | `src/components/Comments.astro`、`src/data/discussions.json`、`src/lib/discussions.mjs` |
| 讨论创建与远端核验、允许来源 | `scripts/discussions.mjs`、`giscus.json` |
| 全站样式与响应式布局 | `src/styles/global.css` |
| 静态 Mermaid 渲染 | `src/lib/markdown-diagrams.mjs` 与 `astro.config.mjs` |
| RSS 与 sitemap | `src/pages/rss.xml.js`、`src/pages/sitemap.xml.ts` |
| 图标与爬虫配置 | `public/` |
| 本地及 CI 命令 | `package.json` 的 scripts |
| 检查实现 | `scripts/check-project.mjs`、`scripts/check-articles.mjs`、`scripts/check-metadata.test.mjs` |
| PR 检查和生产发布 | `.github/workflows/check.yml`、`deploy.yml` |

`docs/` 是项目文档，不作为站点文章发布。`node_modules/`、`.astro/` 和 `dist/` 是生成内容，不提交。字段、领域词、命令实现与部署行为各维护一个来源；指南解释其含义，不另抄完整登记表。

## 检查与通过条件

运行 `npm run check`。命令退出码为 0 才算自动检查通过；错误会指出文件和问题。它先运行时间、身份与元信息语义的回归测试，再执行以下检查：

1. Astro 构建：按 schema 验证字段、真实日期、领域词、图片引用与带时区的修改时间；图表语法错误使构建失败。
2. 源文档：文章目录采用归档年月；正文不重复一级标题；根入口、项目文档和文章的本地文件链接及 Markdown 片段可解析。代码示例中的链接不参与扫描。
3. 生成页面：内部链接、锚点、图片、脚本、样式存在；每页一个一级标题，ID 唯一，SEO 元信息、语言属性与互相对应的 hreflang 存在，规范地址指向本页，SVG 片段引用有效；无未渲染 Mermaid 代码或公开 DIKW 框架术语。
4. 双语：每篇有中英两版，来源 ID/URL、首项主要来源、领域词和封面对应，实际编辑时刻独立记录，主要标题、表格与图表数量一致。
5. RSS 和 sitemap：产物存在，其列出的本站页面可找到，两个订阅源不混入另一语言文章。
6. OKF 与原稿：只使用标准字段，来源脚注对应；Markdown 封面只渲染一次；GitHub Raw 地址和发现链接指向当前语言原稿，页面时间与 JSON-LD 对应，不生成本站原稿或提交链接。
7. 评论：每个文章对恰有一个登记编号，无跨文章重复编号或多余登记；两语产物加载同一讨论，界面语言、浅色主题、延迟加载和 GitHub 直达链接正确。远端实际存在性另由 `npm run discussion:check` 核验。

它不联网逐条探测外链，也不证明来源真实、论证成立或画面正确。来源核验由 [内容原则](../content/policy.md) 与编辑审核负责。

与变更有关的人工检查：

- 内容：术语层级、引用与推断、完整性、日期和来源归属。
- 页面或封面：桌面和手机，无整页横向溢出；浅色排版可读，文/A切换到相应文章、月份或领域；目录跳转、当前章节、桌面侧栏与手机右侧固定按钮正确；手机目录展开、跳转后收起、外部点击与 Escape 关闭有效；封面小图和大图均合适。
- 图表：文字、方向和关系正确；窄屏宽图在图内滚动。
- 评论：两语同一讨论、界面语言及手机布局正确；真实登录后的发帖/回复按 [讨论指南](../operations/discussions.md) 单独核验，未执行时说明范围。

工具不可用时报告未检查的项目与原因，不把缺少证据写成通过。格式设计与来源约定见 [文章格式](../content/format.md)。只执行与变更有关的检查；通过后有新增修改或失败再重跑。

## 修改检查与工作流

检查器使用成熟的 YAML、Markdown 和 HTML 解析器，不用正则表达式重写完整语法。若修改检查器，用临时、可恢复的错误样例确认失败检测，再恢复文件运行完整检查。不要提交这些错误样例。

PR 和生产构建复用同一检查入口；PR 不部署。工作流存在不代表仓库已经开启强制状态检查或分支保护。部署操作与成功标准见 [发布指南](../operations/deployment.md)。

返回：[贡献指南](../../CONTRIBUTING.md) · [项目入口](../../README.md)
