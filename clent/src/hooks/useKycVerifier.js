// import { io } from "socket.io-client";
// import { useState, useEffect } from "react";
// import axios from "axios";

// const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

// export default function useKYC(objectId) {
//   const [loading, setLoading] = useState(false);
//   const [status, setStatus] = useState(null);
//   const [error, setError] = useState(null);
//   const [socket, setSocket] = useState(null);
//   const [connected, setConnected] = useState(false);

//   // ✅ Store the logged-in KYC user
//   const [kycUser, setKycUser] = useState(null);

//   // ------------------------
//   // KYCRequest endpoints
//   // ------------------------

//   const uploadKYC = async (walletAddress, fullName, email, documentType, idDocumentFile, selfieFile) => {
//     try {
//       setLoading(true);
//       setError(null);

//       const formData = new FormData();
//       formData.append("walletAddress", walletAddress);
//       formData.append("fullName", fullName);
//       formData.append("email", email);
//       formData.append("documentType", documentType);
//       formData.append("document", idDocumentFile);
//       if (selfieFile) formData.append("selfie", selfieFile);

//       const res = await axios.post(`${apiBaseUrl}/kyc/upload`, formData, {
//         headers: { "Content-Type": "multipart/form-data" },
//       });

//       setStatus(res.data);
//       return res.data;
//     } catch (err) {
//       setError(err.response?.data || err.message);
//       throw err;
//     } finally {
//       setLoading(false);
//     }
//   };

//   const checkKYCStatus = async (wallet) => {
//     try {
//       setLoading(true);
//       setError(null);

//       const res = await axios.get(`${apiBaseUrl}/kyc/requests/${wallet}`);
//       setStatus(res.data);
//       return res.data;
//     } catch (err) {
//       setError(err.response?.data || err.message);
//       throw err;
//     } finally {
//       setLoading(false);
//     }
//   };

//   const approveKYC = async (walletAddress) => {
//     try {
//       setLoading(true);
//       setError(null);

//       const res = await axios.post(`${apiBaseUrl}/kyc/approve`, { walletAddress });
//       setStatus(res.data);
//       return res.data;
//     } catch (err) {
//       setError(err.response?.data || err.message);
//       throw err;
//     } finally {
//       setLoading(false);
//     }
//   };

//   const rejectKYC = async (walletAddress) => {
//     try {
//       setLoading(true);
//       setError(null);

//       const res = await axios.post(`${apiBaseUrl}/kyc/reject`, { walletAddress });
//       setStatus(res.data);
//       return res.data;
//     } catch (err) {
//       setError(err.response?.data || err.message);
//       throw err;
//     } finally {
//       setLoading(false);
//     }
//   };

//   const getVerificationByRequest = async (requestId) => {
//     try {
//       setLoading(true);
//       setError(null);

//       const res = await axios.get(`${apiBaseUrl}/kyc/verification/${requestId}`);
//       return res.data;
//     } catch (err) {
//       setError(err.response?.data || err.message);
//       throw err;
//     } finally {
//       setLoading(false);
//     }
//   };

//   // ✅ Fetch logged-in user by objectId
//   useEffect(() => {
//     const fetchKycUser = async () => {
//       if (!objectId) return;
//       try {
//         setLoading(true);
//         const res = await axios.get(`${apiBaseUrl}/kyc/${objectId}`);
//         console.log("✅ KYC User fetched:", res.data);
//         setKycUser(res.data);
//       } catch (err) {
//         console.error("❌ Error fetching KYC user:", err);
//         setError(err.response?.data || err.message);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchKycUser();
//   }, [objectId]);

//   // ✅ Setup socket
//   useEffect(() => {
//     const newSocket = io("http://localhost:5000", {
//       withCredentials: true,
//       transports: ["websocket", "polling"],
//     });

//     newSocket.on("connect", () => {
//       console.log("⚡ Socket connected:", newSocket.id);
//       setConnected(true);
//     });

//     newSocket.on("disconnect", () => {
//       console.log("⚡ Socket disconnected");
//       setConnected(false);
//     });

//     setSocket(newSocket);

//     return () => {
//       newSocket.disconnect();
//     };
//   }, []);

//   const updateVerification = async (id, updates) => {
//     try {
//       setLoading(true);
//       setError(null);

//       const res = await axios.put(`${apiBaseUrl}/kyc/verification/${id}`, updates);
//       return res.data;
//     } catch (err) {
//       setError(err.response?.data || err.message);
//       throw err;
//     } finally {
//       setLoading(false);
//     }
//   };

