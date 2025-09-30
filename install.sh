#!/bin/bash

# Simple Git Installation Script

echo "Installing Simple Git globally..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "Error: npm is not installed. Please install npm first."
    exit 1
fi

# Install the package globally
npm install -g .

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Simple Git installed successfully!"
    echo ""
    echo "You can now use 'sgit' command globally:"
    echo "  sgit init                    # Initialize repository"
    echo "  sgit commit 'message'        # Commit changes"
    echo "  sgit log                     # View history"
    echo "  sgit status                  # Check status"
    echo "  sgit push <url>              # Push to remote"
    echo "  sgit pull <url>              # Pull from remote"
    echo ""
    echo "To start a remote server:"
    echo "  sgit-server [port] [repo-path]"
    echo ""
    echo "To uninstall: npm uninstall -g simple-git-tool"
else
    echo "❌ Installation failed. Please check the error messages above."
    exit 1
fi