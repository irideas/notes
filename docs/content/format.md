# 文章格式与元信息

每个语言版本维护一份完整 Markdown，采用 [OKF v0.2](https://github.com/GoogleCloudPlatform/open-knowledge-format/blob/ad30107c31c06aec8a7d5636e0d1058118604e6f/SPEC.md) 的标准结构：UTF-8 正文、YAML frontmatter、标准链接。文章保留完整解释层次。

## 只使用标准字段

当前写作约定使用下列 OKF 字段，不添加自定义 frontmatter：

| 字段 | 用途 |
|---|---|
| `type` | 使用 `Article`；这是本站选择的类型值，不是官方枚举 |
| `title` | 当前标题，正文不重复一级标题 |
| `description` | 简洁说明问题和解释范围 |
| `tags` | 至多两个领域登记表 key，两语共享标识 |
| `generated.by`、`generated.at` | 实际编辑者或工具，以及最后一次实质修改时刻 |
| `sources` | 来源集合；主要来源放在首项 |

来源项只使用标准的 `id`、`resource`、`title`、可选 `author`。原作者、课程或出版信息、发布日期等语境写在来源标题或脚注文字中；不把原文发布日期当作其修改时刻。

OKF 只有非空 `type` 始终必需；上述必填、双语、领域和引用要求是本站写作约定，不冒充通用 OKF 强制要求。初版不记录 `verified`，结构检查通过不能代表内容已被证实或全文经过人类审核。字段实现以 [内容 schema](../../src/content.config.ts) 为准。

## 创建与修改

- `generated.at` 使用带明确时区和秒的真实时间，例如 `2026-10-15T18:30:00+08:00`。示例仅说明格式，不可直接复制成真实时间。本站采用 RFC 3339 完整秒形式，不使用闰秒、小数秒或未知偏移 `-00:00`。
- `generated.by` 记录实际编辑者或工具。人类与流程可使用 `human:<id>`、`process:<id>`；工具使用名称，模型已知时可附 `/模型名`。Codex 使用 `codex/gpt-6.1 sol`；无法确认模型时只写 `codex`，不填写 `unknown-version` 或猜测模型。不能把方案批准当成用户撰写全文。
- 实质修改正文、依据、图表或元信息时更新 `generated`；标点、纯排版勘误可仅由 Git 记录。构建、访问和部署不刷新修改时间。
- 页面“创建”按文档首次 Git 记录展示，包含重命名前的历史；这是本站文档的登记口径，实际起稿可能更早。时间由构建读取 Git，不另存字段，也不在页面生成提交链接。未提交的新稿预览不补造创建时间。
- CI 获取完整 Git 历史；不能用浅克隆、文件 mtime 或当前时钟推算首次记录。
- 页面统一按 `Asia/Shanghai` 显示，注明 `UTC+08:00`；同日更新可省略重复日期，机器时间保留完整值。两语实际创建和修改时刻可以不同。

## 来源与引用

来源 URL 只在 `sources` 中登记，使用稳定 ID。正文在相应论断附近使用匹配脚注；文末定义用途。网页自动为脚注补上来源链接，Agent 从元信息读取同一地址。

```yaml
sources:
  - id: original
    resource: https://example.org/original
    title: 原作者 · 原始材料标题
    author: human:author-id
```

```markdown
这段解释依据原始材料。[^original]

[^original]: 课程、刊物或频道，以及已知发布日期。用于校准定义与论证。
```

每个来源实际参与正文，脚注与来源 ID 对应。假设、作者观点、外部事实和本站推断仍按 [内容原则](policy.md) 区分。

## 封面、归档与原稿

封面是正文第一项独立的标准 Markdown 图片；alt 描述画面，图片 title 写来源说明。页面与卡片复用该图，正文不重复渲染。正文其他位置的图片仍作为内容图。

```markdown
![准确描述实际画面](./example.png "AI 生成插画")
```

封面可选；有图时须有本地图片、alt 和来源说明。中英文使用同一文件，各自翻译 alt 与说明。Mermaid 在网页中渲染为 SVG，在原稿中保留代码。

语言、文章身份和归档年月从 `[en/]YYYY/MM/slug.md` 路径派生，不另加语言、日期或配对字段。发布后保持 URL 与路径年月不变。列表展示路径年月；归档日号取创建记录，RSS 不补造未知的精确发布时间。需要资料截至时间的分析，在正文交代时间口径。

文章末尾和页面 Markdown 发现链接直接指向 GitHub Raw：`https://raw.githubusercontent.com/irideas/notes/main/src/content/notes/[en/]YYYY/MM/slug.md`。不建立本站原稿路由、知识包索引或固定提交链接。`main` 是仓库当前原稿；日常修改与网站发布须按授权完成。内容使用范围仍遵循 [项目使用说明](../../README.md#维护与使用)。

## 验证

运行 `npm run check`，核对标准字段、时间、来源脚注、两语对应、图片与图表、GitHub Raw 地址、页面元信息及 JSON-LD。检查器使用与构建相同的 Markdown 解析器。修改规则时验证能拦截可恢复的错误样例，再恢复源文档检查完整制品。

人工核验解释、来源范围及翻译；检查桌面侧栏和手机右侧目录按钮、跳转后收起、外部点击与 Escape 关闭及语言切换。按 [发布指南](../operations/deployment.md) 核对本次部署、两语页面与 GitHub 原稿。
