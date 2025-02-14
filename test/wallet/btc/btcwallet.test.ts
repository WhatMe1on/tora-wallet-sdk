import * as assert from 'assert';
import BIP32Factory, { BIP32Interface } from 'bip32';
import * as bip39 from 'bip39';
import * as ecc from 'tiny-secp256k1';
import { describe, it } from 'mocha';
import { PsbtInput, TapLeaf, TapLeafScript } from 'bip174';
import { regtestUtils } from './_regtest.js';
import * as bitcoin from 'bitcoinjs-lib';
import { Taptree } from 'bitcoinjs-lib/src/types';
import {
    LEAF_VERSION_TAPSCRIPT,
    tapleafHash,
} from 'bitcoinjs-lib/src/payments/bip341';
import {
    toXOnly,
    tapTreeToList,
    tapTreeFromList,
} from 'bitcoinjs-lib/src/psbt/bip371';
import { witnessStackToScriptWitness } from 'bitcoinjs-lib/src/psbt/psbtutils';
import * as tools from 'uint8array-tools';
import { sha256 } from '@noble/hashes/sha256';
import { randomBytes } from 'crypto';

const regtest = regtestUtils.network;
bitcoin.initEccLib(ecc);
const bip32 = BIP32Factory(ecc);
const rng = (size: number) => randomBytes(size);