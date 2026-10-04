import hubot from 'hubot';
import { afterEach, beforeEach, describe, it } from './node-test-compat.mjs';
import { expect } from 'chai';
import nock from 'nock';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createTestRobot } from './test-robot.mjs';

const { User, TextMessage } = hubot;

// ESM-friendly __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Alter time as test runs
const originalDateNow = Date.now;
const originalSetTimeout = globalThis.setTimeout;

const slackTable = (rows) => ({
  type: 'table',
  rows: rows.map((row) => row.map((cell) => ({ type: 'raw_text', text: cell }))),
});

const gameBlocks = (fallback, heading, rows, howToWatch, gameId) => ({
  text: fallback,
  unfurl_links: false,
  unfurl_media: false,
  blocks: [
    { type: 'header', text: { type: 'plain_text', text: heading, emoji: true } },
    slackTable(rows),
    {
      type: 'context',
      elements: [{ type: 'mrkdwn', text: `${howToWatch} · <https://www.nhl.com/gamecenter/${gameId}|Gamecenter>` }],
    },
  ],
});

const oddsBlocks = (fallback, teamName, rows) => ({
  text: fallback,
  unfurl_links: false,
  unfurl_media: false,
  blocks: [
    {
      type: 'context',
      elements: [
        { type: 'image', image_url: 'https://peter-tanner.com/moneypuck/logos/moneypucklogo.png', alt_text: 'MoneyPuck.com' },
        { type: 'mrkdwn', text: `<https://moneypuck.com|*MoneyPuck.com*> · ${teamName}` },
      ],
    },
    slackTable(rows),
  ],
});

const standingsBlocks = (title, rows) => ({
  text: title,
  blocks: [
    { type: 'header', text: { type: 'plain_text', text: title, emoji: true } },
    slackTable(rows),
  ],
});

