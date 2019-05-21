const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const filesize = require('filesize');
require('console.table');

/**
 * Report build stats from webpack compiler's stats
 */
exports.reportBuildStats = (stats) => {
    const compilation = stats.compilation;
    const chunks = compilation.chunks;
    const startTime = stats.startTime;
    const endTime = stats.endTime;
    const duration = new Date(new Date(endTime) - new Date(startTime));
    const table = [];

    chunks.forEach((chunk) => {
        const buildTimestamp = chunk.entryModule ? chunk.entryModule.buildTimestamp : 0;
        const fileStats = fs.statSync(path.join(process.cwd(), 'dist', chunk.name + '.js'));
        const buildTime = new Date(new Date(buildTimestamp) - new Date(startTime));
        table.push({
            'Output path': 'dist/' +  chunk.name + '.js',
            'Size': chalk.blue(filesize(fileStats.size)),
            'Build time': buildTime.getMilliseconds() + 'ms'
        });
        // console.log(chunk.name + '  ' + filesize(fileStats.size) + '  ' + buildTime.getMilliseconds() + 'ms');
    });
    console.table(table);
    console.log(chalk.green('Total: ' + duration.getMilliseconds() + 'ms\n'));
}
/**
 * Report dll build stats
 */
exports.reportDllStats = (stats) => {
    const compilation = stats.compilation;
    const chunks = compilation.chunks;
    const startTime = stats.startTime;
    const endTime = stats.endTime;
    const duration = new Date(new Date(endTime) - new Date(startTime));
    const table = [];

    chunks.forEach((chunk) => {
        const buildTimestamp = chunk.entryModule.buildTimestamp;
        const fileStats = fs.statSync(path.join(process.cwd(), 'dist', 'libs', chunk.name + '.js'));
        const buildTime = new Date(new Date(buildTimestamp) - new Date(startTime));
        table.push({
            'Output path': 'dist/libs/' +  chunk.name + '.js',
            'Size': chalk.blue(filesize(fileStats.size)),
            // 'Build time': buildTime.getMilliseconds() + 'ms'
            'Build time': 'unknown'
        });
        // console.log(chunk.name + '  ' + filesize(fileStats.size) + '  ' + buildTime.getMilliseconds() + 'ms');
    });
    console.table(table);
    console.log(chalk.green('Total: ' + duration.getMilliseconds() + 'ms\n'));
}