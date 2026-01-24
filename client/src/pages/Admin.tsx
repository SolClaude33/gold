import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Lock, Settings, Coins, History, RefreshCw, Copy, Check, AlertCircle, Wallet, Activity } from "lucide-react";

interface SystemStatus {
  walletConfigured: boolean;
  tokenConfigured: boolean;
  systemReady: boolean;
  walletAddress: string | null;
  solBalance: number;
  error?: string;
}

interface ProtocolConfig {
  id: string;
  tokenMint: string | null;
  goldMint: string | null;
  creatorWallet: string | null;
  minimumHolderPercentage: string | null;
  majorHoldersPercentage: string | null;
  mediumHoldersPercentage: string | null;
  buybackPercentage: string | null;
  lastDistributionAt: string | null;
}

interface Distribution {
  id: string;
  timestamp: string;
  totalFeesCollected: string;
  feesForGold: string;
  feesForBurn: string;
  goldPurchased: string;
  holdersCount: number;
  status: string;
  txSignature: string | null;
}

export default function Admin() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [tokenMint, setTokenMint] = useState("");
  const [creatorWallet, setCreatorWallet] = useState("");
  const queryClient = useQueryClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (data.success) {
        setToken(data.token);
        setIsAuthenticated(true);
        localStorage.setItem("adminToken", data.token);
      } else {
        setError("Contraseña incorrecta");
      }
    } catch {
      setError("Error de conexión");
    }
  };

  useEffect(() => {
    const savedToken = localStorage.getItem("adminToken");
    if (savedToken) {
      setToken(savedToken);
      setIsAuthenticated(true);
    }
  }, []);

  const { data: config, isLoading: configLoading } = useQuery<ProtocolConfig>({
    queryKey: ["config"],
    queryFn: async () => {
      const res = await fetch("/api/admin/config", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch config");
      return res.json();
    },
    enabled: isAuthenticated && !!token,
  });

  const { data: distributions, isLoading: distLoading } = useQuery<Distribution[]>({
    queryKey: ["distributions"],
    queryFn: async () => {
      const res = await fetch("/api/admin/distributions", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch distributions");
      return res.json();
    },
    enabled: isAuthenticated && !!token,
  });

  const { data: status } = useQuery<SystemStatus>({
    queryKey: ["status"],
    queryFn: async () => {
      const res = await fetch("/api/admin/status", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch status");
      return res.json();
    },
    enabled: isAuthenticated && !!token,
    refetchInterval: 30000,
  });

  const updateConfigMutation = useMutation({
    mutationFn: async (updates: Partial<ProtocolConfig>) => {
      const res = await fetch("/api/admin/config", {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error("Failed to update config");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["config"] });
    },
  });

  const claimFeesMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/distributions/claim-fees", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error("Failed to claim fees");
      return res.json();
    },
  });

  const executeDistributionMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/distributions/execute", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ totalFees: "0" }),
      });
      if (!res.ok) throw new Error("Failed to execute distribution");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["distributions"] });
    },
  });

  useEffect(() => {
    if (config) {
      setTokenMint(config.tokenMint || "");
      setCreatorWallet(config.creatorWallet || "");
    }
  }, [config]);

  const handleSaveConfig = () => {
    updateConfigMutation.mutate({ tokenMint, creatorWallet });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/logout", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {
    }
    setIsAuthenticated(false);
    setToken("");
    localStorage.removeItem("adminToken");
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gray-900 border border-green-900/50 p-8 max-w-md w-full shadow-[0_0_30px_rgba(0,255,0,0.1)]"
        >
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 bg-green-900/30 rounded-full flex items-center justify-center border border-green-500/30">
              <Lock className="w-8 h-8 text-green-500" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-center text-green-500 mb-2 font-mono uppercase tracking-wider">
            Admin Panel
          </h1>
          <p className="text-green-700 text-center mb-6 font-mono text-sm">
            GOLDFUNX Protocol Control
          </p>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full px-4 py-3 bg-black border border-green-900/50 text-green-500 font-mono focus:border-green-500 focus:outline-none"
                data-testid="input-admin-password"
              />
            </div>
            {error && (
              <p className="text-red-500 text-sm font-mono">{error}</p>
            )}
            <button
              type="submit"
              className="w-full py-3 bg-green-900/30 border border-green-500/50 text-green-500 font-mono uppercase tracking-wider hover:bg-green-900/50 transition-colors cursor-pointer"
              data-testid="button-admin-login"
            >
              Access
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-green-500 font-mono p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8 border-b border-green-900/50 pb-4">
          <div>
            <h1 className="text-2xl font-bold uppercase tracking-wider">GOLDFUNX Admin</h1>
            <p className="text-green-700 text-sm">Protocol Control Panel</p>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 border border-red-500/50 text-red-500 hover:bg-red-900/20 transition-colors cursor-pointer"
            data-testid="button-logout"
          >
            Logout
          </button>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-900/50 border border-green-900/50 p-6 mb-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <Activity className="w-5 h-5" />
            <h2 className="text-lg font-bold uppercase tracking-wider">System Status</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3 bg-black/30 border border-green-900/30">
              <p className="text-green-700 text-xs uppercase mb-1">Wallet</p>
              <div className={`text-sm font-bold ${status?.walletConfigured ? "text-green-500" : "text-red-500"}`}>
                {status?.walletConfigured ? "Configured" : "Not Set"}
              </div>
            </div>
            <div className="p-3 bg-black/30 border border-green-900/30">
              <p className="text-green-700 text-xs uppercase mb-1">Token</p>
              <div className={`text-sm font-bold ${status?.tokenConfigured ? "text-green-500" : "text-yellow-500"}`}>
                {status?.tokenConfigured ? "Set" : "SOON"}
              </div>
            </div>
            <div className="p-3 bg-black/30 border border-green-900/30">
              <p className="text-green-700 text-xs uppercase mb-1">System</p>
              <div className={`text-sm font-bold ${status?.systemReady ? "text-green-500" : "text-yellow-500"}`}>
                {status?.systemReady ? "Ready" : "Pending Setup"}
              </div>
            </div>
            <div className="p-3 bg-black/30 border border-green-900/30">
              <p className="text-green-700 text-xs uppercase mb-1">SOL Balance</p>
              <div className="text-sm font-bold text-metal-gold">
                {status?.solBalance?.toFixed(4) || "0.0000"} SOL
              </div>
            </div>
          </div>
          {status?.walletAddress && (
            <div className="mt-4 p-3 bg-black/30 border border-green-900/30">
              <p className="text-green-700 text-xs uppercase mb-1">Wallet Address</p>
              <div className="flex items-center gap-2">
                <code className="text-xs text-green-500 truncate">{status.walletAddress}</code>
                <button
                  onClick={() => copyToClipboard(status.walletAddress!)}
                  className="p-1 hover:bg-green-900/20 cursor-pointer"
                >
                  <Copy className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}
          {status?.error && (
            <div className="mt-4 p-3 bg-red-900/20 border border-red-500/30">
              <p className="text-red-500 text-xs">{status.error}</p>
            </div>
          )}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-900/50 border border-green-900/50 p-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <Settings className="w-5 h-5" />
              <h2 className="text-lg font-bold uppercase tracking-wider">Configuration</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-green-700 text-xs uppercase mb-2">Token Mint (CA)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={tokenMint}
                    onChange={(e) => setTokenMint(e.target.value)}
                    placeholder="SOON - Paste contract address when live"
                    className="flex-1 px-3 py-2 bg-black border border-green-900/50 text-green-500 text-sm focus:border-green-500 focus:outline-none"
                    data-testid="input-token-mint"
                  />
                </div>
              </div>

              <div>
                <label className="block text-green-700 text-xs uppercase mb-2">Creator Wallet</label>
                <input
                  type="text"
                  value={creatorWallet}
                  onChange={(e) => setCreatorWallet(e.target.value)}
                  placeholder="Creator wallet public key"
                  className="w-full px-3 py-2 bg-black border border-green-900/50 text-green-500 text-sm focus:border-green-500 focus:outline-none"
                  data-testid="input-creator-wallet"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-green-700 text-xs uppercase mb-2">Major Holders %</label>
                  <div className="px-3 py-2 bg-black/50 border border-green-900/30 text-metal-gold">
                    {config?.majorHoldersPercentage || "70"}%
                  </div>
                  <p className="text-green-700 text-xs mt-1">≥0.5% supply</p>
                </div>
                <div>
                  <label className="block text-green-700 text-xs uppercase mb-2">Medium Holders %</label>
                  <div className="px-3 py-2 bg-black/50 border border-green-900/30 text-blue-400">
                    {config?.mediumHoldersPercentage || "20"}%
                  </div>
                  <p className="text-green-700 text-xs mt-1">0.1% - 0.49%</p>
                </div>
                <div>
                  <label className="block text-green-700 text-xs uppercase mb-2">Buybacks %</label>
                  <div className="px-3 py-2 bg-black/50 border border-green-900/30 text-purple-400">
                    {config?.buybackPercentage || "10"}%
                  </div>
                  <p className="text-green-700 text-xs mt-1">Token buyback</p>
                </div>
              </div>

              <div>
                <label className="block text-green-700 text-xs uppercase mb-2">$GOLD Contract</label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 px-3 py-2 bg-black/50 border border-green-900/30 text-metal-gold text-xs truncate">
                    {config?.goldMint || "GoLDppdjB1vDTPSGxyMJFqdnj134yH6Prg9eqsGDiw6A"}
                  </div>
                  <button
                    onClick={() => copyToClipboard(config?.goldMint || "GoLDppdjB1vDTPSGxyMJFqdnj134yH6Prg9eqsGDiw6A")}
                    className="p-2 border border-green-900/50 hover:bg-green-900/20 cursor-pointer"
                    data-testid="button-copy-gold"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-green-700 text-xs uppercase mb-2">Min Holder %</label>
                <div className="px-3 py-2 bg-black/50 border border-green-900/30">
                  {config?.minimumHolderPercentage || "0.5"}% of supply
                </div>
              </div>

              <button
                onClick={handleSaveConfig}
                disabled={updateConfigMutation.isPending}
                className="w-full py-3 bg-green-900/30 border border-green-500/50 text-green-500 uppercase tracking-wider hover:bg-green-900/50 transition-colors disabled:opacity-50 cursor-pointer"
                data-testid="button-save-config"
              >
                {updateConfigMutation.isPending ? "Saving..." : "Save Configuration"}
              </button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gray-900/50 border border-green-900/50 p-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <Coins className="w-5 h-5 text-metal-gold" />
              <h2 className="text-lg font-bold uppercase tracking-wider">Distribution Actions</h2>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-yellow-900/20 border border-yellow-500/30">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-yellow-500 text-sm font-bold mb-1">Wallet Integration Required</p>
                    <p className="text-yellow-600 text-xs">
                      To enable automatic fee claiming and distribution, add the CREATOR_WALLET_PRIVATE_KEY secret with the creator wallet's private key.
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => claimFeesMutation.mutate()}
                disabled={claimFeesMutation.isPending || !tokenMint}
                className="w-full py-3 bg-metal-gold/20 border border-metal-gold/50 text-metal-gold uppercase tracking-wider hover:bg-metal-gold/30 transition-colors disabled:opacity-50 cursor-pointer"
                data-testid="button-claim-fees"
              >
                <div className="flex items-center justify-center gap-2">
                  <RefreshCw className={`w-4 h-4 ${claimFeesMutation.isPending ? "animate-spin" : ""}`} />
                  {claimFeesMutation.isPending ? "Claiming..." : "Claim Fees"}
                </div>
              </button>

              <button
                onClick={() => executeDistributionMutation.mutate()}
                disabled={executeDistributionMutation.isPending || !tokenMint}
                className="w-full py-3 bg-green-900/30 border border-green-500/50 text-green-500 uppercase tracking-wider hover:bg-green-900/50 transition-colors disabled:opacity-50 cursor-pointer"
                data-testid="button-execute-distribution"
              >
                {executeDistributionMutation.isPending ? "Processing..." : "Execute Distribution"}
              </button>

              {!tokenMint && (
                <p className="text-red-500 text-xs text-center">
                  Set the Token Mint (CA) first to enable distributions
                </p>
              )}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2 bg-gray-900/50 border border-green-900/50 p-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <History className="w-5 h-5" />
              <h2 className="text-lg font-bold uppercase tracking-wider">Distribution History</h2>
            </div>

            {distLoading ? (
              <div className="text-center py-8 text-green-700">Loading...</div>
            ) : distributions && distributions.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-green-900/50 text-green-700 text-xs uppercase">
                      <th className="text-left py-3 px-2">Date</th>
                      <th className="text-right py-3 px-2">Fees</th>
                      <th className="text-right py-3 px-2">Gold</th>
                      <th className="text-right py-3 px-2">Holders</th>
                      <th className="text-center py-3 px-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {distributions.map((dist) => (
                      <tr key={dist.id} className="border-b border-green-900/30 hover:bg-green-900/10">
                        <td className="py-3 px-2">
                          {new Date(dist.timestamp).toLocaleString()}
                        </td>
                        <td className="text-right py-3 px-2 text-metal-gold">
                          {parseFloat(dist.totalFeesCollected).toFixed(4)} SOL
                        </td>
                        <td className="text-right py-3 px-2">
                          {parseFloat(dist.goldPurchased).toFixed(4)} OZ
                        </td>
                        <td className="text-right py-3 px-2">
                          {dist.holdersCount}
                        </td>
                        <td className="text-center py-3 px-2">
                          <span className={`px-2 py-1 text-xs rounded ${
                            dist.status === "completed" 
                              ? "bg-green-900/30 text-green-500" 
                              : dist.status === "pending"
                              ? "bg-yellow-900/30 text-yellow-500"
                              : "bg-red-900/30 text-red-500"
                          }`}>
                            {dist.status.toUpperCase()}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-green-700">
                No distributions yet. Execute your first distribution above.
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
