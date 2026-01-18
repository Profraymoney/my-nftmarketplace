import { useState, useEffect } from "react";
import { ethers } from "ethers";

const NFT_ADDRESS = "0x7654b4896f75CCBCE20a2e17E3a35D00F1D4454c";
const MARKETPLACE_ADDRESS = "0xeD2feAB16BF7080E8100E070a19a89D4975D170B";
const SEPOLIA_CHAIN_ID = "0xaa36a7"; // 11155111 in hex

const nftAbi = [
  "function mint() external",
  "function approveNFT(address marketplace, uint256 tokenId) external",
  "function ownerOf(uint256 tokenId) view returns (address)",
  "function tokenCounter() view returns (uint256)"
];

const marketplaceAbi = [
  "function listNFT(uint256 tokenId, uint256 price) external",
  "function buyNFT(uint256 tokenId) external payable",
  "function getAllListings() view returns (tuple(uint256 tokenId,address seller,uint256 price,bool active)[])"
];

export default function App() {
  const [signer, setSigner] = useState(null);
  const [account, setAccount] = useState(null);
  const [listings, setListings] = useState([]);
  const [price, setPrice] = useState("0.01");
  const [loading, setLoading] = useState(false);

  // Check and Switch Network
  async function checkNetwork() {
    const chainId = await window.ethereum.request({ method: "eth_chainId" });
    if (chainId !== SEPOLIA_CHAIN_ID) {
      try {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: SEPOLIA_CHAIN_ID }],
        });
      } catch (err) {
        alert("Please switch your MetaMask to Sepolia Network");
        return false;
      }
    }
    return true;
  }

  async function connectWallet() {
    if (!window.ethereum) return alert("Please install MetaMask");
    
    const isCorrectNetwork = await checkNetwork();
    if (!isCorrectNetwork) return;

    const provider = new ethers.BrowserProvider(window.ethereum);
    const walletSigner = await provider.getSigner();
    const userAddress = await walletSigner.getAddress();

    setSigner(walletSigner);
    setAccount(userAddress);
    loadListings(provider);
  }

  async function loadListings(providerOrSigner) {
    try {
      const marketplace = new ethers.Contract(MARKETPLACE_ADDRESS, marketplaceAbi, providerOrSigner);
      const data = await marketplace.getAllListings();
      // Filter BigInt based data and active listings
      setListings(data.filter((l) => l.active));
    } catch (err) {
      console.error("Listing Error:", err);
    }
  }

  async function mintAndList() {
    if (!signer) return alert("Connect wallet first");
    setLoading(true);
    try {
      const nft = new ethers.Contract(NFT_ADDRESS, nftAbi, signer);
      const marketplace = new ethers.Contract(MARKETPLACE_ADDRESS, marketplaceAbi, signer);

      // 1. Mint
      const mintTx = await nft.mint();
      await mintTx.wait();

      // 2. Get the newly minted Token ID (Last one)
      const count = await nft.tokenCounter();
      const tokenId = count - 1n; // Using BigInt arithmetic

      // 3. Approve
      const approveTx = await nft.approveNFT(MARKETPLACE_ADDRESS, tokenId);
      await approveTx.wait();

      // 4. List
      const listTx = await marketplace.listNFT(tokenId, ethers.parseEther(price));
      await listTx.wait();

      alert(`Success! NFT #${tokenId.toString()} listed.`);
      loadListings(signer);
    } catch (err) {
      console.error(err);
      alert("Transaction failed. Check console.");
    } finally {
      setLoading(false);
    }
  }

  async function buyNFT(tokenId, nftPrice) {
    setLoading(true);
    try {
      const marketplace = new ethers.Contract(MARKETPLACE_ADDRESS, marketplaceAbi, signer);
      const tx = await marketplace.buyNFT(tokenId, { value: nftPrice });
      await tx.wait();
      loadListings(signer);
    } catch (err) {
      alert("Purchase failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans text-gray-900">
      <header className="max-w-4xl mx-auto flex justify-between items-center mb-12">
        <h1 className="text-3xl font-extrabold tracking-tight text-indigo-600">OpenNFT</h1>
        {!account ? (
          <button onClick={connectWallet} className="bg-indigo-600 text-white px-6 py-2 rounded-full font-medium hover:bg-indigo-700 transition">
            Connect Wallet
          </button>
        ) : (
          <div className="text-right">
            <span className="block text-xs text-gray-500 font-mono">{account}</span>
            <span className="text-sm text-green-500 font-bold">● Connected (Sepolia)</span>
          </div>
        )}
      </header>

      <main className="max-w-4xl mx-auto">
        <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-10">
          <h2 className="text-xl font-semibold mb-4">Create New Listing</h2>
          <div className="flex gap-4">
            <input 
              type="number" 
              value={price} 
              onChange={(e) => setPrice(e.target.value)}
              className="flex-1 border-gray-200 border p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="Price in ETH"
            />
            <button 
              disabled={loading}
              onClick={mintAndList} 
              className={`px-8 py-3 rounded-xl font-bold text-white transition ${loading ? 'bg-gray-400' : 'bg-green-500 hover:bg-green-600'}`}
            >
              {loading ? "Processing..." : "Mint & List"}
            </button>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-6">Marketplace</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {listings.length === 0 && <p className="text-gray-500 italic">No active listings found on this contract.</p>}
            {listings.map((l, i) => (
              <div key={i} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition">
                <div className="h-48 bg-gray-100 rounded-xl mb-4 flex items-center justify-center text-gray-400">
                  <span className="text-4xl font-bold">#{l.tokenId.toString()}</span>
                </div>
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-sm text-gray-500 mb-1 font-medium">Price</p>
                    <p className="text-xl font-bold">{ethers.formatEther(l.price)} ETH</p>
                  </div>
                  {l.seller.toLowerCase() === account?.toLowerCase() ? (
                    <span className="text-sm font-semibold text-indigo-500 bg-indigo-50 px-3 py-1 rounded-lg">Owned by you</span>
                  ) : (
                    <button 
                      onClick={() => buyNFT(l.tokenId, l.price)}
                      className="bg-indigo-600 text-white px-5 py-2 rounded-lg font-semibold hover:bg-indigo-700"
                    >
                      Buy Now
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}