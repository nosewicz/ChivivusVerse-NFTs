// SPDX-License-Identifier: Undefined

pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
//import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./IWhitelist.sol";

contract ChivNFTs is ERC721Enumerable, Ownable {
  string _baseTokenURI;
  uint256 public _price = 0.025 ether;

  //to pause contract in case of emergency
  bool public _paused;

  uint256 public maxTokenIds = 20;
  uint256 public tokenIds;
  IWhitelist whitelist;
  bool public presaleStarted;
  uint256 public presaleEnded;

  modifier onlyWhenNotPaused {
    require(!_paused, "Contract currently paused");
    _;
  }

  constructor (string memory baseURI, address whitelistContract) ERC721("Chivivus NFTs", "CHIVNFT") {
    _baseTokenURI = baseURI;
    whitelist = IWhitelist(whitelistContract);
  }

  function startPresale() public onlyOwner {
    presaleStarted = true;
    presaleEnded = block.timestamp + 10 days;
  }

  function presaleMint() public payable onlyWhenNotPaused {
    require(presaleStarted && block.timestamp < presaleEnded, "Presale is not running");
    require(whitelist.whitelistedAddresses(msg.sender), "You are not whitelisted");
    require(tokenIds < maxTokenIds, "Mint has sold out");
    require(msg.value >= _price, "Ether sent is not correct");
    tokenIds += 1;

    _safeMint(msg.sender, tokenIds);
    
  }

  function mint() public payable onlyWhenNotPaused {
    require(presaleStarted && block.timestamp >= presaleEnded, "Presale has not ended yet");
    require(tokenIds < maxTokenIds, "Mint has sold out");
    require(msg.value >= _price, "Ether sent is not correct");
    tokenIds += 1;

    _safeMint(msg.sender, tokenIds);
    
  }

  //overide openzepplin baseURI implementaion which returns empty string
  function _baseURI() internal view override virtual returns (string memory) {
    return _baseTokenURI;
  }

  //point to actual .json file on ipfs
  function tokenURI(uint256 _tokenId) public view override returns (string memory) {
    return string(abi.encodePacked(_baseTokenURI, Strings.toString(_tokenId), ".json"));
  }

  function setPaused(bool val) public onlyOwner {
    _paused = val;
  }

  function withdraw() public onlyOwner {
    address _owner = owner();
    uint256 amount = address(this).balance;
    (bool sent, ) = _owner.call{value: amount}("");
    require(sent, "failed withdraw ether");
  }

  receive() external payable {}

  fallback() external payable {}
}