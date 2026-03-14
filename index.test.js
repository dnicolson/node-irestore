const IRestore = require('./index');
const pty = require('node-pty');

describe('irestore', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('exports the correct methods', () => {
    const iRestore = new IRestore('xxx');

    expect(iRestore.ls).toEqual(expect.any(Function));
    expect(iRestore.restore).toEqual(expect.any(Function));
    expect(iRestore.dumpKeys).toEqual(expect.any(Function));
    expect(iRestore.encryptKeys).toEqual(expect.any(Function));
    expect(iRestore.apps).toEqual(expect.any(Function));
  });

  it('launches a pty if a password is provided', async () => {
    const callbacks = {};
    const ptyProcess = {
      onData: jest.fn((cb) => {
        callbacks.data = cb;
      }),
      onExit: jest.fn((cb) => {
        callbacks.exit = cb;
      }),
      write: jest.fn(),
      kill: jest.fn(),
    };

    jest.spyOn(IRestore.prototype, '_resolveBinaryPath').mockReturnValue('irestore');
    jest.spyOn(pty, 'spawn').mockReturnValue(ptyProcess);

    const iRestore = new IRestore('xxx', '123');
    const pending = iRestore.apps();

    expect(pty.spawn).toBeCalledWith('irestore', ['xxx', 'apps'], expect.any(Object));

    callbacks.data('Backup Password: ');
    expect(ptyProcess.write).toBeCalledWith('123\r');

    callbacks.exit({ exitCode: 0 });
    await expect(pending).resolves.toContain('Backup Password:');
  });
});
