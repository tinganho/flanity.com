
import { ServerConfigurations } from './Server';
import { System } from '../Library/Server/System';
import { formatConfiguration, mergeConfigurations } from '../Library/Server/Configurations';

export let ClientConfigurations = {

    /**
     * Default origin.
     *
     * @type string
     */
    ORIGIN: cf.ORIGIN,

    /**
     * Default page timeout in seconds.
     *
     * @type number
     */
    DEFAULT_PAGE_TIMEOUT: cf.DEFAULT_PAGE_TIMEOUT,

    /**
     * Default page timeout in seconds.
     *
     * @type string
     */
    DEFAULT_HTTP_REQUEST_HOST: System.config.backend.host,

    /**
     * Default page timeout in seconds.
     *
     * @type number
     */
    DEFAULT_HTTP_REQUEST_PORT: System.config.backend.port,

    /**
     * Default page timeout in seconds.
     *
     * @type boolean
     */
    DEFAULT_HTTP_REQUEST_HTTPS: System.config.backend.https,

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

    /**
     * Flag for deciding if runtime is in image test.
     *
     * @type boolean
     */
    IN_IMAGE_TEST: cf.IN_IMAGE_TEST,
}

ClientConfigurations = formatConfiguration(ClientConfigurations);
ClientConfigurations = mergeConfigurations(ClientConfigurations, ServerConfigurations);

export default ClientConfigurations;