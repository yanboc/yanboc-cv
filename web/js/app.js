const state = {
  config: {},
  index: 0,
  editing: false,
  pages: [],
  viewScale: null,
  lastOuter: { w: window.outerWidth, h: window.outerHeight },
};

const RHYTHMS = {
  A: { label: "密", line: 1.15, para: "0.55em", block: "1.25em", title: "0.25em" },
  B: { label: "中", line: 1.22, para: "0.75em", block: "1.55em", title: "0.3em" },
  C: { label: "疏", line: 1.3, para: "1em", block: "1.9em", title: "0.35em" },
  D: { label: "对比", line: 1.18, para: "0.6em", block: "2.05em", title: "0.28em" },
  E: { label: "选定", line: 1.3, para: "0.75em", block: "1.55em", title: "0.3em" },
};

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

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

const STORE_PAGES = "yanboc-cv-pages";
const STORE_CONFIG = "yanboc-cv-config";

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

function titleIcon(fa, text) {
  return `<h2 class="module-title"><i class="fa-solid ${fa}" aria-hidden="true"></i>${text}</h2>`;
}

function personalHtml() {
  return `<section class="module" data-module="personal">
    ${titleIcon("fa-id-card", "个人信息")}
    <div class="info-wrap">
      <table class="info-table">
        <tr>
          <td class="label">姓　　名:</td><td data-bind="name"></td>
          <td class="label">所在城市:</td><td data-bind="city"></td>
        </tr>
        <tr>
          <td class="label">出生年月:</td><td data-bind="birthdate"></td>
          <td class="label">联系方式:</td><td data-bind="contact"></td>
        </tr>
      </table>
      <div class="avatar is-empty" data-avatar><img alt="证件照"></div>
    </div>
  </section>`;
}

function eduEntry(degree) {
  return `<article class="entry">
    <div class="spread"><div><strong class="lg">学校</strong>，${degree}</div><div class="meta">位置</div></div>
    <div class="spread"><div><u>学院</u>，专业：专业名</div><div class="meta">起止时间</div></div>
    <div class="note"><strong>综合评价</strong>：在此填写。</div>
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
      <div>论文标题</div>
      <div class="spread"><div><strong>姓名</strong>, 合作者</div><div><span class="pub-venue">会议/期刊</span>（状态）</div></div>
    </article>
  </section>`;
}

function projectsHtml(kind) {
  const label = kind === "实习" ? "实习项目名称" : "项目或实习名称";
  return `<section class="module" data-module="projects">
    ${titleIcon("fa-screwdriver-wrench", "项目与实习")}
    <article class="entry">
      <div class="spread"><div><strong class="lg">${label}</strong></div><div class="meta">类型</div></div>
      <div class="spread"><div><strong>角色</strong></div><div class="meta">起止时间</div></div>
      <div class="note">在此填写简介（结果尽量可量化）。</div>
    </article>
  </section>`;
}

function skillsHtml() {
  return `<section class="module skills" data-module="skills">
    ${titleIcon("fa-wrench", "技能特长")}
    <ul>
      <li><strong>语言</strong>：在此填写</li>
      <li><strong>工具</strong>：在此填写</li>
    </ul>
  </section>`;
}

function competitionsHtml() {
  return `<section class="module" data-module="competitions">
    ${titleIcon("fa-trophy", "竞赛经历")}
    <table class="comp-table"><tr><td>竞赛名称</td><td>角色</td><td>奖项</td><td>时间</td></tr></table>
  </section>`;
}

function honorsHtml() {
  return `<section class="module" data-module="honors">
    ${titleIcon("fa-certificate", "所获荣誉")}
    <ul class="honors"><li><strong>荣誉名称</strong>（年份）</li></ul>
  </section>`;
}

function othersHtml() {
  return `<section class="module others" data-module="others">
    ${titleIcon("fa-circle-info", "其他")}
    <ul><li>主页 / 可公开说明</li></ul>
  </section>`;
}

function modulesFor(stage, purpose) {
  const s = normalizeStage(stage);
  const p = normalizePurpose(purpose) || "日常";
  const keys = ["personal", "education"];
  if (s === "博士") {
    if (p === "实习") keys.push("projects", "skills", "others");
    else if (p === "日常") keys.push("publication", "others");
    else keys.push("publication", "projects", "skills");
  } else if (s === "硕士") {
    if (p === "实习") keys.push("projects", "skills", "others");
    else if (p === "日常") keys.push("projects", "publication", "others");
    else keys.push("publication", "projects", "skills");
  } else if (s === "本科") {
    if (p === "实习") keys.push("projects", "skills", "others");
    else if (p === "日常") keys.push("skills", "honors", "others");
    else keys.push("projects", "competitions", "skills", "honors");
  } else if (p === "实习") keys.push("projects", "skills", "others");
  else if (p === "日常") keys.push("projects", "others");
  else keys.push("projects", "skills", "honors");
  return keys;
}

