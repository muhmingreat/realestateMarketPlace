import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useAppKitAccount } from "@reown/appkit/react";
import { Link } from "react-router-dom";
import useKYC from "../hooks/useKycVerifier"; // Your backend API hook


export default function Header() {
  const { address } = useAppKitAccount();
  const { checkKYCStatus, loading: loadingKyc } = useKYC();
  const [kycStatus, setKycStatus] = useState(null);
const MotionLink  = motion(Link)
  // ==========================
  // Motion configs
  // ==========================
  const logoMotion = {
    animate: {
      y: [0, -2, 0],
      rotate: [-1, 1, -1],
      scale: [1, 1.03, 1],
    },
    transition: {
      duration: 1,
      repeat: Infinity,
      ease: "easeInOut",
    },
    whileHover: { scale: 1.1 },
  };

  const logoGlowMotion = {
    animate: {
      boxShadow: [
        "0 0 15px rgba(0,200,255,0.7)",
        "0 0 30px rgba(0,255,255,1)",
        "0 0 10px rgba(0,200,255,0.5)",
        "0 0 25px rgba(0,255,255,0.9)",
      ],
    },
    transition: {
      duration: 0.2,
      repeat: Infinity,
      ease: "linear",
    },
  };

  const navVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.15 } },
  };
   const links = [ { name: "Home", path: "/" },
     { name: "Properties", path: "properties" },
     { name: "My KYC", path: "kyc" },
     { name: "Dashboard", path: "dashboard" }];

  const navItemVariants = {
    hidden: { opacity: 0, y: -10 },
    visible: { opacity: 1, y: 0 },
    whileHover: { scale: 1.05 },
  };

  // ==========================
  // KYC status check
  // ==========================
  useEffect(() => {
    if (!address) {
      setKycStatus(null);
      return;
    }
    const fetchKycStatus = async () => {
      try {
        const result = await checkKYCStatus(address);
        setKycStatus(result.status);
      } catch {
        setKycStatus(null);
      }
    };
    fetchKycStatus();
  }, [address, checkKYCStatus]);

  const renderKycBadge = () => {
    if (loadingKyc) {
      return (
        <span className="px-3 py-1 rounded-full text-sm font-semibold bg-gray-300 text-gray-700">
          Checking KYC...
        </span>
      );
    }
    switch 
    (kycStatus) 
    {
      case "approved":
        return (
          <span className="px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-700">
            KYC Verified
          </span>
        );
      case "pending":
        return (
          <span className="px-3 py-1 rounded-full text-sm font-semibold bg-yellow-100 text-yellow-700">
            KYC Pending
          </span>
        );
      case "rejected":
        return (
          <span className="px-3 py-1 rounded-full text-sm font-semibold bg-red-100 text-red-700">
            KYC Rejected
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 rounded-full text-sm font-semibold bg-gray-100 text-gray-700">
            No KYC Info
          </span>
        );
    }
  };

  return (
    <header className="flex justify-between items-center px-6 py-4 bg-black shadow-md">
      {/* Logo */}
      <motion.div {...logoMotion} className="flex items-center space-x-2">
        <motion.div
          className="flex items-center justify-center h-12 w-12 rounded-full 
          shadow-lg bg-gradient-to-br
           from-blue-400 via-cyan-500 to-indigo-700"
          {...logoGlowMotion}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 64 64"
            className="h-8 w-8 text-black"
            fill="currentColor"
          >
            <path d="M2 30 L32 6 L62 30 V58 H38 V40 H26 V58 H2 Z" />
            <rect x="10" y="34" width="8" height="6" fill="white" />
            <rect x="46" y="34" width="8" height="6" fill="white" />
          </svg>
        </motion.div>
      </motion.div>

      {/* Navigation with motion */}
      {/* <motion.nav */}
<nav
  initial="hidden"
  animate="visible"
  variants={navVariants}
  className="hidden md:flex space-x-6"
>
  {[
    { label: "Home", path: "/" },
    { label: "Properties", path: "/properties" },
    { label: "My KYC", path: "/kyc" },
    { label: "Dashboard", path: "/dashboard" },
  ].map(({ label, path }) => (
    <Link
      key={label}
      to={path}
      className="text-white hover:underline hover:text-green-600 font-medium"
    >
      {label}
    </Link>
  ))}
</nav>
      {/* Wallet & KYC Status */}
      <div className="flex items-center space-x-4">
        {/* {renderKycBadge()} */}
        <appkit-button />
      </div>
    </header>
  );
}
