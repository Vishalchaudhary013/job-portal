import React from "react";
import {
  FiBriefcase,
  FiEyeOff,
  FiFileText,
  FiGrid,
  FiLogOut,
  FiPieChart,
  FiShield,
  FiCheckCircle,
  FiUsers,
  FiChevronDown,
  FiChevronRight,
  FiCheck,
  FiMessageSquare,
  FiLayout,
  FiHelpCircle,
} from "react-icons/fi";
import { useAdminContext } from "../context/AdminContext";
import { LayoutPanelLeft, LocateIcon, Image as ImageIcon, GraduationCap } from "lucide-react";
import { useState, useEffect, useRef } from "react";

// Career Services portal: same sidebar as Edeco, trimmed to the shared
// Overview / Admins / Users tabs + the Career Drive tabs. (Portal-only edit —
// the Edeco original lists every section.)
const CORE_ADMIN_ITEMS = [];

// Order:  Overview  ->  [collapsible groups]  ->  flat items
// Indices 0-2 render before the program groups (Overview + the Stakeholders
// group's children).
const CORE_SUPER_ITEMS = [
  { key: "Overview", label: "Overview" },
  { key: "Admins", label: "Admins" },
  { key: "Users", label: "Users" },
];

const PROGRAM_ITEMS = [
  { key: "Internship", label: "Internships" },
  { key: "Apprenticeships", label: "Apprenticeships" },
  { key: "Jobs", label: "Jobs" },
];

// Collapsible parent groups in the sidebar. Each group replaces its child items
// inline with a single expand/collapse row (right-hand chevron).
const SIDEBAR_GROUPS = [
  { key: "Stakeholders", label: "Stakeholders", childKeys: ["Admins", "Users"] },
  { key: "Career Drive", label: "Career Drive", childKeys: ["Internship", "Apprenticeships", "Jobs"] },
];
const GROUP_BY_CHILD = SIDEBAR_GROUPS.reduce((acc, group) => {
  group.childKeys.forEach((childKey) => {
    acc[childKey] = group;
  });
  return acc;
}, {});

const getMenuIcon = (key) => {
  const icons = {
    Stakeholders: <FiUsers size={16} />,
    "Career Drive": <FiBriefcase size={16} />,
    Content: <FiLayout size={16} />,
    Program: <FiGrid size={16} />,
    Universities: <GraduationCap size={16} />,
    Internship: <FiGrid size={16} />,
    Apprenticeships: <FiBriefcase size={16} />,
    Jobs: <FiBriefcase size={16} />,
    Masterclasses: <FiUsers size={16} />,
    Bootcamps: <FiCheckCircle size={16} />,
    "Certificate Programs": <FiFileText size={16} />,
    "Post Graduate Programs": <FiPieChart size={16} />,
    "Degree Programs": <FiGrid size={16} />,
    "Global Program": <FiPieChart size={16} />,
    University: <GraduationCap size={16} />,
    "University Portfolio": <LayoutPanelLeft size={16} />,
    "Trust Score": <FiShield size={16} />,
    "All Application": <LayoutPanelLeft  size={16} />,
    "Closed Application": <FiEyeOff size={16} />,
    Enquiries: <FiMessageSquare size={16} />,
    Applications: <FiFileText size={16} />,
    Overview: <FiPieChart size={16} />,
    "Post Opportunity": <FiBriefcase size={16} />,
    Admins: <FiShield size={16} />,
    Users: <FiUsers size={16} />,
    Mentors: <FiUsers size={16} />,
    Location:<LocateIcon size={16} />,
    Gallery: <ImageIcon size={16} />,
    Templates: <FiLayout size={16} />,
    "Resume Builder": <FiFileText size={16} />,
    Questions: <FiHelpCircle size={16} />,
  };
  return icons[key] || null;
};

