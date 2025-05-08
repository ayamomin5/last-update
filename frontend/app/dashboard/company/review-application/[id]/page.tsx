"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import Navigation from "@/components/Navigation";
import { ArrowLeft, GraduationCap, Phone, Mail, MapPin, Briefcase, Award, Calendar } from "lucide-react";
import { getApplicationById, updateApplicationStatus } from "@/lib/api";
import React from "react";

interface PageParams {
  id: string;
}

export default function ReviewApplicationPage({ params }: { params: Promise<PageParams> }) {
  const router = useRouter();
  const unwrappedParams = React.use(params);
  const [reviewNotes, setReviewNotes] = useState("");
  const [decision, setDecision] = useState<"accept" | "reject" | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [application, setApplication] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchApplication = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('No token');
        const app = await getApplicationById(unwrappedParams.id, token);
        console.log("Application data:", app);
        setApplication(app);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch application');
      } finally {
        setLoading(false);
      }
    };
    fetchApplication();
  }, [unwrappedParams.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!decision) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No token');
      await updateApplicationStatus(unwrappedParams.id, decision === 'accept' ? 'accepted' : 'rejected', token);
      setSuccess(true);
      setTimeout(() => {
        router.replace("/dashboard/company");
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to update application');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="mb-6 flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>

        <div className="max-w-4xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
            <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
              Review Application
            </h1>
            
            {loading ? (
              <div className="animate-pulse space-y-4">
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
                <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-2"></div>
              </div>
            ) : error ? (
              <div className="text-red-500 mb-4">{error}</div>
            ) : success ? (
              <div className="text-green-600 font-semibold text-center">Application {decision === 'accept' ? 'accepted' : 'rejected'} successfully!</div>
            ) : application ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white border-b pb-2">Candidate Information</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                      <h3 className="font-bold text-lg mb-3 text-gray-900 dark:text-white flex items-center">
                        <Briefcase className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
                        Basic Information
                      </h3>
                      <div className="space-y-3">
                        <div className="flex items-start">
                          <span className="w-24 font-medium text-gray-700 dark:text-gray-300">Name:</span>
                          <span className="text-gray-900 dark:text-white">{application.student?.name || 'N/A'}</span>
                        </div>
                        <div className="flex items-start">
                          <span className="w-24 font-medium text-gray-700 dark:text-gray-300">Email:</span>
                          <span className="text-gray-900 dark:text-white flex items-center">
                            <Mail className="w-4 h-4 mr-1 text-blue-600 dark:text-blue-400" />
                            {application.student?.email || 'N/A'}
                          </span>
                        </div>
                        <div className="flex items-start">
                          <span className="w-24 font-medium text-gray-700 dark:text-gray-300">Phone:</span>
                          <span className="text-gray-900 dark:text-white flex items-center">
                            <Phone className="w-4 h-4 mr-1 text-blue-600 dark:text-blue-400" />
                            {application.student?.phone || 'N/A'}
                          </span>
                        </div>
                        <div className="flex items-start">
                          <span className="w-24 font-medium text-gray-700 dark:text-gray-300">Location:</span>
                          <span className="text-gray-900 dark:text-white flex items-center">
                            <MapPin className="w-4 h-4 mr-1 text-blue-600 dark:text-blue-400" />
                            {application.student?.location || 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                      <h3 className="font-bold text-lg mb-3 text-gray-900 dark:text-white flex items-center">
                        <Award className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
                        Skills & Strengths
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {application.student?.skills && application.student.skills.length > 0 ? (
                          application.student.skills.map((skill: string, index: number) => (
                            <span 
                              key={index} 
                              className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm"
                            >
                              {skill}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-500 dark:text-gray-400">No skills listed</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                      <h3 className="font-bold text-lg mb-3 text-gray-900 dark:text-white flex items-center">
                        <GraduationCap className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
                        Education
                      </h3>
                      {application.student?.education && application.student.education.length > 0 ? (
                        <div className="space-y-4">
                          {application.student.education.map((edu: any, index: number) => (
                            <div key={index} className="border-l-2 border-blue-500 pl-3">
                              <p className="font-medium text-gray-900 dark:text-white">{edu.school || edu.institution}</p>
                              <p className="text-gray-700 dark:text-gray-300">{edu.degree || edu.major}</p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {edu.from && `${edu.from} - ${edu.to || 'Present'}`}
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 dark:text-gray-400">No education history listed</p>
                      )}
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                      <h3 className="font-bold text-lg mb-3 text-gray-900 dark:text-white flex items-center">
                        <Briefcase className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
                        Work Experience
                      </h3>
                      {application.student?.experience && application.student.experience.length > 0 ? (
                        <div className="space-y-4">
                          {application.student.experience.map((exp: any, index: number) => (
                            <div key={index} className="border-l-2 border-blue-500 pl-3">
                              <p className="font-medium text-gray-900 dark:text-white">{exp.position || exp.title}</p>
                              <p className="text-gray-700 dark:text-gray-300">{exp.company || exp.organization}</p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {exp.from && `${exp.from} - ${exp.to || 'Present'}`}
                              </p>
                              {exp.description && (
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{exp.description}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 dark:text-gray-400">No work experience listed</p>
                      )}
                    </div>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg mb-6">
                    <h3 className="font-bold text-lg mb-3 text-gray-900 dark:text-white flex items-center">
                      <Calendar className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
                      Application Details
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-start">
                        <span className="w-32 font-medium text-gray-700 dark:text-gray-300">Position:</span>
                        <span className="text-gray-900 dark:text-white">{application.opportunity?.title || 'N/A'}</span>
                      </div>
                      <div className="flex items-start">
                        <span className="w-32 font-medium text-gray-700 dark:text-gray-300">Applied On:</span>
                        <span className="text-gray-900 dark:text-white">{application.createdAt ? new Date(application.createdAt).toLocaleDateString() : 'N/A'}</span>
                      </div>
                      <div className="flex items-start">
                        <span className="w-32 font-medium text-gray-700 dark:text-gray-300">Status:</span>
                        <span className="text-gray-900 dark:text-white capitalize">{application.status || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                  <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Cover Letter</h2>
                  <p className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap bg-white dark:bg-gray-800 p-4 rounded border border-gray-200 dark:border-gray-700">
                    {application.coverLetter || 'No cover letter provided'}
                  </p>
                </div>

                {application.resume && (
                  <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                    <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Resume</h2>
                    {(() => {
                      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
                      const resumeUrl = application.resume.startsWith('/uploads/')
                        ? backendUrl.replace(/\/api$/, '') + application.resume
                        : application.resume;
                      return (
                        <a 
                          href={resumeUrl} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-blue-600 flex items-center hover:underline"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          View Resume
                        </a>
                      );
                    })()}
                  </div>
                )}

                <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                  <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Review Notes</h2>
                  <Textarea
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    placeholder="Enter your review notes here..."
                    className="min-h-[150px] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <Button
                    type="button"
                    onClick={() => setDecision("accept")}
                    className={`flex-1 ${
                      decision === "accept"
                        ? "bg-green-500 hover:bg-green-600 text-white"
                        : "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600"
                    }`}
                    disabled={isSubmitting}
                  >
                    Accept Application
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setDecision("reject")}
                    className={`flex-1 ${
                      decision === "reject"
                        ? "bg-red-500 hover:bg-red-600 text-white"
                        : "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600"
                    }`}
                    disabled={isSubmitting}
                  >
                    Reject Application
                  </Button>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-400 hover:to-purple-400 py-3"
                  disabled={!decision || isSubmitting}
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Submitting...</span>
                    </div>
                  ) : (
                    "Submit Review"
                  )}
                </Button>
              </form>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
} 