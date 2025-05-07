"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import Navigation from "@/components/Navigation";
import Link from "next/link";
import { getOpportunities, getProfile, Opportunity, saveOpportunity, unsaveOpportunity } from "@/lib/api";
import { MapPin, DollarSign, Briefcase, ArrowUpRight, ExternalLink, BookmarkPlus, NavigationIcon } from "lucide-react";

interface UIOpportunity {
  id: string;
  position: string;
  type: string;
  skills: string[];
  coordinates: { lat: number; lng: number } | null;
  salary: string;
  location: string;
  description: string;
  company?: any;
  requirements?: string[];
}

export default function AllOpportunitiesPage() {
  const [opportunities, setOpportunities] = useState<UIOpportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();
  const searchQuery = searchParams?.get('search') || '';
  const locationQuery = searchParams?.get('location') || '';
  const opportunityTypeQuery = searchParams?.get('opportunityType') || '';
  const skillsQuery = searchParams?.get('skills') || '';
  const minSalaryQuery = searchParams?.get('minSalary') || '';
  const maxSalaryQuery = searchParams?.get('maxSalary') || '';
  const kurdistanCities = [
    { name: "Erbil", lat: 36.1901, lng: 44.0091 },
    { name: "Sulaymaniyah", lat: 35.5556, lng: 45.4351 },
    { name: "Duhok", lat: 36.8669, lng: 42.9503 },
    { name: "Halabja", lat: 35.1787, lng: 45.9864 },
    { name: "Zakho", lat: 37.1445, lng: 42.6872 }
  ];
  const router = useRouter();
  const [savedOpportunities, setSavedOpportunities] = useState<string[]>([]);

  const formatSalary = (min?: number, max?: number) => {
    if (!min && !max) return 'N/A';
    if (min && !max) return `$${min.toLocaleString()}+`;
    if (!min && max) return `Up to $${max.toLocaleString()}`;
    return `$${min?.toLocaleString()} - $${max?.toLocaleString()}`;
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('No token');
        const fetchedOpportunities = await getOpportunities({ 
          status: 'active', 
          ...(searchQuery ? { search: searchQuery } : {}),
          ...(locationQuery ? { location: locationQuery } : {}),
          ...(opportunityTypeQuery ? { opportunityType: opportunityTypeQuery } : {}),
          ...(skillsQuery ? { skills: skillsQuery } : {}),
          ...(minSalaryQuery ? { minSalary: minSalaryQuery } : {}),
          ...(maxSalaryQuery ? { maxSalary: maxSalaryQuery } : {})
        }, token);
        setOpportunities(
          fetchedOpportunities.map((opp: any) => ({
            ...opp,
            id: opp._id,
            position: opp.title,
            type: opp.opportunityType,
            location: opp.location,
            salary: formatSalary(opp.salary?.min, opp.salary?.max),
            skills: opp.tags || [],
            coordinates: (() => {
              const city = kurdistanCities.find(c => opp.location?.toLowerCase().includes(c.name.toLowerCase()));
              return city ? { lat: city.lat, lng: city.lng } : null;
            })(),
          }))
        );
      } catch (err) {
        console.error('Error fetching opportunities:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [searchQuery, locationQuery, opportunityTypeQuery, skillsQuery, minSalaryQuery, maxSalaryQuery]);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-8 animate-pulse"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
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
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-[#6930c3] dark:text-[#b185db]">All Opportunities</h2>
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="flex items-center gap-2 border border-[#5e60ce] bg-white dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-300 rounded-lg"
          >
            <ArrowUpRight className="w-4 h-4 rotate-180" /> Back to Dashboard
          </Button>
        </div>
        {opportunities.length === 0 ? (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              {(() => {
                const activeFilters = [];
                if (locationQuery) activeFilters.push(`in ${locationQuery}`);
                if (opportunityTypeQuery) activeFilters.push(`of type ${opportunityTypeQuery.split(',').join(' or ')}`);
                if (skillsQuery) activeFilters.push(`with skills ${skillsQuery.split(',').join(', ')}`);
                if (searchQuery) activeFilters.push(`matching "${searchQuery}"`);
                if (minSalaryQuery || maxSalaryQuery) {
                  const salaryRange = [];
                  if (minSalaryQuery) salaryRange.push(`minimum $${Number(minSalaryQuery).toLocaleString()}`);
                  if (maxSalaryQuery) salaryRange.push(`maximum $${Number(maxSalaryQuery).toLocaleString()}`);
                  activeFilters.push(`with salary ${salaryRange.join(' and ')}`);
                }
                
                return activeFilters.length > 0
                  ? `No opportunities found ${activeFilters.join(' ')}`
                  : 'No opportunities found';
              })()}
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              {(() => {
                if (locationQuery || opportunityTypeQuery || skillsQuery || searchQuery || minSalaryQuery || maxSalaryQuery) {
                  return 'Try adjusting your search criteria or removing some filters';
                }
                return 'Try adjusting your search criteria';
              })()}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {opportunities.map((opportunity) => (
              <div key={opportunity.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 transition-transform transform hover:scale-105">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-semibold text-[#9d4edd] dark:text-white">{opportunity.position}</h3>
                    <p className="text-gray-600 dark:text-gray-400">{typeof opportunity.company === 'string' ? opportunity.company : opportunity.company?.name || ''}</p>
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
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">{opportunity.description}</p>
                <div className="flex flex-wrap gap-2">
                  <Link href={`/dashboard/student/apply/${opportunity.id}`}>
                    <Button size="sm" className="flex items-center gap-1 border border-[#5e60ce] bg-white dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-300 rounded-lg">
                      <ArrowUpRight className="w-4 h-4" /> Apply Now
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 