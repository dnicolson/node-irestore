const { spawn } = require('child_process');
const os = require('os');
const fs = require('fs');
const path = require('path');
const pty = require('node-pty');

function isExecutable(filePath) {
  try {
    fs.accessSync(filePath, fs.constants.X_OK);
    return true;
  } catch {
    return false;
  }
}

function expandHome(dir) {
  if (dir === '~') {
    return os.homedir();
  }

  if (dir.startsWith('~/')) {
    return path.join(os.homedir(), dir.slice(2));
  }

  if (!dir.startsWith('~')) {
    return dir;
  }

  return dir;
}

function stripTerminalControlSequences(value) {
  return value
    .replace(/\u001B\][^\u0007]*(?:\u0007|\u001B\\)/g, '')
    .replace(/\u001B\[[0-?]*[ -/]*[@-~]/g, '')
    .replace(/\u001B[@-Z\\-_]/g, '')
    .replace(/\u0007/g, '');
}

class IRestore {
  constructor(backupPath, password = null) {
    this.backupPath = backupPath;
    this.password = password;
  }

  _resolveBinaryPath() {
    const binaryName = process.platform === 'win32' ? 'irestore.exe' : 'irestore';
    const localBinary = path.join(__dirname, 'bin', binaryName);
    const pathEntries = (process.env.PATH || '').split(path.delimiter).filter(Boolean).map(expandHome);

    if (isExecutable(localBinary)) {
      return localBinary;
    }

    for (const dir of pathEntries) {
      const candidate = path.join(dir, binaryName);
      if (isExecutable(candidate)) {
        return candidate;
      }
    }

    throw new Error(
      'Could not find an executable `irestore` binary. Reinstall the package with install scripts enabled, or install `irestore` so it is available on PATH.'
    );
  }

  _runPtyProcess(bin, args) {
    return new Promise((resolve, reject) => {
      let output = '';
      let passwordEntered = false;
      let settled = false;
      let ptyProcess;

      const finish = (error = null) => {
        if (settled) {
          return;
        }

        settled = true;

        try {
          ptyProcess && ptyProcess.kill();
        } catch {
          // The process may have already exited.
        }

        if (error) {
          reject(error instanceof Error ? error : new Error(String(error)));
          return;
        }

        resolve(output);
      };

      try {
        ptyProcess = pty.spawn(bin, args, {
          name: 'xterm-color',
          cols: 80,
          rows: 30,
          cwd: process.cwd(),
          env: process.env,
        });
      } catch (error) {
        finish(error);
        return;
      }

      ptyProcess.onData((data) => {
        const lines = data.toString();
        output += lines;
        const cleanedOutput = stripTerminalControlSequences(output);

        if (!passwordEntered && cleanedOutput.includes('Backup Password:')) {
          ptyProcess.write(`${this.password}\r`);
          passwordEntered = true;
        }

        if (cleanedOutput.includes('Bad password')) {
          finish(new Error('Bad password.'));
        }
      });

      ptyProcess.onExit(({ exitCode, signal }) => {
        if (settled) {
          return;
        }

        if (exitCode === 0) {
          finish();
          return;
        }

        const normalizedOutput = output.replace(/\r/g, '').trim();
        const message =
          normalizedOutput || `irestore exited with code ${exitCode}${signal ? ` (signal ${signal})` : ''}.`;

        finish(new Error(message));
      });
    });
  }

  async runCommand(args) {
    const bin = this._resolveBinaryPath();

    if (this.password) {
      return this._runPtyProcess(bin, args);
    }

    return new Promise((resolve, reject) => {
      const child = spawn(bin, args, { stdio: 'inherit' });

      child.on('error', (error) => {
        reject(error);
      });

      child.on('exit', (exitCode, signal) => {
        if (exitCode === 0) {
          resolve();
          return;
        }

        reject(new Error(`irestore exited with code ${exitCode}${signal ? ` (signal ${signal})` : ''}.`));
      });
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
