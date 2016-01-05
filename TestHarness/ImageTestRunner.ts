
import { System } from '../Library/Server/Index';
import { HTTP } from '../Library/Index';
import { startServer, stopServer } from '../Server';
import { WebDriverTest } from './WebDriverTest';
var imageDiff = require('image-diff');

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
            return HTTP.del('/all').then((result) => {
                return HTTP.post('/users', {
                    host: System.config.backend.host,
                    port: System.config.backend.port,
                    body: {
                        name: 'User1',
                        email: 'user1@domain.com',
                        username: 'username1',
                        password: 'password',
                        token: 'grantme',
                    }
                });
            });
        });

        after(cleanUp);

        process.on('SIGINT', cleanUp);

        for (let t of testFiles) {
            ((testFilePath: string) => {
                let testName = t.replace(System.rootDir, '');
                it(testName, () => {
                    let promise = Promise.resolve<any>();
                    let pageInfo = {} as PageInfo;

                    let testFile = require(testFilePath);
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
                            return testFile.test(webDriverTest, data)
                                .waitFor('PageFinishedLoading')
                                .waitFor('FontFinishedLoading')
                                .screenshot()
                                .getPageURL((URL: string) => {
                                    pageInfo.URL = URL;
                                })
                                .getPageTitle((title: string) => {
                                    pageInfo.title = title;
                                })
                                .getPageDescription((description: string) => {
                                    pageInfo.description = description;
                                })
                                .getPageImage((imageURL: string) => {
                                    pageInfo.imageURL = imageURL;
                                })
                                .end();
                        })
                        .then(() => {
                            let stringifiedPageInfo = JSON.stringify(pageInfo, null, 4);
                            let expectedPageInfo = '';
                            let expectedPageInfoFile = testFilePath.replace('Build/Tests/Cases/', 'Tests/Baselines/Reference/').replace('.js', '.page');
                            if (System.fileExists(expectedPageInfoFile)) {
                                expectedPageInfo = System.readFile(expectedPageInfoFile);
                            }

                            System.writeFile(testFilePath.replace('Build/Tests/Cases/', 'Tests/Baselines/Current/').replace('.js', '.page'), stringifiedPageInfo);
                            if (stringifiedPageInfo !== expectedPageInfo) {
                                throw new Error('Page info test failed for \'' + testName + '\'');
                            }
                            return new Promise((resolve, reject) => {
                                imageDiff({
                                        actualImage: testFilePath.replace('Build/Tests/Cases/', 'Tests/Baselines/Current/').replace('.js', '.jpg'),
                                        expectedImage: testFilePath.replace('Build/Tests/Cases/', 'Tests/Baselines/Reference/').replace('.js', '.jpg'),
                                        diffImage: testFilePath.replace('Build/Tests/Cases/', 'Tests/Baselines/Diff/').replace('.js', '.jpg'),
                                    },
                                    (err: Error, imagesAreSame: boolean) => {
                                        if (err) {
                                            return reject(err);
                                        }
                                        if (!imagesAreSame) {
                                            return reject(new Error('The image test failed for \'' + testName + '\''));
                                        }
                                        resolve();
                                    });
                            });
                        });


                    return promise;
                });
            })(t);
        }

        function cleanUp(){
            stopServer();
            cmdEmitter.kill('SIGHUP');
        }
    });
}

function startWebdriver() {
    let env = process.env;
    env.PATH = '/usr/local/bin:' + env.PATH;
    return System.exec('java', ['-jar', '../Binaries/selenium-server.jar'], { cwd: System.rootDir, env: env }, quiet);
}
