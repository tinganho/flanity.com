
import { ComponentInfo, ContentComponentInfo, ClassInfo } from './Router';
import {
    createTextWriter,
    forEach
} from '../Library/Index';

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
    output: string,
    imports: ComponentInfo[],
    pageInfos: PageEmitInfo[],
    writer: EmitTextWriter,
    opt: EmitClientComposerOptions) {

    output = output.replace(/\.js$/, '');

    let documents: string[] = [];
    let layouts: string[] = [];
    let contents: string[] = [];

    let { write, writeLine, increaseIndent, decreaseIndent } = writer;

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
        write(`var App = {};`);
        writeLine();
        write(`window.App = App;`);
        writeLine();
        write(`App.Components = { Document: {}, Layout: {}, Contents: {} };`);
        writeLine();
        for (let pageInfo of pageInfos) {
            let document = pageInfo.document.view.className;
            if (documents.indexOf(document) === -1) {
                write(`App.Components.Document.${document} = ${document};`);
                writeLine();
                documents.push(document);
            }
            let layout = pageInfo.layout.view.className;
            if (layouts.indexOf(layout) === -1) {
                write(`App.Components.Layout.${layout} = ${layout};`);
                writeLine();
                layouts.push(layout);
            }

            for (let contentInfo of pageInfo.contents) {
                let contentView = contentInfo.view.className;
                if (contents.indexOf(contentView) === -1) {
                    write(`App.Components.Contents.${contentView} = ${contentView};`);
                    writeLine();
                    if (contentInfo.model) {
                        let contentModel = contentInfo.model.className;
                        write(`App.Components.Contents.${contentModel} = ${contentModel};`);
                        writeLine();
                    }
                    contents.push(contentView);
                }
            }
        }
        writeLine();
        writeLine();
    }

    function writeRoutingTable(): void {
        write(`App.RoutingTable = [`);
        writeLine();
        increaseIndent();
        forEach(pageInfos, (pageInfo, index) => {
            write('{');
            writeLine();
            increaseIndent();
            write(`route: '${pageInfo.route}',`);
            writeLine();
            write('document: {');
            increaseIndent();
            writeLine();
            write('view: ');
            writeClassInfo(pageInfo.document.view);
            decreaseIndent();
            writeLine();
            write('}');
            write(',');
            writeLine();
            write('layout: {');
            increaseIndent();
            writeLine();
            write('view: ');
            writeClassInfo(pageInfo.layout.view);
            decreaseIndent();
            writeLine();
            write('}');
            write(',');
            writeLine();
            write('contents: [');
            writeLine();
            increaseIndent();
            forEach(pageInfo.contents, (content, index) => {
                write('{');
                increaseIndent();
                writeLine();
                write(`name: '${content.name}',`);
                writeLine();
                write(`region: '${content.region}',`);
                writeLine();
                write('model: ');
                writeClassInfo(content.model);
                write(',');
                writeLine();
                write('view: ');
                writeClassInfo(content.view);
                writeLine();
                decreaseIndent();
                write('}');
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
        write(`App.router = window.__Router = new Router.default('App', App.RoutingTable, App.Components);`);
        writeLine();
    }

    function writeClassInfo(classInfo: ClassInfo): void {
        write('{');
        increaseIndent();
        writeLine();
        write(`className: '${classInfo.className}',`);
        writeLine();
        write(`importPath: '${classInfo.importPath}'`);
        writeLine();
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
            write(imports[i].view.importPath);
            writeQuote();
            write(', ');
            if (imports[i].model) {
                writeQuote();
                write(imports[i].view.importPath);
                writeQuote();
                write(', ');
            }
        }
        writeQuote();
        write(output);
        writeQuote();
        write('], function(');
        for (let i = 0; i<imports.length; i++) {
            write(imports[i].view.className);
            write(', ');
            if (imports[i].model) {
                write(imports[i].model.className);
                write(', ');
            }
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
        let classNames: string[] = [];
        for (let i of imports) {
            if (classNames.indexOf(i.view.className) === -1) {
                write(`var ${i.view.className} = require('${i.view.importPath}').${i.view.className};`);
                writeLine();
                if (i.model) {
                    write(`var ${i.model.className} = require('${i.model.importPath}').${i.model.className};`);
                    writeLine();
                }
                classNames.push(i.view.className);
            }
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