# cv-config.json 字段目录

路径：`web/cv-config.json`。预览时由 `web/js/app.js` 注入页眉页脚、主题色、联系方式开关。日常填写改这个文件，不要改 `web/css/cv.css`。

## 学校 / 院系

| 键 | 说明 | 示例 |
| --- | --- | --- |
| `schoolNameCH` / `schoolNameEN` | 学校中英文名；选预设校徽时会写入 | `武汉大学` |
| `schoolLogoId` | `whu` / `hust` / `wut` / `upload` / `none` | `whu` |
| `useSchoolLogo` | 是否显示页眉校徽 | true |
| `departmentNameCH` / `headerMajor` | 页眉右侧「学院 \| 专业」，由最高学历教育条目同步 | `计算机学院` |

## 联系方式

| 键 | 说明 | 默认 |
| --- | --- | --- |
| `footerItems` | 页脚条目顺序。默认 `email` `wechat` `phone`。其余用侧栏 ＋ 菜单加入 | `["email","wechat","phone"]` |
| `email` `wechat` `phone` | 默认三项的内容；空则纸面上隐藏该项 | |
| `github` `homepage` `linkedin` `orcid` `scholar` `qq` `bilibili` `twitter` | 可选页脚；图标用 Font Awesome | |
| `needEmail` `needPhone` `needGithub` `needWechat` | 与 `footerItems` 同步，兼容旧清单 | |

内容为空时，页脚隐藏该项。不要让用户在清单里自造图标。

## 基本信息

| 键 | 说明 |
| --- | --- |
| `name` `city` `birthdate` `contact` | 个人信息表 |
| `academicStage` | 阶段：`博士` / `硕士` / `本科`；空=标题不声明 |
| `cvPurpose` | 用途：`学术` / `求职`；空 → 标题不带用途 |
| `cvDate` | 版本日期 `YYYY.MM.DD`；空则预览用当天 |
| `expectedGraduation` `researchInterest` | 清单字段；需要时写进个人信息表自定行或教育描述 |

## 模块开关

`needPersonalInformation` `needAvatar` `needEducation` `needPublication` `needProjects` `needSkills` `needCompetitions` `needHonors` `needOthers`

头像：`avatarImage` 可为空。网页演示点头像框上传证件照（写进用户自己的浏览器，不进 git）。

Agent 写入 HTML 时，开关为 false 的模块不要输出。

## 外观

| 键 | 说明 | 默认 |
| --- | --- | --- |
| `useDefaultTheme` | true = 图片页眉页脚（`images/header.png` `footer.png`），改色几乎无效 | true |
| `schoolLogo` | 校徽路径、预设文件或本机 data URL | `images/logos/whu.png` |
| `needWatermark` `watermarkImage` `watermarkOpacity` | 水印 | false / 0.03 |
| `themeColor` | `#RRGGBB` | `#002554` |
| `useDefaultFont` | true = 系统字体；false = `web/fonts/` 狮尾四季春 | false |
| `fontFamily` | 自定义字体族名（与文件名对应） | `SweiSpring` |
| `rhythm` | 行距预设 `E` 选定 / `A` 密 / `B` 中 / `C` 疏 / `D` 对比 | **`E`**（行 1.30＝C，段 0.75em / 块 1.55em＝B） |
| `space` | 覆盖预设：`{ line, para, block, title }` | 一般不填 |

### 行 / 段 / 块（改间距只动这三项）

| 概念 | 含义 | CSS 变量 | 作用在 |
| --- | --- | --- | --- |
| **行** | 同一条里的行高（学校名与专业那几行） | `--space-line` | `line-height` |
| **段** | 两条目之间（两篇论文、两段教育）；个人信息表的行距也用这个 | `--space-para` | `.entry + .entry`；`[data-module=personal] .info-table` 的纵向 `border-spacing` |
| **块** | 两个模块之间（教育背景 vs 科研成果） | `--space-block` | `.module + .module` |

默认 **E**：`line: 1.3`，`para: 0.75em`，`block: 1.55em`。改法（任一即可）：预览左侧栏下拉；URL `?rhythm=C`；或 `cv-config.json` 的 `rhythm`。点「采用此套」会写回 json。微调数字用 `space`，例如 `"space": { "line": 1.2, "para": "0.7em", "block": "1.6em" }`。

页边：`--edge-gap: 3mm`，`--pad-top/bottom = 页眉或页脚高度 + edge-gap`。自动拆页后脚本把该页正文剩余高度对半分，使正文到页眉、到页脚的空隙大致一样。

预定义色：`#002554`（WHU_Blue）、`#115740`（WHU_Green）、`#94070A`（PKU_Red）。
