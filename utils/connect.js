const { 
    connect: nearConnect,
    multisig: {
        modIfMultisig,
    }
} = require('near-api-js');
const { options2fa } = require('./2fa');

module.exports = async function connect({ keyStore, ...options }) {
    const near = await nearConnect({ ...options, deps: { keyStore }});
    modIfMultisig(near, options2fa);
    return near;
};
