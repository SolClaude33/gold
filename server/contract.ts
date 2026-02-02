// EVM Contract Reader Service
// Reads data from tax processor contract on BNB Smart Chain (BSC)
// Using viem (same approach as umamusume project)

import { createPublicClient, http, formatEther, type PublicClient } from "viem";
import { bsc } from "viem/chains";

const TOKEN_ADDRESS = "0xdCCf9Ac19362C6d60e69A196fC6351C4A0887777";
const TAX_PROCESSOR_ADDRESS = "0xF7e36953aEDF448cbB9cE5fA123742e3543A82D8";

// ABI updated for new token contract (dashboard reads quote buckets)
const TAX_PROCESSOR_ABI = [
  {
    "inputs": [],
    "name": "quoteFounder",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "quoteHolder",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

interface ContractData {
  fundsBalance: string;
  feesConvertedToGold: string;
  liquidityBalance: string;
  tokenAddress: string;
  taxProcessorAddress: string;
}

export async function getContractData(): Promise<ContractData> {
  try {
    console.log("[Contract] Initializing viem client for BSC...");
    
    // Create public client for BSC Mainnet (same as umamusume)
    const publicClient: PublicClient = createPublicClient({
      chain: bsc,
      transport: http(process.env.EVM_RPC_URL || "https://bsc-dataseed1.binance.org"),
    });

    console.log("[Contract] Reading from Token contract:", TAX_PROCESSOR_ADDRESS);

    // Read quote buckets from token contract.
    // Dashboard mapping:
    // - quoteFounder() holds the combined quote bucket for founder/fees split
    //   We split it into:
    //   - fundsBalance (Treasury 10%)
    //   - feesConvertedToGold (75%)
    // - liquidityBalance (15% card) -> quoteHolder()
    const [quoteFounder, quoteHolder] = await Promise.all([
      publicClient.readContract({
        address: TAX_PROCESSOR_ADDRESS as `0x${string}`,
        abi: TAX_PROCESSOR_ABI,
        functionName: "quoteFounder",
      }).catch((error: any) => {
        console.log("[Contract] Error reading quoteFounder:", error?.message || String(error));
        return 0n;
      }),
      publicClient.readContract({
        address: TAX_PROCESSOR_ADDRESS as `0x${string}`,
        abi: TAX_PROCESSOR_ABI,
        functionName: "quoteHolder",
      }).catch((error: any) => {
        console.log("[Contract] Error reading quoteHolder:", error?.message || String(error));
        return 0n;
      })
    ]);

    // Split quoteFounder into 75% (fees converted to gold) + 10% (treasury)
    // NOTE: quoteFounder represents the combined (75 + 10) bucket, so we split by ratio.
    // Treasury share = 10 / (75 + 10) = 10/85
    const treasuryWei = (quoteFounder * 10n) / 85n;
    const goldWei = quoteFounder - treasuryWei;

    // Convert from wei to BNB using formatEther
    const fundsBalance = formatEther(treasuryWei);
    const feesConvertedToGold = formatEther(goldWei);
    const liquidityBalance = formatEther(quoteHolder);

    console.log("[Contract] Successfully read contract data:", {
      fundsBalance,
      feesConvertedToGold,
      liquidityBalance,
      quoteFounderRaw: quoteFounder.toString(),
      quoteHolderRaw: quoteHolder.toString(),
    });

    return {
      fundsBalance,
      feesConvertedToGold,
      liquidityBalance,
      tokenAddress: TOKEN_ADDRESS,
      taxProcessorAddress: TAX_PROCESSOR_ADDRESS,
    };
  } catch (error: any) {
    console.log("[Contract] Error reading contract data:", error?.message || String(error));
    console.log("[Contract] Error stack:", error?.stack);
    
    // Return zeros if contract read fails
    return {
      fundsBalance: "0",
      feesConvertedToGold: "0",
      liquidityBalance: "0",
      tokenAddress: TOKEN_ADDRESS,
      taxProcessorAddress: TAX_PROCESSOR_ADDRESS,
    };
  }
}

// Keep formatTokenAmount for backwards compatibility (though we use formatEther now)
export function formatTokenAmount(weiAmount: string, decimals: number = 18): string {
  try {
    const cleanAmount = weiAmount.startsWith("0x") ? weiAmount.slice(2) : weiAmount;
    if (!cleanAmount || cleanAmount === "0") return "0";
    
    const amount = BigInt("0x" + cleanAmount);
    const divisor = BigInt(10 ** decimals);
    const whole = amount / divisor;
    const remainder = amount % divisor;
    
    const remainderStr = remainder.toString().padStart(decimals, "0");
    const trimmedRemainder = remainderStr.replace(/0+$/, "");
    
    return trimmedRemainder ? `${whole}.${trimmedRemainder}` : whole.toString();
  } catch (error) {
    console.error("[Contract] Error formatting amount:", error);
    return "0";
  }
}
