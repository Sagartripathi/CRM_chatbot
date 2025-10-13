import React, { useState } from 'react';
import { Button } from './ui/button';
import { Menu } from 'lucide-react';
import GlobalSidebar from './GlobalSidebar';

function Layout({ children, title, headerActions }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 lg:flex">
      {/* Sidebar */}
      <GlobalSidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
      />
      
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Main Content */}
      <div className="flex-1 lg:ml-0">
        {/* Header */}
        {title && (
          <header className="bg-white shadow-sm border-b">
            <div className="flex items-center justify-between h-16 px-6">
              <div className="flex items-center">
                <Button
                  variant="ghost"
                  size="sm"
                  className="lg:hidden mr-2"
                  onClick={() => setSidebarOpen(true)}
                >
                  <Menu className="h-5 w-5" />
                </Button>
                <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
              </div>
              
              {headerActions && (
                <div className="flex items-center space-x-3">
                  {headerActions}
                </div>
              )}
            </div>
          </header>
        )}
        
        {/* Page Content */}
        <main className={title ? "p-6" : ""}>
          {children}
        </main>
      </div>
    </div>
  );
}

export default Layout;