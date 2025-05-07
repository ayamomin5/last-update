"use client";

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Building2, Briefcase, DollarSign, Globe2, Loader2 } from 'lucide-react';

// Fix default marker icons
const fixDefaultMarkerIcons = () => {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  });
};

interface Opportunity {
  id: string;
  position: string;
  company: string | {
    name: string;
    _id: string;
    logo?: string;
    industry?: string;
    location?: string;
  };
  location: string;
  coordinates: { lat: number; lng: number } | null;
  salary: string;
  type: string;
  distance?: number;
  skills: string[];
  isRemote?: boolean;
  description?: string;
}

interface MapViewProps {
  opportunities: Opportunity[];
  selectedLocation?: { lat: number; lng: number } | null;
  onMarkerClick?: (opportunity: Opportunity) => void;
  onSaveOpportunity?: (opportunityId: string) => void;
  savedOpportunities?: string[];
}

// Mock data for development
const MOCK_OPPORTUNITIES: Opportunity[] = [
  {
    id: '1',
    position: 'Software Engineer Intern',
    company: {
      name: 'Tech Corp',
      _id: '1',
      logo: 'https://example.com/logo.png',
      industry: 'Technology',
      location: 'Erbil'
    },
    location: 'Erbil, Iraq',
    coordinates: { lat: 36.1901, lng: 44.0091 },
    salary: '$25-35/hr',
    type: 'Internship',
    skills: ['React', 'Node.js', 'TypeScript'],
    isRemote: false
  },
  {
    id: '2',
    position: 'Data Science Intern',
    company: {
      name: 'Data Solutions',
      _id: '2',
      logo: 'https://example.com/logo2.png',
      industry: 'Data',
      location: 'Sulaymaniyah'
    },
    location: 'Sulaymaniyah, Iraq',
    coordinates: { lat: 35.5568, lng: 45.4347 },
    salary: '$30-40/hr',
    type: 'Internship',
    skills: ['Python', 'Machine Learning', 'Data Analysis'],
    isRemote: true
  }
];

