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
      .get('/moneypuck/simulations/update_date.txt')
      .reply(200, '2023-11-07 06:52:52.999000-04:00');

    nock('https://moneypuck.com')
      .get('/moneypuck/simulations/simulations_recent.csv')
      .replyWithFile(200, `${__dirname}/fixtures/moneypuck-simulations_recent.csv`);

    nock('http://www.sportsclubstats.com')
      .get('/d/NHL_ChanceWillMakePlayoffs_Small_A.json')
      .replyWithFile(
        200,
        `${__dirname}/fixtures/sports-club-stats.json`,
        {
          'last-modified': 'Sat, 16 Dec 2023 10:28:00 GMT',
        },
      );

    const selfRoom = room;
    selfRoom.user.say('alice', '@hubot preds');
    setTimeout(
      () => {
        try {
          expect(selfRoom.messages).to.eql([
            ['alice', '@hubot preds'],
            ['hubot', '11/7/2023 - Scotiabank Saddledome; TV: BSSO (A) | SNW (H)'],
            [
              'hubot',
              '  Nashville Predators   2  \n'
            + '  Calgary Flames        3  ',
            ],
            ['hubot', '09:04 3rd - https://www.nhl.com/gamecenter/2023020186'],
            ['hubot', 'Sports Club Stats: 77.7% to Make Playoffs'],
            ['hubot', 'MoneyPuck: 67.5% to Make Playoffs / 4.2% to Win Stanley Cup'],
          ]);
          done();
        } catch (err) {
          done(err);
        }
      },
      500,
    );
  });

  it('responds with an in-intermission game and playoff odds', (done) => {
    Date.now = () => Date.parse('Sat Dec 16 18:41:00 CST 2023');
    nock('https://api-web.nhle.com')
      .get('/v1/scoreboard/nsh/now')
      .delay({
        head: 100,
        body: 200,
      })
      .replyWithFile(200, `${__dirname}/fixtures/api-web-nhle-schedule-intermission.json`);

    nock('https://moneypuck.com')
      .get('/moneypuck/simulations/update_date.txt')
      .reply(200, '2023-12-16 06:52:52.999000-04:00');

    nock('https://moneypuck.com')
      .get('/moneypuck/simulations/simulations_recent.csv')
      .replyWithFile(200, `${__dirname}/fixtures/moneypuck-simulations_recent.csv`);

    nock('http://www.sportsclubstats.com')
      .get('/d/NHL_ChanceWillMakePlayoffs_Small_A.json')
      .replyWithFile(
        200,
        `${__dirname}/fixtures/sports-club-stats.json`,
        {
          'last-modified': 'Sat, 16 Dec 2023 10:28:00 GMT',
        },
      );

    const selfRoom = room;
    selfRoom.user.say('alice', '@hubot preds');
    setTimeout(
      () => {
        try {
          expect(selfRoom.messages).to.eql([
            ['alice', '@hubot preds'],
            ['hubot', '12/16/2023 - Bridgestone Arena; TV: NHLN (N) | BSSO (H) | MNMT (A)'],
            [
              'hubot',
              '  Washington Capitals   0  \n'
            + '  Nashville Predators   1  ',
            ],
            ['hubot', '07:21 1st Intermission - https://www.nhl.com/gamecenter/2023020468'],
            ['hubot', 'Sports Club Stats: 77.7% to Make Playoffs'],
            ['hubot', 'MoneyPuck: 67.5% to Make Playoffs / 4.2% to Win Stanley Cup'],
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
      .get('/moneypuck/simulations/update_date.txt')
      .reply(200, '2023-11-08 06:52:52.999000-04:00');

    nock('https://moneypuck.com')
      .get('/moneypuck/simulations/simulations_recent.csv')
      .replyWithFile(200, `${__dirname}/fixtures/moneypuck-simulations_recent.csv`);

    nock('http://www.sportsclubstats.com')
      .get('/d/NHL_ChanceWillMakePlayoffs_Small_A.json')
      .replyWithFile(
        200,
        `${__dirname}/fixtures/sports-club-stats.json`,
        {
          'last-modified': 'Sat, 16 Dec 2023 10:28:00 GMT',
        },
      );

    const selfRoom = room;
    selfRoom.user.say('alice', '@hubot preds');
    setTimeout(
      () => {
        try {
          expect(selfRoom.messages).to.eql([
            ['alice', '@hubot preds'],
            ['hubot', '11/9/2023 - Canada Life Centre; TV: BSSO (A) | TSN3 (H)'],
            [
              'hubot',
              '  Nashville Predators (5-7-0)  \n'
            + '  Winnipeg Jets (6-4-2)        ',
            ],
            ['hubot', '7:00 pm CST - https://www.nhl.com/gamecenter/2023020200'],
            ['hubot', 'Sports Club Stats: 77.7% to Make Playoffs'],
            ['hubot', 'MoneyPuck: 67.5% to Make Playoffs / 4.2% to Win Stanley Cup'],
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
      .get('/moneypuck/simulations/update_date.txt')
      .reply(200, '2023-11-07 06:52:52.999000-04:00');

    nock('https://moneypuck.com')
      .get('/moneypuck/simulations/simulations_recent.csv')
      .replyWithFile(200, `${__dirname}/fixtures/moneypuck-simulations_recent.csv`);

    nock('http://www.sportsclubstats.com')
      .get('/d/NHL_ChanceWillMakePlayoffs_Small_A.json')
      .replyWithFile(
        200,
        `${__dirname}/fixtures/sports-club-stats.json`,
        {
          'last-modified': 'Sat, 16 Dec 2023 10:28:00 GMT',
        },
      );

    const selfRoom = room;
    selfRoom.user.say('alice', '@hubot preds');
    setTimeout(
      () => {
        try {
          expect(selfRoom.messages).to.eql([
            ['alice', '@hubot preds'],
            ['hubot', '11/7/2023 - Scotiabank Saddledome'],
            [
              'hubot',
              '  Nashville Predators   2  \n'
            + '  Calgary Flames        4  ',
            ],
            ['hubot', 'Final - https://www.nhl.com/gamecenter/2023020186'],
            ['hubot', 'Sports Club Stats: 77.7% to Make Playoffs'],
            ['hubot', 'MoneyPuck: 67.5% to Make Playoffs / 4.2% to Win Stanley Cup'],
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
      .get('/moneypuck/simulations/update_date.txt')
      .reply(200, '2023-11-20 06:52:52.999000-04:00');

    nock('https://moneypuck.com')
      .get('/moneypuck/simulations/simulations_recent.csv')
      .replyWithFile(200, `${__dirname}/fixtures/moneypuck-simulations_recent.csv`);

    nock('http://www.sportsclubstats.com')
      .get('/d/NHL_ChanceWillMakePlayoffs_Small_A.json')
      .replyWithFile(
        200,
        `${__dirname}/fixtures/sports-club-stats.json`,
        {
          'last-modified': 'Sat, 16 Dec 2023 10:28:00 GMT',
        },
      );

    const selfRoom = room;
    selfRoom.user.say('alice', '@hubot preds');
    setTimeout(
      () => {
        try {
          expect(selfRoom.messages).to.eql([
            ['alice', '@hubot preds'],
            ['hubot', '11/20/2023 - Bridgestone Arena; TV: BSSO (H) | ALT (A)'],
            [
              'hubot',
              '  Colorado Avalanche (11-5-0)   \n'
              + '  Nashville Predators (6-10-0)  ',
            ],
            ['hubot', '7:00 pm CST - https://www.nhl.com/gamecenter/2023020275'],
            ['hubot', 'Sports Club Stats: 77.7% to Make Playoffs'],
            ['hubot', 'MoneyPuck: 67.5% to Make Playoffs / 4.2% to Win Stanley Cup'],
          ]);
          done();
        } catch (err) {
          done(err);
        }
      },
      500,
    );
  });

  it('responds with a game in "critical" state and playoff odds', (done) => {
    Date.now = () => Date.parse('Fri Dec 16 22:28:00 CST 2023');
    nock('https://api-web.nhle.com')
      .get('/v1/scoreboard/nsh/now')
      .delay({
        head: 100,
        body: 200,
      })
      .replyWithFile(200, `${__dirname}/fixtures/api-web-nhle-schedule-crit.json`);

    nock('https://moneypuck.com')
      .get('/moneypuck/simulations/update_date.txt')
      .reply(200, '2023-12-16 06:52:52.999000-04:00');

    nock('https://moneypuck.com')
      .get('/moneypuck/simulations/simulations_recent.csv')
      .replyWithFile(200, `${__dirname}/fixtures/moneypuck-simulations_recent.csv`);

    nock('http://www.sportsclubstats.com')
      .get('/d/NHL_ChanceWillMakePlayoffs_Small_A.json')
      .replyWithFile(
        200,
        `${__dirname}/fixtures/sports-club-stats.json`,
        {
          'last-modified': 'Sat, 16 Dec 2023 10:28:00 GMT',
        },
      );

    const selfRoom = room;
    selfRoom.user.say('alice', '@hubot preds');
    setTimeout(
      () => {
        try {
          expect(selfRoom.messages).to.eql([
            ['alice', '@hubot preds'],
            ['hubot', '12/15/2023 - PNC Arena; TV: ESPN+ (N) | HULU (N)'],
            [
              'hubot',
              '  Nashville Predators   6  \n'
            + '  Carolina Hurricanes   5  ',
            ],
            ['hubot', '04:25 OT - https://www.nhl.com/gamecenter/2023020455'],
            ['hubot', 'Sports Club Stats: 77.7% to Make Playoffs'],
            ['hubot', 'MoneyPuck: 67.5% to Make Playoffs / 4.2% to Win Stanley Cup'],
          ]);
          done();
        } catch (err) {
          done(err);
        }
      },
      500,
    );
  });

  it('responds with a future playoff game and series status', (done) => {
    Date.now = () => Date.parse('Tue Apr 23 12:00:00 CST 2024');
    nock('https://api-web.nhle.com')
      .get('/v1/scoreboard/nsh/now')
      .delay({
        head: 100,
        body: 200,
      })
      .replyWithFile(200, `${__dirname}/fixtures/api-web-nhle-schedule-future-playoff.json`);

    nock('https://moneypuck.com')
      .get('/moneypuck/simulations/update_date.txt')
      .reply(200, '2023-04-23 06:52:52.999000-04:00');

    nock('https://moneypuck.com')
      .get('/moneypuck/simulations/simulations_recent.csv')
      .replyWithFile(200, `${__dirname}/fixtures/moneypuck-simulations_recent.csv`);

    nock('http://www.sportsclubstats.com')
      .get('/d/NHL_ChanceWillMakePlayoffs_Small_A.json')
      .replyWithFile(
        200,
        `${__dirname}/fixtures/sports-club-stats.json`,
        {
          'last-modified': 'Sun, 21 Apr 2024 10:28:00 GMT',
        },
      );

    const selfRoom = room;
    selfRoom.user.say('alice', '@hubot preds');
    setTimeout(
      () => {
        try {
          expect(selfRoom.messages).to.eql([
            ['alice', '@hubot preds'],
            ['hubot', '4/23/2024 - Rogers Arena; TV: ESPN2 (N) | SN (N) | TVAS2 (N) | BSSO (A)'],
            [
              'hubot',
              '  Nashville Predators  \n'
            + '  Vancouver Canucks    ',
            ],
            [
              'hubot',
              '9:00 pm CDT - R1 Game 2 (VAN leads 1-0) - https://www.nhl.com/gamecenter/2023030172',
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

  it('responds with an in-progress playoff game and series status', (done) => {
    Date.now = () => Date.parse('Sat Jun 15 21:01:00 CST 2024');
    nock('https://api-web.nhle.com')
      .get('/v1/scoreboard/edm/now')
      .delay({
        head: 100,
        body: 200,
      })
      .replyWithFile(200, `${__dirname}/fixtures/api-web-nhle-schedule-in-progress-playoff.json`);

    nock('https://moneypuck.com')
      .get('/moneypuck/simulations/update_date.txt')
      .reply(200, '2023-04-23 06:52:52.999000-04:00');

    nock('https://moneypuck.com')
      .get('/moneypuck/simulations/simulations_recent.csv')
      .replyWithFile(200, `${__dirname}/fixtures/moneypuck-simulations_recent.csv`);

    nock('http://www.sportsclubstats.com')
      .get('/d/NHL_ChanceWillMakePlayoffs_Small_A.json')
      .replyWithFile(
        200,
        `${__dirname}/fixtures/sports-club-stats.json`,
        {
          'last-modified': 'Sun, 21 Apr 2024 10:28:00 GMT',
        },
      );

    const selfRoom = room;
    selfRoom.user.say('alice', '@hubot oilers');
    setTimeout(
      () => {
        try {
          expect(selfRoom.messages).to.eql([
            ['alice', '@hubot oilers'],
            ['hubot', '6/15/2024 - Rogers Place; TV: ABC (N) | ESPN+ (N) | SN (N) | CBC (N) | TVAS (N)'],
            [
              'hubot',
              '  Florida Panthers   1  \n'
            + '  Edmonton Oilers    6  ',
            ],
            [
              'hubot',
              '02:36 2nd - SCF Game 4 (FLA leads 3-0) - https://www.nhl.com/gamecenter/2023030414',
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

  it('responds with a completed playoff game and series status', (done) => {
    Date.now = () => Date.parse('Tue Apr 24 9:00:00 CST 2024');
    nock('https://api-web.nhle.com')
      .get('/v1/scoreboard/nsh/now')
      .delay({
        head: 100,
        body: 200,
      })
      .replyWithFile(200, `${__dirname}/fixtures/api-web-nhle-schedule-completed-playoff.json`);

    nock('https://moneypuck.com')
      .get('/moneypuck/simulations/update_date.txt')
      .reply(200, '2023-04-23 06:52:52.999000-04:00');

    nock('https://moneypuck.com')
      .get('/moneypuck/simulations/simulations_recent.csv')
      .replyWithFile(200, `${__dirname}/fixtures/moneypuck-simulations_recent.csv`);

    nock('http://www.sportsclubstats.com')
      .get('/d/NHL_ChanceWillMakePlayoffs_Small_A.json')
      .replyWithFile(
        200,
        `${__dirname}/fixtures/sports-club-stats.json`,
        {
          'last-modified': 'Sun, 21 Apr 2024 10:28:00 GMT',
        },
      );

    const selfRoom = room;
    selfRoom.user.say('alice', '@hubot preds');
    setTimeout(
      () => {
        try {
          expect(selfRoom.messages).to.eql([
            ['alice', '@hubot preds'],
            ['hubot', '4/23/2024 - Rogers Arena'],
            [
              'hubot',
              '  Nashville Predators   4  \n'
            + '  Vancouver Canucks     1  ',
            ],
            [
              'hubot',
              'Final - R1 Game 2 (Tied 1-1) - https://www.nhl.com/gamecenter/2023030172',
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

  it('responds with a completed playoff series', (done) => {
    Date.now = () => Date.parse('Fri May 3 22:00:00 CST 2024');
    nock('https://api-web.nhle.com')
      .get('/v1/scoreboard/nsh/now')
      .delay({
        head: 100,
        body: 200,
      })
      .replyWithFile(200, `${__dirname}/fixtures/api-web-nhle-schedule-eliminated.json`);

    nock('https://moneypuck.com')
      .get('/moneypuck/simulations/update_date.txt')
      .reply(200, '2023-05-03 06:52:52.999000-04:00');

    nock('https://moneypuck.com')
      .get('/moneypuck/simulations/simulations_recent.csv')
      .replyWithFile(200, `${__dirname}/fixtures/moneypuck-simulations_recent.csv`);

    nock('http://www.sportsclubstats.com')
      .get('/d/NHL_ChanceWillMakePlayoffs_Small_A.json')
      .replyWithFile(
        200,
        `${__dirname}/fixtures/sports-club-stats.json`,
        {
          'last-modified': 'Sun, 21 Apr 2024 10:28:00 GMT',
        },
      );

    const selfRoom = room;
    selfRoom.user.say('alice', '@hubot preds');
    setTimeout(
      () => {
        try {
          expect(selfRoom.messages).to.eql([
            ['alice', '@hubot preds'],
            ['hubot', '5/3/2024 - Bridgestone Arena'],
            [
              'hubot',
              '  Vancouver Canucks     1  \n'
            + '  Nashville Predators   0  ',
            ],
            [
              'hubot',
              'Final - R1 Game 6 (VAN wins 4-2) - https://www.nhl.com/gamecenter/2023030176',
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

  it('responds with a final score and playoff odds', (done) => {
    Date.now = () => Date.parse('Wed Nov 22 23:18:00 CST 2023');
    nock('https://api-web.nhle.com')
      .get('/v1/scoreboard/nsh/now')
      .delay({
        head: 100,
        body: 200,
      })
      .replyWithFile(200, `${__dirname}/fixtures/api-web-nhle-schedule-final.json`);

    nock('https://moneypuck.com')
      .get('/moneypuck/simulations/update_date.txt')
      .reply(200, '2023-11-22 06:52:52.999000-04:00');

    nock('https://moneypuck.com')
      .get('/moneypuck/simulations/simulations_recent.csv')
      .replyWithFile(200, `${__dirname}/fixtures/moneypuck-simulations_recent.csv`);

    nock('http://www.sportsclubstats.com')
      .get('/d/NHL_ChanceWillMakePlayoffs_Small_A.json')
      .replyWithFile(
        200,
        `${__dirname}/fixtures/sports-club-stats.json`,
        {
          'last-modified': 'Sat, 16 Dec 2023 10:28:00 GMT',
        },
      );

    const selfRoom = room;
    selfRoom.user.say('alice', '@hubot preds');
    setTimeout(
      () => {
        try {
          expect(selfRoom.messages).to.eql([
            ['alice', '@hubot preds'],
            ['hubot', '11/22/2023 - Bridgestone Arena'],
            [
              'hubot',
              '  Calgary Flames        2  \n'
              + '  Nashville Predators   4  ',
            ],
            ['hubot', 'Final - https://www.nhl.com/gamecenter/2023020288'],
            ['hubot', 'Sports Club Stats: 77.7% to Make Playoffs'],
            ['hubot', 'MoneyPuck: 67.5% to Make Playoffs / 4.2% to Win Stanley Cup'],
          ]);
          done();
        } catch (err) {
          done(err);
        }
      },
      500,
    );
  });

  it('responds with a final score in a shootout and playoff odds', (done) => {
    Date.now = () => Date.parse('Sat Dec 16 10:28:00 CST 2023');
    nock('https://api-web.nhle.com')
      .get('/v1/scoreboard/bos/now')
      .delay({
        head: 100,
        body: 200,
      })
      .replyWithFile(200, `${__dirname}/fixtures/api-web-nhle-schedule-final-shootout.json`);

    nock('https://moneypuck.com')
      .get('/moneypuck/simulations/update_date.txt')
      .reply(200, '2023-12-16 06:52:52.999000-04:00');

    nock('https://moneypuck.com')
      .get('/moneypuck/simulations/simulations_recent.csv')
      .replyWithFile(200, `${__dirname}/fixtures/moneypuck-simulations_recent.csv`);

    nock('http://www.sportsclubstats.com')
      .get('/d/NHL_ChanceWillMakePlayoffs_Small_A.json')
      .replyWithFile(
        200,
        `${__dirname}/fixtures/sports-club-stats.json`,
        {
          'last-modified': 'Sat, 16 Dec 2023 10:28:00 GMT',
        },
      );

    const selfRoom = room;
    selfRoom.user.say('alice', '@hubot bruins');
    setTimeout(
      () => {
        try {
          expect(selfRoom.messages).to.eql([
            ['alice', '@hubot bruins'],
            ['hubot', '12/15/2023 - UBS Arena'],
            [
              'hubot',
              '  Boston Bruins        5  \n'
              + '  New York Islanders   4  ',
            ],
            ['hubot', 'Final/SO - https://www.nhl.com/gamecenter/2023020457'],
            ['hubot', 'Sports Club Stats: 100.0% to Make Playoffs'],
            ['hubot', 'MoneyPuck: 62.0% to Make Playoffs / 3.8% to Win Stanley Cup'],
          ]);
          done();
        } catch (err) {
          done(err);
        }
      },
      500,
    );
  });

  it('responds with a preseason game before focus date', (done) => {
    Date.now = () => Date.parse('Fri Aug 30 13:10:00 CDT 2024');
    nock('https://api-web.nhle.com')
      .get('/v1/scoreboard/nsh/now')
      .delay({
        head: 100,
        body: 200,
      })
      .replyWithFile(200, `${__dirname}/fixtures/api-web-nhle-schedule-preseason.json`);

    nock('https://moneypuck.com')
      .get('/moneypuck/simulations/update_date.txt')
      .reply(200, '2023-12-16 06:52:52.999000-04:00');

    nock('https://moneypuck.com')
      .get('/moneypuck/simulations/simulations_recent.csv')
      .replyWithFile(200, `${__dirname}/fixtures/moneypuck-simulations_recent.csv`);

    nock('http://www.sportsclubstats.com')
      .get('/d/NHL_ChanceWillMakePlayoffs_Small_A.json')
      .replyWithFile(
        200,
        `${__dirname}/fixtures/sports-club-stats.json`,
        {
          'last-modified': 'Sat, 16 Dec 2023 10:28:00 GMT',
        },
      );

    const selfRoom = room;
    selfRoom.user.say('alice', '@hubot preds');
    setTimeout(
      () => {
        try {
          expect(selfRoom.messages).to.eql([
            ['alice', '@hubot preds'],
            ['hubot', '9/27/2024 - Amalie Arena'],
            [
              'hubot',
              '  Nashville Predators (47-30-5)  \n'
              + '  Tampa Bay Lightning (45-29-8)  ',
            ],
            ['hubot', '6:00 pm CDT - Preseason - https://www.nhl.com/gamecenter/2024010044'],
          ]);
          done();
        } catch (err) {
          done(err);
        }
      },
      500,
    );
  });

  it('responds with a final score and no odds if they are stale', (done) => {
    Date.now = () => Date.parse('Sat Dec 16 10:28:00 CST 2023');
    nock('https://api-web.nhle.com')
      .get('/v1/scoreboard/bos/now')
      .delay({
        head: 100,
        body: 200,
      })
      .replyWithFile(200, `${__dirname}/fixtures/api-web-nhle-schedule-final-shootout.json`);

    nock('https://moneypuck.com')
      .get('/moneypuck/simulations/update_date.txt')
      .reply(200, '2023-11-07 06:52:52.999000-04:00');

    nock('https://moneypuck.com')
      .get('/moneypuck/simulations/simulations_recent.csv')
      .replyWithFile(200, `${__dirname}/fixtures/moneypuck-simulations_recent.csv`);

    nock('http://www.sportsclubstats.com')
      .get('/d/NHL_ChanceWillMakePlayoffs_Small_A.json')
      .replyWithFile(
        200,
        `${__dirname}/fixtures/sports-club-stats.json`,
        {
          'last-modified': 'Wed, 14 Dec 2023 10:28:00 GMT',
        },
      );

    const selfRoom = room;
    selfRoom.user.say('alice', '@hubot bruins');
    setTimeout(
      () => {
        try {
          expect(selfRoom.messages).to.eql([
            ['alice', '@hubot bruins'],
            ['hubot', '12/15/2023 - UBS Arena'],
            [
              'hubot',
              '  Boston Bruins        5  \n'
              + '  New York Islanders   4  ',
            ],
            ['hubot', 'Final/SO - https://www.nhl.com/gamecenter/2023020457'],
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
              '.-----------------------------------------------.\n'
            + '|               Division Leaders                |\n'
            + '|-----------------------------------------------|\n'
            + '|         Team         | GP | W  | L | OT | PTS |\n'
            + '|----------------------|----|----|---|----|-----|\n'
            + '| Vegas Golden Knights | 13 | 11 | 1 |  1 |  23 |\n'
            + '| Boston Bruins        | 12 | 10 | 1 |  1 |  21 |\n'
            + '| New York Rangers     | 12 |  9 | 2 |  1 |  19 |\n'
            + '| Dallas Stars         | 11 |  7 | 3 |  1 |  15 |\n'
            + "'-----------------------------------------------'",
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
              '.---------------------------------------------.\n'
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
            + "'---------------------------------------------'",
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

  it('responds with conference standings', (done) => {
    Date.now = () => Date.parse('Tues Nov 7 22:36:00 CST 2023');
    nock('https://api-web.nhle.com')
      .get('/v1/standings/2023-11-07')
      .delay({
        head: 100,
        body: 200,
      })
      .replyWithFile(200, `${__dirname}/fixtures/api-web-nhle-standings.json`);

    const selfRoom = room;
    selfRoom.user.say('alice', '@hubot nhl west');
    setTimeout(
      () => {
        try {
          expect(selfRoom.messages).to.eql([
            ['alice', '@hubot nhl west'],
            [
              'hubot',
              '.------------------------------------------------.\n'
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
            + "'------------------------------------------------'",
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

  it('responds with conference standings with clinched positions', (done) => {
    Date.now = () => Date.parse('Sat Apr 6 16:30:00 CST 2024');
    nock('https://api-web.nhle.com')
      .get('/v1/standings/2024-04-06')
      .delay({
        head: 100,
        body: 200,
      })
      .replyWithFile(200, `${__dirname}/fixtures/api-web-nhle-standings-clinch.json`);

    const selfRoom = room;
    selfRoom.user.say('alice', '@hubot nhl west');
    setTimeout(
      () => {
        try {
          expect(selfRoom.messages).to.eql([
            ['alice', '@hubot nhl west'],
            [
              'hubot',
              '.--------------------------------------------------.\n'
            + '|           Western Conference Standings           |\n'
            + '|--------------------------------------------------|\n'
            + '|          Team          | GP | W  | L  | OT | PTS |\n'
            + '|------------------------|----|----|----|----|-----|\n'
            + '| Dallas Stars (x)       | 76 | 48 | 19 |  9 | 105 |\n'
            + '| Vancouver Canucks (x)  | 76 | 47 | 21 |  8 | 102 |\n'
            + '| Colorado Avalanche (x) | 77 | 48 | 23 |  6 | 102 |\n'
            + '| Winnipeg Jets (x)      | 76 | 46 | 24 |  6 |  98 |\n'
            + '| Edmonton Oilers (x)    | 75 | 46 | 24 |  5 |  97 |\n'
            + '| Nashville Predators    | 76 | 44 | 28 |  4 |  92 |\n'
            + '| Vegas Golden Knights   | 76 | 42 | 26 |  8 |  92 |\n'
            + '| Los Angeles Kings      | 76 | 40 | 25 | 11 |  91 |\n'
            + '| St. Louis Blues        | 76 | 40 | 32 |  4 |  84 |\n'
            + '| Minnesota Wild         | 75 | 36 | 30 |  9 |  81 |\n'
            + '| Seattle Kraken (e)     | 76 | 32 | 31 | 13 |  77 |\n'
            + '| Calgary Flames (e)     | 75 | 34 | 36 |  5 |  73 |\n'
            + '| Arizona Coyotes (e)    | 76 | 32 | 39 |  5 |  69 |\n'
            + '| Anaheim Ducks (e)      | 77 | 25 | 48 |  4 |  54 |\n'
            + '| Chicago Blackhawks (e) | 75 | 22 | 48 |  5 |  49 |\n'
            + '| San Jose Sharks (e)    | 75 | 17 | 50 |  8 |  42 |\n'
            + '\'--------------------------------------------------\'',
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

  it('responds with conference standings and resolves tied records', (done) => {
    Date.now = () => Date.parse('Sat Apr 6 16:30:00 CST 2024');
    nock('https://api-web.nhle.com')
      .get('/v1/standings/2024-04-06')
      .delay({
        head: 100,
        body: 200,
      })
      .replyWithFile(200, `${__dirname}/fixtures/api-web-nhle-standings-tie.json`);

    const selfRoom = room;
    selfRoom.user.say('alice', '@hubot nhl east');
    setTimeout(
      () => {
        try {
          expect(selfRoom.messages).to.eql([
            ['alice', '@hubot nhl east'],
            [
              'hubot',
              '.-----------------------------------------------------.\n'
            + '|            Eastern Conference Standings             |\n'
            + '|-----------------------------------------------------|\n'
            + '|           Team            | GP | W  | L  | OT | PTS |\n'
            + '|---------------------------|----|----|----|----|-----|\n'
            + '| New York Rangers (p)      | 82 | 55 | 23 |  4 | 114 |\n'
            + '| Carolina Hurricanes (x)   | 82 | 52 | 23 |  7 | 111 |\n'
            + '| Florida Panthers (y)      | 82 | 52 | 24 |  6 | 110 |\n'
            + '| Boston Bruins (x)         | 82 | 47 | 20 | 15 | 109 |\n'
            + '| Toronto Maple Leafs (x)   | 82 | 46 | 26 | 10 | 102 |\n'
            + '| Tampa Bay Lightning (x)   | 82 | 45 | 29 |  8 |  98 |\n'
            + '| New York Islanders (x)    | 82 | 39 | 27 | 16 |  94 |\n'
            + '| Washington Capitals (x)   | 82 | 40 | 31 | 11 |  91 |\n'
            + '| Detroit Red Wings (e)     | 82 | 41 | 32 |  9 |  91 |\n'
            + '| Pittsburgh Penguins (e)   | 82 | 38 | 32 | 12 |  88 |\n'
            + '| Philadelphia Flyers (e)   | 82 | 38 | 33 | 11 |  87 |\n'
            + '| Buffalo Sabres (e)        | 82 | 39 | 37 |  6 |  84 |\n'
            + '| New Jersey Devils (e)     | 82 | 38 | 39 |  5 |  81 |\n'
            + '| Ottawa Senators (e)       | 82 | 37 | 41 |  4 |  78 |\n'
            + '| Montréal Canadiens (e)    | 82 | 30 | 36 | 16 |  76 |\n'
            + '| Columbus Blue Jackets (e) | 82 | 27 | 43 | 12 |  66 |\n'
            + '\'-----------------------------------------------------\'',
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

describe('hubot-hockey HUBOT_HOCKEY_EXT_STANDINGS=true', () => {
  let room = null;

  beforeEach(() => {
    process.env.HUBOT_LOG_LEVEL = 'error';
    process.env.HUBOT_HOCKEY_EXT_STANDINGS = 'true';
    nock.disableNetConnect();
    room = helper.createRoom();
    nock.disableNetConnect();
  });

  afterEach(() => {
    delete process.env.HUBOT_LOG_LEVEL;
    delete process.env.HUBOT_HOCKEY_EXT_STANDINGS;
    Date.now = originalDateNow;
    nock.cleanAll();
    room.destroy();
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
              '.----------------------------------------------------------------------.\n'
            + '|                           Division Leaders                           |\n'
            + '|----------------------------------------------------------------------|\n'
            + '|         Team         | GP | W  | L | OT | PTS |  P%   |  L10  | STRK |\n'
            + '|----------------------|----|----|---|----|-----|-------|-------|------|\n'
            + '| Vegas Golden Knights | 13 | 11 | 1 |  1 |  23 | 0.885 | 8-1-1 | L1   |\n'
            + '| Boston Bruins        | 12 | 10 | 1 |  1 |  21 | 0.875 | 8-1-1 | W1   |\n'
            + '| New York Rangers     | 12 |  9 | 2 |  1 |  19 | 0.792 | 8-1-1 | W1   |\n'
            + '| Dallas Stars         | 11 |  7 | 3 |  1 |  15 | 0.682 | 6-3-1 | L2   |\n'
            + "'----------------------------------------------------------------------'",
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

describe('hubot-hockey HUBOT_HOCKEY_HIDE_ODDS=true', () => {
  let room = null;

  beforeEach(() => {
    process.env.HUBOT_LOG_LEVEL = 'error';
    process.env.HUBOT_HOCKEY_HIDE_ODDS = 'true';
    nock.disableNetConnect();
    room = helper.createRoom();
    nock.disableNetConnect();
  });

  afterEach(() => {
    delete process.env.HUBOT_LOG_LEVEL;
    delete process.env.HUBOT_HOCKEY_HIDE_ODDS;
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

    const selfRoom = room;
    selfRoom.user.say('alice', '@hubot preds');
    setTimeout(
      () => {
        try {
          expect(selfRoom.messages).to.eql([
            ['alice', '@hubot preds'],
            ['hubot', '11/7/2023 - Scotiabank Saddledome; TV: BSSO (A) | SNW (H)'],
            [
              'hubot',
              '  Nashville Predators   2  \n'
            + '  Calgary Flames        3  ',
            ],
            ['hubot', '09:04 3rd - https://www.nhl.com/gamecenter/2023020186'],
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
