import hubot from 'hubot';
import { expect } from 'chai';
import nock from 'nock';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const { Robot, User, TextMessage } = hubot;

// ESM-friendly __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Alter time as test runs
const originalDateNow = Date.now;

describe('hubot-hockey for discord', () => {
  let robot = null;
  let adapter = null;
  let messages = [];

  beforeEach(() => {
    process.env.HUBOT_LOG_LEVEL = 'error';
    nock.disableNetConnect();

    // Create robot with mock adapter
    robot = new Robot('hubot-mock-adapter', false, 'hubot');
    robot.loadAdapter();
    adapter = robot.adapter;
    messages = [];

    // Load the discord adapter and hockey script
    robot.loadFile(path.resolve(__dirname, 'adapters'), 'discord.js');
    robot.loadFile(path.resolve(__dirname, '..', 'src'), 'hockey.js');
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

    userSays('alice', '@hubot preds');
    setTimeout(
      () => {
        try {
          expect(messages).to.eql([
            ['alice', '@hubot preds'],
            [
              'hubot',
              '11/7/2023 - Scotiabank Saddledome; TV: BSSO (A) | SNW (H)\n'
              + '```\n'
              + '  Nashville Predators (5-6-0)   2  \n'
              + '  Calgary Flames (3-7-1)        3  \n'
              + '```\n'
              + '09:04 3rd - https://www.nhl.com/gamecenter/2023020186',
            ],
            [
              'hubot',
              '__**MoneyPuck.com**__\n'
              + '**Make Playoffs:** 67.5%\n'
              + '**Win Stanley Cup:** 4.2%',
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

    userSays('alice', '@hubot nhl');
    setTimeout(
      () => {
        try {
          expect(messages).to.eql([
            ['alice', '@hubot nhl'],
            [
              'hubot',
              '```\n'
              + '.-----------------------------------------------.\n'
              + '|               Division Leaders                |\n'
              + '|-----------------------------------------------|\n'
              + '|         Team         | GP | W  | L | OT | PTS |\n'
              + '|----------------------|----|----|---|----|-----|\n'
              + '| Vegas Golden Knights | 13 | 11 | 1 |  1 |  23 |\n'
              + '| Boston Bruins        | 12 | 10 | 1 |  1 |  21 |\n'
              + '| New York Rangers     | 12 |  9 | 2 |  1 |  19 |\n'
              + '| Dallas Stars         | 11 |  7 | 3 |  1 |  15 |\n'
              + "'-----------------------------------------------'\n"
              + '```',
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

    userSays('alice', '@hubot nhl central');
    setTimeout(
      () => {
        try {
          expect(messages).to.eql([
            ['alice', '@hubot nhl central'],
            [
              'hubot',
              '```\n'
              + '.---------------------------------------------.\n'
              + '|         Central Division Standings          |\n'
              + '|---------------------------------------------|\n'
              + '|        Team         | GP | W | L | OT | PTS |\n'
              + '|---------------------|----|---|---|----|-----|\n'
              + '| Dallas Stars        | 11 | 7 | 3 |  1 |  15 |\n'
              + '| Colorado Avalanche  | 10 | 7 | 3 |  0 |  14 |\n'
              + '| Winnipeg Jets       | 12 | 6 | 4 |  2 |  14 |\n'
              + '| Minnesota Wild      | 12 | 5 | 5 |  2 |  12 |\n'
              + '| Arizona Coyotes     | 11 | 5 | 5 |  1 |  11 |\n'
              + '| St. Louis Blues     | 11 | 5 | 5 |  1 |  11 |\n'
              + '| Nashville Predators | 11 | 5 | 6 |  0 |  10 |\n'
              + '| Chicago Blackhawks  | 11 | 4 | 7 |  0 |   8 |\n'
              + "'---------------------------------------------'\n"
              + '```',
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

    userSays('alice', '@hubot preds');
    setTimeout(
      () => {
        try {
          expect(messages).to.eql([
            ['alice', '@hubot preds'],
            [
              'hubot',
              '12/16/2023 - Bridgestone Arena; TV: NHLN (N) | BSSO (H) | MNMT (A)\n'
              + '```\n'
              + '  Washington Capitals (5-4-1)   0  \n'
              + '  Nashville Predators (5-6-0)   1  \n'
              + '```\n'
              + '07:21 1st Intermission - https://www.nhl.com/gamecenter/2023020468',
            ],
            [
              'hubot',
              '__**MoneyPuck.com**__\n'
              + '**Make Playoffs:** 67.5%\n'
              + '**Win Stanley Cup:** 4.2%',
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
    Date.now = () => Date.parse('Fri Nov 24 22:42:00 CST 2023');
    nock('https://api-web.nhle.com')
      .get('/v1/scoreboard/nsh/now')
      .replyWithFile(200, `${__dirname}/fixtures/api-web-nhle-schedule-future.json`);

    nock('https://moneypuck.com')
      .get('/moneypuck/simulations/update_date.txt')
      .reply(200, '2023-11-24 06:52:52.999000-04:00');

    nock('https://moneypuck.com')
      .get('/moneypuck/simulations/simulations_recent.csv')
      .replyWithFile(200, `${__dirname}/fixtures/moneypuck-simulations_recent.csv`);

    userSays('alice', '@hubot preds');
    setTimeout(
      () => {
        try {
          expect(messages).to.eql([
            ['alice', '@hubot preds'],
            [
              'hubot',
              '11/9/2023 - Canada Life Centre; TV: BSSO (A) | TSN3 (H)\n'
              + '```\n'
              + '  Nashville Predators (5-7-0)  \n'
              + '  Winnipeg Jets (6-4-2)        \n'
              + '```\n'
              + '7:00 pm CST - https://www.nhl.com/gamecenter/2023020200',
            ],
            [
              'hubot',
              '__**MoneyPuck.com**__\n'
              + '**Make Playoffs:** 67.5%\n'
              + '**Win Stanley Cup:** 4.2%',
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
    Date.now = () => Date.parse('Tue Nov 7 22:42:00 CST 2023');
    nock('https://api-web.nhle.com')
      .get('/v1/scoreboard/nsh/now')
      .replyWithFile(200, `${__dirname}/fixtures/api-web-nhle-schedule-completed.json`);

    nock('https://moneypuck.com')
      .get('/moneypuck/simulations/update_date.txt')
      .reply(200, '2023-11-07 06:52:52.999000-04:00');

    nock('https://moneypuck.com')
      .get('/moneypuck/simulations/simulations_recent.csv')
      .replyWithFile(200, `${__dirname}/fixtures/moneypuck-simulations_recent.csv`);

    userSays('alice', '@hubot preds');
    setTimeout(
      () => {
        try {
          expect(messages).to.eql([
            ['alice', '@hubot preds'],
            [
              'hubot',
              '11/7/2023 - Scotiabank Saddledome\n'
              + '```\n'
              + '  Nashville Predators (5-6-0)   2  \n'
              + '  Calgary Flames (3-7-1)        4  \n'
              + '```\n'
              + 'Final - https://www.nhl.com/gamecenter/2023020186',
            ],
            [
              'hubot',
              '__**MoneyPuck.com**__\n'
              + '**Make Playoffs:** 67.5%\n'
              + '**Win Stanley Cup:** 4.2%',
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

    userSays('alice', '@hubot preds');
    setTimeout(
      () => {
        try {
          expect(messages).to.eql([
            ['alice', '@hubot preds'],
            [
              'hubot',
              '11/20/2023 - Bridgestone Arena; TV: BSSO (H) | ALT (A)\n'
              + '```\n'
              + '  Colorado Avalanche (11-5-0)   \n'
              + '  Nashville Predators (6-10-0)  \n'
              + '```\n'
              + '7:00 pm CST - https://www.nhl.com/gamecenter/2023020275',
            ],
            [
              'hubot',
              '__**MoneyPuck.com**__\n'
              + '**Make Playoffs:** 67.5%\n'
              + '**Win Stanley Cup:** 4.2%',
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

    userSays('alice', '@hubot preds');
    setTimeout(
      () => {
        try {
          expect(messages).to.eql([
            ['alice', '@hubot preds'],
            [
              'hubot',
              '12/15/2023 - PNC Arena; TV: ESPN+ (N) | HULU (N)\n'
              + '```\n'
              + '  Nashville Predators (5-6-0)   6  \n'
              + '  Carolina Hurricanes (8-5-0)   5  \n'
              + '```\n'
              + '04:25 OT - https://www.nhl.com/gamecenter/2023020455',
            ],
            [
              'hubot',
              '__**MoneyPuck.com**__\n'
              + '**Make Playoffs:** 67.5%\n'
              + '**Win Stanley Cup:** 4.2%',
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

    userSays('alice', '@hubot preds');
    setTimeout(
      () => {
        try {
          expect(messages).to.eql([
            ['alice', '@hubot preds'],
            [
              'hubot',
              '11/22/2023 - Bridgestone Arena\n'
              + '```\n'
              + '  Calgary Flames (3-7-1)        2  \n'
              + '  Nashville Predators (5-6-0)   4  \n'
              + '```\n'
              + 'Final - https://www.nhl.com/gamecenter/2023020288',
            ],
            [
              'hubot',
              '__**MoneyPuck.com**__\n'
              + '**Make Playoffs:** 67.5%\n'
              + '**Win Stanley Cup:** 4.2%',
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

    userSays('alice', '@hubot preds');
    setTimeout(
      () => {
        try {
          expect(messages).to.eql([
            ['alice', '@hubot preds'],
            [
              'hubot',
              '12/15/2023 - UBS Arena\n'
              + '```\n'
              + '  Boston Bruins (10-1-1)       5  \n'
              + '  New York Islanders (5-3-3)   4  \n'
              + '```\n'
              + 'Final/SO - https://www.nhl.com/gamecenter/2023020457',
            ],
            [
              'hubot',
              '__**MoneyPuck.com**__\n'
              + '**Make Playoffs:** 67.5%\n'
              + '**Win Stanley Cup:** 4.2%',
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

    userSays('alice', '@hubot preds');
    setTimeout(
      () => {
        try {
          expect(messages).to.eql([
            ['alice', '@hubot preds'],
            [
              'hubot',
              '4/23/2024 - Rogers Arena; TV: ESPN2 (N) | SN (N) | TVAS2 (N) | BSSO (A)\n'
              + '```\n'
              + '  Nashville Predators  \n'
              + '  Vancouver Canucks    \n'
              + '```\n'
              + '9:00 pm CDT - R1 Game 2 (VAN leads 1-0) - https://www.nhl.com/gamecenter/2023030172',
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

    userSays('alice', '@hubot oilers');
    setTimeout(
      () => {
        try {
          expect(messages).to.eql([
            ['alice', '@hubot oilers'],
            [
              'hubot',
              '6/15/2024 - Rogers Place; TV: ABC (N) | ESPN+ (N) | SN (N) | CBC (N) | TVAS (N)\n'
              + '```\n'
              + '  Florida Panthers (6-4-1)   1  \n'
              + '  Edmonton Oilers (2-8-1)    6  \n'
              + '```\n'
              + '02:36 2nd - SCF Game 4 (FLA leads 3-0) - https://www.nhl.com/gamecenter/2023030414',
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

    userSays('alice', '@hubot preds');
    setTimeout(
      () => {
        try {
          expect(messages).to.eql([
            ['alice', '@hubot preds'],
            [
              'hubot',
              '9/27/2024 - Amalie Arena\n'
              + '```\n'
              + '  Nashville Predators (47-30-5)  \n'
              + '  Tampa Bay Lightning (45-29-8)  \n'
              + '```\n'
              + '6:00 pm CDT - Preseason - https://www.nhl.com/gamecenter/2024010044',
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

    userSays('alice', '@hubot bruins');
    setTimeout(
      () => {
        try {
          expect(messages).to.eql([
            ['alice', '@hubot bruins'],
            [
              'hubot',
              '12/15/2023 - UBS Arena\n'
              + '```\n'
              + '  Boston Bruins (10-1-1)       5  \n'
              + '  New York Islanders (5-3-3)   4  \n'
              + '```\n'
              + 'Final/SO - https://www.nhl.com/gamecenter/2023020457',
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

    userSays('alice', '@hubot preds');
    setTimeout(
      () => {
        try {
          expect(messages).to.eql([
            ['alice', '@hubot preds'],
            [
              'hubot',
              '4/23/2024 - Rogers Arena\n'
              + '```\n'
              + '  Nashville Predators (5-6-0)   4  \n'
              + '  Vancouver Canucks (9-2-1)     1  \n'
              + '```\n'
              + 'Final - R1 Game 2 (Tied 1-1) - https://www.nhl.com/gamecenter/2023030172',
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

  it('responds with a completed playoff series', (done) => {
    Date.now = () => Date.parse('Fri May 3 22:00:00 CST 2024');
    nock('https://api-web.nhle.com')
      .get('/v1/scoreboard/nsh/now')
      .replyWithFile(200, `${__dirname}/fixtures/api-web-nhle-schedule-eliminated.json`);

    nock('https://moneypuck.com')
      .get('/moneypuck/simulations/update_date.txt')
      .reply(200, '2023-05-03 06:52:52.999000-04:00');

    nock('https://moneypuck.com')
      .get('/moneypuck/simulations/simulations_recent.csv')
      .replyWithFile(200, `${__dirname}/fixtures/moneypuck-simulations_recent.csv`);

    userSays('alice', '@hubot preds');
    setTimeout(
      () => {
        try {
          expect(messages).to.eql([
            ['alice', '@hubot preds'],
            [
              'hubot',
              '5/3/2024 - Bridgestone Arena\n'
              + '```\n'
              + '  Vancouver Canucks (9-2-1)     1  \n'
              + '  Nashville Predators (5-6-0)   0  \n'
              + '```\n'
              + 'Final - R1 Game 6 (VAN wins 4-2) - https://www.nhl.com/gamecenter/2023030176',
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

    userSays('alice', '@hubot nhl west');
    setTimeout(
      () => {
        try {
          expect(messages).to.eql([
            ['alice', '@hubot nhl west'],
            [
              'hubot',
              '```\n'
              + '.------------------------------------------------.\n'
              + '|          Western Conference Standings          |\n'
              + '|------------------------------------------------|\n'
              + '|         Team         | GP | W  | L  | OT | PTS |\n'
              + '|----------------------|----|----|----|----|-----|\n'
              + '| Vegas Golden Knights | 13 | 11 |  1 |  1 |  23 |\n'
              + '| Vancouver Canucks    | 12 |  9 |  2 |  1 |  19 |\n'
              + '| Los Angeles Kings    | 11 |  7 |  2 |  2 |  16 |\n'
              + '| Dallas Stars         | 11 |  7 |  3 |  1 |  15 |\n'
              + '| Colorado Avalanche   | 10 |  7 |  3 |  0 |  14 |\n'
              + '| Anaheim Ducks        | 11 |  7 |  4 |  0 |  14 |\n'
              + '| Winnipeg Jets        | 12 |  6 |  4 |  2 |  14 |\n'
              + '| Minnesota Wild       | 12 |  5 |  5 |  2 |  12 |\n'
              + '| Arizona Coyotes      | 11 |  5 |  5 |  1 |  11 |\n'
              + '| St. Louis Blues      | 11 |  5 |  5 |  1 |  11 |\n'
              + '| Nashville Predators  | 11 |  5 |  6 |  0 |  10 |\n'
              + '| Seattle Kraken       | 12 |  4 |  6 |  2 |  10 |\n'
              + '| Chicago Blackhawks   | 11 |  4 |  7 |  0 |   8 |\n'
              + '| Calgary Flames       | 11 |  3 |  7 |  1 |   7 |\n'
              + '| Edmonton Oilers      | 11 |  2 |  8 |  1 |   5 |\n'
              + '| San Jose Sharks      | 11 |  0 | 10 |  1 |   1 |\n'
              + "'------------------------------------------------'\n"
              + '```',
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
