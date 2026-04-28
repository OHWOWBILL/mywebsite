/* Corner ornaments + edge ticks + floating runes + constellation lines */

const CornerOrnament = () => (
  <svg viewBox="0 0 220 220" aria-hidden="true">
    {/* L-bracket frame */}
    <path d="M 8 60 L 8 8 L 60 8" fill="none" stroke="currentColor" strokeWidth="1"/>
    <path d="M 14 70 L 14 14 L 70 14" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.6"/>
    {/* corner sigil */}
    <g transform="translate(20, 20)" fill="none" stroke="currentColor" strokeWidth="0.7">
      <circle cx="14" cy="14" r="13"/>
      <circle cx="14" cy="14" r="9" opacity="0.6"/>
      <polygon points="14,3 17,11 25,11 19,16 21,24 14,19 7,24 9,16 3,11 11,11" opacity="0.5"/>
    </g>
    {/* radial lines */}
    <g stroke="currentColor" strokeWidth="0.4" opacity="0.4">
      <line x1="50" y1="14" x2="200" y2="14"/>
      <line x1="14" y1="50" x2="14" y2="200"/>
    </g>
    {/* tick marks along edges */}
    {Array.from({length: 16}).map((_, i) => (
      <line key={`tx-${i}`}
        x1={50 + i * 9} y1="14"
        x2={50 + i * 9} y2={i % 4 === 0 ? "8" : "11"}
        stroke="currentColor" strokeWidth="0.4" opacity="0.5"
      />
    ))}
    {Array.from({length: 16}).map((_, i) => (
      <line key={`ty-${i}`}
        x1="14" y1={50 + i * 9}
        x2={i % 4 === 0 ? "8" : "11"} y2={50 + i * 9}
        stroke="currentColor" strokeWidth="0.4" opacity="0.5"
      />
    ))}
    {/* small numbers along edge */}
    <text x="76" y="28" fill="currentColor" fontSize="6" fontFamily="var(--display)" letterSpacing="0.3em" opacity="0.6">
      MMXXVI · OPVS · I
    </text>
    <text x="28" y="80" fill="currentColor" fontSize="6" fontFamily="var(--display)"
          opacity="0.6" transform="rotate(90 28 80)" letterSpacing="0.3em">
      AETERNVM · NIHIL
    </text>
    {/* alchemical glyphs scattered */}
    <text x="92" y="46" fill="currentColor" fontSize="11" fontFamily="var(--display)" opacity="0.7">{"☿\uFE0E"}</text>
    <text x="46" y="100" fill="currentColor" fontSize="11" fontFamily="var(--display)" opacity="0.7">{"☉\uFE0E"}</text>
    <text x="68" y="68" fill="currentColor" fontSize="9" fontFamily="var(--display)" opacity="0.55">✶</text>
  </svg>
);

const EdgeTicks = () => (
  <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
    {/* This is decorative — drawn separately at corners with absolutely positioned svgs would be heavy.
        Instead, render border markings with simple repeats. */}
  </svg>
);

const _T = "\uFE0E";
const RUNES = ["☉","☽","☿","♀","♂","♃","♄","♅","♆","☊","☋","✶","✷","✸","☥","⚸","⚳","⚴","⚵","⚶","⚷","⚸","☌","☍","△","▽","◯","卐","卍","☼","♁","♇","☄","✦","✧"].map(s => s + _T);
const HANZI_RUNES = ["乾","坤","震","巽","坎","離","艮","兌","元","亨","利","貞","龍","虎","朱","玄","靈","炁","符","咒"];

const RunesBackground = () => {
  // deterministic pseudo-random scatter for layout stability
  const items = [];
  let seed = 7;
  const rand = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
  const total = 28;
  for (let i = 0; i < total; i++) {
    const isHanzi = rand() < 0.35;
    const pool = isHanzi ? HANZI_RUNES : RUNES;
    items.push({
      ch: pool[Math.floor(rand() * pool.length)],
      x: 4 + rand() * 92,
      y: 4 + rand() * 92,
      size: 14 + rand() * 30,
      delay: rand() * 18,
      opacity: 0.25 + rand() * 0.55,
      hanzi: isHanzi,
    });
  }
  return (
    <div className="runes-bg" aria-hidden="true">
      {items.map((it, i) => (
        <span
          key={i}
          className="rune-floater"
          style={{
            left: `${it.x}%`,
            top: `${it.y}%`,
            fontSize: `${it.size}px`,
            opacity: it.opacity,
            animationDelay: `-${it.delay}s`,
            fontFamily: it.hanzi ? "var(--hanzi)" : "var(--display)",
          }}
        >{it.ch}</span>
      ))}
    </div>
  );
};

const Constellation = () => {
  // a curated set of "constellation" points + lines, one corner each
  const stars1 = [[8,12],[14,18],[20,15],[24,22],[18,28],[12,24]];
  const stars2 = [[78,14],[84,20],[90,18],[88,28],[82,32],[80,24]];
  const stars3 = [[10,72],[16,78],[22,75],[20,86],[12,84]];
  const stars4 = [[80,68],[86,74],[92,70],[90,82],[82,86],[76,80]];
  const groups = [stars1, stars2, stars3, stars4];

  return (
    <svg className="constellation" width="100%" height="100%"
         viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      {groups.map((g, gi) => (
        <g key={gi}>
          {g.map((s, i) => i < g.length - 1 && (
            <line key={`l-${gi}-${i}`}
              x1={s[0]} y1={s[1]}
              x2={g[i+1][0]} y2={g[i+1][1]}
              stroke="var(--gold-2)" strokeWidth="0.08"
              opacity="0.5"
              vectorEffect="non-scaling-stroke"
            />
          ))}
          {g.map((s, i) => (
            <circle key={`c-${gi}-${i}`}
              cx={s[0]} cy={s[1]} r="0.25"
              fill="var(--gold-0)"
              opacity="0.85"
            />
          ))}
        </g>
      ))}
    </svg>
  );
};

window.CornerOrnament = CornerOrnament;
window.EdgeTicks = EdgeTicks;
window.RunesBackground = RunesBackground;
window.Constellation = Constellation;
