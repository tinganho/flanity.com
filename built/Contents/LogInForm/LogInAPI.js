"use strict";
var Index_1 = require('../../Library/Index');
function login(req, res) {
    Index_1.HTTP.post('/sessions', {
        body: {
            clientId: process.env.CLIENT_ID || cf.DEFAULT_CLIENT_ID,
            clientSecret: process.env.CLIENT_SECRET || cf.DEFAULT_CLIENT_SECRET,
            email: req.body.email,
            username: req.body.username,
            password: req.body.password,
        },
    })
        .then(function (response) {
        var body = response.body;
        if (typeof body !== 'string') {
            res.status(response.status).json(body);
        }
    })
        .catch(function (response) {
        if (response.status) {
            res.status(response.status).json(response.body);
        }
    });
}
exports.login = login;
//# sourceMappingURL=LogInAPI.js.map