const fse = require('fs-extra')

const CONFIG = {
    dist: {
        assets: "dist/assets",
        libs: "dist/libs",
        pages: "dist/pages",
        shared: "dist/shared"
    },
    src: {
        components: "src/components",
        libs: "src/libs",
        pages: "src/pages"
    },
    routes: {
        routes: "routes/pages.js"
    },
    environment: "environment.js",
    gitignore: ".gitignore",
    // babel: ".babelrc",
    config: "config.json",
    server: "server.js",
    package_json: "package.json"
};

/**
 * Generate dist folder
 */
generateDist = () => {
    const folders = Object.keys(CONFIG.dist);
    folders.forEach(el => {
        console.log(CONFIG.dist[el]);
        fse.ensureDirSync(CONFIG.dist[el]);
    });
}
/**
 * Generate src folder
 */
generateSrc = () => {
    const folders = Object.keys(CONFIG.src);
    folders.forEach(el => {
        console.log(CONFIG.src[el]);
        fse.ensureDirSync(CONFIG.src[el]);
    });
}
/**
 * Generate routes folder
 */
generateRotues = () => {
    const folders = Object.keys(CONFIG.routes);
    folders.forEach(el => {
        console.log(CONFIG.routes[el]);
        fse.outputFileSync(CONFIG.routes[el]);
    });
}
/**
 * Generate config file
 * */
generateConfigFiles = () => {
    const config_files = Object.keys(CONFIG);
    config_files.forEach(el => {
        if (el === 'dist' || el === 'src' || el === 'routes') return;
        fse.outputFileSync(CONFIG[el]);
    });
}
/**
 * Generate webpack config files
 */


exports.generateProject = (project_name, version, author) => {
    const promise = new Promise((resolve, reject) => {
        // Generate dist directory
        generateDist();
        // Generate src directory
        generateSrc();
        // Generate routes directory
        generateRotues();
        // Generate config files
        generateConfigFiles();
        // TODO: Write content to config files
        writeToPagesJs();
        writeToGitIgnore();
        // writeToBabel();
        writeToReactLibJs();
        writeToConfigJson();
        writeToServerJs();
        writeToPackageJson(project_name, version, author);
        // Generate a default demo page
        this.generatePage('home');
        console.log('generation done');
        resolve(true);
    });
    return promise;
}

// ----------------------------------- Dynamic generation --------------------------------------------
exports.generatePage = (page_name) => {
    const config = JSON.parse(fse.readFileSync('./config.json'));
    const class_name = page_name.charAt(0).toUpperCase() + page_name.slice(1);
    const dir = {
        srcJs: `./src/pages/${page_name}/index.js`,
        srcCss: `./src/pages/${page_name}/index.scss`,
        distHTML: `./dist/pages/${page_name}/index.html`
    };
    // HTML code
    const htmlContent =
        `<!DOCTYPE html>
<html lang="en">
<head>
    <base href="/">
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>${page_name} Page</title>
    <link rel="stylesheet" href="pages/${page_name}/index.css" />
</head>

<body>
    <div id="root"></div>
    <script type="text/javascript" src="libs/react_dll.js"></script>
    <script type="text/javascript" src="pages/${page_name}/index.js"></script>
    <!-- Development only -->
    <script id="__bs_script__">//<![CDATA[
        document.write(("<script async src='http://HOST:5001/browser-sync/browser-sync-client.js?v=2.26.5'><" + "/script>").replace("HOST", location.hostname));
    //]]></script>
</body>
</html>
`;
    // JavaScript code
    const jsContent =
        `import React from 'react';
import ReactDOM from 'react-dom';

import STYLES from './index.scss';
const c = className => STYLES[className] || 'UNKNOWN';

class ${class_name} extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <div className={c('container')}>
                ${page_name} page
            </div>
        );
    };
}

ReactDOM.render(<${class_name} />, document.getElementById('root'));
`;
    // SCSS code
    const scssContent =
        `.container {
    color: crimson;
}
`;
    fse.outputFileSync(dir.distHTML, htmlContent);
    fse.outputFileSync(dir.srcJs, jsContent);
    fse.outputFileSync(dir.srcCss, scssContent);
    // Register page on config.json
    config.pages.push({
        name: `${page_name}`,
        root: 'index',
        isEditing: true
    });
    fse.writeFileSync('./config.json', JSON.stringify(config, '', '\t'));
    console.log('page generated');
}

exports.generateDll = (dll_name) => {
    const config = JSON.parse(fse.readFileSync('./config.json'));
    const dllDir = `./src/libs/${dll_name}.lib.js`;
    config.dlls.push({
        name: `${dll_name}_dll`,
        lib: `${dll_name}.lib.js`,
        manifest: `${dll_name}_dll-manifest.json`
    });
    fse.outputFileSync('./config.json', JSON.stringify(config, '', '\t'));
    fse.outputFileSync(dllDir, '');
    console.log('dll package generated');
}


