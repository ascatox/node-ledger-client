import utils = require("./Utils");
import Client = require('fabric-client');
import FabricCAServices = require('fabric-ca-client');
import * as path from 'path';
import { logger } from "./Logger";
import { EventListener } from "./EventListener";

class LedgerClient {

    private fabricClient: Client;
    private config: any;
    private channel: any; //I cant use the interface of fabric-client because not exposed from module :-()
    private cryptoSuite: any;
    private users: any;
    private loggedUser: any;
    private store_path: string;
    private logger: any;
    //private eventHubs: Map<string, any>;
    private peers: Map<string, any>;
    private eventListener: EventListener;

    constructor() {
    }

    public static init(config) {
        return (async function () {
            let ledgerClient = new LedgerClient();
            // Do async stuff
            try {
                await ledgerClient.build(config);
            } catch (err) {
                logger.error('Error encountered in initialization' + err);
                console.error('Error encountered in initialization' + err);
            }
            // Return instance
            return ledgerClient
        }());
    }

    private async build(config) {
        try {
            if (!config) throw new Error('config file not found!');
            this.fabricClient = new Client();
            this.config = config;
            await this.loadCerts();
            await this.loadOrganizations();
            this.eventListener = new EventListener(config, this.channel, this.peers);
        } catch (err) {
            throw new Error(err);
        }
    }

    public async doQuery(fcn: string, args: string[]) {
        if (!this.channel) {
            logger.error('Channel not correctly initialized --> call instantiateChanel');
            throw new Error('Channel not correctly initialized --> call instantiateChanel');
        }
        const request = {
            //targets : --- letting this default to the peers assigned to the channel
            chaincodeId: this.config.chaincode.name,
            chaincodePath: this.config.chaincode.path,
            chaincodeVersion: this.config.chaincode.version,
            chaincodeLang: this.config.chaincode.lang,
            fcn: fcn,
            args: args
        };
        const query_responses = await this.channel.queryByChaincode(request);
        return new Promise((resolve, reject) => {
            logger.debug("Query has completed, checking results");
            if (query_responses && query_responses.length == 1) {
                if (query_responses[0] instanceof Error) {
                    logger.error("error from query = ", query_responses[0]);
                    reject("error from query = " + query_responses[0]);
                } else {
                    logger.debug("Response is ", query_responses[0].toString());
                    resolve(query_responses[0].toString());
                }
            } else {
                logger.debug("No payloads were returned from query");
                reject("No payloads were returned from query");
            }
        });
    }


    public async doInvoke(fcn: string, args: string[]) {
        if (!this.channel) {
            logger.error('Channel not correctly initialized --> call instantiateChanel');
            throw new Error('Channel not correctly initialized --> call instantiateChanel');
        }
        // get a transaction id object based on the current user assigned to fabric client
        const tx_id = await this.fabricClient.newTransactionID();
        var request = {
            //targets: let default to the peer assigned to the client
            chaincodeId: this.config.chaincode.name,
            chaincodePath: this.config.chaincode.path,
            chaincodeVersion: this.config.chaincode.version,
            chaincodeLang: this.config.chaincode.lang,
            fcn: fcn,
            args: args,
            chainId: this.config.channelName,
            txId: tx_id
        };
        const results = await this.channel.sendTransactionProposal(request, this.config.timeout);
        return await this.manageInvokeProposal(results, tx_id);
    }

   /*
    public async doInvokeWithTxId(fcn: string, args: string[]) {
        if (!this.channel) {
            logger.error('Channel not correctly initialized --> call instantiateChanel');
            throw new Error('Channel not correctly initialized --> call instantiateChanel');
        }
        // get a transaction id object based on the current user assigned to fabric client
        const tx_id = await this.fabricClient.newTransactionID();
        var request = {
            //targets: let default to the peer assigned to the client
            chaincodeId: this.config.chaincode.name,
            chaincodePath: this.config.chaincode.path,
            chaincodeVersion: this.config.chaincode.version,
            chaincodeLang: this.config.chaincode.lang,
            fcn: fcn,
            args: args,
            chainId: this.config.channelName,
            txId: tx_id
        };
        const results = await this.channel.sendTransactionProposal(request, this.config.timeout);
        const result = await this.manageInvokeProposal(results, tx_id);
        return { tx_id: tx_id, result: result };
    }
    */

    public registerTxEvent(peerName: string, txId: string, onEvent, onError) {
        return this.eventListener.registerTxEvent(peerName, txId, onEvent, onError);
    }
    public registerAllPeersTxEvent(txId: string, onEvent, onError) {
        return this.eventListener.registerTxEvent(null, txId, onEvent, onError);
    }

    public unregisterTxEvent(peerName: string, listener_handle: string) {
        return this.eventListener.unregisterTxEvent(peerName, [listener_handle]);
    }

    public unregisterAllPeersTxEvent(listener_handles: string[]) {
        return this.eventListener.unregisterTxEvent(null, listener_handles);
    }

    public registerBlockEvent(peerName: string, block_registration_number: number, onEvent, onError) {
        return this.eventListener.registerBlockEvent(peerName, block_registration_number, onEvent, onError);
    }

    public registerAllPeersBlockEvent(block_registration_number: number, onEvent, onError) {
        return this.eventListener.registerBlockEvent(null, block_registration_number, onEvent, onError);
    }

    public unregisterBlockEvent(peerName: string, listener_handle: string) {
        return this.eventListener.unregisterBlockEvent(peerName, [listener_handle]);
    }

