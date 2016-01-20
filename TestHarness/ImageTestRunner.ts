
import { System } from '../Library/Server/Index';
import { HTTP } from '../Library/Index';
import { startServer, stopServer } from '../Server';
import { WebDriverTest } from './Harness';
var imageDiff = require('image-diff')

interface PageInfo {
    title: string;
    description: string;
    URL: string;
    imageURL: string;
}

let quiet = true;
if (typeof process.env.NO_QUIET !== 'undefined') {
    quiet = false;
}

interface TestFile {
    setup(): Promise<any>;
    test(test: WebDriverTest, data: any): WebDriverTest;
}

let masks: RegExp[] = [
    /^\/reset\-password\?token\=(.+)/,
    /^\/email\-verification\?userId=2&token=(.+)/
];

export function runImageTests() {
    let testFiles = System.findFiles(System.joinPaths(System.rootDir, 'Tests/Cases/**/*.js'));
    let cmdEmitter: any;

    describe('ImageTest', function() {
        if (!process.env.NO_TEST_RETRIES) {
            this.maxTestFails(2);
        }

        before((done) => {
            let currentBaselineFolder = System.joinPaths(System.rootDir, '../Tests/Baselines/Current');
            let diffBaselineFolder = System.joinPaths(System.rootDir, '../Tests/Baselines/Diff');
            if (System.fileExists(currentBaselineFolder)) {
                System.removeDir(currentBaselineFolder);
                System.createDir(currentBaselineFolder);
            }
            if (System.fileExists(diffBaselineFolder)) {
                System.removeDir(diffBaselineFolder);
                System.createDir(diffBaselineFolder);
            }

            cmdEmitter = startWebdriver();
            startServer(quiet);
            setTimeout(done, 5000);
        });

        beforeEach(() => {
            if (process.env.NO_QUIET) {
                console.log('Restoring test state...');
            }
            return new Promise<void>((resolve, reject) => {
                stateRestore().then(resolve).catch(() => {
                    console.log('Retrying to restore...');
                    stateRestore().then(resolve).catch(() => {
                        console.log('Retrying to restore...');
                        stateRestore().then(resolve).catch(() => {
                            console.log('Retrying to restore...');
                            stateRestore().then(resolve).catch(reject);
                        });
                    });
                });
            });
        });

        after(cleanUp);

        process.on('SIGINT', cleanUp);

        for (let t of testFiles) {
            ((testFilePath: string) => {
                let testName = t.replace(System.rootDir, '');
                it(testName, (done) => {
                    if (process.env.NO_QUIET) {
                        console.log(`Begin testing '${testName}'.`);
                    }
                    let promise = Promise.resolve<any>();
                    let pageInfo = {} as PageInfo;

                    let testFile = require(testFilePath) as TestFile;
                    if (testFile.setup) {
                        promise = promise.then(() => {
                            return testFile.setup();
                        });
                    }
                    if (!testFile.test) {
                        throw new Error('You have not implemented a test function for \'' + t + '\'');
                    }
                    promise = promise
                        .then((data: any) => {
                            let webDriverTest = new WebDriverTest(testName, null);
                            let test = testFile.test(webDriverTest, data)
                                .waitFor('FontFinishedLoading')
                                .checkError((error) => {
                                    return new Promise((resolve, reject) => {
                                        if (error === 'none') {
                                            resolve();
                                        }
                                        else {
                                            reject(error);
                                        }
                                    });
                                })
                                .click('UnFocus')
                                .sleep(3500)
                                .screenshot()
                                .getPageURL((URL: string) => {
                                    pageInfo.URL = mask(URL);
                                })
                                .getPageTitle((title: string) => {
                                    pageInfo.title = title;
                                })
                                .getPageDescription((description: string) => {
                                    pageInfo.description = description;
                                })
                                .getPageImage((imageURL: string) => {
                                    pageInfo.imageURL = mask(imageURL);
                                })

                            if (!process.env.INTERACTIVE) {
                                return test.end();
                            }
                            return test.currentControlFlow;
                        })
                        .then(() => {
                            let stringifiedPageInfo = JSON.stringify(pageInfo, null, 4);
                            let expectedPageInfo = '';
                            let expectedPageInfoFile = testFilePath.replace('Build/Tests/Cases/', 'Tests/Baselines/Reference/').replace('.js', '.page');
                            let errors: string[] = [];
                            let pageInfoFile = testFilePath.replace('Build/Tests/Cases/', 'Tests/Baselines/Current/').replace('.js', '.page');
                            if (System.fileExists(expectedPageInfoFile)) {
                                expectedPageInfo = System.readFile(expectedPageInfoFile);
                            }
                            System.createDir(System.dirname(pageInfoFile));
                            System.writeFile(pageInfoFile, stringifiedPageInfo);
                            if (stringifiedPageInfo !== expectedPageInfo) {
                                errors.push('Page info test failed for \'' + testName + '\'');
                            }
                            return new Promise((resolve, reject) => {
                                let diffImageFile = testFilePath.replace('Build/Tests/Cases/', 'Tests/Baselines/Diff/').replace('.js', '.jpg');
                                imageDiff({
                                        actualImage: testFilePath.replace('Build/Tests/Cases/', 'Tests/Baselines/Current/').replace('.js', '.jpg'),
                                        expectedImage: testFilePath.replace('Build/Tests/Cases/', 'Tests/Baselines/Reference/').replace('.js', '.jpg'),
                                        diffImage: diffImageFile,
                                    },
                                    (err: Error, imagesAreSame: boolean) => {
                                        if (err) {
                                            return reject(err);
                                        }
                                        if (!imagesAreSame) {
                                            errors.push('The image test failed for \'' + testName + '\'');
                                        }
                                        else {
                                            System.removeFile(diffImageFile);
                                        }
                                        if (errors.length > 0) {
                                            return reject(new Error(errors.join('. ')));
                                        }
                                        resolve();
                                    });
                            });
                        });

                    promise.catch((err) => {
                        if (err.body &&
                            err.body.feedback &&
                            err.body.feedback.current &&
                            err.body.feedback.current.description &&

                            err.status && err.endpoint) {

                            done(new Error(err.body.feedback.current.name + ': ' + err.body.feedback.current.description + ' ' + err.status + ' ' + err.endpoint));
                        }
                        else {
                            done(err);
                        }
                    });

                    promise.then(() => {
                        done()
                    });
                });
            })(t);
        }

        function cleanUp(){
            stopServer();
            cmdEmitter.kill('SIGHUP');
        }
    });
}

function mask(target: string) {
    let result: string;
    for (let m of masks) {
        m.lastIndex = 0;
        if (m.test(target)) {
            return target.replace(m, (str, m1) => str.replace(m1, '-- HIDDEN BY TEST --'));
        }
    }

    return target;
}

function stateRestore() {
    return HTTP.del('/all').then((result) => {
            return HTTP.post('/users', {
                body: {
                    name: 'User1',
                    email: 'username1@domain.com',
                    username: 'username1',
                    password: 'password',
                    token: 'grantme',
                }
            });
        }).then(() => {
            if (process.env.NO_QUIET) {
                console.log('Finished restoring test state.');
            }
        })
}

function startWebdriver() {
    let env = process.env;
    env.PATH = '/usr/local/bin:' + env.PATH;
    let options = ['-jar', '../Binaries/selenium-server.jar'];
    console.log('java', options.join(' '));
    return System.exec('java', options, { cwd: System.rootDir, env: env }, quiet);
}