// ------------------------------------ Auto generate code to files ----------------------------------
writeToPagesJs = () => {
    const content =
        `/**
* Here you can put all your routes for the node server to
* serve your html files
*/
const express = require('express');
const router = express.Router();

/**
* Home page
*/
router.get('/', function(req, res, next) {
  res.render('home/index'); 
});

module.exports = router;
`;
    fse.writeFileSync('./routes/pages.js', content);
}
writeToGitIgnore = () => {
    fse.writeFileSync('./.gitignore', '/node_modules');
    console.log('Write to .gitignore -- done');
}
writeToBabel = () => {
    const data = {
        presets: ['@babel/preset-env', '@babel/preset-react'],
        plugins: ['@babel/plugin-proposal-class-properties']
    };
    fse.writeFileSync('./.babelrc', JSON.stringify(data, '', '\t'));
    console.log('Write to babel file -- done');
};
writeToConfigJson = () => {
    const data = {
        pages: [],
        dlls: [
            {
                name: 'react_dll',
                lib: 'react.lib.js',
                manifest: 'react_dll-manifest.json'
            }
        ]
    };
    fse.writeFileSync('./config.json', JSON.stringify(data, '', '\t'));
    console.log('Write to config file -- done');
}
writeToServerJs = () => {
    const content =
        `const path = require('path');
const chalk = require('chalk');
const express = require('express');
// const logger = require('morgan');
const consolidate = require('consolidate');
const http = require('http');
const debug = require('debug')('gogomate-admin-server:server');

const app = express();
const pagesRouter = require('./routes/pages');

app.set('views', path.join(__dirname, 'dist', 'pages'));
app.engine('html', consolidate.mustache);
app.set('view engine', 'html');

// app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'dist')));
// Views
app.use('/', pagesRouter);

const port = normalizePort(process.env.PORT || '5000');
app.set('port', port);
/**
 * Create HTTP server.
 */
const server = http.createServer(app);
server.listen(port);
server.on('error', onError);
server.on('listening', onListening);

/**
 * Normalize a port into a number, string, or false.
 */
function normalizePort(val) {
    const port = parseInt(val, 10);
    if (isNaN(port)) {
        // named pipe
        return val;
    }

    if (port >= 0) {
        // port number
        return port;
    }

    return false;
}

/**
* Event listener for HTTP server "error" event.
*/
//syscall
function onError(error) {
    if (error.syscall !== 'listen') {
        throw error;
    }

    const bind = typeof port === 'string'
        ? 'Pipe ' + port
        : 'Port ' + port;

    // handle specific listen errors with friendly messages
    switch (error.code) {
        case 'EACCES':
            console.error(bind + ' requires elevated privileges');
            process.exit(1);
            break;
        case 'EADDRINUSE':
            console.error(bind + ' is already in use');
            process.exit(1);
            break;
        default:
            throw error;
    }
}

/**
 * Event listener for HTTP server "listening" event.
 */
function onListening() {
    const addr = server.address();
    const bind = typeof addr === 'string'
        ? 'pipe ' + addr
        : 'port ' + addr.port;
    console.log(chalk.yellow('Server listening on ' + bind));
    debug('Listening on ' + bind);
}

module.exports = app;
`;
    fse.writeFileSync('./server.js', content);
}
/**
 * Write to react.lib.js
 */
writeToReactLibJs = () => {
    const content =
        `import 'react';
import 'react-dom';
`;
    fse.writeFileSync('./src/libs/react.lib.js', content);
}
/**
 * Gen code to package.json file
 */
writeToPackageJson = (project_name, version, author) => {
    const content =
        `{
    "name": "${project_name}",
    "version": "${version}",
    "description": "",
    "main": "index.js",
    "scripts": {
        "test": "echo 'Error: no test specified' && exit 1",
        "start": "node server.js & hpa serve",
        "build": "hpa build",
        "dll": "hpa pkt"
    },
    "author": "${author}",
    "license": "ISC",
    "dependencies": {
        "react": "^16.8.2",
        "react-dom": "^16.8.2",
        "react-router-dom": "^4.3.1"
    },
    "devDependencies": {
        "express": "^4.16.4",
        "co": "^4.6.0",
        "consolidate": "^0.15.1",
        "morgan": "^1.9.1",
        "mustache": "^3.0.1",
        "chalk": "^2.4.2"
    }
}
`;
    fse.writeFileSync('./package.json', content);
}