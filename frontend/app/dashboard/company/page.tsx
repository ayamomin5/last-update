"use client";

import { Button } from "@/components/ui/button";
import { MapPin, DollarSign, Clock, Briefcase, Bell } from "lucide-react";
import Navigation from "@/components/Navigation";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Image from "next/image";
import { getCompanyProfile, CompanyProfile, getCompanyOpportunities, Opportunity, getCompanyApplications } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";

export default function CompanyDashboard() {
  const router = useRouter();
  const { toast } = useToast();
  const [selectedApplication, setSelectedApplication] = useState<number | null>(null);
  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [newApplications, setNewApplications] = useState<number>(0);
  
  // Stats state
  const [stats, setStats] = useState({
    activePostings: 0,
    totalApplications: 0,
    interviewsScheduled: 0,
    acceptedApplications: 0,
    rejectedApplications: 0,
  });

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast({
          title: "Error",
          description: "Please login to continue",
          variant: "destructive"
        });
        router.push('/login');
        return;
      }

      const [profileData, { opportunities, stats }] = await Promise.all([
        getCompanyProfile(token),
        getCompanyOpportunities(token)
      ]);
      
      setProfile(profileData);
      setOpportunities(opportunities);
      if (stats) {
        setStats({
          activePostings: stats.activePostings || 0,
          totalApplications: stats.totalApplications || 0,
          interviewsScheduled: stats.interviewsScheduled || 0,
          acceptedApplications: stats.acceptedApplications || 0,
          rejectedApplications: stats.rejectedApplications || 0,
        });
      } else {
        // Fallback if stats not provided
        setStats({
          activePostings: opportunities.filter((opp: any) => opp.status === 'active').length,
          totalApplications: opportunities.reduce((sum: number, opp: any) => sum + (opp.applicants?.length || 0), 0),
          interviewsScheduled: 0,
          acceptedApplications: 0,
          rejectedApplications: 0
        });
      }
    } catch (error) {
      console.error('Error fetching company data:', error);
      toast({
        title: "Error",
        description: "Failed to load company data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch company profile, opportunities, and stats
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          toast({
            title: "Error",
            description: "Please login to continue",
            variant: "destructive"
          });
          router.push('/login');
          return;
        }
  
        const [profileData, { opportunities, stats }] = await Promise.all([
          getCompanyProfile(token),
          getCompanyOpportunities(token)
        ]);
  
        setProfile(profileData);
        setOpportunities(opportunities);
        if (stats) {
          setStats({
            activePostings: stats.activePostings || 0,
            totalApplications: stats.totalApplications || 0,
            interviewsScheduled: stats.interviewsScheduled || 0,
            acceptedApplications: stats.acceptedApplications || 0,
            rejectedApplications: stats.rejectedApplications || 0,
          });
        } else {
          // Fallback if stats not provided
          setStats({
            activePostings: opportunities.filter((opp: any) => opp.status === 'active').length,
            totalApplications: opportunities.reduce((sum: number, opp: any) => sum + (opp.applicants?.length || 0), 0),
            interviewsScheduled: 0,
            acceptedApplications: 0,
            rejectedApplications: 0
          });
        }
      } catch (error) {
        console.error('Error fetching company data:', error);
        toast({
          title: "Error",
          description: "Failed to load company data",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
  
    fetchData();
  }, [router, toast]);
  

  // Refresh data when the page becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchData();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Refresh data every 30 seconds
  useEffect(() => {
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchNewApplications = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const apps = await getCompanyApplications(token);
        // Only count student applications with status 'pending' or 'new'
        const newCount = Array.isArray(apps)
          ? apps.filter((app: any) => app.status === 'pending' || app.status === 'new').length
          : 0;
        setNewApplications(newCount);
      } catch (err) {
        setNewApplications(0);
      }
    };
    fetchNewApplications();
  }, []);

  const handleReviewApplication = (applicationId: number) => {
    setSelectedApplication(applicationId);
    router.push(`/dashboard/company/review-application/${applicationId}`);
  };

  const handleScheduleInterview = (applicationId: number) => {
    router.push(`/dashboard/company/schedule-interviews?applicationId=${applicationId}`);
  };

  const handleEditPosting = (postingId: string) => {
    router.push(`/dashboard/company/edit-posting/${postingId}`);
  };

  const handleViewApplications = (postingId: string) => {
    router.push(`/dashboard/company/view-applications/${postingId}`);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'Closed';
    if (diffDays === 0) return 'Closes today';
    if (diffDays === 1) return 'Closes tomorrow';
    return `Closes in ${diffDays} days`;
  };

  const formatSalary = (salary: { min?: number; max?: number; currency: string }) => {
    if (!salary.min && !salary.max) return 'Not specified';
    const min = salary.min ? `$${salary.min}` : '';
    const max = salary.max ? `$${salary.max}` : '';
    return `${min}${min && max ? '-' : ''}${max} ${salary.currency}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navigation />
        
        <div className="container mx-auto px-4 py-8">
          {/* Welcome Header Skeleton */}
          <div className="mb-8 animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Sidebar Skeleton */}
            <div className="space-y-6">
              {/* Company Profile Skeleton */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="text-center mb-6">
                  <div className="w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto mb-4"></div>
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mx-auto mb-2"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mx-auto mb-2"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mx-auto"></div>
                </div>
                <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>

              {/* Quick Stats Skeleton */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex justify-between items-center">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                      <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Actions Skeleton */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
                <div className="space-y-4">
                  <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
              </div>
            </div>

            {/* Main Content Skeleton */}
            <div className="lg:col-span-2 space-y-6">
              {/* Company Description Skeleton */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/6"></div>
                </div>
              </div>

              {/* Active Opportunities Skeleton */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-6"></div>
                <div className="space-y-6">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="border-b last:border-0 pb-6 last:pb-0">
                      <div className="flex justify-between items-start mb-4">
                        <div className="space-y-2">
                          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                        </div>
                        <div className="space-y-2">
                          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
                        </div>
                      </div>
                      <div className="flex gap-4">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
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
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Welcome back, {profile?.name || 'Company'}!
          </h1>
          <p className="text-gray-700 dark:text-gray-400">Manage your opportunity postings and review applications</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Sidebar - Company Profile */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="text-center mb-6">
                <div className="w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto mb-4 overflow-hidden">
                  {profile?.logo ? (
                    <div className="relative w-full h-full">
                      <Image
                        src={profile.logo}
                        alt="Company Logo"
                        fill
                        sizes="96px"
                        className="object-cover"
                        unoptimized
                        priority
                      />
                    </div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      No Logo
                    </div>
                  )}
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{profile?.name || 'Company Name'}</h2>
                <p className="text-gray-600 dark:text-gray-400">{profile?.industry || 'Industry'}</p>
                <p className="text-sm text-gray-500 dark:text-gray-500">{profile?.location || 'Location'}</p>
                {profile?.description && (
                  <div className="mt-3 text-sm text-gray-600 dark:text-gray-400">
                    <p className="line-clamp-3">{profile.description}</p>
                  </div>
                )}
              </div>
              <div className="space-y-4">
                <Link href="/dashboard/company/edit-profile">
                  <Button className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-400 hover:to-purple-400 dark:from-blue-300 dark:to-purple-400 dark:hover:from-blue-200 dark:hover:to-purple-300">
                    Edit Company Profile
                  </Button>
                </Link>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="font-semibold mb-4 text-gray-900 dark:text-white">Overview</h3>
              <div className="space-y-4">
                <Link href="/dashboard/company/active-postings">
                  <div className="flex justify-between items-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded-lg">
                    <span className="text-gray-600 dark:text-gray-400">Active Postings</span>
                    <span className="text-lg font-semibold">{stats.activePostings}</span>
                  </div>
                </Link>
                <Link href="/dashboard/company/total-applications">
                  <div className="flex justify-between items-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded-lg">
                    <span className="text-gray-600 dark:text-gray-400">Total Applications</span>
                    <span className="text-lg font-semibold">{stats.totalApplications}</span>
                  </div>
                </Link>
                <Link href="/dashboard/company/scheduled-interviews">
                  <div className="flex justify-between items-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded-lg">
                    <span className="text-gray-600 dark:text-gray-400">Pending Interviews</span>
                    <span className="text-lg font-semibold">{stats.interviewsScheduled}</span>
                  </div>
                </Link>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="font-semibold mb-4 text-gray-900 dark:text-white">Quick Actions</h3>
              <div className="space-y-8">
                <Link href="/dashboard/company/post-internship">
                  <Button className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-400 hover:to-purple-400 dark:from-blue-300 dark:to-purple-400 dark:hover:from-blue-200 dark:hover:to-purple-300">
                    Post New Opportunity
                  </Button>
                </Link>
                <Link href="/dashboard/company/schedule-interviews">
                  <Button variant="outline" className="w-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 mt-2">
                    Schedule Interviews
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Company Notifications/Info Section */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${
                    newApplications > 0 
                      ? 'bg-[#9d4edd]/10 dark:bg-[#9d4edd]/20' 
                      : 'bg-[#5e60ce]/10 dark:bg-[#5e60ce]/20'
                  }`}>
                    <Bell className={`w-5 h-5 ${
                      newApplications > 0 
                        ? 'text-[#9d4edd] dark:text-[#b185db]' 
                        : 'text-[#5e60ce] dark:text-[#7b7dff]'
                    }`} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Applications</h3>
                    <p className={`text-sm ${
                      newApplications > 0 
                        ? 'text-[#9d4edd] dark:text-[#b185db]' 
                        : 'text-gray-600 dark:text-gray-400'
                    }`}>
                      {newApplications > 0 
                        ? `${newApplications} new application${newApplications > 1 ? 's' : ''} received`
                        : 'No new applications at the moment'}
                    </p>
                  </div>
                </div>
                <Link href="/dashboard/company/total-applications">
                  <Button 
                    size="sm" 
                    className="bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-400 hover:to-purple-400 dark:from-blue-300 dark:to-purple-400 dark:hover:from-blue-200 dark:hover:to-purple-300"
                  >
                    View All Applications
                  </Button>
                </Link>
              </div>
              {newApplications > 0 && (
                <div className="mt-4 p-4 bg-[#9d4edd]/5 dark:bg-[#9d4edd]/10 rounded-lg border border-[#9d4edd]/20 dark:border-[#9d4edd]/30">
                  <p className="text-sm text-[#9d4edd] dark:text-[#b185db]">
                    You have {newApplications} new application{newApplications > 1 ? 's' : ''} waiting for your review. 
                    Click the button above to view and manage all applications.
                  </p>
                </div>
              )}
            </div>
            {/* Active Opportunities Postings */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Active Opportunities Postings</h2>
                <div className="flex gap-2">
                  <Link href="/dashboard/company/active-postings">
                    <Button 
                      variant="outline" 
                      className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600"
                    >
                      View More
                    </Button>
                  </Link>
                  <Link href="/dashboard/company/post-internship">
                    <Button className="bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-400 hover:to-purple-400 dark:from-blue-300 dark:to-purple-400 dark:hover:from-blue-200 dark:hover:to-purple-300">
                      Post New Opportunity
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="space-y-4">
                {loading ? (
                  <div className="text-center py-4">
                    <p className="text-gray-600 dark:text-gray-400">Loading opportunities...</p>
                  </div>
                ) : opportunities.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-gray-600 dark:text-gray-400">No opportunities posted yet</p>
                    <Link href="/dashboard/company/post-internship">
                      <Button className="mt-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-400 hover:to-purple-400 dark:from-blue-300 dark:to-purple-400 dark:hover:from-blue-200 dark:hover:to-purple-300">
                        Post Your First Opportunity
                      </Button>
                    </Link>
                  </div>
                ) : (
                  opportunities.slice(0, 3).map((opportunity, index) => (
                    <div key={opportunity._id || `opportunity-${index}`} className="border-b last:border-0 pb-6 last:pb-0">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white">{opportunity.title}</h3>
                          <p className="text-gray-600 dark:text-gray-400">
                            Posted {new Date(opportunity.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-green-600">
                            {opportunity.applicants?.length || 0} Applications
                          </p>
                          <p className="text-sm text-gray-600">
                            {formatDate(opportunity.deadline)}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-4 text-sm text-gray-600 dark:text-gray-400 mb-4">
                        <span><MapPin className="w-4 h-4" /> {opportunity.location}</span>
                        <span><DollarSign className="w-4 h-4" /> {formatSalary(opportunity.salary)}</span>
                        <span><Clock className="w-4 h-4" /> {opportunity.duration}</span>
                        <span><Briefcase className="w-4 h-4" /> {opportunity.opportunityType}</span>
                      </div>
                      <div className="flex gap-4">
                        <Button 
                          onClick={() => handleEditPosting(opportunity._id)}
                          variant="outline" 
                          className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600"
                        >
                          Edit Posting
                        </Button>
                        <Button 
                          onClick={() => handleViewApplications(opportunity._id)}
                          variant="outline" 
                          className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600"
                        >
                          View Applications
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}