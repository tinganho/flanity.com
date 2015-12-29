'use strict';
var fs = require('fs');
var path = require('path');
var mkdirp = require('mkdirp');
var remove = require('remove');
var ini = require('ini');
var os = require('os');
var glob = require('glob');
var cp = require('child_process');
var spawn = cp.spawn;
var rootDir = path.join(__dirname, '../../');
var config;
function checkEnvExist(names) {
    for (var _i = 0, names_1 = names; _i < names_1.length; _i++) {
        var name_1 = names_1[_i];
        if (!(name_1 in process.env)) {
            console.log("You have not defined the envvar '" + name_1 + "'");
            process.exit();
        }
    }
}
if (fs.existsSync('/etc/flanity.com')) {
    config = ini.parse(fs.readFileSync('/etc/flanity.com', 'utf-8'));
    if (!config.backend || !config.backend.host || !config.backend.port) {
        console.error('You have not configured backend server correctly.');
        process.exit();
    }
}
else {
    checkEnvExist([
        'FLANITY_COM_SERVER_PORT',
        'FLANITY_COM_BACKEND_HOST',
        'FLANITY_COM_BACKEND_PORT',
    ]);
    var env = process.env;
    var serverConfig = {
        port: env.FLANITY_COM_SERVER_PORT,
    };
    var backendConfig = {
        host: env.FLANITY_COM_BACKEND_HOST,
        port: env.FLANITY_COM_BACKEND_PORT,
        https: env.FLANITY_COM_BACKEND_HTTPS,
    };
    config = {
        server: serverConfig,
        backend: backendConfig,
    };
}
exports.System = {
    hostname: os.hostname(),
    rootDir: rootDir,
    exists: function (filename) { return fs.existsSync(filename); },
    readFile: function (filename) { return fs.readFileSync(filename, 'utf8'); },
    createReadStream: fs.createReadStream,
    findFiles: function (pattern) { return glob.sync(pattern); },
    dirname: function (filename) { return path.dirname(filename); },
    writeFile: function (filename, data) { return fs.writeFileSync(filename, data, { encoding: 'utf8' }); },
    removeFile: function (filename) { return fs.unlinkSync(filename); },
    removeDir: function (dirname) { return remove.removeSync(dirname); },
    createDir: function (dirname) { return mkdirp.sync(dirname); },
    joinPaths: path.join,
    config: config,
    exec: function (cmd, options, env, quiet) {
        return new Promise(function (resolve, reject) {
            var cmdEmitter = spawn(cmd, options, { env: env || {} });
            var output = '';
            cmdEmitter.stdout.on('data', function (data) {
                var tmpData = data.toString();
                output += tmpData;
                if (!quiet) {
                    process.stdout.write(tmpData);
                }
            });
            cmdEmitter.stderr.on('data', function (data) {
                console.log(data.toString());
            });
            cmdEmitter.on('exit', function (code) {
                if (!quiet) {
                    console.log('child process exited with code ' + code);
                }
                resolve(output);
            });
        });
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = exports.System;
//# sourceMappingURL=System.js.map