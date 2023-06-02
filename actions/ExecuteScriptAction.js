const { execFile } = require('child_process');
const fs = require('fs');
const configuration = require('../devops/configuration.json');

class ExecuteScriptAction {
  static async run(action, content) {
    const validConfigurationFile = await ExecuteScriptAction.is600Permissions();
    if (validConfigurationFile) {
        ExecuteScriptAction.checkConfigurationFile(action);
        return ExecuteScriptAction.executeScript(action, content);
    } else {
      throw new Error('Configuration file does not have 600 permissions code in filesystem')
    }
  }

  static checkConfigurationFile(action) {
    ExecuteScriptAction.actionNotFound(action);
    ExecuteScriptAction.scriptNotFound(action);
  }

  static executeScript(action, content) {
    const params = ExecuteScriptAction.extractContentParams(content);

    return new Promise((resolve, reject) => {
      execFile(configuration[action].script, [params], (error, stdout, stderr) => {
        if (error) {
          return reject(error);
        }
        resolve();
      });
    })
  }

  static extractContentParams(content) {
    return content && Object.values(content).join(',') || '';
  }

  static scriptNotFound(action) {
    if (!configuration[action].script) {
      throw new Error('Action script property not found');
    }
  }

  static actionNotFound(action) {
    if (!configuration[action]) {
      throw new Error('Action not found');
    }
  }

  static async is600Permissions() {
    return new Promise((resolve,reject) => {
      fs.stat('./devops/configuration.json', (err, stats) => {
        if (err) {
          reject(new Error('Cannot read configuration file permissions'));
        }
      
        const permissions = ExecuteScriptAction.getFilePermissions(stats);
        resolve(permissions === '600');
      });
    });
  }

  static getFilePermissions(stats) {
    return stats.mode.toString(8).slice(-3);
  }
}

module.exports = ExecuteScriptAction;