const { KeyPair } = require('near-api-js');
const exitOnError = require('../utils/exit-on-error');
const connect = require('../utils/connect');
const { readFile, writeFile, mkdir } = require('fs').promises;
const { existsSync } = require('fs');
const { findWasmFile } = require('../utils/find-wasm');

const { PROJECT_KEY_DIR } = require('../middleware/key-store');

const eventtracking = require('../utils/eventtracking');
const inspectResponse = require('../utils/inspect-response');


module.exports = {
    command: 'dev-deploy [wasmFile]',
    desc: 'deploy your smart contract using temporary account (TestNet only)',
    builder: (yargs) => yargs
        .option('wasmFile', {
            desc: 'Path to wasm file to deploy',
            type: 'string',
            default: './out/main.wasm'
        })
        .option('init', {
            desc: 'Create new account for deploy (even if there is one already available)',
            type: 'boolean',
            default: false
        })
        .option('initialBalance', {
            desc: 'Number of tokens to transfer to newly created account',
            type: 'string',
            default: '100'
        })
        .alias({
            'init': ['force', 'f'],
        }),
    handler: exitOnError(devDeploy)
};

async function devDeploy(options) {
    await eventtracking.askForConsentIfNeeded(options);
    const { nodeUrl, helperUrl, masterAccount } = options;
    const wasmFile = await findWasmFile(options.wasmFile, 'debug');
    if (!helperUrl && !masterAccount) {
        throw new Error('Cannot create account as neither helperUrl nor masterAccount is specified in config for current NODE_ENV (see src/config.js)');
    }
    const near = await connect(options);
    const accountId = await createDevAccountIfNeeded({ ...options, near });
    console.log(
        `Starting deployment. Account id: ${accountId}, node: ${nodeUrl}, helper: ${helperUrl}, file: ${wasmFile}`);
    const contractData = await readFile(wasmFile);
    const account = await near.account(accountId);
    const result = await account.deployContract(contractData);
    inspectResponse.prettyPrintResponse(result, options);
    console.log(`Done deploying to ${accountId}`);
}

async function createDevAccountIfNeeded({ near, keyStore, networkId, init, masterAccount }) {
    // TODO: once examples and create-near-app use the dev-account.env file, we can remove the creation of dev-account
    // https://github.com/near/near-cli/issues/287
    const accountFilePath = `${PROJECT_KEY_DIR}/dev-account`;
    const accountFilePathEnv = `${PROJECT_KEY_DIR}/dev-account.env`;
    if (!init) {
        try {
            // throws if either file is missing
            const existingAccountId = (await readFile(accountFilePath)).toString('utf8').trim();
            await readFile(accountFilePathEnv);
            if (existingAccountId && await keyStore.getKey(networkId, existingAccountId)) {
                return existingAccountId;
            }
        } catch (e) {
            if (e.code === 'ENOENT') {
                // Create neardev directory, new account will be created below
                if (!existsSync(PROJECT_KEY_DIR)) {
                    await mkdir(PROJECT_KEY_DIR);
                }
            } else {
                throw e;
            }
        }
    }
    let accountId;
    // create random number with at least 7 digits
    const randomNumber = Math.floor(Math.random() * (9999999 - 1000000) + 1000000);

    if (masterAccount) {
        accountId = `dev-${Date.now()}.${masterAccount}`;
    } else {
        accountId = `dev-${Date.now()}-${randomNumber}`;
    }

    const keyPair = await KeyPair.fromRandom('ed25519');
    await near.accountCreator.createAccount(accountId, keyPair.publicKey);
    await keyStore.setKey(networkId, accountId, keyPair);
    await writeFile(accountFilePath, accountId);
    // write file to be used by env-cmd
    await writeFile(accountFilePathEnv, `CONTRACT_NAME=${accountId}`);
    return accountId;
}
