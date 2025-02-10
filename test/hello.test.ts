import * as bip39 from 'bip39';
import * as crypto_ts from 'crypto';

describe('Hello', () => {
  it('should return "Hello, World!"', () => {
    expect(hello()).toBe('Hello, World!');
  });

  it('should return "Hello, World2!"', () => {

    const entropy = crypto_ts.randomBytes(16)
    console.log(entropy)

    const hash = crypto_ts.createHash('sha256').update(entropy).digest()
    console.log(hash)
    const checksum = hash[0] >> 0
    console.log(checksum)

    let bits = '';
    for (let i = 0; i < entropy.length; i++) {
      bits += entropy[i].toString(2).padStart(8, '0')
    }
    bits += checksum.toString(2).padStart(8, '0')

    const indices = []
    for (let i = 0; i < bits.length; i += 11) {
      const index = parseInt(bits.slice(i, i + 11), 2)
      indices.push(index)
    }

    const wordlist = bip39.wordlists['english']

    const mnemonic = indices.map(i => wordlist[i]).join(' ')

    console.log(mnemonic)
  });
});

function hello() {
  return 'Hello, World!';
}