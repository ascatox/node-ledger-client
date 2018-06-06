# node-ledger-client

Hyperledger client based on [Hyperledger fabric sdk node](https://fabric-sdk-node.github.io/)

## Usage
Import in your Typescript file:<br/>
`import { LedgerClient } from 'node-ledger-client';`

Use with the [config-fabric-network.json](https://github.com/ascatox/node-ledger-client/blob/master/resources/config-fabric-network.json) file with this shape: <br/>
```javascript
const config = require('./config-fabric-network.json');
const ledgerClient = await LedgerClient.init(config); 
```
