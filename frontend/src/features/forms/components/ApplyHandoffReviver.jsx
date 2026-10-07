import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import ApplicationFormModal from "./ApplicationFormModal";
import { popApplyHandoff } from "../../resume-builder/utils/formResumeHandoff";

// Mounted once globally. When the user returns from the Resume Builder after
// choosing "Build a resume now" inside an opportunity application form
// (?applyReturn=1&builderResumeId=...), this re-opens that modal with the
// answers they'd already filled and the freshly-built resume attached.
const ApplyHandoffReviver = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // One-shot: read (and consume) the stash on mount. `popApplyHandoff` clears
  // the sessionStorage key, so this must run exactly once.
  const [revived, setRevived] = useState(() => {
    if (searchParams.get("applyReturn") !== "1" || !searchParams.get("builderResumeId")) return null;
    const handoff = popApplyHandoff();
    if (!handoff || handoff.pathname !== location.pathname || !handoff.opportunity) return null;
    return {
      opportunity: handoff.opportunity,
      opportunityTitle: handoff.opportunityTitle,
      seedValues: {
        ...(handoff.formValues || {}),
        [handoff.fieldId]: { builderResumeId: searchParams.get("builderResumeId"), fromBuilder: true },
      },
    };
  });

  // Strip the round-trip params from the URL so a refresh doesn't retry.
  useEffect(() => {
    if (searchParams.get("applyReturn") === "1") {
      navigate(location.pathname, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!revived) return null;

  return (
    <ApplicationFormModal
      isOpen
      onClose={() => setRevived(null)}
      opportunity={revived.opportunity}
      opportunityTitle={revived.opportunityTitle}
      seedValues={revived.seedValues}
    />
  );
};

export default ApplyHandoffReviver;
