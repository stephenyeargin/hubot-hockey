# Hubot Hockey

[![npm version](https://badge.fury.io/js/hubot-hockey.svg)](http://badge.fury.io/js/hubot-hockey) [![Build Status](https://travis-ci.org/stephenyeargin/hubot-hockey.png)](https://travis-ci.org/stephenyeargin/hubot-hockey)

This package serves two purposes:

- Get the latest odds for the selected team from the very useful [Sports Club Stats](http://sportsclubstats.com).
- Allow you to celebrate your team scoring with a custom light show (requires a [Philips hue](http://meethue.com) setup)

## Suggested Setup

There is no additional configuration if you simply wish to get the latest playoff odds.

To set up the hue integration, you can either:

1. Install the [hubot-philipshue](https://github.com/kingbin/hubot-philipshue) package using their instructions for getting a username hash.
2. Run the command below to obtain the necessary hash value.

```
curl -v -H "Content-Type: application/json" -X POST 'http://YourHueHub/api' -d '{"username": "YourHash", "devicetype": "YourAppName"}'
```

The two configuration values to add match the above scripts, so they can be shared.

```
export PHILIPS_HUE_HASH="secrets"
export PHILIPS_HUE_IP="xxx.xxx.xxx.xxx"
```

You can also set the Twitter credentials (if not already set for another plugin) to get the latest team news.

```
export HUBOT_TWITTER_CONSUMER_KEY="secret stuff"
export HUBOT_TWITTER_CONSUMER_SECRET="secret stuff"
export HUBOT_TWITTER_ACCESS_TOKEN="secret stuff"
export HUBOT_TWITTER_ACCESS_TOKEN_SECRET="secret stuff"

```

If you are using Heroku to host your bot, replace `export ...` with `heroku set:config ...`. Note that the IP address/hostname specified will need to be accessible (or routed) through the public Internet for the configuration to work with Heroku or any other host.

## Adding to Your Hubot

See full instructions [here](https://github.com/github/hubot/blob/master/docs/scripting.md#npm-packages).

1. `npm install hubot-hockey --save` (updates your `package.json` file)
2. Open the `external-scripts.json` file in the root directory (you may need to create this file) and add an entry to the array (e.g. `[ 'hubot-hockey' ]`).

## Commands

- `hubot predators` - Show your team's current playoff odds
- `hubot predators goal` - Run the light show in your team's colors
- `hubot predators colors - Set the Hue lights to your team's colors
- `hubot predators twitter` - Get the latest news from your team on Twitter
