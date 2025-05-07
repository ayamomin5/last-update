"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import Navigation from "@/components/Navigation";
import dynamic from 'next/dynamic';
import {
  MapPin, Globe2, DollarSign, Briefcase, Ruler, Target,
  CheckCircle2, Building2, GraduationCap, ListFilter, Map as MapIcon,
  LayoutList, BookmarkPlus, ExternalLink, ArrowUpRight,
  Navigation as NavigationIcon, Filter,
  List, Loader2, ChevronDown, ChevronUp,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getOpportunities, getProfile, saveOpportunity, unsaveOpportunity } from "@/lib/api";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Dynamically import MapView with SSR disabled
const MapView = dynamic(() => import('./components/MapView'), { ssr: false });

// Helper type for mapped opportunities
interface UIOpportunity {
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

export default function StudentDashboard() {
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [userSkills, setUserSkills] = useState<string[]>([]);
  const [isEditingSkills, setIsEditingSkills] = useState(false);
  const [distanceFilter, setDistanceFilter] = useState<'all' | 'nearby' | 'remote'>('all');
  const [loading, setLoading] = useState(true);
  const [visibleOpportunities, setVisibleOpportunities] = useState(3);
  const [visibleRecommendedOpportunities, setVisibleRecommendedOpportunities] = useState(3);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number; city: string }>({
    lat: 36.1901,
    lng: 44.0091,
    city: "Erbil"
  });
  const [opportunities, setOpportunities] = useState<UIOpportunity[]>([]);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const kurdistanCities = [
    { name: "Erbil", lat: 36.1901, lng: 44.0091 },
    { name: "Sulaymaniyah", lat: 35.5556, lng: 45.4351 },
    { name: "Duhok", lat: 36.8669, lng: 42.9503 },
    { name: "Halabja", lat: 35.1787, lng: 45.9864 },
    { name: "Zakho", lat: 37.1445, lng: 42.6872 }
  ];

  const availableSkills = [
    "React", "JavaScript", "TypeScript", "Node.js", "SQL",
    "Python", "Java", "C++", "AWS", "Docker",
    "MongoDB", "PostgreSQL", "GraphQL", "Vue.js", "Angular"
  ];

  const [currentOpportunityIndex, setCurrentOpportunityIndex] = useState(0);
  const [savedOpportunities, setSavedOpportunities] = useState<string[]>([]);
  const [selectedOpportunity, setSelectedOpportunity] = useState<UIOpportunity | null>(null);
  const [mapLoading, setMapLoading] = useState(false);
  const [experiencePositions, setExperiencePositions] = useState<string[]>([]);
  const [visibleExperienceOpportunities, setVisibleExperienceOpportunities] = useState(3);

  const toggleSkill = (skill: string) => {
    setUserSkills(prev =>
      prev.includes(skill)
        ? prev.filter(s => s !== skill)
        : [...prev, skill]
    );
  };

