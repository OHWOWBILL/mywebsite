# 姓名学 · 数据来源与许可

本目录的数据文件由脚本自动生成，页面（`/xingming/`）与自检（`scripts/xingming/check.js`）都读它们。
只收许可宽松（MIT、Apache-2.0、Unicode License v3）的数据；三份许可全文附在本文末尾。

## 一、`kangxi.js` · 康熙笔画

| 项 | 内容 |
|---|---|
| 主表来源 | [breezyreeds/kangxi-strokecount](https://github.com/breezyreeds/kangxi-strokecount) `kangxi-strokecount.csv`（2018-10，MIT，© 2017-2018 Kawai Lo） |
| 主表内容 | 《康熙字典》所收、Unicode 11 已编码的 63,696 字，每字「部首原画 + 部外画」，即 Unihan `kRSKangXi` 的快照（氵=4、扌=4、忄=4、艹=6、辶=7、阝左=8、阝右=7、王旁=5、礻=5、衤=6、⺼=6、犭=4、罒=6 都由此而来；与 Unicode 15.0 的 `kRSKangXi` 逐字对照，63,693 字相同） |
| 本站所取 | 基本区 U+4E00–U+9FFF 全部（有数的 20,717 字），扩展 A 区与兼容区所收，以及《通用规范汉字表》、Big5、OpenCC 两边用得到的扩展 B 区以后的字（`more`，1,079 字），合计 21,796 字 |
| 改动 | ① 改写成一字一符的字串（见文件头）；② `fix`：28 字校订；③ `alt`：32 字「另说」；④ `est`：1,180 个原书未收的字按同一规矩估算补位 |
| 生成日期 | 2026-11-04 |

**为何要校订。** `kRSKangXi` 在 Unicode 15.1 起已从 Unihan 撤下（最新 18.0 的 Unihan 没有这一栏），本站用的是 breezyreeds 冻结的快照，不受影响；但「部首 + 部外画」有时与《康熙字典》原书把字收在哪一画不一致（如「暑」原书收在日部九画、「熙」通行作 13 画）。做法：常用字（《通用规范汉字表》8,105 字、其繁体与 Big5 共 13,575 个非简化字形）逐字比对五说——

1. 本表（`kRSKangXi`）；
2. 《康熙字典》原书位置：Unihan `kKangXi`（Unicode 15.0）给出每字在原书的页码与次序，前后两个正收字都在另一画数之下的，视为原书收在那一画；
3. [hongyuanjia/wuge](https://github.com/hongyuanjia/wuge) `inst/extdata/kangxi.csv`（GPL-3.0 包，字表上游 fh250250/fortune、sinshine/AI-name 许可不详）；
4. [cnk3x/bys](https://github.com/cnk3x/bys) `kx.dict`（Apache-2.0）；
5. [shunshi-ai/kangxi-mcp](https://github.com/shunshi-ai/kangxi-mcp) `packages/kangxi-core/data/chars.json.gz`（MIT，20,794 字）。

多数与本表不同的 28 字从多数（`fix`），本表原值留作「另说」；两说票数相持、而原书位置正是另一说的（母、极、竮、豶）也给「另说」。第 3–5 家只用来比对，**没有转载**进本站。比对结果：wuge 与本表在 40,868 个共有字形上只差 92 字，bys 与 shunshi 的差异多半是把繁体折回简体或异体（如 shunshi 的「姜」给 19 画、「松」给 18 画，是按「薑」「鬆」算的），不宜整表采用。

**简体怎么办。** 先经 `st.js` 转成繁体（康熙字形）再查表，如「刘→劉 15」；页面另有一小张姓名用字的取舍（后、余、于、范、郁、岳、游、涂、党、咸、干、朴、种 作姓时不转；艳取「艷」等），并允许逐字改选、改画数。

**补位。** 《通用规范汉字表》、Big5 与 OpenCC 简繁表里，有 1,180 个字原书未收、转繁后也查不到（多为生僻字，也有《通用规范汉字表》2013 年新收的人名地名用字），按同一规矩估算：Unihan（Unicode 18.0，Unicode License v3）`kRSUnicode` 的部首取康熙原画（钅作金 8、纟作糸 6、讠作言 7）＋ 部外画，页面上标「估」，可手改。

**数字。** 姓名学通行「一至十按数意计」：一 1、二 2、三 3、四 4、五 5、六 6、七 7、八 8、九 9、十 10（原书四 5、五 4、六 4、七 2、八 2、九 2、十 2）；百 6、千 3、萬 15 仍按康熙笔画。此口径与 cnk3x/bys（`_kx_num`）、shunshi-ai/naming-mcp（万＝15）一致，写在 `xingming.js` 里，不改本表。

## 二、`st.js` · 简→繁

| 项 | 内容 |
|---|---|
| 来源 | [BYVoid/OpenCC](https://github.com/BYVoid/OpenCC) `data/dictionary/STCharacters.txt`（Apache License 2.0，© Carbo Kuo 与 OpenCC 贡献者） |
| 内容 | 4,012 条简体字 → 繁体候选（第一个为 OpenCC 默认） |
| 改动 | 只取单字表，改写成一行以空格分隔的字串（每段首字为简体，其后为繁体候选）；内容未增删 |

## 三、81 数理与三才（写在 `xingming.js` 里）

吉凶判定只是事实性的分类，比对了以下几家后取多数（两两相持时从流传最广的「吉 / 次吉 / 凶」分法），**释义是本站自己写的白话，没有照抄任何一家**：

- 81 数理：[babyname/fate](https://github.com/babyname/fate) `internal/wuge/dayan.go`（MIT）、whmnoe4j/Calendar（MIT，经 hongyuanjia/wuge `shuli.csv` 转录）、[shunshi-ai/naming-mcp](https://github.com/shunshi-ai/naming-mcp) `shuli-81.json.gz`（MIT）、cnk3x/bys `bys.go`（Apache-2.0）。
- 三才 125 种：[JakLiao/GoodGoodName](https://github.com/JakLiao/GoodGoodName) `data/sancai.txt`（MIT，124 种，缺「金金火」）、babyname/fate `internal/wuxing/wu_xing.go`（MIT，同一来源）、shunshi-ai/naming-mcp `sancai-125.json.gz`（MIT，补了金金火）。原表七档（大吉、中吉、吉、吉多于凶、吉凶参半、凶多于吉、大凶）并为五档：大吉；吉（中吉、吉）；半吉（吉多于凶、吉凶参半）；凶（凶多于吉、凶多吉少）；大凶。金金火取「凶」。

## 四、看过而没用的

- caiguanhao/ChineseStrokes：八万余字，但没有许可文件，且是现代笔画。
- 7468696e6b/kangxiDictText：《康熙字典》全文，条目里没有画数。

---

## 许可全文

### breezyreeds/kangxi-strokecount（MIT）

```
MIT License

Copyright (c) 2017-2018 Kawai Lo

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

### BYVoid/OpenCC（Apache License 2.0）

OpenCC 没有 NOTICE 文件。本站对 `STCharacters.txt` 的改动见上文第二节。

```
Apache License
Version 2.0, January 2004
http://www.apache.org/licenses/

TERMS AND CONDITIONS FOR USE, REPRODUCTION, AND DISTRIBUTION

1. Definitions.

"License" shall mean the terms and conditions for use, reproduction, and distribution as defined by Sections 1 through 9 of this document.

"Licensor" shall mean the copyright owner or entity authorized by the copyright owner that is granting the License.

"Legal Entity" shall mean the union of the acting entity and all other entities that control, are controlled by, or are under common control with that entity. For the purposes of this definition, "control" means (i) the power, direct or indirect, to cause the direction or management of such entity, whether by contract or otherwise, or (ii) ownership of fifty percent (50%) or more of the outstanding shares, or (iii) beneficial ownership of such entity.

"You" (or "Your") shall mean an individual or Legal Entity exercising permissions granted by this License.

"Source" form shall mean the preferred form for making modifications, including but not limited to software source code, documentation source, and configuration files.

"Object" form shall mean any form resulting from mechanical transformation or translation of a Source form, including but not limited to compiled object code, generated documentation, and conversions to other media types.

"Work" shall mean the work of authorship, whether in Source or Object form, made available under the License, as indicated by a copyright notice that is included in or attached to the work (an example is provided in the Appendix below).

"Derivative Works" shall mean any work, whether in Source or Object form, that is based on (or derived from) the Work and for which the editorial revisions, annotations, elaborations, or other modifications represent, as a whole, an original work of authorship. For the purposes of this License, Derivative Works shall not include works that remain separable from, or merely link (or bind by name) to the interfaces of, the Work and Derivative Works thereof.

"Contribution" shall mean any work of authorship, including the original version of the Work and any modifications or additions to that Work or Derivative Works thereof, that is intentionally submitted to Licensor for inclusion in the Work by the copyright owner or by an individual or Legal Entity authorized to submit on behalf of the copyright owner. For the purposes of this definition, "submitted" means any form of electronic, verbal, or written communication sent to the Licensor or its representatives, including but not limited to communication on electronic mailing lists, source code control systems, and issue tracking systems that are managed by, or on behalf of, the Licensor for the purpose of discussing and improving the Work, but excluding communication that is conspicuously marked or otherwise designated in writing by the copyright owner as "Not a Contribution."

"Contributor" shall mean Licensor and any individual or Legal Entity on behalf of whom a Contribution has been received by Licensor and subsequently incorporated within the Work.

2. Grant of Copyright License. Subject to the terms and conditions of this License, each Contributor hereby grants to You a perpetual, worldwide, non-exclusive, no-charge, royalty-free, irrevocable copyright license to reproduce, prepare Derivative Works of, publicly display, publicly perform, sublicense, and distribute the Work and such Derivative Works in Source or Object form.

3. Grant of Patent License. Subject to the terms and conditions of this License, each Contributor hereby grants to You a perpetual, worldwide, non-exclusive, no-charge, royalty-free, irrevocable (except as stated in this section) patent license to make, have made, use, offer to sell, sell, import, and otherwise transfer the Work, where such license applies only to those patent claims licensable by such Contributor that are necessarily infringed by their Contribution(s) alone or by combination of their Contribution(s) with the Work to which such Contribution(s) was submitted. If You institute patent litigation against any entity (including a cross-claim or counterclaim in a lawsuit) alleging that the Work or a Contribution incorporated within the Work constitutes direct or contributory patent infringement, then any patent licenses granted to You under this License for that Work shall terminate as of the date such litigation is filed.

4. Redistribution. You may reproduce and distribute copies of the Work or Derivative Works thereof in any medium, with or without modifications, and in Source or Object form, provided that You meet the following conditions:

   1. You must give any other recipients of the Work or Derivative Works a copy of this License; and

   2. You must cause any modified files to carry prominent notices stating that You changed the files; and

   3. You must retain, in the Source form of any Derivative Works that You distribute, all copyright, patent, trademark, and attribution notices from the Source form of the Work, excluding those notices that do not pertain to any part of the Derivative Works; and

   4. If the Work includes a "NOTICE" text file as part of its distribution, then any Derivative Works that You distribute must include a readable copy of the attribution notices contained within such NOTICE file, excluding those notices that do not pertain to any part of the Derivative Works, in at least one of the following places: within a NOTICE text file distributed as part of the Derivative Works; within the Source form or documentation, if provided along with the Derivative Works; or, within a display generated by the Derivative Works, if and wherever such third-party notices normally appear. The contents of the NOTICE file are for informational purposes only and do not modify the License. You may add Your own attribution notices within Derivative Works that You distribute, alongside or as an addendum to the NOTICE text from the Work, provided that such additional attribution notices cannot be construed as modifying the License.

You may add Your own copyright statement to Your modifications and may provide additional or different license terms and conditions for use, reproduction, or distribution of Your modifications, or for any such Derivative Works as a whole, provided Your use, reproduction, and distribution of the Work otherwise complies with the conditions stated in this License.

5. Submission of Contributions. Unless You explicitly state otherwise, any Contribution intentionally submitted for inclusion in the Work by You to the Licensor shall be under the terms and conditions of this License, without any additional terms or conditions. Notwithstanding the above, nothing herein shall supersede or modify the terms of any separate license agreement you may have executed with Licensor regarding such Contributions.

6. Trademarks. This License does not grant permission to use the trade names, trademarks, service marks, or product names of the Licensor, except as required for reasonable and customary use in describing the origin of the Work and reproducing the content of the NOTICE file.

7. Disclaimer of Warranty. Unless required by applicable law or agreed to in writing, Licensor provides the Work (and each Contributor provides its Contributions) on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied, including, without limitation, any warranties or conditions of TITLE, NON-INFRINGEMENT, MERCHANTABILITY, or FITNESS FOR A PARTICULAR PURPOSE. You are solely responsible for determining the appropriateness of using or redistributing the Work and assume any risks associated with Your exercise of permissions under this License.

8. Limitation of Liability. In no event and under no legal theory, whether in tort (including negligence), contract, or otherwise, unless required by applicable law (such as deliberate and grossly negligent acts) or agreed to in writing, shall any Contributor be liable to You for damages, including any direct, indirect, special, incidental, or consequential damages of any character arising as a result of this License or out of the use or inability to use the Work (including but not limited to damages for loss of goodwill, work stoppage, computer failure or malfunction, or any and all other commercial damages or losses), even if such Contributor has been advised of the possibility of such damages.

9. Accepting Warranty or Additional Liability. While redistributing the Work or Derivative Works thereof, You may choose to offer, and charge a fee for, acceptance of support, warranty, indemnity, or other liability obligations and/or rights consistent with this License. However, in accepting such obligations, You may act only on Your own behalf and on Your sole responsibility, not on behalf of any other Contributor, and only if You agree to indemnify, defend, and hold each Contributor harmless for any liability incurred by, or claims asserted against, such Contributor by reason of your accepting any such warranty or additional liability.

END OF TERMS AND CONDITIONS

```

### Unicode Unihan（Unicode License v3）

用到 Unihan 的 `kKangXi`、`kRSKangXi`（Unicode 15.0，校订用）与 `kRSUnicode`、`kTGH`、`kBigFive`（Unicode 18.0，估算补位与选字用）。

```
UNICODE LICENSE V3

COPYRIGHT AND PERMISSION NOTICE

Copyright © 1991-2026 Unicode, Inc.

NOTICE TO USER: Carefully read the following legal agreement. BY
DOWNLOADING, INSTALLING, COPYING OR OTHERWISE USING DATA FILES, AND/OR
SOFTWARE, YOU UNEQUIVOCALLY ACCEPT, AND AGREE TO BE BOUND BY, ALL OF THE
TERMS AND CONDITIONS OF THIS AGREEMENT. IF YOU DO NOT AGREE, DO NOT
DOWNLOAD, INSTALL, COPY, DISTRIBUTE OR USE THE DATA FILES OR SOFTWARE.

Permission is hereby granted, free of charge, to any person obtaining a
copy of data files and any associated documentation (the "Data Files") or
software and any associated documentation (the "Software") to deal in the
Data Files or Software without restriction, including without limitation
the rights to use, copy, modify, merge, publish, distribute, and/or sell
copies of the Data Files or Software, and to permit persons to whom the
Data Files or Software are furnished to do so, provided that either (a)
this copyright and permission notice appear with all copies of the Data
Files or Software, or (b) this copyright and permission notice appear in
associated Documentation.

THE DATA FILES AND SOFTWARE ARE PROVIDED "AS IS", WITHOUT WARRANTY OF ANY
KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT OF
THIRD PARTY RIGHTS.

IN NO EVENT SHALL THE COPYRIGHT HOLDER OR HOLDERS INCLUDED IN THIS NOTICE
BE LIABLE FOR ANY CLAIM, OR ANY SPECIAL INDIRECT OR CONSEQUENTIAL DAMAGES,
OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS,
WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION,
ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THE DATA
FILES OR SOFTWARE.

Except as contained in this notice, the name of a copyright holder shall
not be used in advertising or otherwise to promote the sale, use or other
dealings in these Data Files or Software without prior written
authorization of the copyright holder.
```
