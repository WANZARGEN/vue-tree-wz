/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('path');

module.exports = {
    lintOnSave: false,
    runtimeCompiler: true,
    devServer: {
        disableHostCheck: true,
        port: 8080,
    },
    css: {
        loaderOptions: {
            sass: {
                includePaths: ['./node_modules'],
            },
        },
    },
    configureWebpack: {
        resolve: {
            alias: {
                '@sb': path.resolve('./.storybook'),
                '@': path.resolve('./src'),
            },
        },
        devtool: 'source-map',
    },
    chainWebpack: (config) => {
        // These are some necessary steps changing the default webpack config of the Vue CLI
        // that need to be changed in order for Typescript based components to generate their
        // declaration (.d.ts) files.
        //
        // Discussed here https://github.com/vuejs/vue-cli/issues/1081
        if (process.env.NODE_ENV === 'production' && process.env.VUE_APP_BUILD_MOD === 'lib') {
            config.module.rule('ts').uses.delete('cache-loader');

            config.module
                .rule('ts')
                .use('ts-loader')
                .loader('ts-loader')
                .tap((opts) => {
                    opts.transpileOnly = false;
                    opts.happyPackMode = false;
                    opts.configFile = 'tsconfig.build.json';
                    return opts;
                });
        }
    },
    parallel: false,
};
