# Description:
#   Get the latest hockey playoff odds and light the lamp
#
# Dependencies:
#   "coffee-script": "~1.6"
#   "htmlparser": "^1.7.7"
#   "node-hue-api": "^1.0.5"
#   "soupselect": "^0.2.0"
#   "underscore": "^1.8.3"
#   "underscore.string": "^3.0.3"
#   "moment": "^2.10.3"
#   "twitter": "^1.2.5"
#   "seatgeek": "^0.3.8"
#
# Configuration:
#   PHILIPS_HUE_HASH - Optional; Secret hash value representing a Hubot account on the hue bridge
#   PHILIPS_HUE_IP - Optional; IP address or hostname of your bridge
#   HUBOT_TWITTER_CONSUMER_KEY - Optional; Twitter consumer key
#   HUBOT_TWITTER_CONSUMER_SECRET - Optional; Twitter consumer secret
#   HUBOT_TWITTER_ACCESS_TOKEN - Optional; Twitter access token
#   HUBOT_TWITTER_ACCESS_TOKEN_SECRET - Optional; Twitter access token secret
#
# Commands:
#   hubot <team or city> - Get the lastest playoff odds and result from SportsClubStats and schedule from SeatGeek
#   hubot <team or city> goal! - Light up a connected Hue bridge with a goal color sequence (requires configuraiton)
#   hubot <team or city> colors - Set your Hues to your team's colors (requires configuraiton)
#   hubot <team or city> twitter - Get the latest news from Twitter (requires configuraiton)
#
# Author:
#   stephenyeargin

