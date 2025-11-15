const { execSync } = require('child_process');

class GitBranchWebpackPlugin {
    constructor(options = {}) {
        this.options = {
            variableName: '__BRANCH__',
            silent: false,
            ...options
        };

        this.currentBranch = null;
    }

    getCurrentBranch() {
        try {
            const branch = execSync('git rev-parse --abbrev-ref HEAD', {
                encoding: 'utf8',
                stdio: ['pipe', 'pipe', 'ignore']
            }).trim();

            return branch;
        } catch (error) {
            if (!this.options.silent) {
                console.error('Git branch detection failed:', error.message);
            }
            return 'unknown';
        }
    }

    log(message) {
        if (!this.options.silent) {
            console.log(`[GitBranchPlugin] ${message}`);
        }
    }

    apply(compiler) {
        this.currentBranch = this.getCurrentBranch();
        this.log(`Initialized with branch: ${this.currentBranch}`);

        this.setupDefinePlugin(compiler);

        compiler.hooks.watchRun.tap('GitBranchWebpackPlugin', () => {
            const newBranch = this.getCurrentBranch();

            if (newBranch !== this.currentBranch) {
                this.log(`Branch changed: ${this.currentBranch} → ${newBranch}`);
                this.currentBranch = newBranch;
                this.updateBranchDefinition(newBranch);
            }
        });
    }

    setupDefinePlugin(compiler) {
        const webpack = compiler.webpack || require('webpack');

        if (!compiler.options.plugins) {
            compiler.options.plugins = [];
        }

        const definePlugin = compiler.options.plugins.find(plugin =>
            plugin && plugin.constructor && plugin instanceof webpack.DefinePlugin
        );

        if (definePlugin) {
            this.definePlugin = definePlugin;
            definePlugin.definitions = definePlugin.definitions || {};
            this.updateBranchDefinition(this.currentBranch);
        } else {
            this.definePlugin = new webpack.DefinePlugin({
                [this.options.variableName]: JSON.stringify(this.currentBranch)
            });
            compiler.options.plugins.push(this.definePlugin);

            if (typeof this.definePlugin.apply === 'function') {
                this.definePlugin.apply(compiler);
            }
        }
    }

    updateBranchDefinition(branch) {
        if (this.definePlugin && this.definePlugin.definitions) {
            this.definePlugin.definitions[this.options.variableName] = JSON.stringify(branch);
        }
    }
}

module.exports = GitBranchWebpackPlugin;
