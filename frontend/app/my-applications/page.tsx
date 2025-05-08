"use client";

import React, { useState, useEffect } from 'react';
import Navigation from "@/components/Navigation";
import { CheckCircle, XCircle, Calendar, Briefcase, ArrowLeft, X, Clock, Monitor, ExternalLink } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { updateApplicationStatus } from '@/lib/api';

interface Application {
  _id?: string;
  id: string;
  status: string;
  opportunity?: {
    title: string;
    company?: {
      name: string;
    };
  };
  createdAt: string;
  coverLetter?: string;
  resume?: string;
  interview?: {
    date: string;
    time: string;
    type: string;
    link?: string;
    notes?: string;
  };
}

const MyApplications = () => {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState('under_review');
  const [detailsVisible, setDetailsVisible] = useState<number | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unapplyLoading, setUnapplyLoading] = useState<string | null>(null);

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('No token');
        
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/applications/student`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch applications');
        }

        const data = await response.json();
        console.log('Applications data:', data);
        setApplications(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, []);

  const categories = ['under_review', 'interview', 'accepted', 'rejected'];

  // Function to get a user-friendly display name for each status
  const getStatusDisplayName = (status: string) => {
    switch (status) {
      case 'pending': return 'Applied';
      case 'under_review': return 'Under Review';
      case 'reviewing': return 'Under Review';
      case 'interview': return 'Interview Scheduled';
      case 'accepted': return 'Accepted';
      case 'rejected': return 'Not Accepted';
      default: return status;
    }
  };

  const filteredApplications = applications.filter(app => {
    if (selectedCategory === 'under_review') {
      return app.status === 'under_review' || app.status === 'reviewing';
    }
    return app.status === selectedCategory;
  });

  const toggleDetails = (index: number) => {
    setDetailsVisible(detailsVisible === index ? null : index);
  };

  const handleUnapply = async (applicationId: string) => {
    try {
      // Validate the application ID
      if (!applicationId) {
        console.error('Invalid application ID:', applicationId);
        setError('Cannot withdraw application: Invalid application ID');
        return;
      }
      
      setUnapplyLoading(applicationId);
      setError(null);
      
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No token');
      
      console.log(`Attempting to withdraw application: ${applicationId}`);
      
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      console.log(`API URL: ${apiUrl}`);
      
      // Delete the application
      const deleteResponse = await fetch(`${apiUrl}/applications/${applicationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log(`Delete response status: ${deleteResponse.status}`);
      
      if (!deleteResponse.ok) {
        const errorText = await deleteResponse.text();
        console.error('Error response text:', errorText);
        
        let errorMessage = 'Failed to withdraw application';
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.msg || errorMessage;
        } catch (e) {
          console.error('Error parsing error response:', e);
          errorMessage = deleteResponse.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }
      
      // Success - remove from the list
      setApplications(prevApplications => 
        prevApplications.filter(app => {
          const appId = app.id || app._id;
          return appId !== applicationId;
        })
      );
      
    } catch (err: any) {
      console.error('Error in handleUnapply:', err);
      setError(err.message || 'An unknown error occurred');
    } finally {
      setUnapplyLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-r from-gray-100 to-gray-300 dark:from-gray-900 dark:to-gray-700">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-r from-gray-100 to-gray-300 dark:from-gray-900 dark:to-gray-700">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="text-red-500 text-center">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-r from-gray-100 to-gray-300 dark:from-gray-900 dark:to-gray-700">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8 flex">
        {/* Sidebar */}
        <aside className="w-1/4 pr-4">
          <h2 className="text-2xl font-semibold mb-4 text-[#6930c3] dark:text-[#b185db]">Categories</h2>
          <ul>
            {categories.map(category => (
              <li key={category} className="mb-2">
                <button
                  onClick={() => setSelectedCategory(category)}
                  className={`w-full text-left px-4 py-2 rounded-lg shadow-md ${selectedCategory === category ? 'bg-gray-600 text-white' : 'bg-transparent dark:bg-gray-800 text-gray-700 dark:text-gray-300'} 
                  hover:bg-gray-600 hover:dark:bg-gray-700 hover:text-white transition-all duration-300`}
                >
                  {getStatusDisplayName(category)}
                </button>
              </li>
            ))}
          </ul>
        </aside>

        {/* Main Content Container */}
        <section className="w-3/4 ml-2">
          <button
            onClick={() => router.back()}
            className="flex items-center text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 transition-colors duration-300 mb-4"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back
          </button>
          <h1 className="text-4xl font-extrabold mb-6 text-center text-[#6930c3] dark:text-[#b185db]">My Applications</h1>
          
          {/* Cards Container */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            {applications.length === 0 ? (
              <div className="text-center text-gray-600 dark:text-gray-400 py-8">
                No applications found. Start applying to opportunities!
              </div>
            ) : filteredApplications.length === 0 ? (
              <div className="text-center text-gray-600 dark:text-gray-400 py-8">
                No applications found in the "{getStatusDisplayName(selectedCategory)}" category.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredApplications.map((application, index) => (
                  <div key={application._id || `app-${index}`} className="bg-white dark:bg-gray-800 border border-blue-300 rounded-lg p-6 shadow-lg hover:shadow-xl transition-shadow duration-300 transform hover:-translate-y-1">
                    <div className="flex items-center mb-4">
                      {application.status === "pending" && <Briefcase className="w-6 h-6 text-blue-500 mr-2" />}
                      {(application.status === "reviewing" || application.status === "under_review") && <Briefcase className="w-6 h-6 text-yellow-500 mr-2" />}
                      {application.status === "interview" && <Calendar className="w-6 h-6 text-yellow-500 mr-2" />}
                      {application.status === "accepted" && <CheckCircle className="w-6 h-6 text-green-500 mr-2" />}
                      {application.status === "rejected" && <XCircle className="w-6 h-6 text-red-500 mr-2" />}
                      {application.status === "withdrawn" && <XCircle className="w-6 h-6 text-gray-500 mr-2" />}
                      <h3 className="font-bold text-lg text-gray-900 dark:text-white">{application.opportunity?.title || 'Position'}</h3>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">{getStatusDisplayName(application.status)}</p>
                    <button 
                      onClick={() => toggleDetails(index)} 
                      className="bg-gray-100/50 dark:bg-gray-800/50 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 px-4 py-2 rounded-lg hover:bg-gray-200/50 dark:hover:bg-gray-700/50 transition-all duration-300"
                    >
                      {detailsVisible === index ? 'Hide Details' : 'View Details'}
                    </button>
                    
                    {application.status === 'pending' && (
                      <button 
                        onClick={() => {
                          const appId = application.id || application._id;
                          if (appId) handleUnapply(appId);
                        }}
                        disabled={unapplyLoading === (application.id || application._id)}
                        className="ml-2 text-red-500 dark:text-red-400 rounded-full p-1 hover:bg-red-100 dark:hover:bg-red-900/20 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label="Unapply"
                        title="Withdraw application"
                      >
                        {unapplyLoading === (application.id || application._id) ? 
                          <span className="animate-pulse">...</span> : 
                          <X className="w-5 h-5" />
                        }
                      </button>
                    )}
                    
                    {detailsVisible === index && (
                      <div className="mt-4 p-4 border-t border-gray-300">
                        <p className="text-gray-700 dark:text-gray-300">Company: {application.opportunity?.company?.name || 'N/A'}</p>
                        <p className="text-gray-700 dark:text-gray-300">Applied Date: {new Date(application.createdAt).toLocaleDateString()}</p>
                        {application.status === 'interview' && application.interview && (
                          <div className="mt-4 space-y-2">
                            <p className="text-gray-700 dark:text-gray-300 font-semibold">Interview Details:</p>
                            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                              <Calendar className="w-4 h-4" />
                              <span>Date: {new Date(application.interview.date).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                              <Clock className="w-4 h-4" />
                              <span>Time: {application.interview.time}</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                              <Monitor className="w-4 h-4" />
                              <span>Type: {application.interview.type === 'in-person' ? 'In-Person' : 'Virtual'}</span>
                            </div>
                            {application.interview.link && (
                              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                <ExternalLink className="w-4 h-4" />
                                <a 
                                  href={application.interview.link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
                                >
                                  Meeting Link
                                </a>
                              </div>
                            )}
                            {application.interview.notes && (
                              <div className="mt-2">
                                <p className="text-gray-700 dark:text-gray-300 font-semibold">Additional Notes:</p>
                                <p className="text-gray-600 dark:text-gray-400 mt-1">{application.interview.notes}</p>
                              </div>
                            )}
                          </div>
                        )}
                        {application.coverLetter && (
                          <div className="mt-2">
                            <p className="text-gray-700 dark:text-gray-300 font-semibold">Cover Letter:</p>
                            <p className="text-gray-600 dark:text-gray-400 mt-1">{application.coverLetter}</p>
                          </div>
                        )}
                        {application.resume && (
                          <div className="mt-2">
                            <p className="text-gray-700 dark:text-gray-300 font-semibold">Resume:</p>
                            <a 
                              href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}${application.resume}`}
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
                            >
                              View Resume
                            </a>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

export default MyApplications;