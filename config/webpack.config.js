const fs = require('fs');
const path = require('path');
const webpack = require('webpack');
const TerserPlugin = require('terser-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const OptimizeCssAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const BrowserSyncPlugin = require('browser-sync-webpack-plugin');

// Project directory for libraries
const libsDir = path.resolve(process.cwd(), 'dist', 'libs') + '/';
// Global variables
const isDevMode = process.env.NODE_ENV !== 'production';


/**
 * Build multiple entries for different .js files
 */
buildPageEntries = () => {
    // Configuration for pages and dlls
    const PAGES = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'config.json'))).pages;
    const entries = {};
    PAGES.forEach(el => {
        if (el.isEditing) {
            const path = ['pages', el.name, el.root].join('/');
            entries[path] = './src/pages/' + el.name + '/' + 'index' + '.js';
        }
    });
    return entries;
}
/**
 * Build multiple dll plugins for seperating dependencies
 */
buildDllPlugins = () => {
    const DLLS = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'config.json'))).dlls;
    let instances = [];
    DLLS.forEach(dll => {
        instances.push(new webpack.DllReferencePlugin({
            context: process.cwd(),
            manifest: require(libsDir + dll.manifest),
        }));
    });
    return instances;
}
/**
 * @param webpackEnv: production / development
 */
module.exports = function (webpackEnv, isWatching) {
    return {
        mode: webpackEnv,
        watch: isWatching,
        entry: buildPageEntries(),
        output: {
            path: path.resolve(process.cwd(), 'dist'),
            filename: '[name].js',
        },
        resolve: {
            extensions: ['.js', '.jsx']
        },
        module: {
            rules: [
                {
                    // Match all JSX, Flow, TypeScript, and some ESnext files.
                    test: /\.(js|mjs|jsx|ts|tsx)$/,
                    loader: require.resolve('babel-loader'),
                    options: {
                        babelrc: false,
                        configFile: false,
                        presets: [
                            require.resolve('@babel/preset-env'),
                            require.resolve('@babel/preset-react')
                        ],
                        plugins: [
                            // For ES6 arrow functions
                            require.resolve('@babel/plugin-proposal-class-properties'),
                            // For async / await functions
                            require('@babel/plugin-transform-runtime').default
                        ]
                    },
                    // Don't grab all .js files from node_modules
                    exclude: /(node_modules|bower_components)/
                },
                {
                    // Match all .sass, .scss, .css files
                    test: /\.(sa|sc|c)ss$/,
                    use: [
                        {
                            // Step 2: Extract css to files
                            loader: MiniCssExtractPlugin.loader,
                            options: {
                                publicPath: '../',
                                // Only enable hot reloading in development
                                hmr: process.env.NODE_ENV === 'development',
                                // if hmr does not work, this is a forceful method.
                                reloadAll: true,
                            },
                        },
                        {
                            // Step 1: Turn css into commonjs
                            loader: require.resolve('css-loader'),
                            options: {
                                modules: true,
                                // Hash the class name with an unique hash code
                                localIdentName: isDevMode ? '[name]_[hash:base64:5]' : '[hash:base64:10]'
                            }
                        },
                        {
                            loader: require.resolve('sass-loader'),
                            options: {
                                modules: true,
                                localIdentName: isDevMode ? '[name]_[hash:base64:5]' : '[hash:base64:10]'
                            }
                        }
                    ],
                },
            ]
        },
        plugins: [
            new MiniCssExtractPlugin({
                filename: isDevMode ? '[name].css' : '[name].[hash].css',
                chunkFilename: isDevMode ? '[id].css' : '[id].[hash].css',
            }),
            new BrowserSyncPlugin({
                host: 'localhost',
                port: 5000
            }),
            ...buildDllPlugins()
        ],
        optimization: {
            minimizer: [
                // Minify .css files
                new OptimizeCssAssetsPlugin(),
                // Minify .js files
                new TerserPlugin()
            ],
            // splitChunks: {
            //     chunks: 'async',
            //     minSize: 10000,
            //     minChunks: 1,
            //     maxAsyncRequests: 5,
            //     maxInitialRequests: 3,
            //     name: true,
            //     cacheGroups: {
            //         default: false,
            //         commons: {
            //             test: /[\\/]node_modules[\\/]/,
            //             // output path
            //             name: "libs/main",
            //             chunks: "all"
            //         }
            //     }
            // },
            minimize: true,
        },
        stats: 'minimal'
    };
}

