
/// <reference path='../../typings/node/node.d.ts'/>
/// <reference path='../../typings/mkdirp/mkdirp.d.ts'/>
/// <reference path='../../typings/selenium-webdriver/selenium-webdriver.d.ts'/>

import webdriver = require('selenium-webdriver');
import cf from '../../conf/conf';
import sys from '../sys';
import * as fs from 'fs';
import { dirname } from 'path';
import { sync as createFolder } from 'mkdirp';

export class WebdriverTest {
    private driver: webdriver.WebDriver;
    private currentControlFlow: Promise<any>;

    constructor(public capabilites: webdriver.Capabilities) {
        if (process.env.BROWSERSTACK) {
            this.setBrowserstackCapabilities();
        }

        this.driver = new webdriver.Builder()
            .usingServer(process.env.WEBDRIVER_SERVER || cf.DEFAULT_WEBDRIVER_SERVER)
            .withCapabilities(this.capabilites)
            .build();

        this.setDefaultScreenResolution();
    }

    public get(url: string): WebdriverTest {
        this.currentControlFlow = this.driver.get(url);

        return this;
    }

    public click(element: webdriver.Hash | string): WebdriverTest {
        this.currentControlFlow = this.currentControlFlow.then(() => {
            return this.driver.findElement(
                this.getLocatorOrHashFromHashOrIdString(element)
            ).click();
        });

        return this;
    }

    public input(element: webdriver.Hash | string, keys: string): WebdriverTest {
        this.currentControlFlow = this.currentControlFlow.then(() => {
            return this.driver.findElement(
                this.getLocatorOrHashFromHashOrIdString(element)
            ).sendKeys(keys);
        });

        return this;
    }

    public wait(element: webdriver.Hash | string): WebdriverTest {
        this.currentControlFlow = this.currentControlFlow.then(() => {
            return this.driver.wait(
                webdriver.until.elementLocated(this.getLocatorOrHashFromHashOrIdString(element)),
                cf.WEBDRIVER_IDLE_TIME
            );
        });

        return this;
    }

    public screenshot(filePath: string): WebdriverTest {
        this.currentControlFlow = this.currentControlFlow.then(() => {
            let promise = new Promise<void>((resolve, reject)=>{
                this.driver.takeScreenshot().then(data => {
                    createFolder(dirname(filePath));
                    fs.writeFile(filePath, data.replace(/^data:image\/png;base64,/,''), 'base64', function(err) {
                        if(err) reject(err);
                    });
                    resolve();
                }).then(null, (err: Error) => {
                    if(err) reject(err);
                });
            });

            return promise;
        });

        return this;
    }

    public end(callback?: (err?: Error) => void): void {
        this.currentControlFlow.then(() => {
            this.driver.quit().then(() => {
                if (callback) {
                    callback();
                }
            });
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

    private setBrowserstackCapabilities(): void {
        this.capabilites['browserstack.user'] = this.capabilites['browserstack.user'] ||
            process.env.BROWSERSTACK_USER;

        this.capabilites['browserstack.key'] = this.capabilites['browserstack.key'] ||
            process.env.BROWSERSTACK_KEY;

        this.capabilites['browserstack.local'] = 'true';
        this.capabilites['browserstack.debug'] = 'true';
    }

    private setDefaultScreenResolution(): void {
        this.driver.manage().window().setSize(cf.DEFAULT_SCREEN_RESOLUTION.WIDTH, cf.DEFAULT_SCREEN_RESOLUTION.HEIGHT);
    }
}