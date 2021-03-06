const log = require('./log')

class ChluIPFSDID {
    constructor(chluIpfs) {
        this.chluIpfs = chluIpfs
        this.ipfs = chluIpfs.ipfs
        this.chluDID = chluIpfs.didIpfsHelper.chluDID
    }

    async getReviewsAboutDID(didId) {
        if (!didId || !didId.match(/^did:chlu:/)) throw new Error('Invalid DID ID')
        const multihashes = await this.chluIpfs.getReviewsAboutDID(didId)
        const reviews = []
        for (const multihash of multihashes) {
            const review = await this.chluIpfs.readReviewRecord(multihash, {
                getLatestVersion: true,
                validate: {
                    throwErrors: false // this returns the errors instead of throwing
                }
            })
            reviews.push(review)
        }
        return reviews
    }

    async getDID(didId){
        log('Getting DID using ID', didId)
        if (typeof didId === 'string' && didId.indexOf('did:') === 0) {
            return this.chluIpfs.getDID(didId)
        } else {
            throw new Error('DID ID invalid')
        } 
    }

    async verifyUsingDID(didId, nonce, signature) {
        const did = await this.getDID(didId)
        log(`Verifying Signature by DID ${didId} with data ${nonce} and sig ${signature} => ...`)
        const result = await this.chluDID.verify(did, nonce, signature)
        log(`Verifying Signature by DID ${didId} with data ${nonce} and sig ${signature} => ${result}`)
        return result
    }
}

module.exports = ChluIPFSDID