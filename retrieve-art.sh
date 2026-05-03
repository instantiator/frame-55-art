#!/bin/bash

# Get the directory where the script is located
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

# Install dependencies if node_modules doesn't exist
if [ ! -d "$DIR/retrieve-art/node_modules" ]; then
    echo "node_modules not found. Installing dependencies..."
    (cd "$DIR/retrieve-art" && npm install)
fi

# Pass all arguments to the application, executing from the current directory
# Use the local ts-node installed in the module
npx --prefix "$DIR/retrieve-art" ts-node "$DIR/retrieve-art/app.ts" "$@"
