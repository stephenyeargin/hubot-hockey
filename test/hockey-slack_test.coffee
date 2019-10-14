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

  it 'responds with a game in progress and playoff odds', (done) ->
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
                  "title": "10/12/2019 - 04:23 1st",
                  "text": "```\n  Nashville Predators (3-1-0)   1  \n  Los Angeles Kings (1-2-0)     2  \n```",
                  "footer": "STAPLES Center",
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
