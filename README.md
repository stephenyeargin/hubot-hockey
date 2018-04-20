# Hubot Hockey

[![npm version](https://badge.fury.io/js/hubot-hockey.svg)](http://badge.fury.io/js/hubot-hockey) [![Build Status](https://travis-ci.org/stephenyeargin/hubot-hockey.png)](https://travis-ci.org/stephenyeargin/hubot-hockey)

Get the latest odds for the selected team from the very useful [Sports Club Stats](http://sportsclubstats.com).

## Suggested Setup

There is no additional configuration if you simply wish to get the latest playoff odds.

### Twitter

You can also set the Twitter credentials (if not already set for another plugin) to get the latest team news.

| Environment Variable                 | Required? | Description               |
| ------------------------------------ | :-------: | --------------------------|
| `HUBOT_TWITTER_CONSUMER_KEY`         | Yes       | Consumer key from application |
| `HUBOT_TWITTER_CONSUMER_SECRET`      | Yes       | Consumer key secret from application |
| `HUBOT_TWITTER_ACCESS_TOKEN`         | Yes       | Access token from OAuth workflow |
| `HUBOT_TWITTER_ACCESS_TOKEN_SECRET`  | Yes       | Access token secret from OAuth workflow |

## Adding to Your Hubot

See full instructions [here](https://github.com/github/hubot/blob/master/docs/scripting.md#npm-packages).

1. `npm install hubot-hockey --save` (updates your `package.json` file)
2. Open the `external-scripts.json` file in the root directory (you may need to create this file) and add an entry to the array (e.g. `[ 'hubot-hockey' ]`).

## Commands

- `hubot <team>` - Show your team's current playoff odds and next game
- `hubot <team> twitter` - Get the latest news from your team on Twitter
