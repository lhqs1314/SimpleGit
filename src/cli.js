#!/usr/bin/env node

const Repository = require('./repository');
const Remote = require('./remote');
const path = require('path');

class CLI {
    constructor() {
        this.repo = new Repository();
    }

    async run() {
        const args = process.argv.slice(2);
        
        if (args.length === 0) {
            this.showHelp();
            return;
        }

        const command = args[0];
        
        try {
            switch (command) {
                case 'init':
                    this.init();
                    break;
                case 'commit':
                    this.commit(args.slice(1));
                    break;
                case 'log':
                    this.log(args.slice(1));
                    break;
                case 'status':
                    this.status();
                    break;
                case 'checkout':
                    this.checkout(args.slice(1));
                    break;
                case 'push':
                    await this.push(args.slice(1));
                    break;
                case 'pull':
                    await this.pull(args.slice(1));
                    break;
                case 'remote':
                    await this.remote(args.slice(1));
                    break;
                case 'list-repos':
                    await this.listRemoteRepositories(args.slice(1));
                    break;
                default:
                    console.log(`Unknown command: ${command}`);
                    this.showHelp();
            }
        } catch (error) {
            console.error(`Error: ${error.message}`);
            process.exit(1);
        }
    }

    showHelp() {
        console.log(`Simple Git - A simplified version control system

Usage:
  sgit <command> [options]

Commands:
  init                    Initialize a new repository
  commit <message>        Commit current changes
  log [limit]             Show commit history
  status                  Show repository status
  checkout <commit-hash>  Checkout specific commit
  push <remote-url> <repo-name>     Push to remote repository
  pull <remote-url> <repo-name>     Pull from remote repository
  remote status <url> <repo-name>   Check remote repository status
  list-repos <remote-url>           List repositories on remote server

Examples:
  sgit init
  sgit commit "Initial commit"
  sgit log 5
  sgit push http://localhost:3003 my-project
  sgit pull http://localhost:3003 my-project
  sgit list-repos http://localhost:3003
`);
    }

    init() {
        const initialized = this.repo.init();
        if (!initialized) {
            console.log('Repository already exists');
        }
    }

    commit(args) {
        if (args.length === 0) {
            throw new Error('Commit message required');
        }
        
        const message = args.join(' ');
        this.repo.commit(message);
    }

    log(args) {
        const limit = args.length > 0 ? parseInt(args[0]) || 10 : 10;
        const commits = this.repo.log(limit);
        
        if (commits.length === 0) {
            console.log('No commits found');
            return;
        }

        for (const commit of commits) {
            console.log(`Commit: ${commit.hash.substring(0, 8)}`);
            console.log(`Author: ${commit.author}`);
            console.log(`Date: ${new Date(commit.timestamp).toLocaleString()}`);
            console.log(`Message: ${commit.message}`);
            console.log(`Files: ${Object.keys(commit.files).length}`);
            console.log('');
        }
    }

    status() {
        const status = this.repo.status();
        
        console.log(`Branch: ${status.branch}`);
        console.log(`Commit: ${status.commit || 'none'}`);
        console.log(`Files: ${status.files}`);
        
        if (status.modified && status.modified.length > 0) {
            console.log(`\nModified files: ${status.modified.length}`);
            status.modified.forEach(file => console.log(`  M ${file}`));
        }
        
        if (status.untracked && status.untracked.length > 0) {
            console.log(`\nUntracked files: ${status.untracked.length}`);
            status.untracked.forEach(file => console.log(`  ? ${file}`));
        }
        
        if (status.deleted && status.deleted.length > 0) {
            console.log(`\nDeleted files: ${status.deleted.length}`);
            status.deleted.forEach(file => console.log(`  D ${file}`));
        }
    }

    checkout(args) {
        if (args.length === 0) {
            throw new Error('Commit hash required');
        }
        
        const commitHash = args[0];
        this.repo.checkout(commitHash);
    }

    async push(args) {
        if (args.length < 2) {
            throw new Error('Remote URL and repository name required');
        }
        
        const remoteUrl = args[0];
        const repoName = args[1];
        const remote = new Remote(remoteUrl, repoName);
        
        console.log('Preparing data for push...');
        const data = this.repo.prepareForPush();
        
        console.log('Pushing to remote...');
        const result = await remote.push(data, repoName);
        
        console.log(`Push successful: ${result.message || 'Data uploaded'}`);
    }

    async pull(args) {
        if (args.length < 2) {
            throw new Error('Remote URL and repository name required');
        }
        
        const remoteUrl = args[0];
        const repoName = args[1];
        const remote = new Remote(remoteUrl, repoName);
        
        console.log('Pulling from remote...');
        const data = await remote.pull(repoName);
        
        if (!data) {
            console.log('No remote repository found');
            return;
        }
        
        console.log('Applying remote changes...');
        const commitHash = this.repo.pull(data);
        
        console.log(`Pull successful: ${commitHash.substring(0, 8)}`);
    }

    async remote(args) {
        if (args.length < 3) {
            throw new Error('Usage: sgit remote <action> <url> <repo-name>');
        }
        
        const action = args[0];
        const remoteUrl = args[1];
        const repoName = args[2];
        
        if (action === 'status') {
            const remote = new Remote(remoteUrl, repoName);
            const status = await remote.status(repoName);
            
            if (!status) {
                console.log('Remote repository not found');
                return;
            }
            
            console.log(`Remote repository status for ${repoName}:`);
            console.log(`Repository: ${status.repository}`);
            console.log(`Commit: ${status.commit || 'none'}`);
            console.log(`Files: ${status.files || 0}`);
            console.log(`Last updated: ${status.lastUpdate || 'unknown'}`);
        } else {
            throw new Error(`Unknown remote action: ${action}`);
        }
    }
    
    async listRemoteRepositories(args) {
        if (args.length === 0) {
            throw new Error('Remote URL required');
        }
        
        const remoteUrl = args[0];
        const remote = new Remote(remoteUrl);
        
        console.log('Fetching repository list...');
        const result = await remote.listRepositories();
        
        console.log(`\nRemote repositories on ${remoteUrl}:`);
        if (result.repositories && result.repositories.length > 0) {
            result.repositories.forEach((repo, index) => {
                console.log(`  ${index + 1}. ${repo}`);
            });
            console.log(`\nTotal: ${result.count} repositories`);
        } else {
            console.log('No repositories found');
        }
    }
}

// Run CLI if this file is executed directly
if (require.main === module) {
    const cli = new CLI();
    cli.run().catch(error => {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    });
}

module.exports = CLI;