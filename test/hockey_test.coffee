Helper = require('hubot-test-helper')
chai = require 'chai'
nock = require 'nock'

expect = chai.expect

helper = new Helper [
  '../src/hockey.coffee'
]

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
    nock.cleanAll()
    @room.destroy()

  it 'responds with a team\'s latest playoff odds', (done) ->
    nock('http://www.sportsclubstats.com')
      .get('/NHL/Western/Central/Nashville.html')
      .replyWithFile(200, __dirname + '/fixtures/Nashville.html')

    selfRoom = @room
    selfRoom.user.say('alice', '@hubot preds')
    setTimeout(() ->
      try
        expect(selfRoom.messages).to.eql [
          ['alice', '@hubot preds']
          ['hubot', 'Last Game: Did not play, average seed down 0.02 to 1.2']
          ['hubot', 'Standings: 107 points   48 16-11']
        ]
        done()
      catch err
        done err
      return
    , 1000)

  it 'responds with a team\'s latest tweet', (done) ->
    nock('https://api.twitter.com')
      .get('/1.1/statuses/user_timeline.json?screen_name=predsnhl')
      .replyWithFile(200, __dirname + '/fixtures/predsnhl.json')

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
