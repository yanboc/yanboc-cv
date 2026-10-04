const state = {
  config: {},
  index: 0,
  editing: false,
  pages: [],
  viewScale: null,
  lastOuter: { w: window.outerWidth, h: window.outerHeight },
  moduleStash: new Map(),
};

const SCHOOL_LOGOS = [
  { id: "whu", label: "武大", name: "武汉大学", nameEN: "Wuhan University", src: "images/logos/whu.png" },
  { id: "hust", label: "华科", name: "华中科技大学", nameEN: "Huazhong University of Science and Technology", src: "images/logos/hust.png" },
  { id: "wut", label: "武理", name: "武汉理工大学", nameEN: "Wuhan University of Technology", src: "images/logos/wut.svg" },
];

const RHYTHMS = {
  A: { label: "密", line: 1.15, para: "0.55em", block: "1.25em", title: "0.25em" },
  B: { label: "中", line: 1.22, para: "0.75em", block: "1.55em", title: "0.3em" },
  C: { label: "疏", line: 1.3, para: "1em", block: "1.9em", title: "0.35em" },
  D: { label: "对比", line: 1.18, para: "0.6em", block: "2.05em", title: "0.28em" },
  E: { label: "选定", line: 1.3, para: "0.75em", block: "1.55em", title: "0.3em" },
};

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

function escHtml(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatMarks(raw) {
  const text = String(raw ?? "").trim();
  if (!text) return "";
  let s = escHtml(text);
  s = s.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  s = s.replace(/__(.+?)__/g, "<u>$1</u>");
  return s.replace(/\n/g, "<br>");
}

function noteBlock(raw) {
  const html = formatMarks(raw);
  return html ? `<div class="note" data-f="note">${html}</div>` : "";
}

function fieldMarks(root, key) {
  const el = $(`[data-f="${key}"]`, root);
  if (!el) return "";
  const clone = el.cloneNode(true);
  clone.querySelectorAll("strong").forEach((n) => {
    n.replaceWith(document.createTextNode(`**${n.textContent}**`));
  });
  clone.querySelectorAll("u").forEach((n) => {
    n.replaceWith(document.createTextNode(`__${n.textContent}__`));
  });
  const tmp = document.createElement("textarea");
  tmp.innerHTML = clone.innerHTML.replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, "");
  let s = tmp.value.replace(/^综合评价[：:]\s*/, "").trim();
  if (!s || /^在此填写/.test(s)) return "";
  return s;
}

function areaNote(name, value) {
  return `${area("简介（可空）", name, value)}<p class="hud-note">空着则不显示。**加粗**，__下划线__。</p>`;
}

function applyRhythm(id, opts = {}) {
  const key = RHYTHMS[id] ? id : "E";
  const base = RHYTHMS[key];
  const custom = opts.ignoreCustom ? {} : state.config.space || {};
  const line = custom.line ?? base.line;
  const para = custom.para ?? base.para;
  const block = custom.block ?? base.block;
  const title = custom.title ?? base.title;
  const root = document.documentElement;
  root.style.setProperty("--space-line", String(line));
  root.style.setProperty("--space-para", para);
  root.style.setProperty("--space-block", block);
  root.style.setProperty("--space-title", title);
  state.rhythm = key;
  const sel = $("[data-rhythm]");
  if (sel && sel.value !== key) sel.value = key;
  const hint = $("[data-rhythm-hint]");
  if (hint) hint.textContent = `行${line} 段${para} 块${block}`;
}

function overflows(body) {
  return body.scrollHeight - body.clientHeight > 1;
}

const STORE_PAGES = "yanboc-cv-pages-v2";
const STORE_CONFIG = "yanboc-cv-config-v2";

function hasLocalApi() {
  const h = location.hostname;
  return h === "127.0.0.1" || h === "localhost";
}

function isOnlineDemo() {
  const q = new URLSearchParams(location.search);
  if (q.get("demo") === "1") return true;
  if (q.get("demo") === "0") return false;
  return !hasLocalApi();
}

const STORE_AVATAR = "yanboc-cv-avatar";
const STORE_LOGO = "yanboc-cv-logo";
const PERSONAL_DEFAULTS = [
  { label: "姓名", bind: "name" },
  { label: "所在城市", bind: "city" },
  { label: "出生年月", bind: "birthdate" },
  { label: "联系方式", bind: "contact" },
];

function titleIcon(fa, text) {
  return `<h2 class="module-title"><i class="fa-solid ${fa}" aria-hidden="true"></i>${text}</h2>`;
}

function personalHtml() {
  return `<section class="module" data-module="personal">
    ${titleIcon("fa-id-card", "个人信息")}
    <div class="info-wrap">
      <table class="info-table">
        <tr>
          <td class="label"><span data-info-label>姓名</span>:</td><td data-bind="name"></td>
          <td class="label"><span data-info-label>所在城市</span>:</td><td data-bind="city"></td>
        </tr>
        <tr>
          <td class="label"><span data-info-label>出生年月</span>:</td><td data-bind="birthdate"></td>
          <td class="label"><span data-info-label>联系方式</span>:</td><td data-bind="contact"></td>
        </tr>
      </table>
      <div class="avatar is-empty" data-avatar><img alt="证件照"></div>
    </div>
  </section>`;
}

function eduEntry(degree) {
  return `<article class="entry">
    <div class="spread"><div><strong class="lg" data-f="school">学校</strong>，<span data-f="degree">${escHtml(degree)}</span></div><div class="meta" data-f="location">位置</div></div>
    <div class="spread"><div><u data-f="college">学院</u>，专业：<span data-f="major">专业名</span></div><div class="meta" data-f="dates">起止时间</div></div>
  </article>`;
}

function educationHtml(stage) {
  const rows =
    stage === "博士" ? eduEntry("本科") + eduEntry("博士") :
    stage === "硕士" ? eduEntry("本科") + eduEntry("硕士") :
    eduEntry(stage === "本科" ? "本科" : "学位");
  return `<section class="module" data-module="education">${titleIcon("fa-graduation-cap", "教育背景")}${rows}</section>`;
}

function publicationHtml() {
  return `<section class="module" data-module="publication">
    ${titleIcon("fa-book", "科研成果")}
    <article class="entry">
      <div data-f="title">论文标题</div>
      <div class="spread"><div><strong data-f="authors">姓名</strong></div><div><span class="pub-venue" data-f="venue">会议/期刊</span>（<span data-f="status">状态</span>）</div></div>
    </article>
  </section>`;
}

function projectsHtml(kind) {
  const label = kind === "求职" ? "项目或实习名称" : "项目名称";
  return `<section class="module" data-module="projects">
    ${titleIcon("fa-screwdriver-wrench", "项目与实习")}
    <article class="entry">
      <div class="spread"><div><strong class="lg" data-f="name">${escHtml(label)}</strong></div><div class="meta" data-f="kind">类型</div></div>
      <div class="spread"><div><strong data-f="role">角色</strong></div><div class="meta" data-f="dates">起止时间</div></div>
    </article>
  </section>`;
}

function skillsHtml() {
  return `<section class="module skills" data-module="skills">
    ${titleIcon("fa-wrench", "技能特长")}
    <ul>
      <li><strong data-f="label">语言</strong>：<span data-f="value">在此填写</span></li>
      <li><strong data-f="label">工具</strong>：<span data-f="value">在此填写</span></li>
    </ul>
  </section>`;
}

function competitionsHtml() {
  return `<section class="module" data-module="competitions">
    ${titleIcon("fa-trophy", "竞赛经历")}
    <table class="comp-table"><tr><td data-f="name">竞赛名称</td><td data-f="role">角色</td><td data-f="award">奖项</td><td data-f="time">时间</td></tr></table>
  </section>`;
}

function honorsHtml() {
  return `<section class="module" data-module="honors">
    ${titleIcon("fa-certificate", "所获荣誉")}
    <ul class="honors"><li><strong data-f="name">荣誉名称</strong>（<span data-f="year">年份</span>）</li></ul>
  </section>`;
}

function othersHtml() {
  return `<section class="module others" data-module="others">
    ${titleIcon("fa-circle-info", "其他")}
    <ul><li data-f="text">主页 / 可公开说明</li></ul>
  </section>`;
}

