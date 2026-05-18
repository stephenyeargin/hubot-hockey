import hubot from 'hubot';

const { Adapter, Robot } = hubot;

class TestAdapter extends Adapter {
  constructor(robot, name = 'test') {
    super(robot);
    this.name = name;
  }

  async send(envelope, ...strings) {
    this.emit('send', envelope, ...strings);
  }

  async reply(envelope, ...strings) {
    this.emit('reply', envelope, ...strings);
  }

  async run() {}
}

export const createTestRobot = (name = 'hubot', adapterName = 'test') => {
  const robot = new Robot(adapterName, false, name);
  robot.adapter = new TestAdapter(robot, adapterName);
  robot.adapterName = robot.adapter.name;

  return robot;
};