import { Connection, Keypair, PublicKey, sendAndConfirmTransaction, SystemProgram, Transaction } from "@solana/web3.js";
import dotenv from "dotenv";
import bs58 from "bs58";
import { ASSOCIATED_TOKEN_PROGRAM_ID, createAssociatedTokenAccountInstruction, createInitializeMintInstruction, createMintToInstruction, createTransferInstruction, getAssociatedTokenAddressSync, TOKEN_PROGRAM_ID } from "@solana/spl-token";

dotenv.config();
const connection = new Connection("https://api.devnet.solana.com", "confirmed");
const secretKey = process.env.PAYER_SECRET_KEY!;
const secretKeyBuffer = bs58.decode(secretKey);
const payer = Keypair.fromSecretKey(secretKeyBuffer);
const mintAddress = Keypair.generate();
const recieverPublicKey = new PublicKey("3MsX76eGtDR2NqHN487aUD9FTQ5dxksUPMzKC4YKJ92V");
let payerAtaAddress: PublicKey;
let receiverAtaAddress: PublicKey;

// create a mint account
async function createMintAccount() {
    const block = await connection.getLatestBlockhash();
    const createAccountInstruction = SystemProgram.createAccount({
        fromPubkey: payer.publicKey,
        newAccountPubkey: mintAddress.publicKey,
        lamports: await connection.getMinimumBalanceForRentExemption(82),
        space: 82,
        programId: TOKEN_PROGRAM_ID,
    });

    const initializeMintInstruction = createInitializeMintInstruction(
        mintAddress.publicKey,
        0,
        payer.publicKey,
        payer.publicKey,
        TOKEN_PROGRAM_ID
    );

    const transaction = new Transaction();
    transaction.add(createAccountInstruction, initializeMintInstruction);
    transaction.recentBlockhash = block.blockhash;
    transaction.feePayer = payer.publicKey;
    transaction.lastValidBlockHeight = block.lastValidBlockHeight;

    const signature = await sendAndConfirmTransaction(
        connection,
        transaction,
        [payer, mintAddress]
    );

    console.log("Mint account created with address:", mintAddress.publicKey.toBase58());
    console.log("Transaction signature:", signature);

}

// create an ata for the payer
async function createPayerAta() {
    const block = await connection.getLatestBlockhash();

    payerAtaAddress = getAssociatedTokenAddressSync(
        mintAddress.publicKey,
        payer.publicKey,
        false,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
    );

    const createAtaInstruction = createAssociatedTokenAccountInstruction(
        payer.publicKey,
        payerAtaAddress,
        payer.publicKey,
        mintAddress.publicKey,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
    );

    const transaction = new Transaction();
    transaction.add(createAtaInstruction);
    transaction.recentBlockhash = block.blockhash;
    transaction.feePayer = payer.publicKey;
    transaction.lastValidBlockHeight = block.lastValidBlockHeight;

    const signature = await sendAndConfirmTransaction(
        connection,
        transaction,
        [payer]
    );

    console.log("Payer ATA created with address:", payerAtaAddress.toBase58());
    console.log("Transaction signature:", signature);
}

// mint some token to that ata of the payer
async function mintTokenToPayerAta() {
    const block = await connection.getLatestBlockhash();

    const mintToInstruction = createMintToInstruction(
        mintAddress.publicKey,
        payerAtaAddress,
        payer.publicKey,
        10,
        [],
        TOKEN_PROGRAM_ID
    );

    const transaction = new Transaction();
    transaction.add(mintToInstruction);
    transaction.recentBlockhash = block.blockhash;
    transaction.feePayer = payer.publicKey;
    transaction.lastValidBlockHeight = block.lastValidBlockHeight;

    const signature = await sendAndConfirmTransaction(
        connection,
        transaction,
        [payer]
    );

    console.log("Token minted to Payer ATA with address:", payerAtaAddress.toBase58());
    console.log("Transaction signature:", signature);
}

// create an ata for the receiver
async function createReceiverAta() {
    const block = await connection.getLatestBlockhash();    

    receiverAtaAddress = getAssociatedTokenAddressSync(
        mintAddress.publicKey,
        recieverPublicKey,
        false,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
    );

    const createAtaInstruction = createAssociatedTokenAccountInstruction(
        payer.publicKey,
        receiverAtaAddress,
        recieverPublicKey,
        mintAddress.publicKey,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
    );

    const transaction = new Transaction();
    transaction.add(createAtaInstruction);
    transaction.recentBlockhash = block.blockhash;
    transaction.feePayer = payer.publicKey;
    transaction.lastValidBlockHeight = block.lastValidBlockHeight;

    const signature = await sendAndConfirmTransaction(
        connection,
        transaction,
        [payer]
    );
    
    console.log("Receiver ATA created with address:", receiverAtaAddress.toBase58());
    console.log("Transaction signature:", signature);
}

// transfer some token from payer's ata to the receiver's ata
async function transferTokenToReceiverAta() {
    const block = await connection.getLatestBlockhash();

    const transferInstruction = createTransferInstruction(
        payerAtaAddress,
        receiverAtaAddress,
        payer.publicKey,
        5,
        [],
        TOKEN_PROGRAM_ID
    );

    const transaction = new Transaction();
    transaction.add(transferInstruction);
    transaction.recentBlockhash = block.blockhash;
    transaction.feePayer = payer.publicKey;
    transaction.lastValidBlockHeight = block.lastValidBlockHeight;

    const signature = await sendAndConfirmTransaction(
        connection,
        transaction,
        [payer]
    );

    console.log("Token transferred from Payer ATA to Receiver ATA");
    console.log("Transaction signature:", signature);
}

async function main() {
    await createMintAccount();
    await createPayerAta();
    await mintTokenToPayerAta();
    await createReceiverAta();
    await transferTokenToReceiverAta();
}
main();