"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import Navigation from "@/components/Navigation";
import { MapPin, DollarSign, Briefcase, BookmarkPlus, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { getOpportunities, getProfile, saveOpportunity, unsaveOpportunity } from "@/lib/api";
import { toast } from "@/components/ui/use-toast";

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
  skills: string[];
  description?: string;
}

export default function LocationOpportunities() {
  const [opportunities, setOpportunities] = useState<UIOpportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number; city: string }>({
    lat: 36.1901,
    lng: 44.0091,
    city: "Erbil"
  });
  const [savedOpportunities, setSavedOpportunities] = useState<string[]>([]);

  const kurdistanCities = [
    { name: "Erbil", lat: 36.1901, lng: 44.0091 },
    { name: "Sulaymaniyah", lat: 35.5556, lng: 45.4351 },
    { name: "Duhok", lat: 36.8669, lng: 42.9503 },
    { name: "Halabja", lat: 35.1787, lng: 45.9864 },
    { name: "Zakho", lat: 37.1445, lng: 42.6872 }
  ];

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('No token');
        
        const profile = await getProfile('student', token);
        if (profile.location) {
          const cityObj = kurdistanCities.find(c => c.name.toLowerCase() === profile.location.toLowerCase());
          if (cityObj) {
            setUserLocation({ lat: cityObj.lat, lng: cityObj.lng, city: cityObj.name });
          } else {
            setUserLocation(prev => ({ ...prev, city: profile.location }));
          }
        }

        const fetchedOpportunities = await getOpportunities({ status: 'active' }, token);
        const mappedOpportunities = fetchedOpportunities.map((opp: any) => ({
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
            const city = kurdistanCities.find(c => opp.location?.toLowerCase().includes(c.name.toLowerCase()));
            return city ? { lat: city.lat, lng: city.lng } : null;
          })(),
          salary: opp.salary?.min && opp.salary?.max ? `$${opp.salary.min} - $${opp.salary.max}` : 'N/A',
          type: opp.opportunityType,
          skills: opp.tags || [],
          description: opp.description || ''
        }));

        // Filter opportunities based on user's location
        const locationBasedOpps = mappedOpportunities.filter(opp =>
          userLocation.city && opp.location?.toLowerCase().includes(userLocation.city.toLowerCase())
        );

        setOpportunities(locationBasedOpps);
      } catch (err) {
        console.error('Error fetching data:', err);
        toast({
          title: "Error",
          description: "Failed to load opportunities. Please try again.",
          variant: "destructive"
        });
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
            savedOpportunities.includes(opportunity.id) ? 'bg-[#5e60ce] text-white' : ''
          }`}
        >
          <BookmarkPlus className="w-4 h-4" /> 
          {savedOpportunities.includes(opportunity.id) ? 'Saved' : 'Save'}
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4"></div>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-[#6930c3] dark:text-[#b185db] mb-6">
            Opportunities Near {userLocation.city}
          </h2>
          <div className="flex items-center gap-2 mb-6">
            <MapPin className="w-4 h-4" />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Showing opportunities near {userLocation.city}, Kurdistan
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {opportunities.map(renderOpportunityCard)}
          </div>
        </div>
      </div>
    </div>
  );
} 