const log = require('./log')
const { dagGetResultToObject } = require('./ipfs')

class ChluIPFSDID {
    constructor(chluIpfs, db) {
        this.chluIpfs = chluIpfs
        this.ipfs = chluIpfs.instance.ipfs
        this.db = db
        this.chluDID = chluIpfs.instance.did.chluDID
    }

    async getUnverifiedReviews(didId) {
        const reputationMultihash = await this.db.get(didId);
        if (!reputationMultihash) {
            throw new Error('DDO Not found. If it was just created, try again in a while')
        }
        log('Retrieving DDO at', reputationMultihash, ' from IPFS...')
        const reputationDag = await this.ipfs.dag.get(reputationMultihash)
        const data = await dagGetResultToObject(reputationDag)
        log('Retrieved DDO for ', didId, 'resolved to DDO address', reputationMultihash, 'resolved to data', data)
        return data
    }

    async getDID(didId){
        log('Getting DID using ID', didId)
        if (typeof didId === 'string' && didId.indexOf('did:chlu') === 0) {
            return this.chluIpfs.instance.did.getDID(didId)
        } else {
            throw new Error('DID ID invalid')
        } 
    }

    async getDIDList() {
        return Object.keys(this.db._index._index)
            .filter(x => x.indexOf('did:') === 0)
    }

    async verifyUsingDID(didId, nonce, signature) {
        const did = await this.getDID(didId)
        return this.chluDID.verify(did, nonce, signature)
    }
}

module.exports = ChluIPFSDID