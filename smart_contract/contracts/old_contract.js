// // SPDX-License-Identifier: MIT
// pragma solidity ^0.8.24;

// import "@openzeppelin/contracts/access/Ownable.sol";
// import "@openzeppelin/contracts/security/Pausable.sol";
// import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
// import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
// import {RealEstateNFT} from "./RealEstateNft.sol";

// interface IKYCVerifier {
//     function isKYCApproved(address user) external view returns (bool);
// }

// contract RealEstate is Ownable, Pausable, ReentrancyGuard {
//     RealEstateNFT public nft;
//     AggregatorV3Interface public pricefeed; // e.g., CELO/USD or ETH/USD
//     IKYCVerifier public kycVerifier;

//     constructor() {

        
        
//         pricefeed = AggregatorV3Interface(address(0x022F9dCC73C5Fb43F2b4eF2EF9ad3eDD1D853946));
//         kycVerifier = IKYCVerifier(address(0x73be0078b59FFfE2CE9f0007496258D11eE746De));
    
//     }

//     // ===== config =====
//     uint16 public marketplaceFeeBps = 150; // 1.5%
//     address public feeRecipient = address(this);

//     function setFee(uint16 bps, address recipient) external onlyOwner {
//         require(bps <= 500, "fee too high");
//         require(recipient != address(0), "bad recipient");
//         marketplaceFeeBps = bps;
//         feeRecipient = recipient;
//     }

//     uint64 public defaultInspectionPeriod = 7 days;
//     uint64 public defaultClosePeriod = 21 days;

//     function setDeadlines(uint64 inspection, uint64 closeBy) external onlyOwner {
//         require(inspection > 0 && closeBy > inspection, "bad deadlines");
//         defaultInspectionPeriod = inspection;
//         defaultClosePeriod = closeBy;
//     }

//     // ===== types =====
//     enum Status { Active, UnderContract, Sold, Cancelled }

//     struct Property {
//         uint256 productID;
//         address payable seller; // funds recipient (current owner until sale finalizes)
//         uint256 price; // USD with 2 decimals
//         string propertyTitle;
//         string category;
//         string[] images;
//         string metadataURI; // canonical metadata JSON (IPFS)
//         string propertyAddress;
//         string description;
//         uint256 nftId; // token minted for this property (owned by marketplace custody until sale)
//         Status status;
//         bool sold;
//     }

//     struct Escrow {
//         address buyer;
//         uint256 amount;
//         bool confirmed;
//         bool refunded;
//         uint64 depositedAt;
//         uint64 inspectionEnds;
//         uint64 closeBy;
//     }

//     struct Review { address reviewer; uint256 productId; uint8 rating; string comment; uint256 likes; }
//     struct ProductAgg { uint256 totalRating; uint256 numReviews; }

//     // ===== storage =====
//     mapping(uint256 => Property) private properties;
//     mapping(uint256 => Escrow) public escrows;
//     mapping(uint256 => ProductAgg) private products;
//     mapping(uint256 => Review[]) private reviews;

//     mapping(uint256 => mapping(address => bool)) public pastBuyer;
//     mapping(uint256 => mapping(address => bool)) public hasReviewed;
//     mapping(uint256 => mapping(uint256 => mapping(address => bool))) public hasLiked;

//     uint256 public propertyIndex;
//     uint256 public reviewsCounter;

//     // ===== events =====
//     event PropertyListed(uint256 indexed id, address indexed seller, uint256 priceUsd2dp, uint256 indexed nftId);
//     event PropertyUpdated(uint256 indexed id);
//     event PriceUpdated(uint256 indexed id, uint256 oldPrice, uint256 newPrice);

//     event PaymentDeposited(uint256 indexed id, address indexed buyer, uint256 amountWei);
//     event PaymentNotification(address indexed buyer, address indexed seller, uint256 indexed propertyId, string status);

//     event PropertySold(uint256 indexed id, address indexed oldSeller, address indexed newOwner, uint256 priceUsd2dp, uint256 nftId);
//     event DisputeResolved(uint256 indexed id, address recipient, bool refunded);
//     event EscrowCancelled(uint256 indexed id, address by);
//     event EscrowExpired(uint256 indexed id);

//     event ReviewAdded(uint256 indexed productId, address indexed reviewer, uint8 rating, string comment);
//     event ReviewLiked(uint256 indexed productId, uint256 indexed reviewIndex, address indexed liker, uint256 likes);

