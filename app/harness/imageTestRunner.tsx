
import { CommandLineOptions, Map } from './types';
import imageDiff = require('image-diff');
import logger = require('morgan');
import { cf } from '../../conf/conf';
import { ServerComposer, PlatformDetect } from '../composer/serverComposer';
import { ModuleKind } from '../composer/webBindingsEmitter';
import {
    ComposerDocument,
    DocumentDeclaration,
    LayoutDeclaration,
    ContentDeclaration,
    ComposerContent } from '../components/layerComponents';
import { sync as glob } from 'glob';
import * as path from 'path';
import express = require('express');
import { createServer } from 'http';
import Debug from '../debug';
import { parseCommandLineOptions } from './commandLineParser';
import { sys } from '../sys';
import { sync as removeFolderOrFile } from 'rimraf';
import { BrowserDirectives } from './browserDirectives';
import { Document } from '../../test/imageTests/defaultComponents/document';
import * as contentComponents from '../../test/imageTests/defaultComponents/contents';
import { Layout } from '../../test/imageTests/defaultComponents/layout';
import { WebdriverTest } from './webdriverTest';

declare function require(path: string): any;
require('source-map-support').install();

interface ProjectFile {
    route: string;
}

let defaultPlatform: PlatformDetect = { name: 'all', detect: (req: express.Request) => true };

function useDefaultDocument(): DocumentDeclaration {
    return {
        component: Document,
        importPath: '/test/imageTests/defaultComponents/document',
    }
}

export default class ImageTestRunner {
    public builtFolder = path.join(__dirname, '../../');
    public directives: BrowserDirectives;
    public root = path.join(this.builtFolder, '../');

    constructor(public options: CommandLineOptions) {

    }

    public createComposer(app: express.Express, folderPath: string, fileName: string, shouldEmitComposer: boolean): { serverComposer: ServerComposer, browserDirectives: BrowserDirectives } {
        let componentFolderPath = path.join(folderPath, 'components');
        let folderName = path.basename(folderPath);
        if (!folderName) {
            Debug.error('Could not get folder name from {0}', folderPath);
        }
        app.use('/src', express.static(path.join(this.root, 'built/src')));
        app.use('/test/imageTests/defaultComponents', express.static(path.join(this.root, 'built/test/imageTests/defaultComponents')));
        app.use('/public', express.static(path.join(this.root, 'public')));
        app.use('/' + componentFolderPath, express.static(path.join('built', folderPath, 'components')));
        app.use(logger('dev'));

        let serverComposer = new ServerComposer({
            app,
            routerOutput: 'public/scripts/router.js',
            bindingsOutput: 'public/scripts/bindings.js',
            clientConfigurationPath: './client/*.js',
            rootPath: this.root,
            moduleKind: ModuleKind.CommonJs,
        }, this.options);

        let directives = require(path.join(this.root, 'built', folderPath, 'test.js')).test({
            componentFolderPath,
            useDefaultDocument,
            useDefaultLayout: function(): LayoutDeclaration {
                return {
                    component: Layout,
                    importPath: '/test/imageTests/defaultComponents/layout',
                }
            },
            useDefaultContent: function(content: string): ContentDeclaration {
                return {
                    component: (contentComponents as any)[content] as new<P extends Props, S, E extends Elements>(props: any, children: any) => ComposerContent<P, S, E>,
                    importPath: 'test/imageTests/defaultComponents/contents',
                }
            },
            defaultPlatform: defaultPlatform
        });

        serverComposer.setDefaultDocument(useDefaultDocument(), { configs: ['default'] });
        serverComposer.setDefaultPlatform(defaultPlatform);

        serverComposer.setPages(directives.pages);

        return { serverComposer, browserDirectives: directives };
    }

    private stopServerDueToError(serverComposer: ServerComposer, err: Error, callback: () => void) {
        Debug.printError(err);
        serverComposer.stop(callback);
    }

