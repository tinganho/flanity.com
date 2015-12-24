
import serverConf from './server';
import { sys } from '../lib/sys';
import {
    formatConf,
    mergeConf,
} from '../lib/conf';

export let clientConf = {
    /**
     * Default page timeout in seconds.
     *
     * @import
     */
    DEFAULT_PAGE_TIMEOUT: cf.DEFAULT_PAGE_TIMEOUT,

    /**
     * Default page timeout in seconds.
     *
     * @import
     */
    DEFAULT_HTTP_REQUEST_HOST: sys.config.backend.host,

    /**
     * Default page timeout in seconds.
     *
     * @import
     */
    DEFAULT_HTTP_REQUEST_PORT: sys.config.backend.port,

    /**
     * Default page timeout in seconds.
     *
     * @import
     */
    DEFAULT_HTTP_REQUEST_HTTPS: sys.config.backend.https,

    /**
     * Username syntax.
     *
     * @type string
     */
    USERNAME_SYNTAX: '^([a-zA-Z][a-zA-Z0-9_]*)$',

    /**
     * Username syntax.
     *
     * @type string
     */
    EMAIL_SYNTAX: '^[^\s@]+@[^\s@]+\.[^\s@]+$',
}

clientConf = formatConf(clientConf);
clientConf = mergeConf(clientConf, serverConf);

export default clientConf;