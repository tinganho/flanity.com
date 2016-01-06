
import { DocumentComponent, DocumentProps, React } from '../Library/Index';
import { System as SystemType } from '../Library/Server/System';
let __r = require;
let System: typeof SystemType = inServer ? __r('../Library/Server/System').System : undefined;


interface ComposerDocumentProps extends DocumentProps {
    title: string;
    layout: string;
    overlay: string;
}

export class Document extends DocumentComponent<ComposerDocumentProps, {}, Elements> {
    public weixinShare: string;
    public googleAnalytics: string;

    constructor (
        props?: ComposerDocumentProps,
        children?: Child[]) {

        super(props, children);

        if (inServer) {
            this.weixinShare = System.readFile(System.joinPaths(__dirname, '../Public/Scripts/Vendor/weixin-share.js'));
            if (process.env.NODE_ENV === 'production') {
                this.googleAnalytics = System.readFile(System.joinPaths(__dirname, '../Public/Scripts/Vendor/google-analytics.js'));
            }
        }
    }

    public render() {
        return (
            <html lang={this.props.pageInfo.language}>
                <head>
                    <title>{this.props.pageInfo.title}</title>
                    <meta id='OGTitle' property='og:title' content={this.props.pageInfo.title} />
                    <meta property='og:locale' content={this.props.pageInfo.language} />
                    <meta http-equiv='content-language' content={this.props.pageInfo.language} />
                    <meta charset='utf-8'></meta>
                    <meta http-equiv='X-UA-Compatible' content='IE=edge,chrome=1'></meta>
                    <meta property='og:type' content='website' />
                    <meta name='twitter:card' content='summary_large_image' />

                    {
                        (() => {
                            if (this.props.pageInfo.description) {
                                return [
                                    <meta id='PageDescription' name='description' content={this.props.pageInfo.description} />,
                                    <meta id='OGDescription' property='og:description' content={this.props.pageInfo.description} />
                                ];
                            }
                        })()
                    }

                    {
                        (() => {
                            if (this.props.pageInfo.image) {
                                return <meta id='OGImage' property='og:image' content={this.props.pageInfo.image} />;
                            }
                        })()
                    }

                    {
                        (() => {
                            if (this.props.pageInfo.URL) {
                                return [
                                    <link rel='canonical' href={this.props.pageInfo.URL} />,
                                    <meta property='og:url' content={this.props.pageInfo.URL} />
                                ];
                            }
                        })()
                    }

                    <link rel='mask-icon' href='/Public/Images/Nalie.svg' color='red'/>
                    <link rel='icon' sizes='any' mask href='/Public/Images/Nalie.svg'/>
                    <link rel='icon' type='image/x-icon' href='/Public/Images/Nalie.ico'/>
                    <link rel='shortcut icon' sizes='196x196' href='/Public/Images/Nalie.svg'/>
                    <link rel='shortcut icon' type='image/x-icon' href='/Public/Images/Nalie.ico'/>
                    <link rel='stylesheet' href='/Public/Styles/Index.css'/>
                    <meta name='viewport' content='user-scalable=no, initial-scale=1, maximum-scale=1, minimum-scale=1, width=device-width, height=device-height' />
                    <meta property='og:site_name' content='Flanity' />
                    <script type='text/javascript' html={this.weixinShare}></script>
                    <script type='text/javascript' html='window.inServer = false; window.inClient = true;'></script>
                    <script type='text/javascript' html='document.addEventListener("touchstart", function(){}, true);'></script>
                    <script type='text/javascript' src='/Public/Scripts/Vendor/modernizr.js'></script>
                    <script type='text/javascript' src='/Public/Scripts/Vendor/promise.js'></script>
                    <script type='text/javascript' src='/Public/Scripts/Vendor/promise.prototype.finally.js'></script>
                    <script type='text/javascript' src='/Public/Scripts/Vendor/system.js'></script>
                    <script type='text/javascript' src='/Public/Scripts/Localizations/all.js'></script>
                    <script type='text/javascript' src='/Public/Scripts/Configurations.js'></script>
                    {
                        (()=> {
                            if (cf.IN_IMAGE_TEST) {
                                return <script type='text/javascript' src='/Public/Scripts/Vendor/FontLoader/FontLoader.js'></script>
                            }
                        })()
                    }
                    <script html={this.googleAnalytics}></script>

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

                    {
                        (() => {
                            if (this.manifestExists) {
                                return <script type='text/javascript' src='/Public/Scripts/App.js'></script>
                            }
                            else {
                                return <script type='text/javascript' src='/Public/Scripts/Startup.js'></script>;
                            }
                        })()
                    }
                    <div id='UnFocus'></div>
                </body>
            </html>
        );
    }
}