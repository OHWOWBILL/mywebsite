/* Six social talismans — hexagonal sigils with rune frame */

const TALISMANS = [
  {
    key: "xhs",
    glyph: "赤",        // 朱砂赤书
    labelEn: "VERMILION",
    labelZh: "小红书",
    href: "https://xhslink.com/m/bhywG962OR",
    target: "_blank",
    rune: "❀",
  },
  {
    key: "ig",
    glyph: "Ig",
    labelEn: "ICONOGRAM",
    labelZh: "生活",
    href: "https://instagram.com/ohwowbill",
    target: "_blank",
    rune: "◎",
  },
  {
    key: "blog",
    glyph: "墨",        // 墨笔/blog
    labelEn: "GRIMOIRE",
    labelZh: "博客",
    href: "/posts/",
    rune: "✶",
  },
  {
    key: "wx",
    glyph: "言",        // 公众号 言
    labelEn: "PARABLE",
    labelZh: "公众号",
    href: "#wechat",
    wechatName: "哦哇呜比尔",
    rune: "卍",
  },
  {
    key: "bili",
    glyph: "B",
    labelEn: "BILIVISION",
    labelZh: "哔哩",
    href: "https://b23.tv/aT5uWeT",
    target: "_blank",
    rune: "✦",
  },
  {
    key: "yt",
    glyph: "Y",
    labelEn: "YOUTUBIA",
    labelZh: "影坊",
    href: "https://youtube.com/channel/UCrlefr8uy8jfDxBfY0jKeyg",
    target: "_blank",
    rune: "▲",
  },
  {
    key: "meihua",
    glyph: "卦",        // 梅花易数
    labelEn: "DIVINER",
    labelZh: "梅花",
    href: "/meihua/",
    rune: "☰",
  },
  {
    key: "yanzhi",
    glyph: "谚",        // 閩吳谚文
    labelEn: "PHONOLOGY",
    labelZh: "谚文",
    href: "/yanzhi/",
    rune: "문",
  },
];

const TalismanFrame = () => (
  <svg viewBox="0 0 84 104" preserveAspectRatio="none" aria-hidden="true">
    <defs>
      <pattern id="hexPattern" patternUnits="userSpaceOnUse" width="6" height="6">
        <circle cx="3" cy="3" r="0.5" fill="currentColor" opacity="0.3"/>
      </pattern>
    </defs>
    {/* outer hex */}
    <polygon points="42,1 83,17 83,87 42,103 1,87 1,17"
             fill="none" stroke="currentColor" strokeWidth="1"/>
    {/* inner hex */}
    <polygon points="42,7 77,21 77,83 42,97 7,83 7,21"
             fill="none" stroke="currentColor" strokeWidth="0.4" opacity="0.5"/>
    {/* corner ticks */}
    <g stroke="currentColor" strokeWidth="0.6" opacity="0.7">
      <line x1="42" y1="1" x2="42" y2="6"/>
      <line x1="42" y1="98" x2="42" y2="103"/>
      <line x1="1" y1="52" x2="6" y2="52"/>
      <line x1="78" y1="52" x2="83" y2="52"/>
    </g>
    {/* tiny dots at vertices */}
    <circle cx="42" cy="1" r="1" fill="currentColor"/>
    <circle cx="42" cy="103" r="1" fill="currentColor"/>
    <circle cx="83" cy="17" r="1" fill="currentColor"/>
    <circle cx="83" cy="87" r="1" fill="currentColor"/>
    <circle cx="1" cy="17" r="1" fill="currentColor"/>
    <circle cx="1" cy="87" r="1" fill="currentColor"/>
  </svg>
);

const Talisman = ({ data }) => {
  const [copied, setCopied] = React.useState(false);
  const isWechat = data.key === "wx";

  const onClick = (e) => {
    if (isWechat) {
      e.preventDefault();
      try {
        navigator.clipboard.writeText(data.wechatName);
        setCopied(true);
        setTimeout(() => setCopied(false), 1600);
      } catch (_) {}
    }
  };

  return (
    <a
      className={"talisman" + (isWechat ? " is-wechat" : "")}
      href={data.href}
      target={data.target || undefined}
      rel={data.target === "_blank" ? "noopener noreferrer" : undefined}
      onClick={onClick}
      title={isWechat ? `公众号：${data.wechatName}（点击复制）` : data.labelZh}
    >
      <span className="frame"><TalismanFrame /></span>
      <span className="label-zh">{data.labelZh}</span>
      <span className="glyph">{data.glyph}</span>
      <span className="label-en">{data.labelEn}</span>
      {isWechat && (
        <span className="wx-pop">
          {copied ? "已复制 ✓" : data.wechatName}
        </span>
      )}
    </a>
  );
};

const Talismans = () => (
  <div className="talismans">
    {TALISMANS.map(t => <Talisman key={t.key} data={t} />)}
  </div>
);

window.Talismans = Talismans;
window.TALISMANS = TALISMANS;
