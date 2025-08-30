import { useCallback } from "react";
import useContractInstance from "./useContractInstance";
import { useAppKitAccount, useAppKitNetwork } from "@reown/appkit/react";
import { toast } from "react-toastify";
import { celoAlfajores } from "@reown/appkit/networks";
import { ErrorDecoder } from "ethers-decode-error";
import { useEffect, useState } from "react";
import { formatEther, ethers} from "ethers";

/** ---------------------------
 *  READ HOOKS
 *  ---------------------------
 */

export function useGetLatestEthPrice() {
  const [ethPrice, setEthPrice] = useState(null);
  const contract = useContractInstance("realEstate", false);

  useEffect(() => {
    const fetchPrice = async () => {
      if (!contract) return;
      try {
        const price = await contract.getLatestEthPrice(); // BigInt (18 decimals)
        
        // Convert to USD by dividing manually (not formatEther)
        const formatted = Number(price) / 1e18; 
        setEthPrice(formatted.toFixed(2)); // e.g. "2000.00"
      } catch (err) {
        console.error("Error fetching ETH price:", err);
      }
    };

    fetchPrice();
  }, [contract]);

  return { ethPrice };
}


export const useGetRequiredEth = () => {
  const contract = useContractInstance("realEstate", true);

  return useCallback(
    async (propertyId) => {
      try {
        const requiredEth = await contract.getRequiredEth(propertyId);
        return requiredEth; 
      } catch (error) {
        console.error(error);
        toast.error("Failed to fetch required ETH");
        return null;
      }
    },
    [contract]
  );
};

export const useGetAllProperties = () => {
  const contract = useContractInstance("realEstate", true);

  return useCallback(async () => {
    if (!contract) {
      console.warn("Contract not loaded yet");
      return []; // early exit
    }

    try {
      const rawProps = await contract.getAllProperties();

      return rawProps.map((p) => ({
        productID: p.productID,    
        owner: p.owner,
        title: p.title,
        category: p.category,
        price: p.price.toString(), 
        location: p.propertyAddress,
        description: p.description,
        images: p.images, 
        sold: p.sold  || false
      }));
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch properties");
      return [];
    }
  }, [contract]);
};



export function useGetProperty() {
  const contract = useContractInstance();

  return useCallback(
    async (id) => {
      if (!contract) return null;
      const property = await contract.getProperty(id);

      return {
        title: property.title,
        category: property.category,
        price: property.price ? ethers.formatEther(property.price) : "0 ",
        location: property.location,
        description: property.description,
        images: property.images || [],
        sold: property.sold,
      };
    },
    [contract] // only changes when contract changes
  );
}

// Get user properties
export const useGetUserProperties = () => {
  const contract = useContractInstance("realEstate", true);
  return useCallback(async (userAddress) => {
    try {
      return await contract.getUserProperties(userAddress);
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch user properties");
      return [];
    }
  }, [contract]);
};

// Get reviews for a product
// export const useGetProductReview = () => {
//   const contract = useContractInstance("realEstate", true);
//   return useCallback(async (productId) => {
//     try {
//       return await contract.getProductReview(productId);
//     } catch (error) {
//       console.error(error);
//       // toast.error("Failed to fetch product reviews");
//       return [];
//     }
//   }, [contract]);
// };
export const useGetProductReview = () => {
  const contract = useContractInstance("realEstate", true);

  return useCallback(async (productId) => {
    if (!contract) {
      console.warn("Contract not ready yet");
      return [];
    }
    try {
      return await contract.getProductReview(productId);
    } catch (error) {
      console.error("Failed to fetch product reviews:", error);
      return [];
    }
  }, [contract]);
};

// Get reviews by user
export const useGetUserReviews = () => {
  const contract = useContractInstance("realEstate", true);
  return useCallback(async (userAddress) => {
    try {
      return await contract.getUserReviews(userAddress);
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch user reviews");
      return [];
    }
  }, [contract]);
};

