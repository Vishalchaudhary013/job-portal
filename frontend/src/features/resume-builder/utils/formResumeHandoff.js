// Shared logic for a form's "Build a resume now" action: stash the in-progress
// answers, send the user to the Resume Builder (via sign-up if needed), and let
// the Resume Builder bring them back with the finished resume attached.
//
// Round trip:
//   form  --stash answers--> /resume-builder?returnTo=<form>&attachField=<id>
//   builder --finalize--> <form>?resumeFor=<id>&builderResumeId=<id>
//   form  --restore answers + set field value = { builderResumeId, fromBuilder }

const draftKey = (backPath) => `edeco:formDraft:${backPath}`;

// Values that can't survive JSON round-tripping (File objects, blob URLs) are
// dropped from the stash — the user re-picks those after coming back.
const isSerializable = (value) => {
  if (value == null) return true;
  if (value instanceof File || value instanceof Blob) return false;
  if (typeof value === "object" && (value.file instanceof File || value.dataUrl || value.previewUrl)) return false;
  return true;
};

export const stashFormDraft = (backPath, formValues = {}) => {
  try {
    const clean = {};
    Object.entries(formValues).forEach(([key, value]) => {
      if (isSerializable(value)) clean[key] = value;
    });
    sessionStorage.setItem(draftKey(backPath), JSON.stringify(clean));
  } catch {
    /* sessionStorage unavailable — the round trip just loses in-progress answers */
  }
};

export const popFormDraft = (backPath) => {
  try {
    const raw = sessionStorage.getItem(draftKey(backPath));
    sessionStorage.removeItem(draftKey(backPath));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

/**
 * @param {object}   opts
 * @param {string}   opts.backPath        pathname to return to (no query)
 * @param {string}   opts.fieldId         the resumeUpload field id
 * @param {object}   opts.formValues      current form answers to preserve
 * @param {boolean}  opts.isAuthenticated
 * @param {(to: string) => void} opts.navigate
 */
export const startResumeHandoff = ({ backPath, fieldId, formValues, isAuthenticated, navigate }) => {
  stashFormDraft(backPath, formValues);

  const back = `${backPath}?resumeFor=${encodeURIComponent(fieldId)}`;
  const builderUrl = `/resume-builder?returnTo=${encodeURIComponent(back)}&attachField=${encodeURIComponent(fieldId)}`;

  if (isAuthenticated) {
    navigate(builderUrl);
  } else {
    navigate(`/signup?redirect=${encodeURIComponent(builderUrl)}`);
  }
};

// The opportunity application form is a modal that isn't mounted after the round
// trip, so its whole context is stashed and revived by <ApplyHandoffReviver />.
const APPLY_KEY = "edeco:applyHandoff";

export const stashApplyHandoff = (payload) => {
  try {
    sessionStorage.setItem(APPLY_KEY, JSON.stringify(payload));
  } catch {
    /* ignore */
  }
};

export const popApplyHandoff = () => {
  try {
    const raw = sessionStorage.getItem(APPLY_KEY);
    sessionStorage.removeItem(APPLY_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

// Modal variant of startResumeHandoff: stash the opportunity + answers, then go
// to the builder with `applyReturn=1` so the reviver knows to reopen the modal.
export const startApplyResumeHandoff = ({ pathname, fieldId, opportunity, opportunityTitle, formValues, isAuthenticated, navigate }) => {
  const cleanValues = {};
  Object.entries(formValues || {}).forEach(([key, value]) => {
    if (isSerializable(value)) cleanValues[key] = value;
  });
  stashApplyHandoff({ pathname, fieldId, opportunity, opportunityTitle, formValues: cleanValues });

  const back = `${pathname}?applyReturn=1`;
  const builderUrl = `/resume-builder?returnTo=${encodeURIComponent(back)}&attachField=${encodeURIComponent(fieldId)}`;
  navigate(isAuthenticated ? builderUrl : `/signup?redirect=${encodeURIComponent(builderUrl)}`);
};
