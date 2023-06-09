/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

var express = require('express');

var msal = require('@azure/msal-node');

var {
    msalConfig,
    REDIRECT_URI,
    POST_LOGOUT_REDIRECT_URI
} = require('../authConfig');

const router = express.Router();
const msalInstance = new msal.ConfidentialClientApplication(msalConfig);
const cryptoProvider = new msal.CryptoProvider();


router.get('/', function (req, res, next) {
    res.render('index', {
        title: 'AllAssist - Web App',
        isAuthenticated: req.session.isAuthenticated,
        username: req.session.account?.username,
    });
});

router.post('/autorize', async function (req, res, next) {
    	if (req.body.state) {
        const state = JSON.parse(cryptoProvider.base64Decode(req.body.state));

        // check if csrfToken matches
        if (state.csrfToken === req.session.csrfToken) {
            req.session.authCodeRequest.code = req.body.code; // authZ code
            req.session.authCodeRequest.codeVerifier = req.session.pkceCodes.verifier // PKCE Code Verifier

            try {
                const tokenResponse = await msalInstance.acquireTokenByCode(req.session.authCodeRequest);
                req.session.accessToken = tokenResponse.accessToken;
                req.session.idToken = tokenResponse.idToken;
                req.session.account = tokenResponse.account;
                req.session.isAuthenticated = true;
		console.log(state);
                //res.redirect(state.redirectTo);
		console.log("REdireccionar a:",POST_LOGOUT_REDIRECT_URI+"/users/id");
		res.redirect(POST_LOGOUT_REDIRECT_URI+"/users/id");
            } catch (error) {
                next(error);
            }
        } else {
            //next(new Error('csrf token does not match'));
		res.redirect(POST_LOGOUT_REDIRECT_URI+"/auth/signout");
        }
    } else {
        next(new Error('state is missing'));
    }

});

router.get('/autorize', function (req, res, next) {
    	res.render('test');
});

module.exports = router;
