const express = require('express')
const ChluIPFSDID = require('./ipfs-did')
const { isCID } = require('./ipfs')
const log = require('./log')

function getWebServer(ipfs, db, token) {
    const chluIpfsDID = new ChluIPFSDID(ipfs, db)
    const app = express()
    app.get('/', (req, res) => res.send('Chlu DID Service').end())
    app.get('/did/:didId', async (req, res) => {
        if (token && token !== req.query.token) {
            res.status(400).send('Missing API token').end()
        } else {
            try {
                const didId = req.params.didId
                const did = await chluIpfsDID.getDID(didId)
                res.json(did)
            } catch (error) {
                log(error)
                res.status(500).send(error.message).end()
            }
        }
    })
    app.get('/reputation/:didId', async (req, res) => {
        if (token && token !== req.query.token) {
            res.status(400).send('Missing API token').end()
        } else {
            try {
                const didId = req.params.didId
                const ddo = await chluIpfsDID.getDDOFromDID(didId)
                res.json(ddo)
            } catch (error) {
                log(error)
                res.status(500).send(error.message).end()
            }
        }
    })
    app.get('/did/verify/:didId/:data/:signature', async (req, res) => {
        if (token && token !== req.query.token) {
            res.status(400).send('Missing API token').end()
        } else {
            try {
                const { didId, data, signature } = req.params
                const valid = await chluIpfsDID.verifyUsingDID(didId, data, signature)
                if (valid) {
                    const ddo = await chluIpfsDID.getDDOFromDID(didId)
                    res.json({
                        valid,
                        ddo
                    })
                }
            } catch (error) {
                log(error)
                res.status(500).send(error.message).end()
            }
        }
    })
    return app
}

module.exports = getWebServer