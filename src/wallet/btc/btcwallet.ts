import BIP32Factory from 'bip32';
import * as ecc from 'tiny-secp256k1';
import * as bitcoin from 'bitcoinjs-lib';
const cashaddr = require('cashaddrjs')
const bitcore = require('bitcore-lib');
// @ts-ignore
import elliptic from 'elliptic';
const bip32 = BIP32Factory(ecc);
const Secp256k1 = elliptic.ec('secp256k1');
// init ECC lib
bitcoin.initEccLib(ecc);

const bchNetwork = {
    messagePrefix: '\x18Bitcoin Signed Message:\n',
    bech32: 'bc',
    bip32: {
        public: 0x0488b21e,
        private: 0x0488ade4
    },
    pubKeyHash: 0x00,
    scriptHash: 0x05,
    wif: 0x80
}

const ltcNetwork = {
    messagePrefix: '\x19Litecoin Signed Message:\n',
    bech32: 'ltc',
    bip32: {
        public: 0x019da462,
        private: 0x019d9cfe
    },
    pubKeyHash: 0x30,
    scriptHash: 0x32,
    wif: 0xb0
}

const dogeNetwork = {
    messagePrefix: '\x19Dogecoin Signed Message:\n',
    bech32: null,
    bip32: {
        public: 0x02facafd,
        private: 0x02fac398
    },
    pubKeyHash: 0x1e,
    scriptHash: 0x16,
    wif: 0x9e
}

const bsvNetwork = {
    messagePrefix: '\x18Bitcoin Signed Message:\n',
    bech32: null,
    bip32: {
        public: 0x0488b21e,
        private: 0x0488ade4
    },
    pubKeyHash: 0x00,
    scriptHash: 0x05,
    wif: 0x80
}

const purposeMap = {
    'p2pkh': '44',
    'p2sh': '49',
    'p2wpkh': '84',
    'p2tr': '86'
}

const bipNumberMap = {
    'btc': '0',
    'ltc': '2',
    'doge': '3',
    'bch': '145',
    'bsv': '236'
}

interface ImportBtcAddressParams {
    privateKey: string;
    chain: string;
    typeAddress: string
}

interface TransactionInput {
    address: string;
    txid: string;
    amount: number;
    vout: number;
}

interface TransactionOutput {
    address: string;
    amount: number;
}

interface SignObj {
    inputs: TransactionInput[];
    outputs: TransactionOutput[];
}

function getChainConfig(chain: string): any {
    try {
        const chainMap = {
            btc: bitcoin.networks.bitcoin,
            ltc: ltcNetwork,
            doge: dogeNetwork,
            bch: bchNetwork,
            bsv: bsvNetwork,
        };

        // @ts-ignore
        return chainMap[chain];
    } catch (error) {
        throw new Error(`Chain not supported :${chain}, message:${JSON.stringify(error)}`);
    }
}

