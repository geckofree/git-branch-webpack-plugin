```
# Git Branch Webpack Plugin

Webpack plugin that injects the current git branch name as a global variable.

## Installation

```bash
npm install git-branch-webpack-plugin --save-dev
```

## Usage

```javascript
const GitBranchWebpackPlugin = require('git-branch-webpack-plugin');

module.exports = {
  plugins: [
    new GitBranchWebpackPlugin({
      variableName: '__BRANCH__', // default
      silent: false               // default
    })
  ]
};
```

Now you can use `__BRANCH__` in your code:

```javascript
console.log(__BRANCH__); // e.g., "main", "develop", "feature/new-feature"
```

## Options

- `variableName` (string) - Name of the global variable (default: `__BRANCH__`)
- `silent` (boolean) - Disable console logs (default: `false`)

## Features

- Automatically detects current git branch
- Updates branch name in watch mode when switching branches
- Returns `'unknown'` if git detection fails
```