function modulesFor(stage, purpose) {
  const s = normalizeStage(stage);
  const p = normalizePurpose(purpose);
  const keys = ["personal", "education"];
  if (p === "学术") {
    keys.push("publication");
    if (s === "本科") keys.push("honors");
    keys.push("others");
  } else if (p === "求职") {
    if (s === "博士" || s === "硕士") keys.push("publication", "projects", "skills");
    else if (s === "本科") keys.push("projects", "competitions", "skills", "honors");
    else keys.push("projects", "skills", "others");
  } else if (s === "博士") keys.push("publication", "others");
  else if (s === "硕士") keys.push("projects", "publication", "others");
  else if (s === "本科") keys.push("skills", "honors", "others");
  else keys.push("projects", "others");
  return keys;
}

function moduleFactory(stage, purpose) {
  const s = normalizeStage(stage);
  const p = normalizePurpose(purpose);
  return {
    personal: personalHtml,
    education: () => educationHtml(s),
    publication: publicationHtml,
    projects: () => projectsHtml(p),
    skills: skillsHtml,
    competitions: competitionsHtml,
    honors: honorsHtml,
    others: othersHtml,
  };
}

function renderModules(stage, purpose) {
  const map = moduleFactory(stage, purpose);
  return modulesFor(stage, purpose)
    .map((k) => map[k]())
    .join("");
}

function applyPreset(stage, purpose) {
  state.config.academicStage = stage || "";
  state.config.cvPurpose = purpose || "";
  state.config.needAvatar = true;
  const keys = modulesFor(stage, purpose);
  const keep = new Map();
  collectModules().forEach((mod) => {
    const k = mod.dataset.module;
    if (k && !keep.has(k)) keep.set(k, mod);
  });
  keep.forEach((mod, k) => {
    if (!keys.includes(k)) state.moduleStash.set(k, mod.outerHTML);
  });
  const factory = moduleFactory(stage, purpose);
  const html = keys
    .map((k) => {
      if (keep.has(k)) return keep.get(k).outerHTML;
      if (state.moduleStash.has(k)) return state.moduleStash.get(k);
      return factory[k]();
    })
    .join("");
  $$(".page").forEach((page, i) => {
    const body = $(".page-body", page);
    if (body) body.innerHTML = i === 0 ? html : "";
  });
  applyConfig();
  refreshAvatarUi();
  if (isOnlineDemo()) {
    balancePageGutters();
    refreshPages();
    document.documentElement.dataset.packed = "1";
  } else {
    packPages();
  }
  refreshFillNav();
  if (state.fillKey) openFill(state.fillKey);
}

function refreshAvatarUi() {
  const src = state.config.avatarImage || "";
  const ok = src.startsWith("data:") || (src && !src.endsWith("avatar.png"));
  $$("[data-avatar]").forEach((wrap) => {
    wrap.hidden = !state.config.needAvatar;
    wrap.classList.toggle("is-empty", !ok);
    const img = $("img", wrap);
    if (img && ok) img.src = src;
  });
}

function bindAvatar() {
  const input = $("#avatar-file");
  if (!input || input.dataset.bound) return;
  input.dataset.bound = "1";
  document.addEventListener("click", (e) => {
    const wrap = e.target.closest("[data-avatar]");
    if (!wrap) return;
    e.preventDefault();
    e.stopPropagation();
    input.click();
  });
  input.addEventListener("change", () => {
    const file = input.files && input.files[0];
    input.value = "";
    if (!file) return;
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const max = 480;
      const scale = Math.min(1, max / img.width, max / img.height);
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(img.width * scale));
      canvas.height = Math.max(1, Math.round(img.height * scale));
      canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      const data = canvas.toDataURL("image/jpeg", 0.86);
      state.config.needAvatar = true;
      state.config.avatarImage = data;
      try {
        localStorage.setItem(STORE_AVATAR, data);
      } catch (err) {
        console.warn(err);
      }
      refreshAvatarUi();
      flash("证件照已更新（仅保存在本机浏览器）");
    };
    img.src = url;
  });
}

function bindLogo() {
  const input = $("#logo-file");
  if (!input || input.dataset.bound) return;
  input.dataset.bound = "1";
  input.addEventListener("change", () => {
    const file = input.files && input.files[0];
    input.value = "";
    if (!file) return;
    const isSvg = /svg/i.test(file.type) || /\.svg$/i.test(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      const data = String(reader.result || "");
      const applyCustom = (src) => {
        state.config.useSchoolLogo = true;
        state.config.useSchoolName = false;
        state.config.schoolLogo = src;
        state.config.schoolLogoId = "upload";
        persistLogo(src);
        applyConfig();
        if (state.fillKey === "header") openFill("header");
      };
      if (isSvg || data.startsWith("data:image/svg")) {
        applyCustom(data);
        flash("校徽已更新（白/透明底 PNG 或 SVG；仅保存在本机浏览器）");
        return;
      }
      const img = new Image();
      img.onload = () => {
        const max = 640;
        const scale = Math.min(1, max / img.width, max / img.height);
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));
        canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
        applyCustom(canvas.toDataURL("image/png"));
        flash("校徽已更新（建议白/透明底；仅保存在本机浏览器）");
      };
      img.src = data;
    };
    reader.readAsDataURL(file);
  });
}

function persistLogo(data) {
  try {
    localStorage.setItem(STORE_LOGO, data);
  } catch (err) {
    console.warn(err);
  }
}

function pagesHtml() {
  const root = $("#pages");
  if (!root) return "";
  const clone = root.cloneNode(true);
  $$(".page", clone).forEach((p) => {
    p.classList.remove("is-active", "is-overflow");
    p.style.transform = "";
    const body = $(".page-body", p);
    if (body) {
      body.classList.remove("is-editing");
      body.removeAttribute("contenteditable");
      body.style.paddingTop = "";
    }
  });
  return clone.innerHTML
    .replace("<!-- CV_PAGES_BEGIN -->", "")
    .replace("<!-- CV_PAGES_END -->", "");
}

function restoreBrowserDraft() {
  if (!isOnlineDemo()) return;
  try {
    const html = localStorage.getItem(STORE_PAGES);
    const cfg = localStorage.getItem(STORE_CONFIG);
    if (cfg) Object.assign(state.config, JSON.parse(cfg));
    const photo = localStorage.getItem(STORE_AVATAR);
    if (photo) state.config.avatarImage = photo;
    const logo = localStorage.getItem(STORE_LOGO);
    if (logo) state.config.schoolLogo = logo;
    if (html) {
      const root = $("#pages");
      if (root) root.innerHTML = html;
    }
  } catch (err) {
    console.warn(err);
  }
}

async function loadConfig() {
  const res = await fetch("cv-config.json", { cache: "no-store" });
  if (!res.ok) throw new Error("无法读取 cv-config.json");
  state.config = await res.json();
}

function pad2(n) {
  return String(n).padStart(2, "0");
}

function formatCvDate(raw) {
  const text = String(raw || "").trim();
  const m = text.match(/(\d{4})\D+(\d{1,2})\D+(\d{1,2})/);
  if (m) return `${m[1]}.${pad2(m[2])}.${pad2(m[3])}`;
  const d = new Date();
  return `${d.getFullYear()}.${pad2(d.getMonth() + 1)}.${pad2(d.getDate())}`;
}

function normalizeStage(raw) {
  const t = String(raw || "").trim();
  if (!t || t === "无" || t === "不声明") return "";
  if (/博士|直博|PhD/i.test(t)) return "博士";
  if (/硕士|研究生|Master/i.test(t)) return "硕士";
  if (/本科|学士|Bachelor/i.test(t)) return "本科";
  return t;
}

function normalizePurpose(raw) {
  const t = String(raw || "").trim();
  if (!t || t === "-" || t === "无" || /^日常/.test(t)) return "";
  if (/学术|科研|申博|读博|读研/.test(t)) return "学术";
  if (/求职|秋招|春招|实习|校招|工作/.test(t)) return "求职";
  return t;
}

function buildDocTitle(c) {
  const name = String(c.name || "").trim() || "未命名";
  const date = formatCvDate(c.cvDate);
  const purpose = normalizePurpose(c.cvPurpose);
  const stage = normalizeStage(c.academicStage);
  const mid = `${stage}${purpose}`;
  return mid ? `${name}的${mid}简历（${date}）` : `${name}的简历（${date}）`;
}

