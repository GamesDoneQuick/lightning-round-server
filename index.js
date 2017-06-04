/* eslint-disable camelcase */
'use strict';

// Make Heroku happy
require('http').createServer((req, res) => {
	res.writeHead(200);
	res.end('hello world\n');
}).listen(process.env.PORT || 8001);

const log = require('./lib/log');
const POLL_INTERVAL = 15000;
const admin = require('firebase-admin');
const twemoji = require('twemoji');
const config = require('./lib/config');
admin.initializeApp({
	credential: admin.credential.cert({
		project_id: config.get('firebase.projectId'),
		client_email: config.get('firebase.clientEmail'),
		private_key: config.get('firebase.privateKey')
	}),
	databaseURL: config.get('firebase.databaseURL')
});

const Twitter = require('twitter');
const twitter = new Twitter({
	consumer_key: config.get('twitter.consumerKey'),
	consumer_secret: config.get('twitter.consumerSecret'),
	access_token_key: config.get('twitter.accessTokenKey'),
	access_token_secret: config.get('twitter.accessTokenSecret')
});

const database = admin.database();

const tweetsRef = database.ref('tweets');
let pollRepliesInterval;

database.ref('active_tweet_id').on('value', snapshot => {
	const activeTweetId = snapshot.val();

	clearInterval(pollRepliesInterval);

	if (!activeTweetId) {
		log.debug(`active_tweet_id is falsey, not updating active tweet`);
		return;
	}

	if (activeTweetId === '0') {
		log.debug(`active_tweet_id is zero, not updating active tweet`);
		return;
	}

	log.debug('active_tweet_id changed to:', activeTweetId);

	const ref = database.ref(`tweets/${activeTweetId}`);

	// If this is "const", it will eventually throw ReferenceErrors saying "listener is not defined" when
	// we try to remove the listener in the callback. I have no idea why. Might be an ES6 bug or edge case.
	// eslint-disable-next-line no-var
	var listener = ref.on('value', snapshot => {
		const promptTweet = snapshot.val();

		if (!promptTweet || promptTweet === 'pending') {
			log.debug(`no tweet with ID "${activeTweetId}" exists, will take it once it exists`);

			tweetsRef.child(activeTweetId).transaction(currentTweetData => {
				if (currentTweetData === null) {
					return 'pending';
				}

				return currentTweetData;
			});

			return;
		}

		if (listener) {
			ref.off('value', listener);
		}

		log.debug('fetched active tweet');

		// Fetch the all existing replies (up to 100).
		fetchLatestReplies(promptTweet);

		// Fetch new replies every 10 seconds.
		clearInterval(pollRepliesInterval);
		pollRepliesInterval = setInterval(() => {
			fetchLatestReplies(promptTweet);
		}, POLL_INTERVAL);
	});
});

// child_added is triggered once for each existing child and then again every time a
// new child is added to the specified path.
tweetsRef.on('child_added', snapshot => {
	if (snapshot.val() !== 'pending') {
		// This tweet has already been processed, so ignore.
		return;
	}

	log.debug('detected new tweet, key:', snapshot.key);

	const promptTweetId = snapshot.key;

	// Get the full tweet that this ID refers to.
	twitter.get(`statuses/show/${promptTweetId}`, (error, promptTweet) => {
		if (error) {
			console.error('Error getting prompt tweet:\n\t', error);
			return;
		}

		processTweet(promptTweet);

		promptTweet.replies = {};

		// Initialize the tweet in Firebase. It won't have any replies just yet.
		database.ref(`tweets/${promptTweetId}`).set(promptTweet);

		log.debug('added new tweet to database');
	});
});

function fetchLatestReplies(promptTweet) {
	log.debug('fetching latest replies for Tweet ID "%s"', promptTweet.id_str);
	twitter.get('search/tweets', {
		q: `to:${promptTweet.user.screen_name}`, // only get tweets that were to the user that made the prompt tweet
		count: 100, // max
		result_type: 'mixed', // a compromise between "recent" and "popular",

		// only get tweets newer than our target tweet
		since_id: promptTweet.max_search_id_str ? promptTweet.max_search_id_str : promptTweet.id_str
	}, (error, results) => {
		if (error) {
			console.error('Error fetching replies to prompt tweet:\n\t', error);
			return;
		}

		const newReplies = results.statuses.filter(tweet => {
			return tweet.in_reply_to_status_id_str === promptTweet.id_str;
		});

		newReplies.forEach(reply => {
			processTweet(reply);
			database.ref(`tweets/${promptTweet.id_str}/replies/${reply.id_str}`).set(reply);
		});

		log.debug('got latest replies for Tweet ID "%s", %s are new', promptTweet.id_str, newReplies.length);

		promptTweet.max_search_id_str = results.search_metadata.max_id_str;
		database.ref(`tweets/${promptTweet.id_str}`).update({
			// Keep track of the highest ID returned by the search, so we can pick up the next search from the same place
			max_search_id_str: results.search_metadata.max_id_str
		});
	});
}

function processTweet(tweet) {
	// Remove the leading `@gamesdonequick`
	if (tweet.text.startsWith('@GamesDoneQuick') || tweet.text.startsWith('@gamesdonequick')) {
		tweet.text = tweet.text.replace('@GamesDoneQuick', '').trim();
	}

	// Parse emoji.
	tweet.text = twemoji.parse(tweet.text);

	// Highlight the #AGDQ2017 hashtag.
	tweet.text = tweet.text.replace(/#agdq2017/ig, '<span class="hashtag">#AGDQ2017</span>');

	tweet.approval_status = {
		tier1: 'pending',
		tier2: 'pending'
	};
}

log.info('Ready!');
