
/// <reference path='../client/router.d.ts'/>

import { createTextWriter, forEach } from '../core';
import { sys } from '../sys';

export const enum ModuleKind {
    None,
    Amd,
    CommonJs,
}

interface EmitTextWriter {
    write(s: string): void;
    writeLine(): void;
    increaseIndent(): void;
    decreaseIndent(): void;
    getText(): string;
    rawWrite(s: string): void;
    writeLiteral(s: string): void;
    getTextPos(): number;
    getLine(): number;
    getColumn(): number;
    getIndent(): number;
}

interface EmitClientComposerOptions {
    moduleKind: ModuleKind;
}

export interface PageEmitInfo {
    route: string;
    document: ComponentInfo;
    layout: ComponentInfo;
    contents: ContentComponentInfo[];
}

export function emitBindings(
    appName: string,
    output: string,
    imports: ComponentInfo[],
    pageInfos: PageEmitInfo[],
    writer: EmitTextWriter,
    opt: EmitClientComposerOptions) {

    output = output.replace(/\.js$/, '');

    let {write, writeLine, increaseIndent, decreaseIndent } = writer;

    writeClientComposer();
    return;

    function writeClientComposer(): void {
        if (opt.moduleKind === ModuleKind.Amd) {
            writeAmdStart();
            increaseIndent();
        }
        else {
            writeCommonJsImportList();
        }

        writeBindings();
        writeRoutingTable();
        writeRouterInit();
        if (opt.moduleKind === ModuleKind.Amd) {
            decreaseIndent();
            writeAmdEnd();
        }
    }

    function writeQuote(): void {
        write('\'');
    }

    function writeBindings(): void {
        write(`var ${appName} = {};`);
        writeLine();
        write(`window.${appName} = ${appName};`);
        writeLine();
        write(`${appName}.Component = { Document: {}, Layout: {}, Content: {} };`);
        writeLine();
        for (let pageInfo of pageInfos) {
            let document = pageInfo.document.className;
            write(`${appName}.Component.Document.${document} = ${document};`);
            writeLine();
            let layout = pageInfo.layout.className;
            write(`${appName}.Component.Layout.${layout} = ${layout};`);
            writeLine();

            for (let contentInfo of pageInfo.contents) {
                let content = contentInfo.className;
                write(`${appName}.Component.Content.${content} = ${content};`);
                writeLine();
            }
        }
        writeLine();
        writeLine();
    }

    function writeRoutingTable(): void {
        write(`${appName}.RoutingTable = [`);
        writeLine();
        increaseIndent();
        forEach(pageInfos, (pageInfo, index) => {
            write('{');
            writeLine();
            increaseIndent();
            write(`route: '${pageInfo.route}',`);
            writeLine();
            write(`document: `);
            writeComponentEmitInfo(pageInfo.document);
            write(',');
            writeLine();
            write(`layout: `);
            writeComponentEmitInfo(pageInfo.layout);
            write(',');
            writeLine();
            write('contents: [');
            writeLine();
            increaseIndent();
            forEach(pageInfo.contents, (content, index) => {
                writeComponentEmitInfo(content);
                if (index !== pageInfo.contents.length -1) {
                    write(',');
                }
                writeLine();
            });
            decreaseIndent();
            write(']');
            writeLine();
            decreaseIndent();
            write('}');
            if (index !== pageInfos.length -1) {
                write(',');
            }
            writeLine();
        });
        decreaseIndent();
        writeLine();
        write('];');
        writeLine();
    }

    function writeRouterInit() {
        write(`${appName}.Router = window.__Router = new Router.default('${appName}', ${appName}.RoutingTable, ${appName}.Component);`);
        writeLine();
    }

    function writeComponentEmitInfo(component: ComponentInfo | ContentComponentInfo): void {
        write('{');
        increaseIndent();
        writeLine();
        write(`className: '${component.className}',`);
        writeLine();
        write(`importPath: '${component.importPath}',`);
        writeLine();
        if ((component as ContentComponentInfo).region) {
            write(`region: '${(component as ContentComponentInfo).region}'`);
            writeLine();
        }
        decreaseIndent();
        write('}');
    }

    /**
     * Writes `define([...], function(...) {`.
     */
    function writeAmdStart(): void {
        write('define([');
        for (let i = 0; i<imports.length; i++) {
            writeQuote();
            write(imports[i].importPath);
            writeQuote();
            write(', ');
        }
        writeQuote();
        write(output);
        writeQuote();
        write('], function(');
        for (let i = 0; i<imports.length; i++) {
            write(imports[i].className);
            write(', ');
        }
        write('Router');
        write(') {');
        writeLine();
    }

    function writeAmdEnd() {
        write('});');
        writeLine();
    }

    function writeCommonJsImportList(): void {
        for (let i of imports) {
            write(`var ${i.className} = require('${i.importPath}').${i.className};`);
            writeLine();
        }
        write(`var Router = require('${output}');`);
        writeLine();
    }

    function writeVariableList(vars: string[]): void {
        for (let i in vars) {
            write(vars[i]);

            if(i !== vars.length - 1) {
                write(',');
            }
        }
    }
}