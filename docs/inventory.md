# ohwowbill.com 现状盘点

盘点日期：2026-07-28 ｜ 对应 `site-infra-spec.md` 任务 0

---

## 一、技术栈

| 项 | 现值 |
|---|---|
| 主题 | Blowfish **v2.88.1**（commit `0d485fcb`, 2025-07-11） |
| 引入方式 | **git submodule** → `themes/blowfish`，跟踪 `main` 分支 |
| baseURL | `https://ohwowbill.com/` |
| 自定义域 | `static/CNAME` = `ohwowbill.com` |
| 部署 | GitHub Actions → GitHub Pages（`.github/workflows/deploy.yml`，Hugo 0.148.1 extended） |
| 语言 | 单语 `zh-cn`，`defaultContentLanguageInSubdir = false` |

**注意：** submodule 跟踪 `main` 而非固定 tag，主题上游更新可能在某次 `git submodule update` 后引入非预期变更。若求稳，应钉到 `v2.88.1` tag。

---

## 二、内容分布

**posts 总计 23 篇**，时间跨度 2023-02 → 2026-05。

### 分类频次

| 分类 | 篇数 | 分类 | 篇数 |
|---|---|---|---|
| 随笔 | 12 | 玄学 | 2 |
| 过客文章 | 6 | 模型 | 2 |
| 诗词 | 3 | 必背 | 2 |
| 医 | 3 | 基础 | 2 |
| 语言 / 语法 / 词根词缀 / 波斯语 | 各 2 | 生活 | 2 |
| 命·知识点做题法·医案·工具·问答·相片故事·异闻录·佛教·人性 | 各 1 | | |

分类体系偏散：22 个分类摊在 23 篇上，其中 13 个只出现一次。`随笔` 是事实上的兜底桶。

### 可归并的主题簇（供任务 2 参考，非定论）

| 簇 | 篇数 | 成员 |
|---|---|---|
| **玄学 · 亲历** | 2 | 吾友天日鹫命、初遇出马仙 |
| **医** | 3 | 必背（一）（二）、寓意草（一） |
| **命理** | 1 | 命理师大赛2024题目解析（二） |
| **语言 · 波斯语** | 2 | 鲁拜集（一）（二） |
| **模型 · 人性** | 3 | 情绪本源论、行为治疗自信训练、答疑之胆怯性格 |
| **异闻 · 故事** | 2 | 白狐索命、落日列车 |
| **过客文章**（旧站迁入） | 6 | 福祸、秋夜雨、论兴趣、天地渐开、初创天地、答疑 |
| **诗词 · 短章** | 3 | 志追随者、中秋、鸿蒙初开 |
| **工具** | 1 | 靈狐掌中樹 |
| 未分类 | 1 | 问题列表（47 字，疑为草稿） |

### 全部篇目（按日期倒序）

| 日期 | 字数 | 标题 | 分类 |
|---|---|---|---|
| 2026-05-18 | 1551 | 吾友，天日鹫命 | 玄学 |
| 2026-05-14 | 977 | 初遇出马仙 | 玄学 |
| 2024-10-16 | 47 | 问题列表 | — |
| 2024-10-06 | 200 | 靈狐掌中樹 | 工具 |
| 2024-09-29 | 693 | 关于行为治疗：自信训练的延伸应用 | 随笔, 模型 |
| 2024-09-27 | 815 | 命理师大赛2024题目解析（二） | 命, 知识点做题法 |
| 2024-09-17 | 208 | 中秋 | 随笔 |
| 2024-09-11 | 562 | 相片故事之落日列车 | 相片故事, 随笔, 生活 |
| 2024-09-11 | 209 | 【置顶】志追随者 | 诗词, 随笔, 生活 |
| 2024-09-05 | 906 | 异闻录之白狐索命 | 随笔, 异闻录 |
| 2024-08-20 | 844 | 必背（二）——十总穴+天星十二穴 | 医, 必背, 基础 |
| 2024-08-10 | 366 | 必背（一）——原病式 | 医, 必背, 基础 |
| 2024-07-20 | 747 | 鲁拜集（二） | 语言, 诗词, 波斯语, 词根词缀, 语法, 佛教 |
| 2024-07-01 | 845 | 【置顶】情绪本源论 | 随笔, 模型, 人性 |
| 2024-06-15 | 835 | 鲁拜集（一） | 语言, 诗词, 波斯语, 词根词缀, 语法 |
| 2024-05-10 | 826 | 寓意草（一） | 医, 医案 |
| 2024-04-01 | 255 | 答疑之如何改变自己胆怯的性格 | 过客文章, 问答 |
| 2024-01-01 | 99 | 鸿蒙初开 | 随笔 |
| 2023-06-10 | 222 | 福祸（2021） | 过客文章, 随笔 |
| 2023-05-15 | 275 | 秋。夜。雨（2021） | 过客文章, 随笔 |
| 2023-04-20 | 53 | 论兴趣（2021） | 过客文章, 随笔 |
| 2023-03-10 | 306 | 天地渐开 | 过客文章, 随笔 |
| 2023-02-01 | 394 | 初创天地（过客版） | 过客文章, 随笔 |

