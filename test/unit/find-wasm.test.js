const findWasmFile = require('../../utils/find-wasm').findWasmFileUnsafe;
const path = require('path');

const currentDir = path.dirname(__dirname);

describe('find wasm', () => {

    describe('successful', () => {
        beforeAll(() => {
            process.chdir(path.join(currentDir, 'find-wasm32', 'correct_find-wasm'));
        });

        it('should find debug target', async () => {
            expect(await findWasmFile('./out/main.wasm', 'debug')).toBe('rust/target/wasm32/debug/empty.wasm');
        });

        it('should find release target', async () => {
            expect(await findWasmFile('./out/main.wasm', 'release')).toBe('rust/target/wasm32/release/empty.wasm');
        });
    });

    describe('too many files found', () => {
        beforeAll(() => {
            process.chdir(path.join(currentDir, 'find-wasm32', 'too_many_find-wasm'));
        });

        it('should find too many debug targets', async () => {
            await expect(findWasmFile('./out/main.wasm', 'debug')).rejects.toThrow(new Error(
                `Multiple Wasm files found:
\t• rust/target/wasm32/debug/empty.wasm
\t• rust/target/wasm32/debug/empty1.wasm

Please pass one with --wasmFile=file`));
        });

        it('should find too many release targets', async () => {
            await expect(findWasmFile('./out/main.wasm', 'release')).rejects.toThrow(new Error(
                `Multiple Wasm files found:
\t• rust/target/wasm32/release/empty.wasm
\t• rust/target/wasm32/release/empty1.wasm

Please pass one with --wasmFile=file`));
        });
    });


    describe('find out/main.wasm', () => {
        beforeAll(() => {
            process.chdir(path.join(currentDir, 'find-wasm32', 'has_out_main'));
        });

        it('should find find the file', async () => {
            expect(await findWasmFile('./out/main.wasm', 'debug')).toBe('./out/main.wasm');
        });

    
    });
  

});
