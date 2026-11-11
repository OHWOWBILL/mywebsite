# 主题与 Hugo 升级备忘

现状：Hugo **0.167.0 extended**，Blowfish **v3.9.0**（`themes/blowfish` 子模块，commit `ebe683e9`）。
Blowfish 每个版本在 `themes/blowfish/config.toml` 里写明它要的 Hugo 版本区间（v3.9.0 是 0.164–0.167），
升主题时两边要一起动；两份工作流（`.github/workflows/check.yml`、`deploy.yml`）里的 `HUGO_VERSION` 也要跟着改。

## 本站覆盖了主题的哪些文件

升级时，下面每个文件都要拿主题的新版重新对一遍（把本站的改动挪到新版上，而不是留着旧文件）。
每个文件开头的注释写了本站改的是什么。

| 文件 | 本站改了什么 |
| --- | --- |
| `layouts/partials/header/basic.html` | 站名换成「蛟标记 + ohwowbill + 潜蛟阁」 |
| `layouts/partials/header/components/desktop-menu.html` | 搜索钮只留图标；加音律开关；只有图标的菜单项读屏器念 title |
| `layouts/partials/header/components/mobile-menu.html` | 加音律开关；同上的读屏标签 |
| `layouts/partials/footer.html` | 版权行换成「蛟标记 + 阁主 潜蛟子 + 年份」；`extend-footer.html` 按是否首页分开缓存 |
| `layouts/partials/article-link/{card,card-related,simple}.html` | 摘要优先用文章自己的 description |
| `layouts/partials/article-pagination.html` | 文末上一篇 / 下一篇保留旧排法（箭头一栏、题目日期一栏） |
| `layouts/partials/term-link/text.html` | 类目页保留旧样（类目名 · 篇数），不用主题新版的小圆牌 |
| `layouts/partials/meta/edit.html` | 加 `qj-edit` 类，平时藏起来，owner 模式才显示 |
| `layouts/partials/series/*.html` | 系列导航换成本站的 `qj-series.html` |
| `layouts/_default/_markup/render-link.html` | 外链 `rel="noopener"`，命中 `data/identity.toml` 的加 `rel="me"` |
| `layouts/_default/_markup/render-image.html` | 文章配图出三档 webp |
| `layouts/_default/rss.xml`、`layouts/404.html`、`layouts/index.html` | 整份自写，不随主题 |
| `assets/js/search.js` | 「问路」：中文输入法、无结果回车去寻物页、去处列表、命中标紫 |
| `i18n/zh-CN.yaml` | 只放本站要改或主题缺的几条 |

`assets/css/custom.css` 里「二 站名 · 导航」一节有一批规则是专门把主题 3.x 的新样式调回本站原样的
（顶栏留白与字号、手机菜单、文章卡片、右侧目录宽度、返回顶部的位置）。主题再改这些地方的标记时，这些规则要跟着核对。

## 升级的做法

1. 另开一个工作区，子模块切到新版本，装对应的 Hugo。
2. 先把上表的覆盖文件挪开，确认主题自己能构建；再逐个把本站改动套到主题新版文件上。
3. 新旧两版各构建一份，起两个本地服务，逐页比对（位置、字号、颜色都量一遍，不只看截图）。
   重点看：顶栏（桌面、手机）、手机菜单、文章页头尾、相关文章卡片、类目页。
4. 跑 `scripts/*/check.js`、`node scripts/pwa/gen-sw.js --check`、`node scripts/seo/tool-meta.js --check`。
5. 页面上的字有增减时，照 `scripts/fonts/` 的流程把字包重打一遍。

## 这次（2.88.1 → 3.9.0）留下来没有调回的差别

都是主题自己的改进，看不大出来：右侧目录的字比原来亮一档（对比度更高）；作者栏的两个社交图标往左挪了 4px；
主题不再加载 jQuery；搜索框打开时 Tab 键只在框里转，合上后焦点回到原处。
