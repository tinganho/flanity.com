
import React = require('../components/component');
import { Component } from '../components/component';

interface P extends Props { }
interface S { }
interface E extends Elements { }

function getMountNode() {
    return document.getElementById('test');
}

export function getMountedDOMHTMLString(frag: DocumentFragment): string {
    let testMount = getMountNode();
    testMount.innerHTML = '';
    testMount.appendChild(frag);
    return testMount.innerHTML;;
}

export function prepareHTML(HTML: string): void {
    let testMount = getMountNode();
    testMount.innerHTML = HTML;
}