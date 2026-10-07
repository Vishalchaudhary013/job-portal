import React, { useMemo, useState } from 'react'
import { useLocation } from "react-router-dom";
import SectionTitle from '../../../components/common/SectionTitle'
import FilterChips from '../../../components/common/FilterChips'
import { Link } from 'react-router-dom'
import { FaLongArrowAltRight } from 'react-icons/fa'
import { Banknote, ClipboardCheck, TrendingUp, Gift } from 'lucide-react'
import { useOpportunities } from "../../../context/OpportunitiesContext";
import CommonCard from "../../../components/cards/CommonCard";
import { isJobOpen } from "../../job/utils/jobCardData";

const Jobs = ({ limit = 4 }) => {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const locationFilter = searchParams.get("location");

  const categories = [
    { name: "Full-Time CTC", icon: <Banknote size={16} /> },
    { name: "Comprehensive Onboarding", icon: <ClipboardCheck size={16} /> },
    { name: "Annual Performance Bonuses", icon: <TrendingUp size={16} /> },
    { name: "Corporate Benefits", icon: <Gift size={16} /> },
  ];

  const { opportunities } = useOpportunities();

  const jobData = useMemo(() => {
    return opportunities
      .filter((item) => item.type === "Jobs" && isJobOpen(item))
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }, [opportunities]);

  const visibleJobs = useMemo(() => {
    let data = jobData;
    if (selectedCategory) {
      const query = selectedCategory.toLowerCase();
      data = data.filter(
        (item) =>
          (item.industry && item.industry.toLowerCase().includes(query)) ||
          (item.functionalRole &&
            item.functionalRole.toLowerCase().includes(query)) ||
          (item.title && item.title.toLowerCase().includes(query)),
      );
    }
    if (locationFilter) {
      const normalizedLocationFilter = locationFilter.trim().toLowerCase();
      data = data.filter((item) => {
        const loc = String(item.location || "").toLowerCase();
        return loc.includes(normalizedLocationFilter);
      });
    }
    return typeof limit === "number" ? data.slice(0, limit) : data;
  }, [jobData, selectedCategory, limit, locationFilter]);

  return (
    <>
      <div className="bg-">
        <div className="w-full max-w-[1250px] px-4 md:px-6 mx-auto py-14">
          <div className="mb-5">
            <SectionTitle 
              title="Entry-Level Jobs" 
              subtitle="Kickstart Your Professional Career with Roles Built for Freshers"  
              defination="Full-time corporate openings designed specifically for recent graduates. These positions expect limited professional experience and prioritize potential, adaptability, and fundamental skill sets." 
              viewAllLink="/jobs"
            />
          </div>
          <FilterChips 
            categories={categories} 
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
          />
          <div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto scrollbar-hide px-4 pb-1 mt-8 sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-5 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-3 xl:grid-cols-4">
            {
              visibleJobs.map((item) => (
                <div key={item.id} className="w-[78vw] max-w-[320px] shrink-0 snap-start sm:w-auto sm:max-w-none">
                  <CommonCard item={item} />
                </div>
              ))
            }
          </div>
        </div>
      </div>
    </>
  )
}

export default Jobs
