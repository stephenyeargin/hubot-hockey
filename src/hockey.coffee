# Description
#   Get the latest hockey playoff odds for your team.
#
# Configuration:
#   HUBOT_TWITTER_CONSUMER_KEY - Optional; Twitter consumer key
#   HUBOT_TWITTER_CONSUMER_SECRET - Optional; Twitter consumer secret
#   HUBOT_TWITTER_ACCESS_TOKEN - Optional; Twitter access token
#   HUBOT_TWITTER_ACCESS_TOKEN_SECRET - Optional; Twitter access token secret
#
# Commands:
#   hubot <team or city> - Get the lastest playoff odds from MoneyPuck.com
#   hubot <team or city> twitter - Get the latest news from Twitter (requires configuration)
#
# Author:
#   stephenyeargin

hockey_teams = require './teams.json'

moment = require 'moment-timezone'
parse = require 'csv-parse'
AsciiTable = require 'ascii-table'

# Twitter
Twitter = require 'twitter'
twitter_client = new Twitter
  consumer_key: process.env.HUBOT_TWITTER_CONSUMER_KEY
  consumer_secret: process.env.HUBOT_TWITTER_CONSUMER_SECRET
  access_token_key: process.env.HUBOT_TWITTER_ACCESS_TOKEN
  access_token_secret: process.env.HUBOT_TWITTER_ACCESS_TOKEN_SECRET

module.exports = (robot) ->
  registerDefaultListener = (team) ->
    statsregex = '_team_regex_$'
    robot.respond new RegExp(statsregex.replace('_team_regex_', team.regex), 'i'), (msg) ->
      getNhlStatsData team, msg, ->
        getMoneyPuckData team, msg

  registerTweetListener = (team) ->
    twitterregex = '_team_regex_ (tweet|twitter)$'
    robot.respond new RegExp(twitterregex.replace('_team_regex_', team.regex), 'i'), (msg) ->
      showLatestTweet(team, msg)

  getNhlStatsData = (team, msg, cb) ->
    msg.http('https://statsapi.web.nhl.com/api/v1/schedule')
      .query({
        teamId: team.nhl_stats_api_id,
        startDate: moment().tz('America/Los_Angeles').format('YYYY-MM-DD'),
        endDate: moment().tz('America/Los_Angeles').add(7, 'd').format('YYYY-MM-DD'),
        hydrate: 'linescore,broadcasts(all)'
      })
      .get() (err, res, body) ->
        if err
          robot.logger.error err
          return
        json = JSON.parse(body)
        if !json || json.dates.length == 0 || json.dates[0].games.length == 0
          msg.send "No games scheduled."
          return
        date = json.dates[0].date
        game = json.dates[0].games[0]
        # Handle in-progress games
        if game.status.abstractGameState == 'Final'
          gameStatus = 'Final'
        else if game.status.abstractGameState == 'Live'
          gameStatus = "#{game.linescore.currentPeriodTimeRemaining} #{game.linescore.currentPeriodOrdinal}"
        else if game.status.detailedState == 'Scheduled' && game.status.startTimeTBD == false
          gameStatus = "#{moment(game.gameDate).tz(game.teams.home.team.venue.timeZone.id).format('h:mm a')} #{game.teams.home.team.venue.timeZone.tz}"
        else
          gameStatus = game.status.detailedState
        if game.linescore.currentPeriodOrdinal == 'OT' || game.linescorecurrentPeriodOrdinal == 'SO'
          gameStatus += "/#{game.linescore.currentPeriodOrdinal}"

        table = new AsciiTable()
        table.addRow "#{game.teams.away.team.name} (#{game.teams.away.leagueRecord.wins}-#{game.teams.away.leagueRecord.losses}-#{game.teams.away.leagueRecord.ot})", "#{game.teams.away.score}"
        table.addRow "#{game.teams.home.team.name} (#{game.teams.home.leagueRecord.wins}-#{game.teams.home.leagueRecord.losses}-#{game.teams.home.leagueRecord.ot})", "#{game.teams.home.score}"
        table.removeBorder()

        # Say it
        switch robot.adapterName
          when 'slack'
            msg.send {
              attachments: [
                {
                  fallback: "#{moment(date).format('l')} - #{game.teams.away.team.name} #{game.teams.away.score}, #{game.teams.home.team.name} #{game.teams.home.score} (#{gameStatus})",
                  title_link: "https://www.nhl.com/gamecenter/#{game.gamePk}",
                  author_name: "NHL.com",
                  author_link: "https://nhl.com",
                  author_icon: "https://github.com/nhl.png",
                  title: "#{moment(date).format('l')} - #{gameStatus}",
                  text: "```\n" + table.toString() + "\n```"
                  footer: game.venue.name,
                  mrkdwn_in: ["text", "pretext"]
                }
              ]
            }
          else
            msg.send "#{moment(date).format('l')} - #{game.venue.name}"
            msg.send table.toString()
            msg.send "#{gameStatus} - https://www.nhl.com/gamecenter/#{game.gamePk}"
        if typeof cb == 'function'
          cb()

  getMoneyPuckData = (team, msg, cb) ->
    robot.logger.debug team

    msg.http('http://moneypuck.com/moneypuck/simulations/simulations_recent.csv')
      .get() (err, res, body) ->
        # Catch errors
        if err || res.statusCode != 200
          msg.send "Cannot get your playoff odds right now."
          return

        # Parse the CSV file into lines
        parse body, {}, (err, output) ->
          if err
            msg.send err
            return

          # Extract only appropriate row (all odds for given team)
          odds = []

          for row in output
            odds = row if row[0] is 'ALL' and row[1] is team.moneypuck_key

          if !odds
            msg.send "Could not find your odds for team #{team.moneypuck_key}"
            return

          # Extract relevant columns
          make_playoffs = odds[output[0].indexOf('madePlayoffs')] * 100
          win_cup = odds[output[0].indexOf('wonCup')] * 100

          fallback = "Odds to Make Playoffs: #{make_playoffs.toFixed(1)}% / Win Stanley Cup: #{win_cup.toFixed(1)}%"

          # Say it
          switch robot.adapterName
            when 'slack'
              msg.send {
                attachments: [
                  {
                    author_icon: "http://peter-tanner.com/moneypuck/logos/moneypucklogo.png",
                    author_link: "http://moneypuck.com.com",
                    author_name: "MoneyPuck.com",
                    fallback: fallback,
                    thumb_url: "http://peter-tanner.com/moneypuck/logos/#{team.moneypuck_key}.png",
                    title: team.name,
                    fields: [
                      {
                        title: "Make Playoffs",
                        value: "#{make_playoffs.toFixed(1)}%",
                        short: false
                      },
                      {
                        title: "Win Stanley Cup",
                        value: "#{win_cup.toFixed(1)}%",
                        short: false
                      }
                    ]
                  }
                ]
              }
            else
              msg.send fallback
          if typeof cb == 'function'
            cb()

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
      switch robot.adapterName
        when 'slack'
          msg.send {
            "text": "<https://twitter.com/#{tweet.user.screen_name}/status/#{tweet.id_str}>",
            "unfurl_links": true
          }
        else
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
