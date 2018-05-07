const express = require('express')
const { verifyUsingDIDAddress, getDIDFromAddress, getDDOFromDIDAddress } = require('./did')
const { isCID } = require('./ipfs')
const log = require('./log')

function getWebServer(ipfs, db) {
    const app = express()
    app.get('/', (req, res) => res.send('Chlu DID Service').end())
    app.get('/did/:didAddress', async (req, res) => {
        const didAddress = req.params.didAddress
        if (!isCID(didAddress)) return res.status(400).send('Invalid CID').end()
        try {
            console.log(didAddress)
            const did = await getDIDFromAddress(ipfs, didAddress)
            res.json(did)
        } catch (error) {
            log(error)
            res.status(500).send(error.message).end()
        }
    })
    app.get('/reputation/:didAddress', async (req, res) => {
        const didAddress = req.params.didAddress
        if (!isCID(didAddress)) return res.status(400).send('Invalid CID').end()
        try {
            const ddo = await getDDOFromDIDAddress(ipfs, db, didAddress)
            res.json(ddo)
        } catch (error) {
            log(error)
            res.status(500).send(error.message).end()
        }
    })
    app.get('/did/login/:didAddress/:nonce/:signature', async (req, res) => {
        const { didAddress, nonce, signature } = req.params
        if (!isCID(didAddress)) return res.status(400).send('Invalid CID').end()
        const valid = await verifyUsingDIDAddress(ipfs, didAddress, nonce, signature)
        if (valid) {
            try {
                const ddo = await getDDOFromDIDAddress(ipfs, db, didAddress)
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