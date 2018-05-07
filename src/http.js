const express = require('express')
const { verifyUsingDID, getDID, getDDOFromDID } = require('./did')
const { isCID } = require('./ipfs')
const log = require('./log')

function getWebServer(ipfs, db) {
    const app = express()
    app.get('/', (req, res) => res.send('Chlu DID Service').end())
    app.get('/did/:didId', async (req, res) => {
        const didId = req.params.didId
        try {
            const did = await getDID(ipfs, db, didId)
            res.json(did)
        } catch (error) {
            log(error)
            res.status(500).send(error.message).end()
        }
    })
    app.get('/reputation/:didId', async (req, res) => {
        const didId = req.params.didId
        try {
            const ddo = await getDDOFromDID(ipfs, db, didId)
            res.json(ddo)
        } catch (error) {
            log(error)
            res.status(500).send(error.message).end()
        }
    })
    app.get('/did/login/:didId/:nonce/:signature', async (req, res) => {
        const { didId, nonce, signature } = req.params
        const valid = await verifyUsingDID(ipfs, db, didId, nonce, signature)
        if (valid) {
            try {
                const ddo = await getDDOFromDID(ipfs, db, didid)
                res.json({
                    valid,
                    ddo
                })
            } catch (error) {
                res.status(500).json(error)
            }
        }
    })
    return app
}

module.exports = getWebServer