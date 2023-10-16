Helper = require('hubot-test-helper')
chai = require 'chai'
nock = require 'nock'

expect = chai.expect

helper = new Helper [
  'adapters/discord.coffee'
  '../src/hockey.coffee'
]

# Alter time as test runs
originalDateNow = Date.now

describe 'hubot-hockey for discord', ->
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
          ['hubot', "10/10/2019 - Bridgestone Arena```  Washington Capitals (2-1-2)   5  \n  Nashville Predators (3-1-0)   6  ```Final - https://www.nhl.com/gamecenter/2019020052"]
          ['hubot', "__**MoneyPuck.com**__\n**Make Playoffs:** 67.5%\n**Win Stanley Cup:** 4.2%"]
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
          ['hubot', "```.-------------------------------------------------------.\n|                   Central Standings                   |\n|-------------------------------------------------------|\n|        Team         | GP | W  | L  | OT | PTS |  L10  |\n|---------------------|----|----|----|----|-----|-------|\n| Colorado Avalanche  | 82 | 51 | 24 |  7 | 109 | 8-1-1 |\n| Dallas Stars        | 82 | 47 | 21 | 14 | 108 | 8-2-0 |\n| Minnesota Wild      | 82 | 46 | 25 | 11 | 103 | 5-3-2 |\n| Winnipeg Jets       | 82 | 46 | 33 |  3 |  95 | 6-4-0 |\n| Nashville Predators | 82 | 42 | 32 |  8 |  92 | 6-4-0 |\n| St. Louis Blues     | 82 | 37 | 38 |  7 |  81 | 4-5-1 |\n| Arizona Coyotes     | 82 | 28 | 40 | 14 |  70 | 1-7-2 |\n| Chicago Blackhawks  | 82 | 26 | 49 |  7 |  59 | 2-7-1 |\n'-------------------------------------------------------'```"]
        ]
        done()
      catch err
        done err
      return
    , 1000)