function applyDocTitle() {
  const title = buildDocTitle(state.config);
  document.title = title;
  const brand = $("[data-doc-title]");
  if (brand) brand.textContent = title;
}

function applyConfig() {
  const c = state.config;
  const params = new URLSearchParams(location.search);
  applyRhythm(state.rhythm || params.get("rhythm") || c.rhythm || "E");
  applyDocTitle();
  document.documentElement.style.setProperty("--theme", c.themeColor || "#002554");
  document.documentElement.style.setProperty(
    "--watermark-opacity",
    String(c.watermarkOpacity ?? 0.03)
  );
  document.body.classList.toggle("use-system-font", !!c.useDefaultFont);

  $$(".page").forEach((page) => {
    page.classList.toggle("theme-image", c.useDefaultTheme !== false);
    page.classList.toggle("has-watermark", !!c.needWatermark);
    const logo = $("[data-logo]", page);
    const name = $("[data-school-name]", page);
    if (logo) {
      logo.hidden = !c.useSchoolLogo;
      if (c.useSchoolLogo && c.schoolLogo) logo.src = c.schoolLogo;
      else logo.removeAttribute("src");
    }
    if (name) name.hidden = true;
    const mark = $("[data-watermark]", page);
    if (mark && c.watermarkImage) mark.src = c.watermarkImage;
  });
  syncHeaderDept();
  applyFooter();

  $$("[data-bind]").forEach((el) => {
    const key = el.getAttribute("data-bind");
    if (key && c[key] != null && c[key] !== "") el.textContent = c[key];
  });

  $$("[data-avatar]").forEach((wrap) => {
    wrap.hidden = !c.needAvatar;
  });
  refreshAvatarUi();
  syncInfoLabelWidth();
}

