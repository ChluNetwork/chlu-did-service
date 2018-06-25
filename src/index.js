const express = require('express')
const path = require('path')
const log = require('./log')
const getWebServer = require('./http')
const ChluIPFS = require('chlu-ipfs-support')

async function main() {
    const directory = process.env.DIRECTORY || path.join(process.env.HOME, '.chlu-did-service')
    log('Starting ChluIPFS')
    const chluIpfs = new ChluIPFS({
        directory,
        network: 'experimental' // TODO: custom network
    })
    await chluIpfs.start()
    log('Opening Unverified Review database')
    const db = await getDB(chluIpfs.instance.orbitDb.orbitDb)
    log('DB Address')
    log(db.address.toString())
    log('Starting Web Server')
    const app = getWebServer(chluIpfs, db, process.env.API_TOKEN)
    const port = process.env.PORT || 3000
    await new Promise(resolve => app.listen(port, resolve))
    log('Web server started on port', port)
    return {
        chluIpfs,
        db,
        app,
        port
    }
}

module.exports = main