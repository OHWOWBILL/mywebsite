// 通书底座自检：TZ=Asia/Tokyo node scripts/tongshu/check.js
// 对照值取自公开历书与天文台（2026-11 查）：
//   老黄历（k366、天气网万年历）2026-11-03：丙午年 戊戌月 辛巳日，危日，值神明堂（黄道），冲猪煞东，喜神西南，财神正东；
//   bestcalendar.jp 2026-11-03：六曜友引；吉日为天恩日、母倉日、巳の日；
//   JR 东日本「一粒万倍日」2026 年 11 月：4、7、8、19、20 日（4、20 日注※＝与不成就日重叠）；
//   2026 年天赦日：3/5、5/4、5/20、7/19、10/1、12/16；2027 年日本旧正月为 2/7（中国春节 2/6）。
//   协纪宜忌：2026-11-03 宜「订盟 纳采 会亲友 交易 立券 纳财 栽种 纳畜 牧养」、忌「嫁娶 开市 入宅 祈福 安葬」
//     （qmrl888.com 老黄历与 lunar-javascript 1.7.7 同）；神煞、胎神、二十八宿、其余几天的宜忌取 lunar-javascript；
//   天气网老黄历（wannianli.tianqi.com/laohuangli/）：11-02 胎神碓磨栖外正西、毕月乌吉、阳贵东北阴贵西南（庚日，
//     lunar-javascript 作正南、东北，不取）；11-03 胎神厨灶床外正西、觜火猴凶、物候蛰虫咸俯；11-04 胎神仓库碓外西北、
//     参水猿吉、彭祖「壬不汲水」（lunar-javascript 作「泱水」，不取）；11-05 胎神房床厕外西北、井木犴吉；11-14 物候地始冻；
//   七十二候（日本）：kotobank《デジタル大辞泉》「明治の略本暦による」表——霜降末候楓蔦黄 11/2～、立冬初候山茶始開 11/7～、
//     次候地始凍 11/12～、末候金盞香 11/17～；2025 年霞始靆 2/23（jbc-ltd.com 七十二候表）；
//   日月出没：国立天文台暦計算室「各地のこよみ」东京（35.6581°N 139.7414°E）2026 年 11 月，日出入为太阳上缘、
//     月出入为月心、月齢为正午值（下面 NAOJ 一串照录）。
process.env.TZ = process.env.TZ || 'Asia/Tokyo';
const fs = require('fs'), path = require('path');
const TS = require('../../static/fabao/tongshu.js');
const SS = require('../../static/fabao/tongshu-shensha.js');
const SKY = require('../../static/fabao/tongshu-sky.js');
let bad = 0;
const eq = (a, b, what) => { if (JSON.stringify(a) !== JSON.stringify(b)) { bad++; console.log('✗', what, '得', a, '应', b); } };
const ok = (c, what) => { if (!c) { bad++; console.log('✗', what); } };

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

