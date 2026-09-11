# How to install

`yanboc-cv` 是一个 agent skill：把你的 coding agent 变成「会按模板格式填中文简历」的助手。skill 的正规目录是 `skills/yanboc-cv/`，各 harness 挂载方式如下（均只读 `SKILL.md` + `reference/`，不复制模板源码）。

## Cursor

本仓库自带 `.cursor/skills/yanboc-cv`（软链到 `skills/yanboc-cv`），clone 后即被 Cursor 发现。

全局安装（所有项目可用）：

```bash
git clone https://github.com/yanboc/yanboc-cv
mkdir -p ~/.cursor/skills
cp -R yanboc-cv/skills/yanboc-cv ~/.cursor/skills/
```

或用 `npx skills`：

```bash
npx skills add yanboc/yanboc-cv -a cursor -y
```

验证：新开 agent 会话，输入 `/yanboc-cv`。

## Claude Code

```bash
claude plugin marketplace add yanboc/yanboc-cv
claude plugin install yanboc-cv@yanboc-cv
```

输入 `/yanboc-cv`。

卸载：

```bash
claude plugin uninstall yanboc-cv
claude plugin marketplace remove yanboc-cv
```

## 其他 agent-skills 工具（OpenCode / Copilot / Zed / Codex 等）

任何「读 agent skills」的工具都能挂载同一份 `skills/yanboc-cv/`：

```bash
npx skills add yanboc/yanboc-cv                  # 当前项目
npx skills add yanboc/yanboc-cv -g               # 所有项目
npx skills add yanboc/yanboc-cv -a <agent> -y    # 指定某一个
```

或手动复制到对应工具扫描目录：

```bash
git clone https://github.com/yanboc/yanboc-cv
# Cursor:   ~/.cursor/skills/
# OpenCode: ~/.config/opencode/skills/ 或 .agents/skills/
# Zed:      ~/.config/zed/skills/
cp -R yanboc-cv/skills/yanboc-cv <目标目录>/
```

## 更新 / 卸载

- `npx skills update yanboc-cv`（或 `-g`）
- `npx skills remove yanboc-cv`（或删掉对应 skill 目录）

## 注意

- skill 只教 agent「怎么填模板」，不打包模板源码或字体二进制。生成简历时会 `git clone` 本仓库作为骨架。
- 模板本身仍是普通 LaTeX 项目，可直接 `xelatex main.tex` 编译，与 skill 无关。