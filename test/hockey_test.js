/* global it, describe, beforeEach, afterEach */

const Helper = require('hubot-test-helper');
const chai = require('chai');
chai.use(require('sinon-chai'));
const nock = require('nock');

const helper = new Helper([
  './../src/hockey.js',
]);
const { expect } = chai;

// Alter time as test runs
const originalDateNow = Date.now;

describe('hubot-hockey', () => {
  let room = null;

  beforeEach(() => {
    process.env.HUBOT_LOG_LEVEL = 'error';
    nock.disableNetConnect();
    room = helper.createRoom();
    nock.disableNetConnect();
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
      .get('/moneypuck/simulations/simulations_recent.csv')
      .replyWithFile(200, `${__dirname}/fixtures/moneypuck-simulations_recent.csv`);

    const selfRoom = room;
    selfRoom.user.say('alice', '@hubot preds');
    setTimeout(
      () => {
        try {
          expect(selfRoom.messages).to.eql([
            ['alice', '@hubot preds'],
            ['hubot', '11/7/2023 - Scotiabank Saddledome; TV: BSSO (A) | SNW (H)'],
            ['hubot', '  Nashville Predators   2  \n  Calgary Flames        3  '],
            ['hubot', '09:04 3rd - https://www.nhl.com/gamecenter/2023020186'],
            ['hubot', 'Odds to Make Playoffs: 67.5% / Win Stanley Cup: 4.2%'],
          ]);
          done();
        } catch (err) {
          done(err);
        }
      },
      500,
    );
  });

  it('responds with a future game and playoff odds', (done) => {
    Date.now = () => Date.parse('Tue Nov 8 08:00:00 CST 2023');
    nock('https://api-web.nhle.com')
      .get('/v1/scoreboard/nsh/now')
      .delay({
        head: 100,
        body: 200,
      })
      .replyWithFile(200, `${__dirname}/fixtures/api-web-nhle-schedule-future.json`);

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
            ['hubot', '11/9/2023 - Canada Life Centre; TV: BSSO (A) | TSN3 (H)'],
            ['hubot', '  Nashville Predators (5-7-0)  \n  Winnipeg Jets (6-4-2)        '],
            ['hubot', '7:00 pm CST - https://www.nhl.com/gamecenter/2023020200'],
            ['hubot', 'Odds to Make Playoffs: 67.5% / Win Stanley Cup: 4.2%'],
          ]);
          done();
        } catch (err) {
          done(err);
        }
      },
      500,
    );
  });

  it('responds with a completed game and playoff odds', (done) => {
    Date.now = () => Date.parse('Tue Nov 7 23:00:00 CST 2023');
    nock('https://api-web.nhle.com')
      .get('/v1/scoreboard/nsh/now')
      .delay({
        head: 100,
        body: 200,
      })
      .replyWithFile(200, `${__dirname}/fixtures/api-web-nhle-schedule-completed.json`);

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
            ['hubot', '11/7/2023 - Scotiabank Saddledome'],
            ['hubot', '  Nashville Predators   2  \n  Calgary Flames        4  '],
            ['hubot', 'Final - https://www.nhl.com/gamecenter/2023020186'],
            ['hubot', 'Odds to Make Playoffs: 67.5% / Win Stanley Cup: 4.2%'],
          ]);
          done();
        } catch (err) {
          done(err);
        }
      },
      500,
    );
  });

  it('responds with a pregame and playoff odds', (done) => {
    Date.now = () => Date.parse('Tue Nov 20 6:41:00 CST 2023');
    nock('https://api-web.nhle.com')
      .get('/v1/scoreboard/nsh/now')
      .delay({
        head: 100,
        body: 200,
      })
      .replyWithFile(200, `${__dirname}/fixtures/api-web-nhle-schedule-pregame.json`);

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
            ['hubot', '11/20/2023 - Bridgestone Arena; TV: BSSO (H) | ALT (A)'],
            ['hubot', '  Colorado Avalanche (11-5-0)   \n  Nashville Predators (6-10-0)  '],
            ['hubot', '7:00 pm CST - https://www.nhl.com/gamecenter/2023020275'],
            ['hubot', 'Odds to Make Playoffs: 67.5% / Win Stanley Cup: 4.2%'],
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
            ['hubot', ".-------------------------------------------------------.\n|                   Division Leaders                    |\n|-------------------------------------------------------|\n|         Team         | GP | W  | L | OT | PTS |  L10  |\n|----------------------|----|----|---|----|-----|-------|\n| Vegas Golden Knights | 13 | 11 | 1 |  1 |  23 | 8-1-1 |\n| Boston Bruins        | 12 | 10 | 1 |  1 |  21 | 8-1-1 |\n| New York Rangers     | 12 |  9 | 2 |  1 |  19 | 8-1-1 |\n| Dallas Stars         | 11 |  7 | 3 |  1 |  15 | 6-3-1 |\n'-------------------------------------------------------'"],
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
            ['hubot', ".-----------------------------------------------------.\n|                  Central Standings                  |\n|-----------------------------------------------------|\n|        Team         | GP | W | L | OT | PTS |  L10  |\n|---------------------|----|---|---|----|-----|-------|\n| Dallas Stars        | 11 | 7 | 3 |  1 |  15 | 6-3-1 |\n| Colorado Avalanche  | 10 | 7 | 3 |  0 |  14 | 7-3-0 |\n| Winnipeg Jets       | 12 | 6 | 4 |  2 |  14 | 5-3-2 |\n| Minnesota Wild      | 12 | 5 | 5 |  2 |  12 | 4-4-2 |\n| Arizona Coyotes     | 11 | 5 | 5 |  1 |  11 | 4-5-1 |\n| St. Louis Blues     | 11 | 5 | 5 |  1 |  11 | 5-5-0 |\n| Nashville Predators | 11 | 5 | 6 |  0 |  10 | 5-5-0 |\n| Chicago Blackhawks  | 11 | 4 | 7 |  0 |   8 | 3-7-0 |\n'-----------------------------------------------------'"],
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
