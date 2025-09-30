# Simple Git

A simplified git implementation with core upload/download functionality. No merge conflicts - remote changes always override local ones.

## Features

- Initialize repositories
- Commit changes (store complete file snapshots)
- View commit history
- Checkout specific commits
- Push/pull to/from remote repositories
- Simple HTTP-based remote protocol

## Installation

### Global Installation (Recommended)

```bash
cd simple-git
./install.sh
```

Or manually:
```bash
npm install -g .
```

### Local Installation

```bash
cd simple-git
npm install
```

## Usage

### Global Commands (after installation)

```bash
# Initialize a new repository
sgit init

# Commit changes
sgit commit "Your commit message"

# View commit history
sgit log

# Check repository status
sgit status

# Checkout specific commit
sgit checkout <commit-hash>
```

### Remote Operations (Multi-Repository Server)

```bash
# Start a multi-repository server (in separate terminal)
sgit-server 3003

# List repositories on remote server
sgit list-repos http://localhost:3003

# Push to specific repository
sgit push http://localhost:3003 my-project

# Pull from specific repository
sgit pull http://localhost:3003 my-project

# Check remote repository status
sgit remote status http://localhost:3003 my-project
```

### Local Development Commands

```bash
# Initialize a new repository
node src/cli.js init

# Commit changes
node src/cli.js commit "Your commit message"

# View commit history
node src/cli.js log

# Check repository status
node src/cli.js status

# Checkout specific commit
node src/cli.js checkout <commit-hash>

# Multi-repo server operations
node src/cli.js push http://localhost:3003 repo-name
node src/cli.js pull http://localhost:3003 repo-name
node src/cli.js list-repos http://localhost:3003
```

## Architecture

- **Storage**: File-based storage with SHA-1 hashing
- **Repository**: Core git-like operations
- **Remote**: HTTP client for remote operations  
- **Server**: HTTP server supporting multiple repositories
- **CLI**: Command-line interface with multi-repo support

## Directory Structure

### Local Repository
```
.sgit/
├── objects/          # File content storage (by SHA-1 hash)
├── refs/heads/       # Branch references
└── HEAD              # Current branch/commit pointer
```

### Remote Server
```
remote-repos/
├── project-a/
│   └── .sgit/        # Project A repository
├── project-b/
│   └── .sgit/        # Project B repository
└── project-c/
    └── .sgit/        # Project C repository
```

## Conflict Resolution

This implementation uses a "last-write-wins" approach:
- Push operations overwrite remote state
- Pull operations overwrite local state
- No merge conflicts - simple and predictable

## Example Workflow

```bash
# Terminal 1: Start multi-repository server
sgit-server 3003

# Terminal 2: Create and push Project A
mkdir project-a && cd project-a
sgit init
echo "Project A Content" > readme.txt
sgit commit "Initial commit for Project A"
sgit push http://localhost:3003 project-a

# Terminal 3: Create and push Project B
cd ../
mkdir project-b && cd project-b
sgit init
echo "Project B Content" > readme.txt
sgit commit "Initial commit for Project B"
sgit push http://localhost:3003 project-b

# Terminal 4: List and clone projects
sgit list-repos http://localhost:3003
# Shows: project-a, project-b

mkdir clone-a && cd clone-a
sgit pull http://localhost:3003 project-a
# Now has Project A's files (auto-initializes repository)
```

## Multi-Repository Server API

```
GET  /                          - List all repositories
POST /{repo-name}/push          - Push to specific repository  
GET  /{repo-name}/pull          - Pull from specific repository
GET  /{repo-name}/status        - Get repository status
```

## Uninstallation

```bash
npm uninstall -g simple-git-tool
```