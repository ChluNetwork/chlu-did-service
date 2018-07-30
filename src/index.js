const express = require('express')
const path = require('path')
const log = require('./log')
const getWebServer = require('./http')
const ChluIPFS = require('chlu-ipfs-support')
const cli = require('commander')

let chluIpfs, db

process.on('SIGINT', async function() {
    try {
        await stop()
        process.exit(0);
    } catch(exception) {
        console.log(exception);
        process.exit(1);
    }
});

async function stop() {
    console.log('Stopping gracefully');
    if (db) {
        await db.close();
    }
    if (chluIpfs) {
        await chluIpfs.stop();
    }
    console.log('Goodbye!');
}

async function start(cmd) {
    const directory = cmd.directory || path.join(process.env.HOME, '.chlu-did-service')
    log('Starting ChluIPFS')
    chluIpfs = new ChluIPFS({
        type: ChluIPFS.types.service,
        directory,
        network: cmd.network || ChluIPFS.networks.experimental
    })
    await chluIpfs.start()
    log('Starting Web Server')
    const app = getWebServer(chluIpfs, cmd.token)
    const port = cmd.port || 3000
    await new Promise(resolve => app.listen(port, resolve))
    log('Web server started on port', port)
    return {
        chluIpfs,
        db,
        app,
        port
    }
}

cli
    .name('chlu-did-service')
    .description('HTTP API Server to interact with Chlu DIDs. http://chlu.io')

cli
    .command('start')
    .description('run the DID Service')
    // Chlu specific options
    .option('-d, --directory <path>', 'where to store chlu data, defaults to ~/.chlu-did-service')
    .option('-n, --network <network>', 'which chlu network to use, defaults to experimental')
    .option('-t, --token <token>', 'if this is set, this will be a required API TOKEN parameter in all HTTP calls')
    .option('-p, --port <port>', 'defaults to 3000', parseInt)
    .action(cmd => {
        start(cmd)
            .catch(function(error) {
                log(error);
                process.exit(1);
            })
    });

function main() {
    cli.parse(process.argv);

    if (!process.argv.slice(2).length) {
        cli.help();
    }
}

module.exports = main