import { useState } from "react";
import axios from "axios";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

export default function useKYC() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);
  const [error, setError] = useState(null);

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
      formData.append("documentType", documentType); // ✅ required by schema
      formData.append("document", idDocumentFile);   // ✅ matches multer config
      if (selfieFile) {
        formData.append("selfie", selfieFile);       // ✅ matches multer config
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

    // State
    status,
    loading,
    error,
  };
}


