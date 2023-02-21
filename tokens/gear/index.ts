import * as token from '@solana/spl-token';
import * as web3 from '@solana/web3.js';
import { initializeKeypair } from './initializeKeypair';
import * as fs from 'fs';
import {
    bundlrStorage,
    findMetadataPda,
    keypairIdentity,
    Metaplex,
    toMetaplexFile,
} from '@metaplex-foundation/js';
import {
    DataV2,
    createCreateMetadataAccountV2Instruction,
} from '@metaplex-foundation/mpl-token-metadata';

async function createGear(
    connection: web3.Connection,
    payer: web3.Keypair,
    programId: web3.PublicKey,
    assets: Array<string>
) {
    let collection: any = {};

    const metaplex = Metaplex.make(connection)
        .use(keypairIdentity(payer))
        .use(
            bundlrStorage({
                address: 'https://devnet.bundlr.network',
                providerUrl: 'https://api.devnet.solana.com',
                timeout: 60000,
            })
        );

    for (let i = 0; i < assets.length; i++) {
        let mints: Array<string> = [];

        const imageBuffer = fs.readFileSync(
            `tokens/gear/assets/${assets[i]}.png`
        );
        const file = toMetaplexFile(imageBuffer, `${assets[i]}.png`);
        const imageUri = await metaplex.storage().upload(file);

        for (let xp = 10; xp <= 10; xp += 10) {
            const [mintAuth] = await web3.PublicKey.findProgramAddress(
                [Buffer.from('mint')],
                programId
            );

            const tokenMint = await token.createMint(
                connection,
                payer,
                payer.publicKey,
                payer.publicKey,
                0
            );

            mints.push(tokenMint.toBase58());

            const { uri } = await metaplex.nfts().uploadMetadata({
                name: assets[i],
                description: 'Gear that levels up your buildoor',
                image: imageUri,
                attributes: [
                    {
                        trait_type: 'xp',
                        value: `${xp}`,
                    },
                ],
            });

            const metadataPda = metaplex
                .nfts()
                .pdas()
                .metadata({ mint: tokenMint });

            const tokenMetadata = {
                name: assets[i],
                symbol: 'BLDRGEAR',
                uri: uri,
                sellerFeeBasisPoints: 0,
                creators: null,
                collection: null,
                uses: null,
            } as DataV2;

            const instruction = createCreateMetadataAccountV2Instruction(
                {
                    metadata: metadataPda,
                    mint: tokenMint,
                    mintAuthority: payer.publicKey,
                    payer: payer.publicKey,
                    updateAuthority: payer.publicKey,
                },
                {
                    createMetadataAccountArgsV2: {
                        data: tokenMetadata,
                        isMutable: true,
                    },
                }
            );

            const transaction = new web3.Transaction();
            transaction.add(instruction);

            const transactionSignature = await web3.sendAndConfirmTransaction(
                connection,
                transaction,
                [payer]
            );

            console.log(transactionSignature);

            await token.setAuthority(
                connection,
                payer,
                tokenMint,
                payer.publicKey,
                token.AuthorityType.MintTokens,
                mintAuth
            );
        }
        collection[assets[i]] = mints;
    }

    fs.writeFileSync('tokens/gear/cache.json', JSON.stringify(collection));
}

async function main() {
    const connection = new web3.Connection(web3.clusterApiUrl('devnet'));
    const payer = await initializeKeypair(connection);

    await createGear(
        connection,
        payer,
        new web3.PublicKey('6g6fFCUvii2zQM4yjSFT5aaGndm96eCFixxJqcP5xFWz'),
        ['koala_1', 'koala_2', 'koala_3', 'koala_4', 'koala_5']
    );
}

main()
    .then(() => {
        console.log('Finished successfully');
        process.exit(0);
    })
    .catch((error) => {
        console.log(error);
        process.exit(1);
    });
