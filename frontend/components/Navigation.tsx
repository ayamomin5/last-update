"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { Search, Filter, User, UserCircle2, FileText, Bookmark, Settings, LightbulbIcon, Power, Sun, Moon, Bell, LogOut, Calendar } from "lucide-react";
import { useTheme } from "next-themes";
import axios from "axios";
import { getStudentNotifications, markAllNotificationsAsRead, markNotificationAsRead } from "@/lib/api";

// Define API URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const Navigation = () => {
  const pathname = usePathname() || "";
  const router = useRouter();
  const searchParams = useSearchParams();
  const { theme, setTheme } = useTheme();
  
  // Navigation states
  const isLoggedIn = pathname.includes('/dashboard');
  const isStudent = pathname.includes('/student');
  const isCompany = pathname.includes('/company');
  const isProfilePage = pathname.includes('/profile');
  const isMyApplicationsPage = pathname.includes('/my-applications');
  const isSavedOpportunitiesPage = pathname.includes('/saved-opportunities');
  
  // UI states
  const [showFilters, setShowFilters] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [notifications, setNotifications] = useState<{
    type: 'accepted' | 'scheduled';
    message: string;
    id: string;
  }[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Refs
  const notificationsRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Search and filter states
  const [navSearch, setNavSearch] = useState(searchParams?.get('search') || '');
  const [locationSearch, setLocationSearch] = useState(searchParams?.get('location') || '');
  const [selectedTypes, setSelectedTypes] = useState<string[]>(
    searchParams?.get('opportunityType')?.split(',').filter(Boolean) || []
  );
  const [minSalary, setMinSalary] = useState(searchParams?.get('minSalary') || '');
  const [maxSalary, setMaxSalary] = useState(searchParams?.get('maxSalary') || '');

  const opportunityTypes = [
    "Internship",
    "Externship",
    "Freelance",
    "Part-time",
    "Full-time",
    "Remote",
    "Contract",
    "Research",
    "Apprenticeship"
  ];

  // Update search states when URL params change
  useEffect(() => {
    setNavSearch(searchParams?.get('search') || '');
    setLocationSearch(searchParams?.get('location') || '');
    setSelectedTypes(
      searchParams?.get('opportunityType')?.split(',').filter(Boolean) || []
    );
    setMinSalary(searchParams?.get('minSalary') || '');
    setMaxSalary(searchParams?.get('maxSalary') || '');
  }, [searchParams]);

  const handleSalaryChange = (type: 'min' | 'max', value: string) => {
    // Remove non-numeric characters
    const numericValue = value.replace(/[^0-9]/g, '');
    
    if (type === 'min') {
      setMinSalary(numericValue);
    } else {
      setMaxSalary(numericValue);
    }
  };

  const handleSearch = () => {
    const params = new URLSearchParams();
    
    // Add title search
    if (navSearch) {
      params.append('search', navSearch);
    }
    
    // Add location search
    if (locationSearch) {
      params.append('location', locationSearch.trim());
    }
    
    // Add opportunity types
    if (selectedTypes.length > 0) {
      params.append('opportunityType', selectedTypes.join(','));
    }
    
    // Add salary range
    if (minSalary && !isNaN(Number(minSalary))) {
      params.append('minSalary', minSalary);
    }
    if (maxSalary && !isNaN(Number(maxSalary))) {
      params.append('maxSalary', maxSalary);
    }

    // Navigate to search results
    router.push(`/dashboard/student/all-opportunities?${params.toString()}`);
    setShowFilters(false);
  };

  const toggleType = (type: string) => {
    const typeValue = type.toLowerCase();
    setSelectedTypes(prev => 
      prev.includes(typeValue)
        ? prev.filter(t => t !== typeValue)
        : [...prev, typeValue]
    );
  };

  // Check if we're on the main dashboard page
  const isMainDashboard = pathname === '/dashboard/student' || pathname === '/dashboard/company';
  
  // Determine the home link based on login status and user type
  const getHomeLink = () => {
    if (!isLoggedIn) return '/';
    return pathname.includes('/student') ? '/dashboard/student' : '/dashboard/company';
  };

  const handleSignOut = () => {
    setShowProfileMenu(false);
    router.push('/');
  };

  const handleLogout = () => {
    // Perform logout logic here (e.g., clear tokens, etc.)
    // Redirect to home page after logout
    router.push('/');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  // Theme toggle button component
  const ThemeToggle = () => (
    <Button
      variant="ghost"
      size="icon"
      className="rounded-full w-9 h-9 bg-white/90 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
    >
      <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-gray-600 dark:text-gray-300" />
      <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-gray-600 dark:text-gray-300" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );

  useEffect(() => {
    // Function to fetch notifications from the backend
    const fetchNotifications = async () => {
      if (!isLoggedIn || !isStudent) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('No token found');
        
        const notifications = await getStudentNotifications(token);
        
        if (Array.isArray(notifications)) {
          // Transform backend data to match our frontend structure
          const formattedNotifications = notifications
            .filter((notification: string) => {
              // Filter for accepted applications and scheduled interviews
              return notification.includes('accepted') || notification.includes('interview');
            })
            .map((notification: string) => {
              // Determine notification type and format message
              const type = notification.includes('accepted') ? 'accepted' as const : 'scheduled' as const;
              return {
                type,
                message: notification,
                id: `${Date.now()}-${Math.random()}`
              };
            });
          
          setNotifications(formattedNotifications);
        }
      } catch (err) {
        console.error('Failed to fetch notifications:', err);
        setError('Failed to load notifications');
        setNotifications([]); // Clear notifications on error
      } finally {
        setIsLoading(false);
      }
    };
    
    // Fetch on component mount
    fetchNotifications();
    
    // Set up polling for new notifications (every minute)
    const intervalId = setInterval(fetchNotifications, 60 * 1000);
    
    // Clean up interval on component unmount
    return () => clearInterval(intervalId);
  }, [isLoggedIn, isStudent]);

  // Function to mark notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No token found');
      
      // Find the index of the notification in the array
      const notificationIndex = notifications.findIndex(n => n.id === notificationId);
      if (notificationIndex === -1) {
        console.error('Notification not found');
        return;
      }
      
      // Remove the notification from the UI immediately for better user experience
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      
      // Call API to mark notification as read by index
      await markNotificationAsRead(notificationIndex, token);
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
      // Keep the notification removed from UI even if API call fails for better UX
    }
  };

  useEffect(() => {
    // Close dropdowns when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        // Only close if the click is outside both the button and the dropdown
        if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
          setShowNotifications(false);
        }
      }
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleDropdownToggle = () => {
    setShowDropdown(prev => !prev);
  };

  const handleNotificationsToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowNotifications(prev => !prev);
  };

  const getNotificationIcon = (type: 'accepted' | 'scheduled') => {
    switch (type) {
      case 'accepted':
        return <FileText className="h-4 w-4 text-green-500 mr-2" />;
      case 'scheduled':
        return <Calendar className="h-4 w-4 text-purple-500 mr-2" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500 mr-2" />;
    }
  };

  return (
    <nav className={`bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 ${isProfilePage ? 'profile-nav' : ''}`}>
      <div className="container mx-auto px-4">
        <div className="flex flex-col py-4">
          {/* Top Bar with Logo and Account */}
          <div className="flex items-center justify-between mb-4">
            <Link 
              href={getHomeLink()} 
              className="text-2xl font-bold tracking-wide bg-gradient-to-r from-blue-500 to-purple-500 dark:from-blue-300 dark:to-purple-400 bg-clip-text text-transparent hover:from-blue-400 hover:to-purple-400 dark:hover:from-blue-200 dark:hover:to-purple-300 transition-colors duration-300"
              style={{ 
                fontFamily: 'Arial, sans-serif',
                letterSpacing: '0.05em'
              }}
            >
              Career<span className="font-black">Hub</span>
            </Link>

            <div className="flex items-center gap-4">
              <ThemeToggle />
              {isLoggedIn ? (
                <>
                  {isCompany && (
                    <button 
                      onClick={handleLogout} 
                      className="flex items-center rounded-full p-2 bg-white/80 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <LogOut className="w-6 h-6 text-gray-700 dark:text-gray-300" />
                    </button>
                  )}
                  {isStudent && (
                    <>
                      <div className="relative">
                        <Button 
                          onClick={handleNotificationsToggle} 
                          className="relative rounded-full p-2 bg-white/80 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700"
                          ref={notificationsRef}
                        >
                          <Bell className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                          {notifications.length > 0 && (
                            <span className="absolute right-1 top-1/2 -translate-y-1/2 h-2.5 w-2.5 rounded-full bg-blue-500" />
                          )}
                        </Button>
                        
                        {showNotifications && (
                          <div 
                            className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-md shadow-lg z-10" 
                            ref={dropdownRef}
                          >
                            <div className="p-2 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                              <h3 className="font-medium text-sm text-gray-700 dark:text-gray-300">Notifications</h3>
                              {notifications.length > 0 && (
                                <button
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    try {
                                      const token = localStorage.getItem('token');
                                      if (!token) throw new Error('No token found');
                                      
                                      // Clear notifications from UI immediately for better UX
                                      setNotifications([]);
                                      
                                      // Call API to mark all notifications as read
                                      await markAllNotificationsAsRead(token);
                                    } catch (err) {
                                      console.error('Failed to mark all as read:', err);
                                      // Keep notifications cleared from UI even if API call fails
                                    }
                                  }}
                                  className="text-xs text-blue-500 hover:text-blue-600 dark:hover:text-blue-400 hover:underline"
                                >
                                  Mark all as read
                                </button>
                              )}
                            </div>
                            <div className="py-2 max-h-80 overflow-y-auto">
                              {isLoading && (
                                <div className="flex justify-center items-center py-4">
                                  <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
                                </div>
                              )}
                              
                              {error && !notifications.length && (
                                <div className="px-4 py-2 text-red-500 text-sm">
                                  {error}
                                </div>
                              )}
                              
                              {!isLoading && notifications.length > 0 ? (
                                <>
                                  {notifications.filter(n => n.type === 'accepted').length > 0 && (
                                    <div className="px-3 py-1 bg-gray-100 dark:bg-gray-700/50 text-xs font-semibold text-gray-500 dark:text-gray-400">
                                      Accepted Applications
                                    </div>
                                  )}
                                  {notifications
                                    .filter(n => n.type === 'accepted')
                                    .map((notification, index) => (
                                      <div 
                                        key={`notification-accepted-${notification.id}`} 
                                        className="px-4 py-2 hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center justify-between"
                                      >
                                        <div className="flex items-center">
                                          {getNotificationIcon(notification.type)}
                                          <span className="text-sm">{notification.message}</span>
                                        </div>
                                        <button 
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            markAsRead(notification.id);
                                          }}
                                          className="ml-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                                        >
                                          <span className="sr-only">Dismiss</span>
                                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                          </svg>
                                        </button>
                                      </div>
                                    ))}
                                    
                                  {notifications.filter(n => n.type === 'scheduled').length > 0 && (
                                    <div className="px-3 py-1 bg-gray-100 dark:bg-gray-700/50 text-xs font-semibold text-gray-500 dark:text-gray-400">
                                      Scheduled Interviews
                                    </div>
                                  )}
                                  {notifications
                                    .filter(n => n.type === 'scheduled')
                                    .map((notification, index) => (
                                      <div 
                                        key={`notification-scheduled-${notification.id}`} 
                                        className="px-4 py-2 hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center justify-between"
                                      >
                                        <div className="flex items-center">
                                          {getNotificationIcon(notification.type)}
                                          <span className="text-sm">{notification.message}</span>
                                        </div>
                                        <button 
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            markAsRead(notification.id);
                                          }}
                                          className="ml-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                                        >
                                          <span className="sr-only">Dismiss</span>
                                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                          </svg>
                                        </button>
                                      </div>
                                    ))}
                                </>
                              ) : (
                                !isLoading && !error && (
                                  <div className="px-4 py-2 text-gray-500 text-sm">No notifications</div>
                                )
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="relative">
                        <button onClick={handleDropdownToggle} className="flex items-center rounded-full p-2 bg-white/80 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700">
                          <User className="w-6 h-6 text-gray-700 dark:text-gray-300" />
                        </button>
                        {showDropdown && (
                          <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg z-10" ref={dropdownRef}>
                            <div className="py-2">
                              <Link href="/profile" className="block px-4 py-2 hover:bg-gray-200 dark:hover:bg-gray-700">Profile</Link>
                              <Link href="/my-applications" className="block px-4 py-2 hover:bg-gray-200 dark:hover:bg-gray-700">My Applications</Link>
                              <Link href="/saved-opportunities" className="block px-4 py-2 hover:bg-gray-200 dark:hover:bg-gray-700">Saved Opportunities</Link>
                              <button onClick={handleLogout} className="block w-full text-left px-4 py-2 hover:bg-gray-200 dark:hover:bg-gray-700">Logout</button>
                            </div>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div className="flex items-center gap-4">
                  {!isProfilePage && !isMyApplicationsPage && !isSavedOpportunitiesPage && (
                    <>
                      <Link href="/login">
                        <Button 
                          variant="ghost" 
                          className="px-6 py-2 text-sm font-medium bg-white/90 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300 rounded-full border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100 transition-all duration-300"
                        >
                          Login
                        </Button>
                      </Link>
                      <Link href="/signup">
                        <Button 
                          className="px-6 py-2 text-sm font-medium rounded-full bg-gradient-to-r from-blue-500 to-purple-500 dark:from-blue-300 dark:to-purple-400 text-white dark:text-gray-900 hover:from-blue-400 hover:to-purple-400 dark:hover:from-blue-200 dark:hover:to-purple-300 transition-all duration-300 border-none"
                        >
                          Sign Up
                        </Button>
                      </Link>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {isLoggedIn && pathname.includes('/student') && (
            <div className="space-y-4">
              {/* Search Bar with Filter Toggle */}
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <div className="absolute left-4 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
                    <Search className="text-gray-400 w-5 h-5" />
                    <div className="h-4 w-px bg-gray-300 dark:bg-gray-600"></div>
                  </div>
                  <input
                    value={navSearch}
                    onChange={(e) => setNavSearch(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleSearch();
                      }
                    }}
                    type="text"
                    placeholder="Search for opportunities or companies..."
                    className="w-full pl-20 pr-4 py-3 rounded-full bg-white/90 dark:bg-gray-800/50 backdrop-blur-md border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-200 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400/20 focus:border-blue-300/20 transition-all duration-300"
                  />
                  <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={handleSearch}
                      className="rounded-full w-8 h-8 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <Search className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                    </Button>
                    <div className="h-4 w-px bg-gray-300 dark:bg-gray-600"></div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowFilters(!showFilters)}
                      className="rounded-full w-8 h-8 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <Filter
                        className={`w-4 h-4 ${
                          showFilters
                            ? 'text-[#9d4edd] dark:text-purple-400'
                            : 'text-gray-600 dark:text-gray-300'
                        }`}
                      />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Expanded Filters */}
              {showFilters && (
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-4">
                  {/* Location Filter */}
                  <div>
                    <h3 className="font-medium mb-2 text-gray-900 dark:text-white">Location</h3>
                    <input
                      type="text"
                      value={locationSearch}
                      onChange={(e) => setLocationSearch(e.target.value)}
                      placeholder="Enter city name (e.g., Erbil, Sulaymaniyah)"
                      className="w-full px-3 py-2 bg-gray-200 dark:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-md text-gray-900 dark:text-gray-200 placeholder:text-gray-500 focus:ring-2 focus:ring-gray-600 focus:border-gray-600"
                    />
                  </div>

                  {/* Salary Range Filter */}
                  <div>
                    <h3 className="font-medium mb-2 text-gray-900 dark:text-white">Salary Range (USD)</h3>
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Minimum</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                          <input
                            type="text"
                            value={minSalary}
                            onChange={(e) => handleSalaryChange('min', e.target.value)}
                            placeholder="Min"
                            className="w-full pl-7 pr-3 py-2 bg-gray-200 dark:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-md text-gray-900 dark:text-gray-200 placeholder:text-gray-500 focus:ring-2 focus:ring-gray-600 focus:border-gray-600"
                          />
                        </div>
                      </div>
                      <div className="flex-1">
                        <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Maximum</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                          <input
                            type="text"
                            value={maxSalary}
                            onChange={(e) => handleSalaryChange('max', e.target.value)}
                            placeholder="Max"
                            className="w-full pl-7 pr-3 py-2 bg-gray-200 dark:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-md text-gray-900 dark:text-gray-200 placeholder:text-gray-500 focus:ring-2 focus:ring-gray-600 focus:border-gray-600"
                          />
                        </div>
                      </div>
                    </div>
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                      {minSalary && maxSalary ? (
                        `Showing opportunities with salary range $${Number(minSalary).toLocaleString()} - $${Number(maxSalary).toLocaleString()}`
                      ) : minSalary ? (
                        `Showing opportunities with minimum salary $${Number(minSalary).toLocaleString()}`
                      ) : maxSalary ? (
                        `Showing opportunities with maximum salary $${Number(maxSalary).toLocaleString()}`
                      ) : (
                        'Enter salary range to filter opportunities'
                      )}
                    </p>
                  </div>

                  {/* Opportunity Type Filter */}
                  <div>
                    <h3 className="font-medium mb-2 text-gray-900 dark:text-white">Opportunity Type</h3>
                    <div className="flex flex-wrap gap-2">
                      {opportunityTypes.map((type) => (
                        <button
                          key={type}
                          onClick={() => toggleType(type)}
                          className={`px-3 py-1 rounded-full text-sm ${
                            selectedTypes.includes(type.toLowerCase())
                              ? 'bg-[#9d4edd]/20 dark:bg-purple-400/20 border border-[#9d4edd] dark:border-purple-400 text-white'
                              : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-200'
                          } hover:bg-gray-800/50 dark:hover:bg-gray-700/50 transition-colors duration-200`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Apply Filters Button */}
                  <div className="flex justify-end pt-2">
                    <Button
                      onClick={handleSearch}
                      className="border border-gray-700 dark:border-gray-600 bg-gray-800/50 dark:bg-gray-700/50 hover:bg-[#9d4edd]/20 dark:hover:bg-purple-400/20 text-white px-6 py-2 rounded-full transition-colors duration-200"
                    >
                      Apply Filters
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      

      {/* Overlay to close profile menu when clicking outside */}
      {showProfileMenu && (
        <div 
          className="fixed inset-0 z-40"
          onClick={() => setShowProfileMenu(false)}
        />
      )}
    </nav>
  );
};

export default Navigation; 