/* —— 协纪全套宜忌与神煞、胎神、二十八宿 —— */
eq(r.yjSrc, 'xj', '宜忌取协纪全表');
eq([r.yi, r.ji], [['订盟', '纳采', '会亲友', '交易', '立券', '纳财', '栽种', '纳畜', '牧养'], ['嫁娶', '开市', '入宅', '祈福', '安葬']], '2026-11-03 宜忌');
eq([r.jishen, r.xiongsha], [['天德合', '月德合', '天恩', '阴德', '不将', '续世', '明堂'], ['游祸', '天贼', '血忌', '重日']], '2026-11-03 吉神凶煞');
eq([r.tai.day, r.tai.month, r.xiu.full, r.xiu.luck, r.xiu.shou], ['厨灶床外正西', '占门房', '觜火猴', '凶', '白虎'], '2026-11-03 胎神星宿');
const r7 = TS.day(2026, 11, 7), r18 = TS.day(2026, 11, 18), cny = TS.day(2027, 2, 6);
eq([r7.yi, r7.ji, r7.jishen.slice(0, 3), r7.xiongsha, r7.tai.day, r7.xiu.full], [['解除', '馀事勿取'], [], ['天德', '母仓', '月恩'], ['灾煞', '天火', '五离', '朱雀'], '碓磨门外西北', '柳土獐'], '2026-11-07（立冬）');
eq([r18.yi, r18.ji, r18.xiongsha, r18.tai.day, r18.xiu.full + r18.xiu.luck], [['沐浴', '扫舍', '捕捉', '畋猎', '解除', '塞穴', '馀事勿取'], ['嫁娶', '入宅', '开市', '安床', '破土', '修坟'], ['天罡', '劫煞', '月害', '五离', '天刑'], '厨灶炉房内北', '箕水豹吉'], '2026-11-18');
eq([cny.yi.length, cny.ji, cny.tai.day, cny.xiu.full], [17, ['入宅', '作灶', '治病', '安葬', '移徙'], '厨灶栖外正东', '氐土貉'], '2027-02-06（春节）');
const d2 = TS.day(2026, 11, 2), d4 = TS.day(2026, 11, 4), d5 = TS.day(2026, 11, 5);
eq([d2.gz.name, d2.fang.yangGui, d2.fang.yinGui, d2.tai.day, d2.xiu.full + d2.xiu.luck], ['庚辰', '东北', '西南', '碓磨栖外正西', '毕月乌吉'], '2026-11-02（天气网）');
eq([d4.tai.day, d4.xiu.full + d4.xiu.luck, d4.pengzu[0]], ['仓库碓外西北', '参水猿吉', '壬不汲水，更难提防'], '2026-11-04（天气网）');
eq([d5.tai.day, d5.xiu.full + d5.xiu.luck], ['房床厕外西北', '井木犴吉'], '2026-11-05（天气网）');
// 移植件逐格的指纹，与 lunar-javascript 1.7.7 原件所算相同（宜忌 60×60、神煞 12×60、胎神 72、二十八宿 84）
const fnv = s => { let h = 0x811c9dc5; for (const ch of s) { h ^= ch.codePointAt(0); h = Math.imul(h, 0x01000193) >>> 0; } return h.toString(16).padStart(8, '0'); };
const none = a => a.length === 1 && a[0] === '无' ? [] : a;
let fy = '', fs2 = '', ft = '', fx = '';
for (let m = 0; m < 60; m++) for (let d = 0; d < 60; d++) { const x = SS.yiji(m, d); fy += none(x.yi).join(',') + '|' + none(x.ji).join(',') + ';'; }
for (let mz = 0; mz < 12; mz++) for (let d = 0; d < 60; d++) { const x = SS.shensha(mz, d); fs2 += none(x.ji).join(',') + '|' + none(x.xiong).join(',') + ';'; }
for (let d = 0; d < 60; d++) ft += SS.tai(d, 0).day + ';';
for (let m = 1; m <= 12; m++) ft += SS.tai(0, m).month + ';';
for (let z = 0; z < 12; z++) for (let w = 0; w < 7; w++) { const x = SS.xiu(z, w); fx += x.full + x.luck + x.gong + x.song + ';'; }
eq({ yiji: fnv(fy), shensha: fnv(fs2), tai: fnv(ft), xiu: fnv(fx) }, { yiji: '6d5fc935', shensha: '98c5a80f', tai: 'f9aa43ea', xiu: 'd5cdf593' }, '移植件与 lunar-javascript 原件逐格相同');
console.log('  协纪移植件指纹：宜忌 ' + fnv(fy) + '、神煞 ' + fnv(fs2) + '、胎神 ' + fnv(ft) + '、星宿 ' + fnv(fx) + '（与 lunar-javascript 1.7.7 原件所算相同）');
// 事项用到的协纪条目都在协纪名目里（防错字）
TS.EVENTS.forEach(e => e.yi.forEach(x => ok(SS.YI_JI.indexOf(x) >= 0, '事项「' + e.k + '」的条目「' + x + '」不在协纪名目里')));
eq(TS.EVENTS.map(e => e.k + ':' + e.yi.slice(0, e.main).join('/')), ['面试:赴任/会亲友', '考试:入学', '签约:立券/交易', '开业:开市', '搬家:移徙/入宅', '出行:出行', '嫁娶:嫁娶', '求医:求医/治病', '动土:动土/修造', '祭祀:祭祀/祈福'], '事项正项');