//     // ===== price helpers =====
//     function _scaleTo1e18(int256 answer, uint8 decimals) internal pure returns (uint256) {
//         require(answer > 0, "bad price");
//         if (decimals == 18) return uint256(answer);
//         if (decimals < 18) return uint256(answer) * (10 ** (18 - decimals));
//         return uint256(answer) / (10 ** (decimals - 18));
//     }

//     function getLatestEthPrice() public view returns (uint256) {
//         (, int256 price,,,) = pricefeed.latestRoundData();
//         uint8 dec = pricefeed.decimals();
//         return _scaleTo1e18(price, dec);
//     }

//     function getRequiredNative(uint256 propertyId) public view returns (uint256) {
//         Property memory prop = properties[propertyId];
//         require(prop.status == Status.Active || prop.status == Status.UnderContract, "not listable");
//         require(!prop.sold, "sold");
//         uint256 ethUsd = getLatestEthPrice(); 
//         return (prop.price * 1e16) / ethUsd;
//     }

//     // ===== modifiers =====
//     modifier onlyPropertySeller(uint256 id) {
//         require(properties[id].seller == msg.sender, "Not seller");
//         _;
//     }

//     // ===== listing =====
//     function listProperty(
//         uint256 priceUsd2dp,
//         string calldata _propertyTitle,
//         string calldata _category,
//         string[] calldata _images,
//         string calldata _metadataURI,
//         string calldata _propertyAddress,
//         string calldata _description
//     ) external whenNotPaused returns (uint256) {
//         require(priceUsd2dp > 0, "price=0");
//         require(kycVerifier.isKYCApproved(msg.sender), "KYC required");

//         // mint NFT into marketplace custody (address(this))
//         uint256 nftId = nft.mintProperty(address(this), _metadataURI);

//         uint256 productId = propertyIndex++;
//         Property storage p = properties[productId];
//         p.productID = productId;
//         p.seller = payable(msg.sender);
//         p.price = priceUsd2dp;
//         p.propertyTitle = _propertyTitle;
//         p.category = _category;
//         p.metadataURI = _metadataURI;
//         p.propertyAddress = _propertyAddress;
//         p.description = _description;
//         p.nftId = nftId;
//         p.status = Status.Active;
//         p.sold = false;

//         for (uint i; i < _images.length; i++) p.images.push(_images[i]);

//         emit PropertyListed(productId, msg.sender, priceUsd2dp, nftId);
//         return productId;
//     }

//     // ===== update/price =====
//     function updateProperty(
//         uint256 productId,
//         string[] calldata _images,
//         string calldata _propertyAddress,
//         string calldata _propertyTitle,
//         string calldata _category,
//         string calldata _description
//     ) external whenNotPaused onlyPropertySeller(productId) returns (uint256) {
//         Property storage p = properties[productId];
//         p.propertyTitle = _propertyTitle;
//         p.category = _category;
//         p.propertyAddress = _propertyAddress;
//         p.description = _description;
//         delete p.images;
//         for (uint i; i < _images.length; i++) p.images.push(_images[i]);
//         emit PropertyUpdated(productId);
//         return productId;
//     }

//     function updatePrice(uint256 productId, uint256 newPriceUsd2dp) external whenNotPaused onlyPropertySeller(productId) {
//         require(newPriceUsd2dp > 0, "price=0");
//         uint256 old = properties[productId].price;
//         properties[productId].price = newPriceUsd2dp;
//         emit PriceUpdated(productId, old, newPriceUsd2dp);
//     }

//     // ===== escrow =====
//     function depositPayment(uint256 id) external payable whenNotPaused nonReentrant {
//         Property storage p = properties[id];
//         require(p.status == Status.Active, "not active");
//         require(!p.sold, "sold");
//         require(escrows[id].amount == 0, "escrowed");
//         require(kycVerifier.isKYCApproved(msg.sender), "KYC buyer");

//         uint256 requiredWei = getRequiredNative(id);
//         require(msg.value >= requiredWei, "insufficient native amount");

//         Escrow storage e = escrows[id];
//         e.buyer = msg.sender;
//         e.amount = msg.value;
//         e.confirmed = false;
//         e.refunded = false;
//         e.depositedAt = uint64(block.timestamp);
//         e.inspectionEnds = uint64(block.timestamp + defaultInspectionPeriod);
//         e.closeBy = uint64(block.timestamp + defaultClosePeriod);

//         p.status = Status.UnderContract;

//         emit PaymentDeposited(id, msg.sender, msg.value);
//         emit PaymentNotification(msg.sender, p.seller, id, "PaymentDeposited");
//     }

