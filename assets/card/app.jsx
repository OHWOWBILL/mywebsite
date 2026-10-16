/* Cursor light + rune trail behavior, plus the App root */

const _T_CUR = "\uFE0E";
const CURSOR_RUNES = ["✶","☽","☿","✦","✷","卐","乾","坤","震","巽","坎","離","艮","兌","☉","♀","♃","△","▽"]
  .map(s => /[\u2600-\u27BF\u2300-\u23FF♀♂♃♄♅♆♇☉☽☿]/.test(s) ? s + _T_CUR : s);

const useCursorTrail = () => {
  React.useEffect(() => {
    const glow = document.querySelector(".cursor-glow");
    let lastDrop = 0;
    let lastX = -999, lastY = -999;

    const onMove = (e) => {
      if (glow) {
        glow.style.left = `${e.clientX}px`;
        glow.style.top = `${e.clientY}px`;
      }

      const now = performance.now();
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      const dist = Math.hypot(dx, dy);
      // drop a rune occasionally as user moves
      if (dist > 80 && now - lastDrop > 220) {
        const r = document.createElement("span");
        r.className = "rune-trail";
        r.textContent = CURSOR_RUNES[Math.floor(Math.random() * CURSOR_RUNES.length)];
        r.style.left = `${e.clientX + (Math.random() - 0.5) * 30}px`;
        r.style.top = `${e.clientY + (Math.random() - 0.5) * 30}px`;
        r.style.fontSize = `${14 + Math.random() * 12}px`;
        document.body.appendChild(r);
        setTimeout(() => r.remove(), 1700);
        lastDrop = now;
        lastX = e.clientX;
        lastY = e.clientY;
      }
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);
};

const App = () => {
  // 定稿外观：深夜金、满密度。系统开启「减少动态效果」时星盘停转。
  React.useEffect(() => {
    const root = document.documentElement;
    const still = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    root.style.setProperty("--density", 1);
    root.dataset.animate = still ? "0" : "1";
    root.dataset.densityMode = "lush";
  }, []);

  useCursorTrail();

  return (
    <>
      {/* loading curtain */}
      <div className="curtain"><div className="sigil-load"/></div>

      {/* ambient light following cursor */}
      <div className="cursor-glow" aria-hidden="true"/>

      {/* fixed decorative chrome */}
      <RunesBackground />
      <Constellation />
      <div className="frame-edge" aria-hidden="true"/>
      <div className="corner tl"><CornerOrnament /></div>
      <div className="corner tr"><CornerOrnament /></div>
      <div className="corner bl"><CornerOrnament /></div>
      <div className="corner br"><CornerOrnament /></div>

      {/* main stage */}
      <div className="stage">
        <div className="card">
          {/* LEFT */}
          <aside className="side left">
            <div className="label">Persona · 名号</div>
            <div className="lat">Ohwowbill</div>
            <div className="zh">潜蛟子</div>
            <div className="divider-glyph">{"☉\uFE0E · ☽\uFE0E · ✶"}</div>
            <div className="verse">
              「只手攀南斗，翻身倚北辰。<br/>
              　举头天外望，无我这般人。」
            </div>
            <div className="stamp-coord">
              N 30°15′ · E 120°09′<br/>
              MMXXVI · ANNO · DRAGONIS<br/>
              SIGILLVM · OHWOWBILL
            </div>
          </aside>

          {/* CENTER COMPASS */}
          <main className="center">
            <Compass />
            <div className="sigil">
              <div className="ohw">OHWOWBILL</div>
              <h1 className="name-zh">潜&nbsp;蛟&nbsp;子</h1>
              <div className="tag">玄&nbsp;·&nbsp;言&nbsp;·&nbsp;生</div>
            </div>
          </main>

          {/* RIGHT */}
          <aside className="side right">
            <div className="label">Praxis · 道行</div>
            <div className="lat"><em>Mysticum × Lingva × Vita</em></div>
            <div className="zh">玄&nbsp;学&nbsp;·&nbsp;语&nbsp;言&nbsp;·&nbsp;生&nbsp;活</div>
            <div className="divider-glyph">{"☿\uFE0E · ♀\uFE0E · ♃\uFE0E"}</div>
            <div className="verse">
              "Of mystery, of word, of breath —<br/>
              the threefold work of one slow life."
            </div>
            <div className="stamp-coord">
              CHART · No. 0001<br/>
              VOLVMEN · I · FOLIO · I<br/>
              EX · LIBRIS · OHWOWBILL
            </div>
          </aside>
        </div>

        <Talismans />

        <div className="footer-line">
          <span>SIGNUM</span>
          <span className="sep">✦</span>
          <span>OPUS NOCTURNUM</span>
          <span className="sep">✦</span>
          <span>MMXXVI</span>
        </div>
      </div>

    </>
  );
};

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
