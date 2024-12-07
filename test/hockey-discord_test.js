/* global it, describe, beforeEach, afterEach */

const Helper = require('hubot-test-helper');
const chai = require('chai');
const nock = require('nock');

const {
  expect,
} = chai;

const helper = new Helper([
  'adapters/discord.js',
  '../src/hockey.js',
]);

// Alter time as test runs
const originalDateNow = Date.now;

describe('hubot-hockey for discord', () => {
  let room = null;

  beforeEach(() => {
    process.env.HUBOT_LOG_LEVEL = 'error';
    nock.disableNetConnect();
    room = helper.createRoom();

    // Re-used in every call
    nock('https://api-web.nhle.com')
      .get(/\/v1\/standings\/\d{4}-\d{2}-\d{2}/)
      .delay({
        head: 100,
        body: 200,
      })
      .replyWithFile(200, `${__dirname}/fixtures/api-web-nhle-standings.json`);
  });

  afterEach(() => {
    delete process.env.HUBOT_LOG_LEVEL;
    Date.now = originalDateNow;
    nock.cleanAll();
    room.destroy();
  });

  it('responds with an in-progress game and playoff odds', (done) => {
    Date.now = () => Date.parse('Tue Nov 7 22:42:00 CST 2023');
    nock('https://api-web.nhle.com')
      .get('/v1/scoreboard/nsh/now')
      .delay({
        head: 100,
        body: 200,
      })
      .replyWithFile(200, `${__dirname}/fixtures/api-web-nhle-schedule-in-progress.json`);

    nock('https://moneypuck.com')
      .get('/moneypuck/simulations/update_date.txt')
      .reply(200, '2023-11-07 06:52:52.999000-04:00');

    nock('https://moneypuck.com')
      .get('/moneypuck/simulations/simulations_recent.csv')
      .replyWithFile(200, `${__dirname}/fixtures/moneypuck-simulations_recent.csv`);

    const selfRoom = room;
    selfRoom.user.say('alice', '@hubot preds');
    setTimeout(
      () => {
        try {
          expect(selfRoom.messages).to.eql([
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
      500,
    );
  });

  it('responds with division leader standings', (done) => {
    Date.now = () => Date.parse('Tues Nov 7 22:36:00 CST 2023');
    nock('https://api-web.nhle.com')
      .get('/v1/standings/2023-11-07')
      .delay({
        head: 100,
        body: 200,
      })
      .replyWithFile(200, `${__dirname}/fixtures/api-web-nhle-standings.json`);

    const selfRoom = room;
    selfRoom.user.say('alice', '@hubot nhl');
    setTimeout(
      () => {
        try {
          expect(selfRoom.messages).to.eql([
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
      500,
    );
  });

  it('responds with division standings', (done) => {
    Date.now = () => Date.parse('Tues Nov 7 22:36:00 CST 2023');
    nock('https://api-web.nhle.com')
      .get('/v1/standings/2023-11-07')
      .delay({
        head: 100,
        body: 200,
      })
      .replyWithFile(200, `${__dirname}/fixtures/api-web-nhle-standings.json`);

    const selfRoom = room;
    selfRoom.user.say('alice', '@hubot nhl central');
    setTimeout(
      () => {
        try {
          expect(selfRoom.messages).to.eql([
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
      500,
    );
  });
});
