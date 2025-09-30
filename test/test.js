const fs = require('fs');
const path = require('path');
const Repository = require('../src/repository');
const SimpleGitServer = require('../src/server');

// Test utilities
function cleanup(dir) {
    if (fs.existsSync(dir)) {
        fs.rmSync(dir, { recursive: true, force: true });
    }
}

function createTestFile(filePath, content) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, content);
}

// Test repository operations
function testRepository() {
    console.log('Testing Repository...');
    
    const testDir = './test-repo';
    cleanup(testDir);
    fs.mkdirSync(testDir);
    
    const repo = new Repository(testDir);
    
    // Test init
    console.log('  ✓ Testing init...');
    repo.init();
    
    // Test commit
    console.log('  ✓ Testing commit...');
    createTestFile(path.join(testDir, 'hello.txt'), 'Hello World');
    createTestFile(path.join(testDir, 'sub/file.txt'), 'Nested file');
    
    const commitHash = repo.commit('Initial commit', 'Test User');
    console.log(`    Commit: ${commitHash.substring(0, 8)}`);
    
    // Test status
    console.log('  ✓ Testing status...');
    const status = repo.status();
    console.log(`    Files: ${status.files}, Modified: ${status.modified.length}`);
    
    // Test log
    console.log('  ✓ Testing log...');
    const commits = repo.log(5);
    console.log(`    Commits: ${commits.length}`);
    
    // Test second commit
    console.log('  ✓ Testing second commit...');
    createTestFile(path.join(testDir, 'hello.txt'), 'Hello World Updated');
    const secondCommit = repo.commit('Update hello.txt', 'Test User');
    console.log(`    Second commit: ${secondCommit.substring(0, 8)}`);
    
    // Test checkout
    console.log('  ✓ Testing checkout...');
    repo.checkout(commitHash);
    const content = fs.readFileSync(path.join(testDir, 'hello.txt'), 'utf-8');
    console.log(`    Content after checkout: "${content}"`);
    
    cleanup(testDir);
    console.log('Repository tests passed!\n');
}

// Test remote operations
async function testRemote() {
    console.log('Testing Remote operations...');
    
    const serverDir = './test-server';
    const clientDir = './test-client';
    
    cleanup(serverDir);
    cleanup(clientDir);
    
    // Start server
    console.log('  ✓ Starting test server...');
    const server = new SimpleGitServer(3001, serverDir);
    const httpServer = server.start();
    
    // Wait a bit for server to start
    await new Promise(resolve => setTimeout(resolve, 100));
    
    try {
        // Create client repository
        console.log('  ✓ Creating client repository...');
        fs.mkdirSync(clientDir);
        const clientRepo = new Repository(clientDir);
        clientRepo.init();
        
        createTestFile(path.join(clientDir, 'test.txt'), 'Test content');
        createTestFile(path.join(clientDir, 'data.json'), '{"test": true}');
        
        clientRepo.commit('Test commit', 'Test User');
        
        // Test push
        console.log('  ✓ Testing push...');
        const pushData = clientRepo.prepareForPush();
        
        const Remote = require('../src/remote');
        const remote = new Remote('http://localhost:3001');
        
        const pushResult = await remote.push(pushData);
        console.log(`    Push result: ${pushResult.success ? 'Success' : 'Failed'}`);
        
        // Test pull
        console.log('  ✓ Testing pull...');
        const pullData = await remote.pull();
        console.log(`    Pulled commit: ${pullData.head.substring(0, 8)}`);
        
        // Test status
        console.log('  ✓ Testing remote status...');
        const remoteStatus = await remote.status();
        console.log(`    Remote files: ${remoteStatus.files}`);
        
        console.log('Remote tests passed!\n');
        
    } finally {
        httpServer.close();
        cleanup(serverDir);
        cleanup(clientDir);
    }
}

// Run all tests
async function runTests() {
    console.log('Simple Git Test Suite\n');
    
    try {
        testRepository();
        await testRemote();
        
        console.log('All tests passed! ✅');
        
    } catch (error) {
        console.error('Test failed:', error);
        process.exit(1);
    }
}

// Run tests if this file is executed directly
if (require.main === module) {
    runTests();
}

module.exports = { runTests };