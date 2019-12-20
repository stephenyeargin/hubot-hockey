Helper = require('hubot-test-helper')
chai = require 'chai'
nock = require 'nock'

expect = chai.expect

helper = new Helper [
  '../src/hockey.coffee'
]

# Alter time as test runs
originalDateNow = Date.now

describe 'hubot-hockey', ->
  beforeEach ->
    process.env.HUBOT_LOG_LEVEL='error'
    process.env.HUBOT_TWITTER_CONSUMER_KEY='foobarbaz'
    process.env.HUBOT_TWITTER_CONSUMER_SECRET='foobarbaz'
    process.env.HUBOT_TWITTER_ACCESS_TOKEN='foobarbaz'
    process.env.HUBOT_TWITTER_ACCESS_TOKEN_SECRET='foobarbaz'
    nock.disableNetConnect()
    @room = helper.createRoom()

  afterEach ->
    delete process.env.HUBOT_LOG_LEVEL
    delete process.env.HUBOT_TWITTER_CONSUMER_KEY
    delete process.env.HUBOT_TWITTER_CONSUMER_SECRET
    delete process.env.HUBOT_TWITTER_ACCESS_TOKEN
    delete process.env.HUBOT_TWITTER_ACCESS_TOKEN_SECRET
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
        endDate: '2019-10-17',
        hydrate: 'linescore,broadcasts(all)'
      })
      .delay({
        head: 100,
        body: 200,
      })
      .replyWithFile(200, __dirname + '/fixtures/nhl-statsapi-team-18-final.json')

    nock('http://moneypuck.com')
      .get('/moneypuck/simulations/simulations_recent.csv')
      .replyWithFile(200, __dirname + '/fixtures/moneypuck-simulations_recent.csv')

    selfRoom = @room
    selfRoom.user.say('alice', '@hubot preds')
    setTimeout(() ->
      try
        expect(selfRoom.messages).to.eql [
          ['alice', '@hubot preds']
          ['hubot', '10/10/2019 - Bridgestone Arena']
          ['hubot', "  Washington Capitals (2-1-2)   5  \n  Nashville Predators (3-1-0)   6  "]
          ['hubot', 'Final - https://www.nhl.com/gamecenter/2019020052']
          ['hubot', 'Odds to Make Playoffs: 67.5% / Win Stanley Cup: 4.2%']
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
        endDate: '2019-12-26',
        hydrate: 'linescore,broadcasts(all)'
      })
      .delay({
        head: 100,
        body: 200,
      })
      .replyWithFile(200, __dirname + '/fixtures/nhl-statsapi-team-18-final-ot.json')

    nock('http://moneypuck.com')
      .get('/moneypuck/simulations/simulations_recent.csv')
      .replyWithFile(200, __dirname + '/fixtures/moneypuck-simulations_recent.csv')

    selfRoom = @room
    selfRoom.user.say('alice', '@hubot preds')
    setTimeout(() ->
      try
        expect(selfRoom.messages).to.eql [
          ['alice', '@hubot preds']
          ['hubot', '12/19/2019 - Canadian Tire Centre']
          ['hubot', "  Nashville Predators (16-12-6)   4  \n  Ottawa Senators (15-18-3)       5  "]
          ['hubot', 'Final/OT - https://www.nhl.com/gamecenter/2019020542']
          ['hubot', 'Odds to Make Playoffs: 67.5% / Win Stanley Cup: 4.2%']
        ]
        done()
      catch err
        done err
      return
    , 1000)

  it 'responds with an in-progress game and playoff odds', (done) ->
    Date.now = () ->
      Date.parse('Sat Oct 12 17:40:00 CDT 2019')
    nock('https://statsapi.web.nhl.com')
      .get('/api/v1/schedule')
      .query({
        teamId: 18,
        startDate: '2019-10-12',
        endDate: '2019-10-19',
        hydrate: 'linescore,broadcasts(all)'
      })
      .delay({
        head: 100,
        body: 200,
      })
      .replyWithFile(200, __dirname + '/fixtures/nhl-statsapi-team-18-in-progress.json')

    nock('http://moneypuck.com')
      .get('/moneypuck/simulations/simulations_recent.csv')
      .replyWithFile(200, __dirname + '/fixtures/moneypuck-simulations_recent.csv')

    selfRoom = @room
    selfRoom.user.say('alice', '@hubot preds')
    setTimeout(() ->
      try
        expect(selfRoom.messages).to.eql [
          ['alice', '@hubot preds']
          ['hubot', '10/12/2019 - STAPLES Center']
          ['hubot', "  Nashville Predators (3-1-0)   1  \n  Los Angeles Kings (1-2-0)     2  "]
          ['hubot', '04:23 1st - https://www.nhl.com/gamecenter/2019020063']
          ['hubot', 'Odds to Make Playoffs: 67.5% / Win Stanley Cup: 4.2%']
        ]
        done()
      catch err
        done err
      return
    , 1000)

  it 'responds with a future game and playoff odds', (done) ->
    Date.now = () ->
      Date.parse('Tue Oct 15 17:40:00 CDT 2019')
    nock('https://statsapi.web.nhl.com')
      .get('/api/v1/schedule')
      .query({
        teamId: 18,
        startDate: '2019-10-15',
        endDate: '2019-10-22',
        hydrate: 'linescore,broadcasts(all)'
      })
      .delay({
        head: 100,
        body: 200,
      })
      .replyWithFile(200, __dirname + '/fixtures/nhl-statsapi-team-18-future.json')

    nock('http://moneypuck.com')
      .get('/moneypuck/simulations/simulations_recent.csv')
      .replyWithFile(200, __dirname + '/fixtures/moneypuck-simulations_recent.csv')

    selfRoom = @room
    selfRoom.user.say('alice', '@hubot preds')
    setTimeout(() ->
      try
        expect(selfRoom.messages).to.eql [
          ['alice', '@hubot preds']
          ['hubot', '10/15/2019 - T-Mobile Arena']
          ['hubot', "  Nashville Predators (3-2-0)    0  \n  Vegas Golden Knights (4-2-0)   0  "]
          ['hubot', '7:00 pm PDT - https://www.nhl.com/gamecenter/2019020090']
          ['hubot', 'Odds to Make Playoffs: 67.5% / Win Stanley Cup: 4.2%']
        ]
        done()
      catch err
        done err
      return
    , 1000)

  it 'responds with a team\'s latest tweet', (done) ->
    nock('https://api.twitter.com')
      .get('/1.1/statuses/user_timeline.json?screen_name=predsnhl')
      .replyWithFile(200, __dirname + '/fixtures/twitter-predsnhl.json')

    selfRoom = @room
    selfRoom.user.say('alice', '@hubot preds twitter')
    setTimeout(() ->
      try
        expect(selfRoom.messages).to.eql [
          ['alice', '@hubot preds twitter']
          ['hubot', '<twitterapi> RT @TwitterDev: 1/ Today we’re sharing our vision for the future of the Twitter API platform!nhttps://t.co/XweGngmxlP - Thu Apr 06 15:28:43 +0000 2017']
        ]
        done()
      catch err
        done err
      return
    , 1000)
