#!/usr/bin/env node

const main = require('./src')
let chluIpfs, db

main()
    .then(obj => {
        chluIpfs = obj.chluIpfs
        db = obj.db
    })
    .catch(error => {
        console.log(error)
        process.exit(1)
    })

process.on('SIGINT', async function() {
    try {
        console.log('Stopping gracefully');
        if (db) {
            await db.close();
        }
        if (chluIpfs) {
            await chluIpfs.stop();
        }
        console.log('Goodbye!');
        process.exit(0);
    } catch(exception) {
        console.trace(exception);
        process.exit(1);
    }
});