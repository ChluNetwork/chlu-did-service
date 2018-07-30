
function log() {
    if (process.env.DISABLE_LOGS !== '1') {
        if (arguments.length === 1 && arguments[0] && arguments[0].message) {
            console.log(arguments[0])
            console.trace(arguments[0])
        }
        console.log(Object.values(arguments).join(' '))
    }
}

module.exports = log