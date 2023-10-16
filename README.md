# Hubot Hockey

[![npm version](https://badge.fury.io/js/hubot-hockey.svg)](http://badge.fury.io/js/hubot-hockey) [![Node CI](https://github.com/stephenyeargin/hubot-hockey/actions/workflows/nodejs.yml/badge.svg)](https://github.com/stephenyeargin/hubot-hockey/actions/workflows/nodejs.yml)

Get the game results and the latest NHL playoff odds for the selected team from the very useful [MoneyPuck.com](https://moneypuck.com/).

## Suggested Setup

There is no additional configuration if you simply wish to get the latest game results and playoff odds.

## Adding to Your Hubot

See full instructions [here](https://github.com/github/hubot/blob/master/docs/scripting.md#npm-packages).

1. `npm install hubot-hockey --save` (updates your `package.json` file)
2. Open the `external-scripts.json` file in the root directory (you may need to create this file) and add an entry to the array (e.g. `[ 'hubot-hockey' ]`).

## Commands

- `hubot <team>` - Show your team's current playoff odds and next game
- `hubot nhl [division]` - Show division leaders or division standings