// Get highest rated product
export const useGetHighestRatedProduct = () => {
  const contract = useContractInstance("realEstate", true);
  return useCallback(async () => {
    try {
      return await contract.getHighestRatedProduct();
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch highest rated product");
      return null;
    }
  }, [contract]);
};

/** ---------------------------
 *  WRITE HOOKS
 *  ---------------------------
 */

// Helper: validate wallet & network
const useValidation = (contract, address, chainId) => {
  if (!address) {
    toast.error("Please connect your wallet");
    return false;
  }
  if (!contract) {
    toast.error("Contract not found");
    return false;
  }
  if (Number(chainId) !== Number(celoAlfajores.id)) {
    toast.error("You're not connected to Celo Alfajores");
    return false;
  }
  return true;
};


export const useListProperty = () => {
  const contract = useContractInstance("realEstate", true); 
  const { address } = useAppKitAccount();
  const { chainId } = useAppKitNetwork();

  return useCallback(
    async (owner, price, title, category, images, propertyAddress, description) => {
      if (!price || !title || !category || !images || !propertyAddress || !description) {
        toast.error("All fields are required");
        return false;
      }
      console.log("useListProperty contract:", contract); 
      if (!useValidation(contract, address, chainId)) return false;

      try {
        // Estimate gas with ethers BigNumber math

        const estimatedGas = await contract.listProperty.estimateGas(
          owner,
          price,
          title,
          category,
          images,
          propertyAddress,
          description
        );

    
        const tx = await contract.listProperty(owner, price, title, category, images,
           propertyAddress, description, {
          gasLimit: (estimatedGas * BigInt(120)) / BigInt(100)
        });

        const receipt = await tx.wait();

        if (receipt.status === 1) {
          toast.success("Property listed successfully");
          return true;
        } else {
          toast.error("Transaction failed");
          return false;
        }
      } catch (error) {
        console.error("Transaction error:", error);
        let errorMsg = "Transaction failed";

        // Decode revert reason if possible
        if (ErrorDecoder && typeof ErrorDecoder.create === "function") {
          try {
            const decoder = ErrorDecoder.create();
            const decoded = await decoder.decode(error);
            if (decoded && decoded.reason) errorMsg = decoded.reason;
          } catch {
            // ignore decoder errors
          }
        } else if (error.reason) {
          errorMsg = error.reason;
        } else if (error.message) {
          errorMsg = error.message;
        }

        toast.error(errorMsg);
        return false;
      }
    },
    [contract, address, chainId]
  );
};


// export const useDepositPayment = () => {
//   const contract = useContractInstance("realEstate", true);
//   const { address } = useAppKitAccount();
//   const { chainId } = useAppKitNetwork();

//   return useCallback(async (id, amountInWei) => {
//     if (!useValidation(contract, address, chainId)) return false;
//     try {
  
//        const amountInWei = await contract.getRequiredEth(id);

//       console.log("Sending deposit:", { id, amountInWei: amountInWei.toString() });
      
//       const estimatedGas = await contract.depositPayment.estimateGas(id, {
//         value: amountInWei,
//       });

//       const tx = await contract.depositPayment(id, {
//         value: amountInWei,
//         gasLimit: (estimatedGas * BigInt(120)) / BigInt(100),
//       });

//       const receipt = await tx.wait();

