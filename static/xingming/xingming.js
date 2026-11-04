/* =========================================================
   姓名学 · 五格剖象与三才 —— 只管算，不碰页面
   ---------------------------------------------------------
   口径（详见 RULES，页面「口径」与「问 AI」都用它）
     · 笔画：《康熙字典》笔画。简体先转繁体（OpenCC 单字表，另有一小张姓名用字取舍），
       再查 data/kangxi.js（部首按原字：氵4 扌4 忄4 艹6 辶7 阝左8 阝右7 王旁5 礻5 衤6 ⺼6 犭4 罒6……）。
       数字一至十按数意计（四作 4、九作 9、十作 10），百 6、千 3、萬 15 照康熙笔画。
     · 五格（熊崎氏）：天格＝单姓＋1（复姓两字相加）；人格＝姓末字＋名首字；地格＝单名＋1（双名相加）；
       外格＝天格＋地格－人格；总格＝各字笔画之和（不加假数）。数过 81 者减 80 再查。
     · 数的五行看尾数：1、2 木，3、4 火，5、6 土，7、8 金，9、0 水；奇数为阳，偶数为阴。
     · 81 数理分吉、半吉、凶三等；三才按 125 种配置表分大吉、吉、半吉、凶、大凶五等。
       吉凶判定比对多家取多数（来源见 data/LICENSE.md），释义是本站自己写的白话。
   浏览器里挂 window.XM（需先载 /xingming/data/kangxi.js、/xingming/data/st.js）；node 里 require 即得同一对象。
   ========================================================= */
