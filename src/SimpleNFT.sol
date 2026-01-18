// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract myNFT is ERC721, Ownable {
    uint256 public tokenCounter;

  constructor() ERC721("myNFT", "MNFT") Ownable(msg.sender) {
    tokenCounter = 0;
    }

    function mint() external {
        uint256 tokenId = tokenCounter;
        _safeMint(msg.sender, tokenId);
        tokenCounter++;
    }

    // 👇 APPROVE FUNCTION 
    function approveNFT(address marketplace, uint256 tokenId) external {
        require(ownerOf(tokenId) == msg.sender, "Not NFT owner");
        approve(marketplace, tokenId);
    }
}

