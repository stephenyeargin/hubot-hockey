// Description
//   Mock Discord adapter
module.exports = (robot) => {
  robot.adapterName = 'discord';
  if (robot.adapter) {
    robot.adapter.name = 'discord';
  }
};
