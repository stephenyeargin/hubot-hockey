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
  const getNhlStatsData = (team, msg, cb) => msg.http('https://statsapi.web.nhl.com/api/v1/schedule')
    .query({
      teamId: team.nhl_stats_api_id,
      startDate: moment().tz('America/Los_Angeles').format('YYYY-MM-DD'),
      endDate: moment().tz('America/Los_Angeles').add(90, 'd').format('YYYY-MM-DD'),
      hydrate: 'linescore,broadcasts(all),game(seriesSummary)',
    })
    .get()((err, res, body) => {
      let gameStatus;
      if (err) {
        robot.logger.error(err);
        return cb;
      }
      const json = JSON.parse(body);
      if (!json || (json.dates.length === 0) || (json.dates[0].games.length === 0)) {
        msg.send('No games scheduled.');
        return cb;
      }
      const {
        date,
      } = json.dates[0];
      const game = json.dates[0].games[0];

      if (game.status.abstractGameState === 'Final') {
        gameStatus = 'Final';
      } else if (game.status.abstractGameState === 'Live') {
        gameStatus = `${game.linescore.currentPeriodTimeRemaining} ${game.linescore.currentPeriodOrdinal}`;
      } else if ((game.status.detailedState === 'Scheduled') && (game.status.startTimeTBD === false)) {
        gameStatus = `${moment(game.gameDate).tz(team.time_zone).format('h:mm a z')}`;
      } else {
        gameStatus = game.status.detailedState;
      }
      if ((game.status.abstractGameState === 'Final') && (game.linescore.currentPeriodOrdinal !== '3rd')) {
        gameStatus += `/${game.linescore.currentPeriodOrdinal}`;
      }

      if (game.gameType === 'PR') {
        gameStatus += ' - Preseason';
      }
      if (game.gameType === 'P') {
        gameStatus += ` - ${game.seriesSummary.seriesStatus || game.seriesSummary.gameLabel}`;
      }

      const table = new AsciiTable();
      if ((game.teams.away.leagueRecord.ot != null) || (game.teams.home.leagueRecord.ot != null)) {
        table.addRow(`${game.teams.away.team.name} (${game.teams.away.leagueRecord.wins}-${game.teams.away.leagueRecord.losses}-${game.teams.away.leagueRecord.ot})`, `${game.teams.away.score}`);
        table.addRow(`${game.teams.home.team.name} (${game.teams.home.leagueRecord.wins}-${game.teams.home.leagueRecord.losses}-${game.teams.home.leagueRecord.ot})`, `${game.teams.home.score}`);
      } else {
        table.addRow(`${game.teams.away.team.name} (${game.teams.away.leagueRecord.wins}-${game.teams.away.leagueRecord.losses})`, `${game.teams.away.score}`);
        table.addRow(`${game.teams.home.team.name} (${game.teams.home.leagueRecord.wins}-${game.teams.home.leagueRecord.losses})`, `${game.teams.home.score}`);
      }
      table.removeBorder();

      let howToWatch = game.venue.name;
      if ((game.status.abstractGameState !== 'Final') && game.broadcasts && (game.broadcasts.length > 0)) {
        const networks = [];
        game.broadcasts.forEach((broadcast) => networks.push(`${broadcast.name} (${broadcast.type})`));
        howToWatch = `${howToWatch}; TV: ${networks.join(' | ')}`;
      }

      const output = [];

      // Say it
      switch (true) {
        case /slack/.test(robot.adapterName):
          msg.send({
            attachments: [
              {
                fallback: `${moment(date).format('l')} - ${game.teams.away.team.name} ${game.teams.away.score}, ${game.teams.home.team.name} ${game.teams.home.score} (${gameStatus})`,
                title_link: `https://www.nhl.com/gamecenter/${game.gamePk}`,
                author_name: 'NHL.com',
                author_link: 'https://nhl.com',
                author_icon: 'https://github.com/nhl.png',
                color: team.primary_color,
                title: `${moment(date).format('l')} - ${gameStatus}`,
                text: `\`\`\`\n${table.toString()}\n\`\`\``,
                footer: `${howToWatch}`,
                mrkdwn_in: ['text', 'pretext'],
              },
            ],
          });
          break;
        case /discord/.test(robot.adapterName):
          output.push(`${moment(date).format('l')} - ${howToWatch}`);
          output.push(`\`\`\`${table.toString()}\`\`\``);
          output.push(`${gameStatus} - https://www.nhl.com/gamecenter/${game.gamePk}`);
          msg.send(output.join(''));
          break;
        default:
          msg.send(`${moment(date).format('l')} - ${howToWatch}`);
          msg.send(table.toString());
          msg.send(`${gameStatus} - https://www.nhl.com/gamecenter/${game.gamePk}`);
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

  const strCapitalize = (str) => str.charAt(0).toUpperCase() + str.substring(1);

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
    msg.http('https://statsapi.web.nhl.com/api/v1/standings')
      .query({
        date: moment().tz('America/Los_Angeles').format('YYYY-MM-DD'),
        expand: 'standings.record',
      })
      .get()((err, res, body) => {
        // Catch errors
        let lastTen;
        if (err || (res.statusCode !== 200)) {
          msg.send('Cannot get standings right now.');
          return;
        }

        const json = JSON.parse(body);

        // No division selected
        if (tableTitle === 'Division Leaders') {
          json.records.forEach((d) => {
            lastTen = d.teamRecords[0].records.overallRecords.find((r) => r.type === 'lastTen');
            table.addRow([
              d.teamRecords[0].team.name,
              d.teamRecords[0].gamesPlayed,
              d.teamRecords[0].leagueRecord.wins,
              d.teamRecords[0].leagueRecord.losses,
              d.teamRecords[0].leagueRecord.ot,
              d.teamRecords[0].points,
              `${lastTen.wins}-${lastTen.losses}-${lastTen.ot}`,
            ]);
          });
        // Division selected
        } else {
          const teams = json.records.find((d) => (
            d.division.name.toUpperCase() === division.toUpperCase())
            || (d.division.nameShort.toUpperCase() === division.toUpperCase()));
          teams.teamRecords.forEach((t) => {
            lastTen = t.records.overallRecords.find((r) => r.type === 'lastTen');
            table.addRow([
              t.team.name,
              t.gamesPlayed,
              t.leagueRecord.wins,
              t.leagueRecord.losses,
              t.leagueRecord.ot,
              t.points,
              `${lastTen.wins}-${lastTen.losses}-${lastTen.ot}`,
            ]);
          });
        }

        // Format based on adapter
        if (/(slack|discord)/.test(robot.adapterName)) {
          msg.send(`\`\`\`${table.toString()}\`\`\``);
        } else {
          msg.send(table.toString());
        }
      });
  });
};
