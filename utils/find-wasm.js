const util = require('util');
const glob = util.promisify(require('glob'));
const fs = require('fs');



async function findWasm(target) {
    let res = await glob(`**/${target}/*.wasm`, { 
        ignore: '**/node_modules/**'
    });
    return res;
}

async function findWasmFile(wasmFile, target) {
    try {
        return await findWasmFileUnsafe(wasmFile, target);
    } catch (err) {
        console.error(err.message);
        process.exit(1);
    }
}

async function findWasmFileUnsafe(wasmFile, target) {
    if (fs.existsSync(wasmFile)) {
        return wasmFile;
    }
    if (wasmFile === './out/main.wasm') {
        let res = await findWasm(target);
        if (res.length == 0) {
            throw new Error(`Wasm file ${wasmFile} does not exist and none could be found for target ${target}.`);
        }
        if (res.length > 1) {
            throw new Error(`Multiple Wasm files found:\n\t• ${res.join('\n\t• ')}\n\nPlease pass one with --wasmFile=file`);
        }
        return res[0];
    }
    throw new Error(`Wasm file ${wasmFile} does not exist.`);

}


module.exports = {findWasmFile, findWasmFileUnsafe};