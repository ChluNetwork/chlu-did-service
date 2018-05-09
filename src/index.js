const express = require('express')
const path = require('path')
const log = require('./log')
const getWebServer = require('./http')
const { getOrbitDB, getIPFS } = require('./ipfs')

async function main() {
    const directory = process.env.DIRECTORY || path.join(process.env.HOME, '.chlu-did-service')
    log('Starting IPFS')
    const ipfs = await getIPFS(directory)
    log('IPFS ID')
    log((await ipfs.id()).id)
    log('Getting OrbitDB')
    const { orbitDb, db } = await getOrbitDB(ipfs, directory)
    log('DB Address')
    log(db.address.toString())
    log('Starting Web Server')
    const app = getWebServer(ipfs, db, process.env.API_TOKEN)
    const port = process.env.PORT || 3000
    await new Promise(resolve => app.listen(port, resolve))
    log('Web server started on port', port)
    return {
        ipfs,
        orbitDb,
        db,
        app,
        port
    }
}

module.exports = main