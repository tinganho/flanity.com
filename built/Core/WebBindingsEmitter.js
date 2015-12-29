"use strict";
var Index_1 = require('../Library/Index');
function emitBindings(output, imports, pageInfos, writer, opt) {
    output = output.replace(/\.js$/, '');
    var documents = [];
    var layouts = [];
    var contents = [];
    var write = writer.write, writeLine = writer.writeLine, increaseIndent = writer.increaseIndent, decreaseIndent = writer.decreaseIndent;
    writeClientComposer();
    return;
    function writeClientComposer() {
        if (opt.moduleKind === 1) {
            writeAmdStart();
            increaseIndent();
        }
        else {
            writeCommonJsImportList();
        }
        writeBindings();
        writeRoutingTable();
        writeRouterInit();
        if (opt.moduleKind === 1) {
            decreaseIndent();
            writeAmdEnd();
        }
    }
    function writeQuote() {
        write('\'');
    }
    function writeBindings() {
        write("var App = {};");
        writeLine();
        write("window.App = App;");
        writeLine();
        write("App.Components = { Document: {}, Layout: {}, Contents: {} };");
        writeLine();
        for (var _i = 0, pageInfos_1 = pageInfos; _i < pageInfos_1.length; _i++) {
            var pageInfo = pageInfos_1[_i];
            var document_1 = pageInfo.document.view.className;
            if (documents.indexOf(document_1) === -1) {
                write("App.Components.Document." + document_1 + " = " + document_1 + ";");
                writeLine();
                documents.push(document_1);
            }
            var layout = pageInfo.layout.view.className;
            if (layouts.indexOf(layout) === -1) {
                write("App.Components.Layout." + layout + " = " + layout + ";");
                writeLine();
                layouts.push(layout);
            }
            for (var _a = 0, _b = pageInfo.contents; _a < _b.length; _a++) {
                var contentInfo = _b[_a];
                var contentView = contentInfo.view.className;
                if (contents.indexOf(contentView) === -1) {
                    write("App.Components.Contents." + contentView + " = " + contentView + ";");
                    writeLine();
                    if (contentInfo.model) {
                        var contentModel = contentInfo.model.className;
                        write("App.Components.Contents." + contentModel + " = " + contentModel + ";");
                        writeLine();
                    }
                    contents.push(contentView);
                }
            }
        }
        writeLine();
        writeLine();
    }
    function writeRoutingTable() {
        write("App.RoutingTable = [");
        writeLine();
        increaseIndent();
        Index_1.forEach(pageInfos, function (pageInfo, index) {
            write('{');
            writeLine();
            increaseIndent();
            write("route: '" + pageInfo.route + "',");
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
            Index_1.forEach(pageInfo.contents, function (content, index) {
                write('{');
                increaseIndent();
                writeLine();
                write("name: '" + content.name + "',");
                writeLine();
                write("region: '" + content.region + "',");
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
                if (index !== pageInfo.contents.length - 1) {
                    write(',');
                }
                writeLine();
            });
            decreaseIndent();
            write(']');
            writeLine();
            decreaseIndent();
            write('}');
            if (index !== pageInfos.length - 1) {
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
        write("App.router = window.__Router = new Router.default('App', App.RoutingTable, App.Components);");
        writeLine();
    }
    function writeClassInfo(classInfo) {
        write('{');
        increaseIndent();
        writeLine();
        write("className: '" + classInfo.className + "',");
        writeLine();
        write("importPath: '" + classInfo.importPath + "'");
        writeLine();
        decreaseIndent();
        write('}');
    }
    function writeAmdStart() {
        write('define([');
        for (var i = 0; i < imports.length; i++) {
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
        for (var i = 0; i < imports.length; i++) {
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
    function writeCommonJsImportList() {
        var classNames = [];
        for (var _i = 0, imports_1 = imports; _i < imports_1.length; _i++) {
            var i = imports_1[_i];
            if (classNames.indexOf(i.view.className) === -1) {
                write("var " + i.view.className + " = require('" + i.view.importPath + "')." + i.view.className + ";");
                writeLine();
                if (i.model) {
                    write("var " + i.model.className + " = require('" + i.model.importPath + "')." + i.model.className + ";");
                    writeLine();
                }
                classNames.push(i.view.className);
            }
        }
        write("var Router = require('" + output + "');");
        writeLine();
    }
    function writeVariableList(vars) {
        for (var i in vars) {
            write(vars[i]);
            if (i !== vars.length - 1) {
                write(',');
            }
        }
    }
}
exports.emitBindings = emitBindings;
//# sourceMappingURL=WebBindingsEmitter.js.map