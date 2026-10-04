<div align="center">

# 中文简历模板（A4 HTML）

![Language: HTML](https://img.shields.io/badge/Language-HTML-blue) ![Subject: CV/Resume](https://img.shields.io/badge/Subject-CV%2FResume-yellowgreen) ![Author: XHS@吃鱼的虎](https://img.shields.io/badge/Author-XHS%40吃鱼的虎-ff69b4)

**在线试用：** [yanboc.github.io/yanboc-cv](https://yanboc.github.io/yanboc-cv/)。在线固定一页：左侧栏选模块，右边第二层填空，导出 PDF 文件名跟标题。本地 clone 后可按 A4 自动拆多页，见「预览与导出」。

</div>

<p align="center">
<em>
  页眉页脚沿用原来的学术简历版式。预览按 A4 翻页，导出 PDF 为矢量文字并保留超链接。默认字体
  <a href="https://github.com/max32002/swei-spring">狮尾四季春（SweiSpring）</a>
  （OFL，随仓库 `web/fonts/`）。
</em>
</p>

## 目录

- [使用方法](#使用方法)
  - [预览与导出](#预览与导出)
  - [填写内容](#填写内容)
  - [自定义学校信息](#自定义学校信息)
  - [自定义主题色](#自定义主题色)
  - [自定义字体](#自定义字体)
  - [注意事项](#注意事项)
- [版权与字体](#版权与字体)
- [参考资料与致谢](#参考资料与致谢)
- [交给任意 Agent](#交给任意-agent)
- [贡献与联系方式](#贡献与联系方式)

---

## 使用方法

推荐流程：**用户填信息清单 → agent 排进 A4 页 → 用户在浏览器里微调 → 导出 PDF**。

只想先看版式或自己填：打开 [在线演示](https://yanboc.github.io/yanboc-cv/)。点左侧模块（或点纸面上的那一块）会展开第二层侧栏填空；「导出 PDF」走系统打印，默认文件名是标题里的姓名+阶段用途+日期。线上保存写在用户自己的浏览器里。多页必须本地预览（见下）。

### 预览与导出

```bash
python3 scripts/preview.py          # 浏览器预览，左右键翻页；加 --edit 直接进编辑
```

编辑模式（快捷键 **E**）下可改正文，**⌘S / Ctrl+S** 保存回 `web/index.html`。预览控制在**左侧栏**（翻页、缩放、行距）；缩放用侧栏 ± 或 ⌘+/⌘-，不要用浏览器自带缩放。

```bash
npm install
npx playwright install chromium     # 首次
node scripts/html2pdf.mjs           # 输出 output/cv.pdf
```

PDF 使用 Chromium 打印，不是截图：文字保持矢量，`<a href>` 保持可点。每一页 HTML 对应 PDF 的一页 A4。

### 填写内容

- 全局信息、开关、主题：`web/cv-config.json`
- 各页正文：`web/index.html` 中 `<!-- CV_PAGES_BEGIN -->` 与 `<!-- CV_PAGES_END -->` 之间，每个 `<section class="page">` 一页
- 样式：`web/css/cv.css`（一般不用改）
- 页眉页脚图、校徽：`web/images/`

**模块与 `data-module`：**

| 模块 | `data-module` |
|------|----------------|
| 个人信息 | `personal` |
| 教育背景 | `education` |
| 科研成果 | `publication` |
| 项目实习 | `projects` |
| 技能特长 | `skills` |
| 竞赛经历 | `competitions` |
| 所获荣誉 | `honors` |
| 其他 | `others` |

骨架见 [`docs/module-commands.md`](docs/module-commands.md)。不需要某模块时不要写对应区块，并在 `cv-config.json` 把 `needXxx` 设为 `false`。

### 自定义学校信息

在 `web/cv-config.json`：

```json
{
  "schoolLogoId": "whu",
  "schoolLogo": "images/logos/whu.png"
}
```

侧栏「页眉」可选武大 / 华科 / 武理，或「上传…」「不展示校徽」。再加一所学校：在 `web/js/app.js` 的 `SCHOOL_LOGOS` 加一行，并把白/透明底图放到 `web/images/logos/`。页眉右侧「学院 | 专业」跟最高学历走。

### 自定义主题色

默认深蓝 `#002554`。默认主题页眉页脚是**带纹路的图片**，改 `themeColor` 几乎看不见。要纯色条：

```json
{
  "useDefaultTheme": false,
  "themeColor": "#115740"
}
```

### 自定义字体

默认 `"useDefaultFont": false`，使用仓内 `web/fonts/` 的狮尾四季春。改成系统字体：`"useDefaultFont": true`。自行换字体时把 ttf 放到 `web/fonts/` 并改 CSS 里的 `@font-face`。许可见 [SweiSpring](https://github.com/max32002/swei-spring)（OFL）。

### 注意事项

- **分页**：在线演示固定一页，溢出请删减。本地 `python3 scripts/preview.py` 按 A4 自动拆多页，页数不限。
- **斜体**：正文不支持斜体；用加粗或下划线。
- **页眉页脚**：默认款为图片，无法靠改色换纹路。

---

## 版权与字体

1. 本模板采用 **MIT License**；项目中引用的字体请遵守其各自许可证。
2. 示例字体 [狮尾四季春（SweiSpring）](https://github.com/max32002/swei-spring) 为 OFL 开源许可。

---

## 参考资料与致谢

整体结构参考：

1. [北师大中文 CV 模板](https://github.com/LeyuDame/BNUCV)
2. [西北工业大学中文 CV 模板](https://www.overleaf.com/latex/templates/npu-cv/mncqzxhvfzrx)

简历内容与版式可参考 [MIT 生涯规划与职业发展 - 简历样例](https://capd.mit.edu/resources/sample-resumes/)。

---

## 交给任意 Agent

把本仓库 clone 到本地，让任意 coding agent 读 [`AGENTS.md`](AGENTS.md)。流程：agent 给出 `cv-info.md` → 用户填写（空着 = 不需要）→ 回复「确认」→ agent 写入 `web/` → 用户预览微调 → 导出 PDF。不需要再装某个 chat 产品的 skill。

---

## 贡献与联系方式

- 欢迎通过 **Pull Request** 或 **Issues** 提出建议与修改。
- 小红书可搜索 **吃鱼的虎** 联系作者。
