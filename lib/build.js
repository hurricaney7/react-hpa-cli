const fse = require('fs-extra');
const chalk = require('chalk');
const webpack = require('webpack');
const configFactory = require('../config/webpack.config');
const dllConfigFactory = require('../config/webpack.dll.config');
const formatWebpackMessages = require('../utils/formatWebpackMessages');
const BuildStatsReporter = require('../utils/BuildStatsReporter');

// These sizes are pretty large. We'll warn for bundles exceeding them.
const WARN_AFTER_BUNDLE_GZIP_SIZE = 512 * 1024;
const WARN_AFTER_CHUNK_GZIP_SIZE = 1024 * 1024;

const isInteractive = process.stdout.isTTY;


/**
 * Build all project dll files
 */
exports.buidDllFiles = () => {
    console.log(chalk.yellow('Building dll files...'));
    const compiler = webpack(dllConfigFactory());
    return new Promise((resolve, reject) => {
        compiler.run((err, stats) => {
            if (err) {
                if (!err.message) return reject(err);
            }
            if (stats.errors) {
                reject(stats.errors);
            }
            BuildStatsReporter.reportDllStats(stats);
            resolve(true);
        });
    });
}
/**
 * Build pages
 */
exports.buildPages = (isWatching, mode) => {
    console.log(chalk.yellow('\nBuilding pages...\n'));
    const compiler = webpack(configFactory(mode, isWatching));
    return new Promise((resolve, reject) => {
        if (isWatching) {
            compiler.watch({}, (err, stats) => {
                let messages;
                if (err) {
                    if (!err.message) {
                        return reject(err);
                    }
                    messages = formatWebpackMessages({
                        errors: [err.message],
                        warnings: [],
                    });
                } else {
                    messages = formatWebpackMessages(
                        stats.toJson({ all: false, warnings: true, errors: true })
                    );
                };
                if (messages.errors.length) {
                    // Only keep the first error. Others are often indicative
                    // of the same problem, but confuse the reader with noise.
                    if (messages.errors.length > 1) {
                        messages.errors.length = 1;
                    }
                    return reject(new Error(messages.errors.join('\n\n')));
                }
                if (
                    process.env.CI &&
                    (typeof process.env.CI !== 'string' ||
                        process.env.CI.toLowerCase() !== 'false') &&
                    messages.warnings.length
                ) {
                    console.log(
                        chalk.yellow(
                            '\nTreating warnings as errors because process.env.CI = true.\n' +
                            'Most CI servers set it automatically.\n'
                        )
                    );
                    return reject(new Error(messages.warnings.join('\n\n')));
                }
                // Report build results
                BuildStatsReporter.reportBuildStats(stats);
                return resolve(true);
            });
        } else {
            compiler.run((err, stats) => {
                let messages;
                if (err) {
                    if (!err.message) {
                        return reject(err);
                    }
                    messages = formatWebpackMessages({
                        errors: [err.message],
                        warnings: [],
                    });
                } else {
                    messages = formatWebpackMessages(
                        stats.toJson({ all: false, warnings: true, errors: true })
                    );
                };
                if (messages.errors.length) {
                    // Only keep the first error. Others are often indicative
                    // of the same problem, but confuse the reader with noise.
                    if (messages.errors.length > 1) {
                        messages.errors.length = 1;
                    }
                    return reject(new Error(messages.errors.join('\n\n')));
                }
                if (
                    process.env.CI &&
                    (typeof process.env.CI !== 'string' ||
                        process.env.CI.toLowerCase() !== 'false') &&
                    messages.warnings.length
                ) {
                    console.log(
                        chalk.yellow(
                            '\nTreating warnings as errors because process.env.CI = true.\n' +
                            'Most CI servers set it automatically.\n'
                        )
                    );
                    return reject(new Error(messages.warnings.join('\n\n')));
                }
                // Report build results
                BuildStatsReporter.reportBuildStats(stats);
                return resolve(true);
            });
        }
    });
}