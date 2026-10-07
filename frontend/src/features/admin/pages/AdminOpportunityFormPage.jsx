import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useOpportunities } from "../../../context/OpportunitiesContext";

const initialForm = {
  title: "",
  company: "",
  description: "",
  requiredSkills: "",
  whoCanApply: "",
  benefits: "",
  department: "",
  functionalRole: "",
  companyType: "",
  companySize: "",
  foundedYear: "",
  industry: "",
  listing: "",
  internshipType: "",
  website: "",
  location: "",
  duration: "",
  durationValue: "",
  durationUnit: "months",
  stipend: "",
  stipendCurrency: "INR",
  stipendType: "Paid",
  type: "Internship",
  deadline: "",
  startDate: "",
  logo: "",
  programType: "",
  eligibility: "",
};

const hasUnpaidKeyword = (value) =>
  /\bunpaid\b|\bno\s*stipend\b|\bno\s*pay\b|\bwithout\s*stipend\b|\bfree\b|\bvolunteer\b/i.test(
    String(value || ""),
  );

const AdminOpportunityFormPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    addOpportunity,
    updateOpportunity,
    getApiErrorMessage,
    isAdmin,
    isBootstrapping,
    user,
    opportunities,
  } = useOpportunities();

  const isEditMode = location.pathname.includes("/edit-opportunity/");
  const editOpportunityId = isEditMode
    ? location.pathname.split("/edit-opportunity/")[1]
    : "";
  const dashboardPath = location.pathname.startsWith("/super-admin-dashboard")
    ? "/super-admin-dashboard"
    : "/admin-dashboard";
  const isGlobalProgram = location.pathname.includes("create-global-program");
  const existingOpportunity =
    location.state?.opportunity ||
    opportunities.find((item) => String(item.id) === String(editOpportunityId));
  const [form, setForm] = useState({
    ...initialForm,
    type: isGlobalProgram ? "Global Program" : "Internship",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [logoFile, setLogoFile] = useState(null);
  const [requiredSkillInputs, setRequiredSkillInputs] = useState(["", "", ""]);
  const [benefitInputs, setBenefitInputs] = useState(["", "", "", ""]);

  useEffect(() => {
    if (!isEditMode || !existingOpportunity) {
      return;
    }

    const normalizedRequiredSkills = String(
      existingOpportunity.requiredSkills || existingOpportunity.skills || "",
    )
      .split(/\r?\n|,/)
      .map((skill) => skill.trim())
      .filter(Boolean);
    const normalizedBenefits = String(existingOpportunity.benefits || "")
      .split(/\r?\n|,/)
      .map((benefit) => benefit.trim())
      .filter(Boolean);
    const durationParts = String(existingOpportunity.duration || "")
      .trim()
      .split(/\s+/);
    const durationValue = durationParts[0] || "";
    const durationUnit = durationParts.slice(1).join(" ") || "months";
    const isUnpaidOpportunity =
      String(existingOpportunity.stipendType || "")
        .trim()
        .toLowerCase() === "unpaid" ||
      hasUnpaidKeyword(existingOpportunity.stipend);
    const stipendAmount = String(existingOpportunity.stipend || "")
      .replace(/^[^\d]+/, "")
      .trim();

    setForm({
      ...initialForm,
      ...existingOpportunity,
      type:
        existingOpportunity.type ||
        (isGlobalProgram ? "Global Program" : "Internship"),
      requiredSkills: String(
        existingOpportunity.requiredSkills || existingOpportunity.skills || "",
      ),
      whoCanApply: String(existingOpportunity.whoCanApply || ""),
      benefits: String(existingOpportunity.benefits || ""),
      durationValue,
      durationUnit,
      stipend: isUnpaidOpportunity ? "" : stipendAmount,
      stipendCurrency: existingOpportunity?.stipendDetails?.currency || "INR",
      stipendType: isUnpaidOpportunity
        ? "Unpaid"
        : existingOpportunity.stipendType || "Paid",
      deadline: existingOpportunity.deadline
        ? new Date(existingOpportunity.deadline).toISOString().split("T")[0]
        : "",
      startDate: existingOpportunity.startDate
        ? new Date(existingOpportunity.startDate).toISOString().split("T")[0]
        : "",
      logo: existingOpportunity.logo || "",
      cardTags: Array.isArray(existingOpportunity.cardTags)
        ? existingOpportunity.cardTags.join(", ")
        : existingOpportunity.cardTags || "",
      skills: Array.isArray(existingOpportunity.skills)
        ? existingOpportunity.skills.join(", ")
        : existingOpportunity.skills || "",
    });
    setRequiredSkillInputs(
      normalizedRequiredSkills.length >= 3
        ? normalizedRequiredSkills
        : [
          ...normalizedRequiredSkills,
          ...Array(3 - normalizedRequiredSkills.length).fill(""),
        ],
    );
    setBenefitInputs(
      normalizedBenefits.length >= 4
        ? normalizedBenefits
        : [
          ...normalizedBenefits,
          ...Array(4 - normalizedBenefits.length).fill(""),
        ],
    );
  }, [existingOpportunity, isEditMode, isGlobalProgram]);

  const heading = useMemo(
    () => (isGlobalProgram ? "Create Global Program" : "Create Internship"),
    [isGlobalProgram],
  );

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleLogoChange = (event) => {
    const file = event.target.files?.[0] || null;

    if (!file) {
      setLogoFile(null);
      return;
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    const hasAllowedExtension = /\.(jpe?g|png|webp)$/i.test(file.name);

    if (!allowedTypes.includes(file.type) && !hasAllowedExtension) {
      setError("Logo must be JPG, PNG, or WEBP.");
      setLogoFile(null);
      return;
    }

    setError("");
    setLogoFile(file);
  };

  const handleRequiredSkillChange = (index, value) => {
    setRequiredSkillInputs((prev) =>
      prev.map((item, currentIndex) => (currentIndex === index ? value : item)),
    );
  };

  const addRequiredSkillInput = () => {
    setRequiredSkillInputs((prev) => [...prev, ""]);
  };

  const handleBenefitChange = (index, value) => {
    setBenefitInputs((prev) =>
      prev.map((item, currentIndex) => (currentIndex === index ? value : item)),
    );
  };

  const addBenefitInput = () => {
    setBenefitInputs((prev) => [...prev, ""]);
  };

  const handleUnpaidToggle = (event) => {
    const { checked } = event.target;

    setForm((prev) => ({
      ...prev,
      stipendType: checked ? "Unpaid" : "Paid",
      stipend: checked ? "" : prev.stipend,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setBusy(true);

    const durationLabel =
      `${String(form.durationValue || "").trim()} ${String(form.durationUnit || "months").trim()}`.trim();
    const stipendAmount = String(form.stipend || "").trim();
    const stipendCurrencySymbol = form.stipendCurrency === "USD" ? "$" : "₹";
    const isUnpaidInternship =
      form.type === "Internship" && form.stipendType === "Unpaid";
    const requiredSkillsValue = requiredSkillInputs
      .map((skill) => String(skill || "").trim())
      .filter(Boolean)
      .join(", ");
    const benefitsValue = benefitInputs
      .map((benefit) => String(benefit || "").trim())
      .filter(Boolean)
      .join(", ");

    const { durationValue, durationUnit, ...restForm } = form;

    const payload = {
      ...restForm,
      duration: durationLabel,
      stipendType: isUnpaidInternship ? "Unpaid" : "Paid",
      stipend: isUnpaidInternship
        ? ""
        : stipendAmount
          ? `${stipendCurrencySymbol}${stipendAmount}`
          : "",
      logoFile,
      deadline: new Date(form.deadline).toISOString(),
      startDate: form.startDate ? new Date(form.startDate).toISOString() : null,
      ...(form.type === "Internship"
        ? {
          workMode: form.workMode,
          cardTags: form.cardTags,
          requiredSkills: requiredSkillsValue,
          benefits: benefitsValue,
        }
        : {}),
    };

    try {
      if (isEditMode && editOpportunityId) {
        await updateOpportunity(editOpportunityId, payload);
      } else {
        await addOpportunity(payload);
      }
      navigate(dashboardPath);
    } catch (apiError) {
      setError(
        getApiErrorMessage(
          apiError,
          isEditMode
            ? "Failed to update opportunity."
            : "Failed to create opportunity.",
        ),
      );
    } finally {
      setBusy(false);
    }
  };

  if (isBootstrapping) {
    return (
      <div className="min-h-screen bg-[#EEF2FF] flex items-center justify-center">
        <p className="text-slate-700 font-medium">Loading...</p>
      </div>
    );
  }

  if (!user || !isAdmin) {
    navigate("/login");
    return null;
  }

  return (
    <div className="min-h-screen bg-[#EEF2FF] py-8 px-4">
      <div className="w-full max-w-[1250px] px-4 md:px-6  mx-auto bg-white border border-[#E2E8F0] rounded-xl p-6">
        <div className="flex items-start justify-between gap-3 mb-5">
          <div>
            <h1 className="text-3xl font-semibold text-slate-800">
              {isEditMode
                ? `Edit ${form.type || (isGlobalProgram ? "Global Program" : "Internship")}`
                : heading}
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              {isEditMode
                ? "Update the form below. Fields marked "
                : "Fill the form below. Fields marked "}
              <span className="text-rose-600">*</span> are required.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate(dashboardPath)}
            className="px-4 py-2 rounded-lg bg-slate-100 text-slate-800 font-semibold"
          >
            Back
          </button>
        </div>

        {error && (
          <p className="text-sm font-medium text-red-600 mb-4">{error}</p>
        )}

        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <label className="flex flex-col gap-1 text-sm text-slate-700">
            <span>
              Opportunity Title <span className="text-rose-600">*</span>
            </span>
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="e.g. Frontend Developer Intern"
              required
              className="border border-[#EEF2FF] rounded-lg px-3 py-2"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm text-slate-700">
            <span>
              Company Name <span className="text-rose-600">*</span>
            </span>
            <input
              name="company"
              value={form.company}
              onChange={handleChange}
              placeholder="e.g. Acme Technologies"
              required
              className="border border-[#EEF2FF] rounded-lg px-3 py-2"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm text-slate-700">
            <span>
              Work Location <span className="text-rose-600">*</span>
            </span>
            <input
              name="location"
              value={form.location}
              onChange={handleChange}
              placeholder="e.g. Bengaluru / Remote"
              required
              className="border border-[#EEF2FF] rounded-lg px-3 py-2"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm text-slate-700">
            <span>
              Work Mode <span className="text-rose-600">*</span>
            </span>
            <select
              name="workMode"
              value={form.workMode}
              onChange={handleChange}
              required
              className="border border-[#EEF2FF] rounded-lg px-3 py-2"
            >
              <option value="In Office">In Office</option>
              <option value="Remote">Remote</option>
              <option value="Hybrid">Hybrid</option>
            </select>
          </label>

          <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-4 items-end">
            <label className="flex flex-col gap-1 text-sm text-slate-700">
              <span>
                Duration <span className="text-rose-600">*</span>
              </span>
              <div className="grid grid-cols-[1fr_auto] gap-2">
                <input
                  type="number"
                  min="1"
                  step="1"
                  name="durationValue"
                  value={form.durationValue}
                  onChange={handleChange}
                  required
                  className="border border-[#EEF2FF] rounded-lg px-3 py-2"
                  placeholder="e.g. 3"
                />
                <select
                  name="durationUnit"
                  value={form.durationUnit}
                  onChange={handleChange}
                  className="border border-[#EEF2FF] rounded-lg px-3 py-2"
                >
                  <option value="weeks">Weeks</option>
                  <option value="months">Months</option>
                  <option value="years">Years</option>
                </select>
              </div>
            </label>

            <label className="flex flex-col gap-1 text-sm text-slate-700">
              <span>Stipend Amount</span>
              <div className="grid grid-cols-[1fr_130px] gap-2">
                <input
                  name="stipend"
                  value={form.stipend}
                  onChange={handleChange}
                  disabled={form.type === "Internship" && form.stipendType === "Unpaid"}
                  className="border border-[#EEF2FF] rounded-lg px-3 py-2"
                  placeholder={
                    form.type === "Internship" && form.stipendType === "Unpaid"
                      ? "Disabled for unpaid internship"
                      : "e.g. 15000"
                  }
                />
                <select
                  name="stipendCurrency"
                  value={form.stipendCurrency}
                  onChange={handleChange}
                  disabled={form.type === "Internship" && form.stipendType === "Unpaid"}
                  className="border border-[#EEF2FF] rounded-lg px-3 py-2"
                >
                  <option value="INR">INR (₹)</option>
                  <option value="USD">USD ($)</option>
                </select>
              </div>
            </label>

            {form.type === "Internship" && (
              <label className="flex items-center gap-2 text-xs text-slate-700 border border-[#EEF2FF] rounded-lg px-2.5 py-2 bg-[#F8FAFF] h-10.5">
                <span className="font-medium whitespace-nowrap">Unpaid</span>
                <input
                  type="checkbox"
                  checked={form.stipendType === "Unpaid"}
                  onChange={handleUnpaidToggle}
                  className="h-3.5 w-3.5"
                />
              </label>
            )}
          </div>

          <label className="flex flex-col gap-1 text-sm text-slate-700">
            <span>
              Application Deadline <span className="text-rose-600">*</span>
            </span>
            <input
              type="date"
              name="deadline"
              value={form.deadline}
              onChange={handleChange}
              required
              className="border border-[#EEF2FF] rounded-lg px-3 py-2"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm text-slate-700">
            <span>
              Start Date <span className="text-rose-600">*</span>
            </span>
            <input
              type="date"
              name="startDate"
              value={form.startDate}
              onChange={handleChange}
              required
              className="border border-[#EEF2FF] rounded-lg px-3 py-2"
            />
          </label>


          <label className="flex flex-col gap-1 text-sm text-slate-700">
            <span>Company Logo (Image File)</span>
            <input
              type="file"
              accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
              onChange={handleLogoChange}
              className="border border-[#EEF2FF] rounded-lg px-3 py-2 bg-white"
            />
            <span className="text-xs text-slate-500">
              Upload JPG, PNG, or WEBP (max 5MB).
            </span>
          </label>

          <label className="flex flex-col gap-1 text-sm text-slate-700">
            <span>Company Website URL</span>
            <input
              name="website"
              value={form.website}
              onChange={handleChange}
              placeholder="https://company.com"
              className="border border-[#EEF2FF] rounded-lg px-3 py-2"
            />
          </label>


          {form.type === "Global Program" && (
            <>
              <label className="flex flex-col gap-1 text-sm text-slate-700">
                <span>Program Category</span>
                <input
                  name="programType"
                  value={form.programType}
                  onChange={handleChange}
                  placeholder="e.g. Scholarship, Fellowship"
                  className="border border-[#EEF2FF] rounded-lg px-3 py-2"
                />
              </label>

              <label className="flex flex-col gap-1 text-sm text-slate-700">
                <span>Eligibility Criteria</span>
                <input
                  name="eligibility"
                  value={form.eligibility}
                  onChange={handleChange}
                  placeholder="e.g. Open for all undergraduates"
                  className="border border-[#EEF2FF] rounded-lg px-3 py-2"
                />
              </label>
            </>
          )}

          {form.type === "Internship" && (
            <>
              <label className="flex flex-col gap-1 text-sm text-slate-700">
                <span>
                  Primary Skills / Tags <span className="text-rose-600">*</span>
                </span>
                <input
                  name="skills"
                  value={form.skills}
                  onChange={handleChange}
                  required
                  className="border border-[#EEF2FF] rounded-lg px-3 py-2"
                  placeholder="e.g. React, JavaScript, Tailwind"
                />
              </label>

              <label className="flex flex-col gap-1 text-sm text-slate-700">
                <span>Highlight Tags</span>
                <input
                  name="cardTags"
                  value={form.cardTags}
                  onChange={handleChange}
                  className="border border-[#EEF2FF] rounded-lg px-3 py-2"
                  placeholder="e.g. Immediate Joiner, PPO"
                />
              </label>

              <label className="flex flex-col gap-1 text-sm text-slate-700">
                <span>Internship Type</span>
                <select
                  name="internshipType"
                  value={form.internshipType}
                  onChange={handleChange}
                  className="border border-[#EEF2FF] rounded-lg px-3 py-2"
                >
                  <option value="">Select internship type</option>

                  <option value="Teaching (Internship)">Teaching (Internship)</option>
                  <option value="Summer (Courses)">Summer Internship</option>
                  <option value="Winter (Courses)">Winter Internship</option>
                  <option value="NGO / Social Work">NGO / Social Work</option>
                  <option value="Campus Ambassador">Campus Ambassador</option>
                  <option value="Apprenticeships">Apprenticeships</option>
                  <option value="Externships">Externships</option>

                  <option value="Government Internship">Government Internship</option>
                  <option value="Research Internships">Research Internships</option>
                  <option value="Assessment Internships">Assessment Internships</option>
                </select>
              </label>



              <label className="md:col-span-2 flex flex-col gap-1 text-sm text-slate-700">
                <span>Who Can Apply (Eligibility)</span>
                <textarea
                  name="whoCanApply"
                  value={form.whoCanApply}
                  onChange={handleChange}
                  placeholder="e.g. Final year students, B.Tech CS"
                  className="border border-[#EEF2FF] rounded-lg px-3 py-2 min-h-20"
                />
              </label>

              <div className="md:col-span-2 rounded-xl border border-[#EEF2FF] p-4 bg-[#FAFCFF]">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="block text-sm font-medium text-slate-700">
                      Required Skills <span className="text-rose-600">*</span>
                    </span>
                    <p className="text-xs text-slate-500 mt-1">
                      Add at least 3 required skills. Use Add Skill for more.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={addRequiredSkillInput}
                    className="px-3 py-1.5 rounded-md bg-[#1F2853] text-white text-sm font-semibold"
                  >
                    Add Skill
                  </button>
                </div>

                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                  {requiredSkillInputs.map((skill, index) => (
                    <label
                      key={`required-skill-${index}`}
                      className="flex flex-col gap-1 text-sm text-slate-700"
                    >
                      <span>
                        Skill {index + 1}{" "}
                        {index < 3 ? (
                          <span className="text-rose-600">*</span>
                        ) : null}
                      </span>
                      <input
                        type="text"
                        value={skill}
                        onChange={(event) =>
                          handleRequiredSkillChange(index, event.target.value)
                        }
                        placeholder={`Skill ${index + 1}`}
                        className="border border-[#EEF2FF] rounded-lg px-3 py-2"
                        required={index < 3}
                      />
                    </label>
                  ))}
                </div>
              </div>

              <div className="md:col-span-2 rounded-xl border border-[#EEF2FF] p-4 bg-[#FAFCFF]">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="block text-sm font-medium text-slate-700">
                      Benefits <span className="text-rose-600">*</span>
                    </span>
                    <p className="text-xs text-slate-500 mt-1">
                      Add at least 4 benefits. Use Add Benefit for more.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={addBenefitInput}
                    className="px-3 py-1.5 rounded-md bg-[#1F2853] text-white text-sm font-semibold"
                  >
                    Add Benefit
                  </button>
                </div>

                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                  {benefitInputs.map((benefit, index) => (
                    <label
                      key={`benefit-${index}`}
                      className="flex flex-col gap-1 text-sm text-slate-700"
                    >
                      <span>
                        Benefit {index + 1}{" "}
                        {index < 4 ? (
                          <span className="text-rose-600">*</span>
                        ) : null}
                      </span>
                      <input
                        type="text"
                        value={benefit}
                        onChange={(event) =>
                          handleBenefitChange(index, event.target.value)
                        }
                        placeholder={`Benefit ${index + 1}`}
                        className="border border-[#EEF2FF] rounded-lg px-3 py-2"
                        required={index < 4}
                      />
                    </label>
                  ))}
                </div>
              </div>

              <label className="md:col-span-2 flex flex-col gap-1 text-sm text-slate-700">
                <span>
                  Detailed Job Description{" "}
                  <span className="text-rose-600">*</span>
                </span>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Describe responsibilities, expectations, and role details"
                  required
                  className="border border-[#EEF2FF] rounded-lg px-3 py-2 min-h-28"
                />
              </label>

              <div className="md:col-span-2 rounded-xl border border-[#EEF2FF] p-4 bg-[#FAFCFF]">
                <h3 className="text-sm font-semibold text-slate-800">
                  Company Details
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Add organization details shown in the About the Company
                  section.
                </p>

                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                  <label className="flex flex-col gap-1 text-sm text-slate-700">
                    <span>Department</span>
                    <input
                      name="department"
                      value={form.department}
                      onChange={handleChange}
                      placeholder="e.g. Engineering"
                      className="border border-[#EEF2FF] rounded-lg px-3 py-2"
                    />
                  </label>

                  <label className="flex flex-col gap-1 text-sm text-slate-700">
                    <span>Functional Role</span>
                    <input
                      name="functionalRole"
                      value={form.functionalRole}
                      onChange={handleChange}
                      placeholder="e.g. Front end developer"
                      className="border border-[#EEF2FF] rounded-lg px-3 py-2"
                    />
                  </label>

                  <label className="flex flex-col gap-1 text-sm text-slate-700">
                    <span>Company Type</span>
                    <input
                      name="companyType"
                      value={form.companyType}
                      onChange={handleChange}
                      placeholder="e.g. Product Company"
                      className="border border-[#EEF2FF] rounded-lg px-3 py-2"
                    />
                  </label>

                  <label className="flex flex-col gap-1 text-sm text-slate-700">
                    <span>Company Size</span>
                    <input
                      name="companySize"
                      value={form.companySize}
                      onChange={handleChange}
                      placeholder="e.g. 200-500 Employees"
                      className="border border-[#EEF2FF] rounded-lg px-3 py-2"
                    />
                  </label>

                  <label className="flex flex-col gap-1 text-sm text-slate-700">
                    <span>Founded Year</span>
                    <input
                      type="number"
                      min="1800"
                      max="2100"
                      name="foundedYear"
                      value={form.foundedYear}
                      onChange={handleChange}
                      placeholder="e.g. 2000"
                      className="border border-[#EEF2FF] rounded-lg px-3 py-2"
                    />
                  </label>

                  <label className="flex flex-col gap-1 text-sm text-slate-700">
                    <span>Industry</span>
                    <input
                      name="industry"
                      value={form.industry}
                      onChange={handleChange}
                      placeholder="e.g. SaaS"
                      className="border border-[#EEF2FF] rounded-lg px-3 py-2"
                    />
                  </label>
                </div>
              </div>
            </>
          )}

          <div className="md:col-span-2 flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={busy}
              className="px-5 py-2.5 rounded-lg bg-[#1F2853] hover:bg-[#162040] text-white font-semibold disabled:opacity-60"
            >
              {busy
                ? isEditMode
                  ? "Updating..."
                  : "Creating..."
                : isEditMode
                  ? "Update Opportunity"
                  : heading}
            </button>
            <button
              type="button"
              onClick={() => navigate(dashboardPath)}
              className="px-5 py-2.5 rounded-lg bg-slate-100 text-slate-900 font-semibold"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminOpportunityFormPage;
