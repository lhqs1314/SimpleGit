#!/usr/bin/env node

const http = require('http');
const fs = require('fs');
const path = require('path');
const Repository = require('./repository');

class SimpleGitServer {
    constructor(port = 3003, basePath = './remote-repos') {
        this.port = port;
        this.basePath = basePath;
        this.repositories = new Map();
        this.initBasePath();
    }

    initBasePath() {
        // Create base path for all repositories
        if (!fs.existsSync(this.basePath)) {
            fs.mkdirSync(this.basePath, { recursive: true });
        }
        console.log(`Multi-repo server base path: ${path.resolve(this.basePath)}`);
    }

    getRepository(repoName) {
        if (!repoName) {
            throw new Error('Repository name is required');
        }
        
        if (this.repositories.has(repoName)) {
            return this.repositories.get(repoName);
        }
        
        const repoPath = path.join(this.basePath, repoName);
        const repo = new Repository(repoPath);
        
        // Create directory if it doesn't exist
        if (!fs.existsSync(repoPath)) {
            fs.mkdirSync(repoPath, { recursive: true });
        }
        
        // Initialize repository if not exists
        if (!repo.isRepository()) {
            repo.init();
            console.log(`Initialized repository: ${repoName}`);
        }
        
        this.repositories.set(repoName, repo);
        return repo;
    }

    listRepositories() {
        const repos = [];
        if (fs.existsSync(this.basePath)) {
            const items = fs.readdirSync(this.basePath);
            for (const item of items) {
                const itemPath = path.join(this.basePath, item);
                if (fs.statSync(itemPath).isDirectory()) {
                    const sgitPath = path.join(itemPath, '.sgit');
                    if (fs.existsSync(sgitPath)) {
                        repos.push(item);
                    }
                }
            }
        }
        return repos;
    }

    start() {
        const server = http.createServer((req, res) => {
            // Enable CORS
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

            if (req.method === 'OPTIONS') {
                res.writeHead(200);
                res.end();
                return;
            }

            try {
                const url = new URL(req.url, `http://localhost:${this.port}`);
                const pathParts = url.pathname.split('/').filter(Boolean);
                
                if (pathParts.length === 0) {
                    this.handleListRepositories(req, res);
                } else if (pathParts.length === 2) {
                    const [repoName, action] = pathParts;
                    
                    if (action === 'push' && req.method === 'POST') {
                        this.handlePush(req, res, repoName);
                    } else if (action === 'pull' && req.method === 'GET') {
                        this.handlePull(req, res, repoName);
                    } else if (action === 'status' && req.method === 'GET') {
                        this.handleStatus(req, res, repoName);
                    } else {
                        res.writeHead(404, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: 'Action not found' }));
                    }
                } else {
                    res.writeHead(404, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Invalid URL format. Use /{repo}/{action}' }));
                }
            } catch (error) {
                console.error('Server error:', error);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Internal server error' }));
            }
        });

        server.listen(this.port, () => {
            console.log(`Simple Git multi-repo server running on port ${this.port}`);
            console.log(`Base path: ${path.resolve(this.basePath)}`);
            console.log('Endpoints:');
            console.log(`  GET  http://localhost:${this.port}/                    - List repositories`);
            console.log(`  POST http://localhost:${this.port}/{repo}/push        - Push to repository`);
            console.log(`  GET  http://localhost:${this.port}/{repo}/pull        - Pull from repository`);
            console.log(`  GET  http://localhost:${this.port}/{repo}/status      - Repository status`);
        });

        return server;
    }

    handleListRepositories(req, res) {
        try {
            const repos = this.listRepositories();
            
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                repositories: repos,
                count: repos.length
            }));
            
        } catch (error) {
            console.error('List repositories error:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: error.message }));
        }
    }

    handlePush(req, res, repoName) {
        let body = '';
        
        req.on('data', chunk => {
            body += chunk.toString();
        });
        
        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                
                if (!data.commit || !data.files) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Invalid push data' }));
                    return;
                }

                // Apply the pushed data to remote repository
                const repo = this.getRepository(repoName);
                const commitHash = repo.pull(data);
                
                console.log(`Received push to ${repoName}: ${commitHash.substring(0, 8)}`);
                console.log(`Files: ${Object.keys(data.files).length}`);
                
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: true,
                    message: 'Push successful',
                    commit: commitHash
                }));
                
            } catch (error) {
                console.error('Push error:', error);
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: error.message }));
            }
        });
    }

    handlePull(req, res, repoName) {
        try {
            const repo = this.getRepository(repoName);
            
            if (!repo.storage.getHead()) {
                res.writeHead(404, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'No commits available' }));
                return;
            }

            const data = repo.prepareForPush();
            
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(data));
            
            console.log(`Served pull request for ${repoName}: ${data.head.substring(0, 8)}`);
            
        } catch (error) {
            console.error('Pull error:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: error.message }));
        }
    }

    handleStatus(req, res, repoName) {
        try {
            const repo = this.getRepository(repoName);
            const status = repo.status();
            const head = repo.storage.getHead();
            
            const responseData = {
                repository: repoName,
                commit: head ? head.substring(0, 8) : null,
                files: status.files,
                lastUpdate: head ? new Date().toISOString() : null,
                branch: status.branch
            };
            
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(responseData));
            
        } catch (error) {
            console.error('Status error:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: error.message }));
        }
    }
}

// Run server if this file is executed directly
if (require.main === module) {
    const port = process.argv[2] ? parseInt(process.argv[2]) : 3003;
    const basePath = process.argv[3] || './remote-repos';
    
    const server = new SimpleGitServer(port, basePath);
    server.start();
}

module.exports = SimpleGitServer;