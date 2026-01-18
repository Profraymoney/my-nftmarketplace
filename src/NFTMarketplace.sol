// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

contract NFTMarketplace is ReentrancyGuard {

    IERC721 public nft;

    struct Listing {
        uint256 tokenId;
        address seller;
        uint256 price;
        bool active;
    }

    // tokenId => Listing
    mapping(uint256 => Listing) public listings;

    // seller => has active listing?
    mapping(address => bool) public hasActiveListing;

    uint256[] public activeListings;

    constructor(address _nftAddress) {
        nft = IERC721(_nftAddress);
    }

    // ================= LIST NFT =================
    function listNFT(uint256 tokenId, uint256 price) external {
        require(price > 0, "Price must be greater than 0");
        require(nft.ownerOf(tokenId) == msg.sender, "Not NFT owner");
        require(!hasActiveListing[msg.sender], "Only 1 active listing allowed");
        require(
            nft.getApproved(tokenId) == address(this),
            "Marketplace not approved"
        );

        listings[tokenId] = Listing({
            tokenId: tokenId,
            seller: msg.sender,
            price: price,
            active: true
        });

        hasActiveListing[msg.sender] = true;
        activeListings.push(tokenId);
    }

    // ================= BUY NFT =================
    function buyNFT(uint256 tokenId) external payable nonReentrant {
        Listing storage listing = listings[tokenId];

        require(listing.active, "Not listed");
        require(msg.value == listing.price, "Incorrect ETH amount");

        listing.active = false;
        hasActiveListing[listing.seller] = false;

        payable(listing.seller).transfer(msg.value);
        nft.safeTransferFrom(listing.seller, msg.sender, tokenId);
    }

    // ================= DELIST =================
    function delistNFT(uint256 tokenId) external {
        Listing storage listing = listings[tokenId];

        require(listing.active, "Not active");
        require(listing.seller == msg.sender, "Not seller");

        listing.active = false;
        hasActiveListing[msg.sender] = false;
    }

    // ================= VIEW =================
    function getActiveListing(address seller) external view returns (Listing memory) {
        for (uint i = 0; i < activeListings.length; i++) {
            Listing memory listing = listings[activeListings[i]];
            if (listing.seller == seller && listing.active) {
                return listing;
            }
        }
        revert("No active listing");
    }

    function getAllListings() external view returns (Listing[] memory) {
        uint count = 0;

        for (uint i = 0; i < activeListings.length; i++) {
            if (listings[activeListings[i]].active) {
                count++;
            }
        }

        Listing[] memory result = new Listing[](count);
        uint index = 0;

        for (uint i = 0; i < activeListings.length; i++) {
            if (listings[activeListings[i]].active) {
                result[index] = listings[activeListings[i]];
                index++;
            }
        }

        return result;
    }
}
