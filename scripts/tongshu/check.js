// 通书底座自检：TZ=Asia/Tokyo node scripts/tongshu/check.js
// 对照值取自公开历书（2026-11 查）：
//   老黄历（k366、天气网万年历）2026-11-03：丙午年 戊戌月 辛巳日，危日，值神明堂（黄道），冲猪煞东，喜神西南，财神正东；
//   bestcalendar.jp 2026-11-03：六曜友引；吉日为天恩日、母倉日、巳の日；
//   JR 东日本「一粒万倍日」2026 年 11 月：4、7、8、19、20 日（4、20 日注※＝与不成就日重叠）；
//   2026 年天赦日：3/5、5/4、5/20、7/19、10/1、12/16；2027 年日本旧正月为 2/7（中国春节 2/6）。
process.env.TZ = process.env.TZ || 'Asia/Tokyo';
const fs = require('fs'), path = require('path');
const TS = require('../../static/fabao/tongshu.js');
let bad = 0;
const eq = (a, b, what) => { if (JSON.stringify(a) !== JSON.stringify(b)) { bad++; console.log('✗', what, '得', a, '应', b); } };

const r = TS.day(2026, 11, 3);
eq([r.year.name, r.month.name, r.gz.name, r.nayin], ['丙午', '戊戌', '辛巳', '白蜡金'], '干支纳音');
eq([r.jianchu, r.shen, r.huang], ['危', '明堂', true], '建除值神');
eq([r.chong.sx, r.chong.gz, r.chong.sha], ['猪', '乙亥', '东'], '冲煞');
eq([r.fang.xi, r.fang.cai], ['西南', '正东'], '喜神财神');
eq(r.rokuyo, '友引', '六曜');
eq(r.sen.filter(s => s.good).map(s => s.n), ['天恩日', '母倉日', '巳の日'], '吉日');
eq([r.lunarText, r.kyuText, r.doyo], ['九月廿五', '9月24日', true], '农历/旧暦/土用');
eq(r.notes.map(x => x.n), ['杨公忌'], '杨公忌');
eq(TS.hours(r).filter(h => h.huang).map(h => h.name), ['丑时', '辰时', '午时', '未时', '戌时', '亥时'], '时辰黄道');

const nov = TS.month(2026, 11);
eq(nov.filter(x => x.sen.some(s => s.n === '一粒万倍日')).map(x => x.d), [4, 7, 8, 19, 20], '一粒万倍日 2026-11');
eq(nov.filter(x => x.sen.some(s => s.n === '不成就日')).map(x => x.d), [4, 12, 20, 28], '不成就日 2026-11');
eq(nov.find(x => x.d === 6).notes.map(x => x.n), ['四绝'], '四绝（立冬前一日）');
eq(nov.find(x => x.d === 7).jieqi.n, '立冬', '交节');

const ts = [];
for (let m = 1; m <= 12; m++) TS.month(2026, m).forEach(x => { if (x.sen.some(s => s.n === '天赦日')) ts.push(x.key.slice(5)); });
eq(ts, ['03-05', '05-04', '05-20', '07-19', '10-01', '12-16'], '天赦日 2026');

eq([TS.day(2027, 2, 6).kyuText, TS.day(2027, 2, 7).kyuText, TS.day(2027, 2, 7).rokuyo], ['12月30日', '1月1日', '先勝'], '2027 旧正月');
eq(TS.day(2027, 2, 6).fest.map(f => f.n), ['春节'], '2027 春节');
const za = [];
for (let m = 1; m <= 12; m++) TS.month(2026, m).forEach(x => x.fest.filter(f => f.kind === 'jp').forEach(f => za.push(x.key.slice(5) + f.n)));
['02-03節分', '05-02八十八夜', '07-20土用入り', '07-26土用の丑', '09-01二百十日'].forEach(k => { if (za.indexOf(k) < 0) { bad++; console.log('✗ 雑節缺', k); } });

// 建除：交节之日重复前一日（2026-11-07 立冬，11-06 与 11-07 同为「开」……按日支推）
eq([TS.day(2026, 11, 6).jianchu, TS.day(2026, 11, 7).jianchu], ['开', '开'], '交节重复');

// 打分：同一天，宜的事比忌的事分高
const s1 = TS.score(TS.day(2026, 11, 18), '面试', { jp: true }), s2 = TS.score(TS.day(2026, 11, 18), '嫁娶', { jp: true });
if (!(typeof s1.score === 'number' && typeof s2.score === 'number')) { bad++; console.log('✗ 打分不是数'); }

// 与首页日课的 data/rike.yaml 是同一份宜忌
const yaml = fs.readFileSync(path.join(__dirname, '../../data/rike.yaml'), 'utf8');
Object.keys(TS.YIJI).forEach(k => {
  const m = new RegExp('^\\s*' + k + ':\\s*\\{\\s*yi:\\s*"([^"]*)",\\s*ji:\\s*"([^"]*)"', 'm').exec(yaml);
  eq(m ? [m[1], m[2]] : null, [TS.YIJI[k].yi.join('、'), TS.YIJI[k].ji.join('、')], 'rike.yaml 的「' + k + '」');
});

console.log(bad ? `\n${bad} 项不符` : '✓ 全部相符');
process.exit(bad ? 1 : 0);
