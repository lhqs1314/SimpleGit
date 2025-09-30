# Simple-Git Windows 使用指南

## 前置要求

在 Windows 上使用 simple-git 之前，需要确保已安装以下工具：

1. **Node.js**：从 [nodejs.org](https://nodejs.org/) 下载并安装
2. **Git for Windows**：从 [git-scm.com](https://git-scm.com/download/win) 下载并安装

## 安装步骤

### 1. 克隆项目

在 PowerShell 或 CMD 中执行：

```bash
git clone <repository-url>
cd simple-git
```

### 2. 安装依赖

使用 npm 或 pnpm 安装依赖：

```bash
# 使用 npm
npm install

# 或使用 pnpm
pnpm install
```

## 使用方式

### 基本命令

由于 Windows 不支持直接执行 shell 脚本，你需要使用以下几种方式运行 simple-git：

#### 方式 1：使用 Node.js 直接运行

```bash
node src/index.js <command> [options]
```

#### 方式 2：使用 npm scripts

在 `package.json` 中查看可用的脚本命令，然后使用：

```bash
npm run <script-name>
```

#### 方式 3：使用 Git Bash

如果安装了 Git for Windows，可以使用 Git Bash 执行 shell 脚本：

```bash
./install.sh
```

### 常见命令示例

```bash
# 查看状态
node src/index.js status

# 添加文件
node src/index.js add <file>

# 提交更改
node src/index.js commit -m "commit message"

# 推送到远程
node src/index.js push

# 拉取更新
node src/index.js pull
```

## Windows 特定注意事项

### 1. 路径分隔符

Windows 使用反斜杠 `\` 作为路径分隔符，但在代码中建议使用正斜杠 `/` 或使用 Node.js 的 `path` 模块来处理跨平台路径。

```javascript
// 推荐方式
const path = require('path');
const filePath = path.join('src', 'index.js');
```

### 2. 行尾符

Windows 默认使用 CRLF (`\r\n`) 作为行尾符，而 Linux/Mac 使用 LF (`\n`)。建议配置 Git 自动处理：

```bash
git config --global core.autocrlf true
```

### 3. 权限问题

Windows 没有与 Unix 相同的文件权限系统。如果遇到权限相关错误，可以：

- 以管理员身份运行 PowerShell 或 CMD
- 检查文件的只读属性

### 4. 字符编码

确保使用 UTF-8 编码，在 PowerShell 中可以设置：

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
```

### 5. 环境变量

如果需要设置环境变量，在 PowerShell 中使用：

```powershell
$env:VARIABLE_NAME = "value"
```

在 CMD 中使用：

```cmd
set VARIABLE_NAME=value
```

## 推荐开发环境

- **VS Code**：优秀的跨平台代码编辑器，内置 Git 支持
- **Windows Terminal**：现代化的终端应用，支持多标签页
- **Git Bash**：提供类 Unix 的 shell 环境

## 常见问题

### Q: 提示 "command not found" 或 "不是内部或外部命令"

**A:** 确保 Node.js 和 Git 已正确安装并添加到系统 PATH 环境变量中。可以通过以下命令验证：

```bash
node --version
git --version
```

### Q: 脚本无法执行

**A:** Windows 默认不支持 `.sh` 脚本。可以：
- 使用 Git Bash 执行
- 使用 WSL (Windows Subsystem for Linux)
- 使用 Node.js 直接运行源代码

### Q: 中文乱码问题

**A:** 在终端中设置正确的编码：

```bash
# PowerShell
chcp 65001

# CMD
chcp 65001
```

## 使用 WSL (推荐)

如果你使用 Windows 10/11，强烈推荐安装 WSL2，这样可以获得完整的 Linux 环境：

```powershell
# 在 PowerShell 中以管理员身份运行
wsl --install
```

安装后，可以在 WSL 中使用与 Linux 相同的方式运行 simple-git。

## 相关资源

- [Node.js Windows 安装指南](https://nodejs.org/en/download/)
- [Git for Windows](https://gitforwindows.org/)
- [WSL 文档](https://docs.microsoft.com/en-us/windows/wsl/)
- [Windows Terminal](https://github.com/microsoft/terminal)