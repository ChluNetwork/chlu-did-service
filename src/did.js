const forge = require('node-forge')
const log = require('./log')
const uuidv4 = require('uuid/v4')
const CID = require('cids')
const { dagGetResultToObject, isCID } = require('./ipfs')

async function getDDOFromDID(ipfs, db, didId) {
    const cid = await getDIDAddress(ipfs, db, didId)
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

async function getDIDAddress(ipfs, db, didId) {
    let didAddress = null
    if (didId && didId.indexOf('did:chlu:') === 0) {
        log('DID ID is a DID UUID', didId)
        didAddress = await db.get(didId)
        log('DID UUID', didId, 'resolved to Address', didAddress)
    } else if (isCID(didId)) {
        log('DID ID is a DID IPFS Address', didId)
        didAddress = didId
    } else {
        throw new Error('Invalid DID ID ' + didId)
    }
    return didAddress
}

async function getDID(ipfs, db, didId){
    log('Getting DID using ID', didId)
    const didAddress = await getDIDAddress(ipfs, db, didId)
    if (isCID(didAddress)) {
        return await getDIDFromAddress(ipfs, didAddress)
    } else {
        throw new Error('Could not find DID Address for ' + didId)
    }
}

async function getDIDFromAddress(ipfs, cid) {
    log('Getting DID at', cid)
    const result = await ipfs.dag.get(cid)
    return dagGetResultToObject(result)
}

async function verifyUsingDID(ipfs, db, didId, nonce, signature) {
    const did = await getDID(ipfs, db, didId)
    if (did && did.publicKey && did.publicKey[0] && did.publicKey[0].publicKeyPem) {
        return verify(did.publicKey[0].publicKeyPem, nonce, signature)
    } else {
        throw new Error('Could not find Public Key in DID ' + didId)
    }
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
    getDDOFromDID,
    getDID,
    verifyUsingDID,
    generateDID,
    sign,
    verify
}