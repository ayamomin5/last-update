"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import Navigation from "@/components/Navigation";
import { Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { updateOpportunity, getOpportunity, deleteOpportunity, Opportunity } from "@/lib/api";

export default function EditPostingPage() {
  const router = useRouter();
  const { id } = useParams() as { id: string };
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location: "",
    category: "software" as 'software' | 'data' | 'design' | 'marketing' | 'business' | 'other',
    opportunityType: "internship" as Opportunity['opportunityType'],
    requirements: "",
    salary: {
      min: "",
      max: "",
      currency: "USD"
    },
    duration: "",
    deadline: "",
    tags: [] as string[]
  });

  useEffect(() => {
    const fetchPosting = async () => {
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

        console.log('Fetching opportunity with ID:', id);
        const posting = await getOpportunity(id, token);
        console.log('Fetched posting data:', posting);
        
        if (!posting) {
          throw new Error('No posting data received');
        }

        // Format the data for the form
        const formattedData = {
          title: posting.title || '',
          description: posting.description || '',
          location: posting.location || '',
          category: posting.category || 'software',
          opportunityType: posting.opportunityType,
          requirements: Array.isArray(posting.requirements) ? posting.requirements.join('\n') : '',
          salary: {
            min: posting.salary?.min?.toString() || '',
            max: posting.salary?.max?.toString() || '',
            currency: posting.salary?.currency || 'USD'
          },
          duration: posting.duration || '',
          deadline: posting.deadline || '',
          tags: posting.tags || []
        };

        console.log('Formatted data:', formattedData);
        setFormData(formattedData);
      } catch (error) {
        console.error('Detailed error:', error);
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to load posting data",
          variant: "destructive"
        });
        router.push('/dashboard/company');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPosting();
  }, [id, router, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast({
          title: "Error",
          description: "Please login to continue",
          variant: "destructive"
        });
        return;
      }

      // Validate deadline
      if (new Date(formData.deadline) <= new Date()) {
        toast({
          title: "Error",
          description: "Deadline must be in the future",
          variant: "destructive"
        });
        setIsSubmitting(false);
        return;
      }

      // Format requirements as array
      const requirements = formData.requirements
        .split('\n')
        .map(req => req.trim())
        .filter(req => req.length > 0);

      // Format salary
      const salary = {
        min: formData.salary.min ? parseInt(formData.salary.min) : undefined,
        max: formData.salary.max ? parseInt(formData.salary.max) : undefined,
        currency: formData.salary.currency
      };

      const opportunityData = {
        ...formData,
        requirements,
        salary,
        status: 'active' as const
      };

      await updateOpportunity(id, opportunityData, token);

      toast({
        title: "Success",
        description: "Opportunity updated successfully!",
      });
      router.push('/dashboard/company');
    } catch (error) {
      console.error('Error updating opportunity:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update opportunity",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this posting? This action cannot be undone.")) {
      setIsDeleting(true);
      
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          toast({
            title: "Error",
            description: "Please login to continue",
            variant: "destructive"
          });
          return;
        }

        await deleteOpportunity(id, token);
        
        toast({
          title: "Success",
          description: "Opportunity deleted successfully!",
        });
        router.push('/dashboard/company');
      } catch (error) {
        console.error('Error deleting opportunity:', error);
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to delete opportunity",
          variant: "destructive"
        });
      } finally {
        setIsDeleting(false);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-3xl mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <div className="animate-pulse">
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
                <div className="space-y-4">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
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
        <div className="max-w-3xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
            <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
              Edit Opportunity Posting
            </h1>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Opportunity Title
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white h-32"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Category
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as 'software' | 'data' | 'design' | 'marketing' | 'business' | 'other' })}
                    required
                  >
                    <option value="software">Software Engineering</option>
                    <option value="data">Data Science</option>
                    <option value="design">Design</option>
                    <option value="marketing">Marketing</option>
                    <option value="business">Business</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Opportunity Type
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  value={formData.opportunityType}
                  onChange={(e) => setFormData({ ...formData, opportunityType: e.target.value as Opportunity['opportunityType'] })}
                  required
                >
                  <option value="internship">Internship</option>
                  <option value="externship">Externship</option>
                  <option value="freelance">Freelance</option>
                  <option value="part-time">Part-time</option>
                  <option value="full-time">Full-time</option>
                  <option value="remote">Remote</option>
                  <option value="contract">Contract</option>
                  <option value="research">Research</option>
                  <option value="apprenticeship">Apprenticeship</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Minimum Salary
                  </label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    value={formData.salary.min}
                    onChange={(e) => setFormData({
                      ...formData,
                      salary: { ...formData.salary, min: e.target.value }
                    })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Maximum Salary
                  </label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    value={formData.salary.max}
                    onChange={(e) => setFormData({
                      ...formData,
                      salary: { ...formData.salary, max: e.target.value }
                    })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Duration
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Application Deadline
                  </label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    value={formData.deadline}
                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Requirements
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white h-32"
                  value={formData.requirements}
                  onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                  required
                />
              </div>

              <div className="flex justify-end items-center space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleDelete}
                  className="bg-red-600 border-red-700 text-white hover:bg-red-700 flex items-center gap-2"
                  disabled={isDeleting}
                >
                  <Trash2 className="w-4 h-4" /> 
                  {isDeleting ? "Deleting..." : "Delete Posting"}
                </Button>
                <Button
                  type="submit"
                  className="bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-400 hover:to-purple-400"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
} 