// 覆盖主题 search.js：主题版只在 keyup 时检索，中文输入法上屏、粘贴、
// 自动填充都不触发 keyup，于是搜中文永远没结果；索引未取回时检索还会报错；
// 无结果时按回车会提交表单，页面跳成「当前地址?」。以下三处为本站所改。
// 另改作「问路」：Ctrl/⌘ K 随处唤出；没输字时列出各处去处；结果换成本站版式，
// 命中的字标紫；分类页不进结果。
var fuse;
var showButton = document.getElementById("search-button");
var showButtonMobile = document.getElementById("search-button-mobile");
var hideButton = document.getElementById("close-search-button");
var wrapper = document.getElementById("search-wrapper");
var modal = document.getElementById("search-modal");
var input = document.getElementById("search-query");
var output = document.getElementById("search-results");
var first = output.firstChild;
var last = output.lastChild;
var searchVisible = false;
var indexed = false;
var hasResults = false;
var composing = false;
var pendingTerm = null;

// Listen for events
showButton ? showButton.addEventListener("click", displaySearch) : null;
showButtonMobile ? showButtonMobile.addEventListener("click", displaySearch) : null;
hideButton.addEventListener("click", hideSearch);
wrapper.addEventListener("click", hideSearch);
modal.addEventListener("click", function (event) {
  event.stopPropagation();
  event.stopImmediatePropagation();
  return false;
});
document.addEventListener("keydown", function (event) {
  // 本站另加：Ctrl K / ⌘ K 随处问路（再按一次合上）
  if ((event.ctrlKey || event.metaKey) && !event.altKey && (event.key == "k" || event.key == "K")) {
    event.preventDefault();
    if (searchVisible) hideSearch();
    else displaySearch();
    return;
  }

  // Forward slash to open search wrapper
  if (event.key == "/") {
    const active = document.activeElement;
    const tag = active.tagName;
    const isInputField = tag === "INPUT" || tag === "TEXTAREA" || active.isContentEditable;

    if (!searchVisible && !isInputField) {
      event.preventDefault();
      displaySearch();
    }
  }

  // Esc to close search wrapper
  if (event.key == "Escape") {
    hideSearch();
  }

  // Down arrow to move down results list
  if (event.key == "ArrowDown") {
    if (searchVisible && hasResults) {
      event.preventDefault();
      if (document.activeElement == input) {
        first.focus();
      } else if (document.activeElement == last) {
        last.focus();
      } else {
        document.activeElement.parentElement.nextSibling.firstElementChild.focus();
      }
    }
  }

  // Up arrow to move up results list
  if (event.key == "ArrowUp") {
    if (searchVisible && hasResults) {
      event.preventDefault();
      if (document.activeElement == input) {
        input.focus();
      } else if (document.activeElement == first) {
        input.focus();
      } else {
        document.activeElement.parentElement.previousSibling.firstElementChild.focus();
      }
    }
  }

  // Enter to get to results
  // 本站另加：无结果时回车，带着字词去「寻物」页，而不是让表单提交成「当前地址?」
  if (event.key == "Enter" && searchVisible && !hasResults && !composing && !event.isComposing) {
    event.preventDefault();
    var q = input.value.trim();
    if (q) location.href = "/seek/?q=" + encodeURIComponent(q);
    return;
  }
  if (event.key == "Enter") {
    if (searchVisible && hasResults) {
      event.preventDefault();
      if (document.activeElement == input) {
        first.focus();
      } else {
        document.activeElement.click();
      }
    }
  }
});

// 改一：用 input 事件，输入法拼写期间不检索，上屏后再检索
input.addEventListener("compositionstart", function () {
  composing = true;
});
input.addEventListener("compositionend", function () {
  composing = false;
  executeQuery(this.value);
});
input.addEventListener("input", function () {
  if (!composing) executeQuery(this.value);
});
// 改三：表单永不提交
input.form.addEventListener("submit", function (event) {
  event.preventDefault();
});

// 问路：没输字时列出的去处
var PATHS = [
  ["文", "万法归一", "全部文章", "/posts/"],
  ["庭", "五术门庭", "山医命卜相，一术一门", "/wushu/"],
  ["术", "法宝库", "自制术数工具", "/tools/"],
  ["梅", "梅花", "此刻起一卦", "/meihua/"],
  ["生", "十二长生", "长生帝旺速查", "/changsheng/"],
  ["注", "子午流注", "此时开何穴", "/ziwu/"],
  ["奇", "奇门手记", "排盘与笔记", "/qimen/"],
  ["寻", "寻物", "整页搜索，网址可分享", "/seek/"],
  ["人", "阁主何人", "所习诸术、求问方式", "/about/"],
  ["往", "去处", "阁主在各平台", "/links/"],
];
function esc(s) {
  return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
  });
}
function showPaths() {
  output.innerHTML =
    '<li class="qj-q-cap">去处</li>' +
    PATHS.map(function (p) {
      return '<li><a class="qj-q-item qj-q-path" href="' + p[3] + '" tabindex="0">' +
        '<span class="qj-seal" aria-hidden="true">' + p[0] + "</span>" +
        '<span class="qj-q-t">' + p[1] + '</span><span class="qj-q-s">' + p[2] + "</span></a></li>";
    }).join("");
  hasResults = true;
  var links = output.querySelectorAll("a");
  first = links[0];
  last = links[links.length - 1];
}
if (!document.getElementById("qj-q-foot")) {
  var foot = document.createElement("footer");
  foot.id = "qj-q-foot";
  foot.className = "qj-q-foot";
  foot.innerHTML = "<span><kbd>↑</kbd><kbd>↓</kbd> 择</span><span><kbd>⏎</kbd> 往</span><span><kbd>Esc</kbd> 退</span>" +
    '<span class="qj-q-any"><kbd>Ctrl</kbd><kbd>K</kbd> 随处问路</span>';
  modal.appendChild(foot);
}

