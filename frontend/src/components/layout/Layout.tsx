import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, Outlet } from 'react-router-dom';

const Layout: React.FC = () => {
  return (
    <div className="flex min-h-screen bg-[#080808]">
      <Sidebar />
      
      <div className="flex-1 flex flex-col min-w-0 ml-52 relative">
        <Navbar />
        
        <main className="flex-1 p-6 lg:p-10 pt-20 max-w-7xl mx-auto w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;


