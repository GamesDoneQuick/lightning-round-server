const fs = require('fs');
const convict = require('convict');

convict.addFormat({
	name: 'key',
	validate(val) {
		return typeof val === 'string';
	},
	coerce(val) {
		return val.replace(/\\n/g, '\n');
	}
});

const conf = convict({
	logLevel: {
		doc: 'The level at which to log info',
		format: ['trace', 'debug', 'info', 'warn', 'error'],
		default: 'info',
		env: 'LOG_LEVEL',
		arg: 'logLevel'
	},
	firebase: {
		projectId: {
			doc: '',
			format: String,
			default: '',
			env: 'FIREBASE_PROJECT_ID',
			arg: 'firebaseProjectId'
		},
		clientEmail: {
			doc: '',
			format: String,
			default: '',
			env: 'FIREBASE_CLIENT_EMAIL',
			arg: 'firebaseClientEmail'
		},
		privateKey: {
			doc: '',
			format: 'key',
			default: '',
			env: 'FIREBASE_PRIVATE_KEY',
			arg: 'firebasePrivateKey'
		},
		databaseURL: {
			doc: '',
			format: String,
			default: '',
			env: 'FIREBASE_DATABASE_URL',
			arg: 'firebaseDatabaseURL'
		}
	},
	twitter: {
		consumerKey: {
			doc: 'Twitter API consumer key',
			format: String,
			default: '',
			env: 'TWITTER_CONSUMER_KEY',
			arg: 'twitterConsumerKey'
		},
		consumerSecret: {
			doc: 'Twitter API consumer secret',
			format: String,
			default: '',
			env: 'TWITTER_CONSUMER_SECRET',
			arg: 'twitterConsumerSecret'
		},
		accessTokenKey: {
			doc: 'Twitter API access token key',
			format: String,
			default: '',
			env: 'TWITTER_ACCESS_TOKEN_KEY',
			arg: 'twitterAccessTokenKey'
		},
		accessTokenSecret: {
			doc: 'Twitter API access token secret',
			format: String,
			default: '',
			env: 'TWITTER_ACCESS_TOKEN_SECRET',
			arg: 'twitterAccessTokenSecret'
		}
	},
	sentry: {
		dsn: {
			doc: 'The Data Source Name to use when reporting errors to Sentry.io',
			format: String,
			default: '',
			env: 'SENTRY_DSN',
			arg: 'sentryDsn'
		}
	}
});

if (fs.existsSync('./config.json')) {
	conf.loadFile('./config.json');
}

// Perform validation
conf.validate({allowed: 'strict'});

module.exports = conf;