hockey_teams = [
  {
    name: 'Anaheim Ducks',
    regex: '(anaheim ducks|anaheim|ducks|ana)',
    scs_url: 'http://www.sportsclubstats.com/NHL/Western/Pacific/Anaheim.html',
    twitter_handle: 'AnaheimDucks',
    colors: [
      {hue: 13, saturation: 78, brightness: 94},
      {hue: 0, saturation: 2, brightness: 24},
      {hue: 150, saturation: 2, brightness: 70}
    ]
  },
  {
    name: 'Boston Bruins',
    regex: '(boston bruins|boston|bruins|bos)',
    scs_url: 'http://www.sportsclubstats.com/NHL/Eastern/Atlantic/Boston.html',
    twitter_handle: 'NHLBruins',
    colors: [
      {hue: 0, saturation: 2, brightness: 24},
      {hue: 35, saturation: 76, brightness: 98},
      {hue: 60, saturation: 1, brightness: 92}
    ]
  },
  {
    name: 'Buffalo Sabres',
    regex: '(buffalo sabres|bufalo|sabres|buf)',
    scs_url: 'http://www.sportsclubstats.com/NHL/Eastern/Atlantic/Buffalo.html',
    twitter_handle: 'BuffaloSabres',
    colors: [
      {hue: 213, saturation: 42, brightness: 42},
      {hue: 35, saturation: 76, brightness: 98},
      {hue: 150, saturation: 2, brightness: 70}
    ]
  },
  {
    name: 'Calgary Flames',
    regex: '(calgary flames|calgary|flames|cal)',
    scs_url: 'http://www.sportsclubstats.com/NHL/Western/Pacific/Calgary.html',
    twitter_handle: 'NHLFlames',
    colors: [
      {hue: 0, saturation: 2, brightness: 24},
      {hue: 37, saturation: 63, brightness: 99}
    ]
  },
  {
    name: 'Carolina Hurricanes',
    regex: '(carolina hurricanes|carolina|hurricanes|car|canes)',
    scs_url: 'http://www.sportsclubstats.com/NHL/Eastern/Metropolitan/Carolina.html',
    twitter_handle: 'NHLCanes',
    colors: [
      {hue: 0, saturation: 2, brightness: 24},
      {hue: 1, saturation: 69, brightness: 76}
    ]
  },
  {
    name: 'Chicago Blackhawks',
    regex: '(chicago blackhawks|chicago|blackhawks|chi|hawks)',
    scs_url: 'http://www.sportsclubstats.com/NHL/Western/Central/Chicago.html',
    twitter_handle: 'NHLBlackhawks',
    colors: [
      {hue: 255, saturation: 59, brightness: 52},
      {hue: 35, saturation: 75, brightness: 80}
    ]
  },
  {
    name: 'Colorado Avalanche',
    regex: '(colorado avalanche|colorado|avalanche|col|avs|denver)',
    scs_url: 'http://www.sportsclubstats.com/NHL/Western/Central/Colorado.html',
    twitter_handle: 'Avalanche',
    colors: [
      {hue: 348, saturation: 53, brightness: 48},
      {hue: 0, saturation: 1, brightness: 23}
    ]
  },
  {
    name: 'Columbus Blue Jackets',
    regex: '(columbus blue jackets|columbus|blue jackets|cbj|bluejackets)',
    scs_url: 'http://www.sportsclubstats.com/NHL/Eastern/Metropolitan/Columbus.html',
    twitter_handle: 'BlueJacketsNHL',
    colors: [
      {hue: 213, saturation: 42, brightness: 42},
      {hue: 1, saturation: 69, brightness: 76}
    ]
  },
  {
    name: 'Dallas Stars',
    regex: '(dallas stars|dallas|stars|dal)',
    scs_url: 'http://www.sportsclubstats.com/NHL/Western/Central/Dallas.html',
    twitter_handle: 'DallasStars',
    colors: [
      {hue: 0, saturation: 2, brightness: 24},
      {hue: 154, saturation: 54, brightness: 43}
    ]
  },
  {
    name: 'Detroit Red Wings',
    regex: '(detroit red wings|detroit|red wings|det|redwings|wings)',
    scs_url: 'http://www.sportsclubstats.com/NHL/Eastern/Atlantic/Detroit.html',
    twitter_handle: 'DetroitRedWings',
    colors: [
      {hue: 1, saturation: 69, brightness: 76},
      {hue: 60, saturation: 1, brightness: 92}
    ]
  },
  {
    name: 'Edmonton Oilers',
    regex: '(edmonton oilers|edmonton|oilers|edm|oil)',
    scs_url: 'http://www.sportsclubstats.com/NHL/Western/Pacific/Edmonton.html',
    twitter_handle: 'EdmontonOilers',
    colors: [
      {hue: 210, saturation: 61, brightness: 47},
      {hue: 15, saturation: 74, brightness: 81}
    ]
  },
  {
    name: 'Florida Panthers',
    regex: '(florida panthers|florida|panthers|fla|cats)',
    scs_url: 'http://www.sportsclubstats.com/NHL/Eastern/Atlantic/Florida.html',
    twitter_handle: 'FlaPanthers',
    colors: [
      {hue: 39, saturation: 82, brightness: 77},
      {hue: 35, saturation: 76, brightness: 98}
    ]
  },
  {
    name: 'Los Angeles Kings',
    regex: '(los angeles kings|los angeles|kings|lak|losangeles)',
    scs_url: 'http://www.sportsclubstats.com/NHL/Western/Pacific/LosAngeles.html',
    twitter_handle: 'LAKings',
    colors: [
      {hue: 0, saturation: 2, brightness: 24},
      {hue: 228, saturation: 45, brightness: 44}
    ]
  },
  {
    name: 'Minnesota Wild',
    regex: '(minnesota wild|minnesota|wild|min)',
    scs_url: 'http://www.sportsclubstats.com/NHL/Western/Central/Minnesota.html',
    twitter_handle: 'mnwild',
    colors: [
      {hue: 36, saturation: 20, brightness: 88},
      {hue: 153, saturation: 49, brightness: 36}
    ]
  },
  {
    name: 'Montreal Canadiens',
    regex: '(montreal canadiens|montreal|canadiens|mtl|habs)',
    scs_url: 'http://www.sportsclubstats.com/NHL/Eastern/Atlantic/Montreal.html',
    twitter_handle: 'CanadiensMTL',
    colors: [
      {hue: 355, saturation: 62, brightness: 64},
      {hue: 218, saturation: 58, brightness: 47}
    ]
  },
  {
    name: 'Nashville Predators',
    regex: '(nashville predators|nashville|predators|nas|preds)',
    scs_url: 'http://www.sportsclubstats.com/NHL/Western/Central/Nashville.html',
    twitter_handle: 'predsnhl',
    colors: [
      {hue: 35, saturation: 76, brightness: 98},
      {hue: 60, saturation: 1, brightness: 92},
      {hue: 213, saturation: 42, brightness: 42}
    ]
  },
  {
    name: 'New Jersey Devils',
    regex: '(new jersey devils|new jersey|devils|njd)',
    scs_url: 'http://www.sportsclubstats.com/NHL/Eastern/Metropolitan/NewJersey.html',
    twitter_handle: 'NHLDevils',
    colors: [
      {hue: 1, saturation: 69, brightness: 76},
      {hue: 0, saturation: 2, brightness: 24}
    ]
  },
  {
    name: 'New York Islanders',
    regex: '(new york islanders|islanders|nyi|isles)',
    scs_url: 'http://www.sportsclubstats.com/NHL/Eastern/Metropolitan/NYIslanders.html',
    twitter_handle: 'NYIslanders',
    colors: [
      {hue: 210, saturation: 70, brightness: 49},
      {hue: 13, saturation: 79, brightness: 94}
    ]
  },
  {
    name: 'New York Rangers',
    regex: '(new york rangers|rangers|nyr|blue shirts|blueshirts)',
    scs_url: 'http://www.sportsclubstats.com/NHL/Eastern/Metropolitan/NYRangers.html',
    twitter_handle: 'NYRangers',
    colors: [
      {hue: 1, saturation: 69, brightness: 76},
      {hue: 213, saturation: 42, brightness: 42}
    ]
  },
  {
    name: 'Ottawa Senators',
    regex: '(ottawa senators|ottawa|senators|ott|sens)',
    scs_url: 'http://www.sportsclubstats.com/NHL/Eastern/Atlantic/Ottawa.html',
    twitter_handle: 'Senators',
    colors: [
      {hue: 1, saturation: 69, brightness: 76},
      {hue: 39, saturation: 82, brightness: 77}
    ]
  },
  {
    name: 'Philidelphia Flyers',
    regex: '(philidelphia flyers|philidelphia|flyers|phi)',
    scs_url: 'http://www.sportsclubstats.com/NHL/Eastern/Metropolitan/Philadelphia.html',
    twitter_handle: 'NHLFlyers',
    colors: [
      {hue: 0, saturation: 2, brightness: 24},
      {hue: 13, saturation: 78, brightness: 94}
    ]
  },
  {
    name: 'Arizona Coyotes',
    regex: '(arizona coyotes|arizona|coyotes|ari|phoenix coyotes|phoenix|phx|yotes)',
    scs_url: 'http://www.sportsclubstats.com/NHL/Western/Pacific/Arizona.html',
    twitter_handle: 'ArizonaCoyotes',
    colors: [
      {hue: 0, saturation: 2, brightness: 24},
      {hue: 359, saturation: 50, brightness: 53}
    ]
  },
  {
    name: 'Pittsburgh Penguins',
    regex: '(pittsburgh penguins|pittsburgh|penguins|pit|pitt)',
    scs_url: 'http://www.sportsclubstats.com/NHL/Eastern/Metropolitan/Pittsburgh.html',
    twitter_handle: 'penguins',
    colors: [
      {hue: 35, saturation: 42, brightness: 72},
      {hue: 0, saturation: 2, brightness: 24}
    ]
  },
  {
    name: 'San Jose Sharks',
    regex: '(san jose sharks|san jose|sharks|sjs|sanjose)',
    scs_url: 'http://www.sportsclubstats.com/NHL/Western/Pacific/SanJose.html',
    twitter_handle: 'SanJoseSharks',
    colors: [
      {hue: 184, saturation: 100, brightness: 46},
      {hue: 0, saturation: 2, brightness: 24}
    ]
  },
  {
    name: 'Tampa Bay Lightning',
    regex: '(tampa bay lightning|tampa bay|lightning|tbl|tampabay)',
    scs_url: 'http://www.sportsclubstats.com/NHL/Eastern/Atlantic/TampaBay.html',
    twitter_handle: 'TBLightning',
    colors: [
      {hue: 60, saturation: 1, brightness: 92},
      {hue: 210, saturation: 61, brightness: 47}
    ]
  },
  {
    name: 'St. Louis Blues',
    regex: '(st\. louis blues|st\. louis|blues|stl|stlouis|saint louis|st louis|blue notes)',
    scs_url: 'http://www.sportsclubstats.com/NHL/Western/Central/StLouis.html',
    twitter_handle: 'StLouisBlues',
    colors: [
      {hue: 35, saturation: 76, brightness: 98},
      {hue: 213, saturation: 42, brightness: 42}
    ]
  },
  {
    name: 'Toronto Maple Leafs',
    regex: '(toronto maple leafs|toronto|maple leafs|tor|leafs|mapleleafs)',
    scs_url: 'http://www.sportsclubstats.com/NHL/Eastern/Atlantic/Toronto.html',
    twitter_handle: 'MapleLeafs',
    colors: [
      {hue: 60, saturation: 1, brightness: 92},
      {hue: 210, saturation: 61, brightness: 47}
    ]
  },
  {
    name: 'Vancouver Canucks',
    regex: '(vancouver canucks|vancouver|canucks|van|nucks)',
    scs_url: 'http://www.sportsclubstats.com/NHL/Western/Pacific/Vancouver.html',
    twitter_handle: 'VanCanucks',
    colors: [
      {hue: 223, saturation: 18, brightness: 31},
      {hue: 60, saturation: 1, brightness: 64}
    ]
  },
  {
    name: 'Washington Capitals',
    regex: '(washington capitals|washington|capitals|wsh|caps)',
    scs_url: 'http://www.sportsclubstats.com/NHL/Eastern/Metropolitan/Washington.html',
    twitter_handle: 'washcaps',
    colors: [
      {hue: 1, saturation: 69, brightness: 76},
      {hue: 213, saturation: 42, brightness: 42}
    ]
  },
  {
    name: 'Winnipeg Jets',
    regex: '(winnipeg jets|winnipeg|jets|wpg|peg)',
    scs_url: 'http://www.sportsclubstats.com/NHL/Western/Central/Winnipeg.html',
    twitter_handle: 'NHLJets',
    colors: [
      {hue: 199, saturation: 100, brightness: 57},
      {hue: 213, saturation: 42, brightness: 42}
    ]
  },
]