describe('hubot-hockey for slack', () => {
  let robot = null;
  let adapter = null;
  let messages = [];

  beforeEach(async () => {
    process.env.HUBOT_LOG_LEVEL = 'error';
    nock.disableNetConnect();
    globalThis.setTimeout = (handler, delay, ...args) => originalSetTimeout(handler, Math.max(delay ?? 0, 250), ...args);

    // Create robot with mock adapter
    robot = createTestRobot('hubot');
    adapter = robot.adapter;
    messages = [];

    // Load the slack adapter and hockey script
    await robot.loadFile(path.resolve(__dirname, 'adapters'), 'slack.js');
    await robot.loadFile(path.resolve(__dirname, '..', 'src'), 'hockey.js');
    robot.brain.emit('loaded');

    // Set up message capturing
    adapter.on('send', (envelope, ...strings) => {
      strings.forEach((str) => {
        if (Array.isArray(str)) {
          str.forEach((s) => messages.push(['hubot', s]));
        } else {
          messages.push(['hubot', str]);
        }
      });
    });

    adapter.on('reply', (envelope, ...strings) => {
      strings.forEach((str) => {
        if (Array.isArray(str)) {
          str.forEach((s) => messages.push(['hubot', `@${envelope.user.name} ${s}`]));
        } else {
          messages.push(['hubot', `@${envelope.user.name} ${str}`]);
        }
      });
    });

    // Standings API needed for playoff odds calculation
    nock('https://api-web.nhle.com')
      .get(/\/v1\/standings\/\d{4}-\d{2}-\d{2}/)
      .replyWithFile(200, `${__dirname}/fixtures/api-web-nhle-standings.json`);
  });

  afterEach(() => {
    delete process.env.HUBOT_LOG_LEVEL;
    Date.now = originalDateNow;
    globalThis.setTimeout = originalSetTimeout;
    nock.cleanAll();
    if (robot.server) {
      robot.server.close();
    }
  });

  // Helper function to simulate user saying something
  const userSays = (userName, message) => new Promise((resolve) => {
    const user = new User(userName, { room: 'room1' });
    const textMessage = new TextMessage(user, message);
    messages.push([userName, message]);
    robot.receive(textMessage, resolve);
  });

  it('responds with an in-progress game and playoff odds', (done) => {
    Date.now = () => Date.parse('Tue Nov 7 22:42:00 CST 2023');
    nock('https://api-web.nhle.com')
      .get('/v1/scoreboard/nsh/now')
      .replyWithFile(200, `${__dirname}/fixtures/api-web-nhle-schedule-in-progress.json`);

    nock('https://moneypuck.com')
      .get('/moneypuck/simulations/update_date.txt')
      .reply(200, '2023-11-07 06:52:52.999000-04:00');

    nock('https://moneypuck.com')
      .get('/moneypuck/simulations/simulations_recent.csv')
      .replyWithFile(200, `${__dirname}/fixtures/moneypuck-simulations_recent.csv`);

    // Using userSays helper
    userSays('alice', '@hubot preds');
    setTimeout(
      () => {
        try {
          expect(messages).to.eql([
            ['alice', '@hubot preds'],
            [
              'hubot',
              gameBlocks(
                '11/7/2023 - Nashville Predators (5-6-0) 2, Calgary Flames (3-7-1) 3 (09:04 3rd)',
                '11/7/2023 - 09:04 3rd',
                [
                  ['Team', 'Score'],
                  ['Nashville Predators (5-6-0)', '2'],
                  ['Calgary Flames (3-7-1)', '3'],
                ],
                'Scotiabank Saddledome; TV: BSSO (A) | SNW (H)',
                '2023020186',
              ),
            ],
            [
              'hubot',
              oddsBlocks(
                'MoneyPuck: 67.5% to Make Playoffs / 4.2% to Win Stanley Cup',
                'Nashville Predators',
                [
                  ['Outcome', 'Odds'],
                  ['Make Playoffs', '67.5%'],
                  ['Win Stanley Cup', '4.2%'],
                ],
              ),
            ],
          ]);
          done();
        } catch (err) {
          done(err);
        }
      },
      100,
    );
  });

  it('responds with an in-intermission game and playoff odds', (done) => {
    Date.now = () => Date.parse('Sat Dec 16 18:41:00 CST 2023');
    nock('https://api-web.nhle.com')
      .get('/v1/scoreboard/nsh/now')
      .replyWithFile(200, `${__dirname}/fixtures/api-web-nhle-schedule-intermission.json`);

    nock('https://moneypuck.com')
      .get('/moneypuck/simulations/update_date.txt')
      .reply(200, '2023-12-16 06:52:52.999000-04:00');

    nock('https://moneypuck.com')
      .get('/moneypuck/simulations/simulations_recent.csv')
      .replyWithFile(200, `${__dirname}/fixtures/moneypuck-simulations_recent.csv`);

    // Using userSays helper
    userSays('alice', '@hubot preds');
    setTimeout(
      () => {
        try {
          expect(messages).to.eql([
            ['alice', '@hubot preds'],
            [
              'hubot',
              gameBlocks(
                '12/16/2023 - Washington Capitals (5-4-1) 0, Nashville Predators (5-6-0) 1 (07:21 1st Intermission)',
                '12/16/2023 - 07:21 1st Intermission',
                [
                  ['Team', 'Score'],
                  ['Washington Capitals (5-4-1)', '0'],
                  ['Nashville Predators (5-6-0)', '1'],
                ],
                'Bridgestone Arena; TV: NHLN (N) | BSSO (H) | MNMT (A)',
                '2023020468',
              ),
            ],
            [
              'hubot',
              oddsBlocks(
                'MoneyPuck: 67.5% to Make Playoffs / 4.2% to Win Stanley Cup',
                'Nashville Predators',
                [
                  ['Outcome', 'Odds'],
                  ['Make Playoffs', '67.5%'],
                  ['Win Stanley Cup', '4.2%'],
                ],
              ),
            ],
          ]);
          done();
        } catch (err) {
          done(err);
        }
      },
      100,
    );
  });

  it('responds with a future game and playoff odds', (done) => {
    Date.now = () => Date.parse('Tue Nov 8 08:00:00 CST 2023');
    nock('https://api-web.nhle.com')
      .get('/v1/scoreboard/nsh/now')
      .replyWithFile(200, `${__dirname}/fixtures/api-web-nhle-schedule-future.json`);

    nock('https://moneypuck.com')
      .get('/moneypuck/simulations/update_date.txt')
      .reply(200, '2023-11-07 06:52:52.999000-04:00');

    nock('https://moneypuck.com')
      .get('/moneypuck/simulations/simulations_recent.csv')
      .replyWithFile(200, `${__dirname}/fixtures/moneypuck-simulations_recent.csv`);

    // Using userSays helper
    userSays('alice', '@hubot preds');
    setTimeout(
      () => {
        try {
          expect(messages).to.eql([
            ['alice', '@hubot preds'],
            [
              'hubot',
              gameBlocks(
                '11/9/2023 - Nashville Predators (5-7-0), Winnipeg Jets (6-4-2) (7:00 pm CST)',
                '11/9/2023 - 7:00 pm CST',
                [
                  ['Team'],
                  ['Nashville Predators (5-7-0)'],
                  ['Winnipeg Jets (6-4-2)'],
                ],
                'Canada Life Centre; TV: BSSO (A) | TSN3 (H)',
                '2023020200',
              ),
            ],
            [
              'hubot',
              oddsBlocks(
                'MoneyPuck: 67.5% to Make Playoffs / 4.2% to Win Stanley Cup',
                'Nashville Predators',
                [
                  ['Outcome', 'Odds'],
                  ['Make Playoffs', '67.5%'],
                  ['Win Stanley Cup', '4.2%'],
                ],
              ),
            ],
          ]);
          done();
        } catch (err) {
          done(err);
        }
      },
      100,
    );
  });

  it('responds with a completed game and playoff odds', (done) => {
    Date.now = () => Date.parse('Tue Nov 7 23:00:00 CST 2023');
    nock('https://api-web.nhle.com')
      .get('/v1/scoreboard/nsh/now')
      .replyWithFile(200, `${__dirname}/fixtures/api-web-nhle-schedule-completed.json`);

    nock('https://moneypuck.com')
      .get('/moneypuck/simulations/update_date.txt')
      .reply(200, '2023-11-07 06:52:52.999000-04:00');

    nock('https://moneypuck.com')
      .get('/moneypuck/simulations/simulations_recent.csv')
      .replyWithFile(200, `${__dirname}/fixtures/moneypuck-simulations_recent.csv`);

    // Using userSays helper
    userSays('alice', '@hubot preds');
    setTimeout(
      () => {
        try {
          expect(messages).to.eql([
            ['alice', '@hubot preds'],
            [
              'hubot',
              gameBlocks(
                '11/7/2023 - Nashville Predators (5-6-0) 2, Calgary Flames (3-7-1) 4 (Final)',
                '11/7/2023 - Final',
                [
                  ['Team', 'Score'],
                  ['Nashville Predators (5-6-0)', '2'],
                  ['Calgary Flames (3-7-1)', '4'],
                ],
                'Scotiabank Saddledome',
                '2023020186',
              ),
            ],
            [
              'hubot',
              oddsBlocks(
                'MoneyPuck: 67.5% to Make Playoffs / 4.2% to Win Stanley Cup',
                'Nashville Predators',
                [
                  ['Outcome', 'Odds'],
                  ['Make Playoffs', '67.5%'],
                  ['Win Stanley Cup', '4.2%'],
                ],
              ),
            ],
          ]);
          done();
        } catch (err) {
          done(err);
        }
      },
      100,
    );
  });

  it('responds with a pregame and playoff odds', (done) => {
    Date.now = () => Date.parse('Tue Nov 20 6:41:00 CST 2023');
    nock('https://api-web.nhle.com')
      .get('/v1/scoreboard/nsh/now')
      .replyWithFile(200, `${__dirname}/fixtures/api-web-nhle-schedule-pregame.json`);

    nock('https://moneypuck.com')
      .get('/moneypuck/simulations/update_date.txt')
      .reply(200, '2023-11-20 06:52:52.999000-04:00');

    nock('https://moneypuck.com')
      .get('/moneypuck/simulations/simulations_recent.csv')
      .replyWithFile(200, `${__dirname}/fixtures/moneypuck-simulations_recent.csv`);

    // Using userSays helper
    userSays('alice', '@hubot preds');
    setTimeout(
      () => {
        try {
          expect(messages).to.eql([
            ['alice', '@hubot preds'],
            [
              'hubot',
              gameBlocks(
                '11/20/2023 - Colorado Avalanche (11-5-0), Nashville Predators (6-10-0) (7:00 pm CST)',
                '11/20/2023 - 7:00 pm CST',
                [
                  ['Team'],
                  ['Colorado Avalanche (11-5-0)'],
                  ['Nashville Predators (6-10-0)'],
                ],
                'Bridgestone Arena; TV: BSSO (H) | ALT (A)',
                '2023020275',
              ),
            ],
            [
              'hubot',
              oddsBlocks(
                'MoneyPuck: 67.5% to Make Playoffs / 4.2% to Win Stanley Cup',
                'Nashville Predators',
                [
                  ['Outcome', 'Odds'],
                  ['Make Playoffs', '67.5%'],
                  ['Win Stanley Cup', '4.2%'],
                ],
              ),
            ],
          ]);
          done();
        } catch (err) {
          done(err);
        }
      },
      100,
    );
  });

  it('responds with division leader standings', (done) => {
    Date.now = () => Date.parse('Tues Nov 7 22:36:00 CST 2023');
    nock('https://api-web.nhle.com')
      .get('/v1/standings/2023-11-07')
      .replyWithFile(200, `${__dirname}/fixtures/api-web-nhle-standings.json`);

    // Using userSays helper
    userSays('alice', '@hubot nhl');
    setTimeout(
      () => {
        try {
          expect(messages).to.eql([
            ['alice', '@hubot nhl'],
            [
              'hubot',
              standingsBlocks(
                'Division Leaders',
                [
                  ['Team', 'GP', 'W', 'L', 'OT', 'PTS'],
                  ['Vegas Golden Knights', '13', '11', '1', '1', '23'],
                  ['Boston Bruins', '12', '10', '1', '1', '21'],
                  ['New York Rangers', '12', '9', '2', '1', '19'],
                  ['Dallas Stars', '11', '7', '3', '1', '15'],
                ],
              ),
            ],
          ]);
          done();
        } catch (err) {
          done(err);
        }
      },
      100,
    );
  });

  it('responds with division standings', (done) => {
    Date.now = () => Date.parse('Tues Nov 7 22:36:00 CST 2023');
    nock('https://api-web.nhle.com')
      .get('/v1/standings/2023-11-07')
      .replyWithFile(200, `${__dirname}/fixtures/api-web-nhle-standings.json`);

    // Using userSays helper
    userSays('alice', '@hubot nhl central');
    setTimeout(
      () => {
        try {
          expect(messages).to.eql([
            ['alice', '@hubot nhl central'],
            [
              'hubot',
              standingsBlocks(
                'Central Division Standings',
                [
                  ['Team', 'GP', 'W', 'L', 'OT', 'PTS'],
                  ['Dallas Stars', '11', '7', '3', '1', '15'],
                  ['Colorado Avalanche', '10', '7', '3', '0', '14'],
                  ['Winnipeg Jets', '12', '6', '4', '2', '14'],
                  ['Minnesota Wild', '12', '5', '5', '2', '12'],
                  ['Arizona Coyotes', '11', '5', '5', '1', '11'],
                  ['St. Louis Blues', '11', '5', '5', '1', '11'],
                  ['Nashville Predators', '11', '5', '6', '0', '10'],
                  ['Chicago Blackhawks', '11', '4', '7', '0', '8'],
                ],
              ),
            ],
          ]);
          done();
        } catch (err) {
          done(err);
        }
      },
      100,
    );
  });

  it('responds with a game in "critical" state and playoff odds', (done) => {
    Date.now = () => Date.parse('Fri Dec 16 22:28:00 CST 2023');
    nock('https://api-web.nhle.com')
      .get('/v1/scoreboard/nsh/now')
      .replyWithFile(200, `${__dirname}/fixtures/api-web-nhle-schedule-crit.json`);

    nock('https://moneypuck.com')
      .get('/moneypuck/simulations/update_date.txt')
      .reply(200, '2023-12-16 06:52:52.999000-04:00');

    nock('https://moneypuck.com')
      .get('/moneypuck/simulations/simulations_recent.csv')
      .replyWithFile(200, `${__dirname}/fixtures/moneypuck-simulations_recent.csv`);

    // Using userSays helper
    userSays('alice', '@hubot preds');
    setTimeout(
      () => {
        try {
          expect(messages).to.eql([
            ['alice', '@hubot preds'],
            [
              'hubot',
              gameBlocks(
                '12/15/2023 - Nashville Predators (5-6-0) 6, Carolina Hurricanes (8-5-0) 5 (04:25 OT)',
                '12/15/2023 - 04:25 OT',
                [
                  ['Team', 'Score'],
                  ['Nashville Predators (5-6-0)', '6'],
                  ['Carolina Hurricanes (8-5-0)', '5'],
                ],
                'PNC Arena; TV: ESPN+ (N) | HULU (N)',
                '2023020455',
              ),
            ],
            [
              'hubot',
              oddsBlocks(
                'MoneyPuck: 67.5% to Make Playoffs / 4.2% to Win Stanley Cup',
                'Nashville Predators',
                [
                  ['Outcome', 'Odds'],
                  ['Make Playoffs', '67.5%'],
                  ['Win Stanley Cup', '4.2%'],
                ],
              ),
            ],
          ]);
          done();
        } catch (err) {
          done(err);
        }
      },
      100,
    );
  });

  it('responds with a final score and playoff odds', (done) => {
    Date.now = () => Date.parse('Wed Nov 22 23:18:00 CST 2023');
    nock('https://api-web.nhle.com')
      .get('/v1/scoreboard/nsh/now')
      .replyWithFile(200, `${__dirname}/fixtures/api-web-nhle-schedule-final.json`);

    nock('https://moneypuck.com')
      .get('/moneypuck/simulations/update_date.txt')
      .reply(200, '2023-11-22 06:52:52.999000-04:00');

    nock('https://moneypuck.com')
      .get('/moneypuck/simulations/simulations_recent.csv')
      .replyWithFile(200, `${__dirname}/fixtures/moneypuck-simulations_recent.csv`);

    // Using userSays helper
    userSays('alice', '@hubot preds');
    setTimeout(
      () => {
        try {
          expect(messages).to.eql([
            ['alice', '@hubot preds'],
            [
              'hubot',
              gameBlocks(
                '11/22/2023 - Calgary Flames (3-7-1) 2, Nashville Predators (5-6-0) 4 (Final)',
                '11/22/2023 - Final',
                [
                  ['Team', 'Score'],
                  ['Calgary Flames (3-7-1)', '2'],
                  ['Nashville Predators (5-6-0)', '4'],
                ],
                'Bridgestone Arena',
                '2023020288',
              ),
            ],
            [
              'hubot',
              oddsBlocks(
                'MoneyPuck: 67.5% to Make Playoffs / 4.2% to Win Stanley Cup',
                'Nashville Predators',
                [
                  ['Outcome', 'Odds'],
                  ['Make Playoffs', '67.5%'],
                  ['Win Stanley Cup', '4.2%'],
                ],
              ),
            ],
          ]);
          done();
        } catch (err) {
          done(err);
        }
      },
      100,
    );
  });

  it('responds with a final score in a shootout and playoff odds', (done) => {
    Date.now = () => Date.parse('Fri Dec 15 23:18:00 CST 2023');
    nock('https://api-web.nhle.com')
      .get('/v1/scoreboard/nsh/now')
      .replyWithFile(200, `${__dirname}/fixtures/api-web-nhle-schedule-final-shootout.json`);

    nock('https://moneypuck.com')
      .get('/moneypuck/simulations/update_date.txt')
      .reply(200, '2023-12-15 06:52:52.999000-04:00');

    nock('https://moneypuck.com')
      .get('/moneypuck/simulations/simulations_recent.csv')
      .replyWithFile(200, `${__dirname}/fixtures/moneypuck-simulations_recent.csv`);

    // Using userSays helper
    userSays('alice', '@hubot preds');
    setTimeout(
      () => {
        try {
          expect(messages).to.eql([
            ['alice', '@hubot preds'],
            [
              'hubot',
              gameBlocks(
                '12/15/2023 - Boston Bruins (10-1-1) 5, New York Islanders (5-3-3) 4 (Final/SO)',
                '12/15/2023 - Final/SO',
                [
                  ['Team', 'Score'],
                  ['Boston Bruins (10-1-1)', '5'],
                  ['New York Islanders (5-3-3)', '4'],
                ],
                'UBS Arena',
                '2023020457',
              ),
            ],
            [
              'hubot',
              oddsBlocks(
                'MoneyPuck: 67.5% to Make Playoffs / 4.2% to Win Stanley Cup',
                'Nashville Predators',
                [
                  ['Outcome', 'Odds'],
                  ['Make Playoffs', '67.5%'],
                  ['Win Stanley Cup', '4.2%'],
                ],
              ),
            ],
          ]);
          done();
        } catch (err) {
          done(err);
        }
      },
      100,
    );
  });

  it('responds with a future playoff game and series status', (done) => {
    Date.now = () => Date.parse('Tue Apr 23 12:00:00 CST 2024');
    nock('https://api-web.nhle.com')
      .get('/v1/scoreboard/nsh/now')
      .replyWithFile(200, `${__dirname}/fixtures/api-web-nhle-schedule-future-playoff.json`);

    nock('https://moneypuck.com')
      .get('/moneypuck/simulations/update_date.txt')
      .reply(200, '2023-04-23 06:52:52.999000-04:00');

    nock('https://moneypuck.com')
      .get('/moneypuck/simulations/simulations_recent.csv')
      .replyWithFile(200, `${__dirname}/fixtures/moneypuck-simulations_recent.csv`);

    // Using userSays helper
    userSays('alice', '@hubot preds');
    setTimeout(
      () => {
        try {
          expect(messages).to.eql([
            ['alice', '@hubot preds'],
            [
              'hubot',
              gameBlocks(
                '4/23/2024 - Nashville Predators, Vancouver Canucks (9:00 pm CDT - R1 Game 2 (VAN leads 1-0))',
                '4/23/2024 - 9:00 pm CDT - R1 Game 2 (VAN leads 1-0)',
                [
                  ['Team'],
                  ['Nashville Predators'],
                  ['Vancouver Canucks'],
                ],
                'Rogers Arena; TV: ESPN2 (N) | SN (N) | TVAS2 (N) | BSSO (A)',
                '2023030172',
              ),
            ],
          ]);
          done();
        } catch (err) {
          done(err);
        }
      },
      100,
    );
  });

  it('responds with an in-progress playoff game and series status', (done) => {
    Date.now = () => Date.parse('Sat Jun 15 21:01:00 CST 2024');
    nock('https://api-web.nhle.com')
      .get('/v1/scoreboard/edm/now')
      .replyWithFile(200, `${__dirname}/fixtures/api-web-nhle-schedule-in-progress-playoff.json`);

    nock('https://moneypuck.com')
      .get('/moneypuck/simulations/update_date.txt')
      .reply(200, '2023-04-23 06:52:52.999000-04:00');

    nock('https://moneypuck.com')
      .get('/moneypuck/simulations/simulations_recent.csv')
      .replyWithFile(200, `${__dirname}/fixtures/moneypuck-simulations_recent.csv`);

    // Using userSays helper
    userSays('alice', '@hubot oilers');
    setTimeout(
      () => {
        try {
          expect(messages).to.eql([
            ['alice', '@hubot oilers'],
            [
              'hubot',
              gameBlocks(
                '6/15/2024 - Florida Panthers (6-4-1) 1, Edmonton Oilers (2-8-1) 6 (02:36 2nd - SCF Game 4 (FLA leads 3-0))',
                '6/15/2024 - 02:36 2nd - SCF Game 4 (FLA leads 3-0)',
                [
                  ['Team', 'Score'],
                  ['Florida Panthers (6-4-1)', '1'],
                  ['Edmonton Oilers (2-8-1)', '6'],
                ],
                'Rogers Place; TV: ABC (N) | ESPN+ (N) | SN (N) | CBC (N) | TVAS (N)',
                '2023030414',
              ),
            ],
          ]);
          done();
        } catch (err) {
          done(err);
        }
      },
      100,
    );
  });

  it('responds with a preseason game before focus date', (done) => {
    Date.now = () => Date.parse('Fri Aug 30 13:10:00 CDT 2024');
    nock('https://api-web.nhle.com')
      .get('/v1/scoreboard/nsh/now')
      .replyWithFile(200, `${__dirname}/fixtures/api-web-nhle-schedule-preseason.json`);

    nock('https://moneypuck.com')
      .get('/moneypuck/simulations/update_date.txt')
      .reply(200, '2023-12-16 06:52:52.999000-04:00');

    nock('https://moneypuck.com')
      .get('/moneypuck/simulations/simulations_recent.csv')
      .replyWithFile(200, `${__dirname}/fixtures/moneypuck-simulations_recent.csv`);

    // Using userSays helper
    userSays('alice', '@hubot preds');
    setTimeout(
      () => {
        try {
          expect(messages).to.eql([
            ['alice', '@hubot preds'],
            [
              'hubot',
              gameBlocks(
                '9/27/2024 - Nashville Predators (47-30-5), Tampa Bay Lightning (45-29-8) (6:00 pm CDT - Preseason)',
                '9/27/2024 - 6:00 pm CDT - Preseason',
                [
                  ['Team'],
                  ['Nashville Predators (47-30-5)'],
                  ['Tampa Bay Lightning (45-29-8)'],
                ],
                'Amalie Arena',
                '2024010044',
              ),
            ],
          ]);
          done();
        } catch (err) {
          done(err);
        }
      },
      100,
    );
  });

  it('responds with a final score and no odds if they are stale', (done) => {
    Date.now = () => Date.parse('Sat Dec 16 10:28:00 CST 2023');
    nock('https://api-web.nhle.com')
      .get('/v1/scoreboard/bos/now')
      .replyWithFile(200, `${__dirname}/fixtures/api-web-nhle-schedule-final-shootout.json`);

    nock('https://moneypuck.com')
      .get('/moneypuck/simulations/update_date.txt')
      .reply(200, '2023-11-07 06:52:52.999000-04:00');

    nock('https://moneypuck.com')
      .get('/moneypuck/simulations/simulations_recent.csv')
      .replyWithFile(200, `${__dirname}/fixtures/moneypuck-simulations_recent.csv`);

    // Using userSays helper
    userSays('alice', '@hubot bruins');
    setTimeout(
      () => {
        try {
          expect(messages).to.eql([
            ['alice', '@hubot bruins'],
            [
              'hubot',
              gameBlocks(
                '12/15/2023 - Boston Bruins (10-1-1) 5, New York Islanders (5-3-3) 4 (Final/SO)',
                '12/15/2023 - Final/SO',
                [
                  ['Team', 'Score'],
                  ['Boston Bruins (10-1-1)', '5'],
                  ['New York Islanders (5-3-3)', '4'],
                ],
                'UBS Arena',
                '2023020457',
              ),
            ],
          ]);
          done();
        } catch (err) {
          done(err);
        }
      },
      100,
    );
  });

  it('responds with a completed playoff game and series status', (done) => {
    Date.now = () => Date.parse('Tue Apr 24 9:00:00 CST 2024');
    nock('https://api-web.nhle.com')
      .get('/v1/scoreboard/nsh/now')
      .replyWithFile(200, `${__dirname}/fixtures/api-web-nhle-schedule-completed-playoff.json`);

    nock('https://moneypuck.com')
      .get('/moneypuck/simulations/update_date.txt')
      .reply(200, '2023-04-23 06:52:52.999000-04:00');

    nock('https://moneypuck.com')
      .get('/moneypuck/simulations/simulations_recent.csv')
      .replyWithFile(200, `${__dirname}/fixtures/moneypuck-simulations_recent.csv`);

    // Using userSays helper
    userSays('alice', '@hubot preds');
    setTimeout(
      () => {
        try {
          expect(messages).to.eql([
            ['alice', '@hubot preds'],
            [
              'hubot',
              gameBlocks(
                '4/23/2024 - Nashville Predators (5-6-0) 4, Vancouver Canucks (9-2-1) 1 (Final - R1 Game 2 (Tied 1-1))',
                '4/23/2024 - Final - R1 Game 2 (Tied 1-1)',
                [
                  ['Team', 'Score'],
                  ['Nashville Predators (5-6-0)', '4'],
                  ['Vancouver Canucks (9-2-1)', '1'],
                ],
                'Rogers Arena',
                '2023030172',
              ),
            ],
          ]);
          done();
        } catch (err) {
          done(err);
        }
      },
      100,
    );
  });

  it('responds with conference standings', (done) => {
    Date.now = () => Date.parse('Tues Nov 7 22:36:00 CST 2023');
    nock('https://api-web.nhle.com')
      .get('/v1/standings/2023-11-07')
      .replyWithFile(200, `${__dirname}/fixtures/api-web-nhle-standings.json`);

    // Using userSays helper
    userSays('alice', '@hubot nhl west');
    setTimeout(
      () => {
        try {
          expect(messages).to.eql([
            ['alice', '@hubot nhl west'],
            [
              'hubot',
              standingsBlocks(
                'Western Conference Standings',
                [
                  ['Team', 'GP', 'W', 'L', 'OT', 'PTS'],
                  ['Vegas Golden Knights', '13', '11', '1', '1', '23'],
                  ['Vancouver Canucks', '12', '9', '2', '1', '19'],
                  ['Los Angeles Kings', '11', '7', '2', '2', '16'],
                  ['Dallas Stars', '11', '7', '3', '1', '15'],
                  ['Colorado Avalanche', '10', '7', '3', '0', '14'],
                  ['Anaheim Ducks', '11', '7', '4', '0', '14'],
                  ['Winnipeg Jets', '12', '6', '4', '2', '14'],
                  ['Minnesota Wild', '12', '5', '5', '2', '12'],
                  ['Arizona Coyotes', '11', '5', '5', '1', '11'],
                  ['St. Louis Blues', '11', '5', '5', '1', '11'],
                  ['Nashville Predators', '11', '5', '6', '0', '10'],
                  ['Seattle Kraken', '12', '4', '6', '2', '10'],
                  ['Chicago Blackhawks', '11', '4', '7', '0', '8'],
                  ['Calgary Flames', '11', '3', '7', '1', '7'],
                  ['Edmonton Oilers', '11', '2', '8', '1', '5'],
                  ['San Jose Sharks', '11', '0', '10', '1', '1'],
                ],
              ),
            ],
          ]);
          done();
        } catch (err) {
          done(err);
        }
      },
      100,
    );
  });

  it('responds with standings during the off-season', (done) => {
    Date.now = () => Date.parse('Tues Jul 9 18:36:00 CST 2024');

    // Clear the global standings nock and set up the offseason one
    nock.cleanAll();
    nock('https://api-web.nhle.com')
      .get('/v1/standings/2024-07-09')
      .replyWithFile(200, `${__dirname}/fixtures/api-web-nhle-standings-offseason.json`);

    // Using userSays helper
    userSays('alice', '@hubot nhl');
    setTimeout(
      () => {
        try {
          expect(messages).to.eql([
            ['alice', '@hubot nhl'],
            [
              'hubot',
              'Standings available when season starts.',
            ],
          ]);
          done();
        } catch (err) {
          done(err);
        }
      },
      100,
    );
  });
});
