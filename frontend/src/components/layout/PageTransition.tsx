import React from "react";
import { useLocation } from "react-router-dom";

interface PageTransitionProps {
  children: React.ReactNode;
}

const PageTransition: React.FC<PageTransitionProps> = ({ children }) => {
  const location = useLocation();
  // key 保留讓 React 在路由切換時正確重置子元件狀態，但不加任何動畫 class
  return <div key={location.pathname}>{children}</div>;
};

export default PageTransition;
