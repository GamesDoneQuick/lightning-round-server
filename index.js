'use strict';

// Make Heroku happy
require('http').createServer((req, res) => {
	res.writeHead(200);
	res.end('hello world\n');
}).listen(process.env.PORT || 8001);

// Packages
const admin = require('firebase-admin');

// Ours
const config = require('./lib/config');
const log = require('./lib/log');
require('./lib/sentry');

admin.initializeApp({
	credential: admin.credential.cert({
		project_id: config.get('firebase.projectId'),
		client_email: config.get('firebase.clientEmail'),
		private_key: config.get('firebase.privateKey')
	}),
	databaseURL: config.get('firebase.databaseURL')
});

const database = admin.database();

// Spin up the individual libs.
require('./lib/tweets')(database);
require('./lib/users')(admin, database);

log.info('Ready!');
