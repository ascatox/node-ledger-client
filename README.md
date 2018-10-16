# node-ledger-client

Hyperledger client based on [Hyperledger fabric sdk node](https://fabric-sdk-node.github.io/)

## Usage
Import in your Typescript file:<br/>
```javascript
import { LedgerClient } from 'node-ledger-client';
```

Now you can view a 3 functions to working with chaincode: <br>
  1. ```async doInvoke(fcn: string, args: string[])```
  2. ```async doQuery(fcn: string, args: string[])``` 
  3. ```async registerChaincodeEvent(chaincodeId: string, peerName: string, eventName: string, onEvent, onError)```
  
### async doInvoke
The Invoke method is invoked whenever the state of the blockchain is queried or modified. <br
   
This method needs **two** arguments, the **first** is the name of the function we want to invoke in the chaincode. The **second** is the array of args that we want to pass to the chaincode function. <br>
**doInvoke** returns a Promise. <br>
**Example** <br>
`const payload  = await ledgerClient.doInvoke(fcn , args);` <br>


### async doQuery
A chaincode query is somewhat simpler to implement as it involves the entire network, but simply requires communication from client to peer. <br>
   
It is the same seen just before.<br>
**Example** <br>
`const payload = await ledgerClient.doQuery(fcn , args);` <br>

### async registerChaincodeEvent

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

**Watch out!!!** The string *eventName* must be the same as the event created in the chaincode!!!
 
 


    
