import { logger } from "./Logger";

class EventListener {
    private config: any;
    private eventHubs: Map<string, any>;
    private channel: any;
    private connectOptions: any;

    constructor(config, channel, peers) {
        this.channel = channel;
        this.config = config;
        this.eventHubs = new Map();
        this.createPeerChannelEvent(peers);
        /*
        The full block is necessary in order to have the *payload* associated to the chaincode 
        event.
        */
        this.connectOptions = {
            full_block: true
        };
    }

    public createPeerChannelEvent(peers) {
        for (const key of peers.keys()) {
            const peer = peers.get(key);
            const channelEventHub = this.channel.newChannelEventHub(peer);
            this.eventHubs.set(key, channelEventHub);
        }
    }

    public getPeerChannelEvents() {
        return this.eventHubs;
    }

    public registerTxEvent(peerName: string, txId: string, onEvent, onError) {
        if (!this.config) {
            logger.error('Config not correctly received --> call init(config)');
            throw new Error('Config not correctly received --> call init(config)');
        }
        if (peerName) {
            const eh = this.eventHubs.get(peerName);
            const handler = eh.registerTxEvent(txId, onEvent, onError);
            if (!eh.isconnected())
                eh.connect();
            return handler;
        } else {
            const handlers = [];
            for (const channelEventHub of this.channel.getChannelEventHubsForOrg()) {
                const handler = channelEventHub.registerTxEvent(txId, onEvent, onError);
                if (!channelEventHub.isconnected())
                    channelEventHub.connect();
                handlers.push(handler);
            }
            return handlers;
        }
    }

    public unregisterTxEvent(peerName: string, listener_handles: string[]) {
        if (!this.config) {
            logger.error('Config not correctly received --> call init(config)');
            throw new Error('Config not correctly received --> call init(config)');
        }
        if (peerName) {
            const eh = this.eventHubs.get(peerName);
            if (eh.isconnected())
                eh.disconnect();
            const result = eh.unregisterTxEvent(listener_handles[0]);
            return result;
        } else {
            const results = [];
            let i = 0;
            for (const channelEventHub of this.channel.getChannelEventHubsForOrg()) {
                if (channelEventHub.isconnected())
                    channelEventHub.disconnect();
                const result = channelEventHub.unregisterTxEvent(listener_handles[i]);
                results.push(result);
                i++;
            }
            return results;
        }
    }

    public registerBlockEvent(peerName: string, block_registration_number: number, onEvent, onError) {
        if (!this.config) {
            logger.error('Config not correctly received --> call init(config)');
            throw new Error('Config not correctly received --> call init(config)');
        }
        if (peerName) {
            const eh = this.eventHubs.get(peerName);
            const handler = eh.registerBlockEvent(block_registration_number, onEvent, onError);
            if (!eh.isconnected()())
                eh.connect();
            return handler;
        } else {
            const handlers = [];
            for (const channelEventHub of this.channel.getChannelEventHubsForOrg()) {
                const handler = channelEventHub.registerBlockEvent(block_registration_number, onEvent, onError);
                if (!channelEventHub.isconnected())
                    channelEventHub.connect();
                handlers.push(handler);
            }
            return handlers;
        }
    }

    public unregisterBlockEvent(peerName: string, listener_handles: string[]) {
        if (!this.config) {
            logger.error('Config not correctly received --> call init(config)');
            throw new Error('Config not correctly received --> call init(config)');
        }
        if (peerName) {
            const eh = this.eventHubs.get(peerName);
            if (eh.isconnected())
                eh.disconnect();
            const result = eh.unregisterBlockEvent(listener_handles[0]);
            return result;
        } else {
            const results = [];
            let i = 0;
            for (const channelEventHub of this.channel.getChannelEventHubsForOrg()) {
                if (channelEventHub.isconnected())
                    channelEventHub.disconnect();
                const result = channelEventHub.unregisterBlockEvent(listener_handles[i]);
                results.push(result);
                i++;
            }
            return results;
        }
    }

    public registerChaincodeEvent(chaincodeId: string, peerName: string, eventName: string, onEvent, onError) {
        if (!this.config) {
            logger.error('Config not correctly received --> call init(config)');
            throw new Error('Config not correctly received --> call init(config)');
        }
        if (peerName) {
            const eh = this.eventHubs.get(peerName);
            const handler = eh.registerChaincodeEvent(chaincodeId, eventName, onEvent, onError);
            if (!eh.isconnected())
                eh.connect(this.connectOptions);
            return handler;
        } else {
            const handlers = [];
            for (const channelEventHub of this.channel.getChannelEventHubsForOrg()) {
                const handler = channelEventHub.registerChaincodeEvent(chaincodeId, eventName, onEvent, onError);
                if (!channelEventHub.isconnected())
                    channelEventHub.connect(this.connectOptions);
                handlers.push(handler);
            }
            return handlers;
        }
    }

    public unregisterChaincodeEvent(peerName: string, listener_handles: string[]) {
        if (!this.config) {
            logger.error('Config not correctly received --> call init(config)');
            throw new Error('Config not correctly received --> call init(config)');
        }
        if (peerName) {
            const eh = this.eventHubs.get(peerName);
            if (eh.isconnected())
                eh.disconnect();
            const result = eh.unregisterChaincodeEvent(listener_handles[0]);
            return result;
        } else {
            const results = [];
            let i = 0;
            for (const channelEventHub of this.channel.getChannelEventHubsForOrg()) {
                if (channelEventHub.isconnected())
                    channelEventHub.disconnect();
                const result = channelEventHub.unregisterChaincodeEvent(listener_handles[i]);
                results.push(result);
                i++;
            }
            return results;
        }
    }

}
export { EventListener };