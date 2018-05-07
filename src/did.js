const forge = require('node-forge')
const log = require('./log')
const uuidv4 = require('uuid/v4')
const { dagGetResultToObject } = require('./ipfs')

async function getDDOFromDIDAddress(ipfs, db, cid) {
    const reputationMultihash = await db.get(cid);
    if (!reputationMultihash) {
        throw new Error('DDO Not found. If it was just created, try again in a while')
    }
    log('Retrieving DDO at', reputationMultihash, ' from IPFS...')
    const reputationDag = await ipfs.dag.get(reputationMultihash)
    const data = await resolveDDOLinks(ipfs, dagGetResultToObject(reputationDag))
    log('Retrieved DDO for DID at', cid, 'resolved to DDO address', reputationMultihash, 'resolved to data', data)
    return data
}

async function resolveDDOLinks(ipfs, rep) {
    if (rep.did && rep.did['/']) {
        rep.did = await getDIDFromAddress(ipfs, rep.did['/'])
    }
    if (Array.isArray(rep.reviews)) {
        rep.reviews = rep.reviews.map(r => {
            if (r.did && r.did['/']) {
                r.did['/'] = (new CID(r.did['/'])).toBaseEncodedString()
            }
            return r
        })
    }
    return rep
}

async function getDIDFromAddress(ipfs, cid) {
    log('Getting DID at', cid)
    const result = await ipfs.dag.get(cid)
    return dagGetResultToObject(result)
}

async function verifyUsingDIDAddress(ipfs, didAddress, nonce, signature) {
    const did = await getDIDFromAddress(ipfs, didAddress)
    return verify(did.publicKey[0].publicKeyPem, nonce, signature)
}

function generateDID() {
    var uuid = uuidv4()
    var kp = forge.pki.rsa.generateKeyPair()
    var encodedPublicKey = forge.pki.publicKeyToPem(kp.publicKey)
    var encodedPrivateKey = forge.pki.privateKeyToPem(kp.privateKey)
    var publicDidDocument = {
      '@context': 'https://w3id.org/did/v1',
      'id': "did:chlu:" + uuid,
      'publicKey': [{
        'id': "did:chlu:" + uuid + "#keys-1",
        'type': 'RsaVerificationKey2018',
        'owner': "did:chlu:" + uuid,
        'publicKeyPem': encodedPublicKey
      }],
      'authentication': [{
        'type': 'RsaSignatureAuthentication2018',
        'publicKey': "did:chlu:" + encodedPublicKey + "#keys-1",
      }]
    };
    return {
      publicDidDocument: publicDidDocument,
      privateKeyPem: encodedPrivateKey
    };
}

function sign(privateKeyPem, data) {
    const privateKey = forge.pki.privateKeyFromPem(privateKeyPem)
    var md = forge.md.sha256.create();
    md.update(data, 'utf8');
    const signature = privateKey.sign(md)
    return {
        signature: Buffer.from(signature, 'binary').toString('hex'), 
        signed: data
    }
}

function verify(publicKeyPem, data, signature) {
    const didPublicKey = forge.pki.publicKeyFromPem(publicKeyPem)
    // hex encoded signature 
    const signatureBuffer = Buffer.from(signature, 'hex').toString('binary')
    var md = forge.md.sha256.create();
    md.update(data, 'utf8');
    return didPublicKey.verify(md.digest().bytes(), signatureBuffer)
}

module.exports = {
    getDDOFromDIDAddress,
    getDIDFromAddress,
    verifyUsingDIDAddress,
    generateDID,
    sign,
    verify
}