function displaySearch() {
  if (!indexed) {
    buildIndex();
  }
  if (!searchVisible) {
    document.body.style.overflow = "hidden";
    wrapper.style.visibility = "visible";
    if (!input.value.trim()) showPaths();
    input.focus();
    searchVisible = true;
  }
}

function hideSearch() {
  if (searchVisible) {
    document.body.style.overflow = "visible";
    wrapper.style.visibility = "hidden";
    input.value = "";
    output.innerHTML = "";
    document.activeElement.blur();
    searchVisible = false;
  }
}

function fetchJSON(path, callback) {
  var httpRequest = new XMLHttpRequest();
  httpRequest.onreadystatechange = function () {
    if (httpRequest.readyState === 4) {
      if (httpRequest.status === 200) {
        var data = JSON.parse(httpRequest.responseText);
        if (callback) callback(data);
      }
    }
  };
  httpRequest.open("GET", path);
  httpRequest.send();
}

function buildIndex() {
  var baseURL = wrapper.getAttribute("data-url");
  baseURL = baseURL.replace(/\/?$/, "/");
  fetchJSON(baseURL + "index.json", function (data) {
    var options = {
      shouldSort: true,
      ignoreLocation: true,
      threshold: 0.0,
      includeMatches: true,
      keys: [
        { name: "title", weight: 0.8 },
        { name: "section", weight: 0.2 },
        { name: "summary", weight: 0.6 },
        { name: "content", weight: 0.4 },
      ],
    };
    /*var finalIndex = [];
    for (var i in data) {
      if(data[i].type != "users" && data[i].type != "tags" && data[i].type != "categories"){
        finalIndex.push(data[i]);
      }
    }*/
    fuse = new Fuse(data, options);
    indexed = true;
    if (pendingTerm !== null) executeQuery(pendingTerm);
  });
}

function executeQuery(term) {
  // 改二：索引尚未取回时先记下，取回后补查
  if (!fuse) {
    pendingTerm = term;
    return;
  }
  pendingTerm = null;
  term = term.trim();
  if (!term) {
    showPaths();
    return;
  }
  let results = fuse.search(term).filter(function (r) {
    return r.item.type !== "categories" && r.item.type !== "tags";
  });
  let resultsHTML = "";

  if (results.length > 0) {
    // 命中的字标紫：把检索词里的每个字（去重）在标题与摘要里标出
    var marks = Array.from(new Set(term.replace(/\s+/g, "").split(""))).map(function (c) {
      return c.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    });
    var re = marks.length ? new RegExp("(" + marks.join("|") + ")", "g") : null;
    var hl = function (s) {
      if (!re) return esc(s);
      return String(s).split(re).map(function (part, i) { return i % 2 ? "<mark>" + esc(part) + "</mark>" : esc(part); }).join("");
    };
    results.forEach(function (value) {
      var it = value.item;
      var div = document.createElement("div");
      div.innerHTML = it.summary;
      var summary = (div.textContent || div.innerText || "").trim();
      if (summary.length > 70) summary = summary.slice(0, 70) + "…";
      var link = it.externalUrl
        ? 'target="_blank" rel="noopener" href="' + esc(it.externalUrl) + '"'
        : 'href="' + esc(it.permalink) + '"';
      resultsHTML +=
        '<li><a class="qj-q-item" ' + link + ' tabindex="0">' +
        '<span class="qj-q-t">' + hl(it.title) + "</span>" +
        '<span class="qj-q-m">' + esc(it.section) + (it.date ? " · " + esc(it.date) : "") + "</span>" +
        (summary ? '<span class="qj-q-s">' + hl(summary) + "</span>" : "") +
        "</a></li>";
    });
    hasResults = true;
  } else {
    resultsHTML =
      '<li class="qj-q-none">未寻得与「' + esc(term) +
      '」相关的文字，换个字试试，或去<a href="/posts/">万法归一</a>翻翻。按回车可到寻物页细找。</li>';
    hasResults = false;
  }

  output.innerHTML = resultsHTML;
  if (hasResults) {
    first = output.firstChild.firstElementChild;
    last = output.lastChild.firstElementChild;
  }
}
