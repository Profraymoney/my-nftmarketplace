// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "forge-std/Script.sol";
import "../src/SimpleNFT.sol";
import "../src/NFTMarketplace.sol";

contract DeployMarketplace is Script {
    function run() external {
        // Start recording transactions to send to the blockchain
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy the NFT contract
        SimpleNFT nft = new SimpleNFT();

        // 2. Deploy the Marketplace with the NFT's address
        NFTMarketplace marketplace = new NFTMarketplace(address(nft));

        vm.stopBroadcast();
    }
}