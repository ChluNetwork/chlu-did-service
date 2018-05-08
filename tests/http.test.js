const getWebServer = require('../src/http')
const sinon = require('sinon')
const expect = require('chai').expect
const request = require('supertest')
const DID = require('../src/did')
const log = require('../src/log')

describe('HTTP server', () => {

    let ipfs, db, app, fakeDb, fakeIpfs

    before(() => {
        // disable logs
        process.env.DISABLE_LOGS = '1'
    })

    beforeEach(() => {
        fakeDb = {
            'did:chlu:12345': 'Qma',
            'Qma': 'Qmb'
        }
        fakeIpfs = {
            'Qma': { did: true },
            'Qmb': { reviews: [] },
        }
        ipfs = {
            dag: {
                get: sinon.stub().callsFake(async x =>{
                    return {
                        value: {
                            data: Buffer.from(JSON.stringify(fakeIpfs[x]))
                        }
                    }
                })
            }
        }
        db = {
            get: sinon.stub().callsFake(async x => fakeDb[x] || null)
        }
        app = request(getWebServer(ipfs, db))
    })

    it('constructor', () => {
        const ws = getWebServer(ipfs, db)
        expect(ws.listen).to.be.a('function')
    })

    it('/', async () => {
        await app.get('/').expect(200)
    })

    it('/did', async () => {
        await app.get('/did/lol').expect(500)
        await app.get('/did/did:chlu:12345')
            .expect('Content-Type', 'application/json; charset=utf-8')
            .expect(200, fakeIpfs['Qma'])
    })

    it('/reputation', async () => {
        await app.get('/reputation/lol').expect(500)
        await app.get('/reputation/did:chlu:12345')
            .expect('Content-Type', 'application/json; charset=utf-8')
            .expect(200, fakeIpfs['Qmb'])
    })

    it('/did/verify', async () => {
        const data = 'example of some data to sign'
        const did = await DID.generateDID()
        // put real did in place in the fake IPFS so that the verify can work
        fakeIpfs['Qma'] = did.publicDidDocument
        const output = await DID.sign(did.privateKeyPem, data)
        await app.get('/did/verify/did:chlu:12345/' + output.signed + '/' + output.signature)
            .expect('Content-Type', 'application/json; charset=utf-8')
            .expect(200, {
                valid: true,
                ddo: fakeIpfs['Qmb']
            })
    })

    it('supports using an access token', async () => {
        const token = 'abcd'
        app = request(getWebServer(ipfs, db, token))
        await app.get('/reputation/did:chlu:12345').expect(400, 'Missing API token')
        await app.get('/reputation/did:chlu:12345?token=abcd').expect(200)
        await app.get('/did/did:chlu:12345').expect(400, 'Missing API token')
        await app.get('/did/did:chlu:12345?token=abcd').expect(200)
    })
})