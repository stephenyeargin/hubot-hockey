Helper = require('hubot-test-helper')
chai = require 'chai'
nock = require 'nock'

expect = chai.expect

helper = new Helper [
  'adapters/slack.coffee'
  '../src/hockey.coffee'
]

# Alter time as test runs
originalDateNow = Date.now

describe 'hubot-hockey for slack', ->
  beforeEach ->
    process.env.HUBOT_LOG_LEVEL='error'
    nock.disableNetConnect()
    @room = helper.createRoom()

  afterEach ->
    delete process.env.HUBOT_LOG_LEVEL
    Date.now = originalDateNow
    nock.cleanAll()
    @room.destroy()

  it 'responds with a completed game and playoff odds', (done) ->
    Date.now = () ->
      return Date.parse('Thu Oct 10 23:59:00 CDT 2019')

    nock('https://statsapi.web.nhl.com')
      .get('/api/v1/schedule')
      .query({
        teamId: 18,
        startDate: '2019-10-10',
        endDate: '2020-01-08',
        hydrate: 'linescore,broadcasts(all),game(seriesSummary)'
      })
      .delay({
        head: 100,
        body: 200,
      })
      .replyWithFile(200, __dirname + '/fixtures/nhl-statsapi-team-18-final.json')

    nock('https://moneypuck.com')
      .get('/moneypuck/simulations/simulations_recent.csv')
      .replyWithFile(200, __dirname + '/fixtures/moneypuck-simulations_recent.csv')

    selfRoom = @room
    selfRoom.user.say('alice', '@hubot preds')
    setTimeout(() ->
      try
        expect(selfRoom.messages).to.eql [
          ['alice', '@hubot preds']
          [
            'hubot',
            {
              "attachments": [
                {
                  "fallback": "10/10/2019 - Washington Capitals 5, Nashville Predators 6 (Final)",
                  "title_link": "https://www.nhl.com/gamecenter/2019020052",
                  "author_name": "NHL.com",
                  "author_link": "https://nhl.com",
                  "author_icon": "https://github.com/nhl.png",
                  "color": "#FFB81C",
                  "title": "10/10/2019 - Final",
                  "text": "```\n  Washington Capitals (2-1-2)   5  \n  Nashville Predators (3-1-0)   6  \n```",
                  "footer": "Bridgestone Arena",
                  "mrkdwn_in": ["text", "pretext"]
                }
              ]
            }
          ]
          [
            'hubot',
            {
              "attachments": [
                {
                  "fallback": "Odds to Make Playoffs: 67.5% / Win Stanley Cup: 4.2%",
                  "author_name": "MoneyPuck.com",
                  "author_link": "https://moneypuck.com",
                  "author_icon": "http://peter-tanner.com/moneypuck/logos/moneypucklogo.png",
                  "color": "#FFB81C",
                  "title": "Nashville Predators",
                  "thumb_url": "http://peter-tanner.com/moneypuck/logos/NSH.png",
                  "fields": [
                    {
                      "title": "Make Playoffs",
                      "value": "67.5%",
                      "short": false
                    },
                    {
                      "title": "Win Stanley Cup",
                      "value": "4.2%",
                      "short": false
                    }
                  ]
                }
              ]
            }
          ]
        ]
        done()
      catch err
        done err
      return
    , 1000)

  it 'responds with a completed game that went to overtime and playoff odds', (done) ->
    Date.now = () ->
      return Date.parse('Thu Dec 19 09:42:00 CST 2019')

    nock('https://statsapi.web.nhl.com')
      .get('/api/v1/schedule')
      .query({
        teamId: 18,
        startDate: '2019-12-19',
        endDate: '2020-03-18',
        hydrate: 'linescore,broadcasts(all),game(seriesSummary)'
      })
      .delay({
        head: 100,
        body: 200,
      })
      .replyWithFile(200, __dirname + '/fixtures/nhl-statsapi-team-18-final-ot.json')

    nock('https://moneypuck.com')
      .get('/moneypuck/simulations/simulations_recent.csv')
      .replyWithFile(200, __dirname + '/fixtures/moneypuck-simulations_recent.csv')

    selfRoom = @room
    selfRoom.user.say('alice', '@hubot preds')
    setTimeout(() ->
      try
        expect(selfRoom.messages).to.eql [
          ['alice', '@hubot preds']
          [
            'hubot',
            {
              "attachments": [
                {
                  "fallback": "12/19/2019 - Nashville Predators 4, Ottawa Senators 5 (Final/OT)",
                  "title_link": "https://www.nhl.com/gamecenter/2019020542",
                  "author_name": "NHL.com",
                  "author_link": "https://nhl.com",
                  "author_icon": "https://github.com/nhl.png",
                  "color": "#FFB81C",
                  "title": "12/19/2019 - Final/OT",
                  "text": "```\n  Nashville Predators (16-12-6)   4  \n  Ottawa Senators (15-18-3)       5  \n```",
                  "footer": "Canadian Tire Centre",
                  "mrkdwn_in": ["text", "pretext"]
                }
              ]
            }
          ]
          [
            'hubot',
            {
              "attachments": [
                {
                  "fallback": "Odds to Make Playoffs: 67.5% / Win Stanley Cup: 4.2%",
                  "author_name": "MoneyPuck.com",
                  "author_link": "https://moneypuck.com",
                  "author_icon": "http://peter-tanner.com/moneypuck/logos/moneypucklogo.png",
                  "color": "#FFB81C",
                  "title": "Nashville Predators",
                  "thumb_url": "http://peter-tanner.com/moneypuck/logos/NSH.png",
                  "fields": [
                    {
                      "title": "Make Playoffs",
                      "value": "67.5%",
                      "short": false
                    },
                    {
                      "title": "Win Stanley Cup",
                      "value": "4.2%",
                      "short": false
                    }
                  ]
                }
              ]
            }
          ]
        ]
        done()
      catch err
        done err
      return
    , 1000)

  it 'responds with a completed game that went to multiple overtimes and playoff odds', (done) ->
    Date.now = () ->
      return Date.parse('Tue Aug 11 21:42:00 CDT 2020')

    nock('https://statsapi.web.nhl.com')
      .get('/api/v1/schedule')
      .query({
        teamId: 14,
        startDate: '2020-08-11',
        endDate: '2020-11-09',
        hydrate: 'linescore,broadcasts(all),game(seriesSummary)'
      })
      .delay({
        head: 100,
        body: 200,
      })
      .replyWithFile(200, __dirname + '/fixtures/nhl-statsapi-team-14-final-5ot.json')

    nock('https://moneypuck.com')
      .get('/moneypuck/simulations/simulations_recent.csv')
      .replyWithFile(200, __dirname + '/fixtures/moneypuck-simulations_recent.csv')

    selfRoom = @room
    selfRoom.user.say('alice', '@hubot bolts')
    setTimeout(() ->
      try
        expect(selfRoom.messages).to.eql [
          ['alice', '@hubot bolts']
          [
            'hubot',
            {
              "attachments": [
                {
                  "fallback": "8/11/2020 - Columbus Blue Jackets 2, Tampa Bay Lightning 3 (Final/5OT - Lighting lead 1-0)",
                  "title_link": "https://www.nhl.com/gamecenter/2019030121",
                  "author_name": "NHL.com",
                  "author_link": "https://nhl.com",
                  "author_icon": "https://github.com/nhl.png",
                  "color": "#002868",
                  "title": "8/11/2020 - Final/5OT - Lighting lead 1-0",
                  "text": "```\n  Columbus Blue Jackets (3-3-0)   2  \n  Tampa Bay Lightning (3-1-0)     3  \n```",
                  "footer": "Scotiabank Arena",
                  "mrkdwn_in": ["text", "pretext"]
                }
              ]
            }
          ]
          [
            'hubot',
            {
              "attachments": [
                {
                  "fallback": "Odds to Make Playoffs: 74.3% / Win Stanley Cup: 5.4%",
                  "author_name": "MoneyPuck.com",
                  "author_link": "https://moneypuck.com",
                  "author_icon": "http://peter-tanner.com/moneypuck/logos/moneypucklogo.png",
                  "color": "#002868",
                  "title": "Tampa Bay Lightning",
                  "thumb_url": "http://peter-tanner.com/moneypuck/logos/TBL.png",
                  "fields": [
                    {
                      "title": "Make Playoffs",
                      "value": "74.3%",
                      "short": false
                    },
                    {
                      "title": "Win Stanley Cup",
                      "value": "5.4%",
                      "short": false
                    }
                  ]
                }
              ]
            }
          ]
        ]
        done()
      catch err
        done err
      return
    , 1000)

  it 'responds with an in-progress game and playoff odds', (done) ->
    Date.now = () ->
      Date.parse('Tue Oct 15 17:40:00 CDT 2019')

    nock('https://statsapi.web.nhl.com')
      .get('/api/v1/schedule')
      .query({
        teamId: 18,
        startDate: '2019-10-15',
        endDate: '2020-01-13',
        hydrate: 'linescore,broadcasts(all),game(seriesSummary)'
      })
      .delay({
        head: 100,
        body: 200,
      })
      .replyWithFile(200, __dirname + '/fixtures/nhl-statsapi-team-18-future.json')

    nock('https://moneypuck.com')
      .get('/moneypuck/simulations/simulations_recent.csv')
      .replyWithFile(200, __dirname + '/fixtures/moneypuck-simulations_recent.csv')

    selfRoom = @room
    selfRoom.user.say('alice', '@hubot preds')
    setTimeout(() ->
      try
        expect(selfRoom.messages).to.eql [
          ['alice', '@hubot preds']
          [
            'hubot',
            {
              "attachments": [
                {
                  "fallback": "10/15/2019 - Nashville Predators 0, Vegas Golden Knights 0 (9:00 pm CDT)",
                  "title_link": "https://www.nhl.com/gamecenter/2019020090",
                  "author_name": "NHL.com",
                  "author_link": "https://nhl.com",
                  "author_icon": "https://github.com/nhl.png",
                  "color": "#FFB81C",
                  "title": "10/15/2019 - 9:00 pm CDT",
                  "text": "```\n  Nashville Predators (3-2-0)    0  \n  Vegas Golden Knights (4-2-0)   0  \n```",
                  "footer": "T-Mobile Arena; TV: ESPN+ (national) | ATTSN-RM (home) | FS-TN (away)",
                  "mrkdwn_in": ["text", "pretext"]
                }
              ]
            }
          ]
          [
            'hubot',
            {
              "attachments": [
                {
                  "fallback": "Odds to Make Playoffs: 67.5% / Win Stanley Cup: 4.2%",
                  "author_name": "MoneyPuck.com",
                  "author_link": "https://moneypuck.com",
                  "author_icon": "http://peter-tanner.com/moneypuck/logos/moneypucklogo.png",
                  "color": "#FFB81C",
                  "title": "Nashville Predators",
                  "thumb_url": "http://peter-tanner.com/moneypuck/logos/NSH.png",
                  "fields": [
                    {
                      "title": "Make Playoffs",
                      "value": "67.5%",
                      "short": false
                    },
                    {
                      "title": "Win Stanley Cup",
                      "value": "4.2%",
                      "short": false
                    }
                  ]
                }
              ]
            }
          ]
        ]
        done()
      catch err
        done err
      return
    , 1000)

  it 'responds with a future game and playoff odds', (done) ->
    Date.now = () ->
      Date.parse('Sat Oct 12 17:40:00 CDT 2019')

    nock('https://statsapi.web.nhl.com')
      .get('/api/v1/schedule')
      .query({
        teamId: 18,
        startDate: '2019-10-12',
        endDate: '2020-01-10',
        hydrate: 'linescore,broadcasts(all),game(seriesSummary)'
      })
      .delay({
        head: 100,
        body: 200,
      })
      .replyWithFile(200, __dirname + '/fixtures/nhl-statsapi-team-18-in-progress.json')

    nock('https://moneypuck.com')
      .get('/moneypuck/simulations/simulations_recent.csv')
      .replyWithFile(200, __dirname + '/fixtures/moneypuck-simulations_recent.csv')

    selfRoom = @room
    selfRoom.user.say('alice', '@hubot preds')
    setTimeout(() ->
      try
        expect(selfRoom.messages).to.eql [
          ['alice', '@hubot preds']
          [
            'hubot',
            {
              "attachments": [
                {
                  "fallback": "10/12/2019 - Nashville Predators 1, Los Angeles Kings 2 (04:23 1st)",
                  "title_link": "https://www.nhl.com/gamecenter/2019020063",
                  "author_name": "NHL.com",
                  "author_link": "https://nhl.com",
                  "author_icon": "https://github.com/nhl.png",
                  "color": "#FFB81C",
                  "title": "10/12/2019 - 04:23 1st",
                  "text": "```\n  Nashville Predators (3-1-0)   1  \n  Los Angeles Kings (1-2-0)     2  \n```",
                  "footer": "STAPLES Center; TV: FS-W (home) | FS-TN (away)",
                  "mrkdwn_in": ["text", "pretext"]
                }
              ]
            }
          ]
          [
            'hubot',
            {
              "attachments": [
                {
                  "fallback": "Odds to Make Playoffs: 67.5% / Win Stanley Cup: 4.2%",
                  "author_name": "MoneyPuck.com",
                  "author_link": "https://moneypuck.com",
                  "author_icon": "http://peter-tanner.com/moneypuck/logos/moneypucklogo.png",
                  "color": "#FFB81C",
                  "title": "Nashville Predators",
                  "thumb_url": "http://peter-tanner.com/moneypuck/logos/NSH.png",
                  "fields": [
                    {
                      "title": "Make Playoffs",
                      "value": "67.5%",
                      "short": false
                    },
                    {
                      "title": "Win Stanley Cup",
                      "value": "4.2%",
                      "short": false
                    }
                  ]
                }
              ]
            }
          ]
        ]
        done()
      catch err
        done err
      return
    , 1000)

  it 'responds with a scheduled preseason game and odds', (done) ->
    Date.now = () ->
      Date.parse('Wed Jul 22 17:40:00 CDT 2020')

    nock('https://statsapi.web.nhl.com')
      .get('/api/v1/schedule')
      .query({
        teamId: 18,
        startDate: '2020-07-22',
        endDate: '2020-10-20',
        hydrate: 'linescore,broadcasts(all),game(seriesSummary)'
      })
      .delay({
        head: 100,
        body: 200,
      })
      .replyWithFile(200, __dirname + '/fixtures/nhl-statsapi-team-18-playoff.json')

    nock('https://moneypuck.com')
      .get('/moneypuck/simulations/simulations_recent.csv')
      .replyWithFile(200, __dirname + '/fixtures/moneypuck-simulations_recent-playoffs.csv')

    selfRoom = @room
    selfRoom.user.say('alice', '@hubot preds')
    setTimeout(() ->
      try
        expect(selfRoom.messages).to.eql [
          ['alice', '@hubot preds']
          [
            'hubot',
            {
              "attachments": [
                {
                  "fallback": "7/30/2020 - Nashville Predators 0, Dallas Stars 0 (3:00 pm CDT - Preseason)",
                  "title_link": "https://www.nhl.com/gamecenter/2019011010",
                  "author_name": "NHL.com",
                  "author_link": "https://nhl.com",
                  "author_icon": "https://github.com/nhl.png",
                  "color": "#FFB81C",
                  "title": "7/30/2020 - 3:00 pm CDT - Preseason",
                  "text": "```\n  Nashville Predators (0-0)   0  \n  Dallas Stars (0-0)          0  \n```",
                  "footer": "Rogers Place; TV: NHLN (national) | FS-SW (home) | FS-TN (away)",
                  "mrkdwn_in": ["text", "pretext"]
                }
              ]
            }
          ]
          [
            'hubot',
            {
              "attachments": [
                {
                  "fallback": "Odds to Win Stanley Cup: 1.6%",
                  "author_name": "MoneyPuck.com",
                  "author_link": "https://moneypuck.com",
                  "author_icon": "http://peter-tanner.com/moneypuck/logos/moneypucklogo.png",
                  "color": "#FFB81C",
                  "title": "Nashville Predators",
                  "thumb_url": "http://peter-tanner.com/moneypuck/logos/NSH.png",
                  "fields": [
                    {
                      "title": "Win Stanley Cup",
                      "value": "1.6%",
                      "short": false
                    }
                  ]
                }
              ]
            }
          ]
        ]
        done()
      catch err
        done err
      return
    , 1000)


  it 'responds with division leader standings', (done) ->
    Date.now = () ->
      Date.parse('Wed Feb 1 12:10:00 CDT 2023')
    nock('https://statsapi.web.nhl.com')
      .get('/api/v1/standings')
      .query({
        date: '2023-02-01',
        expand: 'standings.record'
      })
      .delay({
        head: 100,
        body: 200,
      })
      .replyWithFile(200, __dirname + '/fixtures/nhl-statsapi-standings.json')

    selfRoom = @room
    selfRoom.user.say('alice', '@hubot nhl')
    setTimeout(() ->
      try
        expect(selfRoom.messages).to.eql [
          ['alice', '@hubot nhl']
          ['hubot', "```.--------------------------------------------------------.\n|                    Division Leaders                    |\n|--------------------------------------------------------|\n|         Team         | GP | W  | L  | OT | PTS |  L10  |\n|----------------------|----|----|----|----|-----|-------|\n| Carolina Hurricanes  | 82 | 52 | 21 |  9 | 113 | 5-5-0 |\n| Boston Bruins        | 82 | 65 | 12 |  5 | 135 | 9-1-0 |\n| Colorado Avalanche   | 82 | 51 | 24 |  7 | 109 | 8-1-1 |\n| Vegas Golden Knights | 82 | 51 | 22 |  9 | 111 | 6-1-3 |\n'--------------------------------------------------------'```"]
        ]
        done()
      catch err
        done err
      return
    , 1000)

  it 'responds with division standings', (done) ->
    Date.now = () ->
      Date.parse('Wed Feb 1 12:10:00 CDT 2023')
    nock('https://statsapi.web.nhl.com')
      .get('/api/v1/standings')
      .query({
        date: '2023-02-01',
        expand: 'standings.record'
      })
      .delay({
        head: 100,
        body: 200,
      })
      .replyWithFile(200, __dirname + '/fixtures/nhl-statsapi-standings.json')

    selfRoom = @room
    selfRoom.user.say('alice', '@hubot nhl central')
    setTimeout(() ->
      try
        expect(selfRoom.messages).to.eql [
          ['alice', '@hubot nhl central']
          ['hubot', "```.-------------------------------------------------------.\n|                      C Standings                      |\n|-------------------------------------------------------|\n|        Team         | GP | W  | L  | OT | PTS |  L10  |\n|---------------------|----|----|----|----|-----|-------|\n| Colorado Avalanche  | 82 | 51 | 24 |  7 | 109 | 8-1-1 |\n| Dallas Stars        | 82 | 47 | 21 | 14 | 108 | 8-2-0 |\n| Minnesota Wild      | 82 | 46 | 25 | 11 | 103 | 5-3-2 |\n| Winnipeg Jets       | 82 | 46 | 33 |  3 |  95 | 6-4-0 |\n| Nashville Predators | 82 | 42 | 32 |  8 |  92 | 6-4-0 |\n| St. Louis Blues     | 82 | 37 | 38 |  7 |  81 | 4-5-1 |\n| Arizona Coyotes     | 82 | 28 | 40 | 14 |  70 | 1-7-2 |\n| Chicago Blackhawks  | 82 | 26 | 49 |  7 |  59 | 2-7-1 |\n'-------------------------------------------------------'```"]
        ]
        done()
      catch err
        done err
      return
    , 1000)