function absUrl(value) {
  const t = String(value || "").trim();
  if (!t) return "";
  if (/^https?:\/\//i.test(t)) return t;
  return `https://${t.replace(/^\/+/, "")}`;
}

function githubHref(value) {
  const t = String(value || "")
    .trim()
    .replace(/^@/, "");
  if (!t) return "";
  if (/^https?:\/\//i.test(t)) return t;
  if (/github\.com\//i.test(t)) return absUrl(t);
  return `https://github.com/${t.replace(/^\/+/, "")}`;
}

function linkedinHref(value) {
  const t = String(value || "").trim();
  if (!t) return "";
  if (/^https?:\/\//i.test(t) || /linkedin\.com/i.test(t)) return absUrl(t);
  return `https://www.linkedin.com/in/${t.replace(/^\/+/, "")}`;
}

function orcidHref(value) {
  const t = String(value || "").trim();
  if (!t) return "";
  if (/^https?:\/\//i.test(t)) return t;
  return `https://orcid.org/${t.replace(/^(orcid\.org\/)/i, "")}`;
}

const FOOTER_CATALOG = {
  email: {
    label: "邮箱",
    icon: "fa-solid fa-envelope",
    flag: "needEmail",
    href: (v) => `mailto:${v}`,
  },
  wechat: { label: "微信", icon: "fa-brands fa-weixin", flag: "needWechat" },
  phone: {
    label: "手机",
    icon: "fa-solid fa-phone",
    flag: "needPhone",
    href: (v) => `tel:${v}`,
  },
  github: {
    label: "GitHub",
    icon: "fa-brands fa-github",
    flag: "needGithub",
    href: githubHref,
    placeholder: "用户名或链接",
  },
  homepage: {
    label: "主页",
    icon: "fa-solid fa-globe",
    href: absUrl,
    placeholder: "https://",
  },
  linkedin: {
    label: "LinkedIn",
    icon: "fa-brands fa-linkedin",
    href: linkedinHref,
    placeholder: "用户名或链接",
  },
  orcid: {
    label: "ORCID",
    icon: "fa-brands fa-orcid",
    href: orcidHref,
    placeholder: "0000-0000-0000-0000",
  },
  scholar: {
    label: "Google Scholar",
    icon: "fa-solid fa-graduation-cap",
    href: absUrl,
    placeholder: "主页链接",
  },
  qq: { label: "QQ", icon: "fa-brands fa-qq" },
  bilibili: {
    label: "哔哩哔哩",
    icon: "fa-brands fa-bilibili",
    href: absUrl,
    placeholder: "主页链接",
  },
  twitter: {
    label: "X",
    icon: "fa-brands fa-x-twitter",
    href: absUrl,
    placeholder: "链接",
  },
};

const DEFAULT_FOOTER_ITEMS = ["email", "wechat", "phone"];

function getFooterItems() {
  const c = state.config;
  if (Array.isArray(c.footerItems)) {
    return c.footerItems.filter((t) => FOOTER_CATALOG[t]);
  }
  const out = [];
  for (const type of Object.keys(FOOTER_CATALOG)) {
    const flag = FOOTER_CATALOG[type].flag;
    if ((flag && c[flag]) || String(c[type] || "").trim()) out.push(type);
  }
  return out.length ? out : DEFAULT_FOOTER_ITEMS.slice();
}

function footerItemHtml(type, value) {
  const spec = FOOTER_CATALOG[type];
  if (!spec) return "";
  const val = String(value || "").trim();
  const off = val ? "" : " is-off";
  const href = spec.href && val ? spec.href(val) : "";
  const icon = `<i class="${spec.icon}" aria-hidden="true"></i>`;
  const text = `<span data-contact-text>${escHtml(val)}</span>`;
  const inner = href ? `${icon}<a href="${escHtml(href)}">${text}</a>` : `${icon}${text}`;
  return `<span class="item${off}" data-contact="${type}">${inner}</span>`;
}

function applyFooter() {
  const items = getFooterItems();
  state.config.footerItems = items;
  $$(".page-footer").forEach((footer) => {
    footer.innerHTML = items.map((type) => footerItemHtml(type, state.config[type] || "")).join("");
  });
}

const DEGREE_RANK = { 博士: 4, 硕士: 3, 本科: 2, 专科: 1, 学位: 0 };

function highestEduDept() {
  const entries = $$('.module[data-module="education"] .entry');
  let best = null;
  let bestR = -1;
  entries.forEach((el) => {
    const deg = fieldVal(el, "degree") || el.textContent || "";
    let r = 0;
    Object.keys(DEGREE_RANK).forEach((name) => {
      if (deg.includes(name) && DEGREE_RANK[name] > r) r = DEGREE_RANK[name];
    });
    if (r >= bestR) {
      bestR = r;
      best = el;
    }
  });
  if (!best) return { college: "", major: "" };
  let college = fieldVal(best, "college");
  let major = fieldVal(best, "major");
  if (!college) college = $("u", best)?.textContent.trim() || "";
  if (!major) {
    const m = (best.textContent || "").match(/专业[：:]\s*([^\s，,]+)/);
    major = m ? m[1] : "";
  }
  return { college, major };
}

function isDeptPlaceholder(value, extras) {
  const t = String(value || "").trim();
  if (!t) return true;
  return extras.includes(t);
}

function displayDept() {
  const found = highestEduDept();
  const college = isDeptPlaceholder(found.college, ["学院"]) ? "" : found.college.trim();
  const major = isDeptPlaceholder(found.major, ["专业名", "专业"]) ? "" : found.major.trim();
  return { college, major };
}

function syncHeaderDept() {
  const { college, major } = displayDept();
  if (college) state.config.departmentNameCH = college;
  state.config.headerMajor = major;
  const line = [college, major].filter(Boolean).join(" | ");
  $$("[data-dept]").forEach((el) => {
    el.textContent = line;
  });
}

function collectModules() {
  const list = [];
  const byKey = new Map();
  $$(".page-body .module").forEach((mod) => {
    const key = mod.dataset.module;
    const entries = [...mod.querySelectorAll(":scope > .entry")];
    if (key && entries.length && byKey.has(key)) {
      const prev = byKey.get(key);
      entries.forEach((e) => prev.appendChild(e.cloneNode(true)));
      return;
    }
    const clone = mod.cloneNode(true);
    clone.classList.remove("is-continued");
    list.push(clone);
    if (key && entries.length) byKey.set(key, clone);
  });
  return list;
}

function makeBlankPage(template) {
  const page = template.cloneNode(true);
  page.classList.remove("is-active", "is-overflow");
  page.removeAttribute("style");
  const body = $(".page-body", page);
  body.innerHTML = "";
  body.classList.remove("is-editing");
  body.removeAttribute("contenteditable");
  body.style.paddingTop = "";
  return page;
}

function fillOnePage(page, queue) {
  const body = $(".page-body", page);
  while (queue.length) {
    const mod = queue[0];
    body.appendChild(mod);
    if (!overflows(body)) {
      queue.shift();
      continue;
    }
    body.removeChild(mod);
    const entries = [...mod.querySelectorAll(":scope > .entry")];
    if (entries.length <= 1) {
      if (!body.children.length) {
        body.appendChild(mod);
        queue.shift();
      }
      return;
    }
    const shell = mod.cloneNode(false);
    shell.className = mod.className;
    if (mod.dataset.module) shell.dataset.module = mod.dataset.module;
    const title = mod.querySelector(":scope > .module-title");
    if (title) shell.appendChild(title.cloneNode(true));
    body.appendChild(shell);
    let placed = 0;
    for (let i = 0; i < entries.length; i++) {
      shell.appendChild(entries[i]);
      if (overflows(body)) {
        shell.removeChild(entries[i]);
        break;
      }
      placed += 1;
    }
    if (placed === 0) {
      body.removeChild(shell);
      if (!body.children.length) {
        shell.appendChild(entries[0]);
        body.appendChild(shell);
        placed = 1;
      } else {
        return;
      }
    }
    const rest = entries.slice(placed);
    if (rest.length) {
      rest.forEach((e) => mod.appendChild(e));
      const leftoverTitle = mod.querySelector(":scope > .module-title");
      if (leftoverTitle) leftoverTitle.remove();
      mod.classList.add("is-continued");
    } else {
      queue.shift();
    }
    return;
  }
}

function balancePageGutters() {
  $$(".page").forEach((page) => {
    const body = $(".page-body", page);
    if (!body) return;
    body.style.paddingTop = "0px";
    const last = body.lastElementChild;
    if (!last) {
      body.style.paddingTop = "";
      return;
    }
    const contentBottom = last.offsetTop + last.offsetHeight;
    const leftover = body.clientHeight - contentBottom;
    if (leftover < 8 || leftover / body.clientHeight > 0.22) {
      body.style.paddingTop = "";
      return;
    }
    body.style.paddingTop = `${Math.floor(leftover / 2)}px`;
  });
}

function packPages() {
  if (state.editing) return;
  if (isOnlineDemo()) {
    applyConfig();
    balancePageGutters();
    refreshPages();
    document.documentElement.dataset.packed = "1";
    refreshFillNav();
    return;
  }
  const pages = $$(".page");
  if (!pages.length) return;
  document.documentElement.dataset.packed = "0";
  const template = pages[0].cloneNode(true);
  const queue = collectModules();
  const root = $("#pages");
  document.body.classList.add("cv-packing");
  root.innerHTML = "";
  let guard = 0;
  while (queue.length && guard < 40) {
    guard += 1;
    const page = makeBlankPage(template);
    root.appendChild(page);
    const before = queue.length;
    fillOnePage(page, queue);
    if (!$(".page-body", page).children.length) {
      page.remove();
      break;
    }
    if (queue.length === before) break;
  }
  if (!root.querySelector(".page")) root.appendChild(makeBlankPage(template));
  applyConfig();
  balancePageGutters();
  document.body.classList.remove("cv-packing");
  refreshPages();
  document.documentElement.dataset.packed = "1";
  refreshFillNav();
}

function refreshPages() {
  state.pages = $$(".page");
  if (!state.pages.length) return;
  state.index = Math.min(state.index, state.pages.length - 1);
  show(state.index);
}

function show(i) {
  state.index = (i + state.pages.length) % state.pages.length;
  state.pages.forEach((p, idx) => p.classList.toggle("is-active", idx === state.index));
  const label = $("[data-page-label]");
  if (label) label.textContent = `${state.index + 1} / ${state.pages.length}`;
  $("[data-prev]")?.toggleAttribute("disabled", state.pages.length < 2);
  $("[data-next]")?.toggleAttribute("disabled", state.pages.length < 2);
  fit();
  checkOverflow();
}

function fitScale() {
  const page = $(".page.is-active");
  const deck = $(".deck");
  if (!page || !deck) return 1;
  const pad = 32;
  const sx = (deck.clientWidth - pad) / page.offsetWidth;
  const sy = (deck.clientHeight - pad) / page.offsetHeight;
  return Math.max(0.2, Math.min(sx, sy, 1.6));
}

function fit() {
  const page = $(".page.is-active");
  const holder = $("#pages");
  if (!page || document.body.classList.contains("print-mode")) return;
  const s = state.viewScale ?? fitScale();
  page.style.transformOrigin = "top left";
  page.style.transform = `scale(${s})`;
  if (holder) {
    holder.style.width = `${Math.round(page.offsetWidth * s)}px`;
    holder.style.height = `${Math.round(page.offsetHeight * s)}px`;
  }
  const label = $("[data-zoom-label]");
  if (label) label.textContent = state.viewScale == null ? "适应" : `${Math.round(s * 100)}%`;
}

function bumpZoom(delta) {
  const base = state.viewScale ?? fitScale();
  state.viewScale = Math.max(0.25, Math.min(2.4, +(base + delta).toFixed(2)));
  fit();
}

function onWindowResize() {
  const outerChanged =
    window.outerWidth !== state.lastOuter.w || window.outerHeight !== state.lastOuter.h;
  state.lastOuter = { w: window.outerWidth, h: window.outerHeight };
  if (!outerChanged) return;
  if (state.viewScale == null) fit();
}

function checkOverflow() {
  let bad = false;
  state.pages.forEach((page) => {
    const body = $(".page-body", page);
    if (!body) return;
    const overflow = body.scrollHeight - body.clientHeight > 2;
    page.classList.toggle("is-overflow", overflow);
    if (overflow && page.classList.contains("is-active")) bad = true;
  });
  $("[data-overflow]")?.classList.toggle("is-on", bad);
}

function setEditing(on) {
  if (state.editing && !on) {
    state.editing = false;
    $$(".page-body").forEach((el) => {
      el.contentEditable = "false";
      el.classList.remove("is-editing");
    });
    packPages();
    $("[data-edit]").textContent = "编辑正文";
    return;
  }
  state.editing = on;
  document.body.classList.toggle("is-editing", on);
  $$(".page-body").forEach((el) => {
    el.contentEditable = on ? "true" : "false";
    el.classList.toggle("is-editing", on);
    el.spellcheck = false;
  });
  $("[data-edit]").textContent = on ? "退出编辑" : "编辑正文";
}

async function savePages() {
  const html = pagesHtml();
  if (isOnlineDemo()) {
    try {
      localStorage.setItem(STORE_PAGES, html);
      localStorage.setItem(STORE_CONFIG, JSON.stringify(state.config));
      flash("已保存在用户浏览器（刷新仍在）");
    } catch (err) {
      alert("浏览器保存失败：" + err);
    }
    return;
  }
  const res = await fetch("/api/save-pages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ html }),
  });
  if (!res.ok) {
    alert("保存失败：" + (await res.text()));
    return;
  }
  flash("已写回 web/index.html");
}

function downloadHtml() {
  const blob = new Blob([pagesHtml()], { type: "text/html;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${buildDocTitle(state.config)}.html`;
  a.click();
  URL.revokeObjectURL(a.href);
  flash("已下载页体 HTML");
}

function flash(msg) {
  const el = $("[data-status]");
  if (!el) return;
  el.textContent = msg;
  setTimeout(() => {
    if (el.textContent === msg) el.textContent = "";
  }, 2000);
}

function onKey(e) {
  if (e.target.closest("input, textarea, select, [contenteditable='true']")) {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
      e.preventDefault();
      savePages();
    }
    return;
  }
  if ((e.metaKey || e.ctrlKey) && (e.key === "+" || e.key === "=" || e.key === "-")) {
    e.preventDefault();
    bumpZoom(e.key === "-" ? -0.1 : 0.1);
    return;
  }
  if ((e.metaKey || e.ctrlKey) && e.key === "0") {
    e.preventDefault();
    state.viewScale = null;
    fit();
    return;
  }
  const typing = state.editing && e.target.closest(".page-body");
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
    e.preventDefault();
    savePages();
    return;
  }
  if (typing) return;
  if (e.key === "ArrowRight" || e.key === "PageDown" || e.key === " ") {
    e.preventDefault();
    show(state.index + 1);
  } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
    e.preventDefault();
    show(state.index - 1);
  } else if (e.key.toLowerCase() === "e" && !e.metaKey && !e.ctrlKey) {
    setEditing(!state.editing);
  }
}

function onClickNav(e) {
  if (isOnlineDemo()) return;
  if (state.editing) return;
  if (!e.target.isConnected) return;
  if (e.target.closest(".hud, .module")) return;
  const hud = $(".hud");
  if (hud && e.clientX <= hud.getBoundingClientRect().right) return;
  const deck = $(".deck");
  if (!deck) return;
  const r = deck.getBoundingClientRect();
  const x = (e.clientX - r.left) / r.width;
  if (x < 0.18) show(state.index - 1);
  else if (x > 0.82) show(state.index + 1);
}

const MODULE_LABEL = {
  header: "页眉",
  personal: "个人信息",
  education: "教育背景",
  publication: "科研成果",
  projects: "项目与实习",
  skills: "技能特长",
  competitions: "竞赛经历",
  honors: "所获荣誉",
  others: "其他",
  footer: "页脚",
};

function fieldVal(root, key) {
  return $(`[data-f="${key}"]`, root)?.textContent.trim() || "";
}

function firstMod(key) {
  return $(`.page [data-module="${key}"]`);
}

function moduleKeysOnPaper() {
  const seen = new Set();
  const keys = ["header"];
  $$(".page-body .module[data-module]").forEach((m) => {
    const k = m.dataset.module;
    if (!k || seen.has(k)) return;
    seen.add(k);
    keys.push(k);
  });
  keys.push("footer");
  return keys;
}

function highlightFill(key) {
  $$(".page [data-module]").forEach((m) => m.classList.toggle("is-fill-target", m.dataset.module === key));
  $$("[data-module-nav] .hud-mod").forEach((b) => b.classList.toggle("is-on", b.dataset.key === key));
}

function refitSoon() {
  fit();
  requestAnimationFrame(() => {
    fit();
    requestAnimationFrame(fit);
  });
}

function closeFill() {
  state.fillKey = "";
  const pane = $("[data-fill-pane]");
  if (pane) pane.hidden = true;
  document.body.classList.remove("hud-fill-open");
  highlightFill("");
  refitSoon();
}

function openFill(key) {
  if (!key || !firstMod(key)) {
    closeFill();
    return;
  }
  state.fillKey = key;
  const pane = $("[data-fill-pane]");
  const form = $("[data-fill-form]");
  const title = $("[data-fill-title]");
  if (!pane || !form) return;
  pane.hidden = false;
  document.body.classList.add("hud-fill-open");
  if (title) title.textContent = MODULE_LABEL[key] || key;
  form.innerHTML = renderFillForm(key);
  bindFillForm(form, key);
  highlightFill(key);
  refitSoon();
}

function refreshFillNav() {
  const nav = $("[data-module-nav]");
  if (!nav) return;
  const keys = moduleKeysOnPaper();
  nav.innerHTML = keys
    .map(
      (k) =>
        `<button type="button" class="hud-mod${state.fillKey === k ? " is-on" : ""}" data-key="${k}">${MODULE_LABEL[k] || k}</button>`
    )
    .join("");
  if (state.fillKey && !keys.includes(state.fillKey)) closeFill();
  else if (state.fillKey) highlightFill(state.fillKey);
}

function inp(label, name, value, extra = "") {
  return `<div class="hud-field"><label>${escHtml(label)}</label><input ${extra} data-name="${escHtml(name)}" value="${escHtml(value)}"></div>`;
}

function area(label, name, value) {
  return `<div class="hud-field"><label>${escHtml(label)}</label><textarea data-name="${escHtml(name)}">${escHtml(value)}</textarea></div>`;
}

function renderFillForm(key) {
  if (key === "header") return renderHeaderForm();
  if (key === "footer") return renderFooterForm();
  if (key === "personal") return renderPersonalForm();
  if (key === "education") return renderEduForm();
  if (key === "publication") return renderPubForm();
  if (key === "projects") return renderProjForm();
  if (key === "skills") return renderListForm("label", "value", "类别", "内容", parseSkillItems());
  if (key === "competitions") return renderCompForm();
  if (key === "honors") return renderHonorForm();
  if (key === "others") return renderOthersForm();
  return `<p class="hud-note">这一块还没有侧栏表单。</p>`;
}

function logoChoice() {
  const c = state.config;
  if (!c.useSchoolLogo) return "none";
  if (c.schoolLogoId && SCHOOL_LOGOS.some((s) => s.id === c.schoolLogoId)) return c.schoolLogoId;
  const path = String(c.schoolLogo || "");
  const hit = SCHOOL_LOGOS.find((s) => path === s.src || path.endsWith("/" + s.src));
  if (hit) return hit.id;
  if (/school_logo\.png/i.test(path)) return "whu";
  if (path) return "upload";
  return "none";
}

function applyLogoChoice(value) {
  const c = state.config;
  c.useSchoolName = false;
  if (value === "none") {
    c.useSchoolLogo = false;
    c.schoolLogoId = "none";
    applyConfig();
    return;
  }
  if (value === "upload") {
    c.schoolLogoId = "upload";
    c.useSchoolLogo = !!c.schoolLogo;
    applyConfig();
    $("#logo-file")?.click();
    return;
  }
  const spec = SCHOOL_LOGOS.find((s) => s.id === value);
  if (!spec) return;
  c.useSchoolLogo = true;
  c.schoolLogoId = spec.id;
  c.schoolLogo = spec.src;
  c.schoolNameCH = spec.name;
  c.schoolNameEN = spec.nameEN;
  applyConfig();
}

function renderHeaderForm() {
  const choice = logoChoice();
  const { college, major } = displayDept();
  const sel = (v) => (choice === v ? " selected" : "");
  const presets = SCHOOL_LOGOS.map(
    (s) => `<option value="${s.id}"${sel(s.id)}>${escHtml(s.label)}</option>`
  ).join("");
  return `<div class="hud-field"><label>校徽</label>
      <select data-name="schoolLogoChoice">
        ${presets}
        <option value="upload"${sel("upload")}>上传…</option>
        <option value="none"${sel("none")}>不展示校徽</option>
      </select>
    </div>
    ${choice === "upload" ? `<button type="button" class="hud-wide" data-logo-btn>选择文件（白/透明底 PNG 或 SVG）</button>` : ""}
    <p class="hud-note">右侧「学院 | 专业」自动取最高学历（博士优先于硕士、本科）。请到「教育背景」里改学院和专业。</p>
    <p class="hud-note">${escHtml(college || "学院")} | ${escHtml(major || "专业")}</p>`;
}

function writeHeader(form) {
  const value = form.querySelector('[data-name="schoolLogoChoice"]')?.value || "whu";
  applyLogoChoice(value);
}

function renderFooterForm() {
  const items = getFooterItems();
  const used = new Set(items);
  const rows = items
    .map((type, i) => {
      const spec = FOOTER_CATALOG[type];
      const extra = spec.placeholder ? `placeholder="${escHtml(spec.placeholder)}"` : "";
      return `<div class="hud-entry" data-row="${i}" data-type="${escHtml(type)}">
        <div class="hud-entry-bar"><span><i class="${spec.icon}" aria-hidden="true"></i> ${escHtml(spec.label)}</span><button type="button" data-del="${i}">−</button></div>
        ${inp(spec.label, "v", state.config[type] || "", extra)}
      </div>`;
    })
    .join("");
  const unused = Object.keys(FOOTER_CATALOG).filter((t) => !used.has(t));
  const menu = unused
    .map(
      (t) =>
        `<button type="button" data-add-type="${t}"><i class="${FOOTER_CATALOG[t].icon}" aria-hidden="true"></i> ${escHtml(FOOTER_CATALOG[t].label)}</button>`
    )
    .join("");
  return `${rows || "<p class=\"hud-note\">页脚还没有联系方式。用下面的 ＋ 添加。</p>"}
    <div class="hud-add-wrap">
      <button type="button" class="hud-wide" data-add-menu${unused.length ? "" : " disabled"}>＋ 增加</button>
      <div class="hud-menu" data-footer-menu hidden>${menu}</div>
    </div>`;
}

function writeFooter(form) {
  const c = state.config;
  const items = [];
  $$("[data-row]", form).forEach((row) => {
    const type = row.dataset.type;
    if (!FOOTER_CATALOG[type]) return;
    items.push(type);
    c[type] = $('[data-name="v"]', row)?.value.trim() || "";
  });
  c.footerItems = items;
  c.needEmail = items.includes("email");
  c.needPhone = items.includes("phone");
  c.needGithub = items.includes("github");
  c.needWechat = items.includes("wechat");
  applyConfig();
}

function parsePersonalRows() {
  const mod = firstMod("personal");
  if (!mod) {
    return PERSONAL_DEFAULTS.map((d) => ({
      ...d,
      value: state.config[d.bind] || "",
    }));
  }
  const parsed = $$("td.label", mod).map((lab) => {
    const val = lab.nextElementSibling;
    const bind = val?.getAttribute("data-bind") || "";
    const raw = ($("[data-info-label]", lab)?.textContent || lab.textContent || "")
      .replace(/[:：]/g, "")
      .replace(/　/g, "")
      .trim();
    return { label: raw || "栏目", value: val?.textContent || "", bind };
  }).filter((r) => r.label);
  if (!parsed.length) {
    return PERSONAL_DEFAULTS.map((d) => ({
      ...d,
      value: state.config[d.bind] || "",
    }));
  }
  return parsed.map((r) => {
    if (!r.value && r.bind && state.config[r.bind]) r.value = state.config[r.bind];
    return r;
  });
}

function renderPersonalForm() {
  const rows = parsePersonalRows();
  const fields = rows
    .map(
      (r, i) =>
        `<div class="hud-entry" data-row="${i}">
          <div class="hud-entry-bar">
            <input class="hud-col-title" data-name="l${i}" value="${escHtml(r.label)}" title="点击修改栏目名">
            <button type="button" data-del="${i}">−</button>
          </div>
          <div class="hud-field"><input data-name="v${i}" value="${escHtml(r.value)}" placeholder="${escHtml(r.label)}"></div>
          <input type="hidden" data-name="b${i}" value="${escHtml(r.bind)}">
        </div>`
    )
    .join("");
  return `${fields}<button type="button" class="hud-wide" data-add>＋ 增加栏目</button>
    <button type="button" class="hud-wide" data-avatar-btn>上传证件照</button>
    <p class="hud-note">点栏目名可改名。校徽在侧栏「页眉」里选学校，或上传白/透明底 PNG、SVG。</p>`;
}

function writePersonal(form) {
  const blocks = $$("[data-row]", form);
  const rows = blocks.map((el, i) => ({
    label: $(`[data-name="l${i}"]`, form)?.value.trim() || "栏目",
    value: $(`[data-name="v${i}"]`, form)?.value || "",
    bind: $(`[data-name="b${i}"]`, form)?.value || "",
  }));
  const known = { name: 1, city: 1, birthdate: 1, contact: 1 };
  rows.forEach((r) => {
    if (r.bind && known[r.bind]) state.config[r.bind] = r.value;
  });
  const mod = firstMod("personal");
  if (!mod) return;
  const table = $("table.info-table", mod);
  if (!table) return;
  const cells = rows.map((r) => {
    const bind = r.bind && known[r.bind] ? ` data-bind="${r.bind}"` : "";
    return `<td class="label"><span data-info-label>${escHtml(r.label)}</span>:</td><td${bind}>${escHtml(r.value)}</td>`;
  });
  let html = "";
  for (let i = 0; i < cells.length; i += 2) {
    html += `<tr>${cells[i]}${cells[i + 1] || "<td></td><td></td>"}</tr>`;
  }
  table.innerHTML = html || `<tr><td class="label"><span data-info-label>姓名</span>:</td><td data-bind="name"></td></tr>`;
  syncInfoLabelWidth();
  applyDocTitle();
}

function syncInfoLabelWidth() {
  $$(".info-table").forEach((table) => {
    const n = $$("[data-info-label]", table).reduce(
      (m, el) => Math.max(m, (el.textContent || "").trim().length),
      0
    );
    table.style.setProperty("--info-label-n", String(Math.max(n, 2)));
  });
}

function renderEduForm() {
  const entries = $$('.module[data-module="education"] .entry');
  const list = entries.length ? entries : [];
  const cards = list
    .map((el, i) => {
      const d = {
        school: fieldVal(el, "school") || "学校",
        degree: fieldVal(el, "degree") || "学位",
        location: fieldVal(el, "location") || "",
        college: fieldVal(el, "college") || "",
        major: fieldVal(el, "major") || "",
        dates: fieldVal(el, "dates") || "",
        note: fieldMarks(el, "note"),
      };
      return `<div class="hud-entry" data-row="${i}">
        <div class="hud-entry-bar"><span>第 ${i + 1} 段</span><button type="button" data-del="${i}">−</button></div>
        ${inp("学校", `school${i}`, d.school)}
        ${inp("学历", `degree${i}`, d.degree)}
        ${inp("位置", `location${i}`, d.location)}
        ${inp("学院", `college${i}`, d.college)}
        ${inp("专业", `major${i}`, d.major)}
        ${inp("起止时间", `dates${i}`, d.dates)}
        ${areaNote(`note${i}`, d.note)}
      </div>`;
    })
    .join("");
  return `${cards || "<p class=\"hud-note\">还没有教育条目。</p>"}<button type="button" class="hud-wide" data-add>＋ 增加学历</button>`;
}

function writeEdu(form) {
  const n = $$("[data-row]", form).length;
  const html = Array.from({ length: n }, (_, i) => {
    const school = $(`[data-name="school${i}"]`, form)?.value || "学校";
    const degree = $(`[data-name="degree${i}"]`, form)?.value || "学位";
    const location = $(`[data-name="location${i}"]`, form)?.value || "";
    const college = $(`[data-name="college${i}"]`, form)?.value || "";
    const major = $(`[data-name="major${i}"]`, form)?.value || "";
    const dates = $(`[data-name="dates${i}"]`, form)?.value || "";
    const note = $(`[data-name="note${i}"]`, form)?.value || "";
    return `<article class="entry">
      <div class="spread"><div><strong class="lg" data-f="school">${escHtml(school)}</strong>，<span data-f="degree">${escHtml(degree)}</span></div><div class="meta" data-f="location">${escHtml(location)}</div></div>
      <div class="spread"><div><u data-f="college">${escHtml(college)}</u>，专业：<span data-f="major">${escHtml(major)}</span></div><div class="meta" data-f="dates">${escHtml(dates)}</div></div>
      ${noteBlock(note)}
    </article>`;
  }).join("");
  replaceModuleBody("education", html, titleIcon("fa-graduation-cap", "教育背景"));
}

function renderPubForm() {
  const entries = $$('.module[data-module="publication"] .entry');
  const cards = entries
    .map((el, i) => `<div class="hud-entry" data-row="${i}">
      <div class="hud-entry-bar"><span>第 ${i + 1} 篇</span><button type="button" data-del="${i}">−</button></div>
      ${inp("标题", `title${i}`, fieldVal(el, "title") || el.firstElementChild?.textContent || "")}
      ${inp("作者", `authors${i}`, fieldVal(el, "authors"))}
      ${inp("会议/期刊", `venue${i}`, fieldVal(el, "venue"))}
      ${inp("状态", `status${i}`, fieldVal(el, "status"))}
      ${areaNote(`note${i}`, fieldMarks(el, "note"))}
    </div>`)
    .join("");
  return `${cards}<button type="button" class="hud-wide" data-add>＋ 增加论文</button>`;
}

function writePub(form) {
  const n = $$("[data-row]", form).length;
  const html = Array.from({ length: n }, (_, i) => {
    const title = $(`[data-name="title${i}"]`, form)?.value || "论文标题";
    const authors = $(`[data-name="authors${i}"]`, form)?.value || "";
    const venue = $(`[data-name="venue${i}"]`, form)?.value || "";
    const status = $(`[data-name="status${i}"]`, form)?.value || "";
    const note = $(`[data-name="note${i}"]`, form)?.value || "";
    return `<article class="entry">
      <div data-f="title">${escHtml(title)}</div>
      <div class="spread"><div><strong data-f="authors">${escHtml(authors)}</strong></div><div><span class="pub-venue" data-f="venue">${escHtml(venue)}</span>（<span data-f="status">${escHtml(status)}</span>）</div></div>
      ${noteBlock(note)}
    </article>`;
  }).join("");
  replaceModuleBody("publication", html, titleIcon("fa-book", "科研成果"));
}

function renderProjForm() {
  const entries = $$('.module[data-module="projects"] .entry');
  const cards = entries
    .map((el, i) => `<div class="hud-entry" data-row="${i}">
      <div class="hud-entry-bar"><span>第 ${i + 1} 项</span><button type="button" data-del="${i}">−</button></div>
      ${inp("名称", `name${i}`, fieldVal(el, "name"))}
      ${inp("类型", `kind${i}`, fieldVal(el, "kind"))}
      ${inp("角色", `role${i}`, fieldVal(el, "role"))}
      ${inp("起止时间", `dates${i}`, fieldVal(el, "dates"))}
      ${areaNote(`note${i}`, fieldMarks(el, "note"))}
    </div>`)
    .join("");
  return `${cards}<button type="button" class="hud-wide" data-add>＋ 增加项目</button>`;
}

function writeProj(form) {
  const n = $$("[data-row]", form).length;
  const html = Array.from({ length: n }, (_, i) => `<article class="entry">
    <div class="spread"><div><strong class="lg" data-f="name">${escHtml($(`[data-name="name${i}"]`, form)?.value || "")}</strong></div><div class="meta" data-f="kind">${escHtml($(`[data-name="kind${i}"]`, form)?.value || "")}</div></div>
    <div class="spread"><div><strong data-f="role">${escHtml($(`[data-name="role${i}"]`, form)?.value || "")}</strong></div><div class="meta" data-f="dates">${escHtml($(`[data-name="dates${i}"]`, form)?.value || "")}</div></div>
    ${noteBlock($(`[data-name="note${i}"]`, form)?.value || "")}
  </article>`).join("");
  replaceModuleBody("projects", html, titleIcon("fa-screwdriver-wrench", "项目与实习"));
}

function parseSkillItems() {
  return $$('.module[data-module="skills"] li').map((li) => ({
    label: fieldVal(li, "label") || $("strong", li)?.textContent || "",
    value: fieldVal(li, "value") || (li.textContent.split("：")[1] || "").trim(),
  }));
}

function renderListForm(a, b, la, lb, items) {
  const cards = items
    .map(
      (it, i) => `<div class="hud-entry" data-row="${i}">
      <div class="hud-entry-bar"><span>第 ${i + 1} 条</span><button type="button" data-del="${i}">−</button></div>
      ${inp(la, `${a}${i}`, it.label || it[a] || "")}
      ${area(lb, `${b}${i}`, it.value || it[b] || "")}
    </div>`
    )
    .join("");
  return `${cards}<button type="button" class="hud-wide" data-add>＋ 增加条目</button>`;
}

function writeSkills(form) {
  const n = $$("[data-row]", form).length;
  const items = Array.from({ length: n }, (_, i) => {
    const label = $(`[data-name="label${i}"]`, form)?.value || "";
    const value = $(`[data-name="value${i}"]`, form)?.value || "";
    return `<li><strong data-f="label">${escHtml(label)}</strong>：<span data-f="value">${escHtml(value)}</span></li>`;
  }).join("");
  replaceModuleBody("skills", `<ul>${items}</ul>`, titleIcon("fa-wrench", "技能特长"), "module skills");
}

function renderCompForm() {
  const rows = $$('.module[data-module="competitions"] .comp-table tr');
  const cards = rows
    .map((el, i) => `<div class="hud-entry" data-row="${i}">
      <div class="hud-entry-bar"><span>第 ${i + 1} 条</span><button type="button" data-del="${i}">−</button></div>
      ${inp("竞赛", `name${i}`, fieldVal(el, "name") || el.children[0]?.textContent || "")}
      ${inp("角色", `role${i}`, fieldVal(el, "role") || el.children[1]?.textContent || "")}
      ${inp("奖项", `award${i}`, fieldVal(el, "award") || el.children[2]?.textContent || "")}
      ${inp("时间", `time${i}`, fieldVal(el, "time") || el.children[3]?.textContent || "")}
    </div>`)
    .join("");
  return `${cards}<button type="button" class="hud-wide" data-add>＋ 增加竞赛</button>`;
}

function writeComp(form) {
  const n = $$("[data-row]", form).length;
  const rows = Array.from({ length: n }, (_, i) => `<tr>
    <td data-f="name">${escHtml($(`[data-name="name${i}"]`, form)?.value || "")}</td>
    <td data-f="role">${escHtml($(`[data-name="role${i}"]`, form)?.value || "")}</td>
    <td data-f="award">${escHtml($(`[data-name="award${i}"]`, form)?.value || "")}</td>
    <td data-f="time">${escHtml($(`[data-name="time${i}"]`, form)?.value || "")}</td>
  </tr>`).join("");
  replaceModuleBody("competitions", `<table class="comp-table">${rows}</table>`, titleIcon("fa-trophy", "竞赛经历"));
}

function renderHonorForm() {
  const items = $$('.module[data-module="honors"] li').map((li) => ({
    name: fieldVal(li, "name") || $("strong", li)?.textContent || "",
    year: fieldVal(li, "year") || "",
  }));
  const cards = items
    .map(
      (it, i) => `<div class="hud-entry" data-row="${i}">
      <div class="hud-entry-bar"><span>第 ${i + 1} 条</span><button type="button" data-del="${i}">−</button></div>
      ${inp("荣誉", `name${i}`, it.name)}
      ${inp("年份", `year${i}`, it.year)}
    </div>`
    )
    .join("");
  return `${cards}<button type="button" class="hud-wide" data-add>＋ 增加荣誉</button>`;
}

function writeHonors(form) {
  const n = $$("[data-row]", form).length;
  const items = Array.from({ length: n }, (_, i) => `<li><strong data-f="name">${escHtml($(`[data-name="name${i}"]`, form)?.value || "")}</strong>（<span data-f="year">${escHtml($(`[data-name="year${i}"]`, form)?.value || "")}</span>）</li>`).join("");
  replaceModuleBody("honors", `<ul class="honors">${items}</ul>`, titleIcon("fa-certificate", "所获荣誉"));
}

function renderOthersForm() {
  const items = $$('.module[data-module="others"] li').map((li) => fieldVal(li, "text") || li.textContent.trim());
  const cards = items
    .map(
      (t, i) => `<div class="hud-entry" data-row="${i}">
      <div class="hud-entry-bar"><span>第 ${i + 1} 条</span><button type="button" data-del="${i}">−</button></div>
      ${area("说明", `text${i}`, t)}
    </div>`
    )
    .join("");
  return `${cards}<button type="button" class="hud-wide" data-add>＋ 增加一条</button>`;
}

function writeOthers(form) {
  const n = $$("[data-row]", form).length;
  const items = Array.from({ length: n }, (_, i) => `<li data-f="text">${escHtml($(`[data-name="text${i}"]`, form)?.value || "")}</li>`).join("");
  replaceModuleBody("others", `<ul>${items}</ul>`, titleIcon("fa-circle-info", "其他"), "module others");
}

function replaceModuleBody(key, inner, titleHtml, className) {
  const mods = $$(`.module[data-module="${key}"]`);
  if (!mods.length) return;
  const first = mods[0];
  first.className = className || "module";
  first.dataset.module = key;
  first.innerHTML = titleHtml + inner;
  mods.slice(1).forEach((m) => m.remove());
  applyConfig();
  refreshAvatarUi();
  balancePageGutters();
  refreshPages();
}

function applyFill(key, form) {
  if (key === "header") writeHeader(form);
  else if (key === "footer") writeFooter(form);
  else if (key === "personal") writePersonal(form);
  else if (key === "education") writeEdu(form);
  else if (key === "publication") writePub(form);
  else if (key === "projects") writeProj(form);
  else if (key === "skills") writeSkills(form);
  else if (key === "competitions") writeComp(form);
  else if (key === "honors") writeHonors(form);
  else if (key === "others") writeOthers(form);
  applyDocTitle();
}

function bindFillForm(form, key) {
  if (!form.dataset.bound) {
    form.dataset.bound = "1";
    form.addEventListener("input", (e) => {
      const k = state.fillKey;
      if (!k) return;
      if (e.target.matches(".hud-col-title")) {
        const row = e.target.closest("[data-row]");
        const v = row?.querySelector('[data-name^="v"]');
        if (v) v.placeholder = e.target.value;
      }
      applyFill(k, form);
    });
    form.addEventListener("change", (e) => {
      const k = state.fillKey;
      if (!k) return;
      applyFill(k, form);
      if (e.target.matches('[data-name="schoolLogoChoice"]')) openFill(k);
    });
    form.addEventListener("click", onFillFormClick);
  }
}

function onFillFormClick(e) {
  e.stopPropagation();
  const form = $("[data-fill-form]");
  const key = state.fillKey;
  if (!form || !key) return;
  const add = e.target.closest("[data-add]");
  const del = e.target.closest("[data-del]");
  const av = e.target.closest("[data-avatar-btn]");
  const logoBtn = e.target.closest("[data-logo-btn]");
  const addMenu = e.target.closest("[data-add-menu]");
  const addType = e.target.closest("[data-add-type]");
  if (av) {
    $("#avatar-file")?.click();
    return;
  }
  if (logoBtn) {
    $("#logo-file")?.click();
    return;
  }
  if (addMenu) {
    const menu = form.querySelector("[data-footer-menu]");
    if (menu) menu.hidden = !menu.hidden;
    return;
  }
  if (addType) {
    applyFill(key, form);
    const type = addType.getAttribute("data-add-type");
    const items = getFooterItems();
    if (type && FOOTER_CATALOG[type] && !items.includes(type)) items.push(type);
    state.config.footerItems = items;
    applyConfig();
    openFill(key);
    return;
  }
  if (add) {
    applyFill(key, form);
    if (key === "personal") {
      const table = $("table.info-table", firstMod("personal"));
      if (table) {
        table.insertAdjacentHTML(
          "beforeend",
          `<tr><td class="label"><span data-info-label>新栏目</span>:</td><td></td></tr>`
        );
      }
    } else if (key === "education") {
      firstMod("education")?.insertAdjacentHTML("beforeend", eduEntry("学位"));
    } else if (key === "publication") {
      firstMod("publication")?.insertAdjacentHTML(
        "beforeend",
        `<article class="entry"><div data-f="title">论文标题</div><div class="spread"><div><strong data-f="authors"></strong></div><div><span class="pub-venue" data-f="venue"></span>（<span data-f="status"></span>）</div></div></article>`
      );
    } else if (key === "projects") {
      firstMod("projects")?.insertAdjacentHTML(
        "beforeend",
        `<article class="entry"><div class="spread"><div><strong class="lg" data-f="name">项目名称</strong></div><div class="meta" data-f="kind"></div></div><div class="spread"><div><strong data-f="role"></strong></div><div class="meta" data-f="dates"></div></div></article>`
      );
    } else if (key === "skills") {
      $("ul", firstMod("skills"))?.insertAdjacentHTML(
        "beforeend",
        `<li><strong data-f="label">新技能</strong>：<span data-f="value"></span></li>`
      );
    } else if (key === "competitions") {
      $("table", firstMod("competitions"))?.insertAdjacentHTML(
        "beforeend",
        `<tr><td data-f="name"></td><td data-f="role"></td><td data-f="award"></td><td data-f="time"></td></tr>`
      );
    } else if (key === "honors") {
      $("ul", firstMod("honors"))?.insertAdjacentHTML(
        "beforeend",
        `<li><strong data-f="name">荣誉名称</strong>（<span data-f="year"></span>）</li>`
      );
    } else if (key === "others") {
      $("ul", firstMod("others"))?.insertAdjacentHTML("beforeend", `<li data-f="text"></li>`);
    }
    openFill(key);
    return;
  }
  if (del) {
    const i = Number(del.getAttribute("data-del"));
    const row = form.querySelector(`[data-row="${i}"]`);
    if (row) row.remove();
    $$("[data-row]", form).forEach((el, idx) => el.setAttribute("data-row", String(idx)));
    applyFill(key, form);
    openFill(key);
  }
}

function exportPdf() {
  applyDocTitle();
  window.print();
}

function bindFillUi() {
  $(".hud")?.addEventListener("click", (e) => e.stopPropagation());
  $("[data-module-nav]")?.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-key]");
    if (!btn) return;
    openFill(btn.dataset.key);
  });
  $("[data-fill-close]")?.addEventListener("click", () => closeFill());
  document.addEventListener("click", (e) => {
    if (e.target.closest(".hud")) return;
    if (e.target.closest("[data-avatar]")) return;
    const page = e.target.closest(".page");
    if (!page) return;
    const mod = e.target.closest("[data-module]");
    if (!mod?.dataset.module || !page.contains(mod)) return;
    e.preventDefault();
    openFill(mod.dataset.module);
  });
}

