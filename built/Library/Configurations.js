"use strict";
var System_1 = require('./System');
var envPrefixRegExp = /^DEV__|^PROD__/;
var apiPrefixRegExp = /^API_URLS/;
var syntaxRegExp = /_SYNTAX$/;
var envRegExp = /^([A-Z]{3,4})__/;
var currentShortEnv;
switch (process.env.NODE_ENV) {
    case 'development':
        currentShortEnv = 'DEV';
        break;
    case 'staging':
        currentShortEnv = 'STAG';
        break;
    case 'production':
        currentShortEnv = 'PROD';
        break;
    default:
        currentShortEnv = 'DEV';
        break;
}
function formatConfiguration(configurations) {
    for (var key in configurations) {
        if (typeof configurations[key] === 'function') {
            configurations[key] = configurations[key]();
        }
        var confShortEnv = void 0;
        var confKey = void 0;
        if (envPrefixRegExp.test(key)) {
            confShortEnv = envRegExp.exec(key)[1];
            confKey = key.replace(envRegExp, '');
            if (confShortEnv === currentShortEnv) {
                configurations[confKey] = configurations[key];
            }
            delete configurations[key];
            key = confKey;
        }
        if (apiPrefixRegExp.test(key)) {
            for (var apiKey in configurations[key]) {
                if (envPrefixRegExp.test(apiKey)) {
                    confShortEnv = envRegExp.exec(apiKey)[1];
                    confKey = apiKey.replace(envRegExp, '');
                    if (confShortEnv === currentShortEnv) {
                        configurations[confKey + '_API_URL'] = configurations[key][apiKey];
                    }
                }
            }
            delete configurations[key];
        }
    }
    return configurations;
}
exports.formatConfiguration = formatConfiguration;
function mergeConfigurations(conf1, conf2) {
    for (var key in conf2) {
        conf1[key] = conf2[key];
    }
    return conf1;
}
exports.mergeConfigurations = mergeConfigurations;
function writeClientConfigurations() {
    var confFile = System_1.System.rootDir + cf.CLIENT_CONFIGURATION_OUTPUT;
    if (System_1.System.exists(confFile)) {
        System_1.System.removeFile(confFile);
    }
    var clientConf = require('../Configurations/Client').default;
    var startWrap = 'window.cf = (function() {\nvar configs = ';
    var body = JSON.stringify(clientConf, null, 4) + ';\n';
    var makeRegExp = 'for(var key in configs) {\n    if (/_SYNTAX$/.test(key)) {\n        configs[key] = new RegExp(configs[key]);\n    }\n}\n';
    var endWrap = 'return configs;\n})();';
    System_1.System.writeFile(confFile, startWrap + body + makeRegExp + endWrap);
}
exports.writeClientConfigurations = writeClientConfigurations;
//# sourceMappingURL=Configurations.js.map