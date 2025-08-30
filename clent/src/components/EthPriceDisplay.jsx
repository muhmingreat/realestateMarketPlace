import React, { useEffect, useState } from "react";
import { useGetLatestEthPrice } from "../hooks/useBlockchain";

export default function EthPriceDisplay() {
  const getPrice = useGetLatestEthPrice();
  const [price, setPrice] = useState(null);

  useEffect(() => {
    (async () => {
      const fetchedPrice = await getPrice();
      setPrice(fetchedPrice);
    })();
  }, [getPrice]);

  return (
    <div>
      {price ? `$${price.toLocaleString()}` : "Loading ETH price..."}
    </div>
  );
}
