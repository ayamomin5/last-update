"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import Navigation from "@/components/Navigation";
import { MapPin, DollarSign, Briefcase, BookmarkPlus, ArrowUpRight, ExternalLink } from "lucide-react";
import Link from "next/link";
import { getOpportunities, getProfile } from "@/lib/api";
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
  experienceLevel?: string;
  description?: string;
}

export default function ExperienceOpportunities() {
  const [opportunities, setOpportunities] = useState<UIOpportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [userSkills, setUserSkills] = useState<string[]>([]);
  const [userExperienceLevel, setUserExperienceLevel] = useState<string>('entry');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          console.error('No token found');
          throw new Error('No token');
        }
        
        // First get the user profile
        console.log('Fetching user profile...');
        const profile = await getProfile('student', token);
        console.log('User profile:', profile);

        const userSkills = profile.skills || [];
        const userExperienceLevel = profile.experienceLevel || 'entry';
        
        console.log('User skills:', userSkills);
        console.log('User experience level:', userExperienceLevel);
        
        setUserSkills(userSkills);
        setUserExperienceLevel(userExperienceLevel);

        // Then fetch opportunities with the user's skills and experience
        console.log('Fetching opportunities with params:', {
          status: 'active',
          skills: userSkills.join(','),
          experienceLevel: userExperienceLevel
        });

        const fetchedOpportunities = await getOpportunities({ 
          status: 'active'
        }, token);

        console.log('Raw fetched opportunities:', fetchedOpportunities);

        if (!Array.isArray(fetchedOpportunities)) {
          console.error('Fetched opportunities is not an array:', fetchedOpportunities);
          throw new Error('Invalid opportunities data received');
        }

        const mappedOpportunities = fetchedOpportunities.map((opp: any) => {
          console.log('Processing opportunity:', opp);
          return {
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
            coordinates: null,
            salary: opp.salary?.min && opp.salary?.max ? `$${opp.salary.min} - $${opp.salary.max}` : 'N/A',
            type: opp.opportunityType,
            skills: opp.tags || [],
            experienceLevel: opp.experienceLevel || 'entry',
            description: opp.description || ''
          };
        });

        console.log('Mapped opportunities:', mappedOpportunities);

        // Filter opportunities based on user's skills and experience level
        const experienceBasedOpps = mappedOpportunities.filter(opp => {
          const skillsMatch = userSkills.length === 0 || opp.skills.some((skill: string) => userSkills.includes(skill));
          const experienceMatch = !opp.experienceLevel || opp.experienceLevel === userExperienceLevel;
          console.log('Filtering opportunity:', {
            id: opp.id,
            skillsMatch,
            experienceMatch,
            oppSkills: opp.skills,
            userSkills,
            oppExperience: opp.experienceLevel,
            userExperience: userExperienceLevel
          });
          return skillsMatch && experienceMatch;
        });

        console.log('Final filtered opportunities:', experienceBasedOpps);
        setOpportunities(experienceBasedOpps);
      } catch (error) {
        console.error('Error in fetchData:', error);
        toast({
          title: "Error",
          description: "Failed to load opportunities. Please try again later.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []); // Remove dependencies to prevent infinite loop

  // Add debug render to show current state
  console.log('Current state:', {
    loading,
    userSkills,
    userExperienceLevel,
    opportunitiesCount: opportunities.length
  });

  const getExperienceLevelLabel = (level: string) => {
    const labels: { [key: string]: string } = {
      'entry': 'Entry Level',
      'intermediate': 'Intermediate',
      'senior': 'Senior',
      'expert': 'Expert'
    };
    return labels[level] || level;
  };

  const renderOpportunityCard = (opportunity: UIOpportunity) => {
    console.log('Rendering opportunity card:', opportunity);
    return (
      <div key={opportunity.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 transition-transform transform hover:scale-105">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="font-semibold text-[#9d4edd] dark:text-white">
              {opportunity.position}
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {typeof opportunity.company === 'string' ? opportunity.company : opportunity.company?.name}
            </p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            className="flex items-center gap-1 border border-[#5e60ce] bg-white dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-300 rounded-lg"
          >
            <BookmarkPlus className="w-4 h-4" /> Save
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
          <div className="flex gap-2 text-sm text-gray-600 dark:text-gray-400">
            <span>Experience Level: {getExperienceLevelLabel(opportunity.experienceLevel || 'entry')}</span>
          </div>
          <div className="flex gap-2 text-sm text-gray-600 dark:text-gray-400">
            <span>Required Skills: {opportunity.skills.join(', ') || 'None specified'}</span>
          </div>
        </div>
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">{opportunity.description}</p>
        <div className="flex gap-2">
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
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-[#6930c3] dark:text-[#b185db] mb-6">
            Opportunities Based on Your Experience
          </h2>
          <div className="flex items-center gap-2 mb-6">
            <Briefcase className="w-4 h-4" />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Showing opportunities matching your skills: {userSkills.join(', ')} and experience level: {getExperienceLevelLabel(userExperienceLevel)}
            </span>
          </div>
          {loading ? (
            <div className="text-center py-8">
              <p className="text-gray-600 dark:text-gray-400">Loading opportunities...</p>
            </div>
          ) : opportunities.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600 dark:text-gray-400">No matching opportunities found based on your experience.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {opportunities.map(renderOpportunityCard)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
