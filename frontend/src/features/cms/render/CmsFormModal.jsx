import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { FiCheckCircle, FiX } from "react-icons/fi";
import { useOpportunities } from "../../../context/OpportunitiesContext";
import { getCmsForm, submitCmsForm, uploadCmsFormFile } from "../../../services/cmsAPI";
import DynamicFields from "../inputs/DynamicFields";
import { MediaHandlerContext } from "../inputs/MediaInput";
import { defaultDataFor } from "../shared/fieldTypes.js";
import { validateData } from "../shared/validation.js";

// Student-facing response form, opened from a card action or page button.
// Who is submitting is decided by the server from the existing Edeco session;
// the entry the form was opened from travels along as `contentId`.

const CmsFormModal = ({ formSlug, entry, onClose }) => {
  const { user } = useOpportunities();
  const location = useLocation();
  const [form, setForm] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [values, setValues] = useState({});
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [done, setDone] = useState(null);
  const bodyRef = useRef(null);

  useEffect(() => {
    let active = true;
    getCmsForm(formSlug)
      .then((result) => {
        if (!active) return;
        setForm(result);
        setValues(defaultDataFor(result.schema?.fields || []));
      })
      .catch((error) => active && setLoadError(error?.response?.status === 404 ? "This form isn't available right now." : "Couldn't load the form. Please try again."));
    return () => {
      active = false;
    };
  }, [formSlug]);

  useEffect(() => {
    const onKey = (event) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [onClose]);

  const mediaHandler = useMemo(
    () => ({ upload: (file, field, onProgress) => uploadCmsFormFile(formSlug, field.id, file, onProgress) }),
    [formSlug],
  );

  const fields = form?.schema?.fields || [];
  const needsLogin = form?.settings?.requireLogin && !user;

  const submit = async (event) => {
    event.preventDefault();
    setSubmitError("");
    const result = validateData(fields, values, { enforceRequired: true });
    setErrors(result.errors);
    if (!result.valid) {
      requestAnimationFrame(() => bodyRef.current?.querySelector('[role="alert"]')?.scrollIntoView({ behavior: "smooth", block: "center" }));
      return;
    }
    setSubmitting(true);
    try {
      const response = await submitCmsForm(formSlug, {
        data: values,
        contentId: entry?.id && entry.id !== "preview" ? entry.id : undefined,
        context: { pageUrl: window.location.href, referrer: document.referrer || "" },
      });
      setDone(response.message || form.settings.successMessage);
    } catch (error) {
      const data = error?.response?.data;
      if (data?.details?.fieldErrors) setErrors(data.details.fieldErrors);
      setSubmitError(data?.message || "Couldn't submit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label={form?.name || "Form"} onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl bg-white  sm:rounded-sm">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-slate-900">{form?.name || "Loading…"}</h2>
            {entry?.title && <p className="truncate text-sm text-slate-500">{entry.title}</p>}
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-sm p-1.5 text-slate-500 hover:bg-slate-100">
            <FiX size={20} />
          </button>
        </div>

        <div ref={bodyRef} className="flex-1 overflow-y-auto px-5 py-5">
          {loadError && <p className="py-10 text-center text-slate-600">{loadError}</p>}
          {!form && !loadError && <div className="space-y-4">{[0, 1, 2].map((n) => <div key={n} className="h-12 animate-pulse rounded-sm bg-slate-100" />)}</div>}

          {form && done && (
            <div className="flex flex-col items-center py-10 text-center">
              <FiCheckCircle size={44} className="text-emerald-500" />
              <p className="mt-4 max-w-md text-[15px] text-slate-700">{done}</p>
              <button type="button" onClick={onClose} className="mt-6 rounded-sm bg-[#1F2853] px-5 py-2 text-sm font-semibold text-white">Close</button>
            </div>
          )}

          {form && !done && form.settings?.closed && <p className="py-10 text-center text-slate-600">This form is no longer accepting responses.</p>}

          {form && !done && !form.settings?.closed && needsLogin && (
            <div className="py-10 text-center">
              <p className="text-slate-700">Please sign in to continue.</p>
              <Link to="/login" state={{ from: location }} className="mt-4 inline-block rounded-sm bg-[#1F2853] px-5 py-2 text-sm font-semibold text-white">Sign in</Link>
            </div>
          )}

          {form && !done && !form.settings?.closed && !needsLogin && (
            <form id="cms-response-form" onSubmit={submit} noValidate>
              {form.description && <p className="mb-5 whitespace-pre-line text-sm text-slate-600">{form.description}</p>}
              <MediaHandlerContext.Provider value={mediaHandler}>
                <DynamicFields fields={fields} values={values} onChange={setValues} errors={errors} />
              </MediaHandlerContext.Provider>
            </form>
          )}
        </div>

        {form && !done && !form.settings?.closed && !needsLogin && (
          <div className="flex items-center justify-between gap-3 border-t border-slate-100 px-5 py-3.5">
            <p className="text-sm text-red-600" role="status">{submitError}</p>
            <button
              type="submit"
              form="cms-response-form"
              disabled={submitting}
              className="shrink-0 rounded-sm bg-[#FF4E45] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#e8443c] disabled:opacity-60"
            >
              {submitting ? "Submitting…" : form.settings?.submitLabel || "Submit"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CmsFormModal;
