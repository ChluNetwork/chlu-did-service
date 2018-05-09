const IPFS = require('ipfs')
const path = require('path')
const OrbitDB = require('orbit-db')
const CID = require('cids')
const log = require('./log')
const multihashes = require('multihashes')

async function getIPFS(directory) {
    return await new Promise(resolve => {
        const repo = path.join(directory, 'ipfs')
        log('Creating IPFS with repo at', repo)
        const ipfs = new IPFS({
            EXPERIMENTAL: {
                pubsub: true
            },
            config: {
                Addresses: {
                    Swarm: [
                        // Connect to Chlu rendezvous server
                        '/dns4/ren.chlu.io/tcp/443/wss/p2p-websocket-star'
                    ]
                }
            },
            repo
        });
        ipfs.on('ready', function(){ resolve(ipfs); });
    })
}

async function getOrbitDB(ipfs, directory) {
    const storage = path.join(directory, 'orbit-db')
    log('Creating IPFS with storage at', storage)
    const orbitDb = new OrbitDB(ipfs, storage)
    const db = await orbitDb.keyvalue('chlu-reputation-experimental-2', {
        write: ['*']
    })
    db.events.on('load', () => log('OrbitDB: Load'))
    db.events.on('load.progress', (address, hash, entry, progress, total) => log('OrbitDB Load Progress ' + progress + '/' + total))
    db.events.on('replicated', ()  => log('OrbitDB Replicated from another peer'))
    await db.load()
    return { orbitDb, db }
}

function isCID(cid) {
    if (CID.isCID(cid)) return true
    try {
        multihashes.fromB58String(cid);
        return true;
    } catch (error) {
        return false;
    }
}

function dagGetResultToObject(result) {
    // This normalizes what you get when the obj was in a protobuf node vs encoded as CBOR
    log('Resolving JS Object from IPFS')
    if (result.value && result.value.data && result.value.data.toString) {
        log('Found PB, extracting string')
        const string = result.value.data.toString()
        try {
            log('Parsing JSON...')
            return JSON.parse(string)
        } catch (error) {
            log('Parsing JSON FAILED. Returning plain string')
            return string
        }
    } else {
        log('Found IPLD Object, returning JS value')
        return result.value
    }
}

module.exports = { getIPFS, getOrbitDB, isCID, dagGetResultToObject }