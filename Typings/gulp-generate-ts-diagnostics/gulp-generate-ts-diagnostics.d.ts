
/// <reference path='../node/node.d.ts'/>

declare module 'gulp-generate-ts-diagnostics' {
    module GeneratTsDiagnostics {
        export interface DiagnosticMessageProperty {
            name: string;
            type: string;
            optional?: boolean;
        }

        export type DiagnosticMessageProperties = DiagnosticMessageProperty[];
    }

    function GeneratTsDiagnostics(props: GeneratTsDiagnostics.DiagnosticMessageProperties): NodeJS.ReadWriteStream;

    export = GeneratTsDiagnostics;
}