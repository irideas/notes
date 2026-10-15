# 文章讨论

每篇文章的简体中文与英文版本共用一个 GitHub Discussion。文末通过 [giscus](https://giscus.app/) 加载评论，评论与回复保存在 GitHub；界面语言随文章切换，评论正文保留原文。

## 对应规则

- 文章键为不含 `en/` 的 `YYYY/MM/slug`，两种语言只登记一次。[讨论登记表](../../src/data/discussions.json) 是仓库、分类与文章编号的唯一来源，frontmatter 不添加讨论字段。
- 提前建帖，以固定编号加载。修改标题、修订正文或切换语言时复用原讨论；新论题才建立新文章和新讨论。
- 首帖包含中英文标题、链接、摘要及 `notes-article` 标记。标记用于恢复登记和防止重复创建，不依赖可修改的标题。
- 全仓库只保留「文章讨论(Article discussions)」一个公告类型分类，不按语言、领域或内容形式再分组。网站不增加讨论分类导航。GitHub 需要分类归属，单分类作为平台容器即可。
- 不删除已有讨论来清空评论，不为另一篇文章复用编号，不在重复运行时覆盖首帖或读者回复。

## 首次配置

仓库需公开并开启 Discussions；安装 [giscus GitHub App](https://github.com/apps/giscus)，授权目标仓库。所需权限为元信息读取及 Discussions 读写，网站无需保存令牌。

GitHub 的分类管理页面负责分类名称和公告格式；登记表填写真实的仓库 ID、分类名称与 ID，不能猜测或填写占位值。分类改名后同步更新登记表，编号关联保持不变。

[giscus.json](../../giscus.json) 限定生产域名及本地开发来源，评论按时间先后排列。修改域名时同步核对该文件。组件使用浅色主题和延迟加载，保留 GitHub 直达链接。

## 新文章发布

需要 Node.js、已安装并登录的 [GitHub CLI](https://cli.github.com/) 和相应仓库权限。两语正文及元信息准备好后，在仓库根目录执行；将文章键替换为本次真实值：

```bash
npm run discussion:ensure -- 2026/10/experience-into-methods
```

此命令只查询，报告已登记、可恢复或尚未创建的讨论。文章发布已获授权后执行：

```bash
npm run discussion:ensure -- 2026/10/experience-into-methods --create
npm run check
npm run discussion:check
```

`--create` 会立即公开建帖并写回真实编号；文章尚未上线时首帖链接暂不可访问。已有编号则核验复用；存在唯一标记而本地未登记时恢复编号。将两版文章和登记表一起按 [发布指南](deployment.md) 交付、部署。

| 命令 | 行为与权限 |
|---|---|
| `npm run check` | 本地及 PR/CI 检查登记完整性、编号唯一性、生成页面的双语对应与组件配置；无需 GitHub 凭据 |
| `npm run discussion:ensure -- KEY` | 只读查询指定文章；需 CLI 登录与读取权限 |
| `npm run discussion:ensure -- KEY --create` | 发布已获授权时创建或恢复登记；需公告讨论创建权限 |
| `npm run discussion:check` | 发布前只读核验远端仓库、分类、所有登记编号、文章标记及双语链接；需 CLI 登录与读取权限 |

普通构建、预览、PR 检查及 Pages 部署均不建帖，不扩大 CI 写权限。草稿留在内容集合外；没有权限或凭据时交付草稿、文章键与待办，由维护者执行，不能伪造编号通过检查。

## 重复执行与恢复

- 建帖超时或结果不明：先运行不带 `--create` 的查询，核对 GitHub 状态后再继续；命令不会自动重试不确定的写操作。
- 创建命令使用 Git 公共目录的 `notes-discussions.lock` 互斥。同机任务串行执行；独立 clone 由一位发布者协调，避免同时建同一文章的讨论。
- 异常退出留锁时，确认没有创建进程再删除锁目录。本地写回失败时保留远端帖子并恢复登记；如有 `src/data/discussions.json.tmp`，先核对内容和远端状态，再移走临时文件重跑。
- 重复标记、错误分类或错误编号会使检查失败。核对 GitHub 与 Git 历史，保留已有回复，人工恢复正确关联后重新检查。

## 核验与维护

分别打开中英文文章并滚动到文末，确认同一编号、正确界面语言、手机无横向溢出及 GitHub 链接可用。匿名读者可阅读，发表评论需要 GitHub 登录并授权 giscus。外部评论服务加载失败时可使用直达链接。

登录后的发帖、回复和双向显示需要真实账号验证。未执行时明确说明，不能仅凭构建成功报告完整交互通过；不要冒充读者或制造无意义测试评论。

维护者在 GitHub 管理讨论。评论可补充证据、质疑解释和分享实践，正文经编辑核验后修订；需要跟踪的勘误与工程问题继续使用 Issues。

参考：[giscus 配置](https://giscus.app/) · [高级配置](https://github.com/giscus/giscus/blob/main/ADVANCED-USAGE.md) · [GitHub 讨论分类](https://docs.github.com/en/discussions/managing-discussions-for-your-community/managing-categories-for-discussions)

返回：[发布指南](deployment.md) · [写作指南](../content/authoring.md) · [项目入口](../../README.md)
