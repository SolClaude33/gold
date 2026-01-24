import { 
  Connection, 
  PublicKey, 
  Keypair, 
  Transaction, 
  SystemProgram, 
  LAMPORTS_PER_SOL, 
  sendAndConfirmTransaction,
  VersionedTransaction,
  TransactionInstruction,
  ComputeBudgetProgram
} from "@solana/web3.js";
import { 
  TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
  getAssociatedTokenAddress, 
  createTransferInstruction, 
  getAccount, 
  getMint,
  createAssociatedTokenAccountInstruction,
  NATIVE_MINT,
  createSyncNativeInstruction,
  createCloseAccountInstruction
} from "@solana/spl-token";
import bs58 from "bs58";

const RPC_ENDPOINT = process.env.HELIUS_RPC_URL || process.env.SOLANA_RPC || "https://api.mainnet-beta.solana.com";
const JUPITER_GOLD_MINT = new PublicKey("GoLDppdjB1vDTPSGxyMJFqdnj134yH6Prg9eqsGDiw6A");
const WSOL_MINT = NATIVE_MINT;
const PUMPSWAP_PROGRAM_ID = new PublicKey("pAMMBay6oceH9fJKBRHGP5D4bD4sWpmSwMn52FMfXEA");
const PUMP_PROGRAM_ID = new PublicKey("6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P");
const BURN_ADDRESS = new PublicKey("1nc1nerator11111111111111111111111111111111");

const PUMP_FEE_RECIPIENT = new PublicKey("CebN5WGQ4jvEPvsVU4EoHEpgzq1VV7AbicfhtW4xC9iM");
const PUMP_GLOBAL = new PublicKey("4wTV1YmiEkRvAtNtsSGPtUrqRYQMe5SKy2uB4Jjaxnjf");
const PUMP_EVENT_AUTHORITY = new PublicKey("Ce6TQqeHC9p8KetsN6JsjHK7UTZk7nasjjnr7XxXp9F1");
const ASSOCIATED_TOKEN_PROGRAM_ID = new PublicKey("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL");
const RENT_SYSVAR = new PublicKey("SysvarRent111111111111111111111111111111111");
const PUMP_FEE_PROGRAM_ID = new PublicKey("pfeeUxB6jkeY1Hxd7CsFCAjcbHA9rWtchMGdZ6VojVZ");

const PUMP_CURVE_STATE_SIGNATURE = Buffer.from([0x17, 0xb7, 0xf8, 0x37, 0x60, 0xd8, 0xac, 0x60]);

interface BondingCurveState {
  virtualTokenReserves: bigint;
  virtualSolReserves: bigint;
  realTokenReserves: bigint;
  realSolReserves: bigint;
  tokenTotalSupply: bigint;
  complete: boolean;
  creator: PublicKey;
}

interface HolderInfo {
  address: string;
  balance: number;
  percentage: number;
}

interface DistributionResult {
  success: boolean;
  totalFeesClaimed: number;
  goldPurchased: number;
  goldDistributed: number;
  goldForMediumHolders: number;
  tokenBuyback: number;
  feesBurned: number;
  majorHolders: number;
  mediumHolders: number;
  txSignatures: string[];
  error?: string;
}

interface JupiterQuote {
  inputMint: string;
  outputMint: string;
  inAmount: string;
  outAmount: string;
  otherAmountThreshold: string;
  swapMode: string;
  slippageBps: number;
  routePlan: any[];
}

export class SolanaService {
  private connection: Connection;
  private creatorWallet: Keypair | null = null;
  private tokenMint: PublicKey | null = null;

  constructor() {
    this.connection = new Connection(RPC_ENDPOINT, "confirmed");
  }

  async initialize(overrideTokenAddress?: string): Promise<{ ready: boolean; error?: string }> {
    const privateKey = process.env.CREATOR_WALLET_PRIVATE_KEY;
    const tokenAddress = overrideTokenAddress || process.env.TOKEN_CONTRACT_ADDRESS;

    if (!privateKey) {
      return { ready: false, error: "CREATOR_WALLET_PRIVATE_KEY not configured" };
    }

    if (!tokenAddress) {
      return { ready: false, error: "TOKEN_CONTRACT_ADDRESS not configured" };
    }

    try {
      this.creatorWallet = Keypair.fromSecretKey(bs58.decode(privateKey));
      this.tokenMint = new PublicKey(tokenAddress);
      return { ready: true };
    } catch (e) {
      return { ready: false, error: "Invalid wallet private key or token address" };
    }
  }

  getWalletAddress(): string | null {
    return this.creatorWallet?.publicKey.toBase58() || null;
  }

  async getSOLBalance(): Promise<number> {
    if (!this.creatorWallet) return 0;
    const balance = await this.connection.getBalance(this.creatorWallet.publicKey);
    return balance / LAMPORTS_PER_SOL;
  }

  async getTokenHolders(minPercentage: number = 0.5): Promise<HolderInfo[]> {
    if (!this.tokenMint) {
      console.log("[Solana] Token mint not configured");
      return [];
    }

    try {
      const largestAccounts = await this.connection.getTokenLargestAccounts(this.tokenMint);
      
      const mintAccountInfo = await this.connection.getAccountInfo(this.tokenMint);
      const tokenProgramId = mintAccountInfo?.owner || TOKEN_PROGRAM_ID;
      const mintInfo = await getMint(this.connection, this.tokenMint, "confirmed", tokenProgramId);
      const totalSupply = Number(mintInfo.supply) / Math.pow(10, mintInfo.decimals);

      const holders: HolderInfo[] = [];
      
      for (const account of largestAccounts.value) {
        const balance = Number(account.amount) / Math.pow(10, mintInfo.decimals);
        const percentage = (balance / totalSupply) * 100;
        
        if (percentage >= minPercentage) {
          const accountInfo = await this.connection.getParsedAccountInfo(account.address);
          const parsed = accountInfo.value?.data as { parsed?: { info?: { owner?: string } } };
          const owner = parsed?.parsed?.info?.owner;
          
          if (owner) {
            holders.push({
              address: owner,
              balance,
              percentage,
            });
          }
        }
      }

      console.log(`[Solana] Found ${holders.length} holders with >=${minPercentage}% supply`);
      return holders;
    } catch (error) {
      console.error("[Solana] Error fetching token holders:", error);
      return [];
    }
  }

