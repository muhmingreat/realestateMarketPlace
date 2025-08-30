import { useCallback } from "react";
import useContractInstance from "./useContractInstance";
import { useAppKitAccount, useAppKitNetwork } from "@reown/appkit/react";
import { toast } from "react-toastify";
import { celoAlfajores } from "@reown/appkit/networks";
import { ErrorDecoder } from "ethers-decode-error";

/** ---------------------------
 *  READ HOOKS
 *  ---------------------------
 */

// Check if user is KYC approved
export const useIsKYCApproved = () => {
  const contract = useContractInstance("kyc", true);
  return useCallback(async (userAddress) => {
    try {
      return await contract.isKYCApproved(userAddress);
    } catch (error) {
      console.error(error);
      toast.error("Failed to check KYC status");
      return false;
    }
  }, [contract]);
};

/** ---------------------------
 *  WRITE HOOKS
 *  ---------------------------
 */

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

// Set KYC approval status
export const useSetKYCApproved = () => {
  const contract = useContractInstance("kyc", true);
  const { address } = useAppKitAccount();
  const { chainId } = useAppKitNetwork();

  return useCallback(async (userAddress, status) => {
    if (!useValidation(contract, address, chainId)) return false;

    try {
      const estimatedGas = await contract.setKYCApproved.estimateGas(userAddress, status);
      const tx = await contract.setKYCApproved(userAddress, status, {
        gasLimit: (estimatedGas * BigInt(120)) / BigInt(100),
      });
      const receipt = await tx.wait();

      if (receipt.status === 1) {
        toast.success(`KYC status updated successfully`);
        return true;
      }
      toast.error("Failed to update KYC status");
      return false;
    } catch (error) {
      const errorDecoder = ErrorDecoder.create();
      const decodeError = await errorDecoder.decode(error);
      toast.error(decodeError.reason || "Transaction failed");
      return false;
    }
  }, [contract, address, chainId]);
};
