import * as path from 'path';
import * as fs from 'fs';

class Utils {

    private static getPrivateKeyPath(domainName: string, user: any, cryptoDir: string): string {
        if (this.isAdmin(user))
            return path.join(this.getCryptoDir(cryptoDir), '/peerOrganizations/', domainName, '/users/', user.name + '@' + domainName + '/msp/keystore');
        return path.join(this.getCryptoDir(cryptoDir), domainName, user.name, 'keystore');
    }

    public static getCertPath(domainName: string, user: any, cryptoDir: string): string {
        if (this.isAdmin(user))
            return path.join(this.getCryptoDir(cryptoDir), "/peerOrganizations/", domainName,
                '/users/Admin@' + domainName + '/msp/signcerts/' + user.name + '@' + domainName + '-cert.pem');
        return path.join(this.getCryptoDir(cryptoDir), domainName, user.name, 'ca-cert.pem');
    }

    public static getCert(domainName: string, user: any, cryptoDir: string): string {
        const path = this.getCertPath(domainName, user, cryptoDir);
        return fs.readFileSync(path, 'utf8');
    }

    public static getPrivateKeyFilePath(domainName: string, user: any, cryptoDir: string): string {
        // List all files in a directory in Node.js recursively in a synchronous fashion
        try {
            let files = [];
            fs.readdirSync(this.getPrivateKeyPath(domainName, user, cryptoDir))
                .filter((file) => {
                    if (file.indexOf('_sk'))
                        files.push(file);
                });
            if (files.length > 1) {
                throw new Error('Multiple keystore files found!');
            }
            const path = this.getPrivateKeyPath(domainName, user, cryptoDir) + '/' + files[0]
            return path;
        } catch (err) {
            throw new Error(err);
        }
    }

    public static getPrivateKey(domainName: string, user: any, cryptoDir: string): Buffer {
        return fs.readFileSync(this.getPrivateKeyFilePath(domainName, user, cryptoDir));
    }

    public static getCryptoDir(cryptoDir: string): string {
        const os = require('os');
        return cryptoDir || os.homedir();
    }

    private static isAdmin(user: any): boolean {
        if (user && user.roles) {
            if (user.roles.find(role => role === 'admin' || role === 'Admin'))
                return true;
        }
        return false;
    }
}


export { Utils };