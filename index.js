const { spawn } = require('child_process');
const os = require('os');
const pty = require('node-pty');
const shellescape = require('shell-escape');

class IRestore {
  constructor(backupPath, password = null) {
    this.backupPath = backupPath;
    this.password = password;
  }

  _runPtyProcess(bin, args, resolve) {
    const shell = os.platform() === 'win32' ? 'powershell.exe' : 'bash';
    const ptyProcess = pty.spawn(shell, [], {
      name: 'xterm-color',
      cols: 80,
      rows: 30,
      cwd: process.env.HOME,
      env: process.env,
    });
    
    let output;
    ptyProcess.onData((data) => {
      const lines = data.toString();
      if (lines.endsWith('Backup Password: ')) {
        ptyProcess.write(`${this.password}\n`);
      }

      output += lines;
      if (lines.startsWith("\u001b[?2004") && output.length > 200) {
        ptyProcess.kill();
        resolve(output);
      }
    });

    ptyProcess.write(`${bin} ${shellescape(args)}\n`);
  }

  _command(args) {
    return new Promise((resolve) => {
      const bin = `${process.env.PWD}/node_modules/.bin/irestore`;
      if (this.password) {
        this._runPtyProcess(bin, args, resolve);
      } else {
        const child = spawn(bin, args, { stdio: ['inherit', 'inherit'] });
        child.on('exit', () => {
          resolve();
        });
      }
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
