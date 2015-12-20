
import glob = require('glob');
import { CharacterCodes, CommandLineOptions, CommandLineOption} from './types';
import { Map } from '../types';
import { includes, hasProperty } from '../core';
import Debug from '../debug';

let optionDeclarations: CommandLineOption[] = [
    {
        name: 'help',
        shortName: 'h',
        type: 'string',
    },
    {
        name: 'interactive',
        shortName: 'i',
        type: 'boolean',
    },
    {
        name: 'tests',
        shortName: 't',
        type: 'string',
    },
    {
        name: 'showEmitBindings',
        type: 'boolean',
    },
];

export function parseCommandLineOptions(commandLine: string[]): CommandLineOptions {
    let options: CommandLineOptions = {};
    let testFiles: string[];
    let shortOptionNames: Map<string> = {};
    let optionNameMap: Map<CommandLineOption> = {};

    optionDeclarations.forEach(option => {
        optionNameMap[option.name.toLowerCase()] = option;
        if (option.shortName) {
            shortOptionNames[option.shortName] = option.name;
        }
    });

    parseStrings(commandLine);

    return options;

    function parseStrings(args: string[]) {
        console.log(args)
        let i = 0;
        while (i < args.length) {
            let s = args[i++];
            if (s.charCodeAt(0) === CharacterCodes.minus) {
                s = s.slice(s.charCodeAt(1) === CharacterCodes.minus ? 2 : 1).toLowerCase();

                // Try to translate short option names to their full equivalents.
                if (hasProperty(shortOptionNames, s)) {
                    s = shortOptionNames[s];
                }

                if (hasProperty(optionNameMap, s)) {
                    let opt = optionNameMap[s];

                    // Check to see if no argument was provided (e.g. '--help' is the last command-line argument).
                    if (!args[i] && opt.type !== 'boolean') {
                        Debug.error('Compiler option {0} expects an argument.', opt.name);
                    }

                    switch (opt.type) {
                        case 'number':
                            options[opt.name] = parseInt(args[i++]);
                            break;
                        case 'boolean':
                            options[opt.name] = true;
                            break;
                        case 'string':
                            options[opt.name] = args[i++] || '';
                            break;
                        default:
                            let type = opt.type;
                            if (typeof type === 'string') {
                                Debug.error('Unknown option type {0} declared in your command line options', type);
                            }
                    }
                }
            }
        }
    }
}