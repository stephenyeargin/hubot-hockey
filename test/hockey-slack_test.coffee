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
mockDateNow = () ->
  return Date.parse('2019-10-10 12:00')

describe 'hubot-hockey for slack', ->
  beforeEach ->
    process.env.HUBOT_LOG_LEVEL='error'
    process.env.HUBOT_TWITTER_CONSUMER_KEY='foobarbaz'
    process.env.HUBOT_TWITTER_CONSUMER_SECRET='foobarbaz'
    process.env.HUBOT_TWITTER_ACCESS_TOKEN='foobarbaz'
    process.env.HUBOT_TWITTER_ACCESS_TOKEN_SECRET='foobarbaz'
    Date.now = mockDateNow
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

  it 'responds with a team\'s latest playoff odds', (done) ->
    nock('https://statsapi.web.nhl.com')
      .get('/api/v1/schedule')
      .query({
        teamId: 18,
        startDate: '2019-10-10',
        endDate: '2019-10-17'
      })
      .replyWithFile(200, __dirname + '/fixtures/nhl-statsapi-team-18.json')

    nock('http://moneypuck.com')
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
                  "fallback": "10/10/2019 - Washington Capitals 5, Nashville Predators 6",
                  "title_link": "https://nhl.com/gamecenter/2019020052",
                  "author_name": "NHL.com",
                  "author_link": "https://nhl.com",
                  "author_icon": "https://github.com/nhl.png",
                  "title": "10/10/2019 - Final",
                  "text": "*Washington Capitals* (2-1-2) - *5*\n*Nashville Predators* (3-1-0) - *6*",
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
                  "author_link": "http://moneypuck.com.com",
                  "author_icon": "http://peter-tanner.com/moneypuck/logos/moneypucklogo.png",
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
