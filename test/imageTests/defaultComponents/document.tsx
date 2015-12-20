
import * as React from '../../../app/components/element';
import { ComposerDocument, Link } from '../../../app/components/layerComponents';

interface ComposerDocumentProps extends DocumentProps {
    title: string;
    layout: string;
}

export class Document extends ComposerDocument<ComposerDocumentProps, {}, Elements> {
    public id = 'composer-document';
    public render() {
        return (
            <html lang='en'>
                <head>
                    <title>{this.props.title}</title>
                    <link rel='stylesheet' href='/public/styles/contents.css'/>
                    <link rel='stylesheet' href='/public/styles/layout.css'/>
                    <script type='text/javascript' dangerouslySetInnerHTML={{ __html: 'window.inServer = false; window.inClient = true;' }}></script>
                    <script type='text/javascript' src='/public/scripts/vendor/promise.js'></script>
                    <script type='text/javascript' src='/public/scripts/vendor/promise.prototype.finally.js'></script>
                    <script type='text/javascript' src='/public/scripts/vendor/system.js'></script>
                    <script type='text/javascript' src='/public/scripts/startup.js'></script>
                    {this.props.jsonScriptData.map(attr => {
                        return (
                            <script
                                type='application/json'
                                id={attr.id}>
                                {JSON.stringify(attr)}
                            </script>
                        );
                    })}
                </head>
                <body id="LayoutRegion">
                    {this.props.layout}
                </body>
            </html>
        );
    }
}