    public runTests(): void {
        let self = this;
        let pattern: string;
        if (this.options.tests) {
            pattern = `test/imageTests/cases/projects/*${this.options.tests}*/test.js`;
        }
        else {
            pattern = 'test/imageTests/cases/projects/*/test.js';
        }
        removeFolderOrFile(path.join(this.root, 'test/imageTests/baselines/local'));
        removeFolderOrFile(path.join(this.root, 'test/imageTests/baselines/diff'));
        let filePaths = glob(pattern, { cwd: this.builtFolder });

        if (filePaths.length === 0) {
            Debug.prompt(`No file paths found for pattern '${pattern}'. Did you compiled your project correctly?`);
        }

        describe('Image diffs |', () => {
            for (var filePath of filePaths) {
                var folderPath = path.dirname(filePath);
                var jsFileName = path.basename(filePath);
                var fileName = jsFileName.replace(/\.js$/, '');

                (function(folderPath: string, fileName: string) {
                    let folderName = path.basename(folderPath);
                    it(folderName, function(done) {
                        if (self.options.interactive) {
                            this.timeout(10000000);
                        }

                        let app = express();
                        let { serverComposer, browserDirectives } = self.createComposer(app, folderPath, fileName, /*shouldEmitComposer*/false);
                        Debug.log('Starting server.');
                        serverComposer.start(err => {
                            Debug.log('Started server.');
                            if (err) {
                                return self.stopServerDueToError(serverComposer, err, () => done());
                            }
                            if (self.options.interactive) {
                                Debug.prompt('Stop the server by exiting the sessiotion with CTRL + C.');
                            }
                            else {
                                self.testWithHeadlessWebBrowser(app, serverComposer, folderName, browserDirectives, () => {
                                    Debug.log(`Finished testing ${folderName}.`);
                                    done();
                                });
                            }
                        });
                    });
                })(folderPath, fileName);
            }
        });
    }

    private testWithHeadlessWebBrowser(
        app: express.Express,
        serverComposer: ServerComposer,
        folderName: string,
        browserDirectives: BrowserDirectives,
        callback: () => void) {

        Debug.log(`Testing ${folderName}.`);

        let resultFilePath = path.join(this.root, `test/imageTests/baselines/local/${folderName}.png`);
        let expectedFilePath = path.join(this.root, `test/imageTests/baselines/reference/${folderName}.png`);
        let diffFilePath = path.join(this.root, `test/imageTests/baselines/diff/${folderName}.png`);
        let initialRoute = browserDirectives.initialRoute || '/';
        let webdriverTest = new WebdriverTest({
            browserName: 'chrome',
            os: 'OS X',
            os_version: 'Yosemite',
            resolution: `${cf.DEFAULT_SCREEN_RESOLUTION.WIDTH}x${cf.DEFAULT_SCREEN_RESOLUTION.HEIGHT}`
        });

        webdriverTest.get(`http://localhost:${cf.DEFAULT_PORT}${initialRoute}`)
            .wait({ css: 'html' })

        let browserActions = browserDirectives.useBrowserActions ?
            browserDirectives.useBrowserActions(webdriverTest) :
            webdriverTest;

        browserActions
            .screenshot(resultFilePath)
            .end((err) => {
                if(err) {
                    Debug.error('Could not start webdriver test.', err);
                }

                if (!sys.fileExists(expectedFilePath)) {
                    expectedFilePath = resultFilePath;
                }
                imageDiff(
                    {
                        actualImage: resultFilePath,
                        expectedImage: expectedFilePath,
                        diffImage: diffFilePath,
                    },
                    (err, imagesAreSame) => {
                        Debug.log('Stopping server.');
                        serverComposer.stop(err => {
                            Debug.log('Stopped server.');
                            if (imagesAreSame) {
                                removeFolderOrFile(diffFilePath);
                            }
                            else {
                                throw new TypeError('Baseline image does not correspond to result image.');
                            }

                            app = undefined;
                            serverComposer = undefined;
                            callback();
                        });
                    }
                );
            });
    }
}
