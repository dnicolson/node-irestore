const { execSync, spawn } = require('child_process');
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

      let output = '';
      let passwordEntered = false;

      ptyProcess.onData((data) => {
        const lines = data.toString();

        if (lines.endsWith('Backup Password: ')) {
          ptyProcess.write(`${this.password}\r`);
          passwordEntered = true;
        }

        if (lines.includes('Bad password')) {
          return reject('Bad password.');
        }

        if (lines.trim() === 'irestore done.') {
          ptyProcess.kill();
          if (passwordEntered) {
            resolve(output);
          } else {
            reject('pty error, please try again.');
          }
        }

        output += lines;
      });

      ptyProcess.write(`${bin} ${shellescape(args)}; echo 'irestore done.'\r`);
    });
  }

  runCommand(args) {
    return new Promise(async (resolve, reject) => {
      let binPath;
      try {
        binPath = execSync('npm bin').toString().trim();
      } catch (error) {
        const env = process.env;
        if (env && env.npm_config_prefix) {
          binPath = path.join(env.npm_config_prefix, 'bin');
        } else if (env && env.npm_config_local_prefix) {
          binPath = path.join(env.npm_config_local_prefix, path.join('node_modules', '.bin'));
        } else {
          binPath = path.join(process.cwd(), 'node_modules', '.bin');
        }
      }
      const bin = path.join(binPath, 'irestore');

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
