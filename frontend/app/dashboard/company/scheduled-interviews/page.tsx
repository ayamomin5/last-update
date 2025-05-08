"use client";

import { Button } from "@/components/ui/button";
import Navigation from "@/components/Navigation";
import { ArrowLeft, Calendar, Clock, Monitor, ExternalLink, MapPin, Check, X, FileText } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState, useEffect } from "react";
import { getCompanyApplications, updateApplicationStatus } from "@/lib/api";

export default function ScheduledInterviewsPage() {
  const router = useRouter();
  const [interviews, setInterviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInterviews = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('No token');
        const apps = await getCompanyApplications(token);
        // Filter for applications with a scheduled interview that are not accepted or rejected
        const scheduled = apps.filter(
          (app: any) => 
            app.interview && 
            app.interview.date && 
            app.status !== 'accepted' && 
            app.status !== 'rejected'
        );
        setInterviews(scheduled);
      } catch (err) {
        setInterviews([]);
      } finally {
        setLoading(false);
      }
    };
    fetchInterviews();
  }, []);

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No token');
      
      await updateApplicationStatus(id, status, token);
      
      // Refresh interview list
      const apps = await getCompanyApplications(token);
      const scheduled = apps.filter(
        (app: any) => 
          app.interview && 
          app.interview.date && 
          app.status !== 'accepted' && 
          app.status !== 'rejected'
      );
      setInterviews(scheduled);
    } catch (error) {
      console.error("Error updating application status:", error);
    }
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
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Pending Interviews</h1>
          </div>

          {loading ? (
            <div className="text-center py-4 text-gray-600 dark:text-gray-400">Loading interviews...</div>
          ) : interviews.length === 0 ? (
            <div className="text-center py-4 text-gray-600 dark:text-gray-400">No scheduled interviews found.</div>
          ) : (
            <div className="grid gap-6">
              {interviews.map((interview) => (
                <div key={interview.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 transition-transform transform hover:scale-105 hover:shadow-xl">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{interview.student?.name || 'Unknown Student'}</h2>
                      <p className="text-gray-600 dark:text-gray-400">{interview.opportunity?.title || ''}</p>
                    </div>
                    <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                      Scheduled
                    </span>
                  </div>
                  <div className="space-y-3 mb-4">
                    <div className="flex gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(interview.interview.date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Clock className="w-4 h-4" />
                      <span>{interview.interview.time}</span>
                      <span>•</span>
                      <Monitor className="w-4 h-4" />
                      <span>{interview.interview.type === 'in-person' ? 'In-Person' : 'Virtual'}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-4">
                    <Button
                      variant="outline"
                      className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600"
                      onClick={() => router.push(`/dashboard/company/review-application/${interview.id}`)}
                    >
                      <FileText className="w-4 h-4 mr-2" /> Review Application
                    </Button>
                    <Button
                      variant="outline"
                      className="bg-green-100 text-green-800 hover:bg-green-200 border-green-300"
                      onClick={() => handleUpdateStatus(interview.id, 'accepted')}
                    >
                      <Check className="w-4 h-4 mr-2" /> Accept
                    </Button>
                    <Button
                      variant="outline"
                      className="bg-red-100 text-red-800 hover:bg-red-200 border-red-300"
                      onClick={() => handleUpdateStatus(interview.id, 'rejected')}
                    >
                      <X className="w-4 h-4 mr-2" /> Reject
                    </Button>
                    <Button
                      variant="outline"
                      className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600"
                      onClick={() => router.push(`/dashboard/company/schedule-interviews?applicationId=${interview.id}`)}
                    >
                      Reschedule
                    </Button>
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