  async getHoldersByTier(majorMinPercentage: number = 0.5, mediumMinPercentage: number = 0.1): Promise<{ majorHolders: HolderInfo[]; mediumHolders: HolderInfo[] }> {
    if (!this.tokenMint) {
      console.log("[Solana] Token mint not configured");
      return { majorHolders: [], mediumHolders: [] };
    }

    try {
      const largestAccounts = await this.connection.getTokenLargestAccounts(this.tokenMint);
      
      const mintAccountInfo = await this.connection.getAccountInfo(this.tokenMint);
      const tokenProgramId = mintAccountInfo?.owner || TOKEN_PROGRAM_ID;
      const mintInfo = await getMint(this.connection, this.tokenMint, "confirmed", tokenProgramId);
      const totalSupply = Number(mintInfo.supply) / Math.pow(10, mintInfo.decimals);

      const majorHolders: HolderInfo[] = [];
      const mediumHolders: HolderInfo[] = [];
      
      for (const account of largestAccounts.value) {
        const balance = Number(account.amount) / Math.pow(10, mintInfo.decimals);
        const percentage = (balance / totalSupply) * 100;
        
        if (percentage >= mediumMinPercentage) {
          const accountInfo = await this.connection.getParsedAccountInfo(account.address);
          const parsed = accountInfo.value?.data as { parsed?: { info?: { owner?: string } } };
          const owner = parsed?.parsed?.info?.owner;
          
          if (owner) {
            const holder = { address: owner, balance, percentage };
            if (percentage >= majorMinPercentage) {
              majorHolders.push(holder);
            } else {
              mediumHolders.push(holder);
            }
          }
        }
      }

      console.log(`[Solana] Found ${majorHolders.length} major holders (>=${majorMinPercentage}%) and ${mediumHolders.length} medium holders (${mediumMinPercentage}%-${majorMinPercentage}%)`);
      return { majorHolders, mediumHolders };
    } catch (error) {
      console.error("[Solana] Error fetching token holders by tier:", error);
      return { majorHolders: [], mediumHolders: [] };
    }
  }