//       if (receipt.status === 1) {
//         toast.success("Payment deposited successfully");
//         return true;
//       }
//       toast.error("Failed to deposit payment");
//       return false;
//     } catch (error) {
//       console.error("Deposit error:", error);
//       const errorDecoder = ErrorDecoder.create();
//       const decodeError = await errorDecoder.decode(error);
//       toast.error(decodeError.reason || "Transaction failed");
//       return false;
//     }
//   }, [contract, address, chainId]);
// };
export function useDepositPayment() {
  const contract = useContractInstance("realEstate", true);

  const depositPayment = useCallback(
    async (propertyId, duration, requiredEth) => {
      try {
        if (!contract) throw new Error("Contract not loaded");

        // Normalize requiredEth to BigInt
        let valueToSend;
        if (typeof requiredEth === "string" || typeof requiredEth === "number") {
          valueToSend = BigInt(requiredEth);
        } else if (typeof requiredEth === "bigint") {
          valueToSend = requiredEth;
        } else {
          throw new Error("Invalid requiredEth type");
        }

        // Now pass both id and duration
        const tx = await contract.depositPayment(propertyId, duration, { value: valueToSend });
        await tx.wait();

        toast.success("Payment deposited successfully!");
      } catch (error) {
        console.error("Deposit error:", error);
        toast.error(`Deposit error: ${error.message || error}`);
      }
    },
    [contract]
  );

  return depositPayment;
}



// return useCallback(async (id, amountInWei) => {
//   if (!useValidation(contract, address, chainId)) return false;
//   try {
//     console.log("Sending deposit:", {
//       id,
//       amountInWei: amountInWei.toString()
//     });

//     const estimatedGas = await contract.depositPayment.estimateGas(id, {
//       value: amountInWei,
//     });

//     const tx = await contract.depositPayment(id, {
//       value: amountInWei,
//       gasLimit: (estimatedGas * BigInt(120)) / BigInt(100),
//     });

//     const receipt = await tx.wait();

//     if (receipt.status === 1) {
//       toast.success("Payment deposited successfully");
//       return true;
//     }
//     toast.error("Failed to deposit payment");
//     return false;
//   } catch (error) {
//     console.error("Deposit error:", error);
//     const errorDecoder = ErrorDecoder.create();
//     const decodeError = await errorDecoder.decode(error);
//     toast.error(decodeError.reason || "Transaction failed");
//     return false;
//   }
// }, [contract, address, chainId]);

// Confirm purchase
export const useConfirmPurchase = () => {
  const contract = useContractInstance("realEstate", true);
  const { address } = useAppKitAccount();
  const { chainId } = useAppKitNetwork();

  return useCallback(async (id) => {
    if (!useValidation(contract, address, chainId)) return false;
    try {
      const estimatedGas = await contract.confirmPurchase.estimateGas(id);
      const tx = await contract.confirmPurchase(id, { gasLimit: (estimatedGas * BigInt(120)) / BigInt(100) });
      const receipt = await tx.wait();

      if (receipt.status === 1) {
        toast.success("Purchase confirmed");
        return true;
      }
      toast.error("Failed to confirm purchase");
      return false;
    } catch (error) {
      const errorDecoder = ErrorDecoder.create();
      const decodeError = await errorDecoder.decode(error);
      toast.error(decodeError.reason || "Transaction failed");
      return false;
    }
  }, [contract, address, chainId]);
};

// Resolve dispute
export const useResolveDispute = () => {
  const contract = useContractInstance("realEstate", true);
  const { address } = useAppKitAccount();
  const { chainId } = useAppKitNetwork();

  return useCallback(async (id, refundBuyer) => {
    if (!useValidation(contract, address, chainId)) return false;
    try {
      const estimatedGas = await contract.resolveDispute.estimateGas(id, refundBuyer);
      const tx = await contract.resolveDispute(id, refundBuyer, { gasLimit: (estimatedGas * BigInt(120)) / BigInt(100) });
      const receipt = await tx.wait();

      if (receipt.status === 1) {
        toast.success("Dispute resolved");
        return true;
      }
      toast.error("Failed to resolve dispute");
      return false;
    } catch (error) {
      const errorDecoder = ErrorDecoder.create();
      const decodeError = await errorDecoder.decode(error);
      toast.error(decodeError.reason || "Transaction failed");
      return false;
    }
  }, [contract, address, chainId]);
};