async function main() {
  const params = new URLSearchParams(location.search);
  try {
    await loadConfig();
  } catch (err) {
    console.warn(err);
  }
  restoreBrowserDraft();
  if (isOnlineDemo()) document.body.classList.add("online-demo");
  applyConfig();
  const stageSel = $("[data-stage]");
  const purposeSel = $("[data-purpose]");
  if (stageSel) stageSel.value = state.config.academicStage || "";
  if (purposeSel) {
    state.config.cvPurpose = normalizePurpose(state.config.cvPurpose);
    purposeSel.value = state.config.cvPurpose || "";
  }
  const hint = $("[data-save-hint]");
  if (hint) {
    hint.textContent = isOnlineDemo()
      ? "线上 demo：保存进用户自己的浏览器；打印可另存 PDF。网页仅一页，多页见 README。"
      : "保存会写回 web/index.html";
  }
  bindAvatar();
  bindLogo();
  bindFillUi();
  await document.fonts.ready;
  if (isOnlineDemo() && !localStorage.getItem(STORE_PAGES)) {
    applyPreset(state.config.academicStage || "", state.config.cvPurpose || "");
  } else {
    packPages();
  }
  refreshFillNav();
  if (params.get("edit") === "1") setEditing(true);

  $("[data-prev]")?.addEventListener("click", () => show(state.index - 1));
  $("[data-next]")?.addEventListener("click", () => show(state.index + 1));
  $("[data-edit]")?.addEventListener("click", () => setEditing(!state.editing));
  $("[data-save]")?.addEventListener("click", () => savePages());
  $("[data-download]")?.addEventListener("click", () => downloadHtml());
  $("[data-print]")?.addEventListener("click", () => exportPdf());
  $("[data-stage]")?.addEventListener("change", (e) => {
    applyPreset(e.target.value, $("[data-purpose]")?.value || "");
  });
  $("[data-purpose]")?.addEventListener("change", (e) => {
    applyPreset($("[data-stage]")?.value || "", e.target.value);
  });
  $("[data-zoom-in]")?.addEventListener("click", () => bumpZoom(0.1));
  $("[data-zoom-out]")?.addEventListener("click", () => bumpZoom(-0.1));
  $("[data-zoom-fit]")?.addEventListener("click", () => {
    state.viewScale = null;
    fit();
  });
  $("[data-rhythm]")?.addEventListener("change", (e) => {
    delete state.config.space;
    state.config.rhythm = e.target.value;
    applyRhythm(e.target.value, { ignoreCustom: true });
    packPages();
  });
  $("[data-rhythm-save]")?.addEventListener("click", async () => {
    const payload = { rhythm: state.rhythm || "E" };
    if (isOnlineDemo()) {
      try {
        localStorage.setItem(STORE_CONFIG, JSON.stringify({ ...state.config, ...payload }));
        flash(`已保存在用户浏览器：${state.rhythm}`);
      } catch (err) {
        flash("浏览器保存失败");
      }
      return;
    }
    const res = await fetch("/api/save-config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    flash(res.ok ? `已写入 config：${state.rhythm}` : "写入 config 失败");
  });
  document.addEventListener("keydown", onKey);
  document.addEventListener("click", onClickNav);
  window.addEventListener("resize", onWindowResize);
}

main();
