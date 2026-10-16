/* Central compass — nested rings: bagua (inner), zodiac (mid), 28 mansions (outer-mid),
   alchemical/planetary glyphs (outer), all rotating at different speeds. */

// U+FE0E forces text (monochrome) presentation on emoji-default codepoints
const T = "\uFE0E";

const Compass = () => {
  // 八卦 in king wen order (around center) — trigrams already text-default
  const bagua = ["☰", "☱", "☲", "☳", "☴", "☵", "☶", "☷"];
  const baguaNames = ["乾", "兌", "離", "震", "巽", "坎", "艮", "坤"];

  // 十二星座 — these default to color emoji, must force text
  const zodiac = ["♈","♉","♊","♋","♌","♍","♎","♏","♐","♑","♒","♓"].map(s => s + T);
  const zodiacLat = ["ARIES", "TAURVS", "GEMINI", "CANCER", "LEO", "VIRGO",
                     "LIBRA", "SCORPIO", "SAGITTARIVS", "CAPRICORN", "AQVARIVS", "PISCES"];

  // 28 lunar mansions (二十八宿) — in canonical order
  const mansions = [
    "角","亢","氐","房","心","尾","箕",  // east — 青龙
    "斗","牛","女","虛","危","室","壁",  // north — 玄武
    "奎","婁","胃","昴","畢","觜","參",  // west — 白虎
    "井","鬼","柳","星","張","翼","軫",  // south — 朱雀
  ];

  // alchemical / planetary glyphs (outermost) — sun/moon/♀/♂/♃/♄ default to emoji
  const alchemy = ["☉","☽","☿","♀","♁","♂","♃","♄","♅","♆","☊","☋","✶","☥","⚸","⚳"].map(s => s + T);

  // helper: position items along a ring
  const onRing = (radius, count, i) => {
    const a = (i / count) * Math.PI * 2 - Math.PI / 2;
    return { x: 250 + radius * Math.cos(a), y: 250 + radius * Math.sin(a), angle: (i / count) * 360 };
  };

  return (
    <svg className="compass" viewBox="0 0 500 500" aria-hidden="true">
      <defs>
        <radialGradient id="rgInner" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="var(--gold-1)" stopOpacity="0.18"/>
          <stop offset="60%" stopColor="var(--gold-1)" stopOpacity="0.04"/>
          <stop offset="100%" stopColor="var(--gold-1)" stopOpacity="0"/>
        </radialGradient>
        <linearGradient id="lgGold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--gold-0)"/>
          <stop offset="100%" stopColor="var(--gold-2)"/>
        </linearGradient>
      </defs>

      {/* glow center */}
      <circle cx="250" cy="250" r="240" fill="url(#rgInner)"/>

      {/* outermost: alchemical glyphs ring 5 — slow forward */}
      <g className="ring ring-5">
        <circle cx="250" cy="250" r="240" className="hairline"/>
        <circle cx="250" cy="250" r="232" className="dim"/>
        {alchemy.map((g, i) => {
          const p = onRing(236, alchemy.length, i);
          return (
            <text
              key={`al-${i}`}
              x={p.x} y={p.y}
              textAnchor="middle"
              dominantBaseline="middle"
              className="glyph-lg"
              style={{ fontSize: 14 }}
            >{g}</text>
          );
        })}
        {/* tick marks */}
        {Array.from({length: 96}).map((_, i) => {
          const a = (i / 96) * Math.PI * 2;
          const r1 = 224, r2 = i % 4 === 0 ? 218 : 221;
          return (
            <line key={`t5-${i}`}
              x1={250 + r1 * Math.cos(a)} y1={250 + r1 * Math.sin(a)}
              x2={250 + r2 * Math.cos(a)} y2={250 + r2 * Math.sin(a)}
              className={i % 4 === 0 ? "tick" : "tick-fine"}
            />
          );
        })}
      </g>

      {/* ring 4: 28 mansions — counter-rotate */}
      <g className="ring ring-4">
        <circle cx="250" cy="250" r="210" className="line"/>
        <circle cx="250" cy="250" r="196" className="hairline"/>
        {mansions.map((m, i) => {
          const p = onRing(203, mansions.length, i);
          return (
            <g key={`m-${i}`} transform={`rotate(${p.angle} ${p.x} ${p.y})`}>
              <text x={p.x} y={p.y + 4} textAnchor="middle" className="hanzi"
                    style={{ fontSize: 10 }}>
                {m}
              </text>
            </g>
          );
        })}
      </g>

      {/* ring 3: zodiac — forward */}
      <g className="ring ring-3">
        <circle cx="250" cy="250" r="180" className="hairline"/>
        <circle cx="250" cy="250" r="158" className="line"/>
        {/* zodiac segment dividers */}
        {Array.from({length: 12}).map((_, i) => {
          const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
          return (
            <line key={`zd-${i}`}
              x1={250 + 158 * Math.cos(a)} y1={250 + 158 * Math.sin(a)}
              x2={250 + 180 * Math.cos(a)} y2={250 + 180 * Math.sin(a)}
              className="tick"
            />
          );
        })}
        {zodiac.map((z, i) => {
          const a = ((i + 0.5) / 12) * Math.PI * 2 - Math.PI / 2;
          const x = 250 + 169 * Math.cos(a);
          const y = 250 + 169 * Math.sin(a);
          return (
            <text key={`z-${i}`}
              x={x} y={y + 5}
              textAnchor="middle"
              className="glyph-lg"
              style={{ fontSize: 16 }}
            >{z}</text>
          );
        })}
        {/* latin labels — curved */}
        {zodiacLat.map((lat, i) => {
          const startA = (i / 12) * 360 - 90;
          return (
            <path key={`zlp-${i}`}
              id={`zl-${i}`}
              d={describeArc(250, 250, 152, startA + 2, startA + 28)}
              fill="none"/>
          );
        })}
        {zodiacLat.map((lat, i) => (
          <text key={`zl-t-${i}`}>
            <textPath href={`#zl-${i}`} startOffset="0">
              {lat}
            </textPath>
          </text>
        ))}
      </g>

      {/* ring 2: bagua — counter */}
      <g className="ring ring-2">
        <circle cx="250" cy="250" r="140" className="line"/>
        <circle cx="250" cy="250" r="120" className="hairline"/>
        {/* octagon */}
        <polygon points={octagonPts(250, 250, 130)} className="stroke" opacity="0.4"/>
        {bagua.map((b, i) => {
          const p = onRing(130, 8, i);
          return (
            <g key={`b-${i}`}>
              <text x={p.x} y={p.y + 6}
                    textAnchor="middle"
                    style={{ fontSize: 18, fill: "var(--gold-0)", fontFamily: "var(--display)" }}>
                {b}
              </text>
            </g>
          );
        })}
        {baguaNames.map((n, i) => {
          const p = onRing(108, 8, i);
          return (
            <text key={`bn-${i}`} x={p.x} y={p.y + 4}
                  textAnchor="middle"
                  className="hanzi"
                  style={{ fontSize: 10, fill: "var(--gold-2)" }}>
              {n}
            </text>
          );
        })}
      </g>

      {/* ring 1: pentagram + center mandala — forward slow */}
      <g className="ring ring-1">
        <circle cx="250" cy="250" r="92" className="hairline"/>
        <circle cx="250" cy="250" r="76" className="dim"/>
        {/* pentagram */}
        <polygon
          points={pentagramPts(250, 250, 84)}
          fill="none"
          stroke="var(--gold-2)"
          strokeWidth="0.6"
          opacity="0.7"
        />
        {/* hexagram */}
        <polygon
          points={triPts(250, 250, 64, 0)}
          fill="none"
          stroke="var(--gold-1)"
          strokeWidth="0.7"
          opacity="0.8"
        />
        <polygon
          points={triPts(250, 250, 64, 180)}
          fill="none"
          stroke="var(--gold-1)"
          strokeWidth="0.7"
          opacity="0.8"
        />
        {/* small dots at pentagram vertices */}
        {Array.from({length: 5}).map((_, i) => {
          const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
          return (
            <circle key={`pd-${i}`}
              cx={250 + 84 * Math.cos(a)}
              cy={250 + 84 * Math.sin(a)}
              r="2"
              fill="var(--gold-0)"
            />
          );
        })}
      </g>

      {/* fixed center hairlines (no rotation) */}
      <g>
        <circle cx="250" cy="250" r="50" className="line" opacity="0.6"/>
        <circle cx="250" cy="250" r="40" className="dim"/>
      </g>
    </svg>
  );
};

/* ----- geometry helpers ----- */
function polarToCartesian(cx, cy, r, deg) {
  const rad = (deg - 90) * Math.PI / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}
function describeArc(cx, cy, r, startDeg, endDeg) {
  const start = polarToCartesian(cx, cy, r, endDeg);
  const end = polarToCartesian(cx, cy, r, startDeg);
  const largeArc = endDeg - startDeg <= 180 ? "0" : "1";
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y}`;
}
function pentagramPts(cx, cy, r) {
  // skip-2 pentagram
  const pts = [];
  for (let i = 0; i < 5; i++) {
    const idx = (i * 2) % 5;
    const a = (idx / 5) * Math.PI * 2 - Math.PI / 2;
    pts.push(`${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`);
  }
  return pts.join(" ");
}
function triPts(cx, cy, r, rotDeg) {
  const pts = [];
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 - Math.PI / 2 + (rotDeg * Math.PI / 180);
    pts.push(`${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`);
  }
  return pts.join(" ");
}
function octagonPts(cx, cy, r) {
  const pts = [];
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
    pts.push(`${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`);
  }
  return pts.join(" ");
}

window.Compass = Compass;
