/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

var express = require('express');
var router = express.Router();

var fetch = require('../fetch');

var { GRAPH_ME_ENDPOINT,HOST_BD,USER_BD,PWD_BD,DB,URL_ROOT } = require('../authConfig');

var mysql      = require('mysql');
var pool = mysql.createPool({
  connectionLimit : 100, //important
  host     : "localhost",
  user     : "sistema",
  password : "sist_0914Chb",
  database : "sistema",
  debug    :  false
});
var root="https://allassist.dev";

// custom middleware to check auth state
function isAuthenticated(req, res, next) {
    if (!req.session.isAuthenticated) {
        return res.redirect('/extra/auth/signin'); // redirect to sign-in route
    }

    next();
};

router.get('/id',
    isAuthenticated, // check if user is authenticated
    async function (req, res, next) {
	var llaves=[];
	var values=[];
	var update=[];
	console.log("----------------------------------")
	console.log(req.session.account.idTokenClaims.aio);
	console.log("----------------------------------")
	for (const [key, value] of Object.entries(req.session.account.idTokenClaims)) {
 	// console.log(`${key}: ${value}`);
	 llaves.push(key)
         values.push(value)
	if(key != "preferred_username")
	 update.push(`${key}='${value}'`);
	}
	pool.getConnection(function(err, connection) {
	  if (err) throw err;
  		console.log("Connected!");
		var sql_delete = "DELETE FROM azure_auth WHERE preferred_username='"+req.session.account.idTokenClaims.preferred_username+"' ";
       		 connection.query(sql_delete, function (err, result) {
                  if (err) throw err;
		  //console.log(sql_delete);
                  console.log("1 record deleted");

	 	//var sql = "INSERT INTO azure_auth ("+llaves.join()+") VALUES ('"+values.join("', '")+"') ON DUPLICATE KEY UPDATE "+update.join()+"";
	 	var sql = "INSERT INTO azure_auth ("+llaves.join()+") VALUES ('"+values.join("', '")+"')";
  	 	connection.query(sql, function (err, result) {
    			if (err) throw err;
			console.log("Number of records inserted: " + result.affectedRows);
			//console.log(sql)
  	 	});
         });
	console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>"+req.session.account.idTokenClaims.aio)
	 console.log(root+"/sistema/vistas/azureAccess.php?variable="+encodeURIComponent(req.session.account.idTokenClaims.aio)) //encodeURIComponent
	 //res.redirect(root+"/sistema/azureAccess.php?aio="+encodeURIComponent(req.session.account.idTokenClaims.aio))
	 res.redirect(root+"/sistema/vistas/azureAccess.php?variable="+encodeURIComponent(req.session.account.idTokenClaims.aio))
	console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>")
	});
        //res.render('id', { idTokenClaims: req.session.account.idTokenClaims });
    }
);

router.get('/profile',
    isAuthenticated, // check if user is authenticated
    async function (req, res, next) {
        try {
            const graphResponse = await fetch(GRAPH_ME_ENDPOINT, req.session.accessToken);
            res.render('profile', { profile: graphResponse });
        } catch (error) {
            next(error);
        }
    }
);


module.exports = router;