// Update property info
export const useUpdateProperty = () => {
  const contract = useContractInstance("realEstate", true);
  const { address } = useAppKitAccount();
  const { chainId } = useAppKitNetwork();

  return useCallback(async (owner, productId, images, propertyAddress, title, category, description) => {
    if (!useValidation(contract, address, chainId)) return false;
    try {
      const estimatedGas = await contract.updateProperty.estimateGas(
        owner, productId, images, propertyAddress, title, category, description);
      const tx = await contract.updateProperty(owner, productId, images, propertyAddress, title, category, description, {
        gasLimit: (estimatedGas * BigInt(120)) / BigInt(100),
      });
      const receipt = await tx.wait();

      if (receipt.status === 1) {
        toast.success("Property updated");
        return true;
      }
      toast.error("Failed to update property");
      return false;
    } catch (error) {
      const errorDecoder = ErrorDecoder.create();
      const decodeError = await errorDecoder.decode(error);
      toast.error(decodeError.reason || "Transaction failed");
      return false;
    }
  }, [contract, address, chainId]);
};

// Update price
export const useUpdatePrice = () => {
  const contract = useContractInstance("realEstate", true);
  const { address } = useAppKitAccount();
  const { chainId } = useAppKitNetwork();

  return useCallback(async (owner, productId, price) => {
    if (!useValidation(contract, address, chainId)) return false;
    try {
      const estimatedGas = await contract.updatePrice.estimateGas(
        owner, productId, price);
      const tx = await contract.updatePrice(owner, productId, price, {
        gasLimit: (estimatedGas * BigInt(120)) / BigInt(100),
      });
      const receipt = await tx.wait();

      if (receipt.status === 1) {
        toast.success("Price updated");
        return true;
      }
      toast.error("Failed to update price");
      return false;
    } catch (error) {
      const errorDecoder = ErrorDecoder.create();
      const decodeError = await errorDecoder.decode(error);
      toast.error(decodeError.reason || "Transaction failed");
      return false;
    }
  }, [contract, address, chainId]);
};

// Add review
export const useAddReview = () => {
  const contract = useContractInstance('realEstate', true);
  const { address } = useAppKitAccount();
  const { chainId } = useAppKitNetwork();

  return useCallback(async (productId, rating, comment, user) => {
    if (!useValidation(contract, address, chainId)) return false;
    try {
      const estimatedGas = await contract.addReview.estimateGas(
        productId, rating, comment, user);
      const tx = await contract.addReview(productId, rating, comment, user, {
        gasLimit: (estimatedGas * BigInt(120)) / BigInt(100),
      });
      const receipt = await tx.wait();

      if (receipt.status === 1) {
        toast.success("Review added");
        return true;
      }
      toast.error("Failed to add review");
      return false;
    } catch (error) {
      const errorDecoder = ErrorDecoder.create();
      const decodeError = await errorDecoder.decode(error);
      toast.error(decodeError.reason || "Transaction failed");
      return false;
    }
  }, [contract, address, chainId]);
};

// Like review
export const useLikeReview = () => {
  const contract = useContractInstance("realEstate", true);
  const { address } = useAppKitAccount();
  const { chainId } = useAppKitNetwork();

  return useCallback(async (productId, reviewIndex, user) => {
    if (!useValidation(contract, address, chainId)) return false;
    try {
      const estimatedGas = await contract.likeReview.estimateGas(
        productId, reviewIndex, user);
      const tx = await contract.likeReview(productId, reviewIndex, user, {
        gasLimit: (estimatedGas * BigInt(120)) / BigInt(100),
      });
      const receipt = await tx.wait();

      if (receipt.status === 1) {
        toast.success("Review liked");
        return true;
      }
      toast.error("Failed to like review");
      return false;
    } catch (error) {
      const errorDecoder = ErrorDecoder.create();
      const decodeError = await errorDecoder.decode(error);
      toast.error(decodeError.reason || "Transaction failed");
      return false;
    }
  }, [contract, address, chainId]);
};
