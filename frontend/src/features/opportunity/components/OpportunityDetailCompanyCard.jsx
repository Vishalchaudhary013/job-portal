import {
  LuArrowRight,
  LuBuilding2,
  LuFlag,
  LuGlobe,
  LuMapPin,
  LuUsers,
} from "react-icons/lu";
import { FaInstagram, FaLinkedinIn } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";

// Sticky "about the company" rail beside the description on the new detail
// page. The reference card lists phone/location/email; the opportunity model
// carries no phone or email, so the same slot shows what it does have
// (website, headquarters, industry, founded year, size) and "View more" falls
// back to a maps search when there is no website.

const mapSearchUrl = (value) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    String(value || "India").trim() || "India",
  )}`;

const withProtocol = (url) => {
  const raw = String(url || "").trim();
  if (!raw) return "";
  return /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
};

const OpportunityDetailCompanyCard = ({ opportunity }) => {
  const item = opportunity || {};
  const website = withProtocol(item.website);
  const place = item.headquarters || item.cityState || item.location;
  const blurb = item.companyOverview || item.specialties;
  const social = item.socialProofLinks || {};
  const hasSocial = social.linkedin || social.twitter || social.instagram;

  // Labelled rows, in the reference card's order. The label is what makes a
  // bare stored value legible — "51-200" or "2019" on its own beside an icon
  // reads as an unexplained number.
  const rows = [
    (item.industry || item.companyType) && {
      icon: LuBuilding2,
      label: "Industry",
      value: item.industry || item.companyType,
    },
    item.foundedYear && {
      icon: LuFlag,
      label: "Founded in",
      value: item.foundedYear,
    },
    (item.companySize || item.numberOfEmployees) && {
      icon: LuUsers,
      label: "Employees",
      value: item.companySize || item.numberOfEmployees,
    },
    place && {
      icon: LuMapPin,
      label: "Location",
      value: place,
      href: mapSearchUrl(place),
    },
    
    website && {
      icon: LuGlobe,
      label: "Website",
      value: item.website,
      href: website,
    },
  ].filter(Boolean);

  return (
    // `self-start` matters: as a grid child this would otherwise stretch to the
    // description column's full height, drawing its border far below its own
    // content (and leaving `sticky` with nothing to scroll against).
    <aside className="h-fit self-start rounded-sm border border-black/10 bg-white p-6 lg:sticky lg:top-24">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-sm bg-primary/10">
          {item.logo || item.companyLogo ? (
            <img
              src={item.logo || item.companyLogo?.url || item.companyLogo}
              alt={item.company}
              className="h-full w-full object-contain"
            />
          ) : (
            <span className="text-[16px] font-bold text-primary">
              {String(item.company || "E").trim().charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        <p className="min-w-0 truncate text-[16px] font-semibold text-primary">
          {item.company || "Company"}
        </p>
      </div>

      {blurb && (
        <div
          className="mt-5 text-[14px] leading-relaxed text-black [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5"
          dangerouslySetInnerHTML={{
            __html: String(blurb).replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>"),
          }}
        />
      )}

      {rows.length > 0 && (
        <ul className="mt-5 space-y-4">
          {rows.map(({ icon: Icon, label, value, href }) => (
            <li key={label} className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-black/[0.04] text-primary">
                <Icon className="h-[18px] w-[18px]" />
              </span>
              <div className="min-w-0">
                <p className="text-[14px] font-semibold text-primary">{label}</p>
                {href ? (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block break-words text-[14px] text-black/70 hover:text-secondary hover:underline"
                  >
                    {value}
                  </a>
                ) : (
                  <p className="break-words text-[14px] text-black/70">{value}</p>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {hasSocial && (
        <div className="mt-5 flex items-center gap-2">
          {social.linkedin && (
            <a
              href={social.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn"
              className="rounded-sm border border-black/10 p-2 text-primary transition-colors hover:bg-primary/5"
            >
              <FaLinkedinIn size={18} />
            </a>
          )}
          {social.twitter && (
            <a
              href={social.twitter}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="X"
              className="rounded-sm border border-black/10 p-2 text-primary transition-colors hover:bg-primary/5"
            >
              <FaXTwitter size={18} />
            </a>
          )}
          {social.instagram && (
            <a
              href={social.instagram}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="rounded-sm border border-black/10 p-2 text-secondary transition-colors hover:bg-secondary/5"
            >
              <FaInstagram size={18} />
            </a>
          )}
        </div>
      )}

      <a
        href={website || mapSearchUrl(place)}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-6 inline-flex items-center gap-2 text-[13px] font-bold uppercase tracking-wide text-primary hover:text-secondary"
      >
        View more
        <LuArrowRight className="h-4 w-4" />
      </a>
    </aside>
  );
};

export default OpportunityDetailCompanyCard;
