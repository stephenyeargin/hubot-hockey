// Description
//   Get the latest game results, playoff odds, and standings for your NHL team.
//
// Configuration:
//   HUBOT_HOCKEY_EXT_STANDINGS - Show extended standings columns
//   HUBOT_HOCKEY_HIDE_ODDS - Hide playoff odds
//
// Commands:
//   hubot <team or city> - Get the latest game results
//   hubot nhl [<division>|<conference>] - Show division leaders or division / conference standings
//
// Author:
//   stephenyeargin

const moment = require('moment-timezone');
const csvParser = require('csv-parse');
const AsciiTable = require('ascii-table');
const leagueTeams = require('./teams.json');

module.exports = (robot) => {
  const periodFormat = (periodDescriptor) => {
    if (periodDescriptor.type === 'SO') {
      return 'SO';
    }
    switch (periodDescriptor.number) {
      case 1:
        return '1st';
      case 2:
        return '2nd';
      case 3:
        return '3rd';
      default:
        if (periodDescriptor.periodType === 'OT' && periodDescriptor.otPeriods > 0) {
          return `${periodDescriptor.otPeriods}${periodDescriptor.periodType}`;
        }
        return `${periodDescriptor.periodType}`;
    }
  };

  const postGameResults = (team, msg, cb) => msg.http(`https://api-web.nhle.com/v1/scoreboard/${team.abbreviation.toLowerCase()}/now`)
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

      // Find the game closest to right now
      const games = json.gamesByDate.find((d) => moment(d.date) >= moment(json.focusedDate));

      // Catch if final game of season played
      if (!games || games.length === 0) {
        msg.send('No games scheduled.');
        return cb;
      }

      // TODO: Handle doubleheaders, etc.
      const game = games.games[0];

      if (game.gameState === 'OFF' || game.gameState === 'FINAL' || game.gameState === 'OVER') {
        gameStatus = 'Final';
        if (game.period > 3) {
          gameStatus = `${gameStatus}/${periodFormat(game.periodDescriptor)}`;
        }
      } else if (game.gameState === 'LIVE' || game.gameState === 'CRIT') {
        gameStatus = `${game.clock.timeRemaining} ${periodFormat(game.periodDescriptor)}`;
        if (game.clock?.inIntermission) {
          gameStatus += ' Intermission';
        }
      } else if ((game.gameState === 'FUT' || game.gameState === 'PRE') && (game.gameScheduleState === 'OK')) {
        gameStatus = `${moment(game.startTimeUTC).tz(team.time_zone).format('h:mm a z')}`;
      } else {
        gameStatus = 'TBD';
      }

      if (game.gameType === 1) {
        gameStatus += ' - Preseason';
      }
      if (game.gameType === 3) {
        const getSeriesStatusString = (seriesStatus) => {
          const {
            topSeedTeamAbbrev,
            topSeedWins,
            bottomSeedTeamAbbrev,
            bottomSeedWins,
          } = seriesStatus;
          if (topSeedWins === bottomSeedWins) {
            return `Tied ${topSeedWins}-${bottomSeedWins}`;
          }
          const leadingTeamAbbrev = topSeedWins > bottomSeedWins
            ? topSeedTeamAbbrev
            : bottomSeedTeamAbbrev;
          const leadingTeamWins = topSeedWins > bottomSeedWins ? topSeedWins : bottomSeedWins;
          const trailingTeamWins = topSeedWins < bottomSeedWins ? topSeedWins : bottomSeedWins;
          if (leadingTeamWins === 4) {
            return `${leadingTeamAbbrev} wins ${leadingTeamWins}-${trailingTeamWins}`;
          }
          return `${leadingTeamAbbrev} leads ${leadingTeamWins}-${trailingTeamWins}`;
        };

        gameStatus += ` - ${game.seriesStatus.seriesAbbrev} Game ${game.seriesStatus.game} (${getSeriesStatusString(game.seriesStatus)})`;
      }

      const table = new AsciiTable();
      if (game.gameState === 'FUT' || game.gameState === 'PRE') {
        if (game.gameType !== 3) {
          table.addRow(`${game.awayTeam.name.default} (${game.awayTeam.record})`);
          table.addRow(`${game.homeTeam.name.default} (${game.homeTeam.record})`);
        } else {
          table.addRow(`${game.awayTeam.name.default}`);
          table.addRow(`${game.homeTeam.name.default}`);
        }
      } else {
        table.addRow(`${game.awayTeam.name.default}`, `${game.awayTeam.score}`);
        table.addRow(`${game.homeTeam.name.default}`, `${game.homeTeam.score}`);
      }
      table.removeBorder();

      let howToWatch = game.venue.default;
      if ((game.gameState !== 'OFF' && game.gameState !== 'FINAL') && game.tvBroadcasts && (game.tvBroadcasts.length > 0)) {
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
                fallback: `${moment(game.startTimeUTC).tz(team.time_zone).format('l')} - ${table.getRows()[0].join(' ')}, ${table.getRows()[1].join(' ')} (${gameStatus})`,
                title_link: `https://www.nhl.com/gamecenter/${game.id}`,
                author_name: 'NHL.com',
                author_link: 'https://nhl.com',
                author_icon: 'https://github.com/nhl.png',
                color: team.primary_color,
                title: `${moment(game.startTimeUTC).tz(team.time_zone).format('l')} - ${gameStatus}`,
                text: `\`\`\`\n${table.toString()}\n\`\`\``,
                footer: `${howToWatch}`,
                mrkdwn_in: ['text', 'pretext'],
              },
            ],
          });
          break;
        case /discord/.test(robot.adapterName):
          output.push(`${moment(game.startTimeUTC).tz(team.time_zone).format('l')} - ${howToWatch}`);
          output.push(`\`\`\`\n${table.toString()}\n\`\`\``);
          output.push(`${gameStatus} - https://www.nhl.com/gamecenter/${game.id}`);
          msg.send(output.join('\n'));
          break;
        default:
          msg.send(`${moment(game.startTimeUTC).tz(team.time_zone).format('l')} - ${howToWatch}`);
          msg.send(table.toString());
          msg.send(`${gameStatus} - https://www.nhl.com/gamecenter/${game.id}`);
      }
      if (typeof cb === 'function') {
        return cb();
      }
      return cb;
    });

  const postSportsClubStatsOdds = (team, msg) => {
    // Skip odds if environment variable set
    if (process.env.HUBOT_HOCKEY_HIDE_ODDS) {
      return;
    }

    msg.http('http://www.sportsclubstats.com/d/NHL_ChanceWillMakePlayoffs_Small_A.json')
      .get()((err, res, body) => {
        // Catch errors
        if (err || (res.statusCode !== 200)) {
          robot.logger.error(err);
          return;
        }

        // Skip if odds are stale
        const date = moment(new Date(res.headers['last-modified'].trim()), 'YYYY-MM-DD');
        if (date.diff(moment(), 'day') < -1) {
          robot.logger.info(`Odds are stale: ${res.headers['last-modified']}`);
          return;
        }

        const json = JSON.parse(body);
        const history = json.data.find((d) => d.label === team.name);
        if (!history) {
          msg.send(`Could not find your odds for team ${team.name}`);
          return;
        }
        const makePlayoffs = history.data[history.data.length - 1];
        if ((makePlayoffs === 0) && (makePlayoffs === 100)) {
          robot.logger.info('No reason to show the odds.');
          return;
        }

        const fallback = `Sports Club Stats: ${makePlayoffs.toFixed(1)}% to Make Playoffs`;

        // Say it
        switch (true) {
          case /slack/.test(robot.adapterName):
            msg.send({
              attachments: [
                {
                  author_icon: 'https://github.com/stephenyeargin/hubot-hockey/assets/80459/251b9816-8e05-4e34-b87b-10d0295823ab',
                  author_link: 'https://sportsclubstats.com',
                  author_name: 'Sports Club Stats',
                  fallback,
                  thumb_url: 'https://github.com/stephenyeargin/hubot-hockey/assets/80459/251b9816-8e05-4e34-b87b-10d0295823ab',
                  color: team.primary_color,
                  fields: [
                    {
                      title: 'Make Playoffs',
                      value: `${makePlayoffs.toFixed(1)}%`,
                      sort: true,
                    },
                  ],
                },
              ],
            });
            break;
          case /discord/.test(robot.adapterName):
            msg.send(`__**SportsClubStats.com**__\n**Make Playoffs:** ${makePlayoffs.toFixed(1)}%`);
            break;
          default:
            msg.send(fallback);
        }
      });
  };

  const postMoneyPuckOdds = (team, msg) => {
    robot.logger.debug(team);

    // Skip odds if environment variable set
    if (process.env.HUBOT_HOCKEY_HIDE_ODDS) {
      return;
    }

    msg.http('https://moneypuck.com/moneypuck/simulations/update_date.txt')
      .get()((err1, res1, body1) => {
        // Catch errors
        if (err1 || (res1.statusCode !== 200)) {
          robot.logger.error(err1);
          return;
        }

        // Skip if odds are stale
        const date = moment(body1.trim(), 'YYYY-MM-DD');
        if (date.diff(moment(), 'day') < -1) {
          return;
        }

        msg.http('https://moneypuck.com/moneypuck/simulations/simulations_recent.csv')
          .get()((err2, res2, body2) => {
            // Catch errors
            if (err2 || (res2.statusCode !== 200)) {
              robot.logger.error(err2);
              return;
            }

            // Parse the CSV file into lines
            csvParser.parse(body2, {}, (csvErr, output) => {
              if (csvErr) {
                msg.send(csvErr);
                return;
              }

              // Extract only appropriate row (all odds for given team)
              let odds = [];

              output.forEach((row) => {
                if ((row[0] === 'ALL') && (row[1] === team.abbreviation)) {
                  odds = row;
                }
              });
              if (!odds) {
                msg.send(`Could not find your odds for team ${team.abbreviation}`);
                return;
              }

              // Extract relevant columns
              const makePlayoffs = odds[output[0].indexOf('madePlayoffs')] * 100;
              const winCup = odds[output[0].indexOf('wonCup')] * 100;

              const oddsParts = [];
              const slackFields = [];
              const discordFields = [];
              if ((makePlayoffs > 0) && (makePlayoffs < 100)) {
                oddsParts.push(`${makePlayoffs.toFixed(1)}% to Make Playoffs`);
                slackFields.push({
                  title: 'Make Playoffs',
                  value: `${makePlayoffs.toFixed(1)}%`,
                  short: false,
                });
                discordFields.push(`**Make Playoffs:** ${makePlayoffs.toFixed(1)}%`);
              }

              if ((winCup > 0) && (winCup < 100)) {
                oddsParts.push(`${winCup.toFixed(1)}% to Win Stanley Cup`);
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
                return;
              }

              const fallback = `MoneyPuck: ${oddsParts.join(' / ')}`;

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
            });
          });
      });
  };

  const isEliminated = (team, standings) => {
    const lastWildcard = standings
      .find((t) => t.conferenceAbbrev === team.conferenceAbbrev && t.wildcardSequence === 2) || {};
    const maxPoints = ((82 - team.gamesPlayed) * 2) + team.points;
    if (lastWildcard.points > maxPoints) {
      return true;
    }
    if (lastWildcard.points === maxPoints) {
      if (team.regulationWins < lastWildcard.regulationWins) {
        return true;
      }
      if (team.regulationPlusOtWins < lastWildcard.regulationPlusOtWins) {
        return true;
      }
    }
    return false;
  };

  const registerDefaultListener = (team) => {
    const statsRegEx = '_team_regex_$';
    robot.respond(new RegExp(statsRegEx.replace('_team_regex_', team.regex), 'i'), (msg) => postGameResults(team, msg, () => Promise.all([
      postSportsClubStatsOdds(team, msg),
      postMoneyPuckOdds(team, msg),
    ])));
  };

  // Loop through teams and create multiple listeners
  leagueTeams.forEach((teamItem) => {
    registerDefaultListener(teamItem);
  });

  // NHL Standings
  robot.respond(/nhl\s?(.*)?\s?(?:standings)?/i, (msg) => {
    let tableTitle;
    let filter = msg.match[1] || '';
    switch (filter.toLowerCase().trim()) {
      case 'a':
      case 'atlantic':
        filter = 'Atlantic';
        break;
      case 'm':
      case 'metro':
      case 'metropolitan':
        filter = 'Metropolitan';
        break;
      case 'p':
      case 'pacific':
        filter = 'Pacific';
        break;
      case 'c':
      case 'central':
        filter = 'Central';
        break;
      case 'w':
      case 'west':
      case 'western':
        filter = 'Western';
        break;
      case 'e':
      case 'east':
      case 'eastern':
        filter = 'Eastern';
        break;
      default:
        filter = '';
    }

    // Set Table Title
    if (!filter) {
      tableTitle = 'Division Leaders';
    } else if (filter === 'Western' || filter === 'Eastern') {
      tableTitle = `${filter} Conference Standings`;
    } else {
      tableTitle = `${filter} Division Standings`;
    }
    const table = new AsciiTable(tableTitle);
    const headingRow = [
      'Team',
      'GP',
      'W',
      'L',
      'OT',
      'PTS',
    ];
    if (process.env.HUBOT_HOCKEY_EXT_STANDINGS) {
      headingRow.push('P%');
      headingRow.push('L10');
      headingRow.push('STRK');
    }
    table.setHeading(headingRow);
    msg.http(`https://api-web.nhle.com/v1/standings/${moment().tz('America/Los_Angeles').format('YYYY-MM-DD')}`)
      .get()((err, res, body) => {
        // Catch errors
        if (err || (res.statusCode !== 200)) {
          robot.logger.error(err);
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
          // eslint-disable-next-line max-len
          standings = json.standings.filter((t) => t.divisionName === filter || t.conferenceName === filter);
        }

        if (standings.length === 0) {
          msg.send('Standings available when season starts.');
          return;
        }

        standings.forEach((t) => {
          let clinchIndicator = t.clinchIndicator ? ` (${t.clinchIndicator})` : '';
          clinchIndicator = isEliminated(t, json.standings) ? ' (e)' : clinchIndicator;
          const row = [
            `${t.teamName.default}${clinchIndicator}`,
            t.gamesPlayed,
            t.wins,
            t.losses,
            t.otLosses,
            t.points,
          ];
          if (process.env.HUBOT_HOCKEY_EXT_STANDINGS) {
            row.push(t.pointPctg.toFixed(3));
            row.push(`${t.l10Wins}-${t.l10Losses}-${t.l10OtLosses}`);
            row.push(`${t.streakCode}${t.streakCount}`);
          }
          table.addRow(row);
        });

        // Format based on adapter
        if (/(slack|discord)/.test(robot.adapterName)) {
          msg.send(`\`\`\`\n${table.toString()}\n\`\`\``);
        } else {
          msg.send(table.toString());
        }
      });
  });
};
