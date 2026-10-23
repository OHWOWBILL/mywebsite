"""生成星盘 SVG → layouts/partials/compass.html

星盘原是首页 React 名片的中心（assets/card/compass.jsx，已删，见 git 历史）。
改版后不再用 React，这里把同样的几何一次算好，输出静态 SVG；
旋转交给 CSS（assets/css/custom.css「星盘」一节）。改环、改字后重跑：
    python3 scripts/compass.py
"""
import math
from pathlib import Path

C = 250
T = "︎"  # 强制文字（单色）字形，避免星座符号被渲染成彩色 emoji

bagua = ["☰", "☱", "☲", "☳", "☴", "☵", "☶", "☷"]
bagua_names = ["乾", "兌", "離", "震", "巽", "坎", "艮", "坤"]
zodiac = [s + T for s in "♈♉♊♋♌♍♎♏♐♑♒♓"]
mansions = list("角亢氐房心尾箕斗牛女虛危室壁奎婁胃昴畢觜參井鬼柳星張翼軫")
alchemy = [s + T for s in ["☉", "☽", "☿", "♀", "♁", "♂", "♃", "♄", "♅", "♆", "☊", "☋", "✶", "☥", "⚸", "⚳"]]


def f(x):
    return f"{x:.1f}".rstrip("0").rstrip(".")


def on_ring(r, n, i, offset=0.0):
    a = (i + offset) / n * 2 * math.pi - math.pi / 2
    return C + r * math.cos(a), C + r * math.sin(a), (i + offset) / n * 360


def poly(pts):
    return " ".join(f"{f(x)},{f(y)}" for x, y in pts)


def circle(r, cls):
    return f'<circle cx="{C}" cy="{C}" r="{r}" class="{cls}"/>'


def line(r1, r2, a, cls):
    return (f'<line x1="{f(C + r1 * math.cos(a))}" y1="{f(C + r1 * math.sin(a))}" '
            f'x2="{f(C + r2 * math.cos(a))}" y2="{f(C + r2 * math.sin(a))}" class="{cls}"/>')


def text(x, y, s, cls, extra=""):
    return f'<text x="{f(x)}" y="{f(y)}" class="{cls}"{extra}>{s}</text>'


out = []
# 第五环：行星与炼金符号 + 刻度
g = [circle(240, "cp-hair"), circle(232, "cp-dim")]
for i, s in enumerate(alchemy):
    x, y, _ = on_ring(236, len(alchemy), i)
    g.append(text(x, y + 5, s, "cp-glyph cp-s14"))
for i in range(96):
    a = i / 96 * 2 * math.pi
    g.append(line(224, 218 if i % 4 == 0 else 221, a, "cp-tick" if i % 4 == 0 else "cp-fine"))
out.append(('cp-r5', g))

# 第四环：二十八宿
g = [circle(210, "cp-line"), circle(196, "cp-hair")]
for i, m in enumerate(mansions):
    x, y, deg = on_ring(203, len(mansions), i)
    g.append(f'<text x="{f(x)}" y="{f(y + 4)}" class="cp-han cp-s10" transform="rotate({f(deg)} {f(x)} {f(y)})">{m}</text>')
out.append(('cp-r4', g))

# 第三环：十二星座（原有的拉丁名去掉，只留符号）
g = [circle(180, "cp-hair"), circle(158, "cp-line")]
for i in range(12):
    a = i / 12 * 2 * math.pi - math.pi / 2
    g.append(line(158, 180, a, "cp-tick"))
for i, z in enumerate(zodiac):
    x, y, _ = on_ring(169, 12, i, 0.5)
    g.append(text(x, y + 5, z, "cp-glyph cp-s16"))
out.append(('cp-r3', g))

# 第二环：八卦
oct_pts = [(C + 130 * math.cos(i / 8 * 2 * math.pi + math.pi / 8),
            C + 130 * math.sin(i / 8 * 2 * math.pi + math.pi / 8)) for i in range(8)]
g = [circle(140, "cp-line"), circle(120, "cp-hair"), f'<polygon points="{poly(oct_pts)}" class="cp-hair"/>']
for i, b in enumerate(bagua):
    x, y, _ = on_ring(130, 8, i)
    g.append(text(x, y + 6, b, "cp-gua"))
for i, n in enumerate(bagua_names):
    x, y, _ = on_ring(108, 8, i)
    g.append(text(x, y + 4, n, "cp-han cp-s10"))
out.append(('cp-r2', g))

# 第一环：五芒与六芒
def star_pts(r, n, step, rot=0.0):
    return [(C + r * math.cos((i * step % n) / n * 2 * math.pi - math.pi / 2 + rot),
             C + r * math.sin((i * step % n) / n * 2 * math.pi - math.pi / 2 + rot)) for i in range(n)]

g = [circle(92, "cp-hair"), circle(76, "cp-dim"),
     f'<polygon points="{poly(star_pts(84, 5, 2))}" class="cp-star"/>',
     f'<polygon points="{poly(star_pts(64, 3, 1))}" class="cp-hex"/>',
     f'<polygon points="{poly(star_pts(64, 3, 1, math.pi))}" class="cp-hex"/>']
for x, y in star_pts(84, 5, 1):
    g.append(f'<circle cx="{f(x)}" cy="{f(y)}" r="2" class="cp-dot"/>')
out.append(('cp-r1', g))

svg = ['{{- /* 由 scripts/compass.py 生成，勿手改。用法：{{ partial "compass.html" . }}，外层可加 class 控制尺寸 */ -}}',
       '<svg class="qj-compass" viewBox="0 0 500 500" aria-hidden="true" focusable="false">']
for cls, items in out:
    svg.append(f'<g class="cp-ring {cls}">' + "".join(items) + "</g>")
svg.append("<g>" + circle(50, "cp-line") + circle(40, "cp-dim") + "</g>")
svg.append("</svg>")
Path(__file__).resolve().parent.parent.joinpath("layouts/partials/compass.html").write_text("\n".join(svg) + "\n", encoding="utf-8")
