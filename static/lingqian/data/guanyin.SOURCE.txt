# 观音灵签 100 签 · 出处说明（guanyin.js）

## 收了什么
- 签号、等级（上签 / 中签 / 下签）、典故名、七言四句签诗。
- 白话解（字段 `j`）：潜蛟阁据诗意所写，与下列各本的解签文字无关。

## 为什么只收这些
观音灵签是民间流传数百年的古本，签诗与典故名属公有领域。网上整理本虽多，但查到的几份都没有开放许可：

| 转录本 | 许可 |
|---|---|
| [mediapig/qiantong](https://github.com/mediapig/qiantong) `src/qiantong/data/guanyin.json`（源自 [yanxinyu777-beep/guanyin-lingqian-100](https://github.com/yanxinyu777-beep/guanyin-lingqian-100)） | 原仓库只写「仅供学习研究使用」；qiantong 的 MIT 明言不覆盖这份数据 |
| [snjor-kii/guanyinqiuqian](https://github.com/snjor-kii/guanyinqiuqian) `lottery-data.js` | 无许可 |
| [iowi/guanyin](https://github.com/iowi/guanyin) `app/src/main/assets/data.js` | 「仅供个人学习与文化研究使用」 |

所以这里不搬任何一本的整理成果（解曰、白话、典故详述、各事断语都不取），只取古本签诗、等级与典故名，并用三本互校。

## 怎么校（2026-11-04）
- 以 qiantong 本（A）为底本。另两本（B、C）一致而与 A 不同时，取 B、C 的读法（34 处，多为错别字）。
- A 与 B、C 的整首签诗不同时（16、27、43、55、61 签），整首取 B、C 共有的通行本，不逐句拼合。
- 三本各异时保留 A；只在文义明显不通时改字（19 处），如：17 签「书饼」→「画饼」（畫、書形近误认），28 签「蝉娟」→「婵娟」，75 签「战战竞竞」→「战战兢兢」，85 签「云开雾罩」→「云深雾罩」，77 签典故仍作「完璧归赵」。
- 等级：A、C 两本 100 签中 97 签一致；不一致的三签（9、39、91）按三本多数。结果：上签 24、中签 58、下签 18。
- 各地版本本来就有异文，这份是三本互校后的读本，不是某一座庙的签谱。
