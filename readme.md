react-composer
================

`react-composer` is a client/server router for your react applications. A developer defines a set of declaration for a page. Like what models and views a page should have. `react-composer` then automatically render/compose pages both on the client and server on each route.

First we define some default document configurations:
```typescript
export default {
    googleAnatlyticsId: 'u-1872637846324',
    styles: [
        '/public/styles/documents/default.css',
        '/public/styles/contents/styles.css'
    ],
    main: 'Documents/Mains/Application'
}
```
Then, we define a page:

```typescript
import defaultConfigs from './defaultConfigs';
import Document from './Document';
import Body_withTopBar_withFooter from './Body_withTopBar_withFooter';
import Web from './Platforms/Web'

export default function(HomePage) {
    HomePage
        .onPlatform(Web)
        .hasDocument(Document, defaultConfigs)
        .hasLayout(Body_withTopBar_withFooter, {
            TopBar: MainMenu,
            Body: Feed,
            Footer: Footer
        });
}
```

```typescript
import {express} from 'express';
import * as composer from 'composer';

// import defined pages
import HomePage from './HomePage';
import TodoPage from './TodoPage';

var app = express();

app.use(composer.pages({
    '/': HomePage,
    '/todos': TodoPage
}));
```

### Initial setup
```typescript
import composer from 'composer';
var app = express();
...
composer.init({
    app,
    clientConfigurationPath: './conf/client',
    rootPath: __dirname
});
```

## Define a platform
```typescript
import { Request } from 'express';
import { PlatformDetect } from 'react-composer';

export var Web implements PlatformDetect {
    name: 'web',
    detect: (req: Request) => true,
}
export default detect;
```
