# 发布与恢复

网站：[notes.irideas.pro](https://notes.irideas.pro/)；仓库：[irideas/notes](https://github.com/irideas/notes)。本指南描述生产操作，不授予新的发布权限。

## 发布条件

先确认用户本轮的交付范围。仅写稿、修改或提交 PR 时，按该终点交付；已经明确授权上线时，完成验证后继续发布，无需重复确认。

贡献默认走分支和 PR；维护者授权直接发布时可推送 `main`。操作前检查当前分支、远端、工作区及要提交的文件，保留他人改动。没有写权限或工具时交付 PR、补丁或清楚的未完成说明。

## 本地检查到上线

在仓库根目录执行：

```bash
git status --short --branch
git remote -v
git diff --check
npm run check
```

完成 [开发指南中的人工检查](../development/guide.md#检查与通过条件)。只暂存本次任务文件，提交具体问题和结果；按授权合入或推送 `main`。不要提交 `dist/`，工作流会生成产物。

新增文章前按 [讨论指南](discussions.md) 准备两语共用讨论；涉及文章或讨论配置的发布额外运行 `npm run discussion:check` 只读核验远端。普通构建及 CI 不创建讨论。

自动化分工：

- [check.yml](../../.github/workflows/check.yml)：PR 检查，也可被发布流程复用；安装依赖并执行 `npm run check`。
- [deploy.yml](../../.github/workflows/deploy.yml)：`main` 推送或选择 `main` 的手动运行触发，调用检查流程，上传同一次构建的 `dist/`，再部署 GitHub Pages。
- PR 检查没有 Pages 写入权限，不运行部署。手动选择其他分支不发布。生产部署串行执行。

有 GitHub CLI 时，可查询并等待本次提交对应的运行；先用实际 SHA 匹配运行，不能把别人的成功运行算成本次成功：

```bash
git rev-parse HEAD
gh run list --repo irideas/notes --workflow deploy.yml --limit 5 --json databaseId,headSha,status,conclusion,url
```

取得正确的运行 ID 后执行 `gh run watch RUN_ID --repo irideas/notes --exit-status`，将 `RUN_ID` 替换为真实值。没有 CLI 时在仓库 Actions 页面打开对应提交的运行，查看检查与部署结果。

## 成功标准

1. 本地自动检查和相关人工检查通过。
2. 对应提交的检查与部署工作流成功；记录提交 SHA 和运行地址。
3. 打开实际变更的中英文线上页面，确认新增文案、封面或行为，以及相应资源是当前版本；文章改动额外核对同语言 GitHub Raw 链接及其实际原稿，语言切换保持页面对应关系。构建成功或 HTTP 200 单独都不足以证明本次变更已经上线。

可以用 `curl -fsSI https://notes.irideas.pro/` 辅助检查响应；必要时请求 `Cache-Control: no-cache`，再核对内容或资源地址。保留正常 TLS 验证。界面变化保存合适截图，交付时给出网站地址、变更摘要、检查结果和任何尚未验证的部分。

## 域名与配置

站点地址由 [astro.config.mjs](../../astro.config.mjs) 的 `site` 设置；正式域名同时由仓库 Settings → Pages 管理。当前为 Actions 发布、`notes.irideas.pro`、HTTPS。DNS 为 CNAME `notes` → `irideas.github.io`。

域名、Pages 设置和 DNS 属于外部配置，改动前读取当前状态。日常写作和网站更新不需要改 DNS 或另建托管服务。站点地址调整时同时核对规范地址、RSS、sitemap 和爬虫配置。

SEO、GA4 与站长平台验证配置见 [搜索发现与访问统计](search-and-analytics.md)。统计改动发布前核验两语同意、拒绝、撤回和零请求行为；发布后另外确认 GA 实时报告及 Search Console 的实际验证与提交状态，不能把构建成功等同于统计或收录完成。

## 失败处理与恢复

- 依赖、schema、图表或链接检查失败：根据日志定位，修正源文件后重新运行完整检查。不要通过删正文或跳过检查隐藏问题。
- 构建成功但部署失败：查看对应部署日志、Pages 发布来源与本次运行；判断是临时基础设施问题还是配置问题，再重试失败任务或修正配置。保留原运行证据。
- 工作流成功但页面未更新：先核对提交 SHA、部署目标和缓存，再检查页面引用的资源；不要立即改域名配置。
- 已上线版本确有回归：确定引入问题的提交，优先用新的修复提交；需要回退时使用 `git revert COMMIT_SHA` 产生可追踪的逆向提交，处理冲突并重新检查，再按当前授权范围发布。不要用强制推送或重置共享历史代替恢复。

停止自己启动的本地服务。恢复后同样核验实际页面，并说明影响与恢复结果。

返回：[贡献指南](../../CONTRIBUTING.md) · [开发指南](../development/guide.md) · [项目入口](../../README.md)
