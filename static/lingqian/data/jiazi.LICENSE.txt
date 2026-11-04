# 六十甲子签 60 签 · 出处与许可（jiazi.js）

## 收了什么
- 签号与干支（台湾宫庙的排法：甲子、甲寅、甲辰……）、卦象（○●）、五行与宜方、七言四句签诗（简体 `p`，繁体 `pt`）、典故（`st`）、各事断语（`it`）。
- 倾向（字段 `t`：吉 / 平 / 凶）与白话解（字段 `j`）：潜蛟阁据诗意与断语所写。六十甲子签原签不标吉凶等级，页面上注明「本站读」。

## 出处
[DestinyLab/lottery-poetry-sixty-jiazi](https://github.com/DestinyLab/lottery-poetry-sixty-jiazi) `resources/1.yml` 至 `60.yml`，作者 Lance He。该仓库在 README 与 composer.json（`"license": "MIT"`）里声明 MIT，未附 LICENSE 文件；下面按 MIT 的要求附上许可文字。同一份数据也由 [mediapig/qiantong](https://github.com/mediapig/qiantong)（MIT）转为 JSON 收录。

台湾妈祖庙（如北港朝天宫一系）多用这一套，所以页面上写「妈祖庙常用」。另查到的一份泉州天后宫六十签整理本是 GPL-3.0，没有收。

## 本站的改动
- 从 YAML 转为本站的数据格式。
- 繁体转简体（字表取自 OpenCC，Apache-2.0，只在生成时使用）；签诗繁体原文留在 `pt`。

## 许可（MIT）

```
MIT License

Copyright (c) Lance He (DestinyLab/lottery-poetry-sixty-jiazi)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
