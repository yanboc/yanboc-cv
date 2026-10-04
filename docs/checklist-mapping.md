# 信息清单 → HTML 模板映射

Agent 在用户确认 `cv-info.md` 后，按本表写入 `web/cv-config.json` 与 `web/index.html`。命令级 HTML 见 [module-commands.md](module-commands.md)；config 字段见 [config-reference.md](config-reference.md)。

## 空值规则

| 用户写法 | 处理 |
| --- | --- |
| 字段留空 | 不写该项；联系方式类则对应 `needXxx: false` |
| 写「无」「不需要」「-」 | 同留空 |
| 某一大节下所有条目均空 | 不输出该 `data-module` 区块 |
| 大节有至少一条有效内容 | 输出对应模块 HTML |
| 姓名 / 学校中文名仍空 | **停止写入**，提示补全；不要编造 |

## 文件落盘

1. 复制清单为项目根 **`cv-info.md`**（已存在则复用）。
2. 用户确认后：先更新 `web/cv-config.json`，再写 `web/index.html` 页体。
3. 每个 `<section class="page">` 必须含页眉、`.page-body`、页脚（可从示例页复制）。
4. 保留 `cv-info.md`；用户改 MD 并说「同步」时重跑本映射。

## 基本信息 / 联系方式 / 外观 → `web/cv-config.json`

| 清单字段 | JSON 键 |
| --- | --- |
| 姓名 | `name` |
| 阶段 | `academicStage`（博士 / 硕士 / 本科；空=不声明） |
| 用途 | `cvPurpose`（学术 / 求职；空=不声明） |
| 版本日期 | `cvDate`（`YYYY.MM.DD`；空则预览用当天） |
| 城市 | `city` |
| 出生年月 | `birthdate` |
| 预计毕业时间 | `expectedGraduation` |
| 研究兴趣 | `researchInterest` |
| 联系方式展示用 | `contact`（空则用 `phone`） |
| 邮箱 / 微信 / 手机 | 写入 `email` `wechat` `phone`，并放进 `footerItems`（默认这三项） |
| GitHub / 主页等 | 写入对应键，并把类型追加进 `footerItems`；不要手绘图标 |
| 学校中文名 | `schoolNameCH`；选预设校徽时一并写入 |
| 学院 / 专业 | 写在教育背景最高学历条目；页眉右侧自动同步。不要再填院系英文来当页眉 |
| 页眉校徽 | `schoolLogoId`：`whu` 武大 / `hust` 华科 / `wut` 武理 / `upload` 上传 / `none` 不展示 |
| 是否显示头像 | `needAvatar` |
| 是否显示水印 | `needWatermark` |
| 默认主题页眉页脚 | `useDefaultTheme` |
| 主题色 | `themeColor`（`#RRGGBB`；默认 `#002554`） |
| 字体 | 空或狮尾 → `useDefaultFont: false`；系统字体 → `true` |

页内带 `data-bind="name"` 等的格子由 `web/js/app.js` 在预览时注入，**HTML 里仍应写入与 config 一致的文本**，以便不跑 JS 时也看得到。

文档标题（浏览器标签 + 预览侧栏）由 `name` / `academicStage` / `cvPurpose` / `cvDate` 拼出，写入 `<title>` 与侧栏 `data-doc-title`：

- 用途为学术/求职：**`{姓名}的{阶段}{用途}简历（{日期}）`**，如 `张三的博士求职简历（2026.10.03）`；阶段为空则无阶段二字。
- 阶段与用途皆空：**`{姓名}的简历（{日期}）`**，如 `张三的简历（2026.10.03）`

个人信息表栏目两端对齐到最长栏目名宽度。页眉校徽在侧栏选武大 / 华科 / 武理，或「上传…」「不展示校徽」。

## 模块 → `web/index.html`

按 [module-commands.md](module-commands.md) 的 HTML 骨架，全部写入**第一页** `.page-body`。本地预览由脚本按 A4 自动拆多页；agent 不要手拆。清单「分页：是」仅作用户备忘。

| 清单大节 | `data-module` | 至少何字段非空才生成 |
| --- | --- | --- |
| 教育背景 | `education` | 学校 |
| 科研成果 | `publication` | 标题 |
| 项目与实习 | `projects` | 名称 |
| 技能特长 | `skills` | 内容 |
| 竞赛经历 | `competitions` | 名称 |
| 所获荣誉 | `honors` | 内容 |
| 其他 | `others` | 内容 |

作者中的本人姓名用 `<strong>姓名</strong>`。超链接用 `<a href="https://...">`，导出 PDF 时会保留。

## 写入顺序

1. 校验姓名、学校中文名。
2. 写 `web/cv-config.json`。
3. 写 `web/index.html` 页（清掉示例条目，保留页眉页脚与标记注释）。
4. `python3 scripts/preview.py --no-open` 可人工看；或直接请用户预览微调。
5. 用户要 PDF 时：`node scripts/html2pdf.mjs`，报告 `output/cv.pdf`。

## 增量同步

只改某一节时：只改对应 config 键或 `data-module` 区块。若无法判断差分，先说明将按清单全量覆盖 HTML 页体。
