# node-ledger-client

Hyperledger client based on [Hyperledger fabric sdk node](https://fabric-sdk-node.github.io/)

## Usage
Import in your Typescript file:<br/>
```javascript
import { LedgerClient } from 'node-ledger-client';
```

Use with the [config-fabric-network.json](https://github.com/ascatox/node-ledger-client/blob/master/resources/config-fabric-network.json) file with this shape: <br/>
```javascript
const config = require('./config-fabric-network.json');
const ledgerClient = await LedgerClient.init(config); 
const invoke = ledgerClient.doInvoke('storeProcessStepRouting', ['test']);

const peerName = config.organizations[0].peers[0].name;
const ccid = config.chaincode.name;
const eventId = "EVENT";
let handler = null;
async function main() {
    async function chaincodeEventSubscribe(eventId: string, peerName: string) {
        return ledgerClient.registerChaincodeEvent(ccid, peerName, eventId, (event) => {
            console.log('Event arrived with name: ' + event.event_name + ' and with payload ' + Buffer.from(event.payload));
        }, (err) => {
            console.log('Errore ricevuto nell evento' + err);
            setTimeout(() => {
                chaincodeEventSubscribe(eventId, peerName).then((handler) => {
                    console.log('Handler received ' + JSON.stringify(handler));
                }, (err) => {
                    console.error('Handler received ' + err);
                });
            }, 1000);
        });
    }
    chaincodeEventSubscribe(eventId, peerName).then((handle) => {
        console.log('Handler received ' + JSON.stringify(handle));
        handler = handle;
    }, (err) => {
        console.error('Handler received ' + err);
    });
}
main();
```
