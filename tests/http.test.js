const getWebServer = require('../src/http')
const sinon = require('sinon')
const expect = require('chai').expect
const request = require('supertest')
const ChluDID = require('chlu-did/src')

describe('HTTP server', () => {

    let chluIpfs, app, fakeReviewsByDID, fakeReviewRecords

    before(() => {
        // disable logs
        process.env.DISABLE_LOGS = '1'
    })

    beforeEach(() => {
        fakeDIDStore = {
            'did:chlu:12345': { id: 'did:chlu:12345' }
        }
        fakeReviewsByDID = {
            'did:chlu:12345': ['Qma']
        }
        fakeReviewRecords = {
            'Qma': { review: 'hello world' }
        }
        chluIpfs = {
            start: sinon.stub().resolves(),
            stop: sinon.stub().resolves(),
            instance: {
                did: {
                    chluDID: new ChluDID()
                }
            },
            getDID: async x => {
                return fakeDIDStore[x]
            },
            getReviewsByDID: async x => {
                return fakeReviewsByDID[x]
            },
            readReviewRecord: async x => {
                return fakeReviewRecords[x]
            }
        }
        app = request(getWebServer(chluIpfs))
    })

    it('constructor', () => {
        const ws = getWebServer(chluIpfs)
        expect(ws.listen).to.be.a('function')
    })

    it('/', async () => {
        await app.get('/').expect(200)
    })

    it('/did/:didId', async () => {
        await app.get('/did/lol').expect(500)
        await app.get('/did/did:chlu:12345')
            .expect('Content-Type', 'application/json; charset=utf-8')
            .expect(200, fakeDIDStore['did:chlu:12345'])
    })

    it('/reputation', async () => {
        await app.get('/reputation/lol').expect(500)
        await app.get('/reputation/did:chlu:12345')
            .expect('Content-Type', 'application/json; charset=utf-8')
            .expect(200, [{review:'hello world'}])
    })

    it('/did/verify', async () => {
        const data = 'example of some data to sign'
        const DID = new ChluDID()
        const did = await DID.generateDID()
        // put real did in place in the fake store so that the verify can work
        fakeDIDStore['did:chlu:12345'] = did.publicDidDocument
        const output = await DID.sign(did.privateKeyBase58, data)
        await app.get('/did/verify/did:chlu:12345/' + output.data + '/' + output.signature)
            .expect('Content-Type', 'application/json; charset=utf-8')
            .expect(200, {
                valid: true,
                publicDidDocument: did.publicDidDocument
            })
    })

    it('supports using an access token', async () => {
        const token = 'abcd'
        app = request(getWebServer(chluIpfs, token))
        await app.get('/reputation/did:chlu:12345').expect(400, 'Missing API token')
        await app.get('/reputation/did:chlu:12345?token=abcd').expect(200)
        await app.get('/did/did:chlu:12345').expect(400, 'Missing API token')
        await app.get('/did/did:chlu:12345?token=abcd').expect(200)
    })
})