//     function cancelDuringInspection(uint256 id) external whenNotPaused nonReentrant {
//         Escrow storage e = escrows[id];
//         Property storage p = properties[id];
//         require(msg.sender == e.buyer, "Not buyer");
//         require(e.amount > 0 && !e.confirmed, "no escrow");
//         require(block.timestamp <= e.inspectionEnds, "inspection over");
//         _refund(id, p, e);
//         emit EscrowCancelled(id, msg.sender);
//     }

//     function forceCancelIfExpired(uint256 id) external whenNotPaused nonReentrant {
//         Escrow storage e = escrows[id];
//         Property storage p = properties[id];
//         require(e.amount > 0 && !e.confirmed, "no escrow");
//         require(block.timestamp > e.closeBy, "not expired");
//         _refund(id, p, e);
//         emit EscrowExpired(id);
//     }

//     /// @notice Seller finalizes sale after buyer deposited and inspection done.
//     function finalizeSale(uint256 id) external whenNotPaused nonReentrant onlyPropertySeller(id) {
//         Escrow storage e = escrows[id];
//         Property storage p = properties[id];

//         require(e.amount > 0 && !e.confirmed, "no escrow or already confirmed");
//         require(p.status == Status.UnderContract, "not under contract");
//         require(block.timestamp <= e.closeBy, "expired");

//         e.confirmed = true;
//         p.sold = true;

//         uint256 amount = e.amount;
//         e.amount = 0; // effects before interactions

//         // compute fee and seller proceeds
//         uint256 fee = (amount * marketplaceFeeBps) / 10_000;
//         uint256 sellerProceeds = amount - fee;

//         if (fee > 0) {
//             (bool ffee, ) = payable(feeRecipient).call{value: fee}("");
//             require(ffee, "fee transfer failed");
//         }
//         (bool sent, ) = p.seller.call{value: sellerProceeds}("");
//         require(sent, "seller transfer failed");

//         // transfer NFT from marketplace custody to buyer
//         uint256 tokenId = p.nftId;
//         nft.safeTransferFrom(address(this), e.buyer, tokenId);

//         address oldSeller = p.seller;
//         p.seller = payable(e.buyer); // update owner reference
//         p.status = Status.Sold;
//         pastBuyer[id][e.buyer] = true;

//         emit PropertySold(id, oldSeller, p.seller, p.price, tokenId);
//         emit PaymentNotification(e.buyer, oldSeller, id, "PaymentFinalized_SellerConfirmed");
//     }

//     function resolveDispute(uint256 id, bool refundBuyer) external onlyOwner nonReentrant {
//         Escrow storage e = escrows[id];
//         Property storage p = properties[id];
//         require(!e.confirmed, "already confirmed");
//         require(e.amount > 0, "no escrow");

//         e.confirmed = true;
//         p.sold = refundBuyer ? false : true;

//         uint256 amount = e.amount;
//         e.amount = 0;

//         address recipient = refundBuyer ? e.buyer : p.seller;
//         (bool sent, ) = payable(recipient).call{value: amount}("");
//         require(sent, "transfer failed");

//         if (!refundBuyer) {
//             // transfer NFT to buyer as part of admin-enforced sale
//             uint256 tokenId = p.nftId;
//             nft.safeTransferFrom(address(this), e.buyer, tokenId);
//             address oldSeller = p.seller;
//             p.seller = payable(e.buyer);
//             p.status = Status.Sold;
//             pastBuyer[id][e.buyer] = true;
//             emit PropertySold(id, oldSeller, p.seller, p.price, tokenId);
//         } else {
//             p.status = Status.Active; // back to market
//         }

//         emit DisputeResolved(id, recipient, refundBuyer);
//         emit PaymentNotification(e.buyer, p.seller, id, refundBuyer ? "Refunded" : "DisputeResolved");
//     }

//     function _refund(uint256 id, Property storage p, Escrow storage e) internal {
//         uint256 amt = e.amount;
//         e.amount = 0;
//         e.refunded = true;
//         p.status = Status.Active;
//         (bool ok, ) = payable(e.buyer).call{value: amt}("");
//         require(ok, "refund failed");
//     }

//     // ===== reviews =====
//     function addReview(uint256 productId, uint8 rating, string calldata comment) external whenNotPaused {
//         require(rating >= 1 && rating <= 5, "1-5");
//         require(pastBuyer[productId][msg.sender], "not buyer");
//         require(!hasReviewed[productId][msg.sender], "reviewed");
//         hasReviewed[productId][msg.sender] = true;

