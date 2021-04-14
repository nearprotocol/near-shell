
// const prompts = require('prompts');
const readline = require('readline');
const chalk = require('chalk');

const getCode = async(method) => {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    const securityCode = await new Promise((res) => {
        rl.question(chalk`{bold Enter security code sent to ${ method.kind.split('2fa-')[1] }: }`, (accountId) => res(accountId));
    });
    rl.close();
    return securityCode;
};

const onResult = async(result) => {
    console.log('Request confirmed with result:', result);
};

module.exports = {
    options2fa: { getCode, onResult }
};
