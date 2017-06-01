# Description:
#   Get the latest hockey playoff odds and light the lamp
#
# Dependencies:
#   "htmlparser": "^1.7.7"
#   "moment": "^2.18.1"
#   "node-hue-api": "^2.4.2"
#   "seatgeek-client": "^0.1.5"
#   "soupselect": "^0.2.0"
#   "twitter": "^1.7.0"
#   "underscore": "^1.8.3"
#   "underscore.string": "^3.3.4"
#
# Configuration:
#   PHILIPS_HUE_HASH - Optional; Token for a Hubot account on the hue bridge
#   PHILIPS_HUE_IP - Optional; IP address or hostname of your bridge
#   HUBOT_TWITTER_CONSUMER_KEY - Optional; Twitter consumer key
#   HUBOT_TWITTER_CONSUMER_SECRET - Optional; Twitter consumer secret
#   HUBOT_TWITTER_ACCESS_TOKEN - Optional; Twitter access token
#   HUBOT_TWITTER_ACCESS_TOKEN_SECRET - Optional; Twitter access token secret
#   HUBOT_SEATGEEK_CLIENT_ID - Optional; Authorization token for SeatGeek
#
# Commands:
#   hubot <team or city> - Get the lastest playoff odds and result from SportsClubStats and schedule from SeatGeek
#   hubot <team or city> goal! - Light up a connected Hue bridge with a goal color sequence (requires configuraiton)
#   hubot <team or city> colors - Set your Hues to your team's colors (requires configuraiton)
#   hubot <team or city> twitter - Get the latest news from Twitter (requires configuraiton)
#
# Author:
#   stephenyeargin

hockey_teams = require './teams.json'

# Moment
moment = require("moment")

# SportsClubStats parsing
_ = require("underscore")
_s = require("underscore.string")
Select = require("soupselect").select
HTMLParser = require("htmlparser")

# seatgeek
SeatGeek = require 'seatgeek-client'
seatgeek = new SeatGeek.SeatGeekClient(process.env.HUBOT_SEATGEEK_CLIENT_ID)

