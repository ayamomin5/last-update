"use client";

import { Button } from "@/components/ui/button";
import Navigation from "@/components/Navigation";
import { ArrowLeft, MapPin, DollarSign, Briefcase } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState, useEffect } from "react";
import { getCompanyOpportunities, Opportunity } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";

export default function ActivePostingsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);

  useEffect(() => {
    const fetchOpportunities = async () => {
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

        const opportunitiesData = await getCompanyOpportunities(token, "active");
        setOpportunities(opportunitiesData.opportunities);
        
      } catch (error) {
        console.error('Error fetching opportunities:', error);
        toast({
          title: "Error",
          description: "Failed to load opportunities",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchOpportunities();
  }, [router, toast]);

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

  // Helper to check if opportunity is expired
  const isExpired = (deadline: string) => {
    const now = new Date();
    return new Date(deadline) < now;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="outline"
              size="icon"
              onClick={() => router.back()}
              className="bg-white dark:bg-gray-800"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Active Postings</h1>
          </div>

          {loading ? (
            <div className="text-center py-4">
              <p className="text-gray-600 dark:text-gray-400">Loading opportunities...</p>
            </div>
          ) : opportunities.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-gray-600 dark:text-gray-400">No active opportunities found</p>
              <Link href="/dashboard/company/post-internship">
                <Button className="mt-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-400 hover:to-purple-400 dark:from-blue-300 dark:to-purple-400 dark:hover:from-blue-200 dark:hover:to-purple-300">
                  Post New Opportunity
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid gap-6">
              {opportunities.map((posting) => (
                <div key={posting._id} className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 transition-transform transform hover:scale-105 hover:shadow-xl">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h2 className="font-semibold text-[#9d4edd] dark:text-white text-xl">{posting.title}</h2>
                      <p className="text-gray-600 dark:text-gray-400">Posted {new Date(posting.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${isExpired(posting.deadline) ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}> 
                        {isExpired(posting.deadline) ? 'Expired' : 'Active'}
                      </span>
                      <p className="text-sm text-green-600 mt-2">{posting.applicants?.length || 0} Applications</p>
                      <p className="text-sm text-gray-600">{formatDate(posting.deadline)}</p>
                    </div>
                  </div>

                  <div className="space-y-3 mb-4">
                    <div className="flex gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <MapPin className="w-4 h-4" />
                      <span>{posting.location}</span>
                    </div>
                    <div className="flex gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <DollarSign className="w-4 h-4" />
                      <span>{formatSalary(posting.salary)}</span>
                      <span>•</span>
                      <Briefcase className="w-4 h-4" />
                      <span>{posting.opportunityType}</span>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <Link href={`/dashboard/company/edit-posting/${posting._id}`}>
                      <Button 
                        variant="outline" 
                        className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600"
                      >
                        Edit Posting
                      </Button>
                    </Link>
                    <Link href={`/dashboard/company/view-applications/${posting._id}`}>
                      <Button 
                        variant="outline" 
                        className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600"
                      >
                        View Applications
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 