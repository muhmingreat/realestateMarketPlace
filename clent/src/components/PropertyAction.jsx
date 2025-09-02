import React, { useState } from "react";
import {
  useResolveDispute,
  useConfirmPurchase,
  useDepositPayment
} from "../hooks/useBlockchain";
// import useContractInstance from "../hooks/useContractInstance";
import { useAppKitAccount } from "@reown/appkit/react";
import { ethers } from "ethers";
import { useGetRequiredEth } from "../hooks/useBlockchain";
export default function PropertyActions({ property, adminAddress }) {
  const depositPayment = useDepositPayment();
  const confirmPurchase = useConfirmPurchase();
  const resolveDispute = useResolveDispute();
  const { address } = useAppKitAccount();
  const [loading, setLoading] = useState(false);
  // const contract = useContractInstance("realEstate", true);
  const getRequiredEth = useGetRequiredEth();

  if (!property) return null;

  // fallback escrow object
  const escrow = property.escrow || {
    buyer: ethers.ZeroAddress,
    amount: Number(0),
    confirmed: false,
    refunded: false,
  };

  // derive status
  const status =
    escrow.amount > 0n
      ? escrow.confirmed
        ? "Confirmed"
        : escrow.refunded
          ? "Disputed"
          : "Deposited"
      : "Listed";

  // addresses
  const currentAddress = address ? ethers.getAddress(address) : null;
  const sellerAddress = ethers.getAddress(property.seller);
  const buyerAddress = escrow.buyer ? ethers.getAddress(escrow.buyer) : null;
  const adminAddr = ethers.getAddress(adminAddress);

  // determine role
  let role = "guest";
  if (currentAddress) {
    if (currentAddress === adminAddr && currentAddress === sellerAddress) {
      role = "admin-seller";
    } else if (currentAddress === adminAddr) {
      role = "admin";
    } else if (currentAddress === sellerAddress) {
      role = "seller";
    } else {
      role = "buyer";
    }
  }

  const handleDeposit = async () => {
    try {
      setLoading(true);

      const requiredEth = await getRequiredEth(property.id);
      if (!requiredEth) return;


      const duration = 7 * 24 * 60 * 60;

      await depositPayment(property.id, duration, requiredEth);
    } catch (error) {
      console.error("Deposit failed:", error);
    } finally {
      setLoading(false);
    }
  };



  const handleConfirm = async () => {
    try {
      setLoading(true);
      await confirmPurchase(property.id);
    } catch (error) {
      console.error("Confirm failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (refundBuyer) => {
    try {
      setLoading(true);
      await resolveDispute(property.id, refundBuyer);
    } catch (error) {
      console.error("Resolve failed:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-3 border rounded-lg shadow-md bg-white">
      <h2 className="text-lg font-bold mb-3">Actions</h2>

      {status === "Confirmed" && (
        <p className="text-green-600 font-semibold">
          ✅ Deal Sealed: Property has been bought!
        </p>
      )}


      {role === "guest" && status !== "Confirmed" && (
        <p className="text-gray-500">Connect wallet to perform actions.</p>
      )}


      {role === "buyer" && status === "Listed" && (
        <button
          onClick={handleDeposit}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg"
        >
          {loading ? "Processing..." : "Deposit Payment"}
        </button>
      )}

      {role === "buyer" && status === "Deposited" && (
        <button
          onClick={handleConfirm}
          disabled={loading}
          className="px-4 py-2 bg-green-600 text-white rounded-lg"
        >
          {loading ? "Confirming..." : "Confirm Purchase"}
        </button>
      )}

      {(role === "admin" || role === "admin-seller") && (
        <>
          {status === "Deposited" && (
            <button
              onClick={() => handleResolve(false)}
              disabled={loading}
              className="px-4 py-2 bg-green-600 text-white rounded-lg"
            >
              {loading ? "Processing..." : "Release to Seller"}
            </button>
          )}

          {status === "Disputed" && (
            <div className="flex gap-3 mt-3">
              <button
                onClick={() => handleResolve(true)}
                disabled={loading}
                className="px-4 py-2 bg-red-600 text-white rounded-lg"
              >
                {loading ? "Resolving..." : "Refund Buyer"}
              </button>
              <button
                onClick={() => handleResolve(false)}
                disabled={loading}
                className="px-4 py-2 bg-green-600 text-white rounded-lg"
              >
                {loading ? "Resolving..." : "Release to Seller"}
              </button>
            </div>
          )}
        </>
      )}

    </div>
  );
}




