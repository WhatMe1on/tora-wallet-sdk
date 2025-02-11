const bip39 = require("bip39")

import {
    createEthAddress,
    importEthWallet,
    verifyAddress,
    publicKeyToAddress
} from '../../../src/wallet/ethereum/wallet'

describe('Wallet', () => {
    test('hello world', async () => {
        console.log('hello world')
    })

    test('createAddress', () => {
        const mnemonic = "champion junior glimpse analyst plug jump entire barrel slight swim hidden amazing";
        const seed = bip39.mnemonicToSeedSync(mnemonic)
        const account = createEthAddress(seed.toString("hex"), "0")
        console.log(account)
    });
    // {"privateKey":"0xc0e32f18a2ef69f42f34d4e9346e9ecac93abe1c975937e8ce6ccb6ba200fc64","publicKey":"0x03dfe0f7bebdeac609deb1735a0ced63ca3b3216eadb6a2b84126d99f15ccf2cd4","address":"0x00fc9a933e6d2Dc94C3B73989139B637353B5f94"}

    test('import eth wallet', () => {
        const privateKey = "c0e32f18a2ef69f42f34d4e9346e9ecac93abe1c975937e8ce6ccb6ba200fc64"
        const wallet = importEthWallet(privateKey)
        console.log(wallet)
    });
    //{"privateKey":"0xc0e32f18a2ef69f42f34d4e9346e9ecac93abe1c975937e8ce6ccb6ba200fc64","publicKey":"0x04dfe0f7bebdeac609deb1735a0ced63ca3b3216eadb6a2b84126d99f15ccf2cd4d53265346a0bec943ce279f9097d8783415ec75eeefe792b2e90443ad5cbd71f","address":"0x00fc9a933e6d2Dc94C3B73989139B637353B5f94"}
    
    test('import eth wallet', () => {
        const result = verifyAddress("0x00fc9a933e6d2Dc94C3B73989139B637353B5f94");
        console.log(result)
    });

    test('import eth wallet', () => {
        const result = publicKeyToAddress("0x03dfe0f7bebdeac609deb1735a0ced63ca3b3216eadb6a2b84126d99f15ccf2cd4");
        console.log(result)
    });


});