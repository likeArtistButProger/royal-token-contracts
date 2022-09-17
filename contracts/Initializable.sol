pragma solidity ^0.8.9;

abstract contract Initializable {
    bool public initialized;

    error AlreadyInitialized();
    modifier notInitialized() {
        if(initialized) {
            revert AlreadyInitialized();
        }
        _;
    }
}