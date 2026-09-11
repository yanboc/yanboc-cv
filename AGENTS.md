# Agent guide

本文件是 agent 在本仓库工作的地图。读完 `README.md` 与 `INSTALL.md` 后阅读。它说明各文件在哪、改哪里的优先级、怎么编译验证、有哪些红线。它不取代 `skills/yanboc-cv/SKILL.md` 里的「怎么写简历」规则。

## Start here

1. 读 `README.md` —— 用户视角的功能与使用说明。
2. 读 `INSTALL.md` —— 各平台的 skill 安装方式。
3. 读 `skills/yanboc-cv/SKILL.md` —— skill 的正规行为（怎么写简历）。

## Repository map

| 区域 | 位置 | 用途 |
| --- | --- | --- |
| 模板主文件 | `main.tex` | LaTeX 排版与各模块的渲染逻辑，日常使用无需修改 |
| 全局配置 | `config.tex` | 学校/院系、联系方式、模块开关、主题色、字体等 |
| 模块正文 | `includefiles/*.tex` | 8 个模块的内容（个人信息/教育/科研/项目/技能/竞赛/荣誉/其他） |
| 正规 skill | `skills/yanboc-cv/` | skill 的唯一事实来源（SKILL.md + reference/） |
| Cursor 镜像 | `.cursor/skills/yanboc-cv/` | 指向正规 skill 的软链，须与正规 skill 保持同步 |
| 其他平台清单 | `.claude-plugin/`、`plugin.json` | Claude Code 及其他 harness 的插件清单 |
| 图片 / 字体 | `images/`、`fonts/` | 页眉页脚、校徽、头像；第三方字体（`*.ttf` 被 gitignore） |

## Source-of-truth rules

- 改 skill 行为先改 `skills/yanboc-cv/SKILL.md`，再同步 `.cursor/skills/yanboc-cv/` 镜像。
- 改模板本身的命令（`main.tex` 里的 `\add*` 定义、`config.tex` 里的字段）时，同步更新 `skills/yanboc-cv/reference/module-commands.md` 与 `reference/config-reference.md`，避免 skill 文档与模板脱节。
- 清单与版本号跨文件保持一致：`plugin.json` 与 `.claude-plugin/plugin.json` 中的 `name`、`version` 须对齐。
- 只改「需要改」的地方：模板排版（`main.tex` 的样式部分）默认不动；示例中残留的过时链接（如仓库地址）一经发现即修正。

## Verify (编译验证)

编译模板用 XeLaTeX，跑两遍：

```bash
xelatex main.tex
xelatex main.tex
```

- 编译报错时，定位到具体 `includefiles/*.tex` 行，按报错信息修复后再编。
- 缺中文字体时，让 `config.tex` 保持 `useDefaultFont=true`（系统字体），或按 README「自定义字体」安装字体。
- 改完 skill 文档无需跑 LaTeX；只需确认 Markdown 无语法错误、链接指向存在的文件。

## 红线（不要做）

- 不提交 `*.ttf` / `*.otf`（第三方字体约 34MB，已被 `.gitignore` 忽略）与 `example.pdf`。
- 不把模板源码或字体二进制复制进 skill 目录；脚手架靠 clone / 复制仓库存量。
- 说话不夸大：模板默认页眉页脚为图片形式，无法在 `config.tex` 中微调颜色；正文不支持斜体。

## 许可证

本模板采用 MIT License；示例字体 [SweiSpring（狮尾四季春）](https://github.com/max32002/swei-spring) 为 OFL 开源许可，自定义字体须遵守其各自许可。