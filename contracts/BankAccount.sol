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
            owners.length <= 2,
            "An account cannot have more than 3 owners"
        );

        for (uint i = 0; i < owners.length; i++) {
            for (uint j = i + 1; j < owners.length; j++) {
                require(owners[i] != owners[j], "Duplicated owners found");
            }
            require(owners[i] != msg.sender, "Duplicated owners found");
        }

        _;
    }

    modifier sufficientBalance(uint accountId, uint amount) {
        require(accounts[accountId].balance >= amount, "Insufficient balance");
        _;
    }

    modifier canApprove(uint accountId, uint withdrawId) {
        require(
            getWithdrawRequest(accountId, withdrawId).user != address(0),
            "This request doesn't exist"
        );
        require(
            !getWithdrawRequest(accountId, withdrawId).approved,
            "This request is already approved"
        );
        require(
            getWithdrawRequest(accountId, withdrawId).user != msg.sender,
            "You can't approve your own request"
        );
        require(
            !getWithdrawRequest(accountId, withdrawId).ownersApproved[
                msg.sender
            ],
            "You've already approved this request"
        );
        _;
    }

    modifier canWithdraw(uint accountId, uint withdrawId) {
        require(
            getWithdrawRequest(accountId, withdrawId).user == msg.sender,
            "You're not the owner of this request"
        );
        require(
            getWithdrawRequest(accountId, withdrawId).approved,
            "This request isn't approved"
        );
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

    function requestWithdrawl(
        uint accountId,
        uint amount
    ) external accountOwner(accountId) sufficientBalance(accountId, amount) {
        uint id = nextWithdrawId;
        WithdrawRequest storage request = accounts[accountId].withdrawRequests[
            id
        ];
        request.user = msg.sender;
        request.amount = amount;
        nextWithdrawId++;
        emit WithdrawRequested(
            msg.sender,
            accountId,
            id,
            amount,
            block.timestamp
        );
    }

    function approvedWithdrawl(
        uint accountId,
        uint withdrawId
    ) external accountOwner(accountId) canApprove(accountId, withdrawId) {
        WithdrawRequest storage request = accounts[accountId].withdrawRequests[
            withdrawId
        ];
        request.approvals++;
        request.ownersApproved[msg.sender] = true;

        if (request.approvals == accounts[accountId].owners.length - 1) {
            request.approved = true;
        }
    }

    function withdraw(
        uint accountId,
        uint withdrawId
    ) external canWithdraw(accountId, withdrawId) {
        uint amount = getWithdrawRequest(accountId, withdrawId).amount;
        require(accounts[accountId].balance >= amount, "Insufficient balance");

        accounts[accountId].balance = amount;
        delete accounts[accountId].withdrawRequests[withdrawId];

        (bool sent, ) = payable(msg.sender).call{value: amount}("");
        require(sent, "Withdraw failed");

        emit Withdraw(withdrawId, block.timestamp);
    }

    function getBalance(uint accountId) public view returns (uint) {
        return accounts[accountId].balance;
    }

    function getOwners(uint accountId) public view returns (address[] memory) {
        return accounts[accountId].owners;
    }

    function getApprovals(
        uint accountId,
        uint withdrawId
    ) public view returns (uint) {
        return getWithdrawRequest(accountId, withdrawId).approvals;
    }

    function getAccounts() public view returns (uint[] memory) {
        return userAccounts[msg.sender];
    }

    function getWithdrawRequest(
        uint accountId,
        uint withdrawId
    ) internal view returns (WithdrawRequest storage) {
        return accounts[accountId].withdrawRequests[withdrawId];
    }
}
