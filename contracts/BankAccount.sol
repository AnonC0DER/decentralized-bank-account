pragma solidity >=0.4.22 <=0.9.0;

contract BankAccount {
    event Deposit(
        address indexed user,
        uint256 indexed accountId,
        uint256 amount,
        uint256 timestamp
    );

    event WithdrawRequested(
        address indexed user,
        uint256 indexed accountId,
        uint256 indexed withdrawId,
        uint256 amount,
        uint256 timestamp
    );

    event Withdraw(uint256 indexed withdrawId, uint256 timestamp);

    event CreateAccount(address[] owners, uint indexed id, uint timestamp);

    struct WithdrawRequest {
        address user;
        uint amount;
        uint approvals;
        mapping(address => bool) ownersApproved;
        bool approved;
    }

    struct Account {
        address[] owners;
        uint balance;
        mapping(uint => WithdrawRequest) withdrawRequests;
    }

    mapping(uint => Account) accounts;
    mapping(address => uint[]) userAccounts;

    uint nextAccountId;
    uint nextWithdrawId;

    modifier accountOwner(uint accountId) {
        bool isOwner;
        for (uint idx; idx < accounts[accountId].owners.length; idx++) {
            if (accounts[accountId].owners[idx] == msg.sender) {
                isOwner = true;
                break;
            }
        }
        require(isOwner, "You're not an owner of this account");
        _;
    }

    modifier validOwners(address[] calldata owners) {
        require(
            owners.length + 1 <= 3,
            "An account cannot have more than 3 owners"
        );
        for (uint idx; idx < owners.length; idx++) {
            for (uint jdx = idx + 1; jdx < owners.length; jdx++) {
                if (owners[idx] == owners[jdx]) {
                    revert("Duplicated owners found");
                }
            }
        }
        _;
    }

    function deposit(uint accountId) external payable accountOwner(accountId) {
        accounts[accountId].balance += msg.value;
    }

    function createAccount(
        address[] calldata otherOwners
    ) external validOwners(otherOwners) {
        address[] memory owners = new address[](otherOwners.length + 1);
        owners[otherOwners.length] = msg.sender;
        uint id = nextAccountId;
        for (uint idx; idx < owners.length; idx++) {
            if (idx < owners.length - 1) {
                owners[idx] = otherOwners[idx];
            }

            if (userAccounts[owners[idx]].length > 2) {
                revert("User cannot have more than 3 accounts");
            }

            userAccounts[owners[idx]].push(id);
        }

        accounts[id].owners = owners;
        nextAccountId++;
        emit CreateAccount(owners, id, block.timestamp);
    }

    function requestWithdrawl(uint accountId, uint amount) external {}

    function approvedWithdrawl(uint accountId, uint withdrawId) external {}

    function withdraw(uint accountId, uint withdrawId) external {}

    function getBalance(uint accountId) public view returns (uint) {}

    function getOwners(uint accountId) public view returns (address[] memory) {}

    function getApprovals(
        uint accountId,
        uint withdrawId
    ) public view returns (uint) {}

    function getAccounts() public view returns (uint[] memory) {}
}
