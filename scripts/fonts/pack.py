#!/usr/bin/env python3
"""按本站实际用字打「字包」，让每页少下几兆字体。

缘起：谷歌把中文字体按全网字频切成一百多片，每片一百来字。本站一页正文几百个字散落在
五六十片里，于是每页要下 3～5 MB、六七十个请求。其实全站常用的也就三四千字。

做法：照 scripts/fonts/usage.json（由 usage.js 量出每页各字体实际用到的字）把字分成
  · 通用包：文章页与法宝页都用到的字
  · 文章包／法宝包：只在一边用到、且不止一页用到的字
  · 各页小包：只有某一页用到的字（不足 MIN_PAGE 个就并进上面的包）
  · 法宝备用包：各件法宝脚本里写着、但开页时还没显示出来的字（起了盘才会用到），每片约 80 字
每包从字体原件里裁出来（字形与谷歌那份同版本，观感不变），文件放 static/fonts/f/p-*.woff2。
包里没有的字（访客自己输入的名字、日后新写的文章）仍由谷歌的切片兜底，所以不重跑也不会缺字，
只是新字会多下几片；文章攒多了再重跑一次即可。

产出：
  static/fonts/qj.css       页面先载的小样式：Archivo ＋ 各字包
  static/fonts/qj-rest.css  兜底的谷歌切片（已扣掉字包里的字），页面空闲时再载
  data/fonts.json           Hugo 页面预载哪两个通用包

用法见 usage.js 开头。依赖：pip install fonttools brotli。
"""
import collections, glob, hashlib, io, json, os, re, statistics, sys, urllib.request

from fontTools import subset
from fontTools.ttLib import TTFont

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..")
os.chdir(ROOT)
HERE = "scripts/fonts"
SRC_DIR = f"{HERE}/.src"
RAW = "https://raw.githubusercontent.com/google/fonts/main/ofl/"
# features＝谷歌各切片里实际保留的排版特性（竖排标点、标点挤压、字偶间距等），照单保留，观感才与原先一致
FAMS = {
    "ns": dict(family="Noto Serif SC", src=RAW + "notoserifsc/NotoSerifSC%5Bwght%5D.ttf", file="NotoSerifSC.ttf",
               features=["locl", "kern", "vert", "vrt2", "palt", "vpal", "chws", "vchw", "halt", "vhal", "liga", "ccmp", "mark", "vkrn"]),
    "wk": dict(family="LXGW WenKai TC", src=RAW + "lxgwwenkaitc/LXGWWenKaiTC-Regular.ttf", file="LXGWWenKaiTC.ttf",
               features=["vert", "calt", "frac"]),
}
MIN_PAGE = 10      # 一页独有的字不足这个数，就不单开小包
MIN_EXTRA = 12     # 备用字不足这个数，并进「杂」
MAX_EXTRA = 800    # 备用字超过这个数（如姓名学的整本字典）就不打包，留给谷歌切片
CHUNK = 80         # 备用包每片大约这么多字
OUT = "static/fonts"

CJK = re.compile(r"[ -⁯←-⇿①-⓿■-➿⺀-鿿豈-﫿＀-￯]")
BLOCK = re.compile(r"(/\*[^*]*\*/\s*)?@font-face\s*\{([^}]*)\}")


def fetch_sources():
    os.makedirs(SRC_DIR, exist_ok=True)
    for k, f in FAMS.items():
        p = f"{SRC_DIR}/{f['file']}"
        if not os.path.exists(p):
            print("取字体原件", f["family"], "…")
            with urllib.request.urlopen(f["src"], timeout=300) as r:
                open(p, "wb").write(r.read())
        f["path"] = p
        f["cmap"] = set(TTFont(p, lazy=True).getBestCmap().keys())


