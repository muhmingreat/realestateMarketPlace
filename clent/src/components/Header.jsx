import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useAppKitAccount } from "@reown/appkit/react";
import { Link } from "react-router-dom";
import useKYC from "../hooks/useKycVerifier";
import {Menu, X} from 'lucide-react'

export default function Header() {
  const { address } = useAppKitAccount();
  const { checkKYCStatus } = useKYC();
  const [kycStatus, setKycStatus] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const MotionLink = motion(Link);

  // ==========================
  // Config
  // ==========================
  const ADMIN_ADDRESS = "0x1234...abcd"; // replace with your admin address

  const navItems = [
    { label: "Home", path: "/" },
    { label: "Properties", path: "/properties" },
    { label: "Verify", path: "/kyc" },
    { label: "Form", path: "/form" },
    { label: "User", path: "/user" },
    { label: "My Property", path: "/me" },
  ];

  if (address && address.toLowerCase() === ADMIN_ADDRESS.toLowerCase()) {
    navItems.push({ label: "Admin Dashboard", path: "/dashboard" });
  }

  // ==========================
  // KYC Status Check
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

  // ==========================
  // UI
  // ==========================
  return (
    <header className="flex justify-between items-center px-6 py-4 bg-black shadow-md relative">
      {/* Logo */}
      <motion.div
        animate={{ y: [0, -2, 0], rotate: [-1, 1, -1], scale: [1, 1.03, 1] }}
        transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
        className="flex items-center space-x-2"
      >
        <motion.div
          className="flex items-center justify-center h-12 w-12 rounded-full 
          shadow-lg bg-gradient-to-br from-blue-400 via-cyan-500 to-indigo-700"
          animate={{
            boxShadow: [
              "0 0 15px rgba(0,200,255,0.7)",
              "0 0 30px rgba(0,255,255,1)",
              "0 0 10px rgba(0,200,255,0.5)",
              "0 0 25px rgba(0,255,255,0.9)",
            ],
          }}
          transition={{ duration: 0.2, repeat: Infinity, ease: "linear" }}
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

      {/* Desktop Nav */}
      <nav className="hidden md:flex space-x-6">
        {navItems.map(({ label, path }) => (
          <Link
            key={label}
            to={path}
            className="text-white hover:underline hover:text-green-600 font-medium"
          >
            {label}
          </Link>
        ))}
      </nav>

      {/* Mobile Hamburger */}
      <button
        className="md:hidden text-white text-2xl"
        onClick={() => setMenuOpen((prev) => !prev)}
      >
        {menuOpen ? <X /> : <Menu />}
      </button>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="absolute top-16 left-0 w-full bg-gradient-to-br from-blue-400 via-cyan-500 to-indigo-700
        flex flex-col items-center space-y-4 py-6 md:hidden z-50 min-h-full">
          {navItems.map(({ label, path }) => (
            <Link
              key={label}
              to={path}

              onClick={() => setMenuOpen(false)}
              className="text-white hover:text-green-600 font-medium"
            >
              {label}
            </Link>
          ))}
          <appkit-button />
        </div>
      )}

      {/* Wallet Button */}
      <div className="hidden md:flex items-center space-x-4">
        <appkit-button />
      </div>
    </header>
  );
}


