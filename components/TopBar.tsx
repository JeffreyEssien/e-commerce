"use client";
import React from "react";
import CampusSelector from "./CampusSelector";
import UserSwitcher from "./UserSwitcher";
import WalletDisplay from "./WalletDisplay";

export default function TopBar() {
  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b">
      <div className="max-w-6xl mx-auto px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 mb-2 sm:mb-0">
          <div className="h-9 w-9 rounded-lg bg-indigo-600 text-white grid place-content-center font-bold">
            CM
          </div>
          <div className="text-lg font-extrabold text-gray-800">
            Campus Market
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <CampusSelector />
          <UserSwitcher />
          <WalletDisplay />
        </div>
      </div>
    </header>
  );
}