    public unregisterAllPeersBlockEvent(peerName: string, listener_handles: string[]) {
        return this.eventListener.unregisterBlockEvent(null, listener_handles);
    }

    public registerChaincodeEvent(chaincodeId: string, peerName: string, eventName: string, onEvent, onError) {
        return this.eventListener.registerChaincodeEvent(chaincodeId, peerName, eventName, onEvent, onError);
    }

    public registerAllPeersChaincodeEvent(chaincodeId: string, eventName: string, onEvent, onError) {
        return this.eventListener.registerChaincodeEvent(chaincodeId, null, eventName, onEvent, onError);
    }

    public unregisterChaincodeEvent(peerName: string, listener_handle: string) {
        return this.eventListener.unregisterChaincodeEvent(peerName, [listener_handle]);
    }

    public unregisterAllPeersChaincodeEvent(listener_handles: string[]) {
        return this.eventListener.unregisterChaincodeEvent(null, listener_handles);
    }

    private async manageInvokeProposal(results, tx_id) {
        var proposalResponses = results[0];
        var proposal = results[1];
        let isProposalGood = false;
        return new Promise((resolve, reject) => {
            if (proposalResponses && proposalResponses[0].response &&
                proposalResponses[0].response.status === 200) {
                isProposalGood = true;
                logger.debug('Transaction proposal was good');
            } else {
                let rejectionMsg = '';
                if (proposalResponses[0].message)
                    rejectionMsg += proposalResponses[0].message;
                else if (proposalResponses[0].response.message)
                    rejectionMsg += proposalResponses[0].response.message;
                logger.error('Transaction proposal was bad: ' + rejectionMsg);
                reject('Transaction proposal was bad: ' + rejectionMsg);
            }
            if (isProposalGood) {
                logger.debug(
                    'Successfully sent Proposal and received ProposalResponse: Status - %s, message - "%s"',
                    proposalResponses[0].response.status, proposalResponses[0].response.message);

                // build up the request for the orderer to have the transaction committed
                var request = {
                    proposalResponses: proposalResponses,
                    proposal: proposal
                };

                // set the transaction listener and set a timeout of 30 sec
                // if the transaction did not get committed within the timeout period,
                // report a TIMEOUT status
                var transaction_id_string = tx_id.getTransactionID(); //Get the transaction ID string to be used by the event processing
                this.channel.sendTransaction(request).then(data => {
                    if (data.status === 'SUCCESS')
                        resolve(proposalResponses[0].response.payload.toString());
                    else
                        reject(data.status);
                }, error => {
                    reject(error);
                });
            }
        });
    }

    private async instantiateChannel(organization) {
        if (this.config) {
            this.channel = this.fabricClient.newChannel(this.config.channelName);
            this.peers = new Map();
            for (const peerConf of organization.peers) {
                const peer = this.fabricClient.newPeer(peerConf.requestURL, null);
                this.channel.addPeer(peer);
                this.peers.set(peerConf.name, peer);
                /*if (peerConf.eventURL) {
                    this.eventListener.addPeerChannelEvent(peerConf.name);
                }*/
            }
            for (const ordererConf of organization.orderers) {
                const peer = this.fabricClient.newOrderer(ordererConf.url, null);
                this.channel.addOrderer(peer);
            }
            logger.debug('instantiation finished');
        }
    }

    private async loadCerts() {
        try {
            this.store_path = path.join(utils.Utils.getCryptoDir(this.config.cryptoconfigdir), 'hfc-key-store');
            const stateStore = await Client.newDefaultKeyValueStore({ path: this.store_path });
            this.fabricClient.setStateStore(stateStore);
            this.cryptoSuite = Client.newCryptoSuite();
            const cryptoKeyStore = Client.newCryptoKeyStore({ path: this.store_path });
            this.cryptoSuite.setCryptoKeyStore(cryptoKeyStore);
            this.fabricClient.setCryptoSuite(this.cryptoSuite);
        } catch (err) {
            throw new Error(err);
        }
    }

    private async loadOrganizations() {
        for (const organization of this.config.organizations) {
            const userConfig = organization.users[0]; //Take only the first one TODO
            const privateKeyPath = utils.Utils.getPrivateKeyFilePath(organization.domainName, userConfig, this.config.cryptoconfigdir);

            const cryptoContent = {
                privateKey: privateKeyPath,
                signedCert: utils.Utils.getCertPath(organization.domainName, userConfig, this.config.cryptoconfigdir)
            };
            const userOptions = {
                username: userConfig.name,
                mspid: organization.mspID,
                cryptoContent: cryptoContent,
                skipPersistence: false,
                isEnrolled: true
            };
            this.loggedUser = await this.fabricClient.getUserContext(userConfig.name, true);
            if (!this.loggedUser)
                this.loggedUser = await this.fabricClient.createUser(userOptions);
            await this.instantiateChannel(organization);
        }
    }
}

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
    const config = require('../resources/config-fabric-network.json');
    var peerName = config.organizations[0].peers[0].name;
    var ccid = config.chaincode.name;
    var eventId = "EVENT";
    var ledgerClient = await LedgerClient.init(config);
    var handler = null;
    chaincodeEventSubscribe(eventId, peerName).then((handle) => {
        console.log('Handler received ' + JSON.stringify(handle));
        handler = handle;
    }, (err) => {
        console.error('Handler received ' + err);
    });
}
//main();

export { LedgerClient };