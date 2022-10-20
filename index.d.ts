export default class IRestore {
  constructor(backupPath: string, password?: string);
  ls(domain: string): Promise<string>;
  restore(domain: string, path: string): Promise<string>;
  dumpKeys(outputFile: string): Promise<string>;
  encryptKeys(inputFile: string, outputFile: string): Promise<string>;
  apps(): Promise<string>;
}