**篇幅特征：** 中位数约 400 字。仅 2 篇过千（均为 2026 年新作）。5 篇在 100 字以下，接近碎片。

### 最后修改时间（git）

| 日期 | 涉及 |
|---|---|
| 2026-05-26 | 吾友天日鹫命、初遇出马仙 |
| 2026-04-18 | 其余全部 21 篇（批量迁入） |

**含义：** 除两篇新作外，全站内容是一次性批量导入的。frontmatter 里的 `date` 是内容日期，非仓库写入日期。

---

## 三、非 posts 页面

| 路径 | 标题 | 状态 |
|---|---|---|
| `content/_index.md` | 潜蛟子 · ohwowbill | 仅 frontmatter，**内容由 `layouts/index.html` 完全接管** |
| `content/about/index.md` | 阁主何人 | 存在 |
| `content/links/index.md` | 去处 | **已存在**，含 文/影/人 三区 |
| `content/tools/index.md` | 法宝库 | 存在，收录梅花易数、閩吳谚文 |
| `content/posts/_index.md` | 万法归一 | 仅 title + description |

### `/links` 现状（任务 1 相关）

已收录：晋江《锦中燕》、方格子、公众号「哦哇呜比尔」、YouTube、B站、Instagram

**缺口：**
- 未收录 note、Discord
- 全部链接**未加 `rel="me"`**
- **无 JSON-LD `Person` schema**
- 规格提及的 qimen-shouji / fengyun 两个 PWA 已按要求排除 ✓

---

## 四、配置现值

### `hugo.toml`

```
theme = "blowfish"          defaultContentLanguage = "zh-cn"
enableRobotsTXT = true      summaryLength = 60
hasCJKLanguage = true       buildDrafts = false
buildFuture = false         enableEmoji = true
pagination.pagerSize = 10
taxonomies: tag=tags, category=categories
outputs.home = ["HTML", "RSS", "JSON"]
```

**`buildFuture = false` 需留意：** 2026-05 的两篇是「未来日期」，本地构建会被排除。CI 已在 `deploy.yml` 加 `--buildFuture` 兜住，但本地 `hugo --gc --minify` 验收时会少两篇——不是 bug，是这个配置的必然结果。

### `params.toml` 关键项（任务 2 相关）

```
colorScheme = "noir"        defaultAppearance = "dark"
mainSections = ["posts"]    autoSwitchAppearance = false

[homepage]
  layout = "profile"        showRecent = true       ← 时间流信号
  showRecentItems = 8       showMoreLink = true
  cardView = true

[list]
  showSummary = true        groupByYear = true      ← 时间流信号
  showCards = true          cardView = true

[article]
  showDate = true           showDateUpdated = false
  showReadingTime = true    showRelatedContent = true
```

**时间流信号定位（任务 2 靶点）：**

| 位置 | 参数 | 现值 | 说明 |
|---|---|---|---|
| 列表页 | `list.groupByYear` | `true` | **主要靶点**——`/posts/` 按年份分组，2024 与 2026 之间的空档一目了然 |
| 首页 | `homepage.showRecent` | `true` | 实际**不生效**，见下 |
| 单篇 | `article.showDate` | `true` | 规格要求保留，不动 |

### 首页现状（重要）

`layouts/index.html` 是一份 **49 行的完整自定义 HTML**，绕开 Blowfish 全部布局：

