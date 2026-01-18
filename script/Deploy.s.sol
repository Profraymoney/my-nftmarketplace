// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/nftmarket.sol";
import "../src/myNFT.sol";


contract DeployMarketplace is Script {
    function run() external {
        address nftAddress = vm.envAddress("NFT_ADDRESS");

        vm.startBroadcast();
        NFTMarketplace marketplace = new NFTMarketplace(nftAddress);
        vm.stopBroadcast();

        console.log("Marketplace deployed at:", address(marketplace));
    }
}
