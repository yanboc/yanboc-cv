# config.tex 字段目录

`config.tex` 是全局配置唯一入口，分四段：个人信息、模块设置、个性化配置、字体设置。下面按段落列出字段、默认值与取值范围。日常填写只需动 `config.tex`，`main.tex` 不改。

## 1. 个人信息

### 学校 / 院系

| 变量 | 说明 | 示例 |
| --- | --- | --- |
| `\schoolNameCH` | 学校中文名 | `武汉大学` |
| `\schoolNameEN` | 学校英文名 | `Wuhan University` |
| `\departmentNameCH` | 院系中文名 | `计算机学院` |
| `\departmentNameEN` | 院系英文名 | `School of Computer Science` |

### 联系方式（开关 + 内容）

| 变量 | 说明 | 默认 |
| --- | --- | --- |
| `\def\needEmail` | 是否显示邮箱 | `true` |
| `\yourEmail` | 邮箱地址 | `yourEmail@example.com` |
| `\def\needPhone` | 是否显示手机号 | `true` |
| `\yourPhone` | 手机号 | `130-6666-0000` |
| `\def\needGithub` | 是否显示 GitHub | `true` |
| `\yourGithub` | GitHub 用户名 | `yanboc` |
| `\def\needWechat` | 是否显示微信 | `true` |
| `\yourWechat` | 微信号 | `yourWechatID` |

改为 `false` 即隐藏对应项。

### 基本信息

| 变量 | 说明 |
| --- | --- |
| `\yourName` | 姓名 |
| `\yourCity` | 家乡/学校 |
| `\yourBirthdate` | 出生年月 |
| `\yourContact` | 联系方式（默认等于 `\yourPhone`） |
| `\yourExpectedGraduationTime` | 预计毕业时间 |
| `\yourResearchInterest` | 研究兴趣 |

更多个人信息的添加/修改在 `includefiles/personal_information.tex` 中进行。

## 2. 模块设置（开关 + 标题 + 图标）

每个模块三件套：`\def\needXxx{true/false}` 开关、`\def\XxxTitle{...}` 标题、`\def\XxxIcon{\fa...}` 图标（Font Awesome 5，图标命令以 `\fa` 开头）。

| 模块 | 开关 | 标题变量 | 默认图标 |
| --- | --- | --- | --- |
| 个人信息 | `\needPersonalInformation` | `\PersonalInformationTitle` | `\faAddressCard` |
| 教育背景 | `\needEducation` | `\EducationTitle` | `\faGraduationCap` |
| 科研成果 | `\needPublication` | `\PublicationTitle` | `\faBook` |
| 项目/实习 | `\needProjects` | `\ProjectsTitle` | `\faTools` |
| 技能特长 | `\needSkills` | `\SkillsTitle` | `\faWrench` |
| 竞赛经历 | `\needCompetitions` | `\CompetitionsTitle` | `\faTrophy` |
| 所获荣誉 | `\needHonors` | `\HonorsTitle` | `\faCertificate` |
| 其他 | `\needOthers` | `\OthersTitle` | `\faInfo` |

不需要某模块时，把对应 `\def\needXxx{true}` 改为 `false` 即可。

个人信息模块附带头像子开关：

| 变量 | 说明 | 默认 |
| --- | --- | --- |
| `\def\needAvatar` | 是否显示头像 | `false` |
| `\def\AvatarWidth` | 头像宽度（与个人信息宽度之和 < 0.95） | `0.13` |
| `\def\PersonalInformationWidth` | 个人信息宽度 | `0.80` |
| `\def\AvatarImage` | 头像图片路径 | `images/avatar.png` |

## 3. 个性化配置

### 页眉 / 校徽 / 主题色

| 变量 | 说明 | 默认 |
| --- | --- | --- |
| `\def\useDefaultTheme` | 使用默认主题（含带纹路图片页眉页脚） | `true` |
| `\def\useSchoolLogo` | 页眉使用校徽 | `true` |
| `\def\useSchoolName` | 页眉显示校名（仅 `useSchoolLogo=false` 生效） | `false` |
| `\def\schoolLogo` | 校徽+校名图片路径 | `images/school_logo.png` |
| `\def\schoolLogoWidth` | 校徽占行宽比例（4 字约 0.15，6 字约 0.2） | `0.15` |
| `\def\themeColor` | 主题色（须已用 `\definecolor` 定义） | `WHU_Blue` |

预定义主题色：

```tex
\definecolor{WHU_Green}{HTML}{115740}
\definecolor{WHU_Blue}{HTML}{002554}
\definecolor{PKU_Red}{HTML}{94070A}
```

- 默认主题（`useDefaultTheme=true`）下页眉页脚为图片，**无法在 config 改色**；要保持 `\themeColor=WHU_Blue`。
- 想要纯色/可改色：`\def\useDefaultTheme{false}`，再设 `\themeColor`。

### 水印

| 变量 | 说明 | 默认 |
| --- | --- | --- |
| `\def\needWatermark` | 是否显示水印 | `false` |
| `\def\watermarkOpacity` | 透明度 0–1 | `0.03` |
| `\def\watermarkImage` | 水印图片路径 | `images/school_watermark.png` |
| `\def\watermarkSize` | 水印大小 0–1 | `0.9` |

## 4. 字体设置

| 变量 | 说明 | 默认 |
| --- | --- | --- |
| `\def\useDefaultFont` | 使用系统默认字体 | `false` |
| `\def\fontPath` | 字体文件路径 | `fonts/` |
| `\def\customFontFamilyCH` | 中文字体族名（对应文件名） | `SweiSpring` |
| `\def\fontFileTypeCH` | 中文字体扩展名 `.ttf`/`.otf` | `.ttf` |
| `\def\fontBoldFontCH` | 中文粗体后缀 | `* Bold` |
| `\def\customFontFamilyEN` | 英文字体族名 | `\customFontFamilyCH` |
| `\def\fontFileTypeEN` | 英文字体扩展名 | `\fontFileTypeCH` |
| `\def\fontBoldFontEN` | 英文粗体后缀 | `\fontBoldFontCH` |

- 用系统字体：`\def\useDefaultFont{true}`（最省事，不会因缺字体编译失败）。
- 用自定义字体：`\def\useDefaultFont{false}`，并把字体文件按 `fonts/家庭名.ttf`、`fonts/家庭名 Bold.ttf` 命名放入 `fonts/`（SweiSpring 需下载，OFL 许可）。
- 建议中英文用统一字体。