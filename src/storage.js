const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class Storage {
    constructor(repoPath = '.') {
        this.repoPath = repoPath;
        this.sgitPath = path.join(repoPath, '.sgit');
        this.objectsPath = path.join(this.sgitPath, 'objects');
        this.refsPath = path.join(this.sgitPath, 'refs');
        this.headPath = path.join(this.sgitPath, 'HEAD');
    }

    init() {
        if (!fs.existsSync(this.sgitPath)) {
            fs.mkdirSync(this.sgitPath, { recursive: true });
            fs.mkdirSync(this.objectsPath, { recursive: true });
            fs.mkdirSync(this.refsPath, { recursive: true });
            
            // Initialize HEAD to point to main branch
            fs.writeFileSync(this.headPath, 'ref: refs/heads/main\n');
            
            console.log('Initialized empty simple-git repository');
            return true;
        }
        return false;
    }

    isRepository() {
        return fs.existsSync(this.sgitPath);
    }

    // Calculate SHA-1 hash for content
    hash(content) {
        return crypto.createHash('sha1').update(content).digest('hex');
    }

    // Store file content by hash
    storeObject(content) {
        const hash = this.hash(content);
        const objectPath = path.join(this.objectsPath, hash);
        
        if (!fs.existsSync(objectPath)) {
            fs.writeFileSync(objectPath, content);
        }
        
        return hash;
    }

    // Retrieve file content by hash
    getObject(hash) {
        const objectPath = path.join(this.objectsPath, hash);
        
        if (fs.existsSync(objectPath)) {
            return fs.readFileSync(objectPath);
        }
        
        return null;
    }

    // Store commit object
    storeCommit(commitData) {
        const commitJson = JSON.stringify(commitData, null, 2);
        const hash = this.storeObject(commitJson);
        
        return hash;
    }

    // Retrieve commit object
    getCommit(hash) {
        const content = this.getObject(hash);
        
        if (content) {
            return JSON.parse(content.toString());
        }
        
        return null;
    }

    // Update HEAD reference
    updateHead(commitHash) {
        const headContent = fs.readFileSync(this.headPath, 'utf-8').trim();
        
        if (headContent.startsWith('ref: ')) {
            const refPath = headContent.substring(5);
            const refFile = path.join(this.sgitPath, refPath);
            
            fs.mkdirSync(path.dirname(refFile), { recursive: true });
            fs.writeFileSync(refFile, commitHash + '\n');
        } else {
            fs.writeFileSync(this.headPath, commitHash + '\n');
        }
    }

    // Get current HEAD commit hash
    getHead() {
        if (!fs.existsSync(this.headPath)) {
            return null;
        }

        const headContent = fs.readFileSync(this.headPath, 'utf-8').trim();
        
        if (headContent.startsWith('ref: ')) {
            const refPath = headContent.substring(5);
            const refFile = path.join(this.sgitPath, refPath);
            
            if (fs.existsSync(refFile)) {
                return fs.readFileSync(refFile, 'utf-8').trim();
            }
        } else {
            return headContent;
        }
        
        return null;
    }

    // Scan working directory for files (excluding .sgit)
    scanFiles() {
        const files = {};
        
        const scanDir = (dirPath, relativePath = '') => {
            const items = fs.readdirSync(dirPath);
            
            for (const item of items) {
                if (item === '.sgit') continue;
                
                const itemPath = path.join(dirPath, item);
                const relativeItemPath = path.join(relativePath, item);
                const stat = fs.statSync(itemPath);
                
                if (stat.isFile()) {
                    const content = fs.readFileSync(itemPath);
                    files[relativeItemPath] = {
                        hash: this.hash(content),
                        size: stat.size,
                        modified: stat.mtime.getTime()
                    };
                } else if (stat.isDirectory()) {
                    scanDir(itemPath, relativeItemPath);
                }
            }
        };
        
        scanDir(this.repoPath);
        return files;
    }
}

module.exports = Storage;