(function (root) {
  'use strict';
  var NODE = typeof module !== 'undefined' && module.exports;
  var KX = NODE ? require('./data/kangxi.js') : root.XM_KANGXI;
  var STS = NODE ? require('./data/st.js') : root.XM_ST;

  /* ================ 简 → 繁 ================ */
  var ST = {};
  STS.split(' ').forEach(function (tok) { var a = Array.from(tok); if (a.length > 1) ST[a[0]] = a.slice(1); });
  // 姓名用字的取舍：OpenCC 的默认是一般文本里的繁体，人名里有些字本身就是正字（第一个为默认，后面为可选）
  var NAME_ALL = {
    '于': ['于', '於'], '余': ['余', '餘'], '后': ['后', '後'], '郁': ['郁', '鬱'], '涂': ['涂', '塗'],
    '游': ['游', '遊'], '岳': ['岳', '嶽'], '咸': ['咸', '鹹'], '干': ['干', '乾', '幹'], '党': ['党', '黨'],
    '丑': ['丑', '醜'], '斗': ['斗', '鬥'], '采': ['采', '採', '寀'], '征': ['征', '徵'], '里': ['里', '裏'],
    '艳': ['艷', '豔'], '冲': ['沖', '衝'], '熏': ['熏', '薰', '燻']
  };
  var NAME_SUR = {     // 只在作姓时
    '范': ['范', '範'], '朴': ['朴', '樸'], '种': ['种', '種'], '台': ['台', '臺'],
    '肖': ['肖', '蕭'], '闫': ['閆', '閻']
  };
  // 一个字的繁体候选（第一个为默认）
  function tradOf(ch, isSur) {
    var o = (isSur && NAME_SUR[ch]) || NAME_ALL[ch] || ST[ch];
    return o ? o.slice() : [ch];
  }

  /* ================ 康熙笔画 ================ */
  var NUM = { '一': 1, '二': 2, '三': 3, '四': 4, '五': 5, '六': 6, '七': 7, '八': 8, '九': 9, '十': 10 };
  // 表里的数：fix（本站校订）> kx（基本区）> more（其余区）> est（原书未收，按部首原画＋部外画估）
  function kxOf(ch) {
    if (!ch) return null;
    if (KX.fix[ch] != null) return { n: KX.fix[ch], src: 'fix' };
    var cp = ch.codePointAt(0), i = cp - KX.base;
    if (i >= 0 && i < KX.kx.length) { var v = KX.ALPH.indexOf(KX.kx.charAt(i)); if (v > 0) return { n: v, src: 'kx' }; }
    if (KX.more[ch] != null) return { n: KX.more[ch], src: 'kx' };
    if (KX.est[ch] != null) return { n: KX.est[ch], src: 'est' };
    return null;
  }
  // 姓名学笔画：一至十按数意，其余康熙；alt = 另说
  function strokesOf(ch) {
    var r = kxOf(ch);
    if (NUM[ch]) return { n: NUM[ch], src: 'num', kx: r ? r.n : null };
    if (!r) return null;
    if (KX.alt[ch] != null) r.alt = KX.alt[ch];
    return r;
  }
  var SRC_NAME = { kx: '康熙', fix: '康熙·校', num: '按数意', est: '估', user: '手改' };

  /* ================ 姓 ================ */
  var FU = ('欧阳 太史 端木 上官 司马 东方 独孤 南宫 万俟 闻人 夏侯 诸葛 尉迟 公羊 赫连 澹台 皇甫 宗政 濮阳 ' +
    '公冶 太叔 申屠 公孙 慕容 仲孙 钟离 长孙 宇文 司徒 鲜于 司空 闾丘 子车 亓官 司寇 巫马 公西 颛孙 壤驷 ' +
    '公良 漆雕 乐正 宰父 谷梁 拓跋 夹谷 轩辕 令狐 段干 百里 呼延 东郭 南门 羊舌 微生 公户 公玉 公仪 梁丘 ' +
    '公仲 公上 公门 公山 公坚 左丘 公伯 西门 公祖 第五 公乘 贯丘 公皙 南荣 东里 东宫 仲长 子书 子桑 即墨 ' +
    '达奚 褚师 淳于 单于 东门 北宫 西郭 叱干 纳兰 贺兰 完颜 归海').split(' ');
  var FU4 = '张简 范姜 张廖'.split(' ');      // 台湾双姓：只在四字姓名里认
  var DAN = '王李张刘陈杨黄赵吴周徐孙马朱胡郭何高林罗郑梁谢宋唐许韩冯邓曹彭曾肖田董袁潘于蒋蔡余杜叶程苏魏吕丁任沈姚卢姜崔钟谭陆汪范金石廖贾夏韦付傅方白邹孟熊秦邱江尹薛闫阎段雷侯龙史陶黎贺顾毛郝龚邵万钱严覃武戴莫孔向汤常温康施文牛樊葛邢安齐易乔伍庞颜倪庄聂章鲁岳翟殷詹申欧耿关兰焦俞左柳甘祝包宁尚符舒阮柯纪梅童凌毕单季裴霍涂成苗谷盛曲翁冉骆蓝路游辛靳管柴蒙鲍华喻祁蒲房滕屈饶解牟艾尤阳时穆农司卓古吉缪简车项连芦麦褚娄窦戚岑景党宫费卜冷晏席卫米柏宗瞿桂全佟应臧闵苟邬边卞姬师和仇栾隋商刁沙荣巫寇桑郎甄丛仲虞敖巩明佘池查麻苑迟邝官封谈匡鞠惠荆乐冀郁胥南班储原栗燕楚鄢劳谌奚皮粟冼蔺楼盘满闻位厉伊仝区郜海阚花权强帅屠豆朴盖练廉禹井祖漆巴丰支卿国狄平计索宣晋相初门云容敬来扈晁芮都普阙浦戈伏鹿薄邸雍辜羊乌母裘亓修邰赫杭况那宿鲜印逯隆茹诸战慕危玉银亢嵇公哈湛宾戎勾茅利於居揭干但尉冶斯元束檀衣信展阴昝智幸奉植衡富尧由酆贲邴糜松宓蓬郗暴钭蓟怀鄂籍能苍双莘逄郦却璩濮寿通扶堵宰充慎庾终暨步弘禄殳沃蔚越夔厍融訾空毋乜养须巢蒯后红竺益桓钦缑有琴归墨谯笪年爱佴伯赏福言';
  // 每个姓连同它的繁体（含姓名用字取舍）都认
  function spellings(word) {
    var out = [''];
    Array.from(word).forEach(function (c) {
      var vs = [c].concat(tradOf(c, true), ST[c] || []), next = [];
      out.forEach(function (p) { vs.forEach(function (v) { if (next.indexOf(p + v) < 0) next.push(p + v); }); });
      out = next;
    });
    return out;
  }
  var FU_SET = {}, FU4_SET = {}, DAN_SET = {};
  FU.forEach(function (w) { spellings(w).forEach(function (s) { FU_SET[s] = w; }); });
  FU4.forEach(function (w) { spellings(w).forEach(function (s) { FU4_SET[s] = w; }); });
  Array.from(DAN).forEach(function (w) { spellings(w).forEach(function (s) { DAN_SET[s] = w; }); });
  function isSurname(s) { return !!(FU_SET[s] || FU4_SET[s] || DAN_SET[s]); }

  /* ================ 拆姓名 ================ */
  var HAN = /\p{Script=Han}/u, SEP = /[\s·・•．.\-_|/／,，、]+/;
  function hanOnly(s) {
    var a = Array.from(String(s || '').normalize('NFC')).filter(function (c) { return HAN.test(c) && c !== '〇'; });
    for (var i = 1; i < a.length; i++) if (a[i] === '々' || a[i] === '〻') a[i] = a[i - 1];   // 叠字符号：照前一字
    return a.filter(function (c) { return c !== '々' && c !== '〻'; });
  }
  // 返回 { sur:[字], giv:[字], how:'sep'|'fu'|'fu4'|'dan', err }
  //   how = 'sep' 是用户用空格等分开的；'fu' 认出复姓；'dan' 按单姓
  function split(raw) {
    var s = String(raw || '').normalize('NFC').trim(), out = { sur: [], giv: [], how: 'dan', err: '' };
    var parts = s.split(SEP).map(hanOnly).filter(function (p) { return p.length; });
    if (!parts.length) { out.err = s ? '只认汉字' : ''; return out; }
    if (parts.length > 1) {
      out.how = 'sep'; out.sur = parts[0]; out.giv = [].concat.apply([], parts.slice(1));
    } else {
      var a = parts[0], two = a.slice(0, 2).join('');
      if (a.length >= 2 && FU_SET[two] && a.length <= 4) { out.how = 'fu'; out.sur = a.slice(0, 2); out.giv = a.slice(2); }
      else if (a.length === 4 && FU4_SET[two]) { out.how = 'fu4'; out.sur = a.slice(0, 2); out.giv = a.slice(2); }
      else { out.sur = a.slice(0, 1); out.giv = a.slice(1); }
    }
    if (out.sur.length > 2) out.err = '姓最多两个字';
    else if (out.giv.length > 2) out.err = out.how === 'dan' && out.sur.length + out.giv.length === 4
      ? '四个字认不出复姓；若是复姓，请在姓和名之间加空格' : '名最多两个字（本页只排一两字的名）';
    return out;
  }

  /* ================ 81 数理 ================ */
  // [吉凶, 白话]；吉凶比对 fate、whmnoe4j/Calendar、shunshi、bys 四家取多数（见 data/LICENSE.md）
  var SHULI = [null,
    ['吉', '万物起头之数：独立开创，名利可期。'],
    ['凶', '两头摇摆：心志不定，力量分散，事多半途而废。'],
    ['吉', '天地人和：头脑灵活，进取顺利，名利双收。'],
    ['凶', '根基不稳：劳多功少，凡事宜慎，留意身体。'],
    ['吉', '阴阳调和：家业兴旺，福寿绵长。'],
    ['吉', '承上启下：安稳富足，家道安宁。'],
    ['吉', '刚健独立：意志坚定，能独当一面；过刚宜柔。'],
    ['吉', '坚忍耐劳：肯吃苦，靠实干一步步成功。'],
    ['凶', '有才难伸：易孤立失意，起落较大。'],
    ['凶', '空乏零落：心力常常白费，事易落空。'],
    ['吉', '枯木逢春：稳中求进，渐入佳境，可兴家业。'],
    ['凶', '力不从心：心有余而力不足，计划难落实。'],
    ['吉', '才艺多能：聪明善谋，应变快，易得人望。'],
    ['凶', '亲缘淡薄：多忧多劳，事难如愿。'],
    ['吉', '福寿双全：温和有德，受人敬重，富贵安康。'],
    ['吉', '厚重得众：宽厚得人心，贵人扶持，能成大事。'],
    ['半吉', '刚强突破：敢闯能扛事，但过刚易与人冲突。'],
    ['吉', '有谋有力：名利可得，宜养柔和之德。'],
    ['凶', '多难之数：才智虽好，常遇阻滞，大起大落。'],
    ['凶', '虚空之数：根基薄，波折多，事难长久。'],
    ['吉', '明月中天：能独当一面，名利兼收（旧说女性用之嫌刚）。'],
    ['凶', '秋草逢霜：怀才不遇，意志消沉，事多不顺。'],
    ['吉', '旭日东升：气势旺，进取心强，功名显达（旧说女性用之嫌刚）。'],
    ['吉', '白手起家：靠自己积累财富，晚景丰足。'],
    ['吉', '英敏有才：聪明自信，自成一格；宜收傲气。'],
    ['凶', '变怪之数：一生多变，有侠气，成败起伏剧烈。'],
    ['半吉', '自我强盛：有冲劲，但易招非议，宜多合众。'],
    ['凶', '浮萍漂泊：动荡劳碌，难得安定。'],
    ['吉', '智谋过人：心思细密，财力渐聚，可成大业。'],
    ['半吉', '浮沉不定：成败参半，运气起伏，宜稳慎。'],
    ['吉', '智勇兼备：能聚人心，事业顺遂。'],
    ['吉', '贵人多助：机缘好，顺势而起。'],
    ['吉', '旭日升天：才华外露，声名远扬（旧说女性用之嫌刚）。'],
    ['凶', '破家之数：变故多，易受牵累，难享安宁。'],
    ['吉', '温和平静：宜文艺技术，安稳有成。'],
    ['凶', '风浪重叠：重义气、好出头，一生风波不断。'],
    ['吉', '权威显达：热诚有担当，能得信任。'],
    ['半吉', '磨铁成针：才力平平，专精一艺可有所成。'],
    ['吉', '先苦后荣：终得富贵，风光处也藏风险（旧说女性用之嫌刚）。'],
    ['凶', '沉浮难定：好冒险投机，宜见好就收、退守保安。'],
    ['吉', '德望兼备：稳健向上，前程远大。'],
    ['凶', '多艺不精：样样会而难专，用心专一尚可有成。'],
    ['凶', '散财之数：财来财去，外表光鲜，内里空虚。'],
    ['凶', '愁苦之数：心事重，事与愿违，易生波折。'],
    ['吉', '顺风扬帆：思虑周全，顺势而行，渐成大业。'],
    ['凶', '载宝沉舟：艰难重重，付出多，回报迟。'],
    ['吉', '开花结果：得合作之力，事业有成，家庭和顺。'],
    ['吉', '古松立鹤：智德兼备，可为众人依靠。'],
    ['半吉', '吉凶随境：遇好则好，遇坏则坏，变化大。'],
    ['半吉', '一成一败：前半顺、后半难，宜早作打算。'],
    ['半吉', '盛衰交替：起起落落，稳健守成尚可有成。'],
    ['吉', '先见之明：判断准，眼光远，名利双收。'],
    ['凶', '外祥内忧：表面顺利，内里多忧，前后反差大。'],
    ['凶', '石上栽花：难以立足，忧烦接连。'],
    ['半吉', '外盛内虚：表面兴旺，内藏隐患，盛极须防衰。'],
    ['凶', '处处阻滞：缺乏后劲，难以成事。'],
    ['吉', '寒松逢春：历经一番困苦，终得繁荣。'],
    ['半吉', '先苦后甜：前段辛苦，后段转好，大器晚成。'],
    ['凶', '意志消沉：缺乏耐心与魄力，苦多乐少。'],
    ['凶', '迷途无谋：方向不明，漂浮不定。'],
    ['吉', '名利双收：宜谦和修身，免生内争。'],
    ['凶', '衰退之数：内外不和，根基渐弱，志向难伸。'],
    ['吉', '舟归平海：身心安泰，诸事亨通。'],
    ['凶', '孤苦之数：亲缘薄，劳而少功，易感孤独。'],
    ['吉', '巨流归海：家运兴隆，平安长寿。'],
    ['凶', '进退两难：处处掣肘，宜守待时。'],
    ['吉', '通达之数：运势顺畅，独立成事，家道兴旺。'],
    ['吉', '精明创造：计划周密，能开新局。'],
    ['凶', '坐立不安：心神不定，易受外界冲击。'],
    ['凶', '寂寞凄凉：多忧愁，晚景冷清。'],
    ['半吉', '外静内劳：内心辛苦，坚持到底可成。'],
    ['凶', '外吉内忧：看似顺利，实多隐患，后半辛苦。'],
    ['半吉', '志高力弱：魄力不足，平稳度日尚可。'],
    ['凶', '徒劳之数：缺少计划，劳碌而难有所获。'],
    ['半吉', '宜守不宜攻：安分保守可保平安。'],
    ['凶', '离散之数：家人聚少离多，虽劳少功。'],
    ['半吉', '吉凶参半：前后境遇反转，宜早防备。'],
    ['凶', '先荣后枯：中年前尚可，晚景转弱，宜早安排。'],
    ['凶', '前路不明：精神不振，难成大事。'],
    ['凶', '隐遁之数：辛劳多病，宜安分修身以化凶。'],
    ['吉', '还本归元：同 1 之数，福禄重来。']
  ];
  function shuliNum(n) { n = Math.round(+n); while (n > 81) n -= 80; return n; }
  function shuli(n) { var k = shuliNum(n), e = SHULI[k]; return e ? { num: k, lv: e[0], text: e[1] } : null; }

  /* ================ 五行 ================ */
  var WX = ['木', '火', '土', '金', '水'];
  function wxOf(n) { return WX[[4, 0, 0, 1, 1, 2, 2, 3, 3, 4][n % 10]]; }   // 尾数 1、2 木 … 9、0 水
  function yyOf(n) { return n % 2 ? '阳' : '阴'; }
  var SHENG = { 木: '火', 火: '土', 土: '金', 金: '水', 水: '木' }, KE = { 木: '土', 土: '水', 水: '火', 火: '金', 金: '木' };
  // a 对 b：'生'（a 生 b）、'被生'、'克'（a 克 b）、'被克'、'比和'
  function rel(a, b) {
    if (a === b) return '比和';
    if (SHENG[a] === b) return '生';
    if (SHENG[b] === a) return '被生';
    if (KE[a] === b) return '克';
    return '被克';
  }

  /* ================ 三才 ================ */
  // 125 种配置（天人地）：GoodGoodName / fate 同源的七档表并为五档，金金火从 shunshi 补（见 data/LICENSE.md）
  var SANCAI = {
    木木木: '大吉', 木木火: '大吉', 木木土: '大吉', 木木金: '凶', 木木水: '半吉',
    木火木: '大吉', 木火火: '吉', 木火土: '大吉', 木火金: '凶', 木火水: '大凶',
    木土木: '大凶', 木土火: '吉', 木土土: '吉', 木土金: '半吉', 木土水: '大凶',
    木金木: '大凶', 木金火: '大凶', 木金土: '凶', 木金金: '大凶', 木金水: '大凶',
    木水木: '大吉', 木水火: '凶', 木水土: '凶', 木水金: '大吉', 木水水: '大吉',
    火木木: '大吉', 火木火: '大吉', 火木土: '大吉', 火木金: '凶', 火木水: '吉',
    火火木: '大吉', 火火火: '吉', 火火土: '大吉', 火火金: '大凶', 火火水: '大凶',
    火土木: '半吉', 火土火: '大吉', 火土土: '大吉', 火土金: '大吉', 火土水: '半吉',
    火金木: '大凶', 火金火: '大凶', 火金土: '半吉', 火金金: '大凶', 火金水: '大凶',
    火水木: '凶', 火水火: '大凶', 火水土: '大凶', 火水金: '大凶', 火水水: '大凶',
    土木木: '吉', 土木火: '吉', 土木土: '凶', 土木金: '大凶', 土木水: '凶',
    土火木: '大吉', 土火火: '大吉', 土火土: '大吉', 土火金: '半吉', 土火水: '大凶',
    土土木: '吉', 土土火: '大吉', 土土土: '大吉', 土土金: '大吉', 土土水: '凶',
    土金木: '凶', 土金火: '凶', 土金土: '大吉', 土金金: '大吉', 土金水: '大吉',
    土水木: '凶', 土水火: '大凶', 土水土: '大凶', 土水金: '半吉', 土水水: '大凶',
    金木木: '凶', 金木火: '凶', 金木土: '凶', 金木金: '大凶', 金木水: '凶',
    金火木: '凶', 金火火: '半吉', 金火土: '半吉', 金火金: '大凶', 金火水: '大凶',
    金土木: '吉', 金土火: '大吉', 金土土: '大吉', 金土金: '大吉', 金土水: '半吉',
    金金木: '大凶', 金金火: '凶', 金金土: '大吉', 金金金: '吉', 金金水: '吉',
    金水木: '大吉', 金水火: '凶', 金水土: '吉', 金水金: '大吉', 金水水: '吉',
    水木木: '大吉', 水木火: '大吉', 水木土: '大吉', 水木金: '凶', 水木水: '大吉',
    水火木: '吉', 水火火: '大凶', 水火土: '凶', 水火金: '大凶', 水火水: '大凶',
    水土木: '大凶', 水土火: '吉', 水土土: '吉', 水土金: '吉', 水土水: '大凶',
    水金木: '凶', 水金火: '凶', 水金土: '大吉', 水金金: '吉', 水金水: '大吉',
    水水木: '大吉', 水水火: '大凶', 水水土: '大凶', 水水金: '大吉', 水水水: '吉'
  };
  // 天对人看「成功运」，人对地看「基础运」
  var REL_UP = {
    被生: '天生人：上方生扶，易得长辈与环境助力',
    生: '人生天：向上付出，成功多靠自己打拼',
    比和: '天人比和：上下同气，进展平顺',
    被克: '天克人：上方压制，易受环境或长辈约束',
    克: '人克天：敢向上冲撞，有闯劲也易与上级不和'
  };
  var REL_DOWN = {
    被生: '地生人：根基托得住，家庭与下属可依靠',
    生: '人生地：向下付出，照顾家人部属，多耗心力',
    比和: '人地比和：根基与本人同气，安稳',
    被克: '地克人：根基反制，家宅或下属多牵累',
    克: '人克地：压得住根基，能掌控局面，也易不稳'
  };
  var SC_SAY = {
    大吉: '成功运与基础运两头都顺，是好配置。',
    吉: '大体顺利，小有不足。',
    半吉: '顺逆参半，要看其他各格配合。',
    凶: '成功或根基有一头吃亏，旧说主劳碌。',
    大凶: '相克较重，旧说主波折多，起名时宜避开。'
  };
  function sancai(tian, ren, di) {
    var a = wxOf(tian), b = wxOf(ren), c = wxOf(di), key = a + b + c, lv = SANCAI[key];
    return {
      key: key, wx: [a, b, c], lv: lv,
      up: REL_UP[rel(b, a)], down: REL_DOWN[rel(b, c)],
      upRel: rel(a, b), downRel: rel(b, c),
      say: SC_SAY[lv]
    };
  }

  /* ================ 一个名字 ================ */
  var GE = [
    { k: 'tian', n: '天格', role: '先天', d: '由姓而来，祖上所传，只列不论' },
    { k: 'ren', n: '人格', role: '主运', d: '性格与一生的主轴，最要紧' },
    { k: 'di', n: '地格', role: '前运', d: '少年至中年前，家庭与根基' },
    { k: 'wai', n: '外格', role: '副运', d: '人缘、外援、社交' },
    { k: 'zong', n: '总格', role: '后运', d: '中年以后，一生的收成' }
  ];
  // 五格：S 姓各字笔画，G 名各字笔画
  function wuge(S, G) {
    var s1 = S[0], s2 = S.length > 1 ? S[1] : 0, g1 = G[0], g2 = G.length > 1 ? G[1] : 0;
    var tian = S.length > 1 ? s1 + s2 : s1 + 1;
    var ren = S[S.length - 1] + g1;
    var di = G.length > 1 ? g1 + g2 : g1 + 1;
    var zong = s1 + s2 + g1 + g2;
    return { tian: tian, ren: ren, di: di, wai: tian + di - ren, zong: zong };
  }
  // 公式（写给人看的）：L 为各字的 { t: 繁体, n: 笔画 }
  function formulas(L, ns) {
    var S = L.slice(0, ns), G = L.slice(ns), f = function (x) { return x.t + ' ' + x.n; };
    var two = S.length > 1, dbl = G.length > 1;
    return {
      tian: two ? f(S[0]) + ' ＋ ' + f(S[1]) : f(S[0]) + ' ＋ 1',
      ren: f(S[S.length - 1]) + ' ＋ ' + f(G[0]),
      di: dbl ? f(G[0]) + ' ＋ ' + f(G[1]) : f(G[0]) + ' ＋ 1',
      wai: two ? f(S[0]) + ' ＋ ' + (dbl ? f(G[1]) : '1') : dbl ? '1 ＋ ' + f(G[1]) : '1 ＋ 1（单姓单名恒为 2）',
      zong: L.map(function (x) { return x.n; }).join(' ＋ ')
    };
  }
  var GP = { 吉: 1, 半吉: 0.5, 凶: 0 }, SP = { 大吉: 1, 吉: 0.8, 半吉: 0.5, 凶: 0.2, 大凶: 0 };
  var WEIGHT = { ren: 30, di: 20, zong: 20, wai: 10, sancai: 20 };
  function scoreOf(R) {
    return Math.round(WEIGHT.ren * GP[R.ge.ren.lv] + WEIGHT.di * GP[R.ge.di.lv] + WEIGHT.zong * GP[R.ge.zong.lv] +
      WEIGHT.wai * GP[R.ge.wai.lv] + WEIGHT.sancai * SP[R.sancai.lv]);
  }
  function gradeOf(R) {
    var s = R.score, g = s >= 85 ? '上佳' : s >= 70 ? '偏吉' : s >= 50 ? '中平' : '偏弱';
    // 主运落凶数、或三才大凶：分再高也只算中平
    if ((R.ge.ren.lv === '凶' || R.sancai.lv === '大凶') && (g === '上佳' || g === '偏吉')) g = '中平';
    return g;
  }

  // 一个字：c 为输入的字，isSur 是否在姓里；opt.pick[c] = 选用的繁体，opt.fix[繁体] = 手改的笔画
  function charInfo(c, isSur, opt) {
    var cands = tradOf(c, isSur), pick = opt.pick && opt.pick[c];
    var t = pick && cands.indexOf(pick) >= 0 ? pick : cands[0];
    var s = strokesOf(t), viaInput = false;
    if (!s && t !== c) { s = strokesOf(c); viaInput = !!s; }
    var user = opt.fix && opt.fix[t] != null ? +opt.fix[t] : null;
    var o = {
      c: c, t: t, sur: isSur, cands: cands.map(function (x) { var y = strokesOf(x); return { t: x, n: y ? y.n : null }; }),
      base: s ? s.n : null, alt: s && s.alt != null ? s.alt : null, src: s ? s.src : null, kxRaw: s && s.kx != null ? s.kx : null,
      viaInput: viaInput, user: user != null
    };
    o.n = user != null ? user : o.base;
    if (user != null) o.src = 'user';
    o.srcName = o.src ? SRC_NAME[o.src] : '表中无此字';
    return o;
  }

  // sur, giv：输入的字（数组或字串）；opt：{ pick, fix }
  function analyze(sur, giv, opt) {
    opt = opt || {};
    sur = typeof sur === 'string' ? hanOnly(sur) : sur.slice();
    giv = typeof giv === 'string' ? hanOnly(giv) : giv.slice();
    var L = sur.map(function (c) { return charInfo(c, true, opt); }).concat(giv.map(function (c) { return charInfo(c, false, opt); }));
    var R = {
      sur: sur, giv: giv, chars: L, compound: sur.length > 1,
      name: sur.join('') + giv.join(''), tname: L.map(function (x) { return x.t; }).join(''),
      missing: L.filter(function (x) { return !x.n; }).map(function (x) { return x.t; })
    };
    R.kind = (sur.length > 1 ? '复姓' : '单姓') + (giv.length > 1 ? '双名' : '单名');
    R.ok = sur.length >= 1 && sur.length <= 2 && giv.length >= 1 && giv.length <= 2 && !R.missing.length;
    if (!R.ok) return R;
    var ns = sur.length, S = L.slice(0, ns).map(function (x) { return x.n; }), G = L.slice(ns).map(function (x) { return x.n; });
    var w = wuge(S, G), F = formulas(L, ns);
    R.ge = {};
    GE.forEach(function (g) {
      var n = w[g.k], sl = shuli(n);
      R.ge[g.k] = { k: g.k, name: g.n, role: g.role, d: g.d, n: n, num: sl.num, wx: wxOf(n), yy: yyOf(n), lv: sl.lv, text: sl.text, formula: F[g.k] };
    });
    R.sancai = sancai(w.tian, w.ren, w.di);
    R.score = scoreOf(R);
    R.grade = gradeOf(R);
    R.say = summary(R);
    return R;
  }
  function analyzeName(full, opt) { var p = split(full); return p.err || !p.sur.length ? Object.assign({ ok: false, err: p.err }, p) : Object.assign(analyze(p.sur, p.giv, opt), { how: p.how }); }

  // 白话总评：head（金句）、tail，lines：[[标签, 文字]]
  function summary(R) {
    var G = R.ge, sc = R.sancai, judged = ['ren', 'di', 'wai', 'zong'];
    var good = judged.filter(function (k) { return G[k].lv === '吉'; }), bad = judged.filter(function (k) { return G[k].lv === '凶'; });
    var lab = function (k) { return G[k].name + '（' + G[k].role + (k === 'wai' && R.kind === '单姓单名' ? '，单姓单名恒为 2' : '') + '）'; };
    var head = '整体' + R.grade;
    var tail = '人格 ' + G.ren.n + ' ' + G.ren.lv + '、总格 ' + G.zong.n + ' ' + G.zong.lv + '，三才' + sc.key + sc.lv;
    var lines = [];
    if (good.length) lines.push(['好处', good.map(lab).join('、') + (good.length > 1 ? '都是' : '是') + '吉数' + (good.indexOf('ren') >= 0 ? '，主轴稳' : '') + '。']);
    if (bad.length) lines.push(['留意', bad.map(lab).join('、') + '落在凶数' + (bad.indexOf('ren') >= 0 ? '；人格是五格里最要紧的一格' : '') + '。']);
    var half = judged.filter(function (k) { return G[k].lv === '半吉'; });
    if (half.length && !bad.length) lines.push(['留意', half.map(lab).join('、') + '是半吉数，吉中有变。']);
    lines.push(['三才', sc.key + '（' + sc.lv + '）：' + sc.say]);
    var tip;
    if (bad.indexOf('ren') >= 0 || bad.indexOf('zong') >= 0) tip = '若是起名，先换字让人格（姓末字＋名首字）与总格落在吉数；已用多年的名字不必为此改名。';
    else if (sc.lv === '凶' || sc.lv === '大凶') tip = '数理尚可，三才不顺；起名时可调名首字的笔画，让人格的五行与天、地相生。';
    else if (bad.length === 1 && bad[0] === 'wai' && R.kind === '单姓单名') tip = '外格恒为 2 是单姓单名的通例，想避开只能取双名；其余配得好，不必太在意。';
    else if (bad.length) tip = '小有不足，看重的话可调名末字的笔画；整体不必太在意。';
    else tip = '数理与三才都过得去，起名时再看音、形、义即可。';
    lines.push(['建议', tip]);
    return { head: head, tail: tail, lines: lines };
  }

  /* ================ 候选名 ================ */
  // 一段文字 → 候选名：空格、逗号、顿号、换行都可分隔；有姓时两字以内当作名
  function parseCands(text, sur) {
    var toks = String(text || '').normalize('NFC').split(/[\s,，、;；|/／]+/), out = [], seen = {};
    toks.forEach(function (tk) {
      var a = hanOnly(tk);
      if (!a.length) return;
      var p;
      if (sur && sur.length && a.length <= 2) p = { sur: sur.slice(), giv: a, how: 'given' };
      else p = split(a.join(''));
      var key = p.sur.join('') + '|' + p.giv.join('');
      if (seen[key]) return; seen[key] = 1;
      out.push({ raw: tk, sur: p.sur, giv: p.giv, err: p.err || (!p.giv.length ? '缺名' : '') });
    });
    return out;
  }
  var MAX_CANDS = 60;
  function compare(text, sur, opt) {
    var all = parseCands(text, sur), extra = Math.max(0, all.length - MAX_CANDS);
    var list = all.slice(0, MAX_CANDS).map(function (p, i) {
      var R = p.err ? { ok: false, name: p.sur.join('') + p.giv.join(''), err: p.err } : analyze(p.sur, p.giv, opt);
      R.order = i; R.raw = p.raw;
      return R;
    });
    var rank = function (R) { return R.ok ? [R.score, GP[R.ge.ren.lv], GP[R.ge.zong.lv], SP[R.sancai.lv]] : [-1, 0, 0, 0]; };
    list.sort(function (a, b) {
      var x = rank(a), y = rank(b);
      for (var i = 0; i < x.length; i++) if (x[i] !== y[i]) return y[i] - x[i];
      return a.order - b.order;
    });
    list.extra = extra;   // 超过上限没排的个数
    return list;
  }

  /* ================ 口径 ================ */
  var RULES = [
    ['笔画', '以《康熙字典》为准：简体先转繁体（刘→劉、陈→陳），部首按原字算——氵4（水）、扌4（手）、忄4（心）、艹6（艸）、辶7（辵）、阝在左8（阜）、阝在右7（邑）、王字旁5（玉）、礻5（示）、衤6（衣）、月作肉旁6（肉；作月亮讲的仍是4，如朋、期）、犭4（犬）、罒6（网）；纟、钅、讠、门、页等简化偏旁随繁体还原（糸6、金8、言7、門8、頁9）。'],
    ['数字', '一至十按数意计：一1、二2……四4、五5、六6、七7、八8、九9、十10（康熙原书四5、五4、六4、七2、八2、九2、十2）；百6、千3、萬15照康熙笔画。这是姓名学的通行做法。'],
    ['字库', '康熙笔画主表取 breezyreeds/kangxi-strokecount（Unihan kRSKangXi 快照，MIT）；常用字另与《康熙字典》原书位置、三家姓名学字库比对，多数与主表不同的 28 字从多数（如熙13、姬9、妍7、羲17），原值留作「另说」；曹字原书收在十画（10），不少起名网站按 11 算，也列为「另说」。简繁对照取 OpenCC（Apache-2.0），姓名用字另有取舍（后、余、于、郁、岳、游、涂等不转；范、朴、种作姓时不转）。各家字库在个别字上本有出入，字下可改选、改画数。'],
    ['五格', '熊崎氏算法：天格＝单姓＋1（复姓两字相加）；人格＝姓末字＋名首字；地格＝单名＋1（双名两字相加）；外格＝天格＋地格－人格（单姓单名恒为2，单姓双名＝名末字＋1，复姓单名＝姓首字＋1，复姓双名＝姓首字＋名末字）；总格＝全部笔画相加，不加假数。数过81的减80再查。'],
    ['数理', '81数分吉、半吉、凶三等，比对四家取多数（两两相持时从流传最广的分法）；天格由姓而来，只列不论。数的五行看尾数：1、2木，3、4火，5、6土，7、8金，9、0水。'],
    ['三才', '天格、人格、地格三数的五行，按125种配置表定吉凶，并作大吉、吉、半吉、凶、大凶五等；天对人看成功运，人对地看基础运。'],
    ['候选名排序', '本页自拟的简单加权：人格30、地格20、总格20、外格10、三才20（吉得满分、半吉一半、凶零分；三才大吉1、吉0.8、半吉0.5、凶0.2、大凶0），只作比较参考。人格落凶数或三才大凶的，总评最多算「中平」。'],
    ['流派', '五格剖象出自日本熊崎健翁（1928），各家在笔画（部首、异体、数字）、81数吉凶与三才表上都有出入；名字还要看音、形、义与本人境况。仅供参考，不必为此改名。']
  ];
  var RULES_TEXT = RULES.map(function (r, i) { return (i + 1) + '. ' + r[0] + '：' + r[1]; }).join('\n');

  /* ================ 文字版（复制 · 问 AI） ================ */
  function charLine(R) {
    return R.chars.map(function (x) { return x.t + (x.t !== x.c ? '（' + x.c + '）' : '') + ' ' + (x.n != null ? x.n : '?') + (x.src === 'num' ? '（数意）' : x.src === 'user' ? '（手改）' : x.src === 'est' ? '（原书未收，估）' : ''); }).join('，');
  }
  function toText(R, cands) {
    var out = [];
    out.push('姓名：' + R.tname + (R.tname !== R.name ? '（' + R.name + '）' : '') + ' · ' + R.kind);
    out.push('康熙笔画：' + charLine(R));
    if (R.ok) {
      out.push('');
      GE.forEach(function (g) { var x = R.ge[g.k]; out.push(x.name + '（' + x.role + '）' + x.n + (x.num !== x.n ? '→' + x.num : '') + '，' + x.wx + '，' + x.lv + '：' + x.text + '　[' + x.formula + ']'); });
      out.push('三才：' + R.sancai.key + '，' + R.sancai.lv + '。' + R.sancai.up + '；' + R.sancai.down + '。');
      out.push('');
      out.push('总评：' + R.say.head + '——' + R.say.tail + '（参考分 ' + R.score + '）');
      R.say.lines.forEach(function (l) { out.push(l[0] + '：' + l[1]); });
    }
    var ok = (cands || []).filter(function (c) { return c.ok; });
    if (ok.length) {
      out.push('');
      out.push('候选名比较（按参考分排）：');
      ok.forEach(function (c, i) {
        out.push((i + 1) + '. ' + c.tname + (c.tname !== c.name ? '（' + c.name + '）' : '') + ' ' + c.score + '分 · 笔画 ' + c.chars.map(function (x) { return x.n; }).join('·') +
          ' · 人格' + c.ge.ren.n + c.ge.ren.lv + ' 地格' + c.ge.di.n + c.ge.di.lv + ' 外格' + c.ge.wai.n + c.ge.wai.lv + ' 总格' + c.ge.zong.n + c.ge.zong.lv + ' · 三才' + c.sancai.key + c.sancai.lv);
      });
    }
    return out.join('\n');
  }

  var api = {
    SHULI: SHULI, SANCAI: SANCAI, GE: GE, WX: WX, RULES: RULES, RULES_TEXT: RULES_TEXT, NUM: NUM, FU: FU, WEIGHT: WEIGHT,
    tradOf: tradOf, kxOf: kxOf, strokesOf: strokesOf, isSurname: isSurname, hanOnly: hanOnly, split: split,
    shuli: shuli, shuliNum: shuliNum, wxOf: wxOf, yyOf: yyOf, rel: rel, sancai: sancai, wuge: wuge,
    analyze: analyze, analyzeName: analyzeName, parseCands: parseCands, compare: compare, toText: toText
  };
  if (NODE) module.exports = api; else root.XM = api;
})(this);