//   const listVerifications = async () => {
//     try {
//       setLoading(true);
//       setError(null);

//       const res = await axios.get(`${apiBaseUrl}/kyc/verifications`);
//       return res.data;
//     } catch (err) {
//       setError(err.response?.data || err.message);
//       throw err;
//     } finally {
//       setLoading(false);
//     }
//   };
 

//   return {
//     // Requests
//     uploadKYC,
//     checkKYCStatus,
//     approveKYC,
//     rejectKYC,

//     // Verifications
//     getVerificationByRequest,
//     updateVerification,
//     listVerifications,

//     // Realtime
//     socket,
//     connected,

//     // State
//     kycUser, // ✅ logged-in user (objectId + fullName)
//     status,
//     loading,
//     error,
//   };
// }







import { io } from "socket.io-client";
import { useState,useEffect } from "react";
import axios from "axios";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

export default function useKYC() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);
  const [error, setError] = useState(null);
    const [socket, setSocket] = useState(null);
    const [connected, setConnected] = useState(false);
  // ------------------------
  // KYCRequest endpoints
  // ------------------------

  // Upload KYC documents
  const uploadKYC = async (walletAddress, fullName, email, documentType, idDocumentFile, selfieFile) => {
    try {
      setLoading(true);
      setError(null);


      const formData = new FormData();
      formData.append("walletAddress", walletAddress);
      formData.append("fullName", fullName);
      formData.append("email", email);
      formData.append("documentType", documentType); 
      
      formData.append("document", idDocumentFile);   
      if (selfieFile) {
        formData.append("selfie", selfieFile);      
      }
      console.log("Sending KYC:", {
        walletAddress,
        fullName,
        email,
        documentType,
        idDocumentFile,
        selfieFile
      });
      console.log("FormData entries:", [...formData.entries()]);

      const res = await axios.post(`${apiBaseUrl}/kyc/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setStatus(res.data);
      return res.data;
    } catch (err) {
      setError(err.response?.data || err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Check KYC status
  const checkKYCStatus = async (wallet) => {
    try {
      setLoading(true);
      setError(null);

      const res = await axios.get(`${apiBaseUrl}/kyc/requests/${wallet}`);
      setStatus(res.data);
      return res.data;
    } catch (err) {
      setError(err.response?.data || err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Approve KYC request
  const approveKYC = async (walletAddress) => {
    try {
      setLoading(true);
      setError(null);

      const res = await axios.post(`${apiBaseUrl}/kyc/approve`, { walletAddress });
      setStatus(res.data);
      return res.data;
    } catch (err) {
      setError(err.response?.data || err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Reject KYC request
  const rejectKYC = async (walletAddress) => {
    try {
      setLoading(true);
      setError(null);

      const res = await axios.post(`${apiBaseUrl}/kyc/reject`, { walletAddress });
      setStatus(res.data);
      return res.data;
    } catch (err) {
      setError(err.response?.data || err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // ------------------------
  // KYCVerification endpoints
  // ------------------------

  const getVerificationByRequest = async (requestId) => {
    try {
      setLoading(true);
      setError(null);

      const res = await axios.get(`${apiBaseUrl}/kyc/verification/${requestId}`);
      return res.data;
    } catch (err) {
      setError(err.response?.data || err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const newSocket = io("http://localhost:5000", {
      withCredentials: true,
      transports: ["websocket", "polling"],
    });

    newSocket.on("connect", () => {
      console.log("⚡ Socket connected:", newSocket.id);
      setConnected(true);
    });

    newSocket.on("disconnect", () => {
      console.log("⚡ Socket disconnected");
      setConnected(false);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);




  const updateVerification = async (id, updates) => {
    try {
      setLoading(true);
      setError(null);

      const res = await axios.put(`${apiBaseUrl}/kyc/verification/${id}`, updates);
      return res.data;
    } catch (err) {
      setError(err.response?.data || err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const listVerifications = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await axios.get(`${apiBaseUrl}/kyc/verifications`);
      return res.data;
    } catch (err) {
      setError(err.response?.data || err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    // Requests
    uploadKYC,
    checkKYCStatus,
    approveKYC,
    rejectKYC,

    // Verifications
    getVerificationByRequest,
    updateVerification,
    listVerifications,
    socket,
    connected,
    // State
    status,
    loading,
    error,
  };
}


