# irestore

This a wrapper around the [iOS Backup Extraction](https://github.com/dunhamsteve/ios) Go program. It is based on a [fork](https://github.com/dnicolson/irestore) which has some modifications, most importantly replacing the first argument with the path to the backup rather than the GUID.


## Installation

The Go binary can be installed globally:

```
npm i -g irestore
```

The Node.js package can also be installed locally:

```
npm i irestore
```

## Usage

The Go binary [README](https://github.com/dnicolson/irestore) documents the command line arguments.

A backup can be restored with the following commands:

```
const IRestore = require('irestore');
const iRestore = new IRestore('/path/to/backup');
await iRestore.restore('HomeDomain', '/path/to/decrypted-backup');
```

## License
MIT.
