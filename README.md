# 记点儿信息 · notes

理解事物如何运转。围绕具体问题整理概念、模型与证据，形成有依据、可修正的判断。

- 网站：[notes.irideas.pro](https://notes.irideas.pro/)
- 内容：简体中文与英文完整版本，Markdown 按首次发布日期的年月归档
- 技术：Astro 静态站点，Mermaid 在构建时生成 SVG
- 发布：GitHub Actions → GitHub Pages

## 快速开始

使用 [.nvmrc](.nvmrc) 指定的 Node.js 版本，在仓库根目录执行：

```bash
npm ci
npm run dev
```

打开命令输出的本地地址。完成后运行 `npm run dev:stop`。
完整检查命令为 `npm run check`。

## 按任务阅读

| 任务 | 入口 |
|---|---|
| Agent 接手 | [AGENTS.md](AGENTS.md) |
| 贡献、更正与提交 | [贡献指南](CONTRIBUTING.md) |
| 了解内容定位与质量要求 | [内容原则](docs/content/policy.md) |
| 新增、修订文章或更换配图 | [写作指南](docs/content/authoring.md) |
| 开发网站、预览与检查 | [开发指南](docs/development/guide.md) |
| 发布、线上核验与恢复 | [发布指南](docs/operations/deployment.md) |

## 维护与使用

由 [irideas](https://github.com/irideas) 维护。通过 [Issues](https://github.com/irideas/notes/issues) 提交更正与补充依据，可通过 [RSS](https://notes.irideas.pro/rss.xml) 订阅更新。

文章和配图未统一授予开放内容许可；转载或复用请联系维护者，并尊重各篇原始来源。依赖包遵循各自许可。
