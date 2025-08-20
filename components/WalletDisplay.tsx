import React, { useEffect, useState } from "react";
import { useMarketplace } from "../store/marketplace";

export default function WalletDisplay() {
  const { currentUser, currentUserId, users, vendors } = useMarketplace();
  const [me, setMe] = useState<any>(null);
  const [walletDisplay, setWalletDisplay] = useState("");

  useEffect(() => {
    setMe(currentUser());
  }, [currentUserId, users, vendors]);

  useEffect(() => {
    if (me && typeof me.wallet === "number") {
      setWalletDisplay(`₦${me.wallet.toLocaleString()}`);
    } else {
      setWalletDisplay("");
    }
  }, [me]);

  return (
    <div className="text-sm text-gray-700 w-full sm:w-auto text-center sm:text-left">
      {me ? `${me.name} • ${walletDisplay}` : "Not logged in"}
    </div>
  );
}