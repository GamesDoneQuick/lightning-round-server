// Packages
const Raven = require('raven');

// Ours
const config = require('./config');
const log = require('./log');

if (config.sentry && config.sentry.dsn && process.env.HEROKU_SLUG_COMMIT) {
	Raven.config(config.sentry.dsn, {
		// Requires that the experimental "dyno metadata" feature be enabled for this app.
		// See https://devcenter.heroku.com/articles/dyno-metadata for instructions.
		release: process.env.HEROKU_SLUG_COMMIT
	}).install();

	process.on('unhandledRejection', err => {
		err.message = `Unhandled promise rejection: ${err.message}`;
		console.error(err);
		Raven.captureException(err);
	});

	log.info('Sentry enabled.');
}
