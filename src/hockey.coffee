# Description
#   Get the latest hockey playoff odds for your team.
#
# Configuration:
#   None
#
# Commands:
#   hubot <team or city> - Get the lastest playoff odds from MoneyPuck.com
#
# Author:
#   stephenyeargin

hockey_teams = require './teams.json'

moment = require 'moment-timezone'
csvParser = require 'csv-parse'
AsciiTable = require 'ascii-table'

module.exports = (robot) ->
  registerDefaultListener = (team) ->
    statsregex = '_team_regex_$'
    robot.respond new RegExp(statsregex.replace('_team_regex_', team.regex), 'i'), (msg) ->
      getNhlStatsData team, msg, ->
        getMoneyPuckData team, msg

  getNhlStatsData = (team, msg, cb) ->
    msg.http('https://statsapi.web.nhl.com/api/v1/schedule')
      .query({
        teamId: team.nhl_stats_api_id,
        startDate: moment().tz('America/Los_Angeles').format('YYYY-MM-DD'),
        endDate: moment().tz('America/Los_Angeles').add(90, 'd').format('YYYY-MM-DD'),
        hydrate: 'linescore,broadcasts(all),game(seriesSummary)'
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

        if game.status.abstractGameState == 'Final'
          gameStatus = 'Final'
        else if game.status.abstractGameState == 'Live'
          gameStatus = "#{game.linescore.currentPeriodTimeRemaining} #{game.linescore.currentPeriodOrdinal}"
        else if game.status.detailedState == 'Scheduled' && game.status.startTimeTBD == false
          gameStatus = "#{moment(game.gameDate).tz(team.time_zone).format('h:mm a z')}"
        else
          gameStatus = game.status.detailedState
        if game.status.abstractGameState == 'Final' && game.linescore.currentPeriodOrdinal != '3rd'
          gameStatus += "/#{game.linescore.currentPeriodOrdinal}"

        if game.gameType == 'PR'
          gameStatus = gameStatus + ' - Preseason'
        if game.gameType == 'P'
          gameStatus = gameStatus + " - #{game.seriesSummary.seriesStatus || game.seriesSummary.gameLabel}"

        table = new AsciiTable()
        if game.teams.away.leagueRecord.ot? or game.teams.home.leagueRecord.ot?
          table.addRow "#{game.teams.away.team.name} (#{game.teams.away.leagueRecord.wins}-#{game.teams.away.leagueRecord.losses}-#{game.teams.away.leagueRecord.ot})", "#{game.teams.away.score}"
          table.addRow "#{game.teams.home.team.name} (#{game.teams.home.leagueRecord.wins}-#{game.teams.home.leagueRecord.losses}-#{game.teams.home.leagueRecord.ot})", "#{game.teams.home.score}"
        else
          table.addRow "#{game.teams.away.team.name} (#{game.teams.away.leagueRecord.wins}-#{game.teams.away.leagueRecord.losses})", "#{game.teams.away.score}"
          table.addRow "#{game.teams.home.team.name} (#{game.teams.home.leagueRecord.wins}-#{game.teams.home.leagueRecord.losses})", "#{game.teams.home.score}"
        table.removeBorder()

        howToWatch = game.venue.name
        if game.status.abstractGameState != 'Final' and game.broadcasts and game.broadcasts.length > 0
          networks = []
          for broadcast in game.broadcasts
            networks.push "#{broadcast.name} (#{broadcast.type})"
          howToWatch = howToWatch + "; TV: " + networks.join(' | ')

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
                  color: team.primary_color,
                  title: "#{moment(date).format('l')} - #{gameStatus}",
                  text: "```\n" + table.toString() + "\n```"
                  footer: "#{howToWatch}",
                  mrkdwn_in: ["text", "pretext"]
                }
              ]
            }
          when 'discord'
            output = []
            output.push "#{moment(date).format('l')} - #{howToWatch}"
            output.push "```" + table.toString() + "```"
            output.push "#{gameStatus} - https://www.nhl.com/gamecenter/#{game.gamePk}"
            msg.send output.join('')
          else
            msg.send "#{moment(date).format('l')} - #{howToWatch}"
            msg.send table.toString()
            msg.send "#{gameStatus} - https://www.nhl.com/gamecenter/#{game.gamePk}"
        if typeof cb == 'function'
          cb()

  getMoneyPuckData = (team, msg, cb) ->
    robot.logger.debug team

    msg.http('https://moneypuck.com/moneypuck/simulations/simulations_recent.csv')
      .get() (err, res, body) ->
        # Catch errors
        if err || res.statusCode != 200
          msg.send "Cannot get your playoff odds right now."
          return

        # Parse the CSV file into lines
        csvParser.parse body, {}, (err, output) ->
          if err
            msg.send err
            return

          # Extract only appropriate row (all odds for given team)
          odds = []

          for row in output
            odds = row if row[0] is 'ALL' and row[1] is team.abbreviation

          if !odds
            msg.send "Could not find your odds for team #{team.abbreviation}"
            return

          # Extract relevant columns
          make_playoffs = odds[output[0].indexOf('madePlayoffs')] * 100
          win_cup = odds[output[0].indexOf('wonCup')] * 100

          oddsParts = []
          slackFields = []
          discordFields = []
          if make_playoffs > 0 and make_playoffs < 100
            oddsParts.push("Make Playoffs: #{make_playoffs.toFixed(1)}%")
            slackFields.push({
              title: "Make Playoffs",
              value: "#{make_playoffs.toFixed(1)}%",
              short: false
            })
            discordFields.push "**Make Playoffs:** #{make_playoffs.toFixed(1)}%"

          if win_cup > 0 and win_cup < 100
            oddsParts.push("Win Stanley Cup: #{win_cup.toFixed(1)}%")
            slackFields.push({
              title: "Win Stanley Cup",
              value: "#{win_cup.toFixed(1)}%",
              short: false
            })
            discordFields.push "**Win Stanley Cup:** #{win_cup.toFixed(1)}%"

          # Bail if odds are irrelevant
          if oddsParts.length == 0
            robot.logger.debug 'No reason to show the odds.'
            return

          fallback = "Odds to " + oddsParts.join(" / ")

          # Say it
          switch robot.adapterName
            when 'slack'
              msg.send {
                attachments: [
                  {
                    author_icon: "http://peter-tanner.com/moneypuck/logos/moneypucklogo.png",
                    author_link: "https://moneypuck.com",
                    author_name: "MoneyPuck.com",
                    fallback: fallback,
                    thumb_url: "http://peter-tanner.com/moneypuck/logos/#{team.abbreviation}.png",
                    title: team.name,
                    color: team.primary_color,
                    fields: slackFields
                  }
                ]
              }
            when 'discord'
              msg.send "__**MoneyPuck.com**__\n" + discordFields.join("\n")
            else
              msg.send fallback
          if typeof cb == 'function'
            cb()

  strCapitalize = (str) ->
    return str.charAt(0).toUpperCase() + str.substring(1)

  # Loop through teams and create multiple listeners
  for team_item in hockey_teams
    registerDefaultListener team_item
