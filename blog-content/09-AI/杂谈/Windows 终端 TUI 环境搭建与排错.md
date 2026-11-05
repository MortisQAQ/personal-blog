# Windows 终端 TUI 环境搭建与排错

## 这篇在讲什么

**终端（Terminal）** 是你敲命令的那个窗口，Windows 上默认就是「Windows Terminal」。

**TUI（Terminal User Interface，终端用户界面）** 是跑在终端里的程序——它不像 VS Code 那样有独立窗口和按钮，
而是用字符在终端里画出面板、边框和快捷键提示，全屏接管整个窗口。日常写代码时经常会同时用到好几类：

| 工具 | 作用 |
|---|---|
| Yazi | 终端里的文件管理器：浏览目录、预览文件内容、按类型打开文件 |
| Lazygit | 终端里的 Git 客户端：看改动、提交、切分支，不用背 Git 命令 |
| Starship | 命令行提示符：显示当前目录、Git 分支、语言版本 |
| codex / zcode | AI 编程 CLI，本身就是全屏 TUI |

本文的起点是掘金教程《ClaudeCode武装三件套：Ghostty + Yazi + Lazygit 打造高效开发环境告别 tmux 的繁琐》
(https://juejin.cn/post/7616981752200347698)：它在 macOS / Linux 上用 Ghostty + Yazi + Lazygit 搭一套终端工作流。
本文把这套流程搬到 Windows，并记录落地过程中遇到的**每一个坑和排查方法**。

- Ghostty 官方没有 Windows 版 → 用 **Windows Terminal** 的原生分屏替代（功能等价）。
- 目标效果：分屏窗格中同时运行 AI CLI（codex / zcode）、Yazi、Lazygit。

> **⚠️ 本机最终状态（重要）**：终端美化（配色 / 透明度 / 快捷键 / 提示符）已回滚为 Windows 默认，
> **只保留两处功能性改动**：① 终端字体设为 `JetBrainsMono Nerd Font`
> （Yazi 与 Lazygit 的默认界面依赖 Nerd Font 图标，属功能需求而非装饰）；② Yazi 的 `YAZI_FILE_ONE`（见第 8 节）。
> 如果你的目标只是**让 Yazi / Lazygit 正常工作**，看**第 2.2 节（字体）+ 第 8 节（yazi 依赖）**即可，其余美化章节可以跳过。

### 全文导航

| 章节 | 内容 |
|---|---|
| 第 1 节 | 动手前先探测环境：判断哪些东西已经有了、哪些要装 |
| 第 2 节 | 安装：三个 CLI 工具 + Nerd Font 字体 |
| 第 3 节 | 各工具的配置文件逐个落地（可直接复制） |
| 第 4 节 | 全量验证清单 |
| 第 5 节 | 踩坑速查表（症状 → 根因 → 修复） |
| 第 6 节 | 日常使用方式与快捷键 |
| 第 7 节 | 复现要点（给 AI 或新机器参考） |
| **第 8 节** | **Yazi / Lazygit 在 Windows 的必备修复（最实用的一节）** |

---

## 0. 总览：装了什么、改了什么

### 安装的软件（全部用户级，无需管理员）

| 组件 | 版本（验证于本机） | 安装方式 |
|---|---|---|
| Yazi（文件管理器） | 26.9.1 | winget `sxyazi.yazi` |
| Lazygit（git TUI） | 0.65.1 | winget `JesseDuffield.lazygit` |
| Starship（提示符） | 1.26.0 | winget `Starship.Starship` |
| JetBrains Mono Nerd Font | nerd-fonts latest | 手动下载 + 用户级安装脚本 |
| Windows Terminal | 已有 | 复用，仅改配置 |

### 修改的文件清单

| 文件 | 作用 |
|---|---|
| `%LOCALAPPDATA%\Packages\Microsoft.WindowsTerminal_8wekyb3d8bbwe\LocalState\settings.json` | 终端配色/字体/透明度/分屏快捷键 |
| `%USERPROFILE%\.config\starship.toml` | 提示符样式 |
| `%USERPROFILE%\.config\yazi\yazi.toml` | Yazi 主配置 |
| `%USERPROFILE%\.config\yazi\theme.toml` | Yazi 主题 |
| `%USERPROFILE%\.config\yazi\keymap.toml` | Yazi 自定义快捷键（启动 codex / lazygit） |
| `%USERPROFILE%\.config\lazygit\config.yml` | Lazygit 主题 |
| `%USERPROFILE%\Documents\WindowsPowerShell\Microsoft.PowerShell_profile.ps1` | PowerShell 启动脚本（starship + y 函数） |
| `%USERPROFILE%\.bashrc` | Git Bash 启动脚本（starship + y 函数 + 别名） |
| `%USERPROFILE%\.bash_profile` | Git Bash 登录 shell 桥接（必须，否则 .bashrc 不加载） |
| 字体文件 + 注册表 `HKCU\Software\Microsoft\Windows NT\CurrentVersion\Fonts` | 用户级字体注册 |

> 注意：**没有修改任何软件的源码**。所有改动都是各程序官方支持的配置入口，全部可回滚（删文件即恢复默认）。

---

## 1. 前置环境检测（先跑这一节，再决定装什么）

```bash
# 终端与包管理器
where.exe wt wezterm ghostty yazi lazygit starship scoop winget

# 已有 Nerd Font？（无输出 = 需要装字体）
powershell -NoProfile -Command "Add-Type -AssemblyName System.Drawing; (New-Object System.Drawing.Text.InstalledFontCollection).Families | Where-Object { \$_.Name -match 'Nerd|Cascadia|JetBrains' } | ForEach-Object { \$_.Name }"

# PowerShell 版本（决定默认终端 profile 与 PSReadLine 能力）
where.exe pwsh; powershell -NoProfile -Command '$PSVersionTable.PSVersion.ToString()'
powershell -NoProfile -Command "(Get-Module PSReadLine -ListAvailable | Select-Object -First 1).Version.ToString()"

# 配置文件是否存在
ls "$USERPROFILE/.config" "$USERPROFILE/.bashrc" "$USERPROFILE/.bash_profile" 2>/dev/null
```

**判定规则：**
- `pwsh`（PowerShell 7）不存在 → 使用 `Documents\WindowsPowerShell\`（5.1）放 profile，不要放 `Documents\PowerShell\`。
- PSReadLine 版本 < 2.1 → `-PredictionSource` 不可用，profile 里必须加版本守卫。
- Git Bash 存在但没有 `.bash_profile` → **必须补桥接文件**，否则 `.bashrc` 在登录 shell 中不生效。

---

## 2. 安装步骤

### 2.1 winget 安装三个 CLI 工具

```powershell
winget install -e --id sxyazi.yazi      --accept-package-agreements --accept-source-agreements --silent --scope user
winget install -e --id JesseDuffield.lazygit --accept-package-agreements --accept-source-agreements --silent --scope user
winget install -e --id Starship.Starship --accept-package-agreements --accept-source-agreements --silent --scope user
```

**注意事项（实战踩坑）：**
- `--scope user` 避免 UAC 提权。
- 本机 winget 创建符号链接失败（`%LOCALAPPDATA%\Microsoft\WinGet\Links` 为空，非管理员无法创建 symlink），**但 winget 会自动把包目录写进用户 PATH**，新开的终端可直接调用 `yazi` / `lazygit` / `starship`，无需处理。
- **已打开的终端看不到新 PATH**（进程环境是启动时快照）——验证时用全路径，或重开终端。
- 安装后立即验证（用全路径绕开 PATH 快照问题）：

```bash
B="C:/Users/$USER/AppData/Local/Microsoft/WinGet/Packages"
"$B/sxyazi.yazi_Microsoft.Winget.Source_8wekyb3d8bbwe/yazi-x86_64-pc-windows-msvc/yazi.exe" --version
"$B/JesseDuffield.lazygit_Microsoft.Winget.Source_8wekyb3d8bbwe/lazygit.exe" --version
"$B/Starship.Starship_Microsoft.Winget.Source_8wekyb3d8bbwe/starship.exe" --version
```

### 2.2 Nerd Font 用户级安装（不要用 winget 的字体包！）

**为什么：** `DEVCOM.JetBrainsMonoNerdFont` 是 MSI 安装包，需要管理员权限。`--silent` 模式下会静默挂在 UAC 弹窗上（进程存活但 10 分钟无进展），无人值守环境必然卡死。

**做法：下载 TTF → 复制到用户字体目录 → 写 HKCU 注册表 → 通知系统刷新。**

```bash
# 1) 下载（约 134MB）
mkdir -p /tmp/jbnf && cd /tmp/jbnf
curl -sL -o JetBrainsMono.zip "https://github.com/ryanoasis/nerd-fonts/releases/latest/download/JetBrainsMono.zip"

# 2) 只解压核心字重
unzip -o -j JetBrainsMono.zip "JetBrainsMonoNerdFont-Regular.ttf" "JetBrainsMonoNerdFont-Bold.ttf" "JetBrainsMonoNerdFont-Italic.ttf" "JetBrainsMonoNerdFont-BoldItalic.ttf" "JetBrainsMonoNerdFontMono-Regular.ttf" -d extracted
```

```powershell
# 3) install-fonts.ps1 —— 用户级注册（保存为文件执行，不要内联，避免转义地狱）
$ErrorActionPreference = 'Stop'
$fontDir = Join-Path $env:LOCALAPPDATA 'Microsoft\Windows\Fonts'
$reg = 'HKCU:\Software\Microsoft\Windows NT\CurrentVersion\Fonts'
Add-Type -AssemblyName PresentationCore
Add-Type -Name Native -Namespace Win32 -MemberDefinition '[DllImport("gdi32.dll")] public static extern int AddFontResource(string lpFilename);'

Get-ChildItem (Join-Path $env:TEMP 'jbnf\extracted\JetBrainsMonoNerdFont*.ttf') | ForEach-Object {
    $dest = Join-Path $fontDir $_.Name
    if (-not (Test-Path $dest)) { Copy-Item $_.FullName $dest -Force }   # 已存在时跳过（可能被占用）
    $gf = New-Object Windows.Media.GlyphTypeface($dest)
    # 注册表值名必须逐字重唯一：排版家族名 + 字重名
    $name = $gf.FamilyNames['en-us'] + ' ' + $gf.Win32FaceNames['en-us'] + ' (TrueType)'
    New-ItemProperty -Path $reg -Name $name -Value $dest -PropertyType String -Force | Out-Null
    [Win32.Native]::AddFontResource($dest) | Out-Null
    Write-Host "installed: $name"
}

Add-Type -Name User32 -Namespace Win32 -MemberDefinition '[DllImport("user32.dll")] public static extern int SendMessageTimeout(IntPtr hWnd, uint Msg, IntPtr wParam, IntPtr lParam, uint fuFlags, uint uTimeout, out IntPtr lpdwResult);'
$r = [IntPtr]::Zero
[Win32.User32]::SendMessageTimeout([IntPtr]0xffff, 0x001D, [IntPtr]::Zero, [IntPtr]::Zero, 2, 1000, [ref]$r) | Out-Null
Write-Host 'ALL DONE'
```

运行：`powershell -NoProfile -ExecutionPolicy Bypass -File install-fonts.ps1`

**关键坑：**
- 字体家族有两个名字：**排版家族名**（`JetBrainsMono Nerd Font`，DirectWrite/Windows Terminal 用这个）和 **GDI 短名**（`JetBrainsMono NF`）。Windows Terminal 的 `font.face` 填前者。
- 注册表值名必须唯一（含字重），四个字重都写 `JetBrainsMono NF (TrueType)` 会互相覆盖，只剩最后一个。
- 若 TTF 已被前一次 `AddFontResource` 占用导致复制失败，跳过复制、只补注册即可。
- 验证：

```powershell
powershell -NoProfile -Command "Add-Type -AssemblyName System.Drawing; (New-Object System.Drawing.Text.InstalledFontCollection).Families | Where-Object { \$_.Name -match 'Nerd' } | ForEach-Object { \$_.Name }"
# 期望输出含：JetBrainsMono NF / JetBrainsMono NFM
```

---

## 3. 配置文件（逐文件落地）

### 3.1 Windows Terminal `settings.json`

路径：`%LOCALAPPDATA%\Packages\Microsoft.WindowsTerminal_8wekyb3d8bbwe\LocalState\settings.json`

> ⚠️ **合并修改，不要整体替换**：保留原有的 `profiles.list`、`language`、`minimizeToNotificationArea` 等键。

**(a) 在 `schemes` 数组里追加配色：**

```json
{
    "background": "#1e1e2e",
    "black": "#45475a",
    "blue": "#89b4fa",
    "brightBlack": "#585b70",
    "brightBlue": "#89dceb",
    "brightCyan": "#94e2d5",
    "brightGreen": "#a6e3a1",
    "brightPurple": "#f5c2e7",
    "brightRed": "#f38ba8",
    "brightWhite": "#a6adc8",
    "brightYellow": "#f9e2af",
    "cursorColor": "#f5e0dc",
    "cyan": "#94e2d5",
    "foreground": "#cdd6f4",
    "green": "#a6e3a1",
    "name": "Catppuccin Mocha",
    "purple": "#cba6f7",
    "red": "#f38ba8",
    "selectionBackground": "#585b70",
    "white": "#bac2de",
    "yellow": "#f9e2af"
}
```

**(b) 修改 `profiles.defaults`：**

```json
"profiles": {
    "defaults": {
        "bellStyle": "none",
        "colorScheme": "Catppuccin Mocha",
        "cursorShape": "filledBox",
        "font": {
            "face": "JetBrainsMono Nerd Font",
            "size": 11.0
        },
        "opacity": 90,
        "padding": "8",
        "scrollbarState": "visible",
        "useAcrylic": true
    },
    "list": [ ...原样保留... ]
}
```

**(c) `actions` 数组追加（若已有同 id 则跳过）：**

```json
{ "command": { "action": "splitPane", "split": "right", "splitMode": "duplicate" }, "id": "User.splitPaneGhosttyRight" },
{ "command": { "action": "splitPane", "split": "down",  "splitMode": "duplicate" }, "id": "User.splitPaneGhosttyDown" },
{ "command": { "action": "moveFocus",  "direction": "left"  }, "id": "User.moveFocusLeft" },
{ "command": { "action": "moveFocus",  "direction": "right" }, "id": "User.moveFocusRight" },
{ "command": { "action": "moveFocus",  "direction": "up"    }, "id": "User.moveFocusUp" },
{ "command": { "action": "moveFocus",  "direction": "down"  }, "id": "User.moveFocusDown" },
{ "command": { "action": "resizePane", "direction": "left"  }, "id": "User.resizePaneLeft" },
{ "command": { "action": "resizePane", "direction": "right" }, "id": "User.resizePaneRight" },
{ "command": { "action": "resizePane", "direction": "up"    }, "id": "User.resizePaneUp" },
{ "command": { "action": "resizePane", "direction": "down"  }, "id": "User.resizePaneDown" },
{ "command": { "action": "togglePaneZoom" }, "id": "User.togglePaneZoom" }
```

**(d) `keybindings` 数组追加（若某键已被占用则换键，不要重复绑定）：**

```json
{ "id": "User.splitPaneGhosttyRight", "keys": "ctrl+shift+e" },
{ "id": "User.splitPaneGhosttyDown",  "keys": "ctrl+shift+o" },
{ "id": "User.moveFocusLeft",  "keys": "alt+left"  },
{ "id": "User.moveFocusRight", "keys": "alt+right" },
{ "id": "User.moveFocusUp",    "keys": "alt+up"    },
{ "id": "User.moveFocusDown",  "keys": "alt+down"  },
{ "id": "User.resizePaneLeft",  "keys": "ctrl+alt+left"  },
{ "id": "User.resizePaneRight", "keys": "ctrl+alt+right" },
{ "id": "User.resizePaneUp",    "keys": "ctrl+alt+up"    },
{ "id": "User.resizePaneDown",  "keys": "ctrl+alt+down"  },
{ "id": "User.togglePaneZoom",  "keys": "ctrl+shift+enter" }
```

**验证：** `powershell -NoProfile -Command "Get-Content '<路径>' -Raw | ConvertFrom-Json | Out-Null; 'WT JSON OK'"`
Windows Terminal 会自动热重载；JSON 非法会弹错误横幅。

### 3.2 Starship `~/.config/starship.toml`

```toml
# Starship 提示符 — Catppuccin Mocha 风格

format = """
$directory\
$git_branch\
$git_status\
$nodejs\
$python\
$rust\
$golang\
$cmd_duration\
$line_break\
$character"""

right_format = "$time"
add_newline = true

[palettes.catppuccin_mocha]
rosewater = "#f5e0dc"
flamingo = "#f2cdcd"
pink = "#f5c2e7"
mauve = "#cba6f7"
red = "#f38ba8"
maroon = "#eba0ac"
peach = "#fab387"
yellow = "#f9e2af"
green = "#a6e3a1"
teal = "#94e2d5"
sky = "#89dceb"
sapphire = "#74c7ec"
blue = "#89b4fa"
lavender = "#b4befe"
text = "#cdd6f4"
subtext1 = "#bac2de"
subtext0 = "#a6adc8"
overlay2 = "#9399b2"
overlay1 = "#7f849c"
overlay0 = "#6c7086"
surface2 = "#585b70"
surface1 = "#45475a"
surface0 = "#313244"
base = "#1e1e2e"
mantle = "#181825"
crust = "#11111b"

palette = "catppuccin_mocha"

[directory]
style = "bold lavender"
format = "[$path]($style)[$read_only]($red) "
truncation_length = 4
truncation_symbol = "…/"
read_only = " "
home_symbol = "~"

[git_branch]
symbol = " "
style = "mauve"
format = "[$symbol$branch]($style) "

[git_status]
style = "red"
format = "([$all_status$ahead_behind]($style)) "
ahead = "⇡${count}"
behind = "⇣${count}"
diverged = "⇕⇡${ahead_count}⇣${behind_count}"
deleted = "✘"
renamed = "»"
modified = "!"
staged = "+"
untracked = "?"
stashed = "$"

[nodejs]
symbol = " "
style = "green"

[python]
symbol = " "
style = "yellow"

[rust]
symbol = " "
style = "peach"

[golang]
symbol = " "
style = "sky"

[cmd_duration]
min_time = 2000
style = "yellow"
format = "[ $duration]($style) "

[character]
success_symbol = "[❯](bold green)"
error_symbol = "[❯](bold red)"

[time]
disabled = false
style = "overlay1"
format = "[ $time]($style)"
time_format = "%H:%M"
```

**验证：** `starship prompt`（应输出带颜色的两行提示符预览）。

### 3.3 Yazi 三件套

`~/.config/yazi/yazi.toml`：

```toml
[manager]
ratio = [1, 3, 4]
sort_by = "natural"
sort_sensitive = false
sort_reverse = false
sort_dir_first = true
linemode = "size"
show_hidden = false
show_symlink = true

[preview]
tab_size = 2
max_width = 1000
max_height = 1000
image_filter = "triangle"
image_quality = 75
sixel_fraction = 15
ueberzug_scale = 1
ueberzug_offset = [0, 0, 0, 0]

[opener]
edit = [
    { run = 'code --wait "%@"', block = true, desc = "VS Code 编辑", for = "windows" },
    { run = '$EDITOR "$@"', block = true, desc = "编辑", for = "unix" },
]
```

`~/.config/yazi/theme.toml`：

```toml
# Yazi 主题 — Catppuccin Mocha（yazi 25+ 内置 flavor）
[flavor]
dark = "catppuccin-mocha"
```

`~/.config/yazi/keymap.toml`：

```toml
# prepend 优先于默认键位
[manager]
prepend_keymap = [
    # e：在当前悬停目录启动 Codex（退出后回到 yazi）
    { on = ["e"], run = 'shell "codex" --block --confirm', desc = "在此目录启动 Codex" },
    # L：启动 Lazygit
    { on = ["L"], run = 'shell "lazygit" --block --confirm', desc = "启动 Lazygit" },
]

[input]
prepend_keymap = []
[confirm]
prepend_keymap = []
[completion]
prepend_keymap = []
```

**注意：** 不要手写 `[plugin]` 段（fetchers/previewers）——新版 Yazi 默认值已够用，手写反而容易因插件名/表达式不匹配报错。`--debug` 参数在 26.x 已被移除，验证靠启动无红色报错横幅。

### 3.4 Lazygit `~/.config/lazygit/config.yml`

```yaml
gui:
  language: zh-CN
  border: rounded
  showRandomTip: false
  showIcons: true
  nerdFontsVersion: "3"
  theme:
    activeBorderColor:
      - "#a6e3a1"
      - bold
    inactiveBorderColor:
      - "#cdd6f4"
    searchingActiveBorderColor:
      - "#f9e2af"
      - bold
    optionsTextColor:
      - "#89b4fa"
    selectedLineBgColor:
      - "#313244"
    cherryPickedCommitBgColor:
      - "#94e2d5"
    cherryPickedCommitFgColor:
      - "#89dceb"
    unstagedChangesColor:
      - "#f38ba8"
    defaultFgColor:
      - "#cdd6f4"

git:
  paging:
    colorArg: always
    pager: ""
```

> YAML 注意：`git:` 顶层键只能出现一次；`autoWrapWidth` 等要并进同一个 `git:` 块。

### 3.5 PowerShell 启动脚本

路径（无 pwsh 时）：`%USERPROFILE%\Documents\WindowsPowerShell\Microsoft.PowerShell_profile.ps1`
（有 pwsh 7 时应放 `%USERPROFILE%\Documents\PowerShell\...`，并通过 `$PROFILE` 确认实际路径）

```powershell
# OPENSPEC:START - OpenSpec completion (managed block, do not edit manually)
. "C:\Users\J\Documents\PowerShell\OpenSpecCompletion.ps1"
# OPENSPEC:END

# ==== TUI (starship + yazi) ====

# UTF-8 for starship/yazi icons
$OutputEncoding = [Console]::InputEncoding = [Console]::OutputEncoding = New-Object System.Text.UTF8Encoding

# Starship prompt
if (Get-Command starship -ErrorAction SilentlyContinue) {
    Invoke-Expression (&starship init powershell)
}

# yazi wrapper: shell follows the last browsed directory on exit
function y {
    $tmp = [System.IO.Path]::GetTempFileName()
    try {
        yazi @args --cwd-file="$tmp"
        $cwd = Get-Content -Path $tmp -Encoding UTF8
        if ($cwd -and $cwd -ne '') {
            Set-Location -Path ([System.IO.Path]::GetFullPath($cwd))
        }
    } finally {
        Remove-Item -Path $tmp -ErrorAction SilentlyContinue
    }
}

# PSReadLine (PredictionSource requires PSReadLine >= 2.1)
Set-PSReadLineOption -EditMode Windows -BellStyle None
Set-PSReadLineKeyHandler -Key Tab -Function MenuComplete
$psrl = (Get-Module PSReadLine -ListAvailable | Select-Object -First 1).Version
if ($psrl -and $psrl -ge [version]'2.1.0') {
    Set-PSReadLineOption -PredictionSource History
    Set-PSReadLineOption -Colors @{ InlinePrediction = '#585b70' }
}
```

> 注：文件开头的 OPENSPEC 块是本机已有内容（由 OpenSpec 工具自动管理），复现时应**原样保留目标机器上已有的同类块**，只追加其后的 TUI 部分。

> ⚠️ **两个致命坑（本机实测）：**
> 1. **该文件必须用纯 ASCII 注释**。工具常以 UTF-8 无 BOM 写文件，而 Windows PowerShell 5.1 按 GBK 解析 `.ps1`，中文多字节序列会吞掉换行符，导致启动报 `意外的标记"}"`。
> 2. **PSReadLine 2.0.0（5.1 自带）没有 `-PredictionSource`**，不加版本守卫则每次启动报参数错误。

**验证：** `powershell -NoLogo -Command "Write-Host PROFILE_OK"` —— 无红色报错即为通过。

### 3.6 Git Bash：`.bashrc` + `.bash_profile`

`~/.bashrc`：

```bash
# ==== TUI (starship + yazi) ====

export LANG=zh_CN.UTF-8
export LC_ALL=zh_CN.UTF-8
export EDITOR="code --wait"
export VISUAL="code --wait"

# Starship prompt
command -v starship >/dev/null 2>&1 && eval "$(starship init bash)"

# yazi wrapper: shell follows the last browsed directory on exit
command -v yazi >/dev/null 2>&1 && y() {
	local tmp="$(mktemp -t "yazi-cwd.XXXXXX")" cwd
	yazi "$@" --cwd-file="$tmp"
	if cwd="$(command cat -- "$tmp")" && [ -n "$cwd" ] && [ "$cwd" != "$PWD" ]; then
		builtin cd -- "$cwd"
	fi
	rm -f -- "$tmp"
}

alias ls='ls --color=auto'
alias ll='ls -alF --color=auto'
alias la='ls -A --color=auto'
```

`~/.bash_profile`（**必须有，Git Bash 是登录 shell，不读 .bashrc**）：

```bash
[ -f ~/.bashrc ] && . ~/.bashrc
```

**验证：**
```bash
bash -l -i -c 'type y >/dev/null 2>&1 && echo "y函数 OK"'   # 需 PATH 中已有 yazi
locale -a | grep -i zh                                     # 确认 zh_CN.utf8 存在
```

---

## 4. 全量验证清单

```bash
# 1) 工具可用（新开终端里）
yazi --version && lazygit --version && starship --version

# 2) 配置语法
python -c "import tomllib; [tomllib.load(open(f,'rb')) for f in [r'<用户目录>/.config/yazi/yazi.toml', r'<用户目录>/.config/yazi/theme.toml', r'<用户目录>/.config/yazi/keymap.toml', r'<用户目录>/.config/starship.toml']]; print('TOML OK')"
python -c "import yaml; yaml.safe_load(open(r'<用户目录>/.config/lazygit/config.yml',encoding='utf-8')); print('YAML OK')"
powershell -NoProfile -Command "Get-Content '<WT settings.json>' -Raw | ConvertFrom-Json | Out-Null; 'WT JSON OK'"

# 3) shell 启动无报错
powershell -NoLogo -Command "Write-Host PROFILE_OK"
bash -l -i -c 'echo BASH_OK'

# 4) 字体已注册
powershell -NoProfile -Command "Add-Type -AssemblyName System.Drawing; (New-Object System.Drawing.Text.InstalledFontCollection).Families | Where-Object { \$_.Name -match 'Nerd' } | ForEach-Object { \$_.Name }"
```

**期望：** 全部 OK；字体列表含 `JetBrainsMono NF` / `JetBrainsMono NFM`。

---

## 5. 已知坑速查表

| 症状 | 根因 | 修复 |
|---|---|---|
| winget 装字体包卡死 10 分钟无进展 | MSI 需管理员，`--silent` 下静默等 UAC | 放弃 winget 字体，改用「下载 TTF + HKCU 注册」脚本 |
| PowerShell 启动报 `意外的标记"}"` | UTF-8 无 BOM 中文注释被 PS 5.1 按 GBK 误读，吞换行符 | `.ps1` 注释只用 ASCII |
| PowerShell 启动报参数错误（PredictionSource） | PSReadLine 2.0.0 不支持该参数（需 ≥2.1） | 版本守卫后再调用 |
| Git Bash 里提示符/`y` 函数不生效 | 登录 shell 不读 `.bashrc`，且本机没有 `.bash_profile` | 新建 `.bash_profile` 桥接 |
| 已开终端找不到 yazi/lazygit/starship | 进程 PATH 是启动时快照 | 重开终端（新 PATH 已写入用户环境变量） |
| winget 安装后 `WinGet\Links` 为空 | 非管理员无法建符号链接 | 无需处理：包目录已直接加入用户 PATH |
| 字体注册后 Terminal 里字体仍不显示 | 注册表值名重复互相覆盖，或缺 `WM_FONTCHANGE` 广播 | 值名用「排版家族名+字重」（唯一）+ `AddFontResource` + `SendMessageTimeout(0x001D)` |
| 个别老程序中文乱码 | 终端 profile 把控制台编码设为 UTF-8(65001) | 仅影响 PowerShell 会话；如遇问题在需要时改用 `chcp 936` |

---

## 6. 使用方式（对照教程工作流）

**快捷键（Windows Terminal 层的“Ghostty 等效键”）：**

| 操作 | 快捷键 |
|---|---|
| 左右分屏（复制当前目录） | `Ctrl+Shift+E` |
| 上下分屏 | `Ctrl+Shift+O` |
| 分屏（自动方向） | `Alt+Shift+D` |
| 切换窗格 | `Alt+方向键` |
| 调整窗格大小 | `Ctrl+Alt+方向键`（注意：部分显卡驱动的屏幕旋转热键会抢占） |
| 放大/还原当前窗格 | `Ctrl+Shift+Enter` |

**项目的标准启动流程（在项目目录）：**

```powershell
cd <项目目录>

codex            # ① 主窗格：AI CLI
# Ctrl+Shift+E  # ② 右侧分屏
y                #    yazi 文件管理器（q 退出后 shell 跟随目录）
# Ctrl+Shift+O  # ③ 右侧再分上下
lazygit          #    git TUI
```

**yazi 中心流（教程同款）：** 输入 `y` 进入 yazi → 光标停在目标目录 → `e` 就地启动 codex / `L` 就地启动 lazygit（退出后回到 yazi）→ `o` 用 VS Code 打开文件。

---

## 7. 给 AI 的执行要点（复现时）

1. **顺序**：环境检测 → winget 装三件套 → 字体（脚本方式）→ 配置（WT 合并、其余整写）→ 验证。
2. **能合并的绝不覆盖**：WT `settings.json`、PowerShell profile（保留已有 managed block）属于合并修改；新增的 `.config/*`、`.bashrc` 可整写。
3. **文本编码铁律**：任何将被 PowerShell 5.1 读取的脚本，注释与字符串保守地用 ASCII；其余 UTF-8 文件（TOML/YAML/JSON）无此问题。
4. **验证优先于假设**：每步跑第 4 节对应校验命令；工具在旧会话不可见是 PATH 快照问题，不是安装失败。
5. **全部用户级**：无管理员操作，无系统级改动，回滚 = 删除上述配置文件 + HKCU 字体注册项。

---

## 8. 补充：yazi / lazygit 在 Windows 的必备修复（实测踩坑）

### 8.1 yazi 报 "Cannot find `file`" → 预览/打开全部失效

**症状**：yazi 能打开、能列目录，但预览窗格显示
`Cannot find 'file' to detect the file's MIME type. Set it up correctly as per the Windows Installation Guide.`，
文本文件不显示内容，回车/`o` 也无法按类型打开文件。

**根因**：yazi 依赖 `file(1)` 判断 MIME 类型，进而决定用哪个预览器/打开器。
Git for Windows 自带 `file.exe`，但它的位置是 `<Git>\usr\bin\file.exe`，
而 Git 安装程序只把 `<Git>\cmd` 加进 PATH —— **`usr\bin` 不在 PATH 里**，所以原生终端找不到 `file`。

> ⚠️ 验证时的常见陷阱：在 Git Bash 里执行 `where file` 或 `powershell -c "Get-Command file"` **会误报可用**，
> 因为 Git Bash 自己的 PATH 含 `/usr/bin` 且子进程会继承。必须用注册表 PATH 判断：
> ```powershell
> [Environment]::GetEnvironmentVariable('Path','Machine') -split ';' | Select-String 'usr'
> [Environment]::GetEnvironmentVariable('Path','User')    -split ';' | Select-String 'usr'
> ```

**修复（官方推荐且是唯一推荐方式）**：设置用户环境变量指向 Git 的 file.exe：

```powershell
[Environment]::SetEnvironmentVariable('YAZI_FILE_ONE','D:\Git\usr\bin\file.exe','User')
```

官方明确**不推荐**用 Scoop/Chocolatey 装 `file`（无法正确处理 Unicode 文件名、缺少必需参数）。
备选方案是 `mime-ext.yazi` 插件（纯扩展名数据库，不调用 file）。

**生效条件**：环境变量只在**新进程**中生效；已打开的终端（含 Windows Terminal 自身）持有旧环境快照，
需要**完全关闭并重开 Windows Terminal**。临时验证可在会话内 `$env:YAZI_FILE_ONE='D:\Git\usr\bin\file.exe'`。

### 8.2 yazi / lazygit 图标变成方块或菱形 → 缺 Nerd Font

yazi 与 lazygit 的**默认界面**就用 Nerd Font 私有区字符画图标（文件夹、文件类型、分支等）。
终端若用默认 Cascadia Mono，这些字符无处渲染，会显示为方块/菱形。

修复：终端字体设为 Nerd Font（本机用已安装的 JetBrainsMono Nerd Font）。
只需这一项，不需要改配色/透明度：

```json
"profiles": { "defaults": { "font": { "face": "JetBrainsMono Nerd Font" }, "scrollbarState": "visible" } }
```

若坚持不改终端字体，替代方案是关掉图标：lazygit 设 `gui.showIcons: false`；
yazi 无全局开关（图标写死在默认主题的 `[icon]` 规则里），实际不可行 —— 所以**字体是功能依赖**。

### 8.3 yazi 推荐的可选依赖（决定能预览什么）

| 用途 | 工具 | winget 包 | 是否需管理员 |
|---|---|---|---|
| MIME 检测（**必需**） | `file` | 用 Git 自带的，见 8.1 | 否 |
| 视频预览 | `ffmpeg` | `Gyan.FFmpeg` | 否 |
| JSON 预览 | `jq` | `jqlang.jq` | 否 |
| PDF 预览 | `poppler`(pdftoppm) | `oschwartz10612.Poppler` | 否 |
| 搜索/跳转插件 | `fd`/`rg`/`fzf`/`zoxide` | `sharkdp.fd`、`BurntSushi.ripgrep.MSVC`、`junegunn.fzf`、`ajeetdsouza.zoxide` | 否 |
| 压缩包预览 | `7zip` | `7zip.7zip` | **是**（MSI，需 UAC） |
| 图片转换 | `ImageMagick` | `ImageMagick.ImageMagick` | **是**（安装器） |
| SVG 预览 | `resvg` | 不在 winget，需 scoop/手动 | 否 |

批量安装（全部用户级，不触发 UAC）：

```powershell
foreach ($p in 'jqlang.jq','oschwartz10612.Poppler','sharkdp.fd','BurntSushi.ripgrep.MSVC','junegunn.fzf','ajeetdsouza.zoxide') {
    winget install -e --id $p --accept-package-agreements --accept-source-agreements --silent --scope user
}
```

**注意**：winget 会把包目录写入用户 PATH，但同样受"环境快照"限制 —— 装完要重开终端才生效。
`7zip` / `ImageMagick` 需要管理员权限，不要用 `--silent` 无人值守安装（会静默挂在 UAC 弹窗上）。

### 8.4 配置校验：不要凭记忆写 yazi.toml

写 `[preview]` 段前请对照官方默认值（避免写进不存在的键，例如 `sixel_fraction` 并不存在）：

```bash
curl -sL https://raw.githubusercontent.com/sxyazi/yazi/main/yazi-config/preset/yazi-default.toml
```

yazi 26.x 已移除 `yazi --debug`，配置错误只能靠启动后观察界面提示。

### 8.5 lazygit 配置要点（实测可用）

- `gui.language: zh-CN` 有效，界面中文化正常。
- `git.paging.pager: ""` 表示不使用外部 pager（Windows 上 `less`/`delta` 未必在 PATH），
  实测 diff 面板正常显示原始 diff，不会报错。
- `gui.showIcons: true` + `nerdFontsVersion: "3"` 配合 Nerd Font v3 正常。
- YAML 里 `git:` 顶层键只能出现一次。
