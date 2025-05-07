import React from 'react';
import { useDarkMode } from '../context/DarkModeContext';
import { Button } from "@/components/ui/button";

const Dashboard = () => {
    const { isDarkMode } = useDarkMode();

    const handleLogout = () => {
        // Perform logout logic here (e.g., clear tokens, etc.)
        // Redirect to home page after logout
        window.location.href = '/'; // Redirect to home page
    };

    return (
        <div className={`dashboard ${isDarkMode ? 'dark-mode' : ''}`}>
            {/* Dashboard content */}
            <Button 
                onClick={handleLogout} 
                className="mt-4 px-6 py-2 text-sm font-medium rounded-full bg-white/90 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
                Logout
            </Button>
        </div>
    );
};

export default Dashboard; 