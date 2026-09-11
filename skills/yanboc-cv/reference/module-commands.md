# 模块命令参考

8 个模块的正文都写在 `includefiles/` 下对应文件里，统一使用 `\add*` 命令。写内容前先按本表确认命令签名，参数按顺序填写即可。所有命令都由 `main.tex` 定义。

## 个人信息 — `includefiles/personal_information.tex`

文件本体是一个 `tabularx` 表格，每一行四格、两两一组（`标签 & 值 & 标签 & 值`）。全局变量在 `config.tex` 里定义。

```tex
姓 \infoGap 名: & \yourName & 所在城市: & \yourCity  \\
出生年月: & \yourBirthdate & 联系方式: & \yourContact \\
自定标题: & 自定信息 & 注意事项: &  见代码注释
```

- 换行符是 `\\`，**最后一行不要加** `\\`。
- 自定标题尽量用 2 或 4 个字；2 字标题中间加 `\infoGap`（两个空格，用于对齐）。
- 更多标签仿照注释里的示例添加，例如：
  ```tex
  % 政治面貌: & \yourPoliticalStatus & 性 \infoGap 别: & \yourGender \\
  % 毕业年月: & \yourExpectedGraduationTime & 研究兴趣: & \yourResearchInterest \\
  ```

## 教育背景 — `includefiles/education.tex`

```tex
% \addEducation{学校名称}{学位/学历}{学校位置}{学院}{专业}{起止时间}
% \addCourse{主修课程：课程1、课程2、课程3、课程4等。}
% \addEducationDescription{主修课程/GPA/综测（本科）/研究方向/导师（研究生）}
```

```tex
\addEducation{武汉大学}{本科}{湖北，武汉}{弘毅学堂}{数学与应用数学}{2016年9月--2020年6月}
\addCourse{\textbf{主修课程}：高等概率论、泛函分析、拓扑学。}
\addEducationDescription{\textbf{综合评价}：1. \textbf{GPA}: 4.00/4.00，2. \textbf{综测排名}: 1/120。}
```

- 强调用 `\underline{}` 或 `\textbf{}`，**不支持斜体**。
- 某条（如硕士）不需要时整条删掉。
- 可在描述里加 `\faLightbulb` 等 Font Awesome 图标。

## 科研成果 — `includefiles/publication.tex`

```tex
% \addPublication{论文标题}{发表时间}{作者}{会议/期刊}{状态}{备注（等级、奖项等）}
% \addPublicationDescription{论文简介} （可选）
```

```tex
\addPublication{An Example Publication.}{\textbf{Your Name}, Author 1, Your Supervisor.}{Publication 1}{已发表}{}
\addPublicationDescription{这里写文章的主要结论、获奖等。}
```

- 状态示例：已发表 / 已接收 / 在投。
- `\addPublicationDescription` 可选；信息过长时用它手动排版。

## 项目与实习 — `includefiles/projects.tex`

```tex
% \addProject{项目名称}{项目状态、类型}{你在项目中扮演的角色}{项目时间}
% \addProjectDescription{项目简介。}
```

```tex
\addProject{公司名称--部门名称--项目名称}{实习}{职位或项目名称}{2022年1月--2023年1月}
\addProjectDescription{介绍做了什么、掌握了哪些技能。}
```

- 分页用 `\nextPage`（不要用 `\newpage`，会有对齐问题）。
- 可复用 `\addProjectDescription` 分段描述「项目简介 / 相关技能」。

## 技能特长 — `includefiles/skills.tex`

```tex
% \addSkill{技能名称}
```

```tex
\addSkill{\textbf{英语}：无障碍阅读、写作、日常交流（六级578分、托福104分）}
\addSkill{\textbf{编程}：熟练使用
\begin{itemize}
    \item \textbf{深度学习框架}：熟悉 Python + Torch 开发、调试。
    \item \textbf{推理优化}：熟悉量化、caching、调度、PDES 并行等。
\end{itemize}
}
```

- `\addSkill` 的括号内可嵌 `itemize`（无序）或 `enumerate`（有序）列表。

## 竞赛经历 — `includefiles/competitions.tex`

```tex
% \addCompetition{比赛名称}{比赛角色}{比赛成绩}{比赛时间/地点}
```

```tex
\addCompetition{全国大学生数学建模竞赛}{队长}{湖北省一等奖}{2023年9月}
\addCompetition{ACM区域赛}{队员}{铜奖}{2024年9月}
```

- 本模块渲染为表格，参数按「名称 / 角色 / 成绩 / 时间地点」四列对应。

## 所获荣誉 — `includefiles/honor.tex`

```tex
% \addHonor{荣誉名称}
```

```tex
\addHonor{\textbf{乙等优秀学生奖学金}（￥3000, 2023年）}
\addHonor{\textbf{甲等优秀学生奖学金}（￥6000, 2024年）}
```

- 渲染为双栏（`multicols`）无序列表。

## 其他 — `includefiles/others.tex`

```tex
% \addOther{其他名称}
```

```tex
\addOther{\textbf{使用说明}: 参见项目文件夹中的 README.md 文件。}
```

- 括号内同样支持 `itemize` / `enumerate` 环境与 `\href` 链接。