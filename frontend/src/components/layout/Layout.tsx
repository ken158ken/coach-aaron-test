/**
 * 主要佈局元件 - Studio 風格
 * @module components/layout/Layout
 */

import React from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import PageTransition from "./PageTransition";
import { HelpTourButton } from "@/tours";

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

      {/*
        會員區頁面（/member、/dashboard、/booking、/my-bookings、/chat…）的
        浮動「?」導覽鈕。公開行銷頁不在 tours/registry 裡，這顆會自己不渲染，
        所以不需要在這裡做路由判斷。
      */}
      <HelpTourButton />
    </div>
  );
};

export default Layout;
