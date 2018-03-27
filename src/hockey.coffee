# Description:
#   Get the latest hockey playoff odds and light the lamp
#
# Configuration:
#   HUBOT_TWITTER_CONSUMER_KEY - Optional; Twitter consumer key
#   HUBOT_TWITTER_CONSUMER_SECRET - Optional; Twitter consumer secret
#   HUBOT_TWITTER_ACCESS_TOKEN - Optional; Twitter access token
#   HUBOT_TWITTER_ACCESS_TOKEN_SECRET - Optional; Twitter access token secret
#
# Commands:
#   hubot <team or city> - Get the lastest playoff odds and result from SportsClubStats and schedule from SeatGeek
#   hubot <team or city> twitter - Get the latest news from Twitter (requires configuraiton)
#
# Author:
#   stephenyeargin

hockey_teams = require './teams.json'

moment = require 'moment'
_ = require 'lodash'
cheerio = require 'cheerio'

# Twitter
Twitter = require "twitter"
twitter_client = new Twitter
  consumer_key: process.env.HUBOT_TWITTER_CONSUMER_KEY
  consumer_secret: process.env.HUBOT_TWITTER_CONSUMER_SECRET
  access_token_key: process.env.HUBOT_TWITTER_ACCESS_TOKEN
  access_token_secret: process.env.HUBOT_TWITTER_ACCESS_TOKEN_SECRET

module.exports = (robot) ->
  registerDefaultListener = (team) ->
    statsregex = '_team_regex_$'
    robot.respond new RegExp(statsregex.replace('_team_regex_', team.regex), 'i'), (msg) ->
      getSCSData(team, msg)

  registerTweetListener = (team) ->
    twitterregex = '_team_regex_ (tweet|twitter)$'
    robot.respond new RegExp(twitterregex.replace('_team_regex_', team.regex), 'i'), (msg) ->
      showLatestTweet(team, msg)

  getSCSData = (team, msg) ->
    robot.logger.debug team
    if moment().month() in [4, 5, 6, 7, 8]
      msg.send "The regular season has ended."
      if process.env.HUBOT_TWITTER_CONSUMER_KEY
        msg.send "Use `#{robot.name} #{team.name} twitter` to get the latest news."
      return

    msg.http(team.scs_url)
      .get() (err, res, body) ->
        # Catch errors
        if err || res.statusCode != 200
          msg.send "Cannot get your standings right now."
        else

        # Parse body into a structure
        $ = cheerio.load body,
          withDomLvl1: true,
          normalizeWhitespace: false,
          xmlMode: false,
          decodeEntities: true

        result = $('div.sub')

        # Data we want
        if result.length
          last_game = "Last Game: #{$(result.get(0)).text()}"
          standings = "Standings: #{$(result.get(1)).text()}"

          # Sanitize standings
          standings = _.unescape(standings)

          # Say it
          msg.send last_game
          msg.send standings.replace('&nbsp;',' ')

        else
          msg.send "Could not retrieve standings."


  showLatestTweet = (team, msg) ->
    # Skip if no client configured
    return if missingEnvironmentForTwitterApi(msg)
    params =
      screen_name: team.twitter_handle
    # Retrieve data using credentials
    twitter_client.get 'statuses/user_timeline', params, (error, tweets, response) ->
      # Return if error
      if error || tweets.length == 0
        robot.logger.error error
        msg.send "Failed to retrieve tweets"
        return
      # Send first tweet
      robot.logger.debug tweets
      tweet = tweets[0]
      msg.send "<#{tweet.user.screen_name}> #{tweet.text} - #{tweet.created_at}"

  strCapitalize = (str) ->
    return str.charAt(0).toUpperCase() + str.substring(1)

  # Check for Twitter config
  missingEnvironmentForTwitterApi = (msg) ->
    missingAnything = false
    unless process.env.HUBOT_TWITTER_CONSUMER_KEY?
      msg.send "Twitter API Client ID is missing: Ensure that HUBOT_TWITTER_CONSUMER_KEY is set."
      missingAnything |= true
    unless process.env.HUBOT_TWITTER_CONSUMER_SECRET?
      msg.send "Twitter API Client Secret is missing: Ensure that HUBOT_TWITTER_CONSUMER_SECRET is set."
      missingAnything |= true
    unless process.env.HUBOT_TWITTER_ACCESS_TOKEN?
      msg.send "Twitter API Access Token is missing: Ensure that HUBOT_TWITTER_ACCESS_TOKEN is set."
      missingAnything |= true
    unless process.env.HUBOT_TWITTER_ACCESS_TOKEN_SECRET?
      msg.send "Twitter API Access Token Secret is missing: Ensure that HUBOT_TWITTER_ACCESS_TOKEN_SECRET is set."
      missingAnything |= true
    missingAnything

  # Loop through teams and create multiple listeners
  for team_item in hockey_teams
    registerDefaultListener team_item
    registerTweetListener team_item