/* —— 七十二候 —— */
const hou = (y, m, d) => { const h = TS.hou(y, m, d); return [h.cnName, h.cn, h.jpName, h.jp]; };
eq(hou(2026, 11, 3), ['霜降三候', '蛰虫咸俯', '霜降末候', '楓蔦黄'], '2026-11-03 候');
eq(hou(2026, 11, 7), ['立冬初候', '水始冰', '立冬初候', '山茶始開'], '2026-11-07 候');
eq(hou(2026, 11, 14), ['立冬二候', '地始冻', '立冬次候', '地始凍'], '2026-11-14 候');
eq(TS.hou(2026, 11, 7).first && !TS.hou(2026, 11, 8).first, true, '入候那天标「first」');
const md = t => { const d = new Date(t); return (d.getMonth() + 1) + '/' + d.getDate(); };
const y26 = TS.houOfYear(2026);
eq(y26.filter(h => h.jie === '立冬' || h.jie === '霜降').map(h => h.jp + md(h.t)), ['霜始降10/23', '霎時施10/28', '楓蔦黄11/2', '山茶始開11/7', '地始凍11/12', '金盞香11/17'], '2026 霜降立冬六候入候日（kotobank）');
eq(md(TS.houOfYear(2025).find(h => h.jp === '霞始靆').t), '2/23', '2025 霞始靆（jbc-ltd 表）');
ok(y26.every((h, i) => i === 0 || h.t > y26[i - 1].t), '候按时刻先后');
for (let y = 2000; y <= 2060; y++) { const L = TS.houOfYear(y); ok(L.length >= 71 && L.length <= 73 && L.every((h, i) => i === 0 || h.k === (L[i - 1].k + 1) % 72), y + ' 年候序连贯'); }

