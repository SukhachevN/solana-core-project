import { token } from '@metaplex-foundation/js';
import { BN, Program } from '@project-serum/anchor';
import { PublicKey } from '@solana/web3.js';
import { AnchorNftStaking } from './anchor_nft_staking';
import { PROGRAM_ID } from './constants';

export async function getStakeAccount(
    program: any,
    user: PublicKey,
    tokenAccount: PublicKey
): Promise<StakeAccount> {
    console.log(program.programId);
    const [pda] = PublicKey.findProgramAddressSync(
        [user.toBuffer(), tokenAccount.toBuffer()],
        PROGRAM_ID
    );
    let account;
    try {
        account = await program.account.userStakeInfo.fetch(pda);
    } catch (error) {
        console.log(error);
    }

    return new StakeAccount(account);
}

export class StakeAccount {
    tokenAccount: PublicKey;
    stakeStartTime: BN;
    lastStakeRedeem: BN;
    stakeState: { staked: boolean; unstaked: boolean };
    isInitialized: boolean;

    constructor(params: {
        tokenAccount: PublicKey;
        stakeStartTime: BN;
        lastStakeRedeem: BN;
        stakeState: { staked: boolean; unstaked: boolean };
        isInitialized: boolean;
    }) {
        this.tokenAccount = params.tokenAccount;
        this.stakeStartTime = params.stakeStartTime;
        this.lastStakeRedeem = params.lastStakeRedeem;
        this.stakeState = params.stakeState;
        this.isInitialized = params.isInitialized;
    }

    daysStaked(): number {
        const seconds = new BN(Date.now() / 1000)
            .sub(this.stakeStartTime)
            .toNumber();

        return seconds / (24 * 60 * 60);
    }

    claimable(): number {
        const seconds = new BN(Date.now() / 1000)
            .sub(this.lastStakeRedeem)
            .toNumber();

        return 10 * (seconds / (24 * 60 * 60));
    }
}
