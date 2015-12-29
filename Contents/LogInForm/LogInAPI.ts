
import { HTTP, HTTPResponseType, ModelResponse } from '../../Library/Index';
import express = require('express');

interface SessionResponse {
    accessToken: string;
    renewalToken: string;
    expiry: string;
}

export function login(req: express.Request, res: express.Response) {
    HTTP.post<ModelResponse<SessionResponse>>('/sessions', {
            body: {
                clientId: process.env.CLIENT_ID || cf.DEFAULT_CLIENT_ID,
                clientSecret: process.env.CLIENT_SECRET || cf.DEFAULT_CLIENT_SECRET,
                email: req.body.email,
                username: req.body.username,
                password: req.body.password,
            },
        })
        .then((response) => {
            let body = response.body;
            if (typeof body !== 'string') {
                res.status(response.status).json(body);
            }
        })
        .catch((response) => {
            if (response.status) {
                res.status(response.status).json(response.body);
            }
        });
}
