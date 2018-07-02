const log = require('./log')

class ChluIPFSDID {
    constructor(chluIpfs) {
        this.chluIpfs = chluIpfs
        this.ipfs = chluIpfs.instance.ipfs
        this.chluDID = chluIpfs.instance.did.chluDID
    }

    async getReviewsByDID(didId) {
        if (!didId || !didId.match(/^did:chlu:/)) throw new Error('Invalid DID ID')
        const multihashes = await this.chluIpfs.getReviewsByDID(didId)
        const reviews = []
        for (const multihash of multihashes) {
            const review = await this.chluIpfs.readReviewRecord(multihash)
            reviews.push(review)
        }
        return reviews
    }

    async getDID(didId){
        log('Getting DID using ID', didId)
        if (typeof didId === 'string' && didId.indexOf('did:chlu') === 0) {
            return this.chluIpfs.getDID(didId)
        } else {
            throw new Error('DID ID invalid')
        } 
    }

    async verifyUsingDID(didId, nonce, signature) {
        const did = await this.getDID(didId)
        return this.chluDID.verify(did, nonce, signature)
    }
}

module.exports = ChluIPFSDID