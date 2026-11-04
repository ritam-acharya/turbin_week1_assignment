import { createUmi } from '@metaplex-foundation/umi-bundle-defaults'
import { create, mplCore } from '@metaplex-foundation/mpl-core'
import { generateSigner, createSignerFromKeypair, signerIdentity } from '@metaplex-foundation/umi'
import bs58 from 'bs58'
import dotenv from 'dotenv'

dotenv.config()

let secretKey = process.env.PAYER_SECRET_KEY!;
secretKey = secretKey.trim();

const umi = createUmi('https://api.devnet.solana.com').use(mplCore());

const keypair = umi.eddsa.createKeypairFromSecretKey(bs58.decode(secretKey));
const myKeypairSigner = createSignerFromKeypair(umi, keypair);
umi.use(signerIdentity(myKeypairSigner));

const asset = generateSigner(umi);

console.log('Minting new Core NFT asset...');

const tx = await create(umi, {
  asset,
  name: 'My NFT',
  uri: 'https://ar-io.dev/nmrremzwvHhxvLeGotPR_iC2UsUyhsTes3kdGJDQlUM/metadata.json',
}).sendAndConfirm(umi);

console.log('✅ Asset created successfully!');
console.log('Asset Address:', asset.publicKey.toString());  // Asset Address: 41VJPVqKg5YCZBnhS8Re7hCChc9ES1D4wQ8XYh5z6shp