const main = require('./src')

main().catch(error => {
    console.log(error)
    process.exit(1)
})