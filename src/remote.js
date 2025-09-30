const https = require('https');
const http = require('http');
const url = require('url');

class Remote {
    constructor(baseUrl, repoName = null) {
        this.baseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
        this.repoName = repoName;
    }

    // Push data to remote repository
    async push(data, repoName = null) {
        const targetRepo = repoName || this.repoName;
        if (!targetRepo) {
            throw new Error('Repository name is required for push operation');
        }
        
        return new Promise((resolve, reject) => {
            const pushUrl = `${this.baseUrl}/${targetRepo}/push`;
            const urlParts = url.parse(pushUrl);
            const isHttps = urlParts.protocol === 'https:';
            const httpModule = isHttps ? https : http;
            
            const postData = JSON.stringify(data);
            
            const options = {
                hostname: urlParts.hostname,
                port: urlParts.port || (isHttps ? 443 : 80),
                path: urlParts.path,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(postData)
                }
            };

            const req = httpModule.request(options, (res) => {
                let responseData = '';
                
                res.on('data', (chunk) => {
                    responseData += chunk;
                });
                
                res.on('end', () => {
                    if (res.statusCode === 200) {
                        try {
                            const response = JSON.parse(responseData);
                            resolve(response);
                        } catch (err) {
                            resolve({ success: true, message: responseData });
                        }
                    } else {
                        reject(new Error(`Push failed: ${res.statusCode} ${responseData}`));
                    }
                });
            });

            req.on('error', (err) => {
                reject(new Error(`Push request failed: ${err.message}`));
            });

            req.write(postData);
            req.end();
        });
    }

    // Pull data from remote repository
    async pull(repoName = null) {
        const targetRepo = repoName || this.repoName;
        if (!targetRepo) {
            throw new Error('Repository name is required for pull operation');
        }
        
        return new Promise((resolve, reject) => {
            const pullUrl = `${this.baseUrl}/${targetRepo}/pull`;
            const urlParts = url.parse(pullUrl);
            const isHttps = urlParts.protocol === 'https:';
            const httpModule = isHttps ? https : http;
            
            const options = {
                hostname: urlParts.hostname,
                port: urlParts.port || (isHttps ? 443 : 80),
                path: urlParts.path,
                method: 'GET'
            };

            const req = httpModule.request(options, (res) => {
                let responseData = '';
                
                res.on('data', (chunk) => {
                    responseData += chunk;
                });
                
                res.on('end', () => {
                    if (res.statusCode === 200) {
                        try {
                            const data = JSON.parse(responseData);
                            resolve(data);
                        } catch (err) {
                            reject(new Error(`Invalid JSON response: ${err.message}`));
                        }
                    } else if (res.statusCode === 404) {
                        resolve(null); // No remote repository
                    } else {
                        reject(new Error(`Pull failed: ${res.statusCode} ${responseData}`));
                    }
                });
            });

            req.on('error', (err) => {
                reject(new Error(`Pull request failed: ${err.message}`));
            });

            req.end();
        });
    }

    // Get remote repository status
    async status(repoName = null) {
        const targetRepo = repoName || this.repoName;
        if (!targetRepo) {
            throw new Error('Repository name is required for status operation');
        }
        
        return new Promise((resolve, reject) => {
            const statusUrl = `${this.baseUrl}/${targetRepo}/status`;
            const urlParts = url.parse(statusUrl);
            const isHttps = urlParts.protocol === 'https:';
            const httpModule = isHttps ? https : http;
            
            const options = {
                hostname: urlParts.hostname,
                port: urlParts.port || (isHttps ? 443 : 80),
                path: urlParts.path,
                method: 'GET'
            };

            const req = httpModule.request(options, (res) => {
                let responseData = '';
                
                res.on('data', (chunk) => {
                    responseData += chunk;
                });
                
                res.on('end', () => {
                    if (res.statusCode === 200) {
                        try {
                            const data = JSON.parse(responseData);
                            resolve(data);
                        } catch (err) {
                            reject(new Error(`Invalid JSON response: ${err.message}`));
                        }
                    } else if (res.statusCode === 404) {
                        resolve(null);
                    } else {
                        reject(new Error(`Status request failed: ${res.statusCode} ${responseData}`));
                    }
                });
            });

            req.on('error', (err) => {
                reject(new Error(`Status request failed: ${err.message}`));
            });

            req.end();
        });
    }
    
    // List all repositories on remote server
    async listRepositories() {
        return new Promise((resolve, reject) => {
            const listUrl = `${this.baseUrl}/`;
            const urlParts = url.parse(listUrl);
            const isHttps = urlParts.protocol === 'https:';
            const httpModule = isHttps ? https : http;
            
            const options = {
                hostname: urlParts.hostname,
                port: urlParts.port || (isHttps ? 443 : 80),
                path: urlParts.path,
                method: 'GET'
            };

            const req = httpModule.request(options, (res) => {
                let responseData = '';
                
                res.on('data', (chunk) => {
                    responseData += chunk;
                });
                
                res.on('end', () => {
                    if (res.statusCode === 200) {
                        try {
                            const data = JSON.parse(responseData);
                            resolve(data);
                        } catch (err) {
                            reject(new Error(`Invalid JSON response: ${err.message}`));
                        }
                    } else {
                        reject(new Error(`List repositories failed: ${res.statusCode} ${responseData}`));
                    }
                });
            });

            req.on('error', (err) => {
                reject(new Error(`List repositories request failed: ${err.message}`));
            });

            req.end();
        });
    }
}

module.exports = Remote;