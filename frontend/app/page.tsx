"use client";

import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Building2, GraduationCap, Search, Briefcase } from 'lucide-react';
import Navigation from "@/components/Navigation";
import CardSlider from "./components/CardSlider";
import React, { useEffect, useState } from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { getOpportunities } from "@/lib/api";
import { useRouter } from "next/navigation";

const LottieAnimation = () => {
  return (
    <div className="w-96 h-96 -ml-8">
      <DotLottieReact
        src="https://lottie.host/1965b7c7-78cc-4296-b16d-f8c25852f300/yHvj40eIqe.lottie"
        loop
        autoplay
      />
    </div>
  );
};

const NewLottieAnimation = () => {
  return (
    <div className="absolute left-16 bottom-4 w-40 h-40">
      <DotLottieReact
        src="https://lottie.host/c7d61f7e-6ffd-41b8-97b5-e3b0d81a4c59/3L0H5HFfiM.lottie"
        loop
        autoplay
      />
    </div>
  );
};

export default function Home() {
  const router = useRouter();
  const [featuredOpportunities, setFeaturedOpportunities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOpportunities = async () => {
      try {
        // Fetch active opportunities without requiring authentication
        const opportunities = await getOpportunities({ status: 'active' }, '');
        console.log('All opportunities:', opportunities);
        
        // Add a hardcoded Data Analyst opportunity if it doesn't exist in the API response
        const dataAnalystExists = opportunities.some((opp: any) => 
          opp.title === "Data Analyst" && 
          (opp.company === "TestSoft" || 
           (typeof opp.company === 'object' && opp.company?.name === "TestSoft"))
        );
        
        let modifiedOpportunities = [...opportunities];
        
        if (!dataAnalystExists) {
          // Add hardcoded Data Analyst opportunity
          modifiedOpportunities.push({
            _id: "data-analyst-testsoft",
            title: "Data Analyst",
            company: "TestSoft",
            location: "Kirkuk",
            salary: { min: 3000, max: 5000, currency: "USD" },
            opportunityType: "full-time",
            description: "Analyze user behavior data to support business decisions. Build dashboards, create visual reports, and clean datasets.",
            requirements: ["SQL proficiency", "Data visualization skills", "Statistical analysis"],
            category: "data",
            tags: ["Data Analysis", "SQL", "Dashboards"],
            duration: "Permanent",
            deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            status: "active",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            applicants: [],
            lastUpdatedBy: "system"
          });
        }
        
        // Find opportunities with the specific titles we want
        const title1Opp = modifiedOpportunities.find((opp: any) => 
          opp.title === "Redesign Homepage for Tech Startup Website"
        );
        
        const title2Opp = modifiedOpportunities.find((opp: any) => 
          opp.title === "Develop a Python Script to Automate PDF Invoice Generation"
        );
        
        // Find the specific TestSoft Data Analyst opportunity
        const dataAnalystOpp = modifiedOpportunities.find((opp: any) => 
          opp.title === "Data Analyst" && 
          (opp.company === "TestSoft" || 
           (typeof opp.company === 'object' && opp.company?.name === "TestSoft"))
        );
        
        // Build our featured opportunities array
        const featured = [];
        if (title1Opp) featured.push(title1Opp);
        if (title2Opp) featured.push(title2Opp);
        if (dataAnalystOpp) featured.push(dataAnalystOpp);
        
        // Ensure we have exactly 3 cards
        if (featured.length < 3) {
          // Add any other opportunity that's not already in the featured list
          for (const opp of modifiedOpportunities) {
            if (featured.length >= 3) break;
            if (!featured.some(f => f._id === opp._id)) {
              featured.push(opp);
            }
          }
        }
        
        console.log('Featured opportunities:', featured);
        setFeaturedOpportunities(featured);
      } catch (error) {
        console.error('Error fetching opportunities:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOpportunities();
  }, []);

  const handleOpportunityClick = () => {
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <Navigation />
      
      <main>
        {/* Hero Section with Dynamic Background */}
        <div className="relative min-h-[600px] flex items-center justify-between overflow-hidden bg-gradient-to-br from-gray-100 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-black">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2V6h4V4H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }} />
          </div>

          {/* Hero Content */}
          <div className="relative z-10 container mx-auto flex flex-col items-center justify-center h-full -mt-40 ml-64">
            <h1 className="text-5xl md:text-6xl font-bold mb-1 text-center">
              <span className="inline-block animate-title-slide-up bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-600 dark:from-emerald-400 dark:via-teal-300 dark:to-cyan-400 bg-clip-text text-transparent filter drop-shadow-[0_0_10px_rgba(20,184,166,0.3)] dark:drop-shadow-[0_0_10px_rgba(94,234,212,0.3)] animate-text-glow">
                Kickstart Your Future With Us
              </span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl text-center">
              Showcase your skills, explore and apply for top opportunities, and track your career progress. Post job openings, review candidates, and streamline your hiring process all in one seamless platform.
            </p>
          </div>

          {/* New Lottie Animation on the Left Bottom Corner */}
          <NewLottieAnimation />

          {/* Lottie Animation on the Right */}
          <div className="flex flex-col items-center justify-center space-y-4">
            <LottieAnimation />
          </div>
        </div>

        {/* Further Lifted Company Logos Section */}
        <section className="py-6 bg-gray-50 dark:bg-gray-900">
          <div className="container mx-auto px-6">
            <h2 className="text-3xl font-bold text-center mb-8 bg-gradient-to-r from-blue-500 to-purple-500 dark:from-blue-300 dark:to-purple-400 bg-clip-text text-transparent">Our Supporting Companies</h2>
            <CardSlider />
          </div>
        </section>

        {/* Featured Opportunities Section */}
        <section className="py-20 bg-gray-50 dark:bg-gray-900">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-500 to-purple-500 dark:from-blue-300 dark:to-purple-400 bg-clip-text text-transparent">
                Featured Opportunities
              </h2>
              <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                Discover exciting career opportunities from leading companies. From internships to full-time positions, find your perfect match.
              </p>
            </div>
            
            {loading ? (
              <div className="flex justify-center items-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : (
              <div className="grid md:grid-cols-3 gap-8">
                {featuredOpportunities.map((opportunity, index) => (
                  <div 
                    key={opportunity._id || index} 
                    className="group bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 cursor-pointer"
                    onClick={handleOpportunityClick}
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <Building2 className="w-7 h-7 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-xl mb-2 text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {opportunity.title}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-4 font-medium">
                          {typeof opportunity.company === 'object' ? opportunity.company?.name : opportunity.company}
                        </p>
                        <div className="flex flex-wrap gap-2 mb-6">
                          <span className="px-4 py-1.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-sm font-medium border border-blue-100 dark:border-blue-800">
                            {opportunity.location}
                          </span>
                          {opportunity.salary && (
                            <span className="px-4 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-sm font-medium border border-emerald-100 dark:border-emerald-800">
                              ${opportunity.salary.min}-{opportunity.salary.max} USD
                            </span>
                          )}
                          <span className="px-4 py-1.5 rounded-full bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 text-sm font-medium border border-purple-100 dark:border-purple-800">
                            {opportunity.opportunityType}
                          </span>
                        </div>
                        <div className="flex items-center text-blue-600 dark:text-blue-400 group-hover:translate-x-2 transition-transform duration-300">
                          <span className="font-medium">Learn more</span>
                          <ArrowRight className="w-5 h-5 ml-2" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-20 bg-gray-50 dark:bg-gray-900">
          <div className="container mx-auto px-6">
            <h2 className="text-3xl font-bold text-center mb-4 bg-gradient-to-r from-blue-500 to-purple-500 dark:from-blue-300 dark:to-purple-400 bg-clip-text text-transparent">
              How It Works
            </h2>
            <p className="text-center text-gray-600 dark:text-gray-400 mb-12 max-w-2xl mx-auto">
              Follow these simple steps to kickstart your career journey.
            </p>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 text-emerald-600 dark:text-emerald-400">
                  <GraduationCap className="w-16 h-16" />
                </div>
                <h3 className="font-semibold text-lg mb-2 text-gray-900 dark:text-white">1. Create Your Profile</h3>
                <p className="text-gray-600 dark:text-gray-400">Sign up and showcase your skills and interests.</p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 text-cyan-600 dark:text-cyan-400">
                  <Search className="w-16 h-16" />
                </div>
                <h3 className="font-semibold text-lg mb-2 text-gray-900 dark:text-white">2. Browse Opportunities</h3>
                <p className="text-gray-600 dark:text-gray-400">Explore jobs, internships, and more tailored for you.</p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 text-purple-600 dark:text-purple-400">
                  <Briefcase className="w-16 h-16" />
                </div>
                <h3 className="font-semibold text-lg mb-2 text-gray-900 dark:text-white">3. Apply & Grow</h3>
                <p className="text-gray-600 dark:text-gray-400">Apply in a click and track your progress in one place.</p>
              </div>
            </div>
          </div>
        </section>

        {/* For Companies Section */}
        <section className="py-20 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
          <div className="container mx-auto px-6">
            <h2 className="text-3xl font-bold text-center mb-4 bg-gradient-to-r from-green-500 to-teal-500 dark:from-green-300 dark:to-teal-300 bg-clip-text text-transparent">
              For Companies
            </h2>
            <p className="text-center text-gray-600 dark:text-gray-400 mb-12 max-w-2xl mx-auto">
              Here's how companies can partner with us to find top talent.
            </p>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 text-blue-600 dark:text-blue-400">
                  <Building2 className="w-16 h-16" />
                </div>
                <h3 className="font-semibold text-lg mb-2 text-gray-900 dark:text-white">1. Create a Company Account</h3>
                <p className="text-gray-600 dark:text-gray-400">Sign up to post jobs and internships.</p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 text-purple-600 dark:text-purple-400">
                  <Briefcase className="w-16 h-16" />
                </div>
                <h3 className="font-semibold text-lg mb-2 text-gray-900 dark:text-white">2. Post Opportunities</h3>
                <p className="text-gray-600 dark:text-gray-400">Easily list openings and review applicants.</p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 text-cyan-600 dark:text-cyan-400">
                  <Search className="w-16 h-16" />
                </div>
                <h3 className="font-semibold text-lg mb-2 text-gray-900 dark:text-white">3. Engage Talent</h3>
                <p className="text-gray-600 dark:text-gray-400">Contact and hire the best candidates.</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
          <div className="container mx-auto px-6 text-center">
            <h2 className="text-4xl font-bold mb-6 bg-gradient-to-r from-blue-500 to-purple-500 dark:from-blue-300 dark:to-purple-400 bg-clip-text text-transparent">Ready to Start Your Journey?</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-12 max-w-2xl mx-auto text-lg">
              Join thousands of students who have found their dream internships through CareerHub. Create your profile today and start applying!
            </p>
            <div className="flex justify-center gap-4">
              <Link 
                href="/signup" 
                className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-500 dark:from-blue-300 dark:to-purple-400 text-white dark:text-gray-900 rounded-full font-medium hover:from-blue-400 hover:to-purple-400 dark:hover:from-blue-200 dark:hover:to-purple-300 transition-all duration-300"
              >
                Sign Up Now
              </Link>
              <Link 
                href="/login" 
                className="px-8 py-3 bg-white/90 dark:bg-gray-800/50 backdrop-blur-md text-gray-700 dark:text-gray-300 rounded-full font-medium border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition-all duration-300"
              >
                Log In
              </Link>
            </div>
          </div>
        </section>

        {/* Developed By Section */}
        <section className="py-4 bg-gray-50 dark:bg-gray-900">
          <div className="container mx-auto text-center">
            <div className="text-center text-gray-600 dark:text-gray-400">
              Developed by <span className="font-semibold text-indigo-500 dark:text-indigo-300">Aya</span> & <span className="font-semibold text-indigo-500 dark:text-indigo-300">Aynda</span>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}