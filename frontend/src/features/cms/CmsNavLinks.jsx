import React, { useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { MdKeyboardArrowDown } from "react-icons/md";
import { getCmsTypes } from "../../services/cmsAPI";

// Navbar entry for content published from the Form Builder. Edeco decides
// WHERE it appears (an "Explore" menu); the Form Builder only decides WHICH
// content types are offered ("Offer in site navigation" in Presentation).

let typesRequest = null;
const loadNavTypes = () => {
  if (!typesRequest) {
    typesRequest = getCmsTypes()
      .then((result) => result.items || [])
      .catch(() => {
        typesRequest = null; // retry on next mount
        return [];
      });
  }
  return typesRequest;
};

const useNavTypes = () => {
  const [types, setTypes] = useState([]);
  useEffect(() => {
    let active = true;
    loadNavTypes().then((items) => active && setTypes(items));
    return () => {
      active = false;
    };
  }, []);
  return {
    all: types,
    inNav: types.filter((type) => type.presentation?.showInNavigation),
  };
};

const labelFor = (type) => type.presentation?.navLabel || type.presentation?.heading || type.name;

export const CmsDesktopNavLink = () => {
  const { all, inNav } = useNavTypes();
  if (!all.length) return null;

  return (
    <div className="group relative">
      <NavLink
        to="/explore"
        className={({ isActive }) =>
          `flex items-center gap-1 whitespace-nowrap text-[15px] font-medium transition-colors ${isActive ? "text-red-600" : "text-gray-700 hover:text-red-600"}`
        }
      >
        Explore
        {inNav.length > 0 && <MdKeyboardArrowDown size={18} className="transition-transform duration-200 group-hover:-rotate-180" />}
      </NavLink>
      {inNav.length > 0 && (
        // pt-3 keeps the gap between link and panel hoverable.
        <div className="invisible absolute left-1/2 top-full z-50 w-60 -translate-x-1/2 translate-y-1 pt-3 opacity-0 transition-all duration-200 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
          <div className="overflow-hidden rounded-sm border border-gray-200 bg-white">
            <ul className="px-2 py-2">
              {inNav.map((type) => (
                <li key={type.id}>
                  <Link to={`/explore/${type.slug}`} className="block rounded-sm px-3 py-2 text-[13.5px] text-gray-700 transition-colors hover:bg-red-50 hover:text-red-600">
                    {labelFor(type)}
                  </Link>
                </li>
              ))}
            </ul>
            <Link to="/explore" className="flex items-center justify-between border-t border-gray-100 bg-gray-50/70 px-4 py-2.5 text-[13px] font-semibold text-[#1F2853] transition-colors hover:text-red-600">
              View everything
              <span aria-hidden="true">&rarr;</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export const CmsMobileNavLinks = ({ onNavigate }) => {
  const { all, inNav } = useNavTypes();
  if (!all.length) return null;

  return (
    <div className="border-b border-gray-50">
      <Link to="/explore" onClick={onNavigate} className="block py-2 font-medium text-gray-800">
        Explore
      </Link>
      {inNav.length > 0 && (
        <ul className="mb-2 ml-3 border-l border-gray-100 pl-3">
          {inNav.map((type) => (
            <li key={type.id}>
              <Link to={`/explore/${type.slug}`} onClick={onNavigate} className="block py-1.5 text-[14px] text-gray-600 hover:text-red-600">
                {labelFor(type)}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
