const IPFS = require('ipfs')
const path = require('path')
const OrbitDB = require('orbit-db')
const CID = require('cids')
const log = require('./log')
const multihashes = require('multihashes')

async function getDB(orbitDb) {
    const db = await orbitDb.keyvalue('chlu-reputation-experimental-3', {
        write: ['*']
    })
    db.events.on('load', () => log('OrbitDB: Load'))
    db.events.on('load.progress', (address, hash, entry, progress, total) => log('OrbitDB Load Progress ' + progress + '/' + total))
    db.events.on('replicated', ()  => log('OrbitDB Replicated from another peer'))
    await db.load()
    return db
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

module.exports = { getDB, isCID, dagGetResultToObject }