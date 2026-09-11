---
name: yanboc-cv
description: >-
  Build, fill, and format a Chinese academic CV or resume (中文简历) using the
  yanboc LaTeX template. Modular, themeable, low-code `\add*` commands, MIT
  licensed, works for 本科/硕士/博士. Use when the user wants to create, fill,
  update, translate, or compile a CV/resume from this template, or asks about
  how to edit a specific module, theme color, font, or section.
license: MIT
---

# yanboc-cv

用 yanboc 中文简历模板生成、填写、编译简历。模板 repo：<https://github.com/yanboc/yanboc-cv>（MIT）。

## 核心原则

- **三个文件各司其职**：`main.tex` 是排版，日常不改；`config.tex` 放学校信息、联系方式、模块开关、主题色、字体；`includefiles/*.tex` 放 8 个模块的正文。
- **低代码**：正文只用 `\add*` 命令填写，不要手写表格或样式。
- **先读 reference 再动手**：写某个模块前，读对应命令签名（见 [reference/module-commands.md](reference/module-commands.md)）；改 config 前读 [reference/config-reference.md](reference/config-reference.md)。

## 工作流

### 1. 判断模式

检查目标目录是否同时存在 `main.tex`、`config.tex`、`includefiles/`：

- **已存在** → 进入「填写内容」。
- **不存在** → 进入「从零生成」。

### 2. 从零生成（脚手架）

```bash
git clone https://github.com/yanboc/yanboc-cv
```

若 clone 失败，复制本地模板目录作为骨架。然后初始化：

- **用系统字体起步**：把 `config.tex` 里 `\def\useDefaultFont{true}`（否则缺字体会导致编译失败）。
- **清理示例内容**：删掉 `includefiles/*.tex` 里示例条目，只保留注释，等待填入真实信息。
- 字体：模板默认字体是系统字体；示例用的 `SweiSpring*.ttf` 被忽略且属第三方（OFL），用户需要时再按 README「自定义字体」下载。

### 3. 填写内容

把用户口述的信息映射到字段：

- 全局信息 → `config.tex`：学校/院系中英文名、姓名、城市、联系方式等（见 [reference/config-reference.md](reference/config-reference.md)）。
- 模块正文 → `includefiles/*.tex`：用精确的 `\add*` 命令（见 [reference/module-commands.md](reference/module-commands.md)）。
- 不需要的模块：在 `config.tex` 把对应开关 `\def\needXxx{true}` 改为 `false`。
- 填写前先确认用户已有哪些信息，缺失的关键字段（姓名、邮箱、学校）不要编造，留占位或提示用户补。

### 4. 编译验证

```bash
xelatex main.tex
xelatex main.tex   # 两遍，保证版式与引用正确
```

- 也可打成 zip 上传 Overleaf（New Project → Upload Project）。
- 报错时，按日志定位到具体 `includefiles/*.tex` 行修复后再编。

## 注意事项（写内容时必须遵守）

- **分页**：优先精简控制在一页；确需分页用 `\nextPage`（`\newpage` 会有对齐问题）。
- **斜体**：正文暂不支持斜体；强调用 `\textbf` 或 `\underline`。
- **自定标题对齐**：个人信息的自定标题控制在 2 或 4 个字；2 字标题中间加 `\infoGap`（如 `性 \infoGap 别`）以对齐。
- **主题色**：默认深蓝 `#002554`；换色需 `\def\useDefaultTheme{false}` 后再设 `\themeColor`。默认主题页眉页脚是带纹路的图片，无法在 config 改色；关闭后变为纯色条。
- **校徽 / 校名 / 头像 / 水印**：`\useSchoolLogo`（需放 `images/school_logo.png`）、`\useSchoolName`、`\needAvatar`、`\needWatermark` 均在 `config.tex` 切换。
- **字体许可**：示例字体 SweiSpring（狮尾四季春）为 OFL；用其他字体须遵守其各自许可。
- **不加戏**：不确定的 LaTeX 宏不要自创，只使用模板已定义的命令；需要新模块再改 `main.tex` 或提 Issue。

## Additional resources

- [reference/module-commands.md](reference/module-commands.md) —— 8 个模块的 `\add*` 命令签名与示例。
- [reference/config-reference.md](reference/config-reference.md) —— `config.tex` 全字段目录。