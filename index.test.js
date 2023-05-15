const IRestore = require('./index');
const pty = require('node-pty');

describe('irestore', () => {
  it('exports the correct methods', () => {
    const iRestore = new IRestore('xxx');

    expect(iRestore.ls).toEqual(expect.any(Function));
    expect(iRestore.restore).toEqual(expect.any(Function));
    expect(iRestore.dumpKeys).toEqual(expect.any(Function));
    expect(iRestore.encryptKeys).toEqual(expect.any(Function));
    expect(iRestore.apps).toEqual(expect.any(Function));
  });

  it('launches a pty if a password is provided', async () => {
    jest.spyOn(pty, 'spawn');

    const iRestore = new IRestore('xxx', '123');

    await expect(iRestore.apps()).rejects.toEqual('pty error, please try again.');
    expect(pty.spawn).toBeCalled();
  });
});
