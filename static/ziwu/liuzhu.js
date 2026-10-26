// =========================================================
// 子午流注 · 灵龟八法 · 飞腾八法 —— 只管算，不碰页面
// static/ziwu/index.html 拿去画；node 里也能直接 require 来核对。
// 干支一律用序号：甲0 … 癸9，子0 … 亥11。
// =========================================================

(function (root) {
  'use strict';

  const GAN = '甲乙丙丁戊己庚辛壬癸';
  const ZHI = '子丑寅卯辰巳午未申酉戌亥';
  const SHU = ['井', '荥', '输', '经', '合'];
  const WX = ['木', '火', '土', '金', '水'];            // 相生之序
  const YIN_SHU = ['木', '火', '土', '金', '水'];       // 阴经五输：井木 荥火 输土 经金 合水
  const YANG_SHU = ['金', '水', '木', '火', '土'];      // 阳经五输：井金 荥水 输木 经火 合土
  const sheng = w => WX[(WX.indexOf(w) + 1) % 5];       // 我生者（子）
  const mu = w => WX[(WX.indexOf(w) + 4) % 5];          // 生我者（母）

  // —— 十二经：五输、原穴、五行 ——
  const JING = {
    '肺':   { full: '手太阴肺经',   wx: '金', yin: true,  shu: ['少商', '鱼际', '太渊', '经渠', '尺泽'],     yuan: '太渊' },
    '大肠': { full: '手阳明大肠经', wx: '金', yin: false, shu: ['商阳', '二间', '三间', '阳溪', '曲池'],     yuan: '合谷' },
    '胃':   { full: '足阳明胃经',   wx: '土', yin: false, shu: ['厉兑', '内庭', '陷谷', '解溪', '足三里'],   yuan: '冲阳' },
    '脾':   { full: '足太阴脾经',   wx: '土', yin: true,  shu: ['隐白', '大都', '太白', '商丘', '阴陵泉'],   yuan: '太白' },
    '心':   { full: '手少阴心经',   wx: '火', yin: true,  shu: ['少冲', '少府', '神门', '灵道', '少海'],     yuan: '神门' },
    '小肠': { full: '手太阳小肠经', wx: '火', yin: false, shu: ['少泽', '前谷', '后溪', '阳谷', '小海'],     yuan: '腕骨' },
    '膀胱': { full: '足太阳膀胱经', wx: '水', yin: false, shu: ['至阴', '足通谷', '束骨', '昆仑', '委中'],   yuan: '京骨' },
    '肾':   { full: '足少阴肾经',   wx: '水', yin: true,  shu: ['涌泉', '然谷', '太溪', '复溜', '阴谷'],     yuan: '太溪' },
    '心包': { full: '手厥阴心包经', wx: '火', yin: true,  shu: ['中冲', '劳宫', '大陵', '间使', '曲泽'],     yuan: '大陵' },
    '三焦': { full: '手少阳三焦经', wx: '火', yin: false, shu: ['关冲', '液门', '中渚', '支沟', '天井'],     yuan: '阳池' },
    '胆':   { full: '足少阳胆经',   wx: '木', yin: false, shu: ['足窍阴', '侠溪', '足临泣', '阳辅', '阳陵泉'], yuan: '丘墟' },
    '肝':   { full: '足厥阴肝经',   wx: '木', yin: true,  shu: ['大敦', '行间', '太冲', '中封', '曲泉'],     yuan: '太冲' }
  };
  const shuWx = (j, i) => (JING[j].yin ? YIN_SHU : YANG_SHU)[i];
  const shuOf = (j, w) => (JING[j].yin ? YIN_SHU : YANG_SHU).indexOf(w);
  const pt = (j, i) => ({ name: JING[j].shu[i], jing: j, kind: SHU[i] + '穴', wx: shuWx(j, i) });
  const yuanPt = j => ({ name: JING[j].yuan, jing: j, kind: '原穴', wx: '' });

  // =========================================================
  // 纳子法：十二经纳十二时辰，寅时起肺。
  //   实则泻其子：本经流注之时，泻本经子穴（迎而夺之）；
  //   虚则补其母：本经流注刚过之时，补本经母穴（随而济之）；
  //   不虚不实：本经之时取本穴或原穴。
  // =========================================================
  const NAZI = ['胆', '肝', '肺', '大肠', '胃', '脾', '心', '小肠', '膀胱', '肾', '心包', '三焦'];
  function nazi(hz) {
    const j = NAZI[hz], prev = NAZI[(hz + 11) % 12], J = JING[j];
    return {
      zhi: hz, jing: j, full: J.full, wx: J.wx, prev, next: NAZI[(hz + 1) % 12],
      xie: pt(j, shuOf(j, sheng(J.wx))),                  // 泻本经子穴
      bu: pt(prev, shuOf(prev, mu(JING[prev].wx))),       // 补前一经母穴（其时刚过）
      buLater: pt(j, shuOf(j, mu(J.wx))),                 // 本经之虚，候下一时辰补此
      ben: pt(j, shuOf(j, J.wx)),
      yuan: yuanPt(j)
    };
  }

  // =========================================================
  // 纳甲法（徐凤《针灸大全》逐日按时定穴）
  //   日干值经，于同干之时开其井穴：甲戌 乙酉 丙申 丁未 戊午 己巳 庚辰 辛卯 壬寅 癸亥。
  //   此后每隔一时辰，时干所属之经依次开荥、输、经、合（经生经，穴生穴）。
//   逐日井穴的时辰：日干进一，时支退一（阳进阴退）。
  //   开输穴时并开值日经原穴（返本还原；壬并阳池，癸并大陵）。
  //   第六步：阳日气纳三焦，开生值日经者之三焦穴；阴日血归包络，开值日经所生之包络穴。
  //   一日起的穴序可跨过子夜到次日。
  // =========================================================
  const GAN_JING = ['胆', '肝', '小肠', '心', '胃', '脾', '大肠', '肺', '膀胱', '肾'];
  const NAJIA_START = [10, 9, 8, 7, 6, 5, 4, 3, 2, 11];

  function najiaStep(d, k) {
    const hg = (d + 2 * k) % 10, raw = NAJIA_START[d] + 2 * k, hz = raw % 12;
    const zr = GAN_JING[d], yang = d % 2 === 0;
    const step = { day: d, k, hg, hz, hour: GAN[hg] + ZHI[hz], nextDay: raw >= 12, zhiri: zr, points: [], why: [] };
    if (k === 0) {
      step.points.push(pt(zr, 0));
      step.why.push(`${GAN[d]}日值${zr}经，${step.hour}时开其井穴`);
    } else if (k < 5) {
      const j = GAN_JING[hg];
      step.points.push(pt(j, k));
      step.why.push(`隔一时辰，${GAN[hg]}时属${j}经：经生经、穴生穴，开${SHU[k]}穴`);
      if (k === 2) {
        step.points.push(yuanPt(zr));
        step.why.push(`逢输过原，并开值日${zr}经原穴`);
        if (d === 8) { step.points.push(yuanPt('三焦')); step.why.push('三焦寄于壬，并开阳池'); }
        if (d === 9) { step.points.push(yuanPt('心包')); step.why.push('包络寄于癸，并开大陵'); }
      }
    } else {
      const j = yang ? '三焦' : '心包', w = yang ? mu(JING[zr].wx) : sheng(JING[zr].wx);
      step.points.push(pt(j, shuOf(j, w)));
      step.why.push(yang
        ? `阳日气纳三焦：${zr}属${JING[zr].wx}，${w}生${JING[zr].wx}，取三焦${w}穴`
        : `阴日血归包络：${zr}属${JING[zr].wx}，${JING[zr].wx}生${w}，取包络${w}穴`);
    }
    return step;
  }
  const najiaSeq = d => [0, 1, 2, 3, 4, 5].map(k => najiaStep(d, k));

  // 某日某时开不开穴：当日起的，或前一日起、跨过子夜来的
  function najiaAt(dg, hz) {
    for (const o of [0, 1]) {
      const d = (dg - o + 10) % 10, delta = hz + 12 * o - NAJIA_START[d];
      if (delta >= 0 && delta <= 10 && delta % 2 === 0) return najiaStep(d, delta / 2);
    }
    return null;
  }
  // 开穴；闭穴时按合日互用（甲己、乙庚、丙辛、丁壬、戊癸，五鼠遁同，时干支亦同）
  function najia(dg, hz) {
    const open = najiaAt(dg, hz);
    if (open) return { open, he: null, heOpen: null };
    const he = (dg + 5) % 10;
    return { open: null, he, heOpen: najiaAt(he, hz) };
  }
  // 往后数，下一个开穴的时辰
  function najiaNext(dg, hz) {
    for (let s = 1; s <= 24; s++) {
      const t = hz + s, o = najiaAt((dg + Math.floor(t / 12)) % 10, t % 12);
      if (o) return { after: s, hz: t % 12, nextDay: t >= 12, step: o };
    }
    return null;
  }

  // 徐凤《子午流注逐日按时定穴歌》
  const NAJIA_GE = [
    ['甲日戌时胆窍阴', '丙子时中前谷荥', '戊寅陷谷阳明输', '返本丘墟木在寅', '庚辰经注阳溪穴', '壬午膀胱委中寻', '甲申时纳三焦水', '荥合天干取液门'],
    ['乙日酉时肝大敦', '丁亥时荥少府心', '己丑太白太冲穴', '辛卯经渠是肺经', '癸巳肾宫阴谷合', '乙未劳宫火穴荥'],
    ['丙日申时少泽当', '戊戌内庭治胀康', '庚子时在三间输', '本原腕骨可祛黄', '壬寅经火昆仑上', '甲辰阳陵泉合长', '丙午时受三焦木', '中渚之中仔细详'],
    ['丁日未时心少冲', '己酉大都脾土逢', '辛亥太渊神门穴', '癸丑复溜肾水通', '乙卯肝经曲泉合', '丁巳包络大陵中'],
    ['戊日午时厉兑先', '庚申荥穴二间迁', '壬戌膀胱寻束骨', '冲阳土穴必还原', '甲子胆经阳辅是', '丙寅小海穴安然', '戊辰气纳三焦脉', '经穴支沟刺必痊'],
    ['己日巳时隐白始', '辛未时中鱼际取', '癸酉太溪太白原', '乙亥中封内踝比', '丁丑时合少海心', '己卯间使包络止'],
    ['庚日辰时商阳居', '壬午膀胱通谷之', '甲申临泣为输木', '合谷金原返本归', '丙戌小肠阳谷火', '戊子时居三里宜', '庚寅气纳三焦合', '天井之中不用疑'],
    ['辛日卯时少商本', '癸巳然谷何须忖', '乙未太冲原太渊', '丁酉心经灵道引', '己亥脾合阴陵泉', '辛丑曲泽包络准'],
    ['壬日寅时起至阴', '甲辰胆脉侠溪荥', '丙午小肠后溪输', '返求京骨本原寻', '三焦寄有阳池穴', '返本还原似嫡亲', '戊申时注解溪胃', '大肠庚戌曲池真', '壬子气纳三焦寄', '井穴关冲一片金', '关冲属金壬属水', '子母相生恩义深'],
    ['癸日亥时井涌泉', '乙丑行间穴必然', '丁卯输穴神门是', '本寻肾水太溪原', '包络大陵原并过', '己巳商丘内踝边', '辛未肺经合尺泽', '癸酉中冲包络连', '子午截时安定穴', '留传后学莫忘言']
  ];
  // 歌诀逐句归到第几步：首句是井穴；带某步时干支的句子起新一步，其余句随上一步；
  // 癸日末两句是全歌的收尾，不归哪一步（k = -1）
  function geSteps(d) {
    const seq = najiaSeq(d);
    let cur = 0;
    return NAJIA_GE[d].map((line, i) => {
      if (/子午截时|留传后学/.test(line)) return { line, k: -1 };
      if (i > 0) seq.forEach(s => { if (s.k > 0 && line.indexOf(s.hour) >= 0) cur = s.k; });
      return { line, k: cur };
    });
  }

  // =========================================================
  // 八脉交会八穴 · 灵龟八法 · 飞腾八法
  // =========================================================
  const BAMAI = {
    '公孙':   { mai: '冲脉',   pair: '内关',   jing: '脾', he: '胃、心、胸' },
    '内关':   { mai: '阴维脉', pair: '公孙',   jing: '心包', he: '胃、心、胸' },
    '后溪':   { mai: '督脉',   pair: '申脉',   jing: '小肠', he: '目内眦、颈项、耳、肩' },
    '申脉':   { mai: '阳跷脉', pair: '后溪',   jing: '膀胱', he: '目内眦、颈项、耳、肩' },
    '足临泣': { mai: '带脉',   pair: '外关',   jing: '胆', he: '目锐眦、耳后、颊、颈、肩' },
    '外关':   { mai: '阳维脉', pair: '足临泣', jing: '三焦', he: '目锐眦、耳后、颊、颈、肩' },
    '列缺':   { mai: '任脉',   pair: '照海',   jing: '肺', he: '肺系、咽喉、胸膈' },
    '照海':   { mai: '阴跷脉', pair: '列缺',   jing: '肾', he: '肺系、咽喉、胸膈' }
  };
  const BAMAI_GE = ['公孙冲脉胃心胸', '内关阴维下总同', '临泣胆经连带脉', '阳维锐眦外关逢', '后溪督脉内眦颈', '申脉阳跷络亦通', '列缺任脉行肺系', '阴跷照海膈喉咙'];

  // 灵龟八法：逐日干支、临时干支各取其数，四数相加，阳日除九、阴日除六，余数按九宫开穴
  //   八法逐日干支歌：甲己辰戌丑未十，乙庚申酉九为期，丁壬寅卯八成数，戊癸巳午七相宜，丙辛亥子亦七数
  //   八法临时干支歌：甲己子午九宜用，乙庚丑未八无疑，丙辛寅申七作数，丁壬卯酉六顺知，戊癸辰戌各有五，巳亥单加四共齐
  //   九宫八法歌：坎一联申脉，照海坤二五，震三属外关，巽四临泣数，乾六是公孙，兑七后溪府，艮八系内关，离九列缺主
  const LG_DAY_GAN = [10, 9, 7, 8, 7, 10, 9, 7, 8, 7];
  const LG_DAY_ZHI = [7, 10, 8, 8, 10, 7, 7, 10, 9, 9, 10, 7];
  const LG_HOUR_GAN = [9, 8, 7, 6, 5, 9, 8, 7, 6, 5];
  const LG_HOUR_ZHI = [9, 8, 7, 6, 5, 4, 9, 8, 7, 6, 5, 4];
  const GONG = [null, '申脉', '照海', '外关', '足临泣', '照海', '公孙', '后溪', '内关', '列缺'];
  const GONG_GUA = [null, '坎', '坤', '震', '巽', '中', '乾', '兑', '艮', '离'];
  function linggui(dg, dz, hg, hz) {
    const nums = [LG_DAY_GAN[dg], LG_DAY_ZHI[dz], LG_HOUR_GAN[hg], LG_HOUR_ZHI[hz]];
    const sum = nums[0] + nums[1] + nums[2] + nums[3];
    const div = dg % 2 === 0 ? 9 : 6;
    const gong = sum % div || div;
    const point = GONG[gong];
    return { nums, sum, div, rem: sum % div, gong, gua: GONG_GUA[gong], point, pair: BAMAI[point].pair };
  }

  // 飞腾八法：只看时干
  //   壬甲公孙即是乾，丙居艮上内关然，戊为临泣生坎水，庚属外关震相连，
  //   辛上后溪装巽卦，乙癸申脉到坤传，己土列缺南离上，丁居照海兑金全
  const FT = ['公孙', '申脉', '内关', '照海', '足临泣', '列缺', '外关', '后溪', '公孙', '申脉'];
  const FT_GUA = ['乾', '坤', '艮', '兑', '坎', '离', '震', '巽', '乾', '坤'];
  const FT_GE = ['壬甲公孙即是乾', '丙居艮上内关然', '戊为临泣生坎水', '庚属外关震相连', '辛上后溪装巽卦', '乙癸申脉到坤传', '己土列缺南离上', '丁居照海兑金全'];
  function feiteng(hg) {
    const point = FT[hg];
    return { point, gua: FT_GUA[hg], pair: BAMAI[point].pair };
  }

  const api = {
    GAN, ZHI, SHU, JING, NAZI, GAN_JING, NAJIA_START, NAJIA_GE, BAMAI, BAMAI_GE, GONG, GONG_GUA, FT, FT_GUA, FT_GE,
    LG_DAY_GAN, LG_DAY_ZHI, LG_HOUR_GAN, LG_HOUR_ZHI,
    nazi, najiaStep, najiaSeq, najiaAt, najia, najiaNext, geSteps, linggui, feiteng
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Liuzhu = api;
})(this);
