chai = require 'chai'
sinon = require 'sinon'
chai.use require 'sinon-chai'

expect = chai.expect

describe 'hubot-hockey', ->
  beforeEach ->
    @robot =
      respond: sinon.spy()
      hear: sinon.spy()

    require('../src/hubot-hockey')(@robot)

  it 'registers a team listener', ->
    expect(@robot.respond).to.have.been.calledWith(/(nashville predators|nashville|predators|nas|preds)$/i)

  it 'registers a goal listener', ->
    expect(@robot.respond).to.have.been.calledWith(/(nashville predators|nashville|predators|nas|preds) goal[!+]?$/i)

  it 'registers a color listener', ->
    expect(@robot.respond).to.have.been.calledWith(/(nashville predators|nashville|predators|nas|preds) (lights|colors)$/i)

  it 'registers a twitter listener', ->
    expect(@robot.respond).to.have.been.calledWith(/(nashville predators|nashville|predators|nas|preds) (tweet|twitter)$/i)

