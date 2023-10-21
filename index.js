const fs = require('fs');
const path = require('path');

module.exports = (robot) => {
  const scriptsPath = path.resolve(__dirname, 'src');
  if (fs.existsSync(scriptsPath)) {
    const scripts = ['hockey.js'].sort();
    scripts.forEach((script) => {
      robot.loadFile(scriptsPath, script);
    });
  }
};