//         reviews[productId].push(Review(msg.sender, productId, rating, comment, 0));
//         products[productId].totalRating += rating;
//         products[productId].numReviews++;
//         reviewsCounter++;

//         emit ReviewAdded(productId, msg.sender, rating, comment);
//     }

//     function getProductReview(uint256 productId) external view returns (Review[] memory) {
//         return reviews[productId];
//     }

//     function likeReview(uint256 productId, uint256 reviewIndex) external whenNotPaused {
//         require(!hasLiked[productId][reviewIndex][msg.sender], "liked");
//         hasLiked[productId][reviewIndex][msg.sender] = true;
//         reviews[productId][reviewIndex].likes++;
//         emit ReviewLiked(productId, reviewIndex, msg.sender, reviews[productId][reviewIndex].likes);
//     }

//     function getHighestRatedProduct() external view returns (uint256) {
//         uint256 best;
//         uint256 id;
//         for (uint256 i; i < propertyIndex; i++) {
//             if (products[i].numReviews > 0) {
//                 uint256 avg = products[i].totalRating / products[i].numReviews;
//                 if (avg > best) { best = avg; id = i; }
//             }
//         }
//         return id;
//     }

//     // ===== getters =====
//     function getAllProperties() external view returns (Property[] memory) {
//         uint256 n = propertyIndex;
//         Property[] memory items = new Property[](n);
//         for (uint256 i; i < n; i++) items[i] = properties[i];
//         return items;
//     }

//     function getProperties(uint256 offset, uint256 limit) external view returns (Property[] memory) {
//         uint256 end = offset + limit;
//         if (end > propertyIndex) end = propertyIndex;
//         uint256 size = end > offset ? end - offset : 0;
//         Property[] memory items = new Property[](size);
//         for (uint256 i; i < size; i++) items[i] = properties[offset + i];
//         return items;
//     }

//     function getProperty(uint256 id) external view returns (
//         uint256, address, uint256, string memory, string memory, string[]
//          memory, string memory, string memory, bool, Status, uint256
//     ) {
//         Property storage p = properties[id];
//         return (p.productID, p.seller, p.price, p.propertyTitle,
//          p.category, p.images, p.metadataURI, p.propertyAddress, p.sold, p.status, p.nftId);
//     }

//     function getUserProperties(address user) external view returns (Property[] memory) {
//         uint256 count;
//         for (uint256 i; i < propertyIndex; i++) if (properties[i].seller == user) count++;
//         Property[] memory items = new Property[](count);
//         uint256 j;
//         for (uint256 i; i < propertyIndex; i++) if (properties[i].seller == user) items[j++] = properties[i];
//         return items;
//     }

//     // helper: update integrations if needed
//     function setIntegrations(address _nft, address _pricefeed, address _kyc) external onlyOwner {
//         if (_nft != address(0)) nft = RealEstateNFT(_nft);
//         if (_pricefeed != address(0)) pricefeed = AggregatorV3Interface(_pricefeed);
//         if (_kyc != address(0)) kycVerifier = IKYCVerifier(_kyc);
//     }
// }

// pragma solidity ^0.8.20;

// import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
// import "./IKYCVerifier.sol";

// contract RealEstate {
//     address public admin;
//     AggregatorV3Interface internal pricefeed;
//     IKYCVerifier public kycVerifier;

//     constructor( ) {
//         admin = msg.sender;
//         pricefeed = AggregatorV3Interface(address(0x022F9dCC73C5Fb43F2b4eF2EF9ad3eDD1D853946));
//         kycVerifier = IKYCVerifier(address(0x73be0078b59FFfE2CE9f0007496258D11eE746De));
//     }

//     struct Property {
//         uint256 productID;
//         address payable owner;
//         uint256 price; // in USD (2 decimals)

//         string propertyTitle;
//         string category;
//         string[] images;
//         string propertyAddress;
//         string description;
//         address[] reviewers;
//         string[] reviews;
//         bool sold;
//     }

//     struct Escrow {
//         address buyer;
//         uint256 amount;
//         bool confirmed;
//         bool refunded;
//     }

//     struct Review {
//         address reviewer;
//         uint256 productId;
//         uint256 rating;
//         string comment;
//         uint256 likes;
//     }

//     struct Product {
//         uint256 productId;
//         uint256 totalRating;
//         uint256 numReviews;
//     }

