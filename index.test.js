const IRestore = require('irestore');

describe('irestore', () => {
  it('exports the correct methods', () => {
    const iRestore = new IRestore('xxx');

    expect(iRestore.ls).toEqual(expect.any(Function));
    expect(iRestore.restore).toEqual(expect.any(Function));
    expect(iRestore.dumpKeys).toEqual(expect.any(Function));
    expect(iRestore.encryptKeys).toEqual(expect.any(Function));
    expect(iRestore.apps).toEqual(expect.any(Function));
  });
});
