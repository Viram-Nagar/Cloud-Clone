import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/ui/Sidebar";
import Header from "../components/ui/Header";

const MainLayout = () => {
  return (
    <div className="flex h-screen w-full bg-bg-main overflow-hidden font-inter">
      <aside className="hidden md:flex md:w-64 lg:w-72 h-full flex-col bg-surface border-r border-border shrink-0">
        <Sidebar />
      </aside>

      <div className="flex flex-col flex-1 h-full min-w-0 overflow-hidden">
        <header className="h-16 border-b border-border bg-surface flex items-center px-8 shrink-0">
          <Header />
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>

        <div className="md:hidden h-16 bg-surface border-t border-border px-6 py-2"></div>
      </div>
    </div>
  );
};

export default MainLayout;