//     mapping(uint256 => Property) private properties;
//     mapping(uint256 => Escrow) public escrows;
//     mapping(uint256 => Product) private products;
//     mapping(uint256 => Review[]) private reviews;
//     mapping(address => uint256[]) private userReviews;
//     uint256 public propertyIndex;
//     uint256 public reviewsCounter;

//     // Events
//     event PropertyListed(uint256 indexed id, address indexed owner, uint256 price);
//     event PaymentDeposited(uint256 indexed id, address indexed buyer, uint256 amount);
//     event PropertySold(uint256 indexed id, address indexed oldOwner, address indexed newOwner, uint256 price);
//     event ReviewAdded(uint256 indexed productId, address indexed reviewer, uint256 rating, string comment);
//     event ReviewLiked(uint256 indexed productId, uint256 indexed reviewIndex, address indexed liker, uint256 likes);
//     event DisputeResolved(uint256 indexed id, address recipient, bool refunded);

//     // Chainlink Price Feed
//     function getLatestEthPrice() public view returns (uint256) {
//         (, int price,,,) = pricefeed.latestRoundData();
//         return uint256(price * 1e10); // 8 decimals to 18
//     }

//     function getRequiredEth(uint256 propertyId) public view returns (uint256) {
//         Property memory prop = properties[propertyId];
//         require(!prop.sold, "Already sold");
//         uint256 ethPrice = getLatestEthPrice();
//         return (prop.price * 1e18) / ethPrice;
//     }



// function listProperty(
//     address payable owner,
//     uint256 price,
//     string memory _propertyTitle,
//     string memory _category,
//     string[] memory _images,        // <-- Change to string[]
//     string memory _propertyAddress,
//     string memory _description
// ) external returns (uint256) {
//     require(price > 0, "Price must be greater than 0");
//     require(kycVerifier.isKYCApproved(owner), "Owner not KYC approved");

//     uint256 productId = propertyIndex++;
//     Property storage property = properties[productId];

//     property.productID = productId;
//     property.owner = owner;
//     property.price = price;
//     property.propertyTitle = _propertyTitle;
//     property.category = _category;
//     property.propertyAddress = _propertyAddress;
//     property.description = _description;

   
//     for (uint i = 0; i < _images.length; i++) {
//         property.images.push(_images[i]);
//     }

//     emit PropertyListed(productId, owner, price);
//     return productId;
// }

//     // Escrow: Buyer deposits payment
//     function depositPayment(uint256 id) external payable {
//         Property storage property = properties[id];
//         require(!property.sold, "Already sold");
//         require(msg.value >= getRequiredEth(id), "Insufficient ETH");
//         require(escrows[id].amount == 0, "Already deposited");
//         require(kycVerifier.isKYCApproved(msg.sender), "Buyer not KYC approved");

//         escrows[id] = Escrow({
//             buyer: msg.sender,
//             amount: msg.value,
//             confirmed: false,
//             refunded: false
//         });

//         emit PaymentDeposited(id, msg.sender, msg.value);
//     }

//     // Buyer confirms purchase
//     function confirmPurchase(uint256 id) external {
//         Escrow storage escrow = escrows[id];
//         Property storage property = properties[id];

//         require(msg.sender == escrow.buyer, "Not buyer");
//         require(!escrow.confirmed, "Already confirmed");
//         require(escrow.amount > 0, "No escrowed funds");

//         escrow.confirmed = true;
//         property.sold = true;

//         uint256 amount = escrow.amount;
//         escrow.amount = 0;

//         (bool sent, ) = property.owner.call{value: amount}("");
//         require(sent, "Transfer failed");

//         address oldOwner = property.owner;
//         property.owner = payable(escrow.buyer);

//         emit PropertySold(id, oldOwner, property.owner, property.price);
//     }

//     // Admin resolves disputes (refund or pay seller)
//     function resolveDispute(uint256 id, bool refundBuyer) external {
//         require(msg.sender == admin, "Only admin");
//         Escrow storage escrow = escrows[id];
//         Property storage property = properties[id];

//         require(!escrow.confirmed, "Already confirmed");
//         require(escrow.amount > 0, "No escrowed funds");

//         escrow.confirmed = true;
//         escrow.refunded = refundBuyer;
//         property.sold = true;

//         uint256 amount = escrow.amount;
//         escrow.amount = 0;

//         address recipient = refundBuyer ? escrow.buyer : property.owner;
//         (bool sent, ) = payable(recipient).call{value: amount}("");
//         require(sent, "Transfer failed");