# Moment
moment = require("moment")

# SportsClubStats parsing
_ = require("underscore")
_s = require("underscore.string")
Select = require("soupselect").select
HTMLParser = require("htmlparser")

# seatgeek
seatgeek = require('seatgeek')

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
    robot.logger.debug team
    team_name = (team.name).toLowerCase().replace(/\s/, '-')
    robot.logger.debug team_name
    seatgeek.events { 'performers.slug': team_name }, (err, apiresponse) ->
      if err
        robot.logger.error err
        msg.send '(An error ocurred retrieving next game)'
      if apiresponse['events'].length > 0
        nextEvent = apiresponse['events'][0]
        datetime = moment(nextEvent.datetime_local).format('LLL')
        robot.logger.debug nextEvent
        msg.send "Next Game: #{nextEvent.title} - #{datetime}"

  getSCSData = (team, msg) ->
    robot.logger.debug team
    if moment().month() in [5, 6, 7, 8]
      msg.send "It is the off-season until October. :-("
      if process.env.HUBOT_TWITTER_CONSUMER_KEY
        msg.send "Use `#{robot.name} #{team.name} twitter` to get the latest news."

    msg.http(team.scs_url)
      .get() (err,res,body) ->
        # Catch errors
        if res.statusCode != 200
          msg.send "Got a HTTP/" + res.statusCode
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
