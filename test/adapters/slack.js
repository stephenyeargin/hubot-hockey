// Description
//   Mock Slack adapter
module.exports = (robot) => {
  robot.adapterName = 'slack';
  if (robot.adapter) {
    robot.adapter.name = 'slack';
  }
};
