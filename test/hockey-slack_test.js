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
      .replyWithFile(200, `${__dirname}/fixtures/api-web-nhle-schedule-in-progress.json`);

    nock('https://moneypuck.com')
      .get('/moneypuck/simulations/update_date.txt')
      .reply(200, '2023-11-07 06:52:52.999000-04:00');

    nock('https://moneypuck.com')
      .get('/moneypuck/simulations/simulations_recent.csv')
      .replyWithFile(200, `${__dirname}/fixtures/moneypuck-simulations_recent.csv`);

    nock('https://www.sportsclubstats.com')
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
                    text:
                    '```\n'
                     + '  Nashville Predators   2  \n'
                     + '  Calgary Flames        3  \n'
                     + '```',
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
                    author_icon: 'https://github.com/stephenyeargin/hubot-hockey/assets/80459/251b9816-8e05-4e34-b87b-10d0295823ab',
                    author_link: 'https://sportsclubstats.com',
                    author_name: 'Sports Club Stats',
                    color: '#FFB81C',
                    fallback: 'Sports Club Stats: 77.7% to Make Playoffs',
                    fields: [
                      {
                        sort: true,
                        title: 'Make Playoffs',
                        value: '77.7%',
                      },
                    ],
                    thumb_url: 'https://github.com/stephenyeargin/hubot-hockey/assets/80459/251b9816-8e05-4e34-b87b-10d0295823ab',
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
                    fallback: 'MoneyPuck: 67.5% to Make Playoffs / 4.2% to Win Stanley Cup',
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

    nock('https://www.sportsclubstats.com')
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
            ['hubot', {
              attachments: [
                {
                  author_icon: 'https://github.com/nhl.png',
                  author_link: 'https://nhl.com',
                  author_name: 'NHL.com',
                  color: '#FFB81C',
                  fallback: '12/16/2023 - Washington Capitals 0, Nashville Predators 1 (07:21 1st Intermission)',
                  footer: 'Bridgestone Arena; TV: NHLN (N) | BSSO (H) | MNMT (A)',
                  mrkdwn_in: [
                    'text',
                    'pretext',
                  ],
                  text:
                    '```\n'
                    + '  Washington Capitals   0  \n'
                    + '  Nashville Predators   1  \n'
                    + '```',
                  title: '12/16/2023 - 07:21 1st Intermission',
                  title_link: 'https://www.nhl.com/gamecenter/2023020468',
                },
              ],
            }],
            [
              'hubot',
              {
                attachments: [
                  {
                    author_icon: 'https://github.com/stephenyeargin/hubot-hockey/assets/80459/251b9816-8e05-4e34-b87b-10d0295823ab',
                    author_link: 'https://sportsclubstats.com',
                    author_name: 'Sports Club Stats',
                    color: '#FFB81C',
                    fallback: 'Sports Club Stats: 77.7% to Make Playoffs',
                    fields: [
                      {
                        sort: true,
                        title: 'Make Playoffs',
                        value: '77.7%',
                      },
                    ],
                    thumb_url: 'https://github.com/stephenyeargin/hubot-hockey/assets/80459/251b9816-8e05-4e34-b87b-10d0295823ab',
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
                    fallback: 'MoneyPuck: 67.5% to Make Playoffs / 4.2% to Win Stanley Cup',
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
      .replyWithFile(200, `${__dirname}/fixtures/api-web-nhle-schedule-future.json`);

    nock('https://moneypuck.com')
      .get('/moneypuck/simulations/update_date.txt')
      .reply(200, '2023-11-07 06:52:52.999000-04:00');

    nock('https://moneypuck.com')
      .get('/moneypuck/simulations/simulations_recent.csv')
      .replyWithFile(200, `${__dirname}/fixtures/moneypuck-simulations_recent.csv`);

    nock('https://www.sportsclubstats.com')
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
            [
              'hubot',
              {
                attachments: [
                  {
                    author_icon: 'https://github.com/nhl.png',
                    author_link: 'https://nhl.com',
                    author_name: 'NHL.com',
                    color: '#FFB81C',
                    fallback: '11/9/2023 - Nashville Predators (5-7-0), Winnipeg Jets (6-4-2) (7:00 pm CST)',
                    footer: 'Canada Life Centre; TV: BSSO (A) | TSN3 (H)',
                    mrkdwn_in: [
                      'text',
                      'pretext',
                    ],
                    text:
                      '```\n'
                       + '  Nashville Predators (5-7-0)  \n'
                       + '  Winnipeg Jets (6-4-2)        \n'
                       + '```',
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
                    author_icon: 'https://github.com/stephenyeargin/hubot-hockey/assets/80459/251b9816-8e05-4e34-b87b-10d0295823ab',
                    author_link: 'https://sportsclubstats.com',
                    author_name: 'Sports Club Stats',
                    color: '#FFB81C',
                    fallback: 'Sports Club Stats: 77.7% to Make Playoffs',
                    fields: [
                      {
                        sort: true,
                        title: 'Make Playoffs',
                        value: '77.7%',
                      },
                    ],
                    thumb_url: 'https://github.com/stephenyeargin/hubot-hockey/assets/80459/251b9816-8e05-4e34-b87b-10d0295823ab',
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
                    fallback: 'MoneyPuck: 67.5% to Make Playoffs / 4.2% to Win Stanley Cup',
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

    nock('https://www.sportsclubstats.com')
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
            [
              'hubot',
              {
                attachments: [
                  {
                    author_icon: 'https://github.com/nhl.png',
                    author_link: 'https://nhl.com',
                    author_name: 'NHL.com',
                    color: '#FFB81C',
                    fallback: '11/7/2023 - Nashville Predators 2, Calgary Flames 4 (Final)',
                    footer: 'Scotiabank Saddledome',
                    mrkdwn_in: [
                      'text',
                      'pretext',
                    ],
                    text:
                    '```\n'
                     + '  Nashville Predators   2  \n'
                     + '  Calgary Flames        4  \n'
                     + '```',
                    title: '11/7/2023 - Final',
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
                    author_icon: 'https://github.com/stephenyeargin/hubot-hockey/assets/80459/251b9816-8e05-4e34-b87b-10d0295823ab',
                    author_link: 'https://sportsclubstats.com',
                    author_name: 'Sports Club Stats',
                    color: '#FFB81C',
                    fallback: 'Sports Club Stats: 77.7% to Make Playoffs',
                    fields: [
                      {
                        sort: true,
                        title: 'Make Playoffs',
                        value: '77.7%',
                      },
                    ],
                    thumb_url: 'https://github.com/stephenyeargin/hubot-hockey/assets/80459/251b9816-8e05-4e34-b87b-10d0295823ab',
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
                    fallback: 'MoneyPuck: 67.5% to Make Playoffs / 4.2% to Win Stanley Cup',
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

    nock('https://www.sportsclubstats.com')
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
            [
              'hubot',
              {
                attachments: [
                  {
                    author_icon: 'https://github.com/nhl.png',
                    author_link: 'https://nhl.com',
                    author_name: 'NHL.com',
                    color: '#FFB81C',
                    fallback: '11/20/2023 - Colorado Avalanche (11-5-0), Nashville Predators (6-10-0) (7:00 pm CST)',
                    footer: 'Bridgestone Arena; TV: BSSO (H) | ALT (A)',
                    mrkdwn_in: [
                      'text',
                      'pretext',
                    ],
                    text:
                      '```\n'
                       + '  Colorado Avalanche (11-5-0)   \n'
                       + '  Nashville Predators (6-10-0)  \n'
                       + '```',
                    title: '11/20/2023 - 7:00 pm CST',
                    title_link: 'https://www.nhl.com/gamecenter/2023020275',
                  },
                ],
              },
            ],
            [
              'hubot',
              {
                attachments: [
                  {
                    author_icon: 'https://github.com/stephenyeargin/hubot-hockey/assets/80459/251b9816-8e05-4e34-b87b-10d0295823ab',
                    author_link: 'https://sportsclubstats.com',
                    author_name: 'Sports Club Stats',
                    color: '#FFB81C',
                    fallback: 'Sports Club Stats: 77.7% to Make Playoffs',
                    fields: [
                      {
                        sort: true,
                        title: 'Make Playoffs',
                        value: '77.7%',
                      },
                    ],
                    thumb_url: 'https://github.com/stephenyeargin/hubot-hockey/assets/80459/251b9816-8e05-4e34-b87b-10d0295823ab',
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
                    fallback: 'MoneyPuck: 67.5% to Make Playoffs / 4.2% to Win Stanley Cup',
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
