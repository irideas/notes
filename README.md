# 记点儿信息 · notes

理解事物如何运转。梳理概念与模型，分析机制与变化，形成有依据、可修正的判断。

- 网站：[notes.irideas.pro](https://notes.irideas.pro/)
- 内容：Markdown，按首次发布的年月存放
- 构建：Astro 静态站点；图表在构建时生成 SVG
- 发布：GitHub Actions → GitHub Pages

编辑前阅读 [内容生产与组织规范](docs/content-policy.md)。这份规范是项目要求，不作为网站页面发布。

## 本地运行

使用 Node.js 22.12 或以上版本。

```bash
npm ci
npm run dev
```

构建与预览：

```bash
npm run build
npm run preview
```

## 新增文章

在 `src/content/notes/年/月/` 下增加 Markdown。文件名形成文章 URL，发布后保持稳定。元信息示例：

```yaml
---
title: 清楚说明本文的问题或研究对象
date: '2026-10-15'
description: 简洁说明解释范围和核心问题。
tags: []
---
```

正文从二级标题开始，按主题自身的层次组织完整论证。不要在正文重复页面已经呈现的标题、发布日期和主要来源。

领域关键词最多两个，使用 `src/lib/domains.ts` 中登记的规范名称。新增领域时同时维护中文名、英文名和范围说明。来源名称、内容形式和适用读者不充当领域关键词。

引用一项主要来源时添加：

```yaml
source:
  title: 原始材料标题
  author: 原作者
  publication: 课程、刊物或频道名称
  date: '2026-10-15'
  url: https://example.org/original
```

页面统一展示主要来源，其余引用在正文中就近标注，并按需要列入参考资料。来源日期与本站发布日期分别维护。所有示例字段都应替换成实际信息。

实质更新填写 `updated` 和简洁的 `revision`；原始 `date` 和 URL 不变。同一天更新不会在页首重复显示日期，Git 历史保留完整修改。现状或趋势分析可以填写 `asOf`，表示资料实际截止日期。

二级标题自动进入文章目录。使用 Mermaid 围栏代码编写必要图表，支持的语法以 [beautiful-mermaid](https://github.com/lukilabs/beautiful-mermaid) 为准；当前文章使用流程图。构建失败时修正图表，不能静默省略内容。构建会刷新内容缓存，确保插件更新进入产物。发布页面无需额外加载图表脚本或第三方 CDN。

## 配图

封面放在文章旁边，添加：

```yaml
cover: ./article-cover.png
coverAlt: 准确描述画面内容。
coverCredit: 图片来源或说明
```

封面按文章内容采用淡彩简笔画：细线条、少量淡彩、大量留白、简约而不夸张。目录小图、正文大图；构建自动优化为 WebP。正文图表负责解释结构、关系、过程或数据。

`src/assets/meadow.png` 仅用于页首、页尾的淡蓝天与草坪点缀。它与首篇插画均由内置 imagegen 生成。首篇提示要点为“一个人铺好可复用的路径，后来的人接着走；极简手绘线条，浅蓝浅绿，无写实材质、文字或品牌”。

## 发布

推送 `main` 后，工作流构建并部署。GitHub Pages 使用 Actions，绑定 `notes.irideas.pro` 并开启 HTTPS。

DNS：CNAME `notes` → `irideas.github.io`。域名由仓库 Pages 设置管理。

发布前检查构建、章节锚点、内部链接、图表、RSS 与元信息，并核对移动端和明暗主题。部署成功后确认线上文章及资源对应本次构建。

## 更正与使用

通过 [Issues](https://github.com/irideas/notes/issues) 提交问题与补充依据，修改历史可在 GitHub 查询。

文章和配图未统一授予开放内容许可；转载或复用时，请联系维护者，并尊重各篇标注的原始来源。依赖包遵循各自许可。