/* —— 日出日落、月出月落、月龄：国立天文台东京 2026 年 11 月，逐日差不过一分钟，月龄同 —— */
const NAOJ = '6:02 16:46 22:30 12:15 21.5,6:03 16:45 23:40 12:53 22.5,6:04 16:44 --:-- 13:24 23.5,6:05 16:43 0:47 13:52 24.5,6:06 16:42 1:52 14:19 25.5,6:07 16:42 2:54 14:44 26.5,6:08 16:41 3:57 15:10 27.5,6:09 16:40 4:59 15:39 28.5,6:10 16:39 6:02 16:11 29.5,6:11 16:38 7:04 16:48 0.8,6:12 16:37 8:04 17:31 1.8,6:13 16:37 9:01 18:20 2.8,6:14 16:36 9:52 19:14 3.8,6:15 16:35 10:36 20:11 4.8,6:16 16:35 11:14 21:10 5.8,6:17 16:34 11:47 22:10 6.8,6:18 16:33 12:15 23:10 7.8,6:19 16:33 12:42 --:-- 8.8,6:20 16:32 13:07 0:10 9.8,6:21 16:32 13:32 1:11 10.8,6:22 16:31 13:59 2:14 11.8,6:23 16:31 14:30 3:21 12.8,6:24 16:30 15:05 4:32 13.8,6:25 16:30 15:49 5:46 14.8,6:26 16:29 16:44 7:02 15.8,6:27 16:29 17:49 8:14 16.8,6:28 16:29 19:01 9:17 17.8,6:29 16:29 20:16 10:09 18.8,6:30 16:28 21:30 10:51 19.8,6:31 16:28 22:39 11:26 20.8';
const tokyo = { name: 'NAOJ东京', lon: 139.7414, lat: 35.6581, tz: 9, iana: null };
const mins = s => /\d:\d\d/.test(s) ? +s.split(':')[0] * 60 + +s.split(':')[1] : null;
let worst = 0;
NAOJ.split(',').forEach((row, i) => {
  const f = row.split(' '), s = SKY.day(2026, 11, i + 1, tokyo);
  [s.sunrise, s.sunset, s.moonrise, s.moonset].forEach((t, k) => {
    const a = t == null ? null : mins(SKY.hm(t, tokyo)), b = mins(f[k]);
    if ((a == null) !== (b == null)) { bad++; console.log('✗ NAOJ 11/' + (i + 1), ['日出', '日落', '月出', '月落'][k], '有无不符'); return; }
    if (a != null) worst = Math.max(worst, Math.abs(a - b));
  });
  eq(s.age, +f[4], 'NAOJ 11/' + (i + 1) + ' 月龄');
});
ok(worst <= 1, '日月出没与国立天文台差 ' + worst + ' 分（应不过 1 分）');
console.log('  国立天文台东京 2026-11：日出、日落、月出、月落逐日最大差 ' + worst + ' 分；月龄 30 日同');
const t4 = SKY.day(2026, 11, 4, tokyo);
eq([SKY.hm(t4.sunrise, tokyo), SKY.hm(t4.sunset, tokyo), SKY.hm(t4.moonrise, tokyo), SKY.hm(t4.moonset, tokyo), t4.age], ['06:05', '16:43', '00:47', '13:52', 24.5], '2026-11-04 东京（国立天文台）');
const bj = SKY.place('北京'), ny = SKY.place('纽约');
ok(bj && bj.tz === 8 && !bj.iana && ny.iana === 'America/New_York', '城市表与时区');
eq([SKY.offsetMin(ny, Date.UTC(2026, 6, 1)), SKY.offsetMin(ny, Date.UTC(2026, 11, 1))], [-240, -300], '纽约夏令时');

/* —— 日历文件 —— */
const ics = TS.ics([
  { uid: TS.uid('2026-11-07', 'jq', '立冬'), date: [2026, 11, 7], title: '立冬 · 18:53 交节', desc: '逗号, 分号; 反斜杠\\ 换行\n第二行' + '长'.repeat(40), url: 'https://ohwowbill.com/huangli/?d=2026-11-07' },
  { uid: 'x@ohwowbill.com', start: Date.UTC(2026, 10, 18, 10), end: Date.UTC(2026, 10, 18, 12), title: '面试求职 · 上吉（戌时）' }
], '潜蛟阁 · 自检');
const lines = ics.split('\r\n');
ok(/^BEGIN:VCALENDAR\r\nVERSION:2.0\r\n/.test(ics) && /END:VCALENDAR\r\n$/.test(ics) && !/[^\r]\n/.test(ics), 'ics 以 CRLF 断行');
ok(lines.every(l => Buffer.byteLength(l) <= 75), 'ics 折行不过 75 字节');
ok(ics.indexOf('DTSTART;VALUE=DATE:20261107\r\nDTEND;VALUE=DATE:20261108\r\n') > 0, 'ics 整天事项写 VALUE=DATE，DTEND 为次日');
ok(ics.indexOf('DTSTART:20261118T100000Z\r\nDTEND:20261118T120000Z\r\n') > 0, 'ics 定时事项写 UTC');
ok(ics.replace(/\r\n /g, '').indexOf('DESCRIPTION:逗号\\, 分号\\; 反斜杠\\\\ 换行\\n第二行') > 0, 'ics 文字转义');
ok(lines.filter(l => /^ /.test(l)).length >= 1 && ics.replace(/\r\n /g, '').indexOf('长'.repeat(40)) > 0, 'ics 折行不拆字');
eq(ics.match(/UID:20261107-jq-[0-9a-z]+@ohwowbill\.com/) != null, true, 'ics UID');
// 择日结果写成定时事项：时辰起止
const ZR = require('../../static/zeri/zeri.js');
const zt = ZR.toEvent(ZR.evalTime(new Date(2026, 10, 18, 20, 0), { ev: '面试', jp: true }));
eq([new Date(zt.start).toISOString(), new Date(zt.end).toISOString()], ['2026-11-18T11:00:00.000Z', '2026-11-18T12:00:00.000Z'], '择日候选 20:00 → 戌时末');

