// components/DocumentOCR.js
import React, { useState } from "react";
import Tesseract from "tesseract.js";

export default function DocumentOCR({ onExtractedText }) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    const { data: { text: extracted } } = await Tesseract.recognize(file, "eng");
    setText(extracted);
    onExtractedText(extracted);
    setLoading(false);
  };

  return (
    <div>
      <input type="file" accept="image/*" onChange={handleFileChange} />
      {loading ? <p>Extracting...</p> : <p>{text}</p>}
    </div>
  );
}
