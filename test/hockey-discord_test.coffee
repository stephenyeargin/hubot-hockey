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

