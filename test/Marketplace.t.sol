// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "forge-std/Test.sol";
import "../src/SimpleNFT.sol";
import "../src/NFTMarketplace.sol";

contract MarketplaceTest is Test {
    SimpleNFT nft;
    NFTMarketplace marketplace;

    address seller = address(0x111);
    address buyer = address(0x222);
    uint256 constant PRICE = 1 ether;

    function setUp() public {
        // Deploy contracts before every test
        nft = new SimpleNFT();
        marketplace = new NFTMarketplace(address(nft));
        
        // Give the buyer some fake money (ETH)
        vm.deal(buyer, 10 ether);
    }

    function test_ListAndBuyNFT() public {
        // 1. Seller mints a token
        vm.startPrank(seller);
        nft.mint(); // Token ID 0
        
        // 2. Seller approves marketplace
        nft.approveNFT(address(marketplace), 0);
        
        // 3. Seller lists it
        marketplace.listNFT(0, PRICE);
        vm.stopPrank();

        // 4. Buyer buys it
        vm.startPrank(buyer);
        marketplace.buyNFT{value: PRICE}(0);
        vm.stopPrank();

        // Verification
        assertEq(nft.ownerOf(0), buyer);
        assertEq(seller.balance, PRICE);
    }

//     function testFail_PriceIsZero() public {
//         vm.startPrank(seller);
//         nft.mint();
//         nft.approveNFT(address(marketplace), 0);
        
//         // This should fail because price is 0
//         marketplace.listNFT(0, 0); 
//         vm.stopPrank();
//     }
// }

function test_CannotListWithZeroPrice() public {
        vm.startPrank(seller);
        nft.mint();
        nft.approveNFT(address(marketplace), 0);
        
        // This tells Foundry: "The next line MUST fail with this error message"
        vm.expectRevert("Price must be greater than 0");
        marketplace.listNFT(0, 0); 
        
        vm.stopPrank();
    }
}