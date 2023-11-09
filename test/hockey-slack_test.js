/* global it, describe, beforeEach, afterEach */

const Helper = require('hubot-test-helper');
const chai = require('chai');
const nock = require('nock');

const {
  expect,
} = chai;

const helper = new Helper([
  'adapters/slack.js',
  '../src/hockey.js',
]);

// Alter time as test runs
const originalDateNow = Date.now;

describe('hubot-hockey for slack', () => {
  let room = null;

  beforeEach(() => {
    process.env.HUBOT_LOG_LEVEL = 'error';
    nock.disableNetConnect();
    room = helper.createRoom();
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
      .replyWithFile(200, `${__dirname}/fixtures/api-web-nhle-schedule.json`);

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
              {
                attachments: [
                  {
                    author_icon: 'https://github.com/nhl.png',
                    author_link: 'https://nhl.com',
                    author_name: 'NHL.com',
                    color: '#FFB81C',
                    fallback: '11/7/2023 - Nashville Predators 2, Calgary Flames 3 (09:04 3rd)',
                    footer: 'Scotiabank Saddledome; TV: BSSO (A) | SNW (H)',
                    mrkdwn_in: [
                      'text',
                      'pretext',
                    ],
                    text: '```\n  Nashville Predators   2  \n  Calgary Flames        3  \n```',
                    title: '11/7/2023 - 09:04 3rd',
                    title_link: 'https://www.nhl.com/gamecenter/2023020186',
                  },
                ],
              },
            ],
            [
              'hubot',
              {
                attachments: [
                  {
                    author_icon: 'http://peter-tanner.com/moneypuck/logos/moneypucklogo.png',
                    author_link: 'https://moneypuck.com',
                    author_name: 'MoneyPuck.com',
                    color: '#FFB81C',
                    fallback: 'Odds to Make Playoffs: 67.5% / Win Stanley Cup: 4.2%',
                    fields: [
                      {
                        short: false,
                        title: 'Make Playoffs',
                        value: '67.5%',
                      },
                      {
                        short: false,
                        title: 'Win Stanley Cup',
                        value: '4.2%',
                      },
                    ],
                    thumb_url: 'http://peter-tanner.com/moneypuck/logos/NSH.png',
                    title: 'Nashville Predators',
                  },
                ],
              },
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

  it('responds with a future game and playoff odds', (done) => {
    Date.now = () => Date.parse('Tue Nov 8 08:00:00 CST 2023');
    nock('https://api-web.nhle.com')
      .get('/v1/scoreboard/nsh/now')
      .delay({
        head: 100,
        body: 200,
      })
      .replyWithFile(200, `${__dirname}/fixtures/api-web-nhle-schedule.json`);

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
              {
                attachments: [
                  {
                    author_icon: 'https://github.com/nhl.png',
                    author_link: 'https://nhl.com',
                    author_name: 'NHL.com',
                    color: '#FFB81C',
                    fallback: '11/9/2023 - Nashville Predators 5-6-0, Winnipeg Jets 6-4-2 (7:00 pm CST)',
                    footer: 'Canada Life Centre; TV: BSSO (A) | TSN3 (H)',
                    mrkdwn_in: [
                      'text',
                      'pretext',
                    ],
                    text: '```\n  Nashville Predators (5-6-0)  \n  Winnipeg Jets (6-4-2)        \n```',
                    title: '11/9/2023 - 7:00 pm CST',
                    title_link: 'https://www.nhl.com/gamecenter/2023020200',
                  },
                ],
              },
            ],
            [
              'hubot',
              {
                attachments: [
                  {
                    author_icon: 'http://peter-tanner.com/moneypuck/logos/moneypucklogo.png',
                    author_link: 'https://moneypuck.com',
                    author_name: 'MoneyPuck.com',
                    color: '#FFB81C',
                    fallback: 'Odds to Make Playoffs: 67.5% / Win Stanley Cup: 4.2%',
                    fields: [
                      {
                        short: false,
                        title: 'Make Playoffs',
                        value: '67.5%',
                      },
                      {
                        short: false,
                        title: 'Win Stanley Cup',
                        value: '4.2%',
                      },
                    ],
                    thumb_url: 'http://peter-tanner.com/moneypuck/logos/NSH.png',
                    title: 'Nashville Predators',
                  },
                ],
              },
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

  it('responds with a past game and playoff odds', (done) => {
    Date.now = () => Date.parse('Tue Nov 4 08:00:00 CST 2023');
    nock('https://api-web.nhle.com')
      .get('/v1/scoreboard/nsh/now')
      .delay({
        head: 100,
        body: 200,
      })
      .replyWithFile(200, `${__dirname}/fixtures/api-web-nhle-schedule.json`);

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
              {
                attachments: [
                  {
                    author_icon: 'https://github.com/nhl.png',
                    author_link: 'https://nhl.com',
                    author_name: 'NHL.com',
                    color: '#FFB81C',
                    fallback: '11/4/2023 - Nashville Predators 5, Edmonton Oilers 2 (Final)',
                    footer: 'Rogers Place',
                    mrkdwn_in: [
                      'text',
                      'pretext',
                    ],
                    text: '```\n  Nashville Predators   5  \n  Edmonton Oilers       2  \n```',
                    title: '11/4/2023 - Final',
                    title_link: 'https://www.nhl.com/gamecenter/2023020159',
                  },
                ],
              },
            ],
            [
              'hubot',
              {
                attachments: [
                  {
                    author_icon: 'http://peter-tanner.com/moneypuck/logos/moneypucklogo.png',
                    author_link: 'https://moneypuck.com',
                    author_name: 'MoneyPuck.com',
                    color: '#FFB81C',
                    fallback: 'Odds to Make Playoffs: 67.5% / Win Stanley Cup: 4.2%',
                    fields: [
                      {
                        short: false,
                        title: 'Make Playoffs',
                        value: '67.5%',
                      },
                      {
                        short: false,
                        title: 'Win Stanley Cup',
                        value: '4.2%',
                      },
                    ],
                    thumb_url: 'http://peter-tanner.com/moneypuck/logos/NSH.png',
                    title: 'Nashville Predators',
                  },
                ],
              },
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
      .get('/v1/standings/now')
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
            ['hubot', "```.-------------------------------------------------------.\n|                   Division Leaders                    |\n|-------------------------------------------------------|\n|         Team         | GP | W  | L | OT | PTS |  L10  |\n|----------------------|----|----|---|----|-----|-------|\n| Vegas Golden Knights | 13 | 11 | 1 |  1 |  23 | 8-1-1 |\n| Boston Bruins        | 12 | 10 | 1 |  1 |  21 | 8-1-1 |\n| New York Rangers     | 12 |  9 | 2 |  1 |  19 | 8-1-1 |\n| Dallas Stars         | 11 |  7 | 3 |  1 |  15 | 6-3-1 |\n'-------------------------------------------------------'```"],
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
      .get('/v1/standings/now')
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
            ['hubot', "```.-----------------------------------------------------.\n|                  Central Standings                  |\n|-----------------------------------------------------|\n|        Team         | GP | W | L | OT | PTS |  L10  |\n|---------------------|----|---|---|----|-----|-------|\n| Dallas Stars        | 11 | 7 | 3 |  1 |  15 | 6-3-1 |\n| Colorado Avalanche  | 10 | 7 | 3 |  0 |  14 | 7-3-0 |\n| Winnipeg Jets       | 12 | 6 | 4 |  2 |  14 | 5-3-2 |\n| Minnesota Wild      | 12 | 5 | 5 |  2 |  12 | 4-4-2 |\n| Arizona Coyotes     | 11 | 5 | 5 |  1 |  11 | 4-5-1 |\n| St. Louis Blues     | 11 | 5 | 5 |  1 |  11 | 5-5-0 |\n| Nashville Predators | 11 | 5 | 6 |  0 |  10 | 5-5-0 |\n| Chicago Blackhawks  | 11 | 4 | 7 |  0 |   8 | 3-7-0 |\n'-----------------------------------------------------'```"],
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
