/**
 * 主要佈局元件 - Studio 風格
 * @module components/layout/Layout
 */

import React from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import PageTransition from "./PageTransition";

const Layout: React.FC = (): JSX.Element => {
  return (
    <div className="flex flex-col min-h-screen">
      {/* 全頁靜態背景 */}
      <div className="studio-bg" aria-hidden="true" />

      <Navbar />
      <main className="flex-grow">
        <PageTransition>
          <Outlet />
        </PageTransition>
      </main>
      <Footer />
    </div>
  );
};

export default Layout;
