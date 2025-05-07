"use client";

import { Button } from "@/components/ui/button";
import Navigation from "@/components/Navigation";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { scheduleInterview, getApplicationById, getCompanyApplications } from "@/lib/api";
import { ArrowLeft, Calendar, Clock, Video, MapPin, User, Briefcase, FileText } from "lucide-react";

// Skeleton Loading Components
const ApplicationCardSkeleton = () => (
  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 animate-pulse">
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div className="space-y-3">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-48"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
      </div>
      <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
    </div>
  </div>
);

const FormFieldSkeleton = () => (
  <div className="space-y-2">
    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
    <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
  </div>
);

export default function ScheduleInterviews() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const applicationId = typeof window !== 'undefined' && searchParams ? searchParams.get("applicationId") : null;
  const [formData, setFormData] = useState({
    candidateName: "",
    position: "",
    interviewDate: "",
    interviewTime: "",
    interviewType: "virtual",
    meetingLink: "",
    notes: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [applications, setApplications] = useState<any[]>([]);
  const [appListLoading, setAppListLoading] = useState(false);

  useEffect(() => {
    if (!applicationId) {
      setAppListLoading(true);
      const fetchApps = async () => {
        try {
          const token = localStorage.getItem('token');
          if (!token) return;
          const apps = await getCompanyApplications(token);
          setApplications(apps.filter((a: any) => a.status === 'under_review'));
        } finally {
          setAppListLoading(false);
        }
      };
      fetchApps();
    }
  }, [applicationId]);

  useEffect(() => {
    const fetchApplication = async () => {
      if (!applicationId) return;
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const app = await getApplicationById(applicationId, token);
        if (app) {
          setFormData(prev => ({
            ...prev,
            candidateName: app.student?.name || prev.candidateName,
            position: app.opportunity?.title || prev.position,
            interviewDate: app.interview?.date || "",
            interviewTime: app.interview?.time || "",
            interviewType: app.interview?.type || "virtual",
            meetingLink: app.interview?.link || "",
            notes: app.interview?.notes || "",
          }));
        }
      } finally {
        setInitialized(true);
      }
    };
    if (!initialized && applicationId) fetchApplication();
  }, [applicationId, initialized]);

  useEffect(() => {
    setInitialized(false);
  }, [applicationId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (!applicationId) throw new Error("No application ID");
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No token");
      await scheduleInterview(
        applicationId,
        {
          date: formData.interviewDate,
          time: formData.interviewTime,
          type: formData.interviewType,
          link: formData.meetingLink,
          notes: formData.notes,
        },
        token
      );
      setSuccess(true);
      setTimeout(() => router.push("/dashboard/company/total-applications"), 2000);
    } catch (err: any) {
      setError(err.message || "Failed to schedule interview");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  if (!applicationId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#f8f9fa] to-[#e9ecef] dark:from-gray-900 dark:to-gray-800">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-4 mb-8">
              <Button
                variant="ghost"
                onClick={() => router.back()}
                className="flex items-center gap-2 text-[#6930c3] dark:text-[#b185db] hover:text-[#5e60ce] dark:hover:text-[#9d4edd] transition-colors duration-200 text-lg"
              >
                <ArrowLeft className="w-6 h-6" />
                Back
              </Button>
              <h1 className="text-3xl font-bold text-[#6930c3] dark:text-[#b185db]">
                Schedule Interview for Applications Under Review
              </h1>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-8 text-lg">
              Below are students whose applications are under review. Select one to schedule an interview.
            </p>
            {appListLoading ? (
              <div className="grid gap-6">
                {[1, 2, 3].map((i) => (
                  <ApplicationCardSkeleton key={i} />
                ))}
              </div>
            ) : applications.length === 0 ? (
              <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
                <div className="text-[#6930c3] dark:text-[#b185db] mb-4">
                  <Calendar className="w-16 h-16 mx-auto" />
                </div>
                <h3 className="text-xl font-semibold text-[#6930c3] dark:text-[#b185db] mb-2">
                  No Applications Under Review
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  There are no applications under review available for interview scheduling at the moment.
                </p>
              </div>
            ) : (
              <div className="grid gap-6">
                {applications.map((app) => (
                  <div 
                    key={app.id} 
                    className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 transform transition-all duration-300 hover:scale-[1.02] hover:shadow-xl"
                  >
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <User className="w-5 h-5 text-[#6930c3] dark:text-[#b185db]" />
                          <h3 className="text-xl font-semibold text-[#6930c3] dark:text-[#b185db]">
                            {app.student?.name || 'Unknown Student'}
                          </h3>
                        </div>
                        <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                          <Briefcase className="w-4 h-4" />
                          <span>{app.opportunity?.title || ''}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-500">
                          <Calendar className="w-4 h-4" />
                          <span>Applied: {app.createdAt ? new Date(app.createdAt).toLocaleDateString() : 'N/A'}</span>
                        </div>
                      </div>
                      <Button
                        onClick={() => router.push(`/dashboard/company/schedule-interviews?applicationId=${app.id}`)}
                        className="bg-[#6930c3] hover:bg-[#5e60ce] dark:bg-[#b185db] dark:hover:bg-[#9d4edd] text-white px-8 py-3 rounded-lg font-semibold transform transition-all duration-300 hover:scale-105"
                      >
                        Schedule Interview
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8f9fa] to-[#e9ecef] dark:from-gray-900 dark:to-gray-800">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="flex items-center gap-2 text-[#6930c3] dark:text-[#b185db] hover:text-[#5e60ce] dark:hover:text-[#9d4edd] transition-colors duration-200 text-lg"
            >
              <ArrowLeft className="w-6 h-6" />
              Back
            </Button>
            <h1 className="text-3xl font-bold text-[#6930c3] dark:text-[#b185db]">
              Schedule Interview
            </h1>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-lg border border-red-200 dark:border-red-800">
                {error}
              </div>
            )}
            {success && (
              <div className="bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 p-4 rounded-lg border border-green-200 dark:border-green-800">
                Interview scheduled and student notified!
              </div>
            )}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 transform transition-all duration-300">
              {loading ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormFieldSkeleton />
                    <FormFieldSkeleton />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormFieldSkeleton />
                    <FormFieldSkeleton />
                  </div>
                  <FormFieldSkeleton />
                  <FormFieldSkeleton />
                  <FormFieldSkeleton />
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm font-medium text-[#6930c3] dark:text-[#b185db]">
                        <User className="w-4 h-4" />
                        Candidate Name
                      </label>
                      <input
                        type="text"
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#6930c3] dark:focus:ring-[#b185db] focus:border-transparent transition-all duration-200"
                        value={formData.candidateName}
                        onChange={(e) => setFormData({ ...formData, candidateName: e.target.value })}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm font-medium text-[#6930c3] dark:text-[#b185db]">
                        <Briefcase className="w-4 h-4" />
                        Position
                      </label>
                      <input
                        type="text"
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#6930c3] dark:focus:ring-[#b185db] focus:border-transparent transition-all duration-200"
                        value={formData.position}
                        onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm font-medium text-[#6930c3] dark:text-[#b185db]">
                        <Calendar className="w-4 h-4" />
                        Interview Date
                      </label>
                      <input
                        type="date"
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#6930c3] dark:focus:ring-[#b185db] focus:border-transparent transition-all duration-200"
                        value={formData.interviewDate}
                        onChange={(e) => setFormData({ ...formData, interviewDate: e.target.value })}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm font-medium text-[#6930c3] dark:text-[#b185db]">
                        <Clock className="w-4 h-4" />
                        Interview Time
                      </label>
                      <input
                        type="time"
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#6930c3] dark:focus:ring-[#b185db] focus:border-transparent transition-all duration-200"
                        value={formData.interviewTime}
                        onChange={(e) => setFormData({ ...formData, interviewTime: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-[#6930c3] dark:text-[#b185db]">
                      {formData.interviewType === "virtual" ? <Video className="w-4 h-4" /> : <MapPin className="w-4 h-4" />}
                      Interview Type
                    </label>
                    <select
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#6930c3] dark:focus:ring-[#b185db] focus:border-transparent transition-all duration-200"
                      value={formData.interviewType}
                      onChange={(e) => setFormData({ ...formData, interviewType: e.target.value })}
                      required
                    >
                      <option value="virtual">Virtual</option>
                      <option value="in-person">In-Person</option>
                    </select>
                  </div>

                  {formData.interviewType === "virtual" && (
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm font-medium text-[#6930c3] dark:text-[#b185db]">
                        <Video className="w-4 h-4" />
                        Meeting Link
                      </label>
                      <input
                        type="text"
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#6930c3] dark:focus:ring-[#b185db] focus:border-transparent transition-all duration-200"
                        value={formData.meetingLink}
                        onChange={(e) => setFormData({ ...formData, meetingLink: e.target.value })}
                        required
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-[#6930c3] dark:text-[#b185db]">
                      <FileText className="w-4 h-4" />
                      Additional Notes
                    </label>
                    <textarea
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#6930c3] dark:focus:ring-[#b185db] focus:border-transparent transition-all duration-200 h-32 resize-none"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Add any additional information or instructions for the candidate..."
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                className="px-6 py-3 border-2 border-[#6930c3] dark:border-[#b185db] text-[#6930c3] dark:text-[#b185db] hover:bg-[#6930c3] hover:text-white dark:hover:bg-[#b185db] dark:hover:text-white transition-all duration-200"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="px-8 py-3 bg-[#6930c3] hover:bg-[#5e60ce] dark:bg-[#b185db] dark:hover:bg-[#9d4edd] text-white transform transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Scheduling...
                  </div>
                ) : (
                  'Schedule Interview'
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 