# Philips Hue integration
hue = require("node-hue-api")
HueApi = hue.HueApi
lightState = hue.lightState

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
      getSeatGeekData(team, msg)

  registerLightListener = (team) ->
    goallightregex = '_team_regex_ (lights|colors)$'
    robot.respond new RegExp(goallightregex.replace('_team_regex_', team.regex), 'i'), (msg) ->
      showTeamLights(team, msg)

  registerGoalListener = (team) ->
    goallightregex = '_team_regex_ goal[\!+]?$'
    robot.respond new RegExp(goallightregex.replace('_team_regex_', team.regex), 'i'), (msg) ->
      showGoalLights(team, msg)

  registerTweetListener = (team) ->
    twitterregex = '_team_regex_ (tweet|twitter)$'
    robot.respond new RegExp(twitterregex.replace('_team_regex_', team.regex), 'i'), (msg) ->
      showLatestTweet(team, msg)

  getSeatGeekData = (team, msg) ->
    return unless process.env.HUBOT_SEATGEEK_CLIENT_ID
    robot.logger.debug team
    team_name = (team.name).toLowerCase().replace(/\s/, '-')
    robot.logger.debug team_name
    events = seatgeek.getEvents({
      'performers': [
        field: SeatGeek.PerformerField.SLUG,
        specificity: SeatGeek.PerformerSpecificity.ANY,
        value: team_name
      ],
      'sort': {
        option: SeatGeek.SortOption.DATETIME_LOCAL,
        direction: SeatGeek.SortDirection.ASCENDING
      }
    })
    .then (apiresponse) ->
      robot.logger.debug apiresponse
      if apiresponse['events'].length > 0
        nextEvent = apiresponse['events'][0]
        dateTime = moment(nextEvent.datetime_local).format('LLL')
        if nextEvent.date_tbd
          dateTime = 'TBD'
        if nextEvent.time_tbd
          dateTime = moment(nextEvent.datetime_local).format('LL')
        robot.logger.debug nextEvent
        msg.send "Next Game: #{nextEvent.title} - #{dateTime}"
    .catch (error) ->
      robot.logger.error error
      msg.send '(An error ocurred retrieving next game)'

  getSCSData = (team, msg) ->
    robot.logger.debug team
    if moment().month() in [4, 5, 6, 7, 8]
      msg.send "The regular season has ended."
      if process.env.HUBOT_TWITTER_CONSUMER_KEY
        msg.send "Use `#{robot.name} #{team.name} twitter` to get the latest news."
      return

    msg.http(team.scs_url)
      .get() (err,res,body) ->
        # Catch errors
        if err || res.statusCode != 200
          msg.send "Cannot get your standings right now."
        else

        # Parse return
        result = parseHTML(body, "div.sub")

        # Data we want
        if _.isArray(result) && result.length > 0 && _.isArray(result[0].children)
          last_game = "Last Game: #{result[0].children[0].data}"
          standings = "Standings: #{result[1].children[0].data}"

          # Sanitize standings
          standings = _s.unescapeHTML(standings)

          # Say it
          msg.send last_game
          msg.send standings.replace('&nbsp;',' ')

        else
          msg.send "Could not retrieve standings."

  showTeamLights = (team, msg) ->
    base_url = process.env.PHILIPS_HUE_IP
    hash  = process.env.PHILIPS_HUE_HASH
    api = new HueApi(base_url, hash)
    state = lightState.create();
    msg.send "Go #{team.name}!"
    api.lights (err, lights) ->
      return msg.send err if err
      for light, i in lights.lights
        # Set each light based on team color array
        color = adjustColor(team.colors[i%team.colors.length])
        robot.logger.debug color
        state = lightState.create().on(true).bri(color.brightness).hue(color.hue).sat(color.saturation)
        api.setLightState light.id, state, (err, status) ->
          return msg.send err if err

  showGoalLights = (team, msg) ->
    # Skip if no Hue bridge configured
    return if missingEnvironmentForHueApi(msg)
    base_url = process.env.PHILIPS_HUE_IP
    hash  = process.env.PHILIPS_HUE_HASH
    api = new HueApi(base_url, hash)
    state = lightState.create();
    msg.send "Goal #{team.name}!"
    api.lights (err, lights) ->
      return err if err
      for light, i in lights.lights
        # Save current light state
        originalLightState = light.state
        robot.logger.debug originalLightState
        # Set each light based on team color array
        color = adjustColor(_.clone(team.colors[i%team.colors.length]))
        robot.logger.debug color
        state = lightState.create().on(true).bri(color.brightness).hue(color.hue).sat(color.saturation).alertLong()
        api.setLightState light.id, state, (err, status) ->
          robot.logger.debug status
          api.setLightState light.id, originalLightState, (err, status) ->
            robot.logger.debug status

  showLatestTweet = (team, msg) ->
    # Skip if no client configured
    return if missingEnvironmentForTwitterApi(msg)
    params =
      screen_name: team.twitter_handle
    # Retrieve data using credentials
    twitter_client.get 'statuses/user_timeline', params, (error, tweets, response) ->
      robot.logger.debug error
      robot.logger.debug tweets
      # Return if error
      if error || tweets.length == 0
        msg.send "Failed to retrieve tweets"
        return
      # Send first tweet
      tweet = tweets[0]
      msg.send "<#{tweet.user.screen_name}> #{tweet.text} - #{tweet.created_at}"

  adjustColor = (color) ->
    newColor = _.clone(color)
    # Adjust hue for Philips scale [0-360] scaled to [0-65535]
    newColor.hue = Math.round(newColor.hue * (65535/360))
    # Adjust saturation/brightness scale [0-100] scaled to [0-255]
    newColor.saturation = Math.round(newColor.saturation * (255/100))
    newColor.brightness = Math.round(newColor.brightness * (255/100))
    return newColor

  parseHTML = (html, selector) ->
    handler = new HTMLParser.DefaultHandler((() ->),
      ignoreWhitespace: true
    )
    parser = new HTMLParser.Parser handler
    parser.parseComplete html
    Select handler.dom, selector

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

  # Check for Hue config
  missingEnvironmentForHueApi = (msg) ->
    missingAnything = false
    unless process.env.PHILIPS_HUE_HASH?
      msg.send "Hue API Username Hash is missing: Ensure that PHILIPS_HUE_HASH is set."
      missingAnything |= true
    unless process.env.PHILIPS_HUE_IP?
      msg.send "Hue API IP Address is missing: Ensure that PHILIPS_HUE_IP is set."
      missingAnything |= true
    missingAnything

  # Loop through teams and create multiple listeners
  for team_item in hockey_teams
    registerDefaultListener team_item
    registerLightListener team_item
    registerGoalListener team_item
    registerTweetListener team_item