def read_google():
    """谷歌原样式逐块读出；各字体能管的字以谷歌切片的范围为准（原件里多出来的符号不接手，免得观感有变）。"""
    google = open(f"{HERE}/google-qj.css", encoding="utf8").read()
    blocks = []
    for m in BLOCK.finditer(google):
        body = m.group(2)
        fam = re.search(r"font-family:\s*'([^']+)'", body).group(1)
        blocks.append(dict(fam=fam, body=body, tag=(re.search(r"/\*\s*(.*?)\s*\*/", m.group(1) or "") or [None, ""])[1], url=re.search(r"url\(([^)]+)\)", body).group(1),
                           weight=re.search(r"font-weight:\s*([^;]+)", body).group(1).strip(),
                           range=parse_range(re.search(r"unicode-range:\s*([^;]+)", body).group(1))))
    # 只从汉字切片（谷歌样式里不带名字或只带编号的那些）里取字打包；latin、cyrillic 等带名字的切片原样留用：
    # 字母之间有字偶间距（kern），拆到两个文件里间距就没了，「ohwowbill」会松一点
    for b in blocks:
        b["named"] = bool(b["tag"]) and not re.fullmatch(r"\[\d+\]", b["tag"])
    # 带名字的切片排在谷歌样式的后头，同一个字两边都有时归它（如破折号、省略号、间隔号）。
    # 这些字照旧归它：不打包，也从汉字切片的范围里扣掉，免得为一个破折号去下一整片汉字
    for f in FAMS.values():
        mine = [b for b in blocks if b["fam"] == f["family"]]
        f["named"] = set()
        for url in {b["url"] for b in mine if b["named"]}:
            rng = set().union(*[b["range"] for b in mine if b["url"] == url])
            f["named"] |= rng & set(TTFont("static" + url, lazy=True).getBestCmap().keys())
        f["cmap"] &= set().union(*[b["range"] for b in mine if not b["named"]])
        f["cmap"] -= f["named"]
    return blocks


def parse_range(s):
    out = set()
    for part in s.split(","):
        part = part.strip()[2:]
        if not part:
            continue
        if "-" in part:
            a, z = part.split("-")
            out.update(range(int(a, 16), int(z, 16) + 1))
        elif "?" in part:
            out.update(range(int(part.replace("?", "0"), 16), int(part.replace("?", "F"), 16) + 1))
        else:
            out.add(int(part, 16))
    return out


def fmt_range(cps):
    cps = sorted(cps)
    out, i = [], 0
    while i < len(cps):
        j = i
        while j + 1 < len(cps) and cps[j + 1] == cps[j] + 1:
            j += 1
        out.append(f"U+{cps[i]:X}" if i == j else f"U+{cps[i]:X}-{cps[j]:X}")
        i = j + 1
    return ",".join(out)


def read_usage():
    pages = json.load(open(f"{HERE}/usage.json", encoding="utf8"))["pages"]
    tool_dirs = {d for d in os.listdir("static") if os.path.exists(f"static/{d}/index.html")}
    use, world = {}, {}
    for p, row in pages.items():
        ns, wk = set(map(ord, row.get("ns", ""))), set(map(ord, row.get("wk", "")))
        ns |= wk - FAMS["wk"]["cmap"]          # 楷体里没有的字，浏览器会退到宋体
        use[p] = {"ns": ns & FAMS["ns"]["cmap"], "wk": wk & FAMS["wk"]["cmap"]}
        world[p] = "T" if p.strip("/").split("/")[0] in tool_dirs else "H"
    return use, world, tool_dirs


def source_chars(tool_dirs):
    """各件法宝与本站脚本源码里的字（起了盘才显示的那些），按在源码里出现的先后排好。
    先后有讲究：写在一处的字多半一起用（同一卦的辞、同一支签的诗），照这个次序分片，起一盘只碰到几片。"""
    def chars(paths):
        seen = {}
        for p in sorted(paths):
            try:
                for ch in CJK.findall(open(p, encoding="utf8").read()):
                    seen.setdefault(ord(ch), None)
            except (UnicodeDecodeError, IsADirectoryError):
                pass
        return list(seen)

    def tool(d):
        return [p for p in glob.glob(f"static/{d}/**/*", recursive=True)
                if p.endswith((".js", ".html")) and "/vendor/" not in p and ".min." not in p]

    groups = collections.OrderedDict()
    groups["fabao"] = chars(tool("fabao"))        # 各件共用的在前，共用的字归它
    groups["qj"] = chars(glob.glob("assets/js/qj/*.js") + glob.glob("data/*") + glob.glob("layouts/**/*.html", recursive=True)
                         + glob.glob("i18n/*"))
    for d in sorted(tool_dirs):
        if "/fonts/qj.css" in open(f"static/{d}/index.html", encoding="utf8").read():   # 谚文自带 yz.css，不归这里管
            groups[d] = chars(tool(d))
    return groups


