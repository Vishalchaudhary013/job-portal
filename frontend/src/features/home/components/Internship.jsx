import React, { useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { useOpportunities } from "../../../context/OpportunitiesContext";
import CommonCard from "../../../components/cards/CommonCard";
import { isInternshipOpen } from "../../internship/utils/internshipCardData";
import { isApprenticeshipOpen } from "../../apprenticeship/utils/apprenticeshipCardData";
import SectionTitle from "../../../components/common/SectionTitle";
import FilterChips from "../../../components/common/FilterChips";
import {
  Coins,
  Wallet,
  Clock,
  ShieldCheck,
  Briefcase,
} from "lucide-react";

const Internship = ({ limit }) => {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const locationFilter = searchParams.get("location");

  const categories = [
    { name: "Paid", icon: <Coins size={16} /> },
    { name: "Stipended", icon: <Wallet size={16} /> },
    { name: "Flexible Hours", icon: <Clock size={16} /> },
    { name: "Govt. Certified", icon: <ShieldCheck size={16} /> },
    { name: "Long-Term Employment", icon: <Briefcase size={16} /> },
  ];

  const { opportunities } = useOpportunities();

  const combinedData = useMemo(() => {
    return opportunities
      .filter(
        (item) =>
          (item.type === "Internship" && isInternshipOpen(item)) ||
          (item.type === "Apprenticeships" && isApprenticeshipOpen(item)),
      )
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }, [opportunities]);

  const visibleItems = useMemo(() => {
    let data = combinedData;
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
  }, [combinedData, selectedCategory, limit, locationFilter]);

  return (
    <div className="bg-[#EEF2FF]">
      <div className="w-full max-w-[1250px] px-4 md:px-6 mx-auto py-8 sm:py-13">
        <div className="mb-4">
          <SectionTitle
            title="Internships & Apprenticeships"
            subtitle="Gain Practical Industry Experience or Build a Long-Term Trade Career"
            defination="Internships offer short-term, practical work experience tied to a student's field of study, while apprenticeships combine paid employment with structured, long-term technical training."
            viewAllLink="/internship"
          />
        </div>

        <div className="mb-5">
          <FilterChips
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
          />
        </div>

        {/* Below sm the cards scroll horizontally, one-and-a-bit per screen with
            snap, instead of stacking full-width — the grid takes over at sm. */}
        <div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto scrollbar-hide px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-5 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-3 xl:grid-cols-4">
          {visibleItems.map((item) => (
            <div key={item.id} className="w-[78vw] max-w-[320px] shrink-0 snap-start sm:w-auto sm:max-w-none">
              <CommonCard item={item} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Internship;
