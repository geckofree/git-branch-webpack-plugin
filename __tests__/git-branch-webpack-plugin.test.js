jest.mock('child_process', () => ({
    execSync: jest.fn()
}));

const { execSync } = require('child_process');
const GitBranchWebpackPlugin = require('../src/index');

const createCompiler = () => {
    const tapMock = jest.fn();

    class FakeDefinePlugin {
        constructor(definitions) {
            this.definitions = definitions;
            this.applied = false;
        }

        apply() {
            this.applied = true;
        }
    }

    const compiler = {
        webpack: { DefinePlugin: FakeDefinePlugin },
        options: { plugins: [] },
        hooks: {
            watchRun: {
                tap: tapMock
            }
        }
    };

    return { compiler, tapMock };
};

beforeEach(() => {
    execSync.mockReset();
});

describe('GitBranchWebpackPlugin', () => {
    test('defines branch variable on apply', () => {
        execSync.mockReturnValueOnce('feature/foo\n');
        const plugin = new GitBranchWebpackPlugin({ variableName: '__BRANCH__' });
        const { compiler } = createCompiler();

        plugin.apply(compiler);

        expect(compiler.options.plugins).toHaveLength(1);
        const definePlugin = compiler.options.plugins[0];
        expect(definePlugin.definitions.__BRANCH__).toBe(JSON.stringify('feature/foo'));
        expect(definePlugin.applied).toBe(true);
        expect(compiler.hooks.watchRun.tap).toHaveBeenCalled();
    });

    test('reuses existing DefinePlugin and updates value in watch mode', () => {
        execSync.mockReturnValueOnce('main\n');
        const { compiler } = createCompiler();
        const plugin = new GitBranchWebpackPlugin({ variableName: '__BRANCH__' });
        const existingPlugin = new compiler.webpack.DefinePlugin({});
        compiler.options.plugins.push(existingPlugin);

        plugin.apply(compiler);
        expect(existingPlugin.definitions.__BRANCH__).toBe(JSON.stringify('main'));

        const watchHandler = compiler.hooks.watchRun.tap.mock.calls[0][1];
        execSync.mockReturnValueOnce('feature/bar\n');
        watchHandler();

        expect(existingPlugin.definitions.__BRANCH__).toBe(JSON.stringify('feature/bar'));
    });

    test('falls back to unknown branch when git command fails', () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        execSync.mockImplementation(() => {
            throw new Error('git failed');
        });

        const plugin = new GitBranchWebpackPlugin();
        const { compiler } = createCompiler();

        plugin.apply(compiler);

        const definePlugin = compiler.options.plugins[0];
        expect(definePlugin.definitions.__BRANCH__).toBe(JSON.stringify('unknown'));
        expect(consoleSpy).toHaveBeenCalled();
        consoleSpy.mockRestore();
    });
});
