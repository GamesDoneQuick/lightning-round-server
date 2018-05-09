'use strict';

// Ours
const log = require('./log');

const POLL_INTERVAL = 60000;
let updateUsersInterval;

module.exports = function (admin, database) {
	// Start listing users from the beginning, 1000 at a time.
	updateUsers();

	// Fetch new users every POLL_INTERVAL milliseconds.
	clearInterval(updateUsersInterval);
	updateUsersInterval = setInterval(() => {
		updateUsers();
	}, POLL_INTERVAL);

	async function updateUsers(nextPageToken, {silent} = {}) {
		try {
			// List batch of users, 1000 at a time.
			const listUsersResult = await admin.auth().listUsers(1000, nextPageToken);
			listUsersResult.users.forEach(userRecord => {
				if (!userRecord.providerData || userRecord.providerData.length < 1) {
					return;
				}

				database.ref(`users/${userRecord.uid}`).set({
					displayName: userRecord.displayName,
					email: userRecord.email || userRecord.providerData[0].email,
					twitterUID: userRecord.providerData[0].uid
				});
			});

			if (listUsersResult.pageToken) {
				// List next batch of users.
				await updateUsers(listUsersResult.pageToken, {silent: true});
			}

			if (!silent) {
				log.debug('Updated users.');
			}
		} catch (error) {
			log.error('Failed to update user list:', error);
		}
	}
};
