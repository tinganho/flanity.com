"use strict";
var Server_1 = require('./Server');
var System_1 = require('../Library/Server/System');
var Configurations_1 = require('../Library/Server/Configurations');
exports.ClientConfigurations = {
    DEFAULT_PAGE_TIMEOUT: cf.DEFAULT_PAGE_TIMEOUT,
    DEFAULT_HTTP_REQUEST_HOST: System_1.System.config.backend.host,
    DEFAULT_HTTP_REQUEST_PORT: System_1.System.config.backend.port,
    DEFAULT_HTTP_REQUEST_HTTPS: System_1.System.config.backend.https,
    USERNAME_SYNTAX: '^([a-zA-Z][a-zA-Z0-9_]*)$',
    EMAIL_SYNTAX: '^[^\s@]+@[^\s@]+\.[^\s@]+$',
};
exports.ClientConfigurations = Configurations_1.formatConfiguration(exports.ClientConfigurations);
exports.ClientConfigurations = Configurations_1.mergeConfigurations(exports.ClientConfigurations, Server_1.ServerConfigurations);
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = exports.ClientConfigurations;
//# sourceMappingURL=Client.js.map