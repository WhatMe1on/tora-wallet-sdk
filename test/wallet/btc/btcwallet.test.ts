import * as assert from 'assert';
import BIP32Factory, { BIP32Interface } from 'bip32';
import * as bip39 from 'bip39';
import * as ecc from 'tiny-secp256k1';
// import { regtestUtils } from './_regtest.js';
import * as bitcoin from 'bitcoinjs-lib';
import { toXOnly } from "bitcoinjs-lib/src/psbt/bip371"
import { randomBytes } from 'crypto';


// const regtest = regtestUtils.network;
bitcoin.initEccLib(ecc);
const bip32 = BIP32Factory(ecc);
const rng = (size: number) => randomBytes(size);

// describe('bitcoinjs-lib (HD)', () => {
//     it('can import a BIP32 testnet xpriv and export to WIF', () => {
//         console.log(toXOnly(Buffer.from('cc8a4bc64d897bddc5fbc2f670f7a8ba0b386779106cf1223c6fc5d7cd6fc115', 'hex')))
//     });
// });

describe('bitcoinjs-lib (transaction with taproot)', () => {
    it('can verify the BIP86 HD wallet vectors for taproot single sig (& sending example)', async () => {
        // Values taken from BIP86 document
        const mnemonic =
            'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
        const xprv =
            'xprv9s21ZrQH143K3GJpoapnV8SFfukcVBSfeCficPSGfubmSFDxo1kuHnLisriDvSnRRuL2Qrg5ggqHKNVpxR86QEC8w35uxmGoggxtQTPvfUu';
        const path = `m/86'/0'/0'/0/0`; // Path to first child of receiving wallet on first account
        const internalPubkey = Buffer.from(
            'cc8a4bc64d897bddc5fbc2f670f7a8ba0b386779106cf1223c6fc5d7cd6fc115',
            'hex',
        );
        const expectedAddress =
            'bc1p5cyxnuxmeuwuvkwfem96lqzszd02n6xdcjrs20cac6yqjjwudpxqkedrcr';

        // Verify the above (Below is no different than other HD wallets)
        const seed = await bip39.mnemonicToSeed(mnemonic);
        const rootKey = bip32.fromSeed(seed);
        assert.strictEqual(rootKey.toBase58(), xprv);
        const childNode = rootKey.derivePath(path);
        // Since internalKey is an xOnly pubkey, we drop the DER header byte
        const childNodeXOnlyPubkey = toXOnly(childNode.publicKey);
        assert.deepEqual(childNodeXOnlyPubkey, internalPubkey);

        // This is new for taproot
        // Note: we are using mainnet here to get the correct address
        // The output is the same no matter what the network is.
        const { address, output } = bitcoin.payments.p2tr({
            internalPubkey,
        });
        assert.ok(!!output);
        assert.strictEqual(address, expectedAddress);
        // Used for signing, since the output and address are using a tweaked key
        // We must tweak the signer in the same way.
        const tweakedChildNode = childNode.tweak(
            bitcoin.crypto.taggedHash('TapTweak', childNodeXOnlyPubkey),
        );

        // amount from faucet
        const amount = 42e4;
        // amount to send
        const sendAmount = amount - 1e4;
        // Send some sats to the address via faucet. Get the hash and index. (txid/vout)
        const { txId: hash, vout: index } = await regtestUtils.faucetComplex(
            Buffer.from(output),
            amount,
        );
        // Sent 420000 sats to taproot address

        const psbt = new bitcoin.Psbt({ network: regtest })
            .addInput({
                hash,
                index,
                witnessUtxo: { value: BigInt(amount), script: output },
                tapInternalKey: childNodeXOnlyPubkey,
            })
            .addOutput({
                value: BigInt(sendAmount),
                address: regtestUtils.RANDOM_ADDRESS,
            })
            .signInput(0, tweakedChildNode)
            .finalizeAllInputs();

        const tx = psbt.extractTransaction();
        await regtestUtils.broadcast(tx.toHex());
        await regtestUtils.verify({
            txId: tx.getId(),
            address: regtestUtils.RANDOM_ADDRESS,
            vout: 0,
            value: sendAmount,
        });
    });
});