  async buybackToken(solAmount: number): Promise<{ success: boolean; tokenAmount: number; txSignature?: string; error?: string }> {
    if (!this.creatorWallet || !this.tokenMint || solAmount <= 0) {
      return { success: false, tokenAmount: 0, error: "Invalid wallet, token mint, or amount" };
    }

    try {
      console.log(`[Solana] Executing buyback: ${solAmount} SOL for GoldFunX token...`);

      const lamports = Math.floor(solAmount * LAMPORTS_PER_SOL);

      const quoteUrl = `https://public.jupiterapi.com/quote?inputMint=${WSOL_MINT.toBase58()}&outputMint=${this.tokenMint.toBase58()}&amount=${lamports}&slippageBps=1000`;
      
      const quoteResponse = await fetch(quoteUrl);
      if (!quoteResponse.ok) {
        throw new Error(`Jupiter quote failed: ${quoteResponse.statusText}`);
      }
      
      const quoteData: JupiterQuote = await quoteResponse.json();
      
      const mintAccountInfo = await this.connection.getAccountInfo(this.tokenMint);
      const tokenProgramId = mintAccountInfo?.owner || TOKEN_PROGRAM_ID;
      const mintInfo = await getMint(this.connection, this.tokenMint, "confirmed", tokenProgramId);
      const tokenAmount = Number(quoteData.outAmount) / Math.pow(10, mintInfo.decimals);
      console.log(`[Solana] Jupiter quote: ${solAmount} SOL -> ${tokenAmount} GoldFunX`);

      const swapResponse = await fetch("https://public.jupiterapi.com/swap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userPublicKey: this.creatorWallet.publicKey.toBase58(),
          quoteResponse: quoteData,
          wrapAndUnwrapSol: true,
          dynamicSlippage: { minBps: 200, maxBps: 1500 },
          prioritizationFeeLamports: {
            priorityLevelWithMaxLamports: {
              maxLamports: 1000000,
              priorityLevel: "high"
            }
          }
        })
      });

      if (!swapResponse.ok) {
        throw new Error(`Jupiter swap failed: ${swapResponse.statusText}`);
      }

      const swapData = await swapResponse.json();
      const swapTransactionBuf = Buffer.from(swapData.swapTransaction, "base64");
      const transaction = VersionedTransaction.deserialize(swapTransactionBuf);

      transaction.sign([this.creatorWallet]);

      let txSignature: string | undefined;
      let attempts = 0;
      const maxAttempts = 3;

      while (attempts < maxAttempts) {
        try {
          txSignature = await this.connection.sendRawTransaction(transaction.serialize(), {
            skipPreflight: false,
            maxRetries: 2
          });
          await this.connection.confirmTransaction(txSignature, "confirmed");
          break;
        } catch (err: any) {
          attempts++;
          if (attempts >= maxAttempts) {
            throw err;
          }
          console.log(`[Solana] Buyback attempt ${attempts} failed, retrying...`);
          await new Promise(r => setTimeout(r, 2000));
        }
      }

      console.log(`[Solana] Buyback successful: ${txSignature}`);
      return { success: true, tokenAmount, txSignature };
    } catch (error: any) {
      console.error("[Solana] Buyback error:", error.message);
      return { success: false, tokenAmount: 0, error: error.message };
    }
  }

  private derivePumpCreatorVault(creator: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("creator-vault"), creator.toBuffer()],
      PUMP_PROGRAM_ID
    );
  }

  private derivePumpSwapCreatorVault(creator: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("creator_vault"), creator.toBuffer()],
      PUMPSWAP_PROGRAM_ID
    );
  }

  private deriveBondingCurve(mint: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("bonding-curve"), mint.toBuffer()],
      PUMP_PROGRAM_ID
    );
  }

  async getBondingCurveState(mint: PublicKey): Promise<BondingCurveState | null> {
    try {
      const [bondingCurve] = this.deriveBondingCurve(mint);
      console.log(`[Solana] Fetching bonding curve: ${bondingCurve.toBase58()}`);
      
      const accountInfo = await this.connection.getAccountInfo(bondingCurve);
      
      if (!accountInfo) {
        console.log("[Solana] Bonding curve account not found");
        return null;
      }
      
      console.log(`[Solana] Bonding curve data length: ${accountInfo.data.length} bytes`);
      
      if (accountInfo.data.length < 49) {
        console.log("[Solana] Bonding curve data too short");
        return null;
      }

      const data = accountInfo.data;
      
      const signature = data.subarray(0, 8);
      if (!signature.equals(PUMP_CURVE_STATE_SIGNATURE)) {
        console.log(`[Solana] Invalid bonding curve signature: ${signature.toString('hex')}`);
        console.log(`[Solana] Expected: ${PUMP_CURVE_STATE_SIGNATURE.toString('hex')}`);
        return null;
      }

      // Bonding curve structure (150+ bytes):
      // 0-7: discriminator (8 bytes)
      // 8-15: virtualTokenReserves (8 bytes)
      // 16-23: virtualSolReserves (8 bytes)
      // 24-31: realTokenReserves (8 bytes)
      // 32-39: realSolReserves (8 bytes)
      // 40-47: tokenTotalSupply (8 bytes)
      // 48: complete (1 byte)
      // 49-80: creator (32 bytes) - this is the correct offset!
      
      let creator: PublicKey;
      if (accountInfo.data.length >= 81) {
        creator = new PublicKey(data.subarray(49, 81));
      } else {
        console.log(`[Solana] Bonding curve too short for creator field (${accountInfo.data.length} bytes), using default`);
        creator = this.creatorWallet?.publicKey || PublicKey.default;
      }

      const state = {
        virtualTokenReserves: data.readBigUInt64LE(8),
        virtualSolReserves: data.readBigUInt64LE(16),
        realTokenReserves: data.readBigUInt64LE(24),
        realSolReserves: data.readBigUInt64LE(32),
        tokenTotalSupply: data.readBigUInt64LE(40),
        complete: data[48] === 1,
        creator: creator,
      };
      
      console.log(`[Solana] Bonding curve state: virtualTokenReserves=${state.virtualTokenReserves}, virtualSolReserves=${state.virtualSolReserves}, complete=${state.complete}, creator=${state.creator.toBase58()}`);
      
      return state;
    } catch (error) {
      console.error("[Solana] Error fetching bonding curve state:", error);
      return null;
    }
  }

  async buyViaPumpfun(solAmount: number): Promise<{ success: boolean; tokenAmount: number; txSignature?: string; error?: string }> {
    if (!this.creatorWallet || !this.tokenMint || solAmount <= 0) {
      return { success: false, tokenAmount: 0, error: "Invalid wallet, token mint, or amount" };
    }

    try {
      console.log(`[Solana] Buying tokens via Pump.fun bonding curve: ${solAmount} SOL`);
      
      const balance = await this.connection.getBalance(this.creatorWallet.publicKey);
      const requiredLamports = Math.floor(solAmount * LAMPORTS_PER_SOL * 1.15);
      if (balance < requiredLamports) {
        const error = `Insufficient SOL balance: have ${balance / LAMPORTS_PER_SOL} SOL, need ~${requiredLamports / LAMPORTS_PER_SOL} SOL (including fees)`;
        console.log(`[Solana] ${error}`);
        return { success: false, tokenAmount: 0, error };
      }
      console.log(`[Solana] Token mint: ${this.tokenMint.toBase58()}`);

      const bondingCurveState = await this.getBondingCurveState(this.tokenMint);
      if (!bondingCurveState) {
        return { success: false, tokenAmount: 0, error: "Bonding curve not found - token may have migrated to AMM" };
      }

      if (bondingCurveState.complete) {
        return { success: false, tokenAmount: 0, error: "Bonding curve complete - token has migrated to AMM" };
      }

      const solLamports = BigInt(Math.floor(solAmount * LAMPORTS_PER_SOL));
      
      const tokenAmount = (solLamports * bondingCurveState.virtualTokenReserves) / 
                          (bondingCurveState.virtualSolReserves + solLamports);
      
      const slippageBps = BigInt(1000);
      const minTokenAmount = tokenAmount * (BigInt(10000) - slippageBps) / BigInt(10000);
      const maxSolCost = solLamports * (BigInt(10000) + slippageBps) / BigInt(10000);

      console.log(`[Solana] Pump.fun quote: ${solAmount} SOL -> ~${Number(tokenAmount) / 1e6} tokens (min: ${Number(minTokenAmount) / 1e6})`);
      console.log(`[Solana] Max SOL cost: ${Number(maxSolCost) / LAMPORTS_PER_SOL} SOL`);

      const [bondingCurve] = this.deriveBondingCurve(this.tokenMint);
      console.log(`[Solana] Bonding curve PDA: ${bondingCurve.toBase58()}`);
      
      const associatedBondingCurve = await getAssociatedTokenAddress(
        this.tokenMint,
        bondingCurve,
        true,
        TOKEN_2022_PROGRAM_ID
      );
      console.log(`[Solana] Associated bonding curve: ${associatedBondingCurve.toBase58()}`);
      
      const userTokenAccount = await getAssociatedTokenAddress(
        this.tokenMint,
        this.creatorWallet.publicKey,
        false,
        TOKEN_2022_PROGRAM_ID
      );
      console.log(`[Solana] User token account: ${userTokenAccount.toBase58()}`);

      const buyDiscriminator = Buffer.from([102, 6, 61, 18, 1, 218, 235, 234]);
      // Args: amount (u64), max_sol_cost (u64), track_volume (OptionBool: 0=None, 1=Some(false), 2=Some(true))
      const instructionData = Buffer.alloc(25);
      buyDiscriminator.copy(instructionData, 0);
      instructionData.writeBigUInt64LE(tokenAmount, 8);
      instructionData.writeBigUInt64LE(maxSolCost, 16);
      instructionData.writeUInt8(0, 24); // track_volume = None (don't track)

      const transaction = new Transaction();
      transaction.add(
        ComputeBudgetProgram.setComputeUnitLimit({ units: 400000 }),
        ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 100000 })
      );

      let needsAta = false;
      try {
        await getAccount(this.connection, userTokenAccount, "confirmed", TOKEN_2022_PROGRAM_ID);
        console.log("[Solana] User ATA exists");
      } catch {
        console.log("[Solana] User ATA does not exist, will be created by program");
        needsAta = true;
      }

      const [globalVolumeAccumulator] = PublicKey.findProgramAddressSync(
        [Buffer.from("global_volume_accumulator")],
        PUMP_PROGRAM_ID
      );
      console.log(`[Solana] Global volume accumulator: ${globalVolumeAccumulator.toBase58()}`);

      const [userVolumeAccumulator] = PublicKey.findProgramAddressSync(
        [Buffer.from("user_volume_accumulator"), this.creatorWallet.publicKey.toBuffer()],
        PUMP_PROGRAM_ID
      );
      console.log(`[Solana] User volume accumulator: ${userVolumeAccumulator.toBase58()}`);

      const [feeConfig] = PublicKey.findProgramAddressSync(
        [Buffer.from("fee_config"), PUMP_PROGRAM_ID.toBuffer()],
        PUMP_FEE_PROGRAM_ID
      );
      console.log(`[Solana] Fee config: ${feeConfig.toBase58()}`);

      const [creatorVault] = this.derivePumpCreatorVault(bondingCurveState.creator);
      console.log(`[Solana] Creator vault: ${creatorVault.toBase58()} (creator: ${bondingCurveState.creator.toBase58()})`);

      const buyInstruction = new TransactionInstruction({
        programId: PUMP_PROGRAM_ID,
        keys: [
          { pubkey: PUMP_GLOBAL, isSigner: false, isWritable: false },               // 0. global
          { pubkey: PUMP_FEE_RECIPIENT, isSigner: false, isWritable: true },         // 1. fee_recipient
          { pubkey: this.tokenMint, isSigner: false, isWritable: false },            // 2. mint
          { pubkey: bondingCurve, isSigner: false, isWritable: true },               // 3. bonding_curve
          { pubkey: associatedBondingCurve, isSigner: false, isWritable: true },     // 4. associated_bonding_curve
          { pubkey: userTokenAccount, isSigner: false, isWritable: true },           // 5. associated_user
          { pubkey: this.creatorWallet.publicKey, isSigner: true, isWritable: true },// 6. user
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },   // 7. system_program
          { pubkey: TOKEN_2022_PROGRAM_ID, isSigner: false, isWritable: false },     // 8. token_program
          { pubkey: creatorVault, isSigner: false, isWritable: true },               // 9. creator_vault
          { pubkey: PUMP_EVENT_AUTHORITY, isSigner: false, isWritable: false },      // 10. event_authority
          { pubkey: PUMP_PROGRAM_ID, isSigner: false, isWritable: false },           // 11. program
          { pubkey: globalVolumeAccumulator, isSigner: false, isWritable: false },   // 12. global_volume_accumulator (read-only per IDL)
          { pubkey: userVolumeAccumulator, isSigner: false, isWritable: true },      // 13. user_volume_accumulator
          { pubkey: feeConfig, isSigner: false, isWritable: false },                 // 14. fee_config
          { pubkey: PUMP_FEE_PROGRAM_ID, isSigner: false, isWritable: false },       // 15. fee_program
        ],
        data: instructionData,
      });

      transaction.add(buyInstruction);

      console.log("[Solana] Sending Pump.fun buy transaction...");
      const txSignature = await sendAndConfirmTransaction(
        this.connection,
        transaction,
        [this.creatorWallet],
        { commitment: "confirmed", skipPreflight: false }
      );

      const actualTokenAmount = Number(tokenAmount) / 1e6;
      console.log(`[Solana] Pump.fun buy successful: ${txSignature}`);
      return { success: true, tokenAmount: actualTokenAmount, txSignature };
    } catch (error: any) {
      console.error("[Solana] Pump.fun buy error:", error.message);
      if (error.logs) {
        console.error("[Solana] Transaction logs:", error.logs);
      }
      return { success: false, tokenAmount: 0, error: error.message };
    }
  }

  async sellViaPumpfun(tokenAmount: number): Promise<{ success: boolean; solAmount: number; txSignature?: string; error?: string }> {
    if (!this.creatorWallet || !this.tokenMint || tokenAmount <= 0) {
      return { success: false, solAmount: 0, error: "Invalid wallet, token mint, or amount" };
    }

    try {
      console.log(`[Solana] Selling ${tokenAmount} tokens via Pump.fun bonding curve`);

      const bondingCurveState = await this.getBondingCurveState(this.tokenMint);
      if (!bondingCurveState) {
        return { success: false, solAmount: 0, error: "Bonding curve not found - token may have migrated to AMM" };
      }

      if (bondingCurveState.complete) {
        return { success: false, solAmount: 0, error: "Bonding curve complete - token has migrated to AMM" };
      }

      const tokenAmountRaw = BigInt(Math.floor(tokenAmount * 1e6));
      
      const solOutput = (tokenAmountRaw * bondingCurveState.virtualSolReserves) / 
                        (bondingCurveState.virtualTokenReserves + tokenAmountRaw);
      
      const fee = solOutput / BigInt(100);
      const solAfterFee = solOutput - fee;
      
      const slippage = BigInt(10);
      const minSolOutput = solAfterFee - (solAfterFee * slippage / BigInt(100));

      console.log(`[Solana] Pump.fun sell quote: ${tokenAmount} tokens -> ~${Number(solAfterFee) / LAMPORTS_PER_SOL} SOL`);

      const [bondingCurve] = this.deriveBondingCurve(this.tokenMint);
      const associatedBondingCurve = await getAssociatedTokenAddress(
        this.tokenMint,
        bondingCurve,
        true,
        TOKEN_2022_PROGRAM_ID
      );
      const userTokenAccount = await getAssociatedTokenAddress(
        this.tokenMint,
        this.creatorWallet.publicKey,
        false,
        TOKEN_2022_PROGRAM_ID
      );

      const sellDiscriminator = Buffer.from([51, 230, 133, 164, 1, 127, 131, 173]);
      const instructionData = Buffer.alloc(24);
      sellDiscriminator.copy(instructionData, 0);
      instructionData.writeBigUInt64LE(tokenAmountRaw, 8);
      instructionData.writeBigUInt64LE(minSolOutput, 16);

      const transaction = new Transaction();
      transaction.add(
        ComputeBudgetProgram.setComputeUnitLimit({ units: 200000 }),
        ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 50000 })
      );

      const sellInstruction = new TransactionInstruction({
        programId: PUMP_PROGRAM_ID,
        keys: [
          { pubkey: PUMP_GLOBAL, isSigner: false, isWritable: false },
          { pubkey: PUMP_FEE_RECIPIENT, isSigner: false, isWritable: true },
          { pubkey: this.tokenMint, isSigner: false, isWritable: false },
          { pubkey: bondingCurve, isSigner: false, isWritable: true },
          { pubkey: associatedBondingCurve, isSigner: false, isWritable: true },
          { pubkey: userTokenAccount, isSigner: false, isWritable: true },
          { pubkey: this.creatorWallet.publicKey, isSigner: true, isWritable: true },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
          { pubkey: TOKEN_2022_PROGRAM_ID, isSigner: false, isWritable: false },
          { pubkey: PUMP_EVENT_AUTHORITY, isSigner: false, isWritable: false },
          { pubkey: PUMP_PROGRAM_ID, isSigner: false, isWritable: false },
        ],
        data: instructionData,
      });

      transaction.add(sellInstruction);

      const txSignature = await sendAndConfirmTransaction(
        this.connection,
        transaction,
        [this.creatorWallet],
        { commitment: "confirmed" }
      );

      const actualSolAmount = Number(solAfterFee) / LAMPORTS_PER_SOL;
      console.log(`[Solana] Pump.fun sell successful: ${txSignature}`);
      return { success: true, solAmount: actualSolAmount, txSignature };
    } catch (error: any) {
      console.error("[Solana] Pump.fun sell error:", error.message);
      return { success: false, solAmount: 0, error: error.message };
    }
  }

  async claimPumpfunFees(): Promise<{ success: boolean; amount: number; txSignature?: string; error?: string }> {
    if (!this.creatorWallet || !this.tokenMint) {
      return { success: false, amount: 0, error: "Wallet or token mint not initialized" };
    }

    try {
      console.log("[Solana] Claiming Pump.fun creator fees...");

      const creator = this.creatorWallet.publicKey;
      const [creatorVault, bump] = this.derivePumpCreatorVault(creator);
      
      console.log(`[Solana] Creator Vault PDA: ${creatorVault.toBase58()}`);

      const vaultInfo = await this.connection.getAccountInfo(creatorVault);
      
      if (!vaultInfo) {
        console.log("[Solana] Creator vault not found, checking PumpSwap...");
        return this.claimPumpSwapFees();
      }

      const rentExempt = await this.connection.getMinimumBalanceForRentExemption(0);
      const vaultBalance = (vaultInfo.lamports - rentExempt) / LAMPORTS_PER_SOL;
      
      if (vaultBalance <= 0) {
        console.log("[Solana] No fees in Pump.fun vault, checking PumpSwap...");
        return this.claimPumpSwapFees();
      }

      console.log(`[Solana] Creator vault balance: ${vaultBalance.toFixed(6)} SOL (claimable)`);

      const [eventAuthority] = PublicKey.findProgramAddressSync(
        [Buffer.from("__event_authority")],
        PUMP_PROGRAM_ID
      );

      const collectCreatorFeeIx = new TransactionInstruction({
        programId: PUMP_PROGRAM_ID,
        keys: [
          { pubkey: creator, isSigner: true, isWritable: true },
          { pubkey: creatorVault, isSigner: false, isWritable: true },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
          { pubkey: eventAuthority, isSigner: false, isWritable: false },
          { pubkey: PUMP_PROGRAM_ID, isSigner: false, isWritable: false },
        ],
        data: Buffer.from([20, 22, 86, 123, 198, 28, 219, 132]),
      });

      const transaction = new Transaction();
      transaction.add(
        ComputeBudgetProgram.setComputeUnitLimit({ units: 100000 }),
        ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 100000 }),
        collectCreatorFeeIx
      );

      const txSignature = await sendAndConfirmTransaction(
        this.connection,
        transaction,
        [this.creatorWallet],
        { commitment: "confirmed" }
      );

      console.log(`[Solana] Fees claimed successfully: ${txSignature}`);
      return { success: true, amount: vaultBalance, txSignature };
    } catch (error: any) {
      console.error("[Solana] Error claiming Pump.fun fees:", error.message);
      return { success: false, amount: 0, error: error.message };
    }
  }

  private async claimPumpSwapFees(): Promise<{ success: boolean; amount: number; txSignature?: string; error?: string }> {
    if (!this.creatorWallet) {
      return { success: false, amount: 0, error: "Wallet not initialized" };
    }

    try {
      console.log("[Solana] Checking PumpSwap creator fees...");

      const creator = this.creatorWallet.publicKey;
      const [creatorVaultAuth] = this.derivePumpSwapCreatorVault(creator);

      const creatorVaultAta = await getAssociatedTokenAddress(
        WSOL_MINT,
        creatorVaultAuth,
        true
      );

      let vaultBalance = 0;
      try {
        const vaultAccount = await getAccount(this.connection, creatorVaultAta);
        vaultBalance = Number(vaultAccount.amount) / LAMPORTS_PER_SOL;
      } catch {
        console.log("[Solana] PumpSwap creator vault not found or empty");
        return { success: true, amount: 0, error: "No fees to claim" };
      }

      if (vaultBalance === 0) {
        return { success: true, amount: 0, error: "No fees accumulated" };
      }

      console.log(`[Solana] PumpSwap vault balance: ${vaultBalance} SOL`);

      const creatorWsolAta = await getAssociatedTokenAddress(
        WSOL_MINT,
        this.creatorWallet.publicKey
      );

      const transaction = new Transaction();

      try {
        await getAccount(this.connection, creatorWsolAta);
      } catch {
        transaction.add(
          createAssociatedTokenAccountInstruction(
            this.creatorWallet.publicKey,
            creatorWsolAta,
            this.creatorWallet.publicKey,
            WSOL_MINT
          )
        );
      }

      const collectFeeIx = new TransactionInstruction({
        programId: PUMPSWAP_PROGRAM_ID,
        keys: [
          { pubkey: WSOL_MINT, isSigner: false, isWritable: false },
          { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
          { pubkey: creator, isSigner: true, isWritable: true },
          { pubkey: creatorVaultAuth, isSigner: false, isWritable: false },
          { pubkey: creatorVaultAta, isSigner: false, isWritable: true },
          { pubkey: creatorWsolAta, isSigner: false, isWritable: true },
        ],
        data: Buffer.from([0x0f]),
      });

      transaction.add(
        ComputeBudgetProgram.setComputeUnitLimit({ units: 150000 }),
        ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 50000 }),
        collectFeeIx,
        createCloseAccountInstruction(
          creatorWsolAta,
          this.creatorWallet.publicKey,
          this.creatorWallet.publicKey
        )
      );

      const txSignature = await sendAndConfirmTransaction(
        this.connection,
        transaction,
        [this.creatorWallet],
        { commitment: "confirmed" }
      );

      console.log(`[Solana] PumpSwap fees claimed: ${txSignature}`);
      return { success: true, amount: vaultBalance, txSignature };
    } catch (error: any) {
      console.error("[Solana] Error claiming PumpSwap fees:", error.message);
      return { success: false, amount: 0, error: error.message };
    }
  }

  async wrapSOL(amount: number): Promise<{ success: boolean; txSignature?: string; error?: string }> {
    if (!this.creatorWallet || amount <= 0) {
      return { success: false, error: "Invalid wallet or amount" };
    }

    try {
      const creatorWsolAta = await getAssociatedTokenAddress(
        WSOL_MINT,
        this.creatorWallet.publicKey
      );

      const transaction = new Transaction();

      try {
        await getAccount(this.connection, creatorWsolAta);
      } catch {
        transaction.add(
          createAssociatedTokenAccountInstruction(
            this.creatorWallet.publicKey,
            creatorWsolAta,
            this.creatorWallet.publicKey,
            WSOL_MINT
          )
        );
      }

      transaction.add(
        SystemProgram.transfer({
          fromPubkey: this.creatorWallet.publicKey,
          toPubkey: creatorWsolAta,
          lamports: Math.floor(amount * LAMPORTS_PER_SOL),
        }),
        createSyncNativeInstruction(creatorWsolAta)
      );

      const txSignature = await sendAndConfirmTransaction(
        this.connection,
        transaction,
        [this.creatorWallet],
        { commitment: "confirmed" }
      );

      return { success: true, txSignature };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async ensureGoldAta(): Promise<{ success: boolean; ata?: PublicKey; error?: string }> {
    if (!this.creatorWallet) {
      return { success: false, error: "Wallet not initialized" };
    }

    try {
      const goldAta = await getAssociatedTokenAddress(
        JUPITER_GOLD_MINT,
        this.creatorWallet.publicKey
      );

      try {
        await getAccount(this.connection, goldAta);
        return { success: true, ata: goldAta };
      } catch {
        const transaction = new Transaction();
        transaction.add(
          createAssociatedTokenAccountInstruction(
            this.creatorWallet.publicKey,
            goldAta,
            this.creatorWallet.publicKey,
            JUPITER_GOLD_MINT
          )
        );

        await sendAndConfirmTransaction(
          this.connection,
          transaction,
          [this.creatorWallet],
          { commitment: "confirmed" }
        );

        return { success: true, ata: goldAta };
      }
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async swapSOLForGold(solAmount: number): Promise<{ success: boolean; goldAmount: number; txSignature?: string; error?: string }> {
    if (!this.creatorWallet || solAmount <= 0) {
      return { success: false, goldAmount: 0, error: "Invalid wallet or amount" };
    }

    try {
      console.log(`[Solana] Swapping ${solAmount} SOL for $GOLD via Jupiter...`);

      const ataResult = await this.ensureGoldAta();
      if (!ataResult.success) {
        return { success: false, goldAmount: 0, error: `Failed to create GOLD ATA: ${ataResult.error}` };
      }

      const lamports = Math.floor(solAmount * LAMPORTS_PER_SOL);

      const quoteUrl = `https://public.jupiterapi.com/quote?inputMint=${WSOL_MINT.toBase58()}&outputMint=${JUPITER_GOLD_MINT.toBase58()}&amount=${lamports}&slippageBps=100`;
      
      const quoteResponse = await fetch(quoteUrl);
      if (!quoteResponse.ok) {
        throw new Error(`Jupiter quote failed: ${quoteResponse.statusText}`);
      }
      
      const quoteData: JupiterQuote = await quoteResponse.json();
      
      const goldMintInfo = await getMint(this.connection, JUPITER_GOLD_MINT);
      const goldAmount = Number(quoteData.outAmount) / Math.pow(10, goldMintInfo.decimals);
      console.log(`[Solana] Jupiter quote: ${solAmount} SOL -> ${goldAmount} $GOLD`);

      const swapResponse = await fetch("https://public.jupiterapi.com/swap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userPublicKey: this.creatorWallet.publicKey.toBase58(),
          quoteResponse: quoteData,
          wrapAndUnwrapSol: true,
          dynamicSlippage: { minBps: 50, maxBps: 300 },
          prioritizationFeeLamports: {
            priorityLevelWithMaxLamports: {
              maxLamports: 1000000,
              priorityLevel: "high"
            }
          }
        })
      });

      if (!swapResponse.ok) {
        throw new Error(`Jupiter swap failed: ${swapResponse.statusText}`);
      }

      const swapData = await swapResponse.json();
      const swapTransactionBuf = Buffer.from(swapData.swapTransaction, "base64");
      const transaction = VersionedTransaction.deserialize(swapTransactionBuf);

      transaction.sign([this.creatorWallet]);

      let txSignature: string | undefined;
      let attempts = 0;
      const maxAttempts = 3;

      while (attempts < maxAttempts) {
        try {
          txSignature = await this.connection.sendRawTransaction(transaction.serialize(), {
            skipPreflight: false,
            maxRetries: 2
          });
          await this.connection.confirmTransaction(txSignature, "confirmed");
          break;
        } catch (err: any) {
          attempts++;
          if (attempts >= maxAttempts) {
            throw err;
          }
          console.log(`[Solana] Swap attempt ${attempts} failed, retrying...`);
          await new Promise(r => setTimeout(r, 2000));
        }
      }

      console.log(`[Solana] Swap successful: ${txSignature}`);
      return { success: true, goldAmount, txSignature };
    } catch (error: any) {
      console.error("[Solana] Jupiter swap error:", error.message);
      return { success: false, goldAmount: 0, error: error.message };
    }
  }

  async distributeGold(
    holders: HolderInfo[],
    totalGoldAmount: number
  ): Promise<{ success: boolean; distributed: number; txSignatures: string[]; error?: string }> {
    if (!this.creatorWallet || holders.length === 0 || totalGoldAmount <= 0) {
      return { success: false, distributed: 0, txSignatures: [], error: "Invalid parameters" };
    }

    try {
      console.log(`[Solana] Distributing ${totalGoldAmount} $GOLD to ${holders.length} holders...`);

      const totalPercentage = holders.reduce((sum, h) => sum + h.percentage, 0);
      const txSignatures: string[] = [];
      let distributed = 0;

      const goldMintInfo = await getMint(this.connection, JUPITER_GOLD_MINT);
      const creatorGoldAta = await getAssociatedTokenAddress(
        JUPITER_GOLD_MINT,
        this.creatorWallet.publicKey
      );

      let creatorGoldBalance = 0;
      try {
        const account = await getAccount(this.connection, creatorGoldAta);
        creatorGoldBalance = Number(account.amount) / Math.pow(10, goldMintInfo.decimals);
      } catch {
        console.log("[Solana] Creator GOLD ATA not found");
        return { success: false, distributed: 0, txSignatures: [], error: "No GOLD balance to distribute" };
      }

      if (creatorGoldBalance < totalGoldAmount) {
        console.log(`[Solana] Insufficient GOLD balance: ${creatorGoldBalance} < ${totalGoldAmount}`);
        return { success: false, distributed: 0, txSignatures: [], error: "Insufficient GOLD balance" };
      }

      for (const holder of holders) {
        try {
          const share = (holder.percentage / totalPercentage) * totalGoldAmount;
          const shareAmount = BigInt(Math.floor(share * Math.pow(10, goldMintInfo.decimals)));

          if (shareAmount <= BigInt(0)) continue;

          const holderPubkey = new PublicKey(holder.address);
          const holderGoldAta = await getAssociatedTokenAddress(JUPITER_GOLD_MINT, holderPubkey);

          const transaction = new Transaction();
          transaction.add(
            ComputeBudgetProgram.setComputeUnitLimit({ units: 100000 }),
            ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 25000 })
          );

          try {
            await getAccount(this.connection, holderGoldAta);
          } catch {
            transaction.add(
              createAssociatedTokenAccountInstruction(
                this.creatorWallet.publicKey,
                holderGoldAta,
                holderPubkey,
                JUPITER_GOLD_MINT
              )
            );
          }

          transaction.add(
            createTransferInstruction(
              creatorGoldAta,
              holderGoldAta,
              this.creatorWallet.publicKey,
              shareAmount
            )
          );

          const txSignature = await sendAndConfirmTransaction(
            this.connection,
            transaction,
            [this.creatorWallet],
            { commitment: "confirmed" }
          );

          txSignatures.push(txSignature);
          distributed += share;
          console.log(`[Solana] Sent ${share.toFixed(6)} $GOLD to ${holder.address.slice(0,8)}...`);
        } catch (error: any) {
          console.error(`[Solana] Failed to send to ${holder.address}: ${error.message}`);
        }
      }

      console.log(`[Solana] Distribution complete: ${distributed.toFixed(6)} $GOLD to ${txSignatures.length} holders`);
      return { success: true, distributed, txSignatures };
    } catch (error: any) {
      console.error("[Solana] Distribution error:", error.message);
      return { success: false, distributed: 0, txSignatures: [], error: error.message };
    }
  }

  async burnSOL(amount: number): Promise<{ success: boolean; txSignature?: string; error?: string }> {
    if (!this.creatorWallet || amount <= 0) {
      return { success: false, error: "Invalid wallet or amount" };
    }

    try {
      console.log(`[Solana] Burning ${amount} SOL...`);

      const transaction = new Transaction();
      transaction.add(
        ComputeBudgetProgram.setComputeUnitLimit({ units: 50000 }),
        ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 25000 }),
        SystemProgram.transfer({
          fromPubkey: this.creatorWallet.publicKey,
          toPubkey: BURN_ADDRESS,
          lamports: Math.floor(amount * LAMPORTS_PER_SOL),
        })
      );

      const txSignature = await sendAndConfirmTransaction(
        this.connection,
        transaction,
        [this.creatorWallet],
        { commitment: "confirmed" }
      );

      console.log(`[Solana] Burn successful: ${txSignature}`);
      return { success: true, txSignature };
    } catch (error: any) {
      console.error("[Solana] Burn error:", error.message);
      return { success: false, error: error.message };
    }
  }

  async executeDistribution(config: {
    majorHoldersPercentage: number;
    mediumHoldersPercentage: number;
    buybackPercentage: number;
    majorMinPercentage: number;
    mediumMinPercentage: number;
  }): Promise<DistributionResult> {
    const initResult = await this.initialize();
    if (!initResult.ready) {
      return {
        success: false,
        totalFeesClaimed: 0,
        goldPurchased: 0,
        goldDistributed: 0,
        goldForMediumHolders: 0,
        tokenBuyback: 0,
        feesBurned: 0,
        majorHolders: 0,
        mediumHolders: 0,
        txSignatures: [],
        error: initResult.error,
      };
    }

    const txSignatures: string[] = [];

    const balanceBefore = await this.getSOLBalance();
    console.log(`[Solana] Wallet balance before claim: ${balanceBefore} SOL`);

    const claimResult = await this.claimPumpfunFees();
    if (claimResult.txSignature) txSignatures.push(claimResult.txSignature);
    
    if (!claimResult.success || claimResult.amount === 0) {
      return {
        success: false,
        totalFeesClaimed: 0,
        goldPurchased: 0,
        goldDistributed: 0,
        goldForMediumHolders: 0,
        tokenBuyback: 0,
        feesBurned: 0,
        majorHolders: 0,
        mediumHolders: 0,
        txSignatures,
        error: claimResult.error || "No fees to claim",
      };
    }

    const balanceAfter = await this.getSOLBalance();
    const actualFeesReceived = balanceAfter - balanceBefore;
    console.log(`[Solana] Wallet balance after claim: ${balanceAfter} SOL`);
    console.log(`[Solana] Actual fees received: ${actualFeesReceived} SOL (vault reported: ${claimResult.amount} SOL)`);

    const totalFees = Math.max(actualFeesReceived, 0);
    
    if (totalFees <= 0) {
      console.log("[Solana] No positive fees received after transaction costs. Skipping distribution to protect wallet balance.");
      return {
        success: false,
        totalFeesClaimed: 0,
        goldPurchased: 0,
        goldDistributed: 0,
        goldForMediumHolders: 0,
        tokenBuyback: 0,
        feesBurned: 0,
        majorHolders: 0,
        mediumHolders: 0,
        txSignatures,
        error: "Fees collected were offset by transaction costs. No distribution performed.",
      };
    }

    if (config.majorHoldersPercentage < 0 || config.mediumHoldersPercentage < 0 || config.buybackPercentage < 0) {
      console.log("[Solana] Invalid config: percentages cannot be negative");
      return {
        success: false,
        totalFeesClaimed: totalFees,
        goldPurchased: 0,
        goldDistributed: 0,
        goldForMediumHolders: 0,
        tokenBuyback: 0,
        feesBurned: 0,
        majorHolders: 0,
        mediumHolders: 0,
        txSignatures,
        error: "Invalid config: percentages cannot be negative",
      };
    }

    const percentageSum = config.majorHoldersPercentage + config.mediumHoldersPercentage + config.buybackPercentage;
    if (percentageSum !== 100) {
      console.log(`[Solana] Invalid config: percentages sum to ${percentageSum}% (must be exactly 100%)`);
      return {
        success: false,
        totalFeesClaimed: totalFees,
        goldPurchased: 0,
        goldDistributed: 0,
        goldForMediumHolders: 0,
        tokenBuyback: 0,
        feesBurned: 0,
        majorHolders: 0,
        mediumHolders: 0,
        txSignatures,
        error: `Invalid config: percentages sum to ${percentageSum}% (must be exactly 100%)`,
      };
    }

    const majorPortion = totalFees * (config.majorHoldersPercentage / 100);
    const mediumPortion = totalFees * (config.mediumHoldersPercentage / 100);
    const buybackPortion = totalFees * (config.buybackPercentage / 100);

    console.log(`[Solana] Distribution: ${majorPortion.toFixed(4)} SOL (${config.majorHoldersPercentage}%) major, ${mediumPortion.toFixed(4)} SOL (${config.mediumHoldersPercentage}%) medium, ${buybackPortion.toFixed(4)} SOL (${config.buybackPercentage}%) buyback`);

    const { majorHolders, mediumHolders } = await this.getHoldersByTier(config.majorMinPercentage, config.mediumMinPercentage);
    
    if (majorHolders.length === 0 && mediumHolders.length === 0) {
      return {
        success: false,
        totalFeesClaimed: totalFees,
        goldPurchased: 0,
        goldDistributed: 0,
        goldForMediumHolders: 0,
        tokenBuyback: 0,
        feesBurned: 0,
        majorHolders: 0,
        mediumHolders: 0,
        txSignatures,
        error: "No qualifying holders found",
      };
    }

    let goldDistributed = 0;
    let goldForMediumHolders = 0;
    let totalGoldPurchased = 0;
    let majorSwapFailed = false;
    let mediumSwapFailed = false;
    let buybackFailed = false;

    if (majorHolders.length > 0 && majorPortion > 0) {
      const swapResult = await this.swapSOLForGold(majorPortion);
      if (swapResult.txSignature) txSignatures.push(swapResult.txSignature);
      
      if (swapResult.success) {
        totalGoldPurchased += swapResult.goldAmount;
        const distributeResult = await this.distributeGold(majorHolders, swapResult.goldAmount);
        txSignatures.push(...distributeResult.txSignatures);
        goldDistributed = distributeResult.distributed;
      } else {
        majorSwapFailed = true;
        console.error(`[Solana] Major holders swap failed: ${swapResult.error}`);
      }
    }

    if (mediumHolders.length > 0 && mediumPortion > 0) {
      const swapResult = await this.swapSOLForGold(mediumPortion);
      if (swapResult.txSignature) txSignatures.push(swapResult.txSignature);
      
      if (swapResult.success) {
        totalGoldPurchased += swapResult.goldAmount;
        const distributeResult = await this.distributeGold(mediumHolders, swapResult.goldAmount);
        txSignatures.push(...distributeResult.txSignatures);
        goldForMediumHolders = distributeResult.distributed;
      } else {
        mediumSwapFailed = true;
        console.error(`[Solana] Medium holders swap failed: ${swapResult.error}`);
      }
    }

    let tokenBuyback = 0;
    if (buybackPortion > 0) {
      const buybackResult = await this.buybackToken(buybackPortion);
      if (buybackResult.txSignature) txSignatures.push(buybackResult.txSignature);
      if (buybackResult.success) {
        tokenBuyback = buybackResult.tokenAmount;
      } else {
        buybackFailed = true;
        console.error(`[Solana] Buyback failed: ${buybackResult.error}`);
      }
    }

    const requiredMajorSuccess = majorHolders.length > 0 && majorPortion > 0;
    const requiredMediumSuccess = mediumHolders.length > 0 && mediumPortion > 0;

    const majorOk = !requiredMajorSuccess || (requiredMajorSuccess && !majorSwapFailed);
    const mediumOk = !requiredMediumSuccess || (requiredMediumSuccess && !mediumSwapFailed);

    if (!majorOk || !mediumOk) {
      const failedLegs: string[] = [];
      if (!majorOk) failedLegs.push("major holders");
      if (!mediumOk) failedLegs.push("medium holders");
      
      console.error(`[Solana] Distribution failed for: ${failedLegs.join(", ")}`);
      
      return {
        success: false,
        totalFeesClaimed: totalFees,
        goldPurchased: totalGoldPurchased,
        goldDistributed,
        goldForMediumHolders,
        tokenBuyback,
        feesBurned: 0,
        majorHolders: majorHolders.length,
        mediumHolders: mediumHolders.length,
        txSignatures,
        error: `Distribution failed for: ${failedLegs.join(", ")}. Fees may remain in wallet for retry.`,
      };
    }

    if (buybackFailed) {
      console.log(`[Solana] Buyback failed but distribution to holders was successful`);
    }

    return {
      success: true,
      totalFeesClaimed: totalFees,
      goldPurchased: totalGoldPurchased,
      goldDistributed,
      goldForMediumHolders,
      tokenBuyback,
      feesBurned: 0,
      majorHolders: majorHolders.length,
      mediumHolders: mediumHolders.length,
      txSignatures,
    };
  }

  async testBuyback(solAmount: number): Promise<{ success: boolean; tokenAmount: number; txSignature?: string; error?: string }> {
    const initResult = await this.initialize();
    if (!initResult.ready) {
      return { success: false, tokenAmount: 0, error: initResult.error };
    }
    
    console.log(`[Solana] Test buyback: ${solAmount} SOL for GoldFunX token...`);
    
    console.log(`[Solana] Trying Pump.fun bonding curve first...`);
    const pumpResult = await this.buyViaPumpfun(solAmount);
    if (pumpResult.success) {
      return pumpResult;
    }
    
    console.log(`[Solana] Pump.fun failed (${pumpResult.error}), trying Jupiter...`);
    return await this.buybackToken(solAmount);
  }

  async sellToken(tokenAmount: number): Promise<{ success: boolean; solAmount: number; txSignature?: string; error?: string }> {
    const initResult = await this.initialize();
    if (!initResult.ready || !this.tokenMint) {
      return { success: false, solAmount: 0, error: initResult.error || "Token mint not configured" };
    }

    console.log(`[Solana] Selling ${tokenAmount} GoldFunX tokens for SOL...`);
    
    console.log(`[Solana] Trying Pump.fun bonding curve first...`);
    const pumpResult = await this.sellViaPumpfun(tokenAmount);
    if (pumpResult.success) {
      return pumpResult;
    }
    
    console.log(`[Solana] Pump.fun failed (${pumpResult.error}), trying Jupiter...`);

    try {

      const tokenMintInfo = await getMint(
        this.connection,
        this.tokenMint,
        "confirmed",
        TOKEN_2022_PROGRAM_ID
      );
      const tokenDecimals = tokenMintInfo.decimals;
      const tokenAmountRaw = Math.floor(tokenAmount * Math.pow(10, tokenDecimals));

      const creatorTokenAta = await getAssociatedTokenAddress(
        this.tokenMint,
        this.creatorWallet!.publicKey,
        false,
        TOKEN_2022_PROGRAM_ID
      );

      let tokenBalance = 0;
      try {
        const account = await getAccount(this.connection, creatorTokenAta, "confirmed", TOKEN_2022_PROGRAM_ID);
        tokenBalance = Number(account.amount) / Math.pow(10, tokenDecimals);
      } catch {
        return { success: false, solAmount: 0, error: "No token balance found" };
      }

      if (tokenBalance < tokenAmount) {
        return { success: false, solAmount: 0, error: `Insufficient balance: ${tokenBalance} < ${tokenAmount}` };
      }

      const quoteUrl = `https://public.jupiterapi.com/quote?inputMint=${this.tokenMint.toBase58()}&outputMint=${WSOL_MINT.toBase58()}&amount=${tokenAmountRaw}&slippageBps=500`;
      
      const quoteResponse = await fetch(quoteUrl);
      if (!quoteResponse.ok) {
        throw new Error(`Jupiter quote failed: ${quoteResponse.statusText}`);
      }
      
      const quoteData: JupiterQuote = await quoteResponse.json();
      const solAmount = Number(quoteData.outAmount) / LAMPORTS_PER_SOL;
      console.log(`[Solana] Jupiter quote: ${tokenAmount} GoldFunX -> ${solAmount} SOL`);

      const swapResponse = await fetch("https://public.jupiterapi.com/swap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userPublicKey: this.creatorWallet!.publicKey.toBase58(),
          quoteResponse: quoteData,
          wrapAndUnwrapSol: true,
          dynamicSlippage: { minBps: 100, maxBps: 500 },
          prioritizationFeeLamports: {
            priorityLevelWithMaxLamports: {
              maxLamports: 1000000,
              priorityLevel: "high"
            }
          }
        })
      });

      if (!swapResponse.ok) {
        throw new Error(`Jupiter swap failed: ${swapResponse.statusText}`);
      }

      const swapData = await swapResponse.json();
      const swapTransactionBuf = Buffer.from(swapData.swapTransaction, "base64");
      const transaction = VersionedTransaction.deserialize(swapTransactionBuf);

      transaction.sign([this.creatorWallet!]);

      let txSignature: string | undefined;
      let attempts = 0;
      const maxAttempts = 3;

      while (attempts < maxAttempts) {
        try {
          txSignature = await this.connection.sendRawTransaction(transaction.serialize(), {
            skipPreflight: false,
            maxRetries: 2
          });
          await this.connection.confirmTransaction(txSignature, "confirmed");
          break;
        } catch (err: any) {
          attempts++;
          if (attempts >= maxAttempts) {
            throw err;
          }
          console.log(`[Solana] Sell attempt ${attempts} failed, retrying...`);
          await new Promise(r => setTimeout(r, 2000));
        }
      }

      console.log(`[Solana] Sell successful: ${txSignature}`);
      return { success: true, solAmount, txSignature };
    } catch (error: any) {
      console.error("[Solana] Sell error:", error.message);
      return { success: false, solAmount: 0, error: error.message };
    }
  }

  async getTokenBalance(): Promise<number> {
    if (!this.creatorWallet || !this.tokenMint) {
      return 0;
    }

    try {
      const tokenMintInfo = await getMint(
        this.connection,
        this.tokenMint,
        "confirmed",
        TOKEN_2022_PROGRAM_ID
      );
      const creatorTokenAta = await getAssociatedTokenAddress(
        this.tokenMint,
        this.creatorWallet.publicKey,
        false,
        TOKEN_2022_PROGRAM_ID
      );
      const account = await getAccount(this.connection, creatorTokenAta, "confirmed", TOKEN_2022_PROGRAM_ID);
      return Number(account.amount) / Math.pow(10, tokenMintInfo.decimals);
    } catch {
      return 0;
    }
  }
}

export const solanaService = new SolanaService();
