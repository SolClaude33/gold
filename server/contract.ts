// EVM Contract Reader Service
// Reads data from tax processor contract on BNB Smart Chain (BSC)

const TOKEN_ADDRESS = "0xdCCf9Ac19362C6d60e69A196fC6351C4A0887777";
const TAX_PROCESSOR_ADDRESS = "0xF7e36953aEDF448cbB9cE5fA123742e3543A82D8";

// ABI for reading balances from tax processor
const TAX_PROCESSOR_ABI = [
  {
    "inputs": [],
    "name": "funds",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "liquidity",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }
];

interface ContractData {
  fundsBalance: string;
  liquidityBalance: string;
  tokenAddress: string;
  taxProcessorAddress: string;
}

export async function getContractData(): Promise<ContractData> {
  try {
    // BNB Smart Chain (BSC) RPC
    const rpcUrl = process.env.EVM_RPC_URL || "https://bsc-dataseed1.binance.org";
    
    // Try to use ethers if available
    let ethers: any;
    try {
      ethers = await import("ethers");
    } catch {
      console.log("[Contract] ethers not available, using RPC calls");
    }

    if (ethers && ethers.JsonRpcProvider) {
      try {
        const provider = new ethers.JsonRpcProvider(rpcUrl);
        const contract = new ethers.Contract(TAX_PROCESSOR_ADDRESS, TAX_PROCESSOR_ABI, provider);
        
        const [funds, liquidity] = await Promise.all([
          contract.funds().catch(() => 0n),
          contract.liquidity().catch(() => 0n)
        ]);

        return {
          fundsBalance: formatTokenAmount(funds.toString(), 18),
          liquidityBalance: formatTokenAmount(liquidity.toString(), 18),
          tokenAddress: TOKEN_ADDRESS,
          taxProcessorAddress: TAX_PROCESSOR_ADDRESS,
        };
      } catch (error: any) {
        console.log("[Contract] Error with ethers, using RPC fallback:", error?.message || String(error));
        // Continue to fallback RPC method
      }
    }

    // Fallback: Direct RPC calls using function selectors
    // Function selector = first 4 bytes of keccak256("functionName()")
    let fundsSelector: string;
    let liquiditySelector: string;
    
    if (ethers && ethers.id) {
      try {
        fundsSelector = ethers.id("funds()").slice(0, 10);
        liquiditySelector = ethers.id("liquidity()").slice(0, 10);
        console.log("[Contract] Generated selectors:", { fundsSelector, liquiditySelector });
      } catch {
        // Fallback to pre-computed selectors
        // keccak256("funds()") = 0xa035b1fe...
        // keccak256("liquidity()") = 0xb0e21e8a...
        fundsSelector = "0xa035b1fe";
        liquiditySelector = "0xb0e21e8a";
        console.log("[Contract] Using pre-computed selectors:", { fundsSelector, liquiditySelector });
      }
    } else {
      // Pre-computed selectors (keccak256 hash first 4 bytes)
      fundsSelector = "0xa035b1fe"; // keccak256("funds()")[:4]
      liquiditySelector = "0xb0e21e8a"; // keccak256("liquidity()")[:4]
      console.log("[Contract] Using pre-computed selectors (no ethers):", { fundsSelector, liquiditySelector });
    }

    try {
      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      const fetchOptions = {
        method: "POST" as const,
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
      };

      const [fundsResponse, liquidityResponse] = await Promise.all([
        fetch(rpcUrl, {
          ...fetchOptions,
          body: JSON.stringify({
            jsonrpc: "2.0",
            id: 1,
            method: "eth_call",
            params: [{ to: TAX_PROCESSOR_ADDRESS, data: fundsSelector }, "latest"]
          })
        }).catch(() => null),
        fetch(rpcUrl, {
          ...fetchOptions,
          body: JSON.stringify({
            jsonrpc: "2.0",
            id: 2,
            method: "eth_call",
            params: [{ to: TAX_PROCESSOR_ADDRESS, data: liquiditySelector }, "latest"]
          })
        }).catch(() => null)
      ]);

      clearTimeout(timeoutId);

      let fundsData: any = { result: null };
      let liquidityData: any = { result: null };

      if (fundsResponse && fundsResponse.ok) {
        try {
          fundsData = await fundsResponse.json();
          console.log("[Contract] Funds response:", fundsData);
        } catch (e) {
          console.log("[Contract] Error parsing funds response:", e);
        }
      } else {
        console.log("[Contract] Funds response not OK:", fundsResponse?.status, fundsResponse?.statusText);
      }

      if (liquidityResponse && liquidityResponse.ok) {
        try {
          liquidityData = await liquidityResponse.json();
          console.log("[Contract] Liquidity response:", liquidityData);
        } catch (e) {
          console.log("[Contract] Error parsing liquidity response:", e);
        }
      } else {
        console.log("[Contract] Liquidity response not OK:", liquidityResponse?.status, liquidityResponse?.statusText);
      }

      const fundsBalance = fundsData.result ? formatTokenAmount(fundsData.result, 18) : "0";
      const liquidityBalance = liquidityData.result ? formatTokenAmount(liquidityData.result, 18) : "0";
      
      console.log("[Contract] Final balances:", { fundsBalance, liquidityBalance });

      return {
        fundsBalance,
        liquidityBalance,
        tokenAddress: TOKEN_ADDRESS,
        taxProcessorAddress: TAX_PROCESSOR_ADDRESS,
      };
    } catch (fetchError: any) {
      console.log("[Contract] Error with RPC calls:", fetchError?.message || String(fetchError));
      // Return zeros if RPC fails
      return {
        fundsBalance: "0",
        liquidityBalance: "0",
        tokenAddress: TOKEN_ADDRESS,
        taxProcessorAddress: TAX_PROCESSOR_ADDRESS,
      };
    }
  } catch (error: any) {
    console.log("[Contract] Error reading contract data:", error?.message || String(error));
    return {
      fundsBalance: "0",
      liquidityBalance: "0",
      tokenAddress: TOKEN_ADDRESS,
      taxProcessorAddress: TAX_PROCESSOR_ADDRESS,
    };
  }
}

// Helper to format wei to readable format (assuming 18 decimals)
export function formatTokenAmount(weiAmount: string, decimals: number = 18): string {
  try {
    // Remove 0x prefix if present
    const cleanAmount = weiAmount.startsWith("0x") ? weiAmount.slice(2) : weiAmount;
    if (!cleanAmount || cleanAmount === "0") return "0";
    
    const amount = BigInt("0x" + cleanAmount);
    const divisor = BigInt(10 ** decimals);
    const whole = amount / divisor;
    const remainder = amount % divisor;
    
    const remainderStr = remainder.toString().padStart(decimals, "0");
    // Remove trailing zeros
    const trimmedRemainder = remainderStr.replace(/0+$/, "");
    
    return trimmedRemainder ? `${whole}.${trimmedRemainder}` : whole.toString();
  } catch (error) {
    console.error("[Contract] Error formatting amount:", error);
    return "0";
  }
}
