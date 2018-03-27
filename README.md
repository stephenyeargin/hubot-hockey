# Hubot Hockey

[![npm version](https://badge.fury.io/js/hubot-hockey.svg)](http://badge.fury.io/js/hubot-hockey) [![Build Status](https://travis-ci.org/stephenyeargin/hubot-hockey.png)](https://travis-ci.org/stephenyeargin/hubot-hockey)

Get the latest odds for the selected team from the very useful [Sports Club Stats](http://sportsclubstats.com).

## Suggested Setup

There is no additional configuration if you simply wish to get the latest playoff odds.

### Twitter

You can also set the Twitter credentials (if not already set for another plugin) to get the latest team news.

```
export HUBOT_TWITTER_CONSUMER_KEY="xxxxxxxxxxxx"
export HUBOT_TWITTER_CONSUMER_SECRET="xxxxxxxxxxxx"
export HUBOT_TWITTER_ACCESS_TOKEN="xxxxxxxxxxxx"
export HUBOT_TWITTER_ACCESS_TOKEN_SECRET="xxxxxxxxxxxx"

```

If you are using Heroku to host your bot, replace `export ...` with `heroku set:config ...`. Note that the IP address/hostname specified will need to be accessible (or routed) through the public Internet for the configuration to work with Heroku or any other host.

## Adding to Your Hubot

See full instructions [here](https://github.com/github/hubot/blob/master/docs/scripting.md#npm-packages).

1. `npm install hubot-hockey --save` (updates your `package.json` file)
2. Open the `external-scripts.json` file in the root directory (you may need to create this file) and add an entry to the array (e.g. `[ 'hubot-hockey' ]`).

## Commands

- `hubot <team>` - Show your team's current playoff odds and next game
- `hubot <team> twitter` - Get the latest news from your team on Twitter
