const fs = require('fs');
const path = require('path');
const webpack = require('webpack');

/**
 * Build dll entries
 */
buildDllEntries = () => {
    const DLLS = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'config.json'))).dlls;
    const entries = {};
    DLLS.forEach(dll => {
        entries[dll.name] = [path.join(process.cwd(), 'src', 'libs', dll.lib)];
    });
    return entries;
}

module.exports = function () {
    return {
        mode: 'production', // 一定要为production模式, 否则打包的第三方库文件很大
        entry: buildDllEntries(),
        output: {
            path: path.join(process.cwd(), 'dist'),
            filename: 'libs/[name].js',
            library: '[name]_[hash]',
        },
        plugins: [
            new webpack.DllPlugin({
                context: process.cwd(),
                // manifest.json文件的输出位置
                path: path.resolve(process.cwd(), 'dist', 'libs', '[name]-manifest.json'),
                // 定义打包的公共vendor文件对外暴露的函数名
                name: '[name]_[hash]' // or [name]_[hash]
            }),
        ],
        optimization: {
            minimize: true,
        }
    };
}
