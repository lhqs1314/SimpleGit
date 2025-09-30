# Simple Git

一个简化的 Git 实现，支持核心的上传下载功能。无合并冲突 - 远程更改总是覆盖本地更改。

## 功能特性

- 初始化仓库
- 提交更改（存储完整文件快照）
- 查看提交历史
- 检出特定提交
- 推送/拉取到远程仓库
- 基于 HTTP 的简单远程协议
- 多仓库服务器支持

## 安装

### 全局安装（推荐）

```bash
cd simple-git
./install.sh
```

或者手动安装：
```bash
npm install -g .
```

### 本地安装

```bash
cd simple-git
npm install
```

## 使用方法

### 全局命令（安装后）

```bash
# 初始化新仓库
sgit init

# 提交更改
sgit commit "你的提交信息"

# 查看提交历史
sgit log

# 检查仓库状态
sgit status

# 检出特定提交
sgit checkout <提交哈希>
```

### 远程操作（多仓库服务器）

```bash
# 启动多仓库服务器（在单独终端中）
sgit-server 3003

# 列出远程服务器上的仓库
sgit list-repos http://localhost:3003

# 推送到指定仓库
sgit push http://localhost:3003 我的项目

# 从指定仓库拉取
sgit pull http://localhost:3003 我的项目

# 检查远程仓库状态
sgit remote status http://localhost:3003 我的项目
```

### 本地开发命令

```bash
# 初始化新仓库
node src/cli.js init

# 提交更改
node src/cli.js commit "你的提交信息"

# 查看提交历史
node src/cli.js log

# 检查仓库状态
node src/cli.js status

# 检出特定提交
node src/cli.js checkout <提交哈希>

# 多仓库服务器操作
node src/cli.js push http://localhost:3003 仓库名
node src/cli.js pull http://localhost:3003 仓库名
node src/cli.js list-repos http://localhost:3003
```

## 架构

- **存储**: 基于文件的存储，使用 SHA-1 哈希
- **仓库**: 核心类 Git 操作
- **远程**: 用于远程操作的 HTTP 客户端  
- **服务器**: 支持多仓库的 HTTP 服务器
- **CLI**: 支持多仓库的命令行界面

## 目录结构

### 本地仓库
```
.sgit/
├── objects/          # 文件内容存储（按 SHA-1 哈希）
├── refs/heads/       # 分支引用
└── HEAD              # 当前分支/提交指针
```

### 远程服务器
```
remote-repos/
├── project-a/
│   └── .sgit/        # 项目 A 仓库
├── project-b/
│   └── .sgit/        # 项目 B 仓库
└── project-c/
    └── .sgit/        # 项目 C 仓库
```

## 冲突解决

本实现使用"后写者胜"的方法：
- 推送操作覆盖远程状态
- 拉取操作覆盖本地状态
- 无合并冲突 - 简单且可预测

## 示例工作流

```bash
# 终端 1：启动多仓库服务器
sgit-server 3003

# 终端 2：创建并推送项目 A
mkdir project-a && cd project-a
sgit init
echo "项目 A 内容" > readme.txt
sgit commit "项目 A 的初始提交"
sgit push http://localhost:3003 project-a

# 终端 3：创建并推送项目 B
cd ../
mkdir project-b && cd project-b
sgit init
echo "项目 B 内容" > readme.txt
sgit commit "项目 B 的初始提交"
sgit push http://localhost:3003 project-b

# 终端 4：列出和克隆项目
sgit list-repos http://localhost:3003
# 显示：project-a, project-b

mkdir clone-a && cd clone-a
sgit pull http://localhost:3003 project-a
# 现在拥有项目 A 的文件（自动初始化仓库）
```

## 多仓库服务器 API

```
GET  /                          - 列出所有仓库
POST /{仓库名}/push             - 推送到指定仓库  
GET  /{仓库名}/pull             - 从指定仓库拉取
GET  /{仓库名}/status           - 获取仓库状态
```

## 新用户如何从零开始拉取项目

### 方法一：直接拉取（推荐）

```bash
# 1. 创建新的项目目录
mkdir 我的本地项目
cd 我的本地项目

# 2. 直接从远程拉取（会自动初始化本地仓库）
sgit pull http://localhost:3003 远程项目名
```

这个操作会：
- 自动初始化本地 `.sgit` 仓库
- 从远程仓库拉取所有文件
- 恢复所有文件到当前目录

### 方法二：手动初始化后拉取

```bash
# 1. 创建新的项目目录
mkdir 我的本地项目
cd 我的本地项目

# 2. 初始化本地仓库
sgit init

# 3. 从远程拉取
sgit pull http://localhost:3003 远程项目名
```

### 后续操作

拉取完成后，用户可以：

```bash
# 修改文件
echo "我的更改" >> 某个文件.txt

# 提交更改
sgit commit "添加了我的更改"

# 推送回远程
sgit push http://localhost:3003 项目名
```

## 常用操作示例

```bash
# 查看远程有哪些项目
sgit list-repos http://localhost:3003

# 克隆一个项目
mkdir 项目副本 && cd 项目副本
sgit pull http://localhost:3003 原项目名

# 查看项目状态和历史
sgit status
sgit log

# 创建新项目并上传
mkdir 新项目 && cd 新项目
sgit init
echo "Hello World" > hello.txt
sgit commit "初始提交"
sgit push http://localhost:3003 新项目名
```

## 卸载

```bash
npm uninstall -g simple-git-tool
```

## 技术特点

- **轻量级**: 约 400 行代码实现核心功能
- **无依赖**: 仅使用 Node.js 内置模块
- **简单易用**: 类似 Git 的命令界面
- **多项目**: 一个服务器管理多个独立项目
- **自动初始化**: Pull 操作自动创建本地仓库
- **完整快照**: 每次提交存储完整文件副本，无差异压缩