/* —— 原有的历注核对 —— */
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

/* —— 打分与分档 —— */
const s1 = TS.score(TS.day(2026, 11, 3), '签约', { jp: false }), s2 = TS.score(TS.day(2026, 11, 3), '嫁娶', { jp: false });
ok(s1.score > s2.score, '同一天，宜的事（签约：宜立券交易）比忌的事（嫁娶）分高');
ok(s1.plus.some(x => /^宜立券、交易/.test(x.t)) && s2.minus.some(x => x.t === '忌嫁娶'), '打分理由写出协纪条目');
ok(TS.score(TS.day(2026, 11, 7), '搬家', {}).minus.some(x => /馀事勿取/.test(x.t)), '「馀事勿取」之日未列之事扣分');
// 协纪全表不在时退回建除简本，打分照常
const fb = Object.assign({}, r18, { yjSrc: 'jc', yi: TS.YIJI[r18.jianchu].yi.slice(), ji: TS.YIJI[r18.jianchu].ji.slice() });
ok(typeof TS.score(fb, '搬家', { jp: true }).score === 'number' && TS.score(fb, '开业', {}).minus.some(x => x.t === '收日忌开市'), '建除简本退路');
// 分档的分布（2025–2034 十年 × 十种事项）：上吉约一成，凶约一成半
for (const jp of [false, true]) {
  const c = {}; let n = 0;
  for (let y = 2025; y <= 2034; y++) for (let m = 1; m <= 12; m++) TS.month(y, m).forEach(x => TS.EVENTS.forEach(e => { const g = TS.grade(TS.score(x, e.k, { jp }).score, jp); c[g] = (c[g] || 0) + 1; n++; }));
  const p = g => Math.round(1000 * (c[g] || 0) / n) / 10;
  console.log(`  分档（日本历注${jp ? '开' : '关'}）：上吉 ${p('上吉')}%  吉 ${p('吉')}%  平 ${p('平')}%  次 ${p('次')}%  凶 ${p('凶')}%`);
  ok(p('上吉') >= 8 && p('上吉') <= 13, '上吉约一成');
  ok(p('凶') >= 12 && p('凶') <= 18, '凶约一成半');
}

/* —— 摘要（日课、日签） —— */
const bf = TS.brief(TS.day(2026, 11, 4).yi, 14);
eq([bf.items.join('、'), bf.more], ['嫁娶、出行、移徙、入宅、开市', true], '宜忌摘要');
ok(TS.brief(r18.yi, 14).items.slice(-1)[0] === '馀事勿取', '摘要留「馀事勿取」');

// 与首页日课的 data/rike.yaml 是同一份宜忌（建除简本，底座不在时的退路）
const yaml = fs.readFileSync(path.join(__dirname, '../../data/rike.yaml'), 'utf8');
Object.keys(TS.YIJI).forEach(k => {
  const m = new RegExp('^\\s*' + k + ':\\s*\\{\\s*yi:\\s*"([^"]*)",\\s*ji:\\s*"([^"]*)"', 'm').exec(yaml);
  eq(m ? [m[1], m[2]] : null, [TS.YIJI[k].yi.join('、'), TS.YIJI[k].ji.join('、')], 'rike.yaml 的「' + k + '」');
});

console.log(bad ? `\n${bad} 项不符` : '✓ 全部相符');
process.exit(bad ? 1 : 0);
