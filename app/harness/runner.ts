
/// <reference path='../../typings/connect-modrewrite/connect-modrewrite.d.ts'/>
/// <reference path='../../typings/mocha/mocha.d.ts'/>
/// <reference path='../../typings/chai/chai.d.ts' />
/// <reference path='../../typings/express/express.d.ts'/>
/// <reference path='../../typings/morgan/morgan.d.ts'/>
/// <reference path='../../typings/es6-promise/es6-promise.d.ts'/>
/// <reference path='../../typings/image-diff/image-diff.d.ts'/>
/// <reference path='../../typings/rimraf/rimraf.d.ts'/>
/// <reference path='../../typings/selenium-webdriver/selenium-webdriver.d.ts'/>

(global as any).inServer = true;
(global as any).inClient = false;

import ImageTestRunner from './imageTestRunner';
import { parseCommandLineOptions } from './commandLineParser';

declare function require(path: string): any;
require('source-map-support').install();
require('es6-promise').polyfill();

let options = parseCommandLineOptions(process.argv);
new ImageTestRunner(options).runTests();