
'use strict';

import fs = require('fs');
import path = require('path');
import mkdirp = require('mkdirp');
var remove = require('remove');
import * as ini from 'ini';
import os = require('os');
import glob = require('glob');
import cp = require('child_process');

let spawn = cp.spawn;

interface BackendConfig {
     host: string;
     port: number;
     https?: boolean;
}

interface ServerConfig {
    port: number;
}

interface Config {
    backend: BackendConfig;
    server: ServerConfig;
}

let rootDir = path.join(__dirname, '../../');
let config: Config;

function checkEnvExist(names: string[]) {
    for (let name of names) {
        if (!(name in process.env)) {
            console.log(`You have not defined the envvar '${name}'`);
            process.exit();
        }
    }
}

if (fs.existsSync('/etc/flanity.com')) {
    config = ini.parse(fs.readFileSync('/etc/flanity.com', 'utf-8')) as Config;
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
    let env = process.env;
    let serverConfig: ServerConfig = {
        port: parseInt(env.FLANITY_COM_SERVER_PORT),
    }
    let backendConfig: BackendConfig = {
        host: env.FLANITY_COM_BACKEND_HOST,
        port: parseInt(env.FLANITY_COM_BACKEND_PORT),
        https: env.FLANITY_COM_BACKEND_HTTPS,
    }

    config = {
        server: serverConfig,
        backend: backendConfig,
    }
}

interface WriteFileOptions {
    encoding: 'utf8' | 'base64' | 'binary';
}

export let System = {
    hostname: os.hostname(),
    rootDir,
    fileExists: (filename: string) => fs.existsSync(filename),
    readFile: (filename: string) => fs.readFileSync(filename, 'utf8'),
    createReadStream: fs.createReadStream,
    findFiles: (pattern: string) => glob.sync(pattern),
    dirname: (filename: string) => path.dirname(filename),
    writeFile: (filename: string, data: string, options?: WriteFileOptions) => fs.writeFileSync(filename, data, options || { encoding: 'utf8' }),
    removeFile: (filename: string) => fs.unlinkSync(filename),
    removeDir: (dirname: string) => remove.removeSync(dirname),
    createDir: (dirname: string) => mkdirp.sync(dirname),
    joinPaths: path.join,
    config,
    exec: (cmd: string, options: string[], spawnOptions?: any, quiet?: boolean) => {
        let cmdEmitter = spawn(cmd, options, spawnOptions);
        let output = '';
        cmdEmitter.stdout.on('data', function(data: any) {
            var tmpData = data.toString();
            output += tmpData;
            if (!quiet) {
                process.stdout.write(tmpData);
            }
        });
        cmdEmitter.stderr.on('data', function (data: any) {
            if (!quiet) {
                process.stdout.write(data);
            }
        });
        cmdEmitter.on('exit', function (code: number) {
            if (!quiet) {
                console.log('child process exited with code ' + code);
                console.log(output);
            }
        });

        return cmdEmitter;
    }
}

export default System;