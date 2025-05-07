import { MapPin, DollarSign, Briefcase, BookmarkPlus, ArrowUpRight, ExternalLink, NavigationIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface UIOpportunity {
  id: string;
  position: string;
  type: string;
  skills: string[];
  coordinates: { lat: number; lng: number } | null;
  salary: string;
  location: string;
  description: string;
  company?: any;
  requirements?: string[];
}

interface RecommendedOpportunitiesProps {
  opportunities: UIOpportunity[];
  userLocation: { city: string };
}

export default function RecommendedOpportunities({ opportunities, userLocation }: RecommendedOpportunitiesProps) {
  const router = useRouter();

  return (
    <div className="mt-12">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-[#6930c3] dark:text-[#b185db]">
          Recommended Opportunities Near You
        </h2>
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="flex items-center gap-2 border border-[#5e60ce] bg-white dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-300 rounded-lg"
        >
          <ArrowUpRight className="w-4 h-4 rotate-180" /> Back to Dashboard
        </Button>
      </div>
      <div className="rounded-lg shadow mb-6 p-4">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4" />
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Showing opportunities near {userLocation.city}, Kurdistan
          </span>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
        {opportunities.map((opportunity) => (
          <div key={opportunity.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 transition-transform transform hover:scale-105">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-semibold text-[#9d4edd] dark:text-white">
                  {opportunity.position}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">{typeof opportunity.company === 'string' ? opportunity.company : opportunity.company?.name}</p>
              </div>
              <Button variant="outline" size="sm" className="flex items-center gap-1 border border-[#5e60ce] bg-white dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-300 rounded-lg">
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
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">{opportunity.description}</p>
            <div className="flex flex-wrap gap-2">
              <Link href={`/dashboard/student/apply/${opportunity.id}`}>
                <Button size="sm" className="flex items-center gap-1 border border-[#5e60ce] bg-white dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-300 rounded-lg">
                  <ArrowUpRight className="w-4 h-4" /> Apply Now
                </Button>
              </Link>
              <Link href={`/dashboard/student/opportunity/${opportunity.id}`}>
                <Button variant="outline" size="sm" className="flex items-center gap-1 border border-[#5e60ce] bg-white dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-300 rounded-lg">
                  <ExternalLink className="w-4 h-4" /> Learn More
                </Button>
              </Link>
              <Button
                variant="outline"
                size="sm"
                disabled={!opportunity.coordinates}
                onClick={() => {/* TODO: Show map modal for this opportunity */}}
                className="flex items-center gap-1 border border-[#5e60ce] bg-white dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-300 rounded-lg"
              >
                <NavigationIcon className="w-4 h-4" /> View Location
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 