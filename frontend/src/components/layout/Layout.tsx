/**
 * 主要佈局元件
 * @module components/layout/Layout
 */

import React from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";

/**
 * Layout 元件
 *
 * @returns {JSX.Element} 佈局元件
 */
const Layout: React.FC = (): JSX.Element => {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default Layout;
