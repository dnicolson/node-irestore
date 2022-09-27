const { spawn } = require('child_process');

class IRestore {
  constructor(backupPath) {
    this.backupPath = backupPath;
  }

  _command(args) {
    return new Promise((resolve) => {
      const child = spawn(`${process.env.PWD}/node_modules/.bin/irestore`, args, { stdio: ['inherit', 'inherit'] });
      child.on('exit', () => {
        resolve();
      });
    });
  }

  ls(domain) {
    return this._command([this.backupPath, 'ls', domain]);
  }

  restore(domain, path) {
    return this._command([this.backupPath, 'restore', domain, path]);
  }

  dumpKeys(outputFile) {
    return this._command([this.backupPath, 'dumpkeys', outputFile]);
  }

  encryptKeys(inputFile, outputFile) {
    return this._command([this.backupPath, 'encryptkeys', inputFile, outputFile]);
  }

  apps() {
    return this._command([this.backupPath, 'apps']);
  }
}

module.exports = IRestore;
