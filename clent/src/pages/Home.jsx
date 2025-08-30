import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Search, Loader2 } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { setSearchQuery, setProperties } from "../redux/slices/realEstateSlice";
import { useGetAllProperties } from "../hooks/useBlockchain";
import About from "../components/About";
import MyProperties from "./MyProperties";
import AllProperties from "./Properties";


export default function Home() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const getAllProperties = useGetAllProperties();

  const { searchQuery, properties } = useSelector((s) => s.realEstate);
  const [loading, setLoading] = useState(true);

  // Rolling slide-in animation (kept exactly as yours)
  const cardVariants = {
    hidden: { opacity: 0, x: -100, rotate: -10, scale: 0.8 },
    visible: (i) => ({
      opacity: 1,
      x: 0,
      rotate: 0,
      scale: 1,
      transition: { duration: 0.7, delay: i * 0.25, ease: "easeOut" },
    }),
  };

  // Fetch on load (real data, not dummy)
  useEffect(() => {
    const fetchProps = async () => {
      try {
        setLoading(true);
        const data = await getAllProperties();
        dispatch(setProperties(data || []));
      } finally {
        setLoading(false);
      }
    };
    fetchProps();
  }, [dispatch, getAllProperties]);

  // Live filter: title, location, rate
  const filteredProperties = useMemo(() => {
    const q = (searchQuery || "").trim().toLowerCase();
    if (!q) return [];
    return (properties || []).filter((p) => {
      const title = p?.title?.toLowerCase() || "";
      const location = p?.location?.toLowerCase() || "";
      const rateStr = (
        p?.rate ?? p?.rating ?? p?.averageRating ?? ""
      )
        .toString()
        .toLowerCase();

      return (
        title.includes(q) ||
        location.includes(q) ||
        rateStr.includes(q)
      );
    });
  }, [properties, searchQuery]);

  return (
    <div>
    <section className="relative w-full min-h-screen flex flex-col items-center justify-center bg-gradient-to-r from-indigo-900 via-purple-900 to-indigo-900 text-white px-6 overflow-hidden">
      {/* Overlay */}
     
      <div className="absolute inset-0 bg-black bg-opacity-30" />

      {/* Header */}
      <motion.div
        className="relative z-10 max-w-4xl text-center"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
      >
        <motion.h1
          className="text-5xl sm:text-6xl font-bold leading-tight"
          initial={{ opacity: 0, y: -50, rotateX: 90 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
        >
          Find Your Dream Home with{" "}
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-pink-500">
            Ease & Trust
          </span>
        </motion.h1>

        <motion.p
          className="mt-6 text-lg sm:text-xl text-gray-200 max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.5 }}
        >
          Whether you are buying or selling, our platform seamlessly connects you with{" "}
          <span className="font-semibold text-yellow-300">verified properties </span>
          and <span className="font-semibold text-yellow-300">licensed agents</span>.
          Enjoy a streamlined process, transparent pricing, and a marketplace you can trust.
        </motion.p>

        {/* <Web3AuthButton /> */}
        {/* Search Bar (kept visually the same, wired to Redux) */}
        <motion.div
          className="mt-8 flex items-center bg-white rounded-full shadow-lg max-w-xl mx-auto overflow-hidden border border-gray-200"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 1 }}
        >
          <input
            type="text"
            placeholder="Search for properties, locations, or agents..."
            className="flex-1 px-6 py-3 text-gray-800 outline-none text-sm sm:text-base"
            value={searchQuery}
            onChange={(e) => dispatch(setSearchQuery(e.target.value))}
          />
          <button
            className="bg-gradient-to-r from-yellow-400 to-pink-500 p-3 sm:p-4 flex items-center justify-center text-white hover:opacity-90 transition"
            // no navigation – just keeps UX consistent if you want to trigger something later
            onClick={() => {}}
          >
            <Search size={22} />
          </button>
        </motion.div>

        {/* Live Search Results underneath the bar (no navigation) */}
        <div className="mt-10 text-left">
          {loading ? (
            <div className="flex justify-center items-center py-8 text-white">
              <Loader2 className="animate-spin mr-2" />
              Loading properties...
            </div>
          ) : (
            searchQuery?.trim() && (
              <>
                <h2 className="text-2xl font-semibold mb-4 text-yellow-300">
                  Search Results
                </h2>

                {filteredProperties.length ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                    {filteredProperties.map((property) => (
                      <motion.div
                        key={property.productID}
                        className="bg-white bg-opacity-10 backdrop-blur-md rounded-2xl p-4 shadow-lg hover:shadow-xl cursor-pointer transition"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        onClick={() => navigate(`/properties/${property.productID}`)}
                      >
                        <h3 className="text-lg font-semibold text-yellow-300 line-clamp-1">
                          {property.title}
                        </h3>
                        <img
                          src={property.images?.[0] || "/placeholder.jpg"}
                          alt={property.title}
                          className="w-full h-44 object-cover rounded-lg my-3 border border-white/20"
                        />
                        <p className="text-sm">📍 {property.location || "—"}</p>
                        <p className="text-sm">💰 {property.price} ETH</p>
                        {property.rate != null && (
                          <p className="text-sm">⭐ {property.rate}</p>
                        )}
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-200">No matching properties found.</p>
                )}
              </>
            )
          )}
        </div>
      </motion.div>

      {/* Stats with rolling slide-in (unchanged) */}
      <motion.div
        className="relative z-10 mt-16 grid grid-cols-1 sm:grid-cols-4 gap-8 max-w-5xl w-full"
        initial="hidden"
        animate="visible"
      >
        {[
          { label: "Recent Users", value: "245" },
          { label: "Total Users", value: "12,430" },
          { label: "Created Listings", value: "1,320" },
          { label: "Sold Listings", value: "982" },
        ].map((stat, i) => (
          <motion.div
            key={i}
            className="bg-white bg-opacity-10 backdrop-blur-md rounded-2xl p-6 shadow-lg text-center"
            variants={cardVariants}
            custom={i}
          >
            <motion.h2
              className="text-3xl font-bold text-yellow-300"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: i * 0.3 + 0.3 }}
            >
              {stat.value}
            </motion.h2>
            <motion.p
              className="mt-2 text-gray-500"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: i * 0.3 + 0.4 }}
            >
              {stat.label}
            </motion.p>
          </motion.div>
        ))}
      </motion.div>
    </section>
    <AllProperties />
    <About />
    </div>
  );
}