def plan(k, use, world, groups):
    """→ [(包名, 字集)]，互不相交。"""
    pages = sorted(use)
    freq, wf = collections.Counter(), collections.defaultdict(collections.Counter)
    for p in pages:
        for c in use[p][k]:
            freq[c] += 1
            wf[c][world[p]] += 1
    com, po, to = set(), set(), set()
    for c, v in freq.items():
        if v < 2:
            continue
        if wf[c]["T"] and wf[c]["H"]:
            com.add(c)
        elif wf[c]["H"]:
            po.add(c)
        else:
            to.add(c)
    packs = []
    for p in pages:
        own = {c for c in use[p][k] if freq[c] == 1}
        if len(own) >= MIN_PAGE:
            packs.append(("页 " + p, own))
        else:
            (to if world[p] == "T" else po).update(own)
    done = set(freq)
    misc = []
    for g, seq in groups.items():
        seq = [c for c in seq if c in FAMS[k]["cmap"] and c not in done]
        if len(seq) > MAX_EXTRA:
            continue
        done.update(seq)
        if len(seq) < MIN_EXTRA:
            misc += seq
            continue
        n = -(-len(seq) // CHUNK)                  # 分成差不多大的几片
        size = -(-len(seq) // n)
        for i in range(n):
            packs.append((f"备 {g} {i + 1}/{n}", set(seq[i * size:(i + 1) * size])))
    if misc:
        packs.append(("备 杂", set(misc)))
    return [("通用", com), ("文章", po), ("法宝", to)] + packs


def make_subset(k, cps):
    o = subset.Options()
    o.flavor = "woff2"
    o.layout_features = FAMS[k]["features"]
    o.hinting = False
    o.notdef_outline = True
    o.name_IDs = [1, 2, 3, 4, 6]
    o.drop_tables += ["DSIG", "meta"]
    font = TTFont(FAMS[k]["path"], recalcTimestamp=False)     # 不盖新时间戳：同样的字集重跑出同样的文件、同样的文件名
    s = subset.Subsetter(o)
    s.populate(unicodes=sorted(cps))
    s.subset(font)
    buf = io.BytesIO()
    font.flavor = "woff2"
    font.save(buf)
    return buf.getvalue()


def main():
    fetch_sources()
    blocks = read_google()
    use, world, tool_dirs = read_usage()
    groups = source_chars(tool_dirs)
    fam_key = {f["family"]: k for k, f in FAMS.items()}
    weights = {k: sorted({b["weight"] for b in blocks if b["fam"] == f["family"]}, key=int) for k, f in FAMS.items()}
    old_size = {b["url"]: os.path.getsize("static" + b["url"]) for b in blocks if os.path.exists("static" + b["url"])}

    head = "/* 由 scripts/fonts/pack.py 生成，勿手改 */\n"
    css = [head]
    for b in blocks:
        if b["fam"] not in fam_key or b["tag"] == "latin":     # Archivo 全部、两套中文字体的拉丁切片：页页要用，先载
            css.append("@font-face {" + b["body"] + "}\n")
    packed, keep, report, preload, pack_of, late = {}, set(), [], [], {}, []
    for k in FAMS:
        packed[k] = set()
        for name, cps in plan(k, use, world, groups):
            if not cps:
                continue
            data = make_subset(k, cps)
            fn = "p-" + hashlib.sha1(data).hexdigest()[:12] + ".woff2"
            keep.add(fn)
            open(f"{OUT}/f/{fn}", "wb").write(data)
            packed[k] |= cps
            report.append((k, name, len(cps), len(data)))
            pack_of[(k, name)] = (cps, len(data))
            if name == "通用":
                preload.append(f"/fonts/f/{fn}")
            sheet = late if name.startswith("备") else css   # 备用包起盘后才用得上，随兜底样式晚些载
            sheet.append(f"/* {FAMS[k]['family']} · {name} · {len(cps)} 字 */\n")
            for w in weights[k]:
                sheet.append("@font-face {\n  font-family: '%s';\n  font-style: normal;\n  font-weight: %s;\n  font-display: swap;\n"
                           "  src: url(/fonts/f/%s) format('woff2');\n  unicode-range: %s;\n}\n"
                           % (FAMS[k]["family"], w, fn, fmt_range(cps)))
    open(f"{OUT}/qj.css", "w", encoding="utf8").write("".join(css))

    # 兜底：谷歌切片扣掉已打包的字；扣空的切片整片不要
    rest, used_urls = [head] + late, set()
    for b in blocks:
        k = fam_key.get(b["fam"])
        if not k or b["tag"] == "latin":
            continue
        left = b["range"] - packed[k] if b["named"] else b["range"] - packed[k] - FAMS[k]["named"]
        if not left:
            continue
        used_urls.add(b["url"])
        rest.append("@font-face {" + re.sub(r"unicode-range:\s*[^;]+", "unicode-range: " + fmt_range(left), b["body"]) + "}\n")
    open(f"{OUT}/qj-rest.css", "w", encoding="utf8").write("".join(rest))
    # 版本号＝两份样式内容的摘要；Hugo 页从 data/fonts.json 读，法宝各页（静态 HTML）由这里改写
    ver = hashlib.sha1(open(f"{OUT}/qj.css", "rb").read() + open(f"{OUT}/qj-rest.css", "rb").read()).hexdigest()[:8]
    json.dump({"v": ver, "preload": preload}, open("data/fonts.json", "w"), indent=2)
    open("data/fonts.json", "a").write("\n")
    link = re.compile(r'<link rel="stylesheet" href="/fonts/qj\.css\?v=[^"]*">(\s*<link rel="stylesheet" href="/fonts/qj-rest\.css[^>]*>)?')
    two = (f'<link rel="stylesheet" href="/fonts/qj.css?v={ver}">\n'
           f'  <link rel="stylesheet" href="/fonts/qj-rest.css?v={ver}" media="print" onload="this.media=\'all\'">')
    touched = 0
    for f in glob.glob("static/*/index.html") + ["scripts/lock/template.html"]:
        html = open(f, encoding="utf8").read()
        new = link.sub(two, html)
        if new != html:
            open(f, "w", encoding="utf8").write(new)
            touched += 1

    # 清理：旧字包、被扣空的谷歌切片（yz.css 还在用的留着）
    yz = set(re.findall(r"url\(/fonts/f/([^)]+)\)", open(f"{OUT}/yz.css").read()))
    live = keep | yz | {u.rsplit("/", 1)[1] for u in used_urls} | {b["url"].rsplit("/", 1)[1] for b in blocks if b["fam"] not in fam_key or b["tag"] == "latin"}
    gone = [f for f in os.listdir(f"{OUT}/f") if f not in live]
    for f in gone:
        os.remove(f"{OUT}/f/{f}")

    # —— 账目 ——
    print("\n字包：")
    for k, name, n, size in report:
        print(f"  {FAMS[k]['family']:<15} {name:<40} {n:>5} 字 {size / 1024:>7.1f} KB")
    before, after, files = [], [], []
    for p in sorted(use):
        b = a = n = 0
        for k, f in FAMS.items():
            urls = {x["url"] for x in blocks if x["fam"] == f["family"] and x["range"] & use[p][k]}
            b += sum(old_size.get(u, 0) for u in urls)
            for (kk, name), (cps, size) in pack_of.items():
                if kk == k and cps & use[p][k]:
                    a += size
                    n += 1
        before.append(b)
        after.append(a)
        files.append(n)
    kb = lambda v: f"{v / 1024:.0f} KB"
    print(f"\n每页首次要下的字体（{len(use)} 页）：")
    print(f"  原先  中位 {kb(statistics.median(before))}，最多 {kb(max(before))}")
    print(f"  如今  中位 {kb(statistics.median(after))}，最多 {kb(max(after))}，文件数中位 {statistics.median(files):.0f}")
    print(f"qj.css {os.path.getsize(OUT + '/qj.css') / 1024:.0f} KB，qj-rest.css {os.path.getsize(OUT + '/qj-rest.css') / 1024:.0f} KB；"
          f"删去不再引用的切片 {len(gone)} 个；改写 {touched} 个静态页的字体链接（版本 {ver}）")
    if touched:
        print("静态页有改动：接着跑一次 node scripts/pwa/gen-sw.js 更新离线清单")


if __name__ == "__main__":
    sys.exit(main())
