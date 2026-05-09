import React from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { Outlet } from "react-router-dom";

const Main = () => {
  return (
    <div className="flex h-screen overflow-hidden bg-baseBg">
      <div className="w-1/6 border-r-2 border-primary bg-baseBg fixed inset-y-0 left-0 z-20">
        <Sidebar />
      </div>
      <div className="flex flex-col flex-1 ml-[16.66%] min-h-0 min-w-0">
        <header className="shrink-0 z-10 border-b-2 border-primary bg-baseBg">
          <Header />
        </header>
        <main className="flex-1 min-h-0 overflow-y-auto px-4 py-6 lg:px-5">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Main;
