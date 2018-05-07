const DID = require('../src/did')
const expect = require('chai').expect

describe('DID', () => {
    it('DID generation', () => {
        const did = DID.generateDID() 
        expect(did.publicDidDocument.id.slice(0, 'did:chlu:'.length)).to.equal('did:chlu:')
        // TODO more checks
    })

    it('can sign and verify data', () => {
        const did = DID.generateDID() 
        const toSign = 'abcdef'
        const output = DID.sign(did.privateKeyPem, toSign)
        const valid = DID.verify(did.publicDidDocument.publicKey[0].publicKeyPem, output.signed, output.signature)
        expect(valid).to.be.true
    })
})