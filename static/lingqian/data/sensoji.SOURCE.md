# 浅草寺おみくじ（観音百籤）100 番 · 出处说明（sensoji.js）

## 收了什么
- 签号、等级（大吉 / 吉 / 半吉 / 小吉 / 末小吉 / 末吉 / 凶）、五言四句签诗。
- 白话解（字段 `j`）：潜蛟阁据诗意所写。

## 为什么只收这些
浅草寺的签诗是「元三大师御籤」一系的观音百签，五言古诗，属公有领域。寺里签纸上的日文解说与各种译文是浅草寺的现代文字，不收。网上的三份转录都没有开放许可：

| 转录本 | 许可 |
|---|---|
| [Tamshen/senso-ji-stick-data](https://github.com/Tamshen/senso-ji-stick-data)（经 [mediapig/qiantong](https://github.com/mediapig/qiantong) `sensoji.json` 转收） | 无许可 |
| [yujianke100/asakusa](https://github.com/yujianke100/asakusa) `js/qian.js` | 无许可 |
| [Raidenneox/nonebot_plugin_CyberSensoji](https://github.com/Raidenneox/nonebot_plugin_CyberSensoji) `message.py` | 仓库 MIT，但数据自称「来自网络」，不视为授权 |

## 怎么校（2026-11-04）
- 以 Tamshen 本为底本，只取签诗与等级。三本签诗只在字形上有出入（峯/峰、処/处、応/应、裡/里、昇/升 等），统一为简体通行字。
- 两份转录同误、按文义改正的两处：4 番「好事始总总」→「好事始匆匆」（悤悤误认作總總），57 番「重整钩鳌钩」→「重整钓鳌钩」。
- 等级：16、19 两番取 yujianke100 本（吉、末小吉）。这样全套为大吉 17、吉 35、半吉 5、小吉 4、末小吉 3、末吉 6、凶 30，与浅草寺公开的比例相合；另两本在这两番上会多出一个凶、少一个末小吉。
- 寺里签纸用旧字体，这里用简体，便于和本站其他签对读。
