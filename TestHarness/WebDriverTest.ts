
/// <reference path='../Typings/node/node.d.ts'/>
/// <reference path='../Typings/mkdirp/mkdirp.d.ts'/>
/// <reference path='../Typings/selenium-webdriver/selenium-webdriver.d.ts'/>

import webdriver = require('selenium-webdriver');
import { ServerConfigurations as cf } from '../Configurations/Server';
import { System } from '../Library/Server/Index';

export class WebDriverTest {
    private driver: webdriver.WebDriver;
    private currentControlFlow: Promise<any>;

    constructor(public testName: string, public capabilites: webdriver.Capabilities) {
        let _capabilities = (webdriver as any).Capabilities.phantomjs();
        if (process.env.WEBDRIVER_TARGET) {
            _capabilities = (webdriver as any).Capabilities[process.env.WEBDRIVER_TARGET]();
        }
        this.driver = new webdriver.Builder()
            .usingServer(process.env.WEBDRIVER_SERVER || cf.DEFAULT_WEBDRIVER_SERVER)
            .withCapabilities(_capabilities)
            .build();

        this.setDefaultScreenResolution();
    }

    public get(path: string): this {
        this.currentControlFlow = this.driver.get('http://localhost:' + cf.DEFAULT_SERVER_PORT + path);
        return this;
    }

    public click(element: webdriver.Hash | string): this {
        this.currentControlFlow = this.currentControlFlow.then(() => {
            return this.driver.findElement(
                this.getLocatorOrHashFromHashOrIdString(element)
            ).click();
        });
        return this;
    }

    public input(element: webdriver.Hash | string, keys: string): this {
        this.currentControlFlow = this.currentControlFlow.then(() => {
            for (let i = 0; i < keys.length; i++) {
                this.driver.findElement(
                    this.getLocatorOrHashFromHashOrIdString(element)
                ).sendKeys(keys[i]);
            }
        });

        return this;
    }

    public clearInput(element: webdriver.Hash | string): this {
        this.currentControlFlow = this.currentControlFlow.then(() => {
            this.driver.findElement(
                    this.getLocatorOrHashFromHashOrIdString(element)
                ).getAttribute('value').then((value: string) => {
                    for (let i = 0; i < value.length; i++) {
                        this.driver.findElement(
                            this.getLocatorOrHashFromHashOrIdString(element)
                        ).sendKeys(webdriver.Key.BACK_SPACE);
                    }
                });
        });

        return this;
    }

    public waitFor(element: webdriver.Hash | string): this {
        this.currentControlFlow = this.currentControlFlow.then(() => {
            return this.driver.wait(
                webdriver.until.elementLocated(this.getLocatorOrHashFromHashOrIdString(element)),
                cf.WEBDRIVER_IDLE_TIME
            );
        });

        return this;
    }

    public screenshot(): WebDriverTest {
        this.currentControlFlow = this.currentControlFlow.then(() => {
            return this.driver.takeScreenshot().then(data => {
                let currentBaselineFile = System.joinPaths(System.rootDir, '../Tests/Baselines/Current/', this.testName.replace('Tests/Cases/', '').replace('.js', '.jpg'));
                System.createDir(System.dirname(currentBaselineFile));
                System.writeFile(currentBaselineFile, data.replace(/^data:image\/jpg;base64,/,''), { encoding: 'base64' });
            });
        });

        return this;
    }

    public getPageURL(callback: (URL: string) => void): this {
        this.currentControlFlow = this.currentControlFlow.then(() => {
            return this.driver.executeScript(function() {
                    return window.location.pathname + window.location.search;
                }).then((URL: string) => {
                    callback(URL);
                });
        });

        return this;
    }

    public getPageTitle(callback: (title: string) => void): this {
        this.currentControlFlow = this.currentControlFlow.then(() => {
            return this.driver.getTitle().then((title) => {
                callback(title);
                return Promise.resolve();
            });
        });

        return this;
    }

    public getPageDescription(callback: (description: string) => void): this {
        this.currentControlFlow = this.currentControlFlow.then(() => {
            return this.driver.executeScript(function() {
                    let el = document.getElementById('PageDescription');
                    if (el) {
                        return el.getAttribute('content');
                    }
                    return null;
                }).then((URL: string) => {
                    callback(URL);
                });
        });

        return this;
    }

    public getPageImage(callback: (description: string) => void): this {
        this.currentControlFlow = this.currentControlFlow.then(() => {
            return this.driver.executeScript(function() {
                    let el = document.getElementById('OGImage');
                    if (el) {
                        return el.getAttribute('content');
                    }
                    return null;
                }).then((URL: string) => {
                    callback(URL);
                });
        });

        return this;
    }

    public end() {
        return this.currentControlFlow.then(() => {
            return this.driver.quit();
        });
    }

    private getLocatorOrHashFromHashOrIdString(element: webdriver.Hash | string): webdriver.Hash | webdriver.Locator {
        if (typeof element === 'string') {
            return webdriver.By.id(element);
        }
        else {
            return element;
        }
    }

    private setDefaultScreenResolution(): void {
        this.driver.manage().window().setSize(cf.DEFAULT_SCREEN_RESOLUTION.WIDTH, cf.DEFAULT_SCREEN_RESOLUTION.HEIGHT);
    }
}