- 自带 `<!DOCTYPE html>`，独立引入 Google Fonts + React 18.3.1 + Babel standalone
- 渲染 `static/card/` 下的 5 个 jsx（个人名片：罗盘、符箓、装饰、调参面板）
- 底部一个固定入口：`万 法 归 一 →` 指向 `/posts/`

**结论：首页已经不是时间流。** `[homepage]` 那组参数（`showRecent` 等）当前是死配置，不产生任何输出。任务 2 的实际工作量比规格预想的小，重心应落在 `/posts/` 列表页的 `groupByYear`，以及是否要在首页加主题策展入口（目前只有一个「万法归一」总入口，无主题分流）。

### `menus.zh-cn.toml`

主菜单：潜蛟阁(/) · 阁主何人(about) · 万法归一(posts) · 去处(links) · 寻物(tags) · 法宝(tools) · Instagram
页脚：标签 · 分类

`/links` **已在主导航中**（weight 35），任务 1 的「首页与全站导航加入该页入口」这一条已完成 ✓

---

## 五、SEO 基础设施

| 项 | 状态 |
|---|---|
| `sitemap.xml` | Hugo 自动生成，模板 `themes/blowfish/layouts/_default/sitemap.xml`；`params.toml` 中 `[sitemap] excludedKinds = []` — **无排除，全量收录** |
| `robots.txt` | `enableRobotsTXT = true`，由 `themes/blowfish/layouts/robots.txt` 生成；**无自定义覆写，无屏蔽规则** |
| RSS | `outputs.home` 含 RSS，`/index.xml` 可用；**尚未在 `/links` 给出入口**（任务 4 要求） |
| JSON-LD | **无** —— 任务 1 的核心缺口 |
| `rel="me"` | **无** |

---

## 六、静态资源

| 目录 | 文件数 | 用途 |
|---|---|---|
| `static/pt` | 1071 | **82 MB**，含 `freq.enc`、`questions.enc`、images —— 疑似题库应用 |
| `static/img` | 26 | 站点图片 |
| `static/card` | 6 | 首页个人名片的 jsx + css |
| `static/meihua` | 5 | 梅花易数工具 |
| `static/qimen` | 1 | 奇门手记（**本 session 新建，未提交**） |
| `static/yanzhi` | 1 | 閩吳谚文方案 |

**`static/pt` 82 MB 需决策：** 占仓库绝大部分体积，每次 clone/CI checkout 都要拉全量。且未出现在 `/tools` 法宝库页中，属于「存在但无入口」的状态。是否保留、是否该迁出仓库，建议单独判断。

### 其他覆写

- `assets/css/custom.css` — 自定义样式
- `layouts/404.html` — 自定义 404
- `layouts/partials/extend-footer.html` — **全站注入**星空 + 鼠标拖尾粒子 canvas（约 100 行 JS，`requestAnimationFrame` 常驻）

---

## 七、未提交变更（本 session 产生）

| 文件 | 状态 |
|---|---|
| `static/qimen/index.html` | 新建 —— 奇门手记独立页 |
| `static/meihua/index.html` | 修改 —— 底栏加 `/qimen/` 跳转 |
| `static/yanzhi/index.html` | 修改 —— 谚文方案 v4 |

---

## 八、盘点结论 · 对后续任务的影响

1. **任务 1 已完成约一半。** `/links` 页与导航入口都在，剩下的是 `rel="me"`、JSON-LD `Person` schema、补 note/Discord 三件事，工作量远小于规格预期。

2. **任务 2 的靶点要改。** 规格假设首页是倒序博客流，实际首页是自定义 React 名片页，`[homepage]` 参数全是死配置。真正的时间流信号在 `/posts/` 列表页的 `list.groupByYear = true`。首页的问题不是「有时间流」，而是「只有一个总入口，无主题分流」。

3. **主题分区有据可依。** 建议按上表九个主题簇收敛，`随笔`（12 篇）需拆分——它现在是兜底桶而非主题。`过客文章`（6 篇）是旧站迁入的历史层，可独立成一区。

4. **两处待决策，不属于任务 0 范围，但会影响后续：**
   - `static/pt` 82 MB 的去留
   - Blowfish submodule 是否从 `main` 钉到 `v2.88.1`

5. **名称订正：** `site-infra-spec.md` 任务 1 第 27 行写作「潜宵阁」，与 `CLAUDE.md` 硬性规定的「潜蛟阁」冲突。本盘点一律以 `CLAUDE.md` 为准。
