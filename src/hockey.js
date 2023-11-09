// Description
//   Get the latest game results, playoff odds, and standings for your NHL team.
//
// Configuration:
//   None
//
// Commands:
//   hubot <team or city> - Get the latest game results and playoff odds from MoneyPuck.com
//   hubot nhl [division] - Show division leaders or division standings
//
// Author:
//   stephenyeargin

const moment = require('moment-timezone');
const csvParser = require('csv-parse');
const AsciiTable = require('ascii-table');
const leagueTeams = require('./teams.json');

module.exports = (robot) => {
  const strCapitalize = (str) => str.charAt(0).toUpperCase() + str.substring(1);
  const periodFormat = (i) => {
    switch (i) {
      case 1:
        return '1st';
      case 2:
        return '2nd';
      case 3:
        return '3rd';
      default:
        return `${i}th`;
    }
  };

  const getNhlStatsData = (team, msg, cb) => msg.http(`https://api-web.nhle.com/v1/scoreboard/${team.abbreviation.toLowerCase()}/now`)
    .get()((err, res, body) => {
      let gameStatus;
      if (err) {
        robot.logger.error(err);
        return cb;
      }
      const json = JSON.parse(body);
      if (!json || (
        !json.gamesByDate
          || json.gamesByDate.length === 0)
          || (json.gamesByDate[0].length === 0)
      ) {
        msg.send('No games scheduled.');
        return cb;
      }

      const games = json.gamesByDate.find((d) => moment(d.games[0].startTimeUTC) > moment().startOf('day'));
      // Catch if final game of season played
      if (games.length === 0) {
        msg.send('No games scheduled.');
        return cb;
      }

      // TODO: Handle doubleheaders, etc.
      const game = games.games[0];

      if (game.gameState === 'OFF') {
        gameStatus = 'Final';
      } else if (game.gameState === 'LIVE') {
        gameStatus = `${game.clock.timeRemaining} ${periodFormat(game.period)}`;
      } else if ((game.gameState === 'FUT') && (game.gameScheduleState === 'OK')) {
        gameStatus = `${moment(game.startTimeUTC).tz(team.time_zone).format('h:mm a z')}`;
      } else {
        gameStatus = 'TBD';
      }
      if ((game.gameState === 'OFF') && (game.period !== 3)) {
        gameStatus += `/${game.period}`;
      }

      if (game.gameType === '1') {
        gameStatus += ' - Preseason';
      }
      if (game.gameType === '3') {
        gameStatus += ` - ${game.seriesSummary.seriesStatus || game.seriesSummary.gameLabel}`;
      }

      const table = new AsciiTable();
      if (game.gameState === 'FUT') {
        table.addRow(`${game.awayTeam.name.default} (${game.awayTeam.record})`);
        table.addRow(`${game.homeTeam.name.default} (${game.homeTeam.record})`);
      } else {
        table.addRow(`${game.awayTeam.name.default}`, `${game.awayTeam.score}`);
        table.addRow(`${game.homeTeam.name.default}`, `${game.homeTeam.score}`);
      }
      table.removeBorder();

      let howToWatch = game.venue.default;
      if ((game.gameState !== 'OFF') && game.tvBroadcasts && (game.tvBroadcasts.length > 0)) {
        const networks = [];
        game.tvBroadcasts.forEach((broadcast) => networks.push(`${broadcast.network} (${broadcast.market})`));
        howToWatch = `${howToWatch}; TV: ${networks.join(' | ')}`;
      }

      const output = [];

      // Say it
      switch (true) {
        case /slack/.test(robot.adapterName):
          msg.send({
            attachments: [
              {
                fallback: `${moment(game.startTimeUTC).format('l')} - ${game.awayTeam.name.default} ${game.awayTeam.score || game.awayTeam.record}, ${game.homeTeam.name.default} ${game.homeTeam.score || game.homeTeam.record} (${gameStatus})`,
                title_link: `https://www.nhl.com/gamecenter/${game.id}`,
                author_name: 'NHL.com',
                author_link: 'https://nhl.com',
                author_icon: 'https://github.com/nhl.png',
                color: team.primary_color,
                title: `${moment(game.startTimeUTC).format('l')} - ${gameStatus}`,
                text: `\`\`\`\n${table.toString()}\n\`\`\``,
                footer: `${howToWatch}`,
                mrkdwn_in: ['text', 'pretext'],
              },
            ],
          });
          break;
        case /discord/.test(robot.adapterName):
          output.push(`${moment(game.startTimeUTC).format('l')} - ${howToWatch}`);
          output.push(`\`\`\`${table.toString()}\`\`\``);
          output.push(`${gameStatus} - https://www.nhl.com/gamecenter/${game.id}`);
          msg.send(output.join(''));
          break;
        default:
          msg.send(`${moment(game.startTimeUTC).format('l')} - ${howToWatch}`);
          msg.send(table.toString());
          msg.send(`${gameStatus} - https://www.nhl.com/gamecenter/${game.id}`);
      }
      if (typeof cb === 'function') {
        return cb();
      }
      return cb;
    });

  const getMoneyPuckData = (team, msg, cb) => {
    robot.logger.debug(team);

    msg.http('https://moneypuck.com/moneypuck/simulations/simulations_recent.csv')
      .get()((err, res, body) => {
        // Catch errors
        if (err || (res.statusCode !== 200)) {
          msg.send('Cannot get your playoff odds right now.');
          return cb();
        }

        // Parse the CSV file into lines
        return csvParser.parse(body, {}, (err1, output) => {
          if (err1) {
            msg.send(err1);
            return cb;
          }

          // Extract only appropriate row (all odds for given team)
          let odds = [];

          output.forEach((row) => {
            if ((row[0] === 'ALL') && (row[1] === team.abbreviation)) { odds = row; }
          });
          if (!odds) {
            msg.send(`Could not find your odds for team ${team.abbreviation}`);
            return cb;
          }

          // Extract relevant columns
          const makePlayoffs = odds[output[0].indexOf('madePlayoffs')] * 100;
          const winCup = odds[output[0].indexOf('wonCup')] * 100;

          const oddsParts = [];
          const slackFields = [];
          const discordFields = [];
          if ((makePlayoffs > 0) && (makePlayoffs < 100)) {
            oddsParts.push(`Make Playoffs: ${makePlayoffs.toFixed(1)}%`);
            slackFields.push({
              title: 'Make Playoffs',
              value: `${makePlayoffs.toFixed(1)}%`,
              short: false,
            });
            discordFields.push(`**Make Playoffs:** ${makePlayoffs.toFixed(1)}%`);
          }

          if ((winCup > 0) && (winCup < 100)) {
            oddsParts.push(`Win Stanley Cup: ${winCup.toFixed(1)}%`);
            slackFields.push({
              title: 'Win Stanley Cup',
              value: `${winCup.toFixed(1)}%`,
              short: false,
            });
            discordFields.push(`**Win Stanley Cup:** ${winCup.toFixed(1)}%`);
          }

          // Bail if odds are irrelevant
          if (oddsParts.length === 0) {
            robot.logger.debug('No reason to show the odds.');
            return cb();
          }

          const fallback = `Odds to ${oddsParts.join(' / ')}`;

          // Say it
          switch (true) {
            case /slack/.test(robot.adapterName):
              msg.send({
                attachments: [
                  {
                    author_icon: 'http://peter-tanner.com/moneypuck/logos/moneypucklogo.png',
                    author_link: 'https://moneypuck.com',
                    author_name: 'MoneyPuck.com',
                    fallback,
                    thumb_url: `http://peter-tanner.com/moneypuck/logos/${team.abbreviation}.png`,
                    title: team.name,
                    color: team.primary_color,
                    fields: slackFields,
                  },
                ],
              });
              break;
            case /discord/.test(robot.adapterName):
              msg.send(`__**MoneyPuck.com**__\n${discordFields.join('\n')}`);
              break;
            default:
              msg.send(fallback);
          }
          if (typeof cb === 'function') {
            return cb();
          }
          return cb;
        });
      });
  };

  const registerDefaultListener = (team) => {
    const statsRegEx = '_team_regex_$';
    robot.respond(new RegExp(statsRegEx.replace('_team_regex_', team.regex), 'i'), (msg) => getNhlStatsData(team, msg, () => getMoneyPuckData(team, msg)));
  };

  // Loop through teams and create multiple listeners
  leagueTeams.forEach((teamItem) => {
    registerDefaultListener(teamItem);
  });

  // NHL Standings
  robot.respond(/nhl\s?(atlantic|metro|metropolitan|pacific|central)?\s?(?:standings)?/i, (msg) => {
    let tableTitle;
    const division = msg.match[1] || '';
    if (!division) {
      tableTitle = 'Division Leaders';
    } else {
      tableTitle = `${strCapitalize(division)} Standings`;
    }
    const table = new AsciiTable(tableTitle);
    table.setHeading([
      'Team',
      'GP',
      'W',
      'L',
      'OT',
      'PTS',
      'L10',
    ]);
    msg.http('https://api-web.nhle.com/v1/standings/now')
      .get()((err, res, body) => {
        // Catch errors
        if (err || (res.statusCode !== 200)) {
          msg.send('Cannot get standings right now.');
          return;
        }

        const json = JSON.parse(body);
        let standings;

        // No division selected
        if (tableTitle === 'Division Leaders') {
          const divisions = [];
          standings = json.standings.filter((t) => {
            if (!divisions.includes(t.divisionName)) {
              divisions.push(t.divisionName);
              return true;
            }
            return false;
          });
        } else {
          standings = json.standings.filter((t) => t.divisionName.toLowerCase() === division.toLowerCase());
        }
        standings.forEach((t) => {
          table.addRow([
            t.teamName.default,
            t.gamesPlayed,
            t.wins,
            t.losses,
            t.otLosses,
            t.points,
            `${t.l10Wins}-${t.l10Losses}-${t.l10OtLosses}`,
          ]);
        });

        // Format based on adapter
        if (/(slack|discord)/.test(robot.adapterName)) {
          msg.send(`\`\`\`${table.toString()}\`\`\``);
        } else {
          msg.send(table.toString());
        }
      });
  });
};
