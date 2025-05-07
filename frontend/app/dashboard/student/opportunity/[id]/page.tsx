"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { 
  MapPin, 
  DollarSign, 
  Briefcase,
  Building2,
  ExternalLink,
  ArrowLeft,
  BookmarkPlus,
  Navigation as NavigationIcon,
} from "lucide-react";
import Link from "next/link";

interface Opportunity {
  id: number;
  position: string;
  company: string;
  location: string;
  coordinates: { lat: number; lng: number };
  salary: string;
  type: string;
  description: string;
  distance: string;
}

export default function OpportunityDetails() {
  const router = useRouter();
  const { id } = useParams() as { id: string };
  const [opportunity, setOpportunity] = useState<Opportunity | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real application, you would fetch this data from your API
    const mockOpportunities = [
      {
        id: 1,
        position: "Software Engineering Intern",
        company: "Tech Solutions Kurdistan",
        location: "Erbil, Kurdistan",
        coordinates: { lat: 36.1901, lng: 44.0091 },
        salary: "$25/hr",
        type: "Full-time",
        description: "Looking for a passionate developer with experience in modern web technologies. The ideal candidate will work on developing and maintaining web applications using React, Node.js, and other modern frameworks. This is a great opportunity to gain hands-on experience in a fast-paced environment.",
        distance: "2 miles away"
      },
      // Add more mock opportunities as needed
    ];

    const foundOpportunity = mockOpportunities.find(opp => opp.id === parseInt(id));
    setOpportunity(foundOpportunity || null);
    setLoading(false);
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#6930c3]"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!opportunity) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-[#6930c3] dark:text-[#b185db] mb-4">
              Opportunity Not Found
            </h2>
            <Button
              onClick={() => router.back()}
              className="flex items-center gap-2 border border-[#5e60ce] bg-white dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-300 rounded-lg"
            >
              <ArrowLeft className="w-4 h-4" /> Go Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <Button
              onClick={() => router.back()}
              variant="outline"
              size="sm"
              className="flex items-center gap-2 border border-[#5e60ce] bg-white dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-300 rounded-lg"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2 border border-[#5e60ce] bg-white dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-300 rounded-lg"
            >
              <BookmarkPlus className="w-4 h-4" /> Save
            </Button>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-[#6930c3] dark:text-[#b185db] mb-2">
                {opportunity.position}
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-400">
                {opportunity.company}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <MapPin className="w-5 h-5" />
                  <span>{opportunity.location}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <DollarSign className="w-5 h-5" />
                  <span>{opportunity.salary}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <Briefcase className="w-5 h-5" />
                  <span>{opportunity.type}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <Building2 className="w-5 h-5" />
                  <span>{opportunity.distance}</span>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-[#6930c3] dark:text-[#b185db] mb-2">
                  About the Company
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {opportunity.company} is a leading technology company in Kurdistan, dedicated to providing innovative solutions and creating opportunities for talented individuals.
                </p>
              </div>
            </div>

            <div className="mb-8">
              <h3 className="text-xl font-semibold text-[#6930c3] dark:text-[#b185db] mb-4">
                Job Description
              </h3>
              <p className="text-gray-600 dark:text-gray-400 whitespace-pre-line">
                {opportunity.description}
              </p>
            </div>

            <div className="flex flex-wrap gap-4">
              <Link href={`/dashboard/student/apply/${opportunity.id}`}>
                <Button
                  className="flex items-center gap-2 border border-[#5e60ce] bg-white dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-300 rounded-lg"
                >
                  Apply Now
                </Button>
              </Link>
              <Button
                variant="outline"
                onClick={() => {
                  // In a real application, you would open a map or show directions
                  window.open(`https://www.google.com/maps?q=${opportunity.coordinates.lat},${opportunity.coordinates.lng}`, '_blank');
                }}
                className="flex items-center gap-2 border border-[#5e60ce] bg-white dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-300 rounded-lg"
              >
                <NavigationIcon className="w-4 h-4" /> View Location
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  // In a real application, you would open the company website
                  window.open('https://example.com', '_blank');
                }}
                className="flex items-center gap-2 border border-[#5e60ce] bg-white dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-300 rounded-lg"
              >
                <ExternalLink className="w-4 h-4" /> Company Website
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}