//         if (!refundBuyer) {
//             address oldOwner = property.owner;
//             property.owner = payable(escrow.buyer);
//             emit PropertySold(id, oldOwner, property.owner, property.price);
//         }

//         emit DisputeResolved(id, recipient, refundBuyer);
//     }

//     // Update property info
//     function updateProperty(
//         address owner,
//         uint256 productId,
//         string[] memory _images,
//         string memory _propertyAddress,
//         string memory _propertyTitle,
//         string memory _category,
//         string memory _description
//     ) external returns (uint256) {
//         Property storage property = properties[productId];
//         require(property.owner == owner, "Not owner");

//         property.propertyTitle = _propertyTitle;
//         property.category = _category;
//         property.propertyAddress = _propertyAddress;
//         property.description = _description;
        
//     for (uint i = 0; i < _images.length; i++) {
//         property.images.push(_images[i]);
//     }

//         return productId;
//     }

//     function updatePrice(address owner, uint256 productId, uint256 price)
//      external returns (string memory) {
//         Property storage property = properties[productId];
//         require(property.owner == owner, "Not owner");

//         property.price = price;
//         return "Price updated";
//     }

//     function getAllProperties() public view returns (Property[] memory) {
//         uint256 itemCount = propertyIndex;
//         Property[] memory items = new Property[](itemCount);
//         for (uint256 i = 0; i < itemCount; i++) {
//             items[i] = properties[i];
//         }
//         return items;
//     }

//     function getProperty(uint256 id) external view returns (
//     uint256, address, uint256, string memory, string memory,
//     string[] memory, string memory, string memory, bool
// ) {
//     Property memory property = properties[id];
//     return (
//         property.productID,
//         property.owner,
//         property.price,
//         property.propertyTitle,
//         property.category,
//         property.images,
//         property.propertyAddress,
//         property.description,
//         property.sold
//     );
// }


//     function getUserProperties(address user) external view returns (Property[] memory) {
//         uint256 count = 0;
//         for (uint256 i = 0; i < propertyIndex; i++) {
//             if (properties[i].owner == user) {
//                 count++;
//             }
//         }

//         Property[] memory items = new Property[](count);
//         uint256 j = 0;
//         for (uint256 i = 0; i < propertyIndex; i++) {
//             if (properties[i].owner == user) {
//                 items[j++] = properties[i];
//             }
//         }
//         return items;
//     }

//     // Reviews
//     function addReview(uint256 productId, uint256 rating, string calldata comment, address user) external {
//         require(rating >= 1 && rating <= 5, "Rating must be 1-5");

//         Property storage property = properties[productId];
//         property.reviewers.push(user);
//         property.reviews.push(comment);

//         reviews[productId].push(Review(user, productId, rating, comment, 0));
//         userReviews[user].push(productId);

//         products[productId].totalRating += rating;
//         products[productId].numReviews++;

//         emit ReviewAdded(productId, user, rating, comment);
//         reviewsCounter++;
//     }

//     function getProductReview(uint256 productId) external view returns (Review[] memory) {
//         return reviews[productId];
//     }

//     function getUserReviews(address user) external view returns (Review[] memory) {
//         uint256 total = userReviews[user].length;
//         Review[] memory result = new Review[](total);

//         uint256 index = 0;
//         for (uint256 i = 0; i < total; i++) {
//             uint256 productId = userReviews[user][i];
//             Review[] memory productReviews = reviews[productId];
//             for (uint256 j = 0; j < productReviews.length; j++) {
//                 if (productReviews[j].reviewer == user) {
//                     result[index++] = productReviews[j];
//                 }
//             }
//         }
//         return result;
//     }

//     function likeReview(uint256 productId, uint256 reviewIndex, address user) external {
//         Review storage review = reviews[productId][reviewIndex];
//         review.likes++;
//         emit ReviewLiked(productId, reviewIndex, user, review.likes);
//     }

//     function getHighestRatedProduct() external view returns (uint256) {
//         uint256 highestRating = 0;
//         uint256 highestRatedProductId = 0;

//         for (uint256 i = 0; i < propertyIndex; i++) {
//             if (products[i].numReviews > 0) {
//                 uint256 avgRating = products[i].totalRating / products[i].numReviews;
//                 if (avgRating > highestRating) {
//                     highestRating = avgRating;
//                     highestRatedProductId = i;
//                 }
//             }
//         }

//         return highestRatedProductId;
//     }
// }




