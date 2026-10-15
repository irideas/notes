# 记点儿东西

看到好东西，记一下。记录想法、经验、启发和故事，也留一点自己的理解。

- 网站：https://notes.irideas.pro
- 内容：Markdown，按年月存放
- 生成：Astro 静态站点
- 发布：GitHub Actions → GitHub Pages

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

## 写一篇记录

在 `src/content/notes/年/月/` 下增加 Markdown 文件，例如：

```text
src/content/notes/2026/10/a-small-idea.md
```

文件开头：

```yaml
---
title: 一个想留下来的想法
date: '2026-10-15'
description: 用一两句话说说这篇记了什么。
tags: []
---
```

正文可以长，也可以短，不要求统一格式。阅读摘记保留来源，实践经验说明适用情境，故事按自己的顺序讲。

`tags` 是可选的小标记，留空或不填写都可以。首版每篇最多两个，不预设分类体系。已有标签会自动生成对应记录页。

## 配封面

把封面放在文章旁边，再添加：

```yaml
cover: ./a-small-idea.png
coverAlt: 描述图片内容，帮助无法看到图片的读者理解。
coverCredit: 图片来源或说明（可选）
```

不配封面也能正常显示。构建时会自动生成适合屏幕大小的 WebP 图片。

全站采用清爽的蓝绿配色和适合长文的排版。站点本身没有独立大封面，只在顶部点缀淡蓝天、底部点缀少量草坪；每篇文章可以配自己的封面。`src/assets/meadow.png` 仅用于站点页首、页尾的装饰，由内置 imagegen 生成；最终提示要点是“自然摄影、开阔草原与蓝天、保留宁静自然光、去掉咖啡杯、没有书本、标签、文字、品牌或其他杂物、16:9 横幅”。每篇文章按内容单独配图，不使用草原图充当通用文章封面。文章配图采用淡淡的简笔画：细线条、少量淡彩、大量留白、简约而不夸张；目录中用缩略图，内容页用大图。首篇 `experience-into-methods.png` 由内置 imagegen 生成，提示要点是“用极简手绘线条表现一个人铺好可复用的路径、后来的人接着走，浅蓝浅绿点缀，无写实材质、无文字、无品牌、16:9”。

## 发布

推送到 `main` 后，工作流会构建和部署。仓库 Settings → Pages 的 Source 设为 GitHub Actions，自定义域名填写 `notes.irideas.pro`。

DNS 推荐配置一条记录：

| 类型 | 主机记录 | 值 |
|---|---|---|
| CNAME | notes | irideas.github.io |

先绑定 Pages 的自定义域名，再配置 DNS。域名和证书就绪后，在 Pages 开启 Enforce HTTPS。

如果使用 A 记录，则配置 GitHub Pages 官方的四个 IPv4 地址；A 与 CNAME 选一种即可：

```text
185.199.108.153
185.199.109.153
185.199.110.153
185.199.111.153
```

参考：[GitHub Pages 自定义域名](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site)。本项目使用 Actions 发布，域名由 Pages 设置管理，不依赖仓库内的 CNAME 文件。

## 内容与使用

文章和配图未统一授予开放内容许可；转载或复用时，请联系作者，并尊重各篇标注的原始来源。依赖包遵循各自许可。