const AdminSidebar = () => {
  const { isSuperDashboard, isSuperAdmin, activeSection, handleSectionChange, handleLogout, dashboardType } = useAdminContext();

  const [selectedPrograms, setSelectedPrograms] = useState(() => {
    const saved = localStorage.getItem("admin_sidebar_preferences");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return ["Internship", "Jobs"];
  });

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Which collapsible sidebar groups (Career Drive, Content) are expanded.
  const [openGroups, setOpenGroups] = useState(() => {
    let saved = {};
    try {
      saved = JSON.parse(localStorage.getItem("admin_sidebar_open_groups") || "{}");
    } catch {
      saved = {};
    }
    const initial = {};
    SIDEBAR_GROUPS.forEach((group) => {
      initial[group.key] =
        group.key in saved ? saved[group.key] : group.childKeys.includes(activeSection);
    });
    return initial;
  });

  useEffect(() => {
    localStorage.setItem("admin_sidebar_preferences", JSON.stringify(selectedPrograms));
  }, [selectedPrograms]);

  useEffect(() => {
    localStorage.setItem("admin_sidebar_open_groups", JSON.stringify(openGroups));
  }, [openGroups]);

  const toggleGroup = (key) => setOpenGroups((prev) => ({ ...prev, [key]: !prev[key] }));

  // A group is expanded when the user opened it, or forced open while one of its
  // sections is the active one (so you always see where you are).
  const isGroupOpen = (group) =>
    Boolean(openGroups[group.key]) || group.childKeys.includes(activeSection);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleProgram = (key) => {
    setSelectedPrograms(prev => 
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const coreItems = isSuperDashboard && isSuperAdmin ? CORE_SUPER_ITEMS : CORE_ADMIN_ITEMS;
  const activeProgramItems = (isSuperDashboard && isSuperAdmin) 
    ? PROGRAM_ITEMS 
    : PROGRAM_ITEMS.filter(item => selectedPrograms.includes(item.key));
  
  let finalMenuItems = [];
  if (isSuperDashboard && isSuperAdmin) {
     finalMenuItems = [
       ...CORE_SUPER_ITEMS.slice(0, 3), // Overview + Stakeholders group children
       ...activeProgramItems,           // Career Drive group
       ...CORE_SUPER_ITEMS.slice(3)     // flat items (none in this portal)
     ];
  } else {
     finalMenuItems = [
       ...activeProgramItems,
       ...CORE_ADMIN_ITEMS
     ];
  }

  return (
    <aside className="bg-[#EEF2FF] border border-[#E2E8F0]  p-4 xl:sticky xl:top-0 h-full flex flex-col overflow-hidden">
      <div className="mb-7 relative" ref={dropdownRef}>
        <div className="flex items-center justify-between">
          <p className="text-slate-900 text-xl font-semibold">
            {dashboardType === "mentor" ? "Mentor Control" : "Admin Control"}
          </p>
        </div>
        
        {!(isSuperDashboard && isSuperAdmin) && (
          <>
            <button 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="mt-3 w-full flex items-center justify-between px-3 py-2 bg-white border border-[#E2E8F0] rounded-lg text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition"
            >
              Choose
              <FiChevronDown size={14} className={`transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {isDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-[#E2E8F0] rounded-lg shadow-xl z-50 max-h-[300px] overflow-y-auto custom-scrollbar p-2">
                <p className="text-[10px] uppercase font-bold text-slate-400 mb-2 px-2 tracking-wider">Select Programs</p>
                {PROGRAM_ITEMS.map(item => {
                  const isSelected = selectedPrograms.includes(item.key);
                  return (
                    <button
                      key={item.key}
                      onClick={() => toggleProgram(item.key)}
                      className="w-full flex items-center gap-2 px-2 py-1.5 text-xs font-medium text-slate-700 hover:bg-blue-50 rounded transition-colors text-left"
                    >
                      <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${isSelected ? 'bg-blue-600 border-blue-600' : 'border-slate-300'}`}>
                        {isSelected && <FiCheck size={10} className="text-white" />}
                      </div>
                      {item.label}
                    </button>
                  )
                })}
              </div>
            )}
          </>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 mb-7 sm:grid-cols-3 xl:grid-cols-1 xl:space-y-2 xl:gap-0 overflow-y-auto custom-scrollbar pr-1">
        {(() => {
          // Collapsible parent groups only apply to the super-admin sidebar.
          const groupsEnabled = isSuperDashboard && isSuperAdmin;
          const renderedGroups = new Set();
          const byKey = new Map(finalMenuItems.map((menuItem) => [menuItem.key, menuItem]));
          return finalMenuItems.map((item) => {
            const group = groupsEnabled ? GROUP_BY_CHILD[item.key] : undefined;

            // A grouped item: render the collapsible parent once, in place of its
            // first child, then skip the remaining children.
            if (group) {
              if (renderedGroups.has(group.key)) return null;
              renderedGroups.add(group.key);

              // Ordered by the group's childKeys (not sidebar order).
              const children = group.childKeys.map((key) => byKey.get(key)).filter(Boolean);
              const open = isGroupOpen(group);
              const hasActiveChild = children.some((child) => child.key === activeSection);

              return (
                <div key={group.key} className="col-span-2 sm:col-span-3 xl:col-span-1">
                  <button
                    type="button"
                    onClick={() => toggleGroup(group.key)}
                    aria-expanded={open}
                    className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition ${
                      hasActiveChild ? "text-slate-900" : "text-slate-600 hover:bg-white/70"
                    }`}
                  >
                    <span className="flex items-center gap-2.5 min-w-0">
                      <span className="shrink-0 flex">{getMenuIcon(group.key)}</span>
                      <span className="truncate">{group.label}</span>
                    </span>
                    <FiChevronRight size={15} className={`shrink-0 transition-transform ${open ? "rotate-90" : ""}`} />
                  </button>

                  {open && (
                    <div className="mt-1 space-y-1 ml-3.5 border-l border-[#D5DCF0] pl-2">
                      {children.map((child) => (
                        <button
                          key={child.key}
                          type="button"
                          onClick={() => handleSectionChange(child.key)}
                          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium text-left transition ${
                            activeSection === child.key
                              ? "bg-white text-slate-900 shadow-sm"
                              : "text-slate-600 hover:bg-white/70"
                          }`}
                        >
                          <span className="shrink-0 flex">{getMenuIcon(child.key)}</span>
                          <span className="leading-tight">{child.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <button
                key={item.key}
                type="button"
                onClick={() => handleSectionChange(item.key)}
                className={`w-full flex items-center justify-center xl:justify-start gap-2.5 px-3 py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition ${
                  activeSection === item.key
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:bg-white/70"
                }`}
              >
                {getMenuIcon(item.key)}
                {item.label}
              </button>
            );
          });
        })()}
      </div>

      <div className="mt-auto pt-4 border-t border-[#EEF2FF] space-y-2">
        <button
          type="button"
          onClick={handleLogout}
          className="w-full text-left px-3 py-2 text-sm text-slate-700 rounded-lg border border-slate-300 hover:bg-white/80 flex items-center justify-center xl:justify-start gap-2"
        >
          <FiLogOut size={15} />
          Logout
        </button>
      </div>
    </aside>
  );
};

export default AdminSidebar;