  const deg2rad = (deg: number) => deg * (Math.PI / 180);

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c);
  };

  const filteredOpportunities = opportunities.filter(opp => {
    // Filter by skills if any are selected
    if (userSkills.length > 0) {
      if (opp.skills && Array.isArray(opp.skills)) {
        return opp.skills.some((skill: string) => userSkills.includes(skill));
      }
      return false;
    }

    // Filter by distance
    if (distanceFilter === 'remote') {
      return opp.type?.toLowerCase().includes('remote');
    }

    if (distanceFilter === 'nearby' && opp.coordinates && userLocation) {
      const distance = calculateDistance(
        userLocation.lat,
        userLocation.lng,
        opp.coordinates.lat,
        opp.coordinates.lng
      );
      return distance <= 50; // Show opportunities within 50km
    }

    return true;
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('No token');
        const profile = await getProfile('student', token);
        // Only use experience positions for experience-based matching
        const expPositions = Array.isArray(profile.experience)
          ? profile.experience.map((exp: any) => exp.position).filter(Boolean)
          : [];
        setExperiencePositions(expPositions);
        setUserSkills(profile.skills || []); // keep for other UI, but not for experience matching
        if (profile.location) {
          const cityObj = kurdistanCities.find(c => c.name.toLowerCase() === profile.location.toLowerCase());
          if (cityObj) {
            setUserLocation({ lat: cityObj.lat, lng: cityObj.lng, city: cityObj.name });
          } else {
            setUserLocation(prev => ({ ...prev, city: profile.location }));
          }
        }
        setProfileLoaded(true);
        const fetchedOpportunities = await getOpportunities({ status: 'active' }, token);
        
        // Get list of locations with deleted opportunities
        const deletedLocations = fetchedOpportunities
          .filter((opp: any) => opp.status === 'deleted')
          .map((opp: any) => opp.location?.toLowerCase())
          .filter(Boolean);
        
        setOpportunities(
          fetchedOpportunities
            .filter((opp: any) => {
              // Filter out deleted opportunities
              if (opp.status === 'deleted') return false;
              
              // Filter out Cairo explicitly (as requested)
              if (opp.location?.toLowerCase().includes('cairo')) return false;
              
              // Filter out opportunities in locations that have deleted opportunities
              if (opp.location && deletedLocations.some(loc => 
                opp.location.toLowerCase().includes(loc) || 
                (loc && loc.includes(opp.location.toLowerCase()))
              )) {
                return false;
              }
              
              return true;
            })
            .map((opp: any) => ({
              ...opp,
              id: opp._id,
              position: opp.title,
              type: opp.opportunityType,
              location: opp.location,
              salary: opp.salary?.min && opp.salary?.max ? `$${opp.salary.min} - $${opp.salary.max}` : 'N/A',
              skills: opp.tags || [],
              coordinates: (() => {
                // Skip Cairo and other deleted locations
                if (opp.location?.toLowerCase().includes('cairo')) return null;
                
                const city = kurdistanCities.find(c => opp.location?.toLowerCase().includes(c.name.toLowerCase()));
                return city ? { lat: city.lat, lng: city.lng } : null;
              })(),
            }))
        );
      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const fetchSavedOpportunities = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          console.error('No token found');
          return;
        }
        
        const profile = await getProfile('student', token);
        if (profile?.savedOpportunities) {
          setSavedOpportunities(profile.savedOpportunities);
        }
      } catch (err) {
        console.error('Failed to fetch saved opportunities:', err);
      }
    };

    fetchSavedOpportunities();
  }, []);

  const toggleSaveOpportunity = async (opportunityId: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No token found');
        return;
      }

      if (savedOpportunities.includes(opportunityId)) {
        await unsaveOpportunity(opportunityId, token);
        setSavedOpportunities(prev => prev.filter(id => id !== opportunityId));
      } else {
        await saveOpportunity(opportunityId, token);
        setSavedOpportunities(prev => [...prev, opportunityId]);
      }

      // Refresh the profile to get updated saved opportunities
      try {
        const profile = await getProfile('student', token);
        if (profile?.savedOpportunities) {
          setSavedOpportunities(profile.savedOpportunities);
        }
      } catch (err) {
        console.error('Failed to refresh saved opportunities:', err);
      }
    } catch (err) {
      console.error('Failed to toggle save opportunity:', err);
    }
  };

  const isOpportunitySaved = (opportunityId: string) => {
    return savedOpportunities.includes(opportunityId);
  };

  const router = useRouter();

  const allOpportunities = opportunities;

  const locationBasedOpportunities = opportunities.filter(opp =>
    userLocation.city && opp.location?.toLowerCase().includes(userLocation.city.toLowerCase())
  );

  // Only match opportunities based on experience positions (not skills)
  const experienceBasedOpportunities = opportunities.filter(opp =>
    experiencePositions.length > 0 && (
      (opp.skills && Array.isArray(opp.skills) && opp.skills.some((skill: string) =>
        experiencePositions.some(exp =>
          skill.toLowerCase().includes(exp.toLowerCase()) || exp.toLowerCase().includes(skill.toLowerCase())
        )
      )) ||
      (opp.position && experiencePositions.some(exp =>
        opp.position.toLowerCase().includes(exp.toLowerCase()) || exp.toLowerCase().includes(opp.position.toLowerCase())
      ))
    )
  );

  // Add handlers for prev/next opportunity
  const prevOpportunity = () => {
    setCurrentOpportunityIndex((prev) => Math.max(prev - 1, 0));
  };
  const nextOpportunity = () => {
    setCurrentOpportunityIndex((prev) =>
      prev < allOpportunities.length - 3 ? prev + 1 : prev
    );
  };
  const handleViewLocation = (coordinates: { lat: number; lng: number }) => {
    setSelectedLocation(coordinates);
    setViewMode('map');
  };

  const handleMarkerClick = (opportunity: UIOpportunity) => {
    setSelectedOpportunity(opportunity);
    if (opportunity.coordinates) {
      setSelectedLocation(opportunity.coordinates);
    }
  };

  const handleMapView = async () => {
    try {
      setMapLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        toast({
          title: "Authentication Required",
          description: "Please log in to view opportunities.",
          variant: "destructive"
        });
        return;
      }

      const fetchedOpportunities = await getOpportunities({ status: 'active' }, token);
      
      // Get list of locations with deleted opportunities
      const deletedLocations = fetchedOpportunities
        .filter((opp: any) => opp.status === 'deleted')
        .map((opp: any) => opp.location?.toLowerCase())
        .filter(Boolean);
      
      console.log('Deleted locations:', deletedLocations);
      
      const mappedOpportunities = fetchedOpportunities
        .filter((opp: any) => {
          // Filter out deleted opportunities
          if (opp.status === 'deleted') return false;
          
          // Filter out Cairo explicitly (as requested)
          if (opp.location?.toLowerCase().includes('cairo')) return false;
          
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
          company: {
            name: opp.company?.name || 'Company not specified',
            _id: opp.company?._id || '',
            logo: opp.company?.logo || '',
            industry: opp.company?.industry || '',
            location: opp.company?.location || ''
          },
          location: opp.location,
          coordinates: (() => {
            // Skip Cairo and other deleted locations from getting coordinates
            if (opp.location?.toLowerCase().includes('cairo')) return null;
            
            const city = kurdistanCities.find(c => opp.location?.toLowerCase().includes(c.name.toLowerCase()));
            return city ? { lat: city.lat, lng: city.lng } : null;
          })(),
          salary: opp.salary?.min && opp.salary?.max ? `$${opp.salary.min} - $${opp.salary.max}` : 'N/A',
          type: opp.opportunityType,
          skills: opp.tags || [],
          isRemote: opp.type?.toLowerCase().includes('remote') || false,
          description: opp.description || ''
        }));

      setOpportunities(mappedOpportunities);
      setViewMode('map');
    } catch (error) {
      console.error('Error fetching opportunities:', error);
      toast({
        title: "Error",
        description: "Failed to load opportunities. Please try again.",
        variant: "destructive"
      });
    } finally {
      setMapLoading(false);
    }
  };

  const handleApply = async (opportunityId: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast({
          title: "Authentication Required",
          description: "Please log in to apply for opportunities.",
          variant: "destructive"
        });
        return;
      }

      const response = await fetch('/api/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ opportunityId })
      });

      if (!response.ok) {
        throw new Error('Failed to submit application');
      }

      toast({
        title: "Success",
        description: "Your application has been submitted successfully.",
      });

      // Refresh opportunities to update application status
      handleMapView();
    } catch (error) {
      console.error('Error submitting application:', error);
      toast({
        title: "Error",
        description: "Failed to submit application. Please try again.",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          {/* Header Skeleton */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-6">
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 animate-pulse"></div>
              <div className="flex gap-2">
                <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse"></div>
                <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse"></div>
              </div>
            </div>
          </div>
          {/* Filters Skeleton */}
          <div className="mb-8">
            <div className="flex flex-wrap gap-4 mb-4">
              <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse"></div>
              <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse"></div>
              <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse"></div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
              <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4 animate-pulse"></div>
              <div className="flex flex-wrap gap-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-8 bg-gray-200 dark:bg-gray-700 rounded-full w-24 animate-pulse"></div>
                ))}
              </div>
            </div>
          </div>
          {/* Opportunities Grid Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="space-y-2">
                    <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4 animate-pulse"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 animate-pulse"></div>
                  </div>
                  <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-20 animate-pulse"></div>
                </div>
                <div className="space-y-3 mb-4">
                  <div className="flex gap-2">
                    <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 animate-pulse"></div>
                  </div>
                  <div className="flex gap-2">
                    <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 animate-pulse"></div>
                  </div>
                  <div className="flex gap-2">
                    <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/5 animate-pulse"></div>
                  </div>
                </div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full animate-pulse"></div>
              </div>
            ))}
          </div>
          {/* Skills Based Recommendations Skeleton */}
          <div className="mt-12">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-6 animate-pulse"></div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6 p-4">
              <div className="flex flex-wrap gap-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-8 bg-gray-200 dark:bg-gray-700 rounded-full w-24 animate-pulse"></div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="space-y-2">
                      <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4 animate-pulse"></div>
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 animate-pulse"></div>
                    </div>
                    <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-20 animate-pulse"></div>
                  </div>
                  <div className="space-y-3 mb-4">
                    <div className="flex gap-2">
                      <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 animate-pulse"></div>
                    </div>
                    <div className="flex gap-2">
                      <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 animate-pulse"></div>
                    </div>
                  </div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full animate-pulse"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const renderOpportunityCard = (opportunity: UIOpportunity) => (
    <div key={opportunity.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 transition-transform transform hover:scale-105">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-semibold text-[#9d4edd] dark:text-white">
            {opportunity.position}
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {typeof opportunity.company === 'string' 
              ? opportunity.company 
              : opportunity.company?.name || 'Company not specified'}
          </p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => toggleSaveOpportunity(opportunity.id)}
          className={`flex items-center gap-1 border border-[#5e60ce] bg-white dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-300 rounded-lg ${
            isOpportunitySaved(opportunity.id) ? 'bg-[#5e60ce] text-white' : ''
          }`}
        >
          <BookmarkPlus className="w-4 h-4" /> 
          {isOpportunitySaved(opportunity.id) ? 'Saved' : 'Save'}
        </Button>
      </div>
      <div className="space-y-3 mb-4">
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
  );

  // Update the location-based opportunities section to use the new render function
  const renderLocationBasedOpportunity = (opportunity: UIOpportunity) => (
    <div key={opportunity.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 transition-transform transform hover:scale-105">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-semibold text-[#9d4edd] dark:text-white">
            {opportunity.position}
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {typeof opportunity.company === 'string' 
              ? opportunity.company 
              : opportunity.company?.name || 'Company not specified'}
          </p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => toggleSaveOpportunity(opportunity.id)}
          className={`flex items-center gap-1 border border-[#5e60ce] bg-white dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-300 rounded-lg ${
            isOpportunitySaved(opportunity.id) ? 'bg-[#5e60ce] text-white' : ''
          }`}
        >
          <BookmarkPlus className="w-4 h-4" /> 
          {isOpportunitySaved(opportunity.id) ? 'Saved' : 'Save'}
        </Button>
      </div>
      <div className="space-y-3 mb-4">
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
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold text-[#6930c3] dark:text-[#b185db]">
              {viewMode === 'list' ? 'All Opportunities' : 'Opportunities Near You'}
            </h2>
            <div className="flex gap-2 items-center">
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                onClick={() => setViewMode('list')}
                className="flex items-center gap-2 border border-[#5e60ce] bg-white dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-300 rounded-lg"
              >
                <LayoutList className="w-4 h-4" /> List View
              </Button>
              <Button
                variant={viewMode === 'map' ? 'default' : 'outline'}
                onClick={handleMapView}
                disabled={mapLoading}
                className="flex items-center gap-2 border border-[#5e60ce] bg-white dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-300 rounded-lg"
              >
                {mapLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <MapIcon className="w-4 h-4" />
                )}
                Map View
              </Button>
            </div>
          </div>

          {viewMode === 'list' ? (
            <>
              {/* List View Content */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {allOpportunities.slice(0, visibleOpportunities).map(renderOpportunityCard)}
              </div>

              <div className="flex justify-center mt-6 mb-8">
                {allOpportunities.length > visibleOpportunities ? (
                  <Button
                    variant="outline"
                    onClick={() => setVisibleOpportunities(prev => prev + 3)}
                    className="flex items-center gap-2 border border-[#5e60ce] bg-white dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-300 rounded-lg"
                  >
                    Show More <ChevronDown className="w-4 h-4" />
                  </Button>
                ) : visibleOpportunities > 3 ? (
                  <Button
                    variant="outline"
                    onClick={() => setVisibleOpportunities(3)}
                    className="flex items-center gap-2 border border-[#5e60ce] bg-white dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-300 rounded-lg"
                  >
                    Show Less <ChevronUp className="w-4 h-4" />
                  </Button>
                ) : null}
              </div>

              {/* Location Based Recommendations */}
              <div className="mt-12">
                <h2 className="text-3xl font-bold mb-6 text-[#6930c3] dark:text-[#b185db]">
                  Recommended Opportunities Near You
                </h2>
                <div className="rounded-lg shadow mb-6 p-4">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Showing opportunities near {userLocation.city}, Kurdistan
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
                    {locationBasedOpportunities.slice(0, visibleRecommendedOpportunities).map(renderLocationBasedOpportunity)}
                  </div>
                  <div className="flex justify-center mt-6 mb-8">
                    {locationBasedOpportunities.length > visibleRecommendedOpportunities ? (
                      <Button
                        variant="outline"
                        onClick={() => setVisibleRecommendedOpportunities(prev => prev + 3)}
                        className="flex items-center gap-2 border border-[#5e60ce] bg-white dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-300 rounded-lg"
                      >
                        Show More <ChevronDown className="w-4 h-4" />
                      </Button>
                    ) : visibleRecommendedOpportunities > 3 ? (
                      <Button
                        variant="outline"
                        onClick={() => setVisibleRecommendedOpportunities(3)}
                        className="flex items-center gap-2 border border-[#5e60ce] bg-white dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-300 rounded-lg"
                      >
                        Show Less <ChevronUp className="w-4 h-4" />
                      </Button>
                    ) : null}
                  </div>
                </div>
              </div>
            </>
          ) : (
            // Map View Content
            <div className="h-[600px] bg-white rounded-lg shadow-sm overflow-hidden">
              <MapView
                opportunities={filteredOpportunities}
                selectedLocation={selectedLocation}
                onMarkerClick={handleMarkerClick}
                onSaveOpportunity={toggleSaveOpportunity}
                savedOpportunities={savedOpportunities}
              />
            </div>
          )}
        </div>

        {/* Based on Your Experience Section - Only show in list view mode */}
        {viewMode === 'list' && (
          <div className="mb-12">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-bold text-[#6930c3] dark:text-[#b185db]">
                Based on Your Experience
              </h2>
            </div>
            {loading ? (
              <div className="text-center py-8">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-[#6930c3]" />
                <p className="text-gray-600 dark:text-gray-400">Loading opportunities...</p>
              </div>
            ) : experienceBasedOpportunities.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600 dark:text-gray-400">No matching opportunities found based on your experience.</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {experienceBasedOpportunities.slice(0, visibleExperienceOpportunities).map(renderOpportunityCard)}
                </div>
                <div className="flex justify-center mt-6 mb-8">
                  {experienceBasedOpportunities.length > visibleExperienceOpportunities ? (
                    <Button
                      variant="outline"
                      onClick={() => setVisibleExperienceOpportunities(prev => prev + 3)}
                      className="flex items-center gap-2 border border-[#5e60ce] bg-white dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-300 rounded-lg"
                    >
                      Show More <ChevronDown className="w-4 h-4" />
                    </Button>
                  ) : visibleExperienceOpportunities > 3 ? (
                    <Button
                      variant="outline"
                      onClick={() => setVisibleExperienceOpportunities(3)}
                      className="flex items-center gap-2 border border-[#5e60ce] bg-white dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-300 rounded-lg"
                    >
                      Show Less <ChevronUp className="w-4 h-4" />
                    </Button>
                  ) : null}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}