# 文章格式、时间与 Raw 交付

本文规定本站的内容源格式及其构建产物。它与 [内容原则](policy.md)、[写作指南](authoring.md) 一起约束人和 Agent 的写作与更新。

## 一份源文档，两种制品

每个语言版本的完整 Markdown 是唯一可编辑源。不要单独维护网页正文或另一份 Agent 摘要。`src/content/notes/` 中的文章采用 [OKF v0.2](https://github.com/GoogleCloudPlatform/open-knowledge-format/blob/ad30107c31c06aec8a7d5636e0d1058118604e6f/SPEC.md) 的概念文档结构：UTF-8 Markdown、YAML frontmatter、标准链接。

构建同时生成阅读页面与 `dist/raw/` 知识包；Raw 原稿逐字节保留源 Markdown，图片按原有相对路径导出。正文 Mermaid 在网页中生成 SVG，在 Raw 中保留图表源码。

OKF 的始终必需字段只有非空 `type`。`Article` 是本站选择的类型，不是官方枚举。下面的必填、双语、引用、时间及发布检查属于本站更严格的写作约定，不声称是通用 OKF 强制要求。整个代码仓库不是 OKF bundle；README、AGENTS 和项目指南不需改成概念文档。

## 元信息

字段类型由 [内容 schema](../../src/content.config.ts) 和 [共用时间约束](../../src/lib/content-metadata.mjs) 实现。本文解释含义，不另维护一份字段校验器。

| 字段 | 含义与填写原则 |
|---|---|
| `type` | 本站文章使用 `Article` |
| `title`、`description` | 当前标题与问题范围；正文不重复一级标题 |
| `language` | 当前文档语言，必须与中文或英文目录一致 |
| `date` | 本站首次发布日期，决定年月归档；发布后不变 |
| `created_at` | 已知的文档实际创建时刻，新稿在创建时记录 |
| `first_recorded_at`、`first_recorded_commit` | 旧稿实际创建时刻不明时，使用首次 Git 记录及完整提交 SHA；与 `created_at` 二选一 |
| `generated.by`、`generated.at` | 当前内容由谁产生、最后一次实质修改的时刻；初稿也填写 |
| `revision` | 实质修订说明，说明解释、证据或范围的变化；初稿可省略 |
| `tags` | 使用领域登记表的共享 key；至多两个，不翻译成另一套标识 |
| `sources`、`primary_source` | 单一来源集合，以及页面主要来源所引用的来源 ID |
| `asOf` | 现状或趋势分析的资料截止日期；按实际需要填写 |
| `cover`、`coverAlt`、`coverCredit` | 本地图片相对路径、准确替代文本及来源说明；有封面时成组填写 |

`type`、`title`、`description`、`tags`、`sources`、`generated` 为 OKF 定义的字段。`language`、`date`、创建/首次记录字段、`primary_source`、`revision`、`asOf` 和封面字段为本站扩展。

### 时间与编辑身份

日期只表示一个日历日，使用加引号的 `YYYY-MM-DD`，不能补成未知的具体时刻。实际时刻使用含秒及明确时区的字符串，例如 `2026-10-15T18:30:00+08:00`；该值仅为格式示例，不可复制为真实时间。本站发布约定采用 RFC 3339 的完整秒形式，不接受闰秒、小数秒或表示未知偏移的 `-00:00`。

- 写作时读取真实时钟；默认按 `Asia/Shanghai` 记录。页面统一按该时区展示时分，并注明 `UTC+08:00`。跨日显示按转换后的当地日期，不能直接截取 UTC 字符串。内容可能在首发或首次 Git 入库之前已经定稿，因此这些时刻不强制按发布、入库、修改排序；只有已知实际创建应不晚于内容修改。
- `generated.at` 表示最后实质修改，不是构建、导出、访问或部署时间。正文、依据、图表表达或重要元信息改变时更新；标点和纯排版勘误可仅由 Git 记录。不要为了刷新日期重新保存时间。
- 中英文分别记录实际创建/修改时刻和编辑者，可以不同；首次发布日期、论证和同一轮修订仍须保持对应并一起发布。
- `generated.by` 按 OKF actor 约定填写：人用 `human:<id>`，工具/Agent 用 `<producer>/<version>`，自动过程用 `process:<id>`。版本确实不可获取时明确写 `unknown-version`，不能猜测；不能把用户批准方案当成用户撰写了全文。
- Git 时间只证明版本记录。本次旧稿迁移由维护者核对完整历史后填写首次记录时间及 SHA；中文首次记录与英文首次记录分别取证。构建不读取文件 mtime、不用当前时间补历史，也不依赖 CI 浅克隆推算创建时间。

初版不记录 `verified`。构建通过只证明结构和制品检查通过，不等于内容相对来源已经核验，也不等于人类审阅了全文。

### 来源与逐项引用

所有来源只在 `sources` 中登记一次 URL。每项使用稳定 `id`、可追溯 `resource` 和当前语言的 `title`；可添加官方 `author` actor。本站扩展 `author_name` 用于作者显示名，`publication` 用于课程或刊物，`published_on` 用于原始材料的已知发布日期。

`primary_source` 仅引用一个已有 ID，页面据此生成主要来源信息，不再维护第二个 `source` 对象。未掌握原始材料修改时刻时，不填写 OKF 的 `last_modified`；原文发布日期不能冒充修改时刻。

```yaml
primary_source: original
sources:
  - id: original
    resource: https://example.org/original
    title: 原始材料标题
    author: human:author-id
    author_name: 原作者显示名
    publication: 课程、刊物或频道
```

正文在相应论断附近使用 `[^original]`，文末定义用途：

```markdown
这段解释依据原始材料。[^original]

[^original]: 主要来源；用于保留原始定义与解释顺序。
```

脚注 ID 与来源 ID 对应。网页从元信息为脚注补上链接；Raw 阅读者从 `sources` 解析同一地址。避免在正文重新手填同一个来源 URL。脚注需有引用与定义，登记的来源需在文中实际使用。研究、观点、假设案例与本站推断仍按内容原则区分。

## 知识包与链接

- 网页原址保持不变。中文原稿为 `/raw/YYYY/MM/slug.md`，英文为 `/raw/en/YYYY/MM/slug.md`。
- `/raw/index.md` 是总入口，按语言与年月逐层链接。构建生成各级索引；只有根索引带 `okf_version` frontmatter，子索引无 frontmatter。索引不放进 Astro 文章集合。
- `/raw/build.json` 记录构建提交 SHA 与工作区是否有未提交修改，不记录构建时钟。网页提供 Raw 发现链接和 JSON-LD 编码地址。
- 源码、图片与索引同批构建和发布；不能提交 `dist/`。开发服务也提供 Raw 预览；正式制品仍以 `npm run check` 生成并核验的结果为准。
- 网页的“Markdown 原稿”指本站原稿；“主要来源”指外部材料。工作区干净时，另提供固定提交 SHA 的 GitHub Raw 原稿链接；有未提交修改的本地预览隐藏该链接，避免指向旧正文。修订记录继续指向 Git 历史。
- 本地图片放在文章集合内，并用相对路径引用；导出后不能越出知识包边界。图片生成提示词等辅助 JSON 不进入知识包。
- 当前文章之间引用使用完整 HTTPS 规范地址。知识包索引使用相对 `.md` 链接。OKF 中 `/` 开头的路径表示 bundle 根，与网站根含义不同；新增本地文章互链规则时须同时实现网页映射与导出检查，不能直接混用。
- 旧稿历史由 Git 保留，本期不另建重复的 `log.md`。以后增加时须遵守 OKF 的日期分组规则。

Raw 和 OKF 只改变交付形式，内容使用范围仍遵循 [项目使用说明](../../README.md#维护与使用)。

## 验证

执行 `npm run check`，核对元信息与时区、来源与脚注对应、双语完整性、Raw 与源文档逐字节相同、导出图片与索引链接、页面原稿发现链接及 JSON-LD。修改校验逻辑时用可恢复的错误样例验证失败检测，恢复后再检查完整制品。

人工检查正文的意义、来源实际范围和两语一致性；确认桌面目录与手机右侧目录按钮、章节跳转、收起、键盘关闭及语言切换。最后按 [发布指南](../operations/deployment.md) 检查对应部署与线上两语页面、Raw 和索引。
