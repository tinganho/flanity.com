
import { ComponentInfo, ContentComponentInfo, ClassInfo } from './Router';
import {
    createTextWriter,
    EmitTextWriter,
    forEach
} from '../Library/Index';

export const enum ModuleKind {
    None,
    Amd,
    CommonJs,
}

interface EmitClientComposerOptions {
    moduleKind: ModuleKind;
}

interface PlatformEmitInfo {
    document: ComponentInfo;
    layout: ComponentInfo;
    contents: ContentComponentInfo[];
}

export interface PlatformEmitIndex {
    [name: string]: PlatformEmitInfo;
}

export interface PageEmitInfo {
    route: string;
    platforms: PlatformEmitIndex;
}

export interface PlatformDetects {
    [index: string]: () => boolean;
}

export function emitBindings(
    output: string,
    imports: ComponentInfo[],
    pageInfos: PageEmitInfo[],
    platformDetects: PlatformDetects,
    writer: EmitTextWriter,
    opt: EmitClientComposerOptions) {

    output = output.replace(/\.js$/, '');

    let documents: string[] = [];
    let layouts: string[] = [];
    let contents: string[] = [];

    let { write, writeLine, increaseIndent, decreaseIndent, record, revertBackToLastRecord, writeFormattedText } = writer;

    writeClientComposer();
    return;

    function writeClientComposer(): void {
        if (opt.moduleKind === ModuleKind.Amd) {
            writeAMDStart();
            increaseIndent();
        }
        else {
            writeCommonJsImportList();
        }

        writeBindings();
        writePlatformDetects();
        writeRoutingTable();
        writeRouterInit();
        if (opt.moduleKind === ModuleKind.Amd) {
            decreaseIndent();
            writeAMDEnd();
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
            for (let i in pageInfo.platforms) {
                let document = pageInfo.platforms[i].document.view.className;
                if (documents.indexOf(document) === -1) {
                    write(`App.Components.Document.${document} = ${document};`);
                    writeLine();
                    documents.push(document);
                }
                let layout = pageInfo.platforms[i].layout.view.className;
                if (layouts.indexOf(layout) === -1) {
                    write(`App.Components.Layout.${layout} = ${layout};`);
                    writeLine();
                    layouts.push(layout);
                }

                for (let contentInfo of pageInfo.platforms[i].contents) {
                    let contentView = contentInfo.view.className;
                    if (contents.indexOf(contentView) === -1) {
                        write(`App.Components.Contents.${contentView} = ${contentView};`);
                        writeLine();
                        if (contentInfo.data) {
                            let contentModel = contentInfo.data.className;
                            write(`App.Components.Contents.${contentModel} = ${contentModel};`);
                            writeLine();
                        }
                        contents.push(contentView);
                    }
                }

            }
        }
        writeLine();
        writeLine();
    }

    function writePlatformDetects(): void {
        writeLine('App.PlatformDetects = {');
        increaseIndent();
        for (let i in platformDetects) {
            write(i + ': ');
            writeFormattedText(platformDetects[i].toString());
            record();
            write(',');
            writeLine();
        }
        revertBackToLastRecord();
        writeLine();
        writeEndIndex();
        writeLine();
    }

    function writeRoutingTable(): void {
        writeLine(`App.RoutingTable = [`);
        increaseIndent();
        forEach(pageInfos, (pageInfo, index) => {
            write('{');
            writeLine();
            increaseIndent();
            write(`route: '${pageInfo.route}',`);
            writeLine();
            writeStartIndex('platforms');
            for (let i in pageInfo.platforms) {
                let platform = pageInfo.platforms[i];

                write(`${i}: {`);
                increaseIndent();
                writeLine();

                writeStartIndex('document');
                    write('view: ');
                    writeClassInfo(platform.document.view);
                writeEndIndex('document');

                writeCommaNewLine();

                writeStartIndex('layout');
                    write('view: ');
                    writeClassInfo(platform.layout.view);
                writeEndIndex('layout');

                writeCommaNewLine();

                write('contents: [');
                increaseIndent();
                writeLine();
                forEach(platform.contents, (content, index) => {
                    write('{');
                    increaseIndent();
                    writeLine();
                    write(`name: '${content.name}',`);
                    writeLine();
                    write(`region: '${content.region}',`);
                    writeLine();
                    if (content.data) {
                        write('data: ');
                        writeClassInfo(content.data);
                        write(',');
                        writeLine();
                    }
                    write('view: ');
                    writeClassInfo(content.view);
                    writeLine();
                    decreaseIndent();
                    write('}');
                    if (index !== pageInfo.platforms[i].contents.length -1) {
                        write(',');
                    }
                    writeLine();
                });
                decreaseIndent();
                write(']');
                writeLine();
                decreaseIndent();
                write('}');
                record();
                writeCommaNewLine();
            }

            revertBackToLastRecord();
            writeLine();

            writeEndIndex('platform');
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
        writeLine(`App.router = window.__Router = new Router.default('App', App.RoutingTable, App.Components, App.PlatformDetects);`);
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
    function writeAMDStart(): void {
        write('define([');
        for (let i = 0; i<imports.length; i++) {
            writeQuote();
            write(imports[i].view.importPath);
            writeQuote();
            write(', ');
            if (imports[i].data) {
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
            if (imports[i].data) {
                write(imports[i].data.className);
                write(', ');
            }
        }
        write('Router');
        write(') {');
        writeLine();
    }

    function writeAMDEnd() {
        write('});');
        writeLine();
    }

    function writeCommonJsImportList(): void {
        let classNames: string[] = [];
        for (let i of imports) {
            if (classNames.indexOf(i.view.className) === -1) {
                write(`var ${i.view.className} = require('${i.view.importPath}').${i.view.className};`);
                writeLine();
                if (i.data) {
                    write(`var ${i.data.className} = require('${i.data.importPath}').${i.data.className};`);
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

    function writeStartIndex(name: string) {
        write(`${name}: {`);
        increaseIndent();
        writeLine();
    }

    function writeEndIndex(name?: string) {
        writeLine();
        decreaseIndent();
        write('}');
    }

    function writeCommaNewLine() {
        write(',');
        writeLine();
    }
}
