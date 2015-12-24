
import sys from './sys';

const envPrefixRegExp = /^DEV__|^PROD__/;
const apiPrefixRegExp = /^API_URLS/;
const syntaxRegExp = /_SYNTAX$/;
const envRegExp = /^([A-Z]{3,4})__/;

let currentShortEnv: string;
switch(process.env.NODE_ENV) {
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

/**
 * Format configurations. Formatting removes DEV__ and PROD__
 * prefixes. It also format all API urls correctly
 */
export function formatConf(configurations: any) {
    for(let key in configurations) {
        // All functions should be cached.
        if(typeof configurations[key] === 'function') {
            configurations[key] = configurations[key]();
        }

        let confShortEnv: string
        let confKey: string;

        // We normalize all environmental prefixes. So DEV__ and PROD___will be removed.
        // These configurations could be referenced later without prefixes in the
        // confguration project.
        if(envPrefixRegExp.test(key)) {
            confShortEnv = envRegExp.exec(key)[1];
            confKey = key.replace(envRegExp, '');

            if(confShortEnv === currentShortEnv) {
                configurations[confKey] = configurations[key];
            }
            delete configurations[key];
            key = confKey;
        }

        // API_URLS should be deleted. And every URL defined should be accessible
        // directly by [API_NAME] + _API_URL
        if(apiPrefixRegExp.test(key)) {
            for(let apiKey in configurations[key]) {
                if(envPrefixRegExp.test(apiKey)) {
                    confShortEnv = envRegExp.exec(apiKey)[1];
                    confKey = apiKey.replace(envRegExp, '');

                    if(confShortEnv === currentShortEnv) {
                        configurations[confKey + '_API_URL'] = configurations[key][apiKey];
                    }
                }
            }
            delete configurations[key];
        }
    }

    return configurations;
}

/**
 * Merge external configs.
 */
export function mergeConf(conf1: any, conf2: any) {
    for(const key in conf2) {
        conf1[key] = conf2[key];
    }

    return conf1;
}

/**
 * Write client configurations.
 */
export function writeClientConf() {
    let confFile = sys.rootDir + cf.CLIENT_CONFIGURATION_OUTPUT;
    if (sys.exists(confFile)) {
        sys.removeFile(confFile);
    }
    const clientConf = require('../conf/client').default;
    const startWrap = 'window.cf = (function() {\nvar configs = '
    const body = JSON.stringify(clientConf, null, 4) + ';\n';
    const makeRegExp = 'for(var key in configs) {\n    if (/_SYNTAX$/.test(key)) {\n        configs[key] = new RegExp(configs[key]);\n    }\n}\n';
    const endWrap = 'return configs;\n})();';

    sys.writeFile(confFile, startWrap + body + makeRegExp + endWrap);
}
