// SPDX-License-Identifier: Undefined

pragma solidity ^0.8.4;

interface IWhitelist {
  function whitelistedAddresses(address) external view returns (bool);
}