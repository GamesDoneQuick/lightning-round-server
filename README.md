# lightning-round-server [![CircleCI](https://circleci.com/gh/GamesDoneQuick/lightning-round-server.svg?style=svg)](https://circleci.com/gh/GamesDoneQuick/lightning-round-server)
[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy)  
The server-side component of [lightning-round](https://github.com/GamesDoneQuick/lightning-round); handles dealing with the Twitter API to harvest replies automatically.  

## Hm?
[lightning-round](https://github.com/GamesDoneQuick/lightning-round) is a "serverless" [Firebase](https://www.firebase.com/) app for harvesting and moderating questions from Twitter to use in our interviews. Firebase is neat and often has everything that you'd need to build a slick webapp with no server code or infrastructure. However, since we need to interact with the Twitter API to harvest replies, we must have our own arbitrary server code running somewhere, feeding those replies into Firebase. That's what this app does.

## Screenshot
![Preview Screenshot](https://i.imgur.com/c2sOgmT.png)

## What exactly does it do?
It monitors the value of `active_tweet_id` in Firebase, which is set by the client-side app (`lightning-round`). When this ID changes, this server app fetches that tweet from the Twitter API, then begins polling for replies to that tweet every 10 seconds. It adds the tweet and its replies back into Firebase, available at `/tweets` and `/tweets/${tweet_id_str}/replies`.

## What else should I know?
There's actually no Twitter API method for fetching all replies to a given tweet. I was surprised too. People have been asking for this since 2008 but it has yet to be implemented. Instead, we're forced to adopt one of several workarounds.

The workaround I went with was to poll the [`search/tweets`](https://dev.twitter.com/rest/reference/get/search/tweets) API endpoint for tweets to the user that made the "active tweet" (in our case, that should always be [@GamesDoneQuick](https://twitter.com/gamesdonequick)) with a `since_id` of `active_tweet_id`. This returns all tweets to the target user since the target tweet was made. From there, we iterate over all those replies and only keep the ones with a `in_reply_to_status_id_str` that matches our target tweet's `id_str`.

Whenever `active_tweet_id` is changed by a client, this server app changes its `search/tweets` polling target.

It is very important that you only ever have **one instance of lightning-round-server running at a time** for any given
Firebase app. It was _not_ written to handle trying to fight against another instance operating on the same database, and
it _will_ explode.

## Installation
The easiest route is to click the "Deploy to Heroku" button at the top of this README.

Or, you can install `lightning-round-server` manually:
```
git clone git@github.com:GamesDoneQuick/lightning-round-server.git
cd lightning-round-server
npm install
```

## Configuration
I'll be honest, configuration for this isn't as ergonomic as it could be but whatever.

If you deployed this app to Heroku using the button above, you will enter your Firebase and Twitter
credentials into Heroku as environment variables instead of putting them into config files.

1. Make an app on Firebase, if you don't already have one: https://console.firebase.google.com/. 
	- The free tier is fine.
2. Look in the "Authentication" settings and enable Twitter sign-in. All other sign-in providers should be disabled.
	- You could _maybe_ use some other sign-in provider, but this was specifically made with only Twitter sign-in in mind.
2. Go to your app's settings (there should be a gear in the top left, click "Project Settings"), select the "Service Accounts" tab and click "Generate New Private Key" to download a JSON file containing your Firebase Admin SDK credentials. Save this file as `lightning-round-server/credentials.json`.
	- These credentials let this server app ignore all the database permissions and make any changes to the database we want. This way, we have data that no client can alter, but that the server is still free to manage.
3. Create a Twitter API app, if you haven't already made one: https://apps.twitter.com/
	- You can set the app's permissions to "read only".
	- From the "Settings" tab, you'll want to provide a "Privacy Policy URL" and a "Terms of Service URL". Having these lets you then go to the "Permissions" tab and check "Request email addresses from users".
4. From the "Keys and Access Tokens" tab, save these four things:
	1. Consumer Key
	2. Consumer Secret
	3. Access Token
	4. Access Token Secret
5. Create `lightning-round-server/config.json` in the following format

    ```json
    {
      "twitter": {
        "consumerKey": "YOUR_CONSUMER_KEY",
        "consumerSecret": "YOUR_CONSUMER_SECRET",
        "accessTokenKey": "YOUR_ACCESS_TOKEN_KEY",
        "accessTokenSecret": "YOUR_ACCESS_TOKEN_SECRET"
      }
    }
    ```
	(Alternatively, you could provide these as environment variables or command-line arguments. See [`lib/config.js`](https://github.com/GamesDoneQuick/lightning-round-server/blob/master/lib/config.js) for those parameter names.)
7. Run the program with `node index.js`.
