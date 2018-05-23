// Packages
const Raven = require('raven');

// Ours
const config = require('./config');
const log = require('./log');

const sentryConfig = config.get('sentry');

if (sentryConfig && sentryConfig.dsn && process.env.HEROKU_SLUG_COMMIT) {
	Raven.config(sentryConfig.dsn, {
		// Requires that the experimental "dyno metadata" feature be enabled for this app.
		// See https://devcenter.heroku.com/articles/dyno-metadata for instructions.
		release: process.env.HEROKU_SLUG_COMMIT
	}).install();

	process.on('unhandledRejection', err => {
		err.message = `Unhandled promise rejection: ${err.message}`;
		log.error(err);
		Raven.captureException(err);
	});

	log.info('Sentry enabled.');
}
