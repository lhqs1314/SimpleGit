const fs = require('fs');
const path = require('path');
const Storage = require('./storage');

class Repository {
    constructor(repoPath = '.') {
        this.storage = new Storage(repoPath);
        this.repoPath = repoPath;
    }

    init() {
        return this.storage.init();
    }

    isRepository() {
        return this.storage.isRepository();
    }

    // Create a new commit with current working directory state
    commit(message, author = 'Simple Git User') {
        if (!this.isRepository()) {
            throw new Error('Not a simple-git repository');
        }

        const files = this.storage.scanFiles();
        const fileHashes = {};
        
        // Store all file contents
        for (const [filePath, fileInfo] of Object.entries(files)) {
            const fullPath = path.join(this.repoPath, filePath);
            const content = fs.readFileSync(fullPath);
            const hash = this.storage.storeObject(content);
            fileHashes[filePath] = hash;
        }

        // Create commit object
        const parentCommit = this.storage.getHead();
        const timestamp = new Date().toISOString();
        
        const commitData = {
            message,
            author,
            timestamp,
            parent: parentCommit,
            files: fileHashes
        };

        // Store commit and update HEAD
        const commitHash = this.storage.storeCommit(commitData);
        this.storage.updateHead(commitHash);

        console.log(`Committed ${Object.keys(fileHashes).length} files`);
        console.log(`Commit: ${commitHash.substring(0, 8)}`);
        
        return commitHash;
    }

    // Get commit history
    log(limit = 10) {
        if (!this.isRepository()) {
            throw new Error('Not a simple-git repository');
        }

        const commits = [];
        let currentHash = this.storage.getHead();
        
        while (currentHash && commits.length < limit) {
            const commit = this.storage.getCommit(currentHash);
            if (!commit) break;
            
            commits.push({
                hash: currentHash,
                ...commit
            });
            
            currentHash = commit.parent;
        }
        
        return commits;
    }

    // Reset working directory to specific commit
    checkout(commitHash) {
        if (!this.isRepository()) {
            throw new Error('Not a simple-git repository');
        }

        const commit = this.storage.getCommit(commitHash);
        if (!commit) {
            throw new Error(`Commit ${commitHash} not found`);
        }

        // Clear working directory (except .sgit)
        this.clearWorkingDirectory();

        // Restore files from commit
        for (const [filePath, fileHash] of Object.entries(commit.files)) {
            const content = this.storage.getObject(fileHash);
            if (content) {
                const fullPath = path.join(this.repoPath, filePath);
                fs.mkdirSync(path.dirname(fullPath), { recursive: true });
                fs.writeFileSync(fullPath, content);
            }
        }

        // Update HEAD to point to this commit
        this.storage.updateHead(commitHash);
        
        console.log(`Checked out commit ${commitHash.substring(0, 8)}`);
        console.log(`Restored ${Object.keys(commit.files).length} files`);
    }

    // Pull from remote (overwrite local with remote)
    pull(remoteData) {
        // Auto-initialize if not a repository
        if (!this.isRepository()) {
            this.init();
            console.log('Auto-initialized repository for pull operation');
        }

        if (!remoteData || !remoteData.commit) {
            throw new Error('Invalid remote data');
        }

        // Store remote commit and all its objects
        const commitHash = this.storage.storeCommit(remoteData.commit);
        
        // Store all file objects
        for (const [filePath, fileData] of Object.entries(remoteData.files)) {
            this.storage.storeObject(Buffer.from(fileData, 'base64'));
        }

        // Checkout the remote commit
        this.checkout(commitHash);
        
        return commitHash;
    }

    // Prepare data for push to remote
    prepareForPush() {
        if (!this.isRepository()) {
            throw new Error('Not a simple-git repository');
        }

        const headHash = this.storage.getHead();
        if (!headHash) {
            throw new Error('No commits to push');
        }

        const commit = this.storage.getCommit(headHash);
        const files = {};

        // Collect all file contents
        for (const [filePath, fileHash] of Object.entries(commit.files)) {
            const content = this.storage.getObject(fileHash);
            if (content) {
                files[filePath] = content.toString('base64');
            }
        }

        return {
            commit,
            files,
            head: headHash
        };
    }

    // Clear working directory except .sgit
    clearWorkingDirectory() {
        const items = fs.readdirSync(this.repoPath);
        
        for (const item of items) {
            if (item === '.sgit') continue;
            
            const itemPath = path.join(this.repoPath, item);
            const stat = fs.statSync(itemPath);
            
            if (stat.isFile()) {
                fs.unlinkSync(itemPath);
            } else if (stat.isDirectory()) {
                fs.rmSync(itemPath, { recursive: true, force: true });
            }
        }
    }

    // Get repository status
    status() {
        if (!this.isRepository()) {
            throw new Error('Not a simple-git repository');
        }

        const headHash = this.storage.getHead();
        const currentFiles = this.storage.scanFiles();
        
        if (!headHash) {
            return {
                branch: 'main',
                commit: null,
                files: Object.keys(currentFiles).length,
                untracked: Object.keys(currentFiles)
            };
        }

        const headCommit = this.storage.getCommit(headHash);
        const trackedFiles = headCommit.files || {};
        
        const modified = [];
        const untracked = [];
        
        // Check for modified and untracked files
        for (const [filePath, fileInfo] of Object.entries(currentFiles)) {
            if (trackedFiles[filePath]) {
                const trackedHash = trackedFiles[filePath];
                if (fileInfo.hash !== trackedHash) {
                    modified.push(filePath);
                }
            } else {
                untracked.push(filePath);
            }
        }
        
        // Check for deleted files
        const deleted = [];
        for (const filePath of Object.keys(trackedFiles)) {
            if (!currentFiles[filePath]) {
                deleted.push(filePath);
            }
        }

        return {
            branch: 'main',
            commit: headHash.substring(0, 8),
            files: Object.keys(currentFiles).length,
            modified,
            untracked,
            deleted
        };
    }
}

module.exports = Repository;