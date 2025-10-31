import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  BarChart3,
  Target, 
  Users, 
  Calendar,
  Ticket,
  LogOut,
  X
} from 'lucide-react';

function GlobalSidebar({ isOpen, onClose, className = "" }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const navigationItems = [
    {
      name: 'Dashboard',
      path: '/dashboard',
      icon: BarChart3,
      roles: ['admin', 'agent', 'client']
    },
    {
      name: 'Campaigns',
      path: '/campaigns',
      icon: Target,
      roles: ['admin', 'agent']
    },
    {
      name: 'Leads',
      path: '/leads',
      icon: Users,
      roles: ['admin', 'agent', 'client']
    },
    {
      name: 'Meetings',
      path: '/meetings',
      icon: Calendar,
      roles: ['admin', 'agent', 'client']
    },
    {
      name: 'Support',
      path: '/tickets',
      icon: Ticket,
      roles: ['admin', 'agent', 'client']
    }
  ];

  const visibleItems = navigationItems.filter(item => 
    user?.role && item.roles.includes(user.role)
  );

  const isActivePath = (path) => {
    if (path === '/dashboard') {
      return location.pathname === '/' || location.pathname === '/dashboard';
    }
    if (path === '/tickets') {
      return location.pathname === '/tickets' || location.pathname.startsWith('/tickets/');
    }
    return location.pathname.startsWith(path);
  };

  const handleNavigate = (path) => {
    navigate(path);
    if (onClose) onClose(); // Close mobile sidebar
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:inset-0 ${className} flex flex-col`}>
      {/* Header */}
      <div className="flex items-center justify-between h-16 px-6 border-b flex-shrink-0">
        <h1 className="text-xl font-bold text-gray-900">Lw&w</h1>
        <Button
          variant="ghost"
          size="sm"
          className="lg:hidden"
          onClick={onClose}
        >
          <X className="h-5 w-5" />
        </Button>
      </div>
      
      {/* Navigation */}
      <nav className="mt-6 px-4 space-y-2 flex-1 overflow-y-auto">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const isActive = isActivePath(item.path);
          
          return (
            <Button
              key={item.name}
              variant="ghost"
              className={`w-full justify-start transition-colors ${
                isActive 
                  ? 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100' 
                  : 'hover:text-indigo-600 hover:bg-indigo-50'
              }`}
              onClick={() => handleNavigate(item.path)}
              data-testid={`sidebar-${item.name.toLowerCase()}`}
            >
              <Icon className="mr-3 h-4 w-4" />
              {item.name}
            </Button>
          );
        })}
        
        {/* User Profile & Logout - Below Support */}
        <div className="mt-2 pt-4 border-t">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {user?.first_name?.[0]}{user?.last_name?.[0]}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.first_name} {user?.last_name}
                </p>
                <Badge variant="secondary" className="text-xs">
                  {user?.role}
                </Badge>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full mt-3"
              onClick={handleLogout}
              data-testid="sidebar-logout"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </nav>
    </div>
  );
}

export default GlobalSidebar;