export function createUtxoAddress(seedHex: string, receiveOrChange: "0" | "1", addressIndex: string, chain: string, typeAddress: string = 'p2pkh') {
    const root = bip32.fromSeed(Buffer.from(seedHex, 'hex'), getChainConfig(chain));

    // @ts-ignore
    const purpose = purposeMap[typeAddress];

    // @ts-ignore
    const bipNum = bipNumerMap[chain];

    let path = `m/${purpose}'/${bipNum}'/${receiveOrChange}'/${addressIndex}`;

    let child = root.derivePath(path);
    if (!child.privateKey) {
        throw new Error('Private key is undefined');

        let address: any;
        let utxoNetwork = getChainConfig(chain);
        // btc 拥有四种格式的地址
        // ltc 支持 p2pkh, p2wkh 和 p2sh
        // doge 支持 p2pkh 和 p2sh
        // bch 支持 p2pkh
        // bsv 支持 p2pkh
        switch (typeAddress) {
            case "p2pkh":  // 支持所有格式的地址生成
                // eslint-disable-next-line no-case-declarations
                const p2pkhAddress = bitcoin.payments.p2pkh({
                    pubkey: child.publicKey,
                    network: utxoNetwork
                });
                if (chain === "bch") {
                    address = cashaddr.encode('bitcoincash', 'P2PKH', p2pkhAddress.hash);
                } else {
                    address = p2pkhAddress.address;
                }
                break;
    
            case "p2wpkh": // 支持 BTC 和 LTC；不支持 Doge, BCH 和 BSV; bech32
                if (chain === "doge" || chain === "bch" || chain === "bsv") {
                    throw new Error('Do not support this chain');
                }
                // eslint-disable-next-line no-case-declarations
                const p2wpkhAddress = bitcoin.payments.p2wpkh({
                    pubkey: child.publicKey,
                    network: utxoNetwork
                });
                address = p2wpkhAddress.address;
                break;
    
            case "p2sh": // 支持 BTC, LTC 和 Doge; 不支持 BCH
                if (chain === "bch") {
                    throw new Error('Do not support this chain');
                }
                // eslint-disable-next-line no-case-declarations
                const p2shAddress = bitcoin.payments.p2sh({
                    redeem: bitcoin.payments.p2wpkh({
                        pubkey: child.publicKey,
                        network: utxoNetwork
                    })
                });
                address = p2shAddress.address;
                break;
    
            case "p2tr": // bech32m
                if (chain !== "btc") {
                    throw new Error('Only bitcoin support p2tr format address');
                }
                child = root.derivePath(path);
                if (!child.privateKey) {
                    throw new Error('Private key is undefined');
                }
                const  p2trAddress = bitcoin.payments.p2tr({
                    internalPubkey: child.publicKey!.slice(1, 33), // Slice to extract x-only pubkey
                    network: bitcoin.networks.testnet
                });
                address = p2trAddress.address;
                break;
    
            default:
                throw new Error('This way can not support');
        }
        if (!address) {
            throw new Error('Address generation failed');
        }
        return {
            privateKey: Buffer.from(child.privateKey).toString('hex'),
            publicKey: Buffer.from(child.publicKey).toString('hex'),
            address
        };
    }
    
    export function importUtxoAddress (params: ImportBtcAddressParams): string {
        const { privateKey, chain, typeAddress } = params;
        if (!bitcore.PrivateKey.isValid(privateKey)) {
            throw new Error('PrivateKey is not valid.');
        }
        // 私钥生成公钥匙
        if (privateKey.length !== 66 && privateKey.length !== 64) {
            throw new Error("privateKey length Invalid")
        }
        const derivePrivateKey = privateKey.length === 66 ? privateKey.slice(2) : privateKey;
        const publicKey = Secp256k1.keyFromPrivate(derivePrivateKey).getPublic().encodeCompressed();
    
        let address: any;
        let utxoNetwork = getChainConfig(chain);
    
        switch (typeAddress) {
            case 'p2pkh':
                // eslint-disable-next-line no-case-declarations
                const p2pkhAddress = bitcoin.payments.p2pkh({
                    pubkey: Buffer.from(publicKey),
                    network: utxoNetwork
                });
                if (chain === "bch") {
                    address = cashaddr.encode('bitcoincash', 'P2PKH', p2pkhAddress.hash);
                } else {
                    address = p2pkhAddress.address;
                }
                break;
            case 'p2wpkh':
                if (chain === "doge" || chain === "bch" || chain === "bsv") {
                    throw new Error('Do not support this chain');
                }
                // eslint-disable-next-line no-case-declarations
                const p2wpkhAddress = bitcoin.payments.p2wpkh({
                    pubkey: Buffer.from(publicKey),
                    network: utxoNetwork
    
                });
                address = p2wpkhAddress.address;
                break;
            case 'p2sh':
                if (chain === "bch") {
                    throw new Error('Do not support this chain');
                }
                // eslint-disable-next-line no-case-declarations
                const p2shAddress = bitcoin.payments.p2sh({
                    redeem: bitcoin.payments.p2wpkh({
                        pubkey: Buffer.from(publicKey),
                        network: utxoNetwork
                    })
                });
                address = p2shAddress.address;
                break;
            case 'p2tr':
                if (chain !== "btc") {
                    throw new Error('Only bitcoin support p2tr format address');
                }
                const p2trAddress = bitcoin.payments.p2tr({
                    internalPubkey: Buffer.from(publicKey)!.slice(1, 33), // Slice to extract x-only pubkey
                    network: utxoNetwork
                });
                address = p2trAddress.address;
                break;
            default:
                throw new Error('This way can not support');
        }
        if (!address) {
            throw new Error('Address generation failed');
        }
        return address;
    }
    
    /**
     * 暂不支持taproot签名
     * @returns
     * @param params
     */
    export function signUtxoTransaction (params: { privateKey: string; signObj: SignObj; network: string; }): string {
        const { privateKey, signObj, network } = params;
        const net = bitcore.Networks[network];
        const inputs = signObj.inputs.map(input => {
            return {
                address: input.address,
                txId: input.txid,
                outputIndex: input.vout,
                script: new bitcore.Script.fromAddress(input.address).toHex(),
                satoshis: input.amount
            }
        });
        const outputs = signObj.outputs.map(output => {
            return {
                address: output.address,
                satoshis: output.amount
            };
        });
        const transaction = new bitcore.Transaction(net).from(inputs).to(outputs);
        transaction.version = 2;
        transaction.sign(privateKey);
        return transaction.toString();
    }
    
    
    
}    