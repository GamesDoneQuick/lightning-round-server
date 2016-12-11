const fs = require('fs');
const convict = require('convict');
const conf = convict({
	logLevel: {
		doc: 'The level at which to log info',
		format: ['trace', 'debug', 'info', 'warn', 'error'],
		default: 'info',
		env: 'LOG_LEVEL',
		arg: 'logLevel'
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
	}
});

if (fs.existsSync('./config.json')) {
	conf.loadFile('./config.json');
}

// Perform validation
conf.validate({strict: true});

module.exports = conf;
