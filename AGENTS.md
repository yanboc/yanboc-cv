# HANDOFF

### 这是什么

**A4 中文简历模板**。AI 原生、纯 HTML、（几乎）所见即所得、支持线上编辑、支持导出 PDF。风格上沿用了原 LaTeX 模板。



任意 agent 把本仓 clone（或下载）到本地，读这一份就能干活。不要再去装某个 chat 产品的 skill / plugin。

约定用法（**本地 clone**）：**用户填空 → agent 把模块全写进第一页 → 用户在预览里改到满意 → 再出 PDF**。本地可多页：拆页交给 `web/js/app.js`，agent 不要手拆。「排进第一页」不是整份简历只能一页。agent 负责别编造、别抢着分页、别把隐私推进 git。好看与否以预览为准，不以 agent 想象的「专业简历」为准。

**在线演示**固定一页（试版式）：[https://yanboc.github.io/yanboc-cv/](https://yanboc.github.io/yanboc-cv/)。线上改动只在用户自己的浏览器里，不写回仓库。多页必须本地预览，见 [README.md](README.md)。

### 去哪找资源

本文件是 **agent 入口**：细节不在这里展开，去对应篇。


| agent 要做的事          | 去哪                                                                    |
| ------------------- | --------------------------------------------------------------------- |
| 给用户填空               | 复制 [docs/info-checklist.md](docs/info-checklist.md) 为仓库根 `cv-info.md` |
| 用户确认后怎么落到文件         | [docs/checklist-mapping.md](docs/checklist-mapping.md)                |
| 模块 HTML 骨架          | [docs/module-commands.md](docs/module-commands.md)                    |
| `cv-config.json` 字段 | [docs/config-reference.md](docs/config-reference.md)                  |
| 用户怎么预览 / 改学校和字体     | [README.md](README.md)                                                |


仓内位置（日常就这几个）：


| 路径                               | 干什么                          |
| -------------------------------- | ---------------------------- |
| `web/index.html`                 | 每个 `.page` 一张 A4             |
| `web/cv-config.json`             | 学校、联系方式、开关、主题、行距             |
| `web/css/cv.css` `web/js/app.js` | 样式和翻页/拆页；用户没要求就别改            |
| `web/images/`                    | 页眉页脚图、校徽、水印                  |
| `web/fonts/`                     | 默认狮尾四季春（OFL，随仓走）             |
| `scripts/preview.py`             | 本地预览，保存写回 HTML               |
| `scripts/html2pdf.mjs`           | Chromium 打印成 `output/cv.pdf` |




### 改动后如何维护

- 改流程：只改本文件。改字段或模块结构：同步 `docs/` 里那四篇，一篇只讲一件事，这里只留链接。
- `web/` 里资源用相对路径，在线演示和本地预览共用同一棵树。
- 不要提交用户填好的 `cv-info.md`、`output/`。
- 不要往仓里塞虚构人物。骨架里的「学校 / 论文标题」是格子，不是范文。
- 不要为了某个 chat 产品再加 skill 目录。文控：公开仓自包含，不链本机路径。



# 流程

动手前 agent 先和用户对齐验收：清单确认了没有、要不要 PDF、预览能否翻页。用户没说的，agent 别自行加戏。

### 原则

- **三个入口**：配置进 json，正文进 HTML 第一页，CSS 默认不动。
- **清单优先**：空 / 删段 / 「无」= 不需要。用户没回复 **「确认」** 之前，agent 不写 HTML、不出 PDF。用户明确说「直接改 HTML」才跳过清单。
- **分页**：在线演示固定一页。本地不限页数——agent 把模块全堆在第一页 `.page-body`，拆页交给 `web/js/app.js`。清单上的「分页：是」只是用户给自己的备忘。
- **图标**：Font Awesome 6，文件在 `web/vendor/fontawesome/`。不要手绘 SVG mask。



### 填空

1. 根目录还没有 `cv-info.md`：agent 从 [docs/info-checklist.md](docs/info-checklist.md) 复制一份；用户已经填过的不要覆盖。
2. 告诉用户：空着的不要；教育 / 论文 / 项目整块可复制；填完回复 **「确认」**。
3. 用户在对话里贴来的内容，agent 可以先写入 `cv-info.md`，仍然要确认再映射。



### 写入

按 [docs/checklist-mapping.md](docs/checklist-mapping.md)。姓名或学校中文名是空的 → agent 停，问用户，不要补一个「张三」。

- 全局 → `web/cv-config.json`
- 模块 → `.page-body`，骨架见 [docs/module-commands.md](docs/module-commands.md)
- 标题：用户声明了阶段和用途（如博士、秋招）写成 `{姓名}的{阶段}{用途}简历（{日期}）`；日常或不声明阶段写成 `{姓名}的简历（{日期}）`。写入 `<title>`，侧栏会跟着变
- 某一整节都空 → 不要输出那个 `data-module`
- 只写第一页。从第二页起页眉页脚由脚本复制。`cv-info.md` 留着，用户以后说「同步」再跑一遍



### 预览

```bash
python3 scripts/preview.py
```

用户用左右键翻页。侧栏管缩放和行距：用侧栏的 ± 或 ⌘+/⌘-，别用浏览器自带缩放（纸会被压小）。⌘0 回到适应窗口。E 编辑，⌘S 写回文件。某页溢出就红框。改完之前不要急着出 PDF。

网页演示只有一页；本地多页拆分见 [README.md](README.md)。

### 导出 PDF

```bash
npm install
npx playwright install chromium   # 首次
node scripts/html2pdf.mjs
```

走 Chromium **打印**，不是截图。页数必须等于 `.page` 的个数；链接必须还能点。

# 排版

可读性第一，其次纸面上的重心和留白要稳。默认行距预设是 **E**：行 `1.30`，段 `0.75em`，块 `1.55em`（含义见 [docs/config-reference.md](docs/config-reference.md)）。个人信息表比较密，行距改走**段**。本地拆页之后把一页里多出来的高度对半分，让正文离页眉、页脚差不多远。

- 纸张就是 A4：`210mm × 297mm`，`@page { size: A4; margin: 0 }`
- 不要斜体；强调用 `<strong>` 或 `<u>`
- 默认页眉页脚是**图片**，改 `themeColor` 几乎看不出纹路变色。要纯色条再关 `useDefaultTheme`
- 默认字体是狮尾四季春（`web/fonts/`，OFL）。用户要系统字体再把 `useDefaultFont` 设为 `true`
- 新模块继续用 `.module` + `.module-title`，别发明第二套布局



# 验收

做完应能同时成立：

```bash
python3 scripts/preview.py --no-open
node scripts/html2pdf.mjs
```

- 预览能开；本地 clone 可以翻页
- `output/cv.pdf` 的页数 = `.page` 个数，字是矢量，链接可点
- 只改了文档：链接没有指到已删的文件



# 许可证

MIT。狮尾四季春 [SweiSpring](https://github.com/max32002/swei-spring) 是 OFL。换字体请遵守它自己的许可。