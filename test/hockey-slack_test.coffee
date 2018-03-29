Helper = require('hubot-test-helper')
chai = require 'chai'
nock = require 'nock'

expect = chai.expect

helper = new Helper [
  'adapters/slack.coffee'
  '../src/hockey.coffee'
]

describe 'hubot-hockey for slack', ->
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
          [
            'hubot',
            {
              "attachments": [
                {
                  "fallback": "Nashville Predators: Did not play, average seed down 0.02 to 1.2; 107 points   48 16-11",
                  "author_name": "SportsClubStats.com",
                  "author_link": "http://sportsclubstats.com",
                  "author_icon": "https://s3.amazonaws.com/uploads.uservoice.com/logo/design_setting/59485/original/SportsClubStatsSmall_4162_0.jpg",
                  "title": "Nashville Predators",
                  "title_link": "http://www.sportsclubstats.com/NHL/Western/Central/Nashville.html",
                  "thumb_url": "http://www.sportsclubstats.com/img/129.gif",
                  "fields": [
                    {
                      "title": "Last Game",
                      "value": "Did not play, average seed down 0.02 to 1.2",
                      "short": false
                    },
                    {
                      "title": "Standings",
                      "value": "107 points   48 16-11",
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
          [
            'hubot',
            {
              "text": "<https://twitter.com/twitterapi/status/850007368138018817>",
              "unfurl_links": true
            }
          ]
        ]
        done()
      catch err
        done err
      return
    , 1000)