export default function MapView({ 
  opportunities, 
  selectedLocation, 
  onMarkerClick,
  onSaveOpportunity,
  savedOpportunities = []
}: MapViewProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [opportunitiesState, setOpportunities] = useState<Opportunity[]>(opportunities);

  // Fetch opportunities data
  const fetchOpportunities = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Get token from localStorage
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Fetch from API with authentication
      const response = await fetch('/api/opportunities', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        cache: 'no-store' // Disable caching
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'Failed to fetch opportunities');
      }
      
      const data = await response.json();
      
      if (!Array.isArray(data)) {
        throw new Error('Invalid data format received from server');
      }
      
      // Get a list of deleted locations to filter out
      const deletedLocations = data
        .filter((opp: any) => opp.status === 'deleted')
        .map((opp: any) => opp.location?.toLowerCase())
        .filter(Boolean);
        
      console.log('Deleted locations:', deletedLocations);
      
      // Process the opportunities data
      const processedOpportunities = data
        .filter((opp: any) => {
          // Filter out deleted opportunities
          if (opp.status === 'deleted') return false;
          
          // Filter out opportunities in locations that have deleted opportunities
          if (opp.location && deletedLocations.some(loc => 
            opp.location.toLowerCase().includes(loc) || 
            (loc && loc.includes(opp.location.toLowerCase()))
          )) {
            console.log(`Filtering out ${opp.title} in ${opp.location} as it's in a deleted location`);
            return false;
          }
          
          return true;
        })
        .map((opp: any) => ({
          id: opp._id,
          position: opp.title,
          company: opp.company,
          location: opp.location,
          coordinates: opp.coordinates || getCoordinatesFromLocation(opp.location),
          salary: opp.salary ? `${opp.salary.currency || 'USD'} ${opp.salary.min || '0'}-${opp.salary.max || 'N/A'}` : 'Not specified',
          type: opp.opportunityType,
          skills: opp.tags || [],
          isRemote: opp.opportunityType === 'remote',
          description: opp.description
        }));

      // Filter out opportunities without valid coordinates
      const validOpportunities = processedOpportunities.filter(opp => opp.coordinates !== null);
      
      if (validOpportunities.length === 0) {
        console.warn('No opportunities with valid locations found');
        // Use mock data as fallback if no valid opportunities found
        setOpportunities(MOCK_OPPORTUNITIES);
      } else {
        // Update the opportunities state with valid opportunities
        setOpportunities(validOpportunities);
      }
      
      // Schedule a map update after state change
      setTimeout(() => {
        updateMapMarkers();
      }, 100);
      
    } catch (err) {
      console.error('Error in fetchOpportunities:', err);
      setError(err instanceof Error ? err.message : 'Failed to load opportunities. Please try again later.');
      
      // If we have mock data, use it as fallback
      if (MOCK_OPPORTUNITIES.length > 0) {
        console.warn('Using mock data as fallback');
        setOpportunities(MOCK_OPPORTUNITIES);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to get coordinates from location string
  const getCoordinatesFromLocation = (location: string) => {
    // Skip explicitly deleted/inactive locations
    if (location?.toLowerCase().includes('cairo')) {
      console.log('Skipping Cairo location as it contains deleted opportunities');
      return null;
    }
    
    // Common locations in Iraq and Middle East
    const locationCoordinates: { [key: string]: { lat: number; lng: number } } = {
      'Erbil': { lat: 36.1901, lng: 44.0091 },
      'Sulaimania': { lat: 35.5568, lng: 45.4347 },
      'Sulaymaniyah': { lat: 35.5568, lng: 45.4347 },
      'Slemani': { lat: 35.5568, lng: 45.4347 },
      'Duhok': { lat: 36.8671, lng: 42.9884 },
      'Dohuk': { lat: 36.8671, lng: 42.9884 },
      'Baghdad': { lat: 33.3152, lng: 44.3661 },
      'Mosul': { lat: 36.3450, lng: 43.1450 },
      'Basra': { lat: 30.5081, lng: 47.7804 },
      'Kirkuk': { lat: 35.4667, lng: 44.3167 },
      'Halabja': { lat: 35.1787, lng: 45.9864 },
      'Zakho': { lat: 37.1445, lng: 42.6872 },
      'Dubai': { lat: 25.2048, lng: 55.2708 },
      'Abu Dhabi': { lat: 24.4539, lng: 54.3773 },
      'Riyadh': { lat: 24.7136, lng: 46.6753 },
      'Amman': { lat: 31.9522, lng: 35.9336 },
      'Beirut': { lat: 33.8938, lng: 35.5018 },
      'Istanbul': { lat: 41.0082, lng: 28.9784 },
      'Tehran': { lat: 35.6892, lng: 51.3890 }
    };

    // Try to find an exact match
    const exactMatch = locationCoordinates[location];
    if (exactMatch) return exactMatch;

    // Try to find a partial match
    const locationKey = Object.keys(locationCoordinates).find(key => 
      location.toLowerCase().includes(key.toLowerCase())
    );
    
    if (locationKey) {
      return locationCoordinates[locationKey];
    }

    // If no match found, try to extract city name from location string
    const cityMatch = location.match(/([A-Za-z\s]+)(?:,|$)/);
    if (cityMatch) {
      const cityName = cityMatch[1].trim();
      const cityKey = Object.keys(locationCoordinates).find(key => 
        cityName.toLowerCase().includes(key.toLowerCase())
      );
      if (cityKey) {
        return locationCoordinates[cityKey];
      }
    }

    // If still no match, try to find any city name in the location string
    for (const [city, coords] of Object.entries(locationCoordinates)) {
      if (location.toLowerCase().includes(city.toLowerCase())) {
        return coords;
      }
    }

    console.warn(`No coordinates found for location: ${location}`);
    return null;
  };

  // Add retry functionality
  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
  };

  useEffect(() => {
    fetchOpportunities();
    
    // Set up polling to periodically fetch updated opportunities
    const intervalId = setInterval(() => {
      fetchOpportunities();
    }, 60000); // Poll every 60 seconds
    
    // Clean up interval on component unmount
    return () => {
      clearInterval(intervalId);
    };
  }, [retryCount]);

  useEffect(() => {
    // Update opportunities state when new data is received
    setOpportunities(opportunities);
  }, [opportunities]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Fix marker icons
    fixDefaultMarkerIcons();

    // Initialize map with a small delay to ensure container is ready
    const initMap = () => {
      if (!mapRef.current && mapContainerRef.current) {
        // Clean up any existing map instance
        if (mapRef.current) {
          (mapRef.current as L.Map).remove();
        }

        // Create new map instance
        mapRef.current = L.map(mapContainerRef.current, {
          center: [36.1901, 44.0091], // Center on Kurdistan
          zoom: 7,
          zoomControl: true,
          attributionControl: true
        });

        // Add tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors'
        }).addTo(mapRef.current);

        // Force a resize event to ensure proper rendering
        setTimeout(() => {
          mapRef.current?.invalidateSize();
        }, 100);

        // Fetch opportunities after map initialization
        fetchOpportunities();
      }
    };

    // Initialize map with a small delay
    const timeoutId = setTimeout(initMap, 100);

    // Cleanup function
    return () => {
      clearTimeout(timeoutId);
      if (mapRef.current) {
        (mapRef.current as L.Map).remove();
        mapRef.current = null;
      }
    };
  }, []); // Empty dependency array for initialization only

  // Function to update markers when opportunities change
  const updateMapMarkers = () => {
    if (!mapRef.current || !opportunitiesState.length) return;

    // Clear existing markers
    mapRef.current.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        mapRef.current?.removeLayer(layer);
      }
    });

    // Group opportunities by location
    const opportunitiesByLocation = opportunitiesState.reduce((acc, opportunity) => {
      // Skip Cairo and other problematic locations
      if (opportunity.location?.toLowerCase().includes('cairo')) {
        console.log('Skipping Cairo opportunity in updateMapMarkers');
        return acc;
      }
      
      if (opportunity.coordinates) {
        const key = `${opportunity.coordinates.lat},${opportunity.coordinates.lng}`;
        if (!acc[key]) {
          acc[key] = [];
        }
        acc[key].push(opportunity);
      }
      return acc;
    }, {} as Record<string, Opportunity[]>);

    // Add markers for each location
    Object.entries(opportunitiesByLocation).forEach(([locationKey, locationOpportunities]) => {
      const [lat, lng] = locationKey.split(',').map(Number);
      
      // Skip Cairo coordinates (failsafe)
      if (Math.abs(lat - 30.0444) < 0.1 && Math.abs(lng - 31.2357) < 0.1) {
        console.log('Skipping Cairo coordinates');
        return;
      }
      
      if (locationOpportunities.length === 1) {
        // Single opportunity at this location
        const opportunity = locationOpportunities[0];
        const marker = L.marker([lat, lng])
          .addTo(mapRef.current!)
          .bindPopup(`
            <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 max-w-[250px]">
              <div class="flex justify-between items-start mb-2">
                <div>
                  <h3 class="font-semibold text-[#9d4edd] dark:text-white text-sm">
                    ${opportunity.position}
                  </h3>
                  <p class="text-gray-600 dark:text-gray-400 text-xs">
                    ${typeof opportunity.company === 'string' 
                      ? opportunity.company 
                      : opportunity.company?.name || 'Company not specified'}
                  </p>
                </div>
                <button 
                  onclick="window.toggleSave('${opportunity.id}')"
                  class="flex items-center gap-1 border border-[#5e60ce] bg-white dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-300 rounded-lg px-2 py-1 text-xs ${savedOpportunities.includes(opportunity.id) ? 'bg-[#5e60ce] text-white' : ''}"
                >
                  <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                  </svg>
                  ${savedOpportunities.includes(opportunity.id) ? 'Saved' : 'Save'}
                </button>
              </div>
              <div class="space-y-1 mb-2">
                <div class="flex gap-1 text-xs text-gray-600 dark:text-gray-400">
                  <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                  </svg>
                  <span>${opportunity.location}</span>
                </div>
                <div class="flex gap-1 text-xs text-gray-600 dark:text-gray-400">
                  <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                  </svg>
                  <span>${opportunity.salary}</span>
                  <span>•</span>
                  <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 13.255A23.931 23.931 0 0 1 12 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2m4 6h.01M5 20h14a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2z"></path>
                  </svg>
                  <span>${opportunity.type}</span>
                </div>
              </div>
              <div class="flex flex-wrap gap-1">
                <a href="/dashboard/student/apply/${opportunity.id}" class="inline-block">
                  <button class="flex items-center gap-1 border border-[#5e60ce] bg-white dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-300 rounded-lg px-2 py-1 text-xs">
                    <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M7 7l10 10M7 17L17 7"></path>
                    </svg>
                    Apply Now
                  </button>
                </a>
              </div>
            </div>
          `);

        marker.on('click', () => {
          if (onMarkerClick) {
            onMarkerClick(opportunity);
          }
        });
      } else {
        // Multiple opportunities at this location
        const marker = L.marker([lat, lng])
          .addTo(mapRef.current!)
          .bindPopup(`
            <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 max-w-[250px]">
              <h3 class="font-semibold text-[#9d4edd] dark:text-white text-sm mb-2">
                ${locationOpportunities.length} Opportunities in ${locationOpportunities[0].location}
              </h3>
              <div class="space-y-2 max-h-[300px] overflow-y-auto">
                ${locationOpportunities.map(opp => `
                  <div class="bg-white dark:bg-gray-800 rounded-lg p-2 border border-gray-200 dark:border-gray-700">
                    <div class="flex justify-between items-start mb-1">
                      <div>
                        <h4 class="font-medium text-[#9d4edd] dark:text-white text-xs">
                          ${opp.position}
                        </h4>
                        <p class="text-gray-600 dark:text-gray-400 text-xs">
                          ${typeof opp.company === 'string' 
                            ? opp.company 
                            : opp.company?.name || 'Company not specified'}
                        </p>
                      </div>
                      <button 
                        onclick="window.toggleSave('${opp.id}')"
                        class="flex items-center gap-1 border border-[#5e60ce] bg-white dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-300 rounded-lg px-2 py-1 text-xs ${savedOpportunities.includes(opp.id) ? 'bg-[#5e60ce] text-white' : ''}"
                      >
                        <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                        </svg>
                        ${savedOpportunities.includes(opp.id) ? 'Saved' : 'Save'}
                      </button>
                    </div>
                    <div class="flex gap-1 text-xs text-gray-600 dark:text-gray-400 mb-1">
                      <span>${opp.salary}</span>
                      <span>•</span>
                      <span>${opp.type}</span>
                    </div>
                    <div class="flex flex-wrap gap-1">
                      <a href="/dashboard/student/apply/${opp.id}" class="inline-block">
                        <button class="flex items-center gap-1 border border-[#5e60ce] bg-white dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-300 rounded-lg px-2 py-1 text-xs">
                          <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M7 7l10 10M7 17L17 7"></path>
                          </svg>
                          Apply Now
                        </button>
                      </a>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          `);

        // Add a custom icon with the count
        const countIcon = L.divIcon({
          className: 'custom-marker',
          html: `
            <div class="marker-content">
              <div class="marker-icon">
                <span class="marker-count">${locationOpportunities.length}</span>
              </div>
            </div>
          `,
          iconSize: [40, 40],
          iconAnchor: [20, 20]
        });

        marker.setIcon(countIcon);
      }
    });

    // Fit bounds to show all markers
    const bounds = L.latLngBounds(opportunitiesState
      .filter(o => o.coordinates)
      .map(o => [o.coordinates!.lat, o.coordinates!.lng] as [number, number]));
    
    if (bounds.isValid()) {
      mapRef.current.fitBounds(bounds, { padding: [50, 50] });
    }
  };

  // Update markers when opportunities change
  useEffect(() => {
    updateMapMarkers();
  }, [opportunitiesState, savedOpportunities, onMarkerClick]);

  // Add custom styles for the marker
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .custom-marker {
        background: none;
        border: none;
      }
      .marker-content {
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
      }
      .marker-icon {
        width: 40px;
        height: 40px;
        background: #6930c3;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        transition: all 0.3s ease;
      }
      .marker-count {
        font-weight: bold;
        font-size: 16px;
      }
      .marker-content:hover .marker-icon {
        transform: scale(1.1);
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Add window function for popup buttons
  useEffect(() => {
    (window as any).toggleSave = (opportunityId: string) => {
      if (onSaveOpportunity) {
        onSaveOpportunity(opportunityId);
      }
    };

    return () => {
      delete (window as any).toggleSave;
    };
  }, [onSaveOpportunity]);

  return (
    <div className="relative w-full h-full">
      {isLoading && (
        <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 z-50 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        </div>
      )}
      
      {error && (
        <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 z-50 flex items-center justify-center">
          <div className="text-center p-4">
            <p className="text-red-500 font-semibold mb-2">Error loading map</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{error}</p>
            <button
              onClick={handleRetry}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      <div ref={mapContainerRef} className="w-full h-full rounded-lg" />

      <style jsx global>{`
        .leaflet-container {
          width: 100%;
          height: 100%;
          z-index: 1;
        }
        .leaflet-popup-content-wrapper {
          border-radius: 0.5rem;
          padding: 0;
          background: transparent;
          box-shadow: none;
        }
        .leaflet-popup-content {
          margin: 0;
          min-width: 300px;
        }
        .leaflet-popup-tip {
          display: none;
        }
        .selected-location-marker {
          background: none;
          border: none;
        }
        .selected-marker {
          width: 20px;
          height: 20px;
          background: #2563eb;
          border: 2px solid white;
          border-radius: 50%;
          box-shadow: 0 0 0 2px #2563eb;
        }
        .custom-popup .leaflet-popup-content-wrapper {
          padding: 0;
          border-radius: 8px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .custom-popup .leaflet-popup-content {
          margin: 0;
          width: 100% !important;
        }

        .custom-popup button {
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .custom-popup button:hover {
          transform: translateY(-1px);
        }

        .custom-popup .fas {
          width: 16px;
          text-align: center;
        }

        .leaflet-popup-close-button {
          display: none;
        }

        .leaflet-popup {
          margin-bottom: 20px;
        }

        .marker-content {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .marker-icon {
          width: 40px;
          height: 40px;
          background: #6930c3;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          transition: all 0.3s ease;
        }

        .marker-count {
          font-weight: bold;
          font-size: 16px;
        }

        .marker-content:hover .marker-icon {
          transform: scale(1.1);
        }
      `}</style>
    </div>
  );
} 