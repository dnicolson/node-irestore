const { spawn } = require('child_process');
const os = require('os');
const path = require('path');
const pty = require('node-pty');
const shellescape = require('shell-escape');

class IRestore {
  constructor(backupPath, password = null) {
    this.backupPath = backupPath;
    this.password = password;
  }

  _runPtyProcess(bin, args) {
    return new Promise((resolve, reject) => {
      const shell = os.platform() === 'win32' ? 'powershell.exe' : 'bash';
      const ptyProcess = pty.spawn(shell, [], {
        name: 'xterm-color',
        cols: 80,
        rows: 30,
        cwd: process.env.HOME,
        env: process.env,
      });
      
      let output;
      let timesDoneOutputted = 0;
      let passwordEntered = false;
      ptyProcess.onData((data) => {
        const lines = data.toString();

        if (lines.endsWith('Backup Password: ')) {
          ptyProcess.write(`${this.password}\n`);
          passwordEntered = true;
        }

        if (lines.includes('irestore done.') && timesDoneOutputted++ === 2) {
          ptyProcess.kill();
          if (passwordEntered) {
            resolve(output);
          } else {
            reject('pty error, please try again.');
          }
        }

        output += lines;
      });

      ptyProcess.write(`${bin} ${shellescape(args)}; echo 'irestore done.'\n`);
    });
  }

  runCommand(args) {
    return new Promise(async (resolve, reject) => {
      const bin = path.join(__dirname, 'node_modules/.bin/irestore')
      if (this.password) {
        try {
          const output = await this._runPtyProcess(bin, args);
          resolve(output);
        } catch(err) {
          reject(err);
        }
      } else {
        const child = spawn(bin, args, { stdio: ['inherit', 'inherit'] });
        if (!child) {
          return reject();
        }
        child.on('exit', () => {
          resolve();
        });
      }
    });
  }

  ls(domain) {
    return this.runCommand([this.backupPath, 'ls', domain]);
  }

  restore(domain, path) {
    return this.runCommand([this.backupPath, 'restore', domain, path]);
  }

  dumpKeys(outputFile) {
    return this.runCommand([this.backupPath, 'dumpkeys', outputFile]);
  }

  encryptKeys(inputFile, outputFile) {
    return this.runCommand([this.backupPath, 'encryptkeys', inputFile, outputFile]);
  }

  apps() {
    return this.runCommand([this.backupPath, 'apps']);
  }
}

module.exports = IRestore;
