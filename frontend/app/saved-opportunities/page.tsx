"use client";

import React, { useState, useEffect } from 'react';
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { MapPin, DollarSign, Briefcase, ArrowUpRight, CheckCircle2, Target } from "lucide-react";
import Link from "next/link";
import { getOpportunities, getProfile, unsaveOpportunity } from "@/lib/api";

interface SavedOpportunity {
  id: string;
  position: string;
  company: string;
  location: string;
  salary: string;
  type: string;
  description: string;
  skills: string[];
  isLocationBased: boolean;
}

interface UserLocation {
  lat: number;
  lng: number;
  city: string;
}

interface UserExperience {
  position: string;
  skills: string[];
  level: string;
}

const SavedOpportunities = () => {
  const [selectedCategory, setSelectedCategory] = useState('All Saved');
  const [savedOpportunities, setSavedOpportunities] = useState<SavedOpportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [userExperience, setUserExperience] = useState<UserExperience[]>([]);
  const [userLocation, setUserLocation] = useState<UserLocation>({
    lat: 36.1901,
    lng: 44.0091,
    city: ""
  });

  const kurdistanCities = [
    { name: "Erbil", lat: 36.1901, lng: 44.0091 },
    { name: "Sulaymaniyah", lat: 35.5556, lng: 45.4351 },
    { name: "Duhok", lat: 36.8669, lng: 42.9503 },
    { name: "Halabja", lat: 35.1787, lng: 45.9864 },
    { name: "Zakho", lat: 37.1445, lng: 42.6872 }
  ];

  // Add a function to check if a location contains a city
  const locationContainsCity = (locationStr: string, cityStr: string) => {
    if (!locationStr || !cityStr) return false;
    
    // Convert both to lowercase for case-insensitive comparison
    const locationLower = locationStr.toLowerCase().trim();
    const cityLower = cityStr.toLowerCase().trim();
    
    // For detailed location matching, we need more than just a city name match
    // If the user location is detailed (like "erbil-airport road, Kurdistan")
    // we should check for more specific matching
    
    // Check for exact match first
    if (locationLower === cityLower) return true;
    
    // Check if the location string contains the exact user location
    if (locationLower.includes(cityLower)) return true;
    
    // Check if user location contains the location string
    if (cityLower.includes(locationLower)) return true;
    
    // For more detailed matching, split by common separators and check for significant overlap
    const locationParts = locationLower.split(/[\s,\-\/]+/).filter(part => part.length > 2);
    const cityParts = cityLower.split(/[\s,\-\/]+/).filter(part => part.length > 2);
    
    // Count matching parts
    const matchingParts = locationParts.filter(part => cityParts.includes(part));
    
    // If we have a significant number of matching parts (at least 2 or more than 50%)
    return matchingParts.length >= 2 || 
           (matchingParts.length > 0 && matchingParts.length >= locationParts.length * 0.5);
  };

  useEffect(() => {
    const loadSavedOpportunities = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('No token');

        // Fetch user profile to get saved opportunities and experience
        const profile = await getProfile('student', token);
        const userExp = profile.experience || [];
        setUserExperience(userExp);

        // Update user location from profile
        if (profile.location) {
          // Store the full location string from profile
          const fullLocation = profile.location;
          
          // Try to extract the city from the location string
          const cityFound = kurdistanCities.find(c => 
            fullLocation.toLowerCase().includes(c.name.toLowerCase())
          );
          
          if (cityFound) {
            setUserLocation({
              lat: cityFound.lat,
              lng: cityFound.lng,
              city: fullLocation // Store the full location instead of just city name
            });
          } else {
            // If no specific city found, just store the full location
            setUserLocation(prev => ({ ...prev, city: fullLocation }));
          }
        }

        // Get user's saved opportunities from profile
        const savedOpportunityIds = profile.savedOpportunities || [];
        
        if (savedOpportunityIds.length === 0) {
          setLoading(false);
          return;
        }

        // Fetch all opportunities and filter for saved ones
        const allOpportunities = await getOpportunities({ status: 'active' }, token);
        const saved = allOpportunities
          .filter((opp: any) => savedOpportunityIds.includes(opp._id))
          .map((opp: any) => {
            // Check if opportunity is location-based using our new function
            const isLocationBased = profile.location && 
              locationContainsCity(opp.location, profile.location);

            // If it's location-based, mark it as such
            if (isLocationBased) {
              opp.isLocationBased = true;
            }

            return {
              id: opp._id,
              position: opp.title,
              company: typeof opp.company === 'string' ? opp.company : opp.company?.name,
              location: opp.location,
              salary: opp.salary?.min && opp.salary?.max ? `$${opp.salary.min} - $${opp.salary.max}` : 'N/A',
              type: opp.opportunityType,
              description: opp.description,
              skills: opp.tags || [],
              isLocationBased: isLocationBased
            };
          });

        setSavedOpportunities(saved);
      } catch (error) {
        console.error('Error loading saved opportunities:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSavedOpportunities();
  }, []); // Empty dependency array to run only on mount

  // Update the location data sync function
  useEffect(() => {
    const syncLocationData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const profile = await getProfile('student', token);
        if (profile.location) {
          const fullLocation = profile.location;
          
          // Try to extract the city from the location string
          const cityFound = kurdistanCities.find(c => 
            fullLocation.toLowerCase().includes(c.name.toLowerCase())
          );
          
          // Only update if the location has changed
          if (fullLocation !== userLocation.city) {
            if (cityFound) {
              setUserLocation({
                lat: cityFound.lat,
                lng: cityFound.lng,
                city: fullLocation
              });
            } else {
              setUserLocation(prev => ({ ...prev, city: fullLocation }));
            }

            // Update isLocationBased for all saved opportunities
            setSavedOpportunities(prev => prev.map(opp => ({
              ...opp,
              isLocationBased: Boolean(locationContainsCity(opp.location, fullLocation))
            })));
            
            // Refresh saved opportunities when location changes
            refreshSavedOpportunities();
          }
        }
      } catch (error) {
        console.error('Error syncing location data:', error);
      }
    };

    // Set up an interval to periodically sync location data
    const syncInterval = setInterval(syncLocationData, 30000); // Sync every 30 seconds

    // Initial sync
    syncLocationData();

    // Cleanup interval on unmount
    return () => clearInterval(syncInterval);
  }, [userLocation.city]); // Add userLocation.city as dependency

  // Add debug logging
  useEffect(() => {
    console.log("Current user location:", userLocation);
    console.log("Saved opportunities:", savedOpportunities);
    
    // Check which opportunities would match "Near Your Location"
    const nearLocationOpps = savedOpportunities.filter(opp => {
      const matches = opp.isLocationBased || 
        (userLocation.city && locationContainsCity(opp.location, userLocation.city));
      
      console.log(`Opportunity ${opp.position} at ${opp.location} matches location ${userLocation.city}: ${matches}`);
      return matches;
    });
    
    console.log("Opportunities that should appear in Near Your Location:", nearLocationOpps);
  }, [savedOpportunities, userLocation.city]);

  // Update filterOpportunities function to log results
  const filterOpportunities = () => {
    const filteredResults = (() => {
      switch (selectedCategory) {
        case 'Based on Your Experience':
          return savedOpportunities.filter(opp => {
            if (!userExperience.length) return false;

            // Get experience positions for matching
            const experiencePositions = userExperience
              .map(exp => exp.position?.toLowerCase().trim())
              .filter(Boolean);

            // Match either by skills containing experience positions or position containing experience positions
            return experiencePositions.length > 0 && (
              (opp.skills && Array.isArray(opp.skills) && opp.skills.some(skill =>
                experiencePositions.some(exp =>
                  skill.toLowerCase().includes(exp) || exp.includes(skill.toLowerCase())
                )
              )) ||
              (opp.position && experiencePositions.some(exp =>
                opp.position.toLowerCase().includes(exp) || exp.includes(opp.position.toLowerCase())
              ))
            );
          });
        case 'Near Your Location':
          const results = savedOpportunities.filter(opp => {
            // Check if the opportunity location contains the detailed user location
            const locationMatch = locationContainsCity(opp.location || '', userLocation.city || '');
            
            // OR check if it's been explicitly marked as location-based
            const isMarked = opp.isLocationBased;
            
            const matches = isMarked || locationMatch;
            
            // Log detailed information for debugging
            console.log(`Near Location Filter - ${opp.position} at ${opp.location}:`);
            console.log(`  User location (detailed): ${userLocation.city}`);
            console.log(`  Location match (detailed): ${locationMatch}`);
            console.log(`  Marked as location-based: ${isMarked}`);
            console.log(`  Final match: ${matches}`);
            
            return matches;
          });
          
          console.log(`Near Your Location filter returned ${results.length} opportunities`);
          return results;
        default:
          return savedOpportunities;
      }
    })();
    
    console.log(`${selectedCategory} filter returned ${filteredResults.length} opportunities`);
    return filteredResults;
  };

  // Update the isLocationBasedOpportunity function for more precise matching
  const isLocationBasedOpportunity = (opportunity: SavedOpportunity) => {
    // First check if the opportunity was explicitly marked as location-based
    if (opportunity.isLocationBased) return true;
    
    // For location-based matching, we need exact location match if the location is detailed
    return userLocation.city && locationContainsCity(opportunity.location, userLocation.city);
  };

  // Update refreshSavedOpportunities function to use more precise location matching
  const refreshSavedOpportunities = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const profile = await getProfile('student', token);
      const savedOpportunityIds = profile.savedOpportunities || [];
      
      if (savedOpportunityIds.length === 0) {
        setSavedOpportunities([]);
        return;
      }

      // Get the detailed location from profile
      const userLocationDetail = profile.location || userLocation.city;
      console.log("Detailed user location for matching:", userLocationDetail);

      const allOpportunities = await getOpportunities({ status: 'active' }, token);
      const saved = allOpportunities
        .filter((opp: any) => savedOpportunityIds.includes(opp._id))
        .map((opp: any) => {
          // Use more precise location matching
          const isLocationBased = Boolean(userLocationDetail && 
            locationContainsCity(opp.location || '', userLocationDetail));
            
          console.log(`Opportunity location "${opp.location}" matches user location "${userLocationDetail}": ${isLocationBased}`);

          return {
            id: opp._id,
            position: opp.title,
            company: typeof opp.company === 'string' ? opp.company : opp.company?.name,
            location: opp.location,
            salary: opp.salary?.min && opp.salary?.max ? `$${opp.salary.min} - $${opp.salary.max}` : 'N/A',
            type: opp.opportunityType,
            description: opp.description,
            skills: opp.tags || [],
            isLocationBased: isLocationBased
          };
        });

      setSavedOpportunities(saved);
    } catch (error) {
      console.error('Error refreshing saved opportunities:', error);
    }
  };

  // Update the removeSavedOpportunity function to refresh the list
  const removeSavedOpportunity = async (opportunityId: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      // Call the backend to unsave the opportunity
      await unsaveOpportunity(opportunityId, token);

      // Refresh the saved opportunities list
      await refreshSavedOpportunities();
    } catch (error) {
      console.error('Error removing saved opportunity:', error);
    }
  };

  // Add effect to refresh saved opportunities when location changes
  useEffect(() => {
    if (userLocation.city) {
      refreshSavedOpportunities();
    }
  }, [userLocation.city]);

  // Force refresh saved opportunities when changing category
  useEffect(() => {
    if (selectedCategory === 'Near Your Location') {
      refreshSavedOpportunities();
    }
  }, [selectedCategory]);

  return (
    <div className="min-h-screen bg-gradient-to-r from-gray-100 to-gray-300 dark:from-gray-900 dark:to-gray-700">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8 flex">
        {/* Sidebar for Categories */}
        <aside className="w-1/4 pr-4">
          <h2 className="text-2xl font-semibold mb-4 text-[#6930c3] dark:text-[#b185db]">Categories</h2>
          <ul>
            <li className="mb-2">
              <button onClick={() => setSelectedCategory('All Saved')} className={`w-full text-left px-4 py-3 rounded-lg transform transition-transform duration-300 ${selectedCategory === 'All Saved' ? 'bg-gray-500 text-white' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'} hover:bg-gray-400 hover:text-black hover:scale-105`}>
                All Saved
              </button>
            </li>
            <li className="mb-2">
              <button onClick={() => setSelectedCategory('Based on Your Experience')} className={`w-full text-left px-4 py-3 rounded-lg transform transition-transform duration-300 ${selectedCategory === 'Based on Your Experience' ? 'bg-gray-500 text-white' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'} hover:bg-gray-400 hover:text-black hover:scale-105`}>
                Based on Your Experience
              </button>
            </li>
            <li className="mb-2">
              <button 
                onClick={() => {
                  setSelectedCategory('Near Your Location');
                  // Force refresh when clicking on Near Your Location
                  refreshSavedOpportunities();
                }} 
                className={`w-full text-left px-4 py-3 rounded-lg transform transition-transform duration-300 ${selectedCategory === 'Near Your Location' ? 'bg-gray-500 text-white' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'} hover:bg-gray-400 hover:text-black hover:scale-105`}>
                Near Your Location
              </button>
            </li>
          </ul>
        </aside>

        {/* Main Content Container */}
        <section className="w-3/4 ml-2">
          <button 
            onClick={() => window.history.back()} 
            className="flex items-center text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 mb-4 transition-colors duration-300"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-5 w-5 mr-2" 
              viewBox="0 0 20 20" 
              fill="currentColor"
            >
              <path 
                fillRule="evenodd" 
                d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" 
                clipRule="evenodd" 
              />
            </svg>
            Back
          </button>
          <h1 className="text-4xl font-extrabold mb-6 text-center text-[#6930c3] dark:text-[#b185db]">Saved Opportunities</h1>
          
          {/* Display Filtered Opportunities */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            {loading ? (
              <p className="text-gray-700 dark:text-gray-300">Loading saved opportunities...</p>
            ) : filterOpportunities().length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {selectedCategory === 'Based on Your Experience' && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-3 text-[#6930c3] dark:text-[#b185db]">Your Experience</h3>
                    <div className="flex flex-wrap gap-2">
                      {userExperience.map((exp, index) => (
                        <span key={index} className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-full text-sm flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> {exp.position}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {selectedCategory === 'Near Your Location' && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-3 text-[#6930c3] dark:text-[#b185db]">Your Location</h3>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      <span className="text-gray-600 dark:text-gray-400">
                        Showing opportunities near {userLocation.city}, Kurdistan
                      </span>
                    </div>
                  </div>
                )}
                {filterOpportunities().map((opportunity) => (
                  <div key={opportunity.id} className="p-4 border border-gray-300 rounded-lg hover:shadow-lg transition-shadow duration-300">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-bold text-lg text-gray-900 dark:text-white">{opportunity.position}</h3>
                        <p className="text-gray-600 dark:text-gray-400">{opportunity.company}</p>
                      </div>
                      <div className="flex gap-2">
                        {isLocationBasedOpportunity(opportunity) && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> Near You
                          </span>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeSavedOpportunity(opportunity.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2 mb-4">
                      <div className="flex gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <MapPin className="w-4 h-4" /> <span>{opportunity.location}</span>
                      </div>
                      <div className="flex gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <DollarSign className="w-4 h-4" /> <span>{opportunity.salary}</span>
                        <span>•</span>
                        <Briefcase className="w-4 h-4" /> <span>{opportunity.type}</span>
                      </div>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                      {opportunity.description}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Link href={`/dashboard/student/apply/${opportunity.id}`}>
                        <Button
                          size="sm"
                          className="flex items-center gap-1 border border-[#5e60ce] bg-white dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-300 rounded-lg"
                        >
                          <ArrowUpRight className="w-4 h-4" /> Apply Now
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-700 dark:text-gray-300">No saved opportunities found.</p>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

export default SavedOpportunities;