#!/usr/bin/env node

const main = require('./src')
let ipfs, orbitDb

main()
    .then(obj => {
        ipfs = obj.ipfs
        orbitDb = obj.orbitDb
    })
    .catch(error => {
        console.log(error)
        process.exit(1)
    })

process.on('SIGINT', async function() {
    try {
        console.log('Stopping gracefully');
        if (orbitDb) {
            await orbitDb.stop();
        }
        if (ipfs) {
            await ipfs.stop();
        }
        console.log('Goodbye!');
        process.exit(0);
    } catch(exception) {
        console.trace(exception);
        process.exit(1);
    }
});