function renderModules(stage, purpose) {
  const s = normalizeStage(stage);
  const p = normalizePurpose(purpose) || "日常";
  const map = {
    personal: personalHtml,
    education: () => educationHtml(s),
    publication: publicationHtml,
    projects: () => projectsHtml(p),
    skills: skillsHtml,
    competitions: competitionsHtml,
    honors: honorsHtml,
    others: othersHtml,
  };
  return modulesFor(stage, purpose).map((k) => map[k]()).join("");
}

function applyPreset(stage, purpose) {
  state.config.academicStage = stage || "";
  state.config.cvPurpose = purpose || "日常";
  state.config.needAvatar = true;
  const body = $(".page-body");
  if (body) body.innerHTML = renderModules(stage, purpose);
  applyConfig();
  refreshAvatarUi();
  if (isOnlineDemo()) {
    balancePageGutters();
    refreshPages();
    document.documentElement.dataset.packed = "1";
  } else {
    packPages();
  }
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
  if (!t || t === "无" || /^日常/.test(t)) return "";
  if (/秋招/.test(t)) return "秋招";
  if (/春招/.test(t)) return "春招";
  if (/实习/.test(t)) return "实习";
  if (/校招/.test(t)) return "校招";
  return t;
}

function buildDocTitle(c) {
  const name = String(c.name || "").trim() || "未命名";
  const date = formatCvDate(c.cvDate);
  const purpose = normalizePurpose(c.cvPurpose);
  const stage = purpose ? normalizeStage(c.academicStage) : "";
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
      if (c.schoolLogo) logo.src = c.schoolLogo;
    }
    if (name) {
      name.hidden = !(!c.useSchoolLogo && c.useSchoolName);
      name.textContent = c.schoolNameCH || "";
    }
    const dept = $("[data-dept]", page);
    if (dept) {
      dept.textContent = `${c.departmentNameCH || ""} | ${c.departmentNameEN || ""}`;
    }
    const mark = $("[data-watermark]", page);
    if (mark && c.watermarkImage) mark.src = c.watermarkImage;

    setContact(page, "email", c.needEmail, c.email, `mailto:${c.email}`);
    setContact(page, "phone", c.needPhone, c.phone, null);
    setContact(
      page,
      "github",
      c.needGithub,
      c.github,
      c.github ? `https://github.com/${c.github}` : null
    );
    setContact(page, "wechat", c.needWechat, c.wechat, null);
  });

  $$("[data-bind]").forEach((el) => {
    const key = el.getAttribute("data-bind");
    if (key && c[key] != null && c[key] !== "") el.textContent = c[key];
  });

  $$("[data-avatar]").forEach((wrap) => {
    wrap.hidden = !c.needAvatar;
  });
  refreshAvatarUi();
}

function setContact(page, key, on, text, href) {
  const el = $(`[data-contact="${key}"]`, page);
  if (!el) return;
  el.classList.toggle("is-off", !on || !text);
  const label = $("[data-contact-text]", el) || el.querySelector("a") || el;
  if (href && el.querySelector("a")) {
    const a = el.querySelector("a");
    a.href = href;
    a.textContent = text || "";
  } else if (label) {
    label.textContent = text || "";
  }
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
    body.style.paddingTop = leftover > 4 ? `${Math.floor(leftover / 2)}px` : "";
  });
}

function packPages() {
  if (state.editing) return;
  if (isOnlineDemo()) {
    applyConfig();
    balancePageGutters();
    refreshPages();
    document.documentElement.dataset.packed = "1";
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
  if (e.target.closest(".hud")) return;
  const deck = $(".deck");
  if (!deck) return;
  const r = deck.getBoundingClientRect();
  const x = (e.clientX - r.left) / r.width;
  if (x < 0.18) show(state.index - 1);
  else if (x > 0.82) show(state.index + 1);
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
  if (purposeSel) purposeSel.value = state.config.cvPurpose || "日常";
  const hint = $("[data-save-hint]");
  if (hint) {
    hint.textContent = isOnlineDemo()
      ? "线上 demo：保存进用户自己的浏览器；打印可另存 PDF。网页仅一页，多页见 README。"
      : "保存会写回 web/index.html";
  }
  bindAvatar();
  await document.fonts.ready;
  if (isOnlineDemo() && !localStorage.getItem(STORE_PAGES)) {
    applyPreset(state.config.academicStage || "", state.config.cvPurpose || "日常");
  } else {
    packPages();
  }
  if (params.get("edit") === "1") setEditing(true);

  $("[data-prev]")?.addEventListener("click", () => show(state.index - 1));
  $("[data-next]")?.addEventListener("click", () => show(state.index + 1));
  $("[data-edit]")?.addEventListener("click", () => setEditing(!state.editing));
  $("[data-save]")?.addEventListener("click", () => savePages());
  $("[data-download]")?.addEventListener("click", () => downloadHtml());
  $("[data-print]")?.addEventListener("click", () => window.print());
  $("[data-stage]")?.addEventListener("change", (e) => {
    applyPreset(e.target.value, $("[data-purpose]")?.value || "日常");
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
