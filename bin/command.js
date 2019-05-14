#!/usr/bin/env node
const path = require('path');
const chalk = require('chalk');
const program = require('commander');
const inquirer = require('inquirer');
const generator = require('../lib/generator');
const build = require('../lib/build');
const exec = require('child_process').exec;

program
    .version('1.0.0')
    .description('Hybrid Page Application Management ool')
    .option('-h', '--help');

program
    .command('serve')
    .action(() => {
        build.buildPages(true).then(value => {
            // execSync(`node server.js`, {
            //     stdio: 'inherit'
            // });
            exec('node server.js', {
                stdio: 'inherit'
            });
        });
    });
/**
 * Command to build dll files
 */
program
    .command('build dll')
    .description('Build all dll files')
    .action(() => {
        build.buidDllFiles().then(value => {
        });
    });
/**
 * Command to build all pages
 */
program
    .command('build page')
    .description('Build all page related .js and .s/css files')
    .action(() => {
        build.buildPages(false).then(value => {
            if (value) return;
            console.log(value);
        });
    });


/**
 * Command to create a new project
 */
program
    .command('create <project_name>')
    .description('Create a new project')
    .action((project_name) => {
        // Setup questions
        const questions = [
            {
                type: 'input',
                name: 'version',
                message: 'Initial version: ',
            },
            {
                type: 'input',
                name: 'author',
                message: 'Author: ',
            }
        ]
        inquirer.prompt(questions).then(answers => {
            generator.generateProject(project_name, answers.version, answers.author).then((isSuccess) => {
                if (isSuccess) {
                    execSync('npm install', { stdio: 'inherit' });
                    // Build dlls
                    build.buidDllFiles()
                        .then(value => {
                            if (value) {
                                build.buildPages(false).then(value => {
                                    if (!value) {
                                        console.log(chalk.red('Error during building page files'));
                                    }
                                });
                            } else {
                                console.log(chalk.red('Error during building dll files'));
                            }
                        });
                }
            });
        });
    });
/**
 * Command to create a new page
 */
program.command('gp <page_name>')
    .description('Create a new page')
    .action(page_name => {
        generator.generatePage(page_name);
    });


// !!! Important
program.parse(process.argv);