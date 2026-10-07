import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { FiEye, FiEyeOff, FiUpload } from "react-icons/fi";
import { useOpportunities } from "../../../context/OpportunitiesContext";
import { sendSignupOtps } from "../../../services/authAPI";

const Signup = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTarget = searchParams.get("redirect") || "";
  const { signup, adminSignup } = useOpportunities();
  const [accountType, setAccountType] = useState(searchParams.get("type") || "student");
  const [studentResumeName, setStudentResumeName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [verificationEmail, setVerificationEmail] = useState("");
  const [emailCode, setEmailCode] = useState("");
  const [phoneCode, setPhoneCode] = useState("");
  const [isVerified, setIsVerified] = useState(false);
  const [studentForm, setStudentForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    mobileNumber: "",
    password: "",
    confirmPassword: "",
    latestQualification: "",
    yearOfPassing: "",
    collegeName: "",
    location: "",
    agreeToWhatsAppUpdates: true,
  });
  const [studentResumeFile, setStudentResumeFile] = useState(null);
  const [employerForm, setEmployerForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    password: "",
    confirmPassword: "",
    organizationName: "",
    organizationType: "",
    username: "",
    agreeToWhatsAppUpdates: true,
  });
  const [showPassword, setShowPassword] = useState({
    studentPassword: false,
    studentConfirmPassword: false,
    employerPassword: false,
    employerConfirmPassword: false,
  });

  const togglePasswordVisibility = (key) => {
    setShowPassword((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleStudentChange = (event) => {
    const { name, value } = event.target;
    setStudentForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleStudentResumeChange = (event) => {
    const file = event.target.files?.[0];
    setStudentResumeFile(file || null);
    setStudentResumeName(file ? file.name : "");
  };

  const handleEmployerChange = (event) => {
    const { name, value } = event.target;
    setEmployerForm((prev) => ({ ...prev, [name]: value }));
  };

  const applyOtpDeliveryStatus = (response) => {
    const emailSent = response?.email?.sent;

    // [WHATSAPP-OTP-DISABLED 2026-08-27] Only the email OTP is used for now.
    // WhatsApp OTP delivery/checks are commented out until re-enabled.
    if (emailSent) {
      setSuccess("Code sent. Check your email for the verification code.");
      return;
    }

    setError(`Email code failed: ${response?.email?.message || "delivery failed"}`);

    // const phoneSent = response?.phone?.sent;
    //
    // if (emailSent && phoneSent) {
    //   setSuccess("Codes sent. Check your email and WhatsApp for verification codes.");
    //   return;
    // }
    //
    // const issues = [];
    // if (!emailSent) {
    //   issues.push(`Email code failed: ${response?.email?.message || "delivery failed"}`);
    // }
    // if (!phoneSent) {
    //   issues.push(`WhatsApp code failed: ${response?.phone?.message || "delivery failed"}`);
    // }
    // setError(issues.join(" "));
    // if (emailSent || phoneSent) {
    //   setSuccess(
    //     `${emailSent ? "Email code sent." : ""}${phoneSent ? " WhatsApp code sent." : ""}`.trim(),
    //   );
    // }
  };

  const handleStudentSignup = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    const fullName = `${studentForm.firstName} ${studentForm.lastName}`.trim();

    if (
      !fullName ||
      !studentForm.email ||
      !studentForm.mobileNumber ||
      !studentForm.password ||
      !studentForm.latestQualification ||
      !studentForm.yearOfPassing ||
      !studentForm.collegeName ||
      !studentForm.location ||
      !studentResumeFile
    ) {
      setError("Please fill all required fields, including qualification, year, college, location, and resume.");
      return;
    }

    if (studentForm.password !== studentForm.confirmPassword) {
      setError("Password and confirm password do not match.");
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await sendSignupOtps({
        email: studentForm.email,
        whatsappNumber: studentForm.mobileNumber,
        fullName,
      });
      setVerificationEmail(studentForm.email);
      setEmailCode("");
      setPhoneCode("");
      setIsVerified(false);
      applyOtpDeliveryStatus(response);
    } catch (apiError) {
      setError(
        apiError?.response?.data?.message ||
          "Unable to send verification codes right now.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEmployerSignup = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    const fullName = `${employerForm.firstName} ${employerForm.lastName}`.trim();

    if (
      !fullName ||
      !employerForm.email ||
      !employerForm.phoneNumber ||
      !employerForm.password
    ) {
      setError("Please fill all required fields.");
      return;
    }

    if (employerForm.password !== employerForm.confirmPassword) {
      setError("Password and confirm password do not match.");
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await sendSignupOtps({
        email: employerForm.email,
        whatsappNumber: employerForm.phoneNumber,
        fullName,
      });
      setVerificationEmail(employerForm.email);
      setEmailCode("");
      setPhoneCode("");
      setIsVerified(false);
      applyOtpDeliveryStatus(response);
    } catch (apiError) {
      setError(
        apiError?.response?.data?.message ||
          "Unable to send verification codes right now.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyAndCreate = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    // [WHATSAPP-OTP-DISABLED 2026-08-27] Only the email code is required for now.
    // if (!emailCode || !phoneCode) {
    //   setError("Both the email and WhatsApp verification codes are required.");
    //   return;
    // }
    if (!emailCode) {
      setError("The email verification code is required.");
      return;
    }

    try {
      setIsSubmitting(true);

      if (accountType === "student") {
        const fullName = `${studentForm.firstName} ${studentForm.lastName}`.trim();
        const formData = new FormData();
        formData.append("firstName", String(studentForm.firstName || "").trim());
        formData.append("lastName", String(studentForm.lastName || "").trim());
        formData.append("fullName", fullName);
        formData.append("email", studentForm.email);
        formData.append("password", studentForm.password);
        formData.append("whatsappNumber", studentForm.mobileNumber);
        formData.append("latestQualification", studentForm.latestQualification);
        formData.append("yearOfPassing", studentForm.yearOfPassing);
        formData.append("collegeName", studentForm.collegeName);
        formData.append("location", studentForm.location);
        formData.append("agreeToWhatsAppUpdates", String(studentForm.agreeToWhatsAppUpdates));
        formData.append("resume", studentResumeFile);
        formData.append("emailCode", emailCode);
        // [WHATSAPP-OTP-DISABLED 2026-08-27] WhatsApp code not collected/sent for now.
        // formData.append("phoneCode", phoneCode);

        await signup(formData);
      } else {
        const fullName = `${employerForm.firstName} ${employerForm.lastName}`.trim();
        await adminSignup({
          firstName: String(employerForm.firstName || "").trim(),
          lastName: String(employerForm.lastName || "").trim(),
          fullName,
          email: employerForm.email,
          password: employerForm.password,
          whatsappNumber: employerForm.phoneNumber,
          organizationName: employerForm.organizationName,
          organizationType: employerForm.organizationType,
          username: employerForm.username,
          agreeToWhatsAppUpdates: employerForm.agreeToWhatsAppUpdates,
          emailCode,
          // [WHATSAPP-OTP-DISABLED 2026-08-27] WhatsApp code not collected/sent for now.
          // phoneCode,
        });
      }

      setIsVerified(true);
      setSuccess("Account created and verified successfully.");
    } catch (apiError) {
      setError(
        apiError?.response?.data?.message ||
          "Unable to verify codes and create your account.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendCodes = async () => {
    setError("");
    setSuccess("");

    if (!verificationEmail) {
      setError("Email is required to resend verification codes.");
      return;
    }

    try {
      setIsSubmitting(true);
      const fullName =
        accountType === "student"
          ? `${studentForm.firstName} ${studentForm.lastName}`.trim()
          : `${employerForm.firstName} ${employerForm.lastName}`.trim();
      const whatsappNumber =
        accountType === "student" ? studentForm.mobileNumber : employerForm.phoneNumber;

      const response = await sendSignupOtps({ email: verificationEmail, whatsappNumber, fullName });
      applyOtpDeliveryStatus(response);
    } catch (apiError) {
      setError(
        apiError?.response?.data?.message || "Unable to resend verification codes.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (verificationEmail) {
    return (
      <div className="min-h-screen bg-white">
        <div className="flex flex-col items-center justify-center min-h-screen">
          <div className="w-full max-w-md mx-auto bg-white p-5 sm:p-8 rounded-lg border border-gray-200">
            <h2 className="text-xl text-center font-medium mb-2">
              Verify your account
            </h2>
            {/* [WHATSAPP-OTP-DISABLED 2026-08-27] Email OTP only for now. */}
            <p className="text-sm text-gray-600 text-center mb-6">
              We sent a one-time code to {verificationEmail}.
              Enter it below to complete account setup.
            </p>
            {/* <p className="text-sm text-gray-600 text-center mb-6">
              We sent one-time codes to {verificationEmail} and your WhatsApp number.
              Enter both codes below to complete account setup.
            </p> */}

            {error ? <p className="text-sm text-red-600 mb-3">{error}</p> : null}
            {success ? (
              <p className="text-sm text-green-700 mb-3">{success}</p>
            ) : null}

            {!isVerified ? (
              <form onSubmit={handleVerifyAndCreate} className="mb-5">
                <label className="font-medium text-gray-700 block mb-1.5 text-[15px]">
                  Email verification code
                </label>
                <input
                  type="text"
                  value={emailCode}
                  onChange={(event) => setEmailCode(event.target.value)}
                  className="outline-none border border-gray-300 rounded-lg py-2 px-3 w-full mb-4"
                  placeholder="Enter 6-digit code"
                  required
                />

                {/* [WHATSAPP-OTP-DISABLED 2026-08-27] WhatsApp OTP field hidden for now.
                <label className="font-medium text-gray-700 block mb-1.5 text-[15px]">
                  WhatsApp verification code
                </label>
                <input
                  type="text"
                  value={phoneCode}
                  onChange={(event) => setPhoneCode(event.target.value)}
                  className="outline-none border border-gray-300 rounded-lg py-2 px-3 w-full mb-4"
                  placeholder="Enter 6-digit code"
                  required
                />
                */}

                <button
                  type="button"
                  onClick={handleResendCodes}
                  disabled={isSubmitting}
                  className="text-sm text-red-600 mb-4 block"
                >
                  Resend code
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full px-4 py-3 rounded-lg bg-red-600 text-white font-medium disabled:opacity-60"
                >
                  {isSubmitting ? "Verifying..." : "Verify and Create Account"}
                </button>
              </form>
            ) : (
              <div className="flex justify-center py-3 rounded-lg bg-green-700 text-white text-sm font-medium mb-5">
                <button
                  type="button"
                  onClick={() =>
                    navigate(
                      redirectTarget
                        ? `/login?redirect=${encodeURIComponent(redirectTarget)}`
                        : "/login",
                    )
                  }
                >
                  Continue to Login
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  const inputClass =
    "outline-none border border-gray-200 rounded py-2.5 px-4 w-full text-gray-800 text-[15px] focus:border-gray-400 focus:ring-0";
  const labelClass = "font-medium text-gray-700 block mb-1.5 text-[14px]";

  return (
    <div className="flex h-screen w-full font-sans overflow-hidden">
      {/* Left side */}
      <div className="hidden lg:flex w-[50%] h-screen shrink-0 bg-[#1F2853] flex-col p-12 text-white relative justify-center">
        <Link to="/" className="absolute top-8 left-12 text-3xl font-bold">
          edeco<span className="text-white">®</span>
        </Link>

        {accountType === "student" ? (
          <div className="max-w-md">
            <h1 className="text-[30px] font-bold leading-[1.3] mb-6">
              Discover career options built for you
            </h1>
            <p className="text-[16px] text-gray-200 leading-relaxed">
              Create a student profile to explore opportunities, track your
              applications, and build the career you want.
            </p>
          </div>
        ) : (
          <div className="max-w-md">
            <h1 className="text-[30px] font-bold leading-[1.3] mb-6">
              Hire top talent, faster
            </h1>
            <p className="text-[16px] text-gray-200 leading-relaxed">
              Create an employer profile to post opportunities, manage
              applications, and connect with the right candidates.
            </p>
          </div>
        )}
      </div>

      {/* Right side - Form */}
      <div className="w-full lg:w-[55%] h-screen flex flex-col bg-white p-5 relative overflow-y-auto">
        <div className="w-full max-w-sm mx-auto relative z-10 py-10 m-auto">
          <h2 className="text-[26px] font-bold text-[#1F2853] mb-6 text-center">
            {accountType === "student"
              ? "Create your student account"
              : "Create your employer account"}
          </h2>

          {error ? (
            <div className="mb-4 p-4 bg-red-50 text-red-600 rounded text-[14px] border border-red-100">
              {error}
            </div>
          ) : null}
          {success ? (
            <div className="mb-4 p-4 bg-green-50 text-green-700 rounded text-[14px] border border-green-100">
              {success}
            </div>
          ) : null}

          {accountType === "student" ? (
            <form onSubmit={handleStudentSignup} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={studentForm.firstName}
                    onChange={handleStudentChange}
                    placeholder="First Name"
                    className={inputClass}
                    required
                  />
                </div>
                <div>
                  <label className={labelClass}>Last Name</label>
                  <input
                    type="text"
                    name="lastName"
                    value={studentForm.lastName}
                    onChange={handleStudentChange}
                    placeholder="Last Name"
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={studentForm.email}
                  onChange={handleStudentChange}
                  placeholder="Email"
                  className={inputClass}
                  required
                />
              </div>

              <div>
                <label className={labelClass}>
                  Phone <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  name="mobileNumber"
                  value={studentForm.mobileNumber}
                  onChange={handleStudentChange}
                  placeholder="Phone Number"
                  className={inputClass}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>
                    Qualification <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="latestQualification"
                    value={studentForm.latestQualification}
                    onChange={handleStudentChange}
                    className={inputClass}
                    required
                  >
                    <option value="">Select</option>
                    <option value="10th">10th</option>
                    <option value="11th">11th</option>
                    <option value="12th">12th</option>
                    <option value="ITI">ITI</option>
                    <option value="Diploma">Diploma</option>
                    <option value="Bachelor's">Bachelor's</option>
                    <option value="Master's">Master's</option>
                    <option value="Phd">Phd</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>
                    Year of Passing <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="yearOfPassing"
                    value={studentForm.yearOfPassing}
                    onChange={handleStudentChange}
                    className={inputClass}
                    required
                  >
                    <option value="">Select</option>
                    <option value="2021">2021</option>
                    <option value="2022">2022</option>
                    <option value="2023">2023</option>
                    <option value="2024">2024</option>
                    <option value="2025">2025</option>
                    <option value="2026">2026</option>
                  </select>
                </div>
              </div>

              <div>
                <label className={labelClass}>
                  College / Institute Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="collegeName"
                  value={studentForm.collegeName}
                  onChange={handleStudentChange}
                  placeholder="Enter institute name"
                  className={inputClass}
                  required
                />
              </div>

              <div>
                <label className={labelClass}>
                  Location <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="location"
                  value={studentForm.location}
                  onChange={handleStudentChange}
                  placeholder="City, State"
                  className={inputClass}
                  required
                />
              </div>

              <div>
                <label className={labelClass}>
                  Create Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword.studentPassword ? "text" : "password"}
                    name="password"
                    value={studentForm.password}
                    onChange={handleStudentChange}
                    placeholder="Enter Password"
                    className={`${inputClass} pr-10`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility("studentPassword")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword.studentPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label className={labelClass}>
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword.studentConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={studentForm.confirmPassword}
                    onChange={handleStudentChange}
                    placeholder="Re-enter Password"
                    className={`${inputClass} pr-10`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility("studentConfirmPassword")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword.studentConfirmPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="student-whatsapp-updates"
                  name="agreeToWhatsAppUpdates"
                  checked={studentForm.agreeToWhatsAppUpdates}
                  onChange={(e) =>
                    setStudentForm((prev) => ({
                      ...prev,
                      agreeToWhatsAppUpdates: e.target.checked,
                    }))
                  }
                />
                <label htmlFor="student-whatsapp-updates" className="text-sm text-gray-600 cursor-pointer">
                  I would like to receive important updates via WhatsApp.
                </label>
              </div>

              <div>
                <label className={labelClass}>
                  Upload Resume <span className="text-red-500">*</span>
                </label>
                <input
                  id="student-resume-upload"
                  type="file"
                  accept=".pdf"
                  onChange={handleStudentResumeChange}
                  className="sr-only"
                />
                <label
                  htmlFor="student-resume-upload"
                  className="w-full border border-dashed border-gray-300 rounded px-4 py-3 text-gray-600 flex items-center gap-3 cursor-pointer hover:border-gray-400 hover:text-red-600 transition font-medium"
                >
                  <FiUpload className="text-lg" />
                  <span className="text-[15px]">Upload resume (PDF Only)</span>
                </label>
                {studentResumeName ? (
                  <p className="text-xs text-gray-500 mt-1.5">Selected: {studentResumeName}</p>
                ) : null}
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-red-600 text-white rounded py-3.5 font-bold text-[14px] uppercase tracking-wider transition-colors shadow-sm disabled:opacity-70 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Submitting...
                    </>
                  ) : (
                    "Create Account"
                  )}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleEmployerSignup} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={employerForm.firstName}
                    onChange={handleEmployerChange}
                    placeholder="First Name"
                    className={inputClass}
                    required
                  />
                </div>
                <div>
                  <label className={labelClass}>Last Name</label>
                  <input
                    type="text"
                    name="lastName"
                    value={employerForm.lastName}
                    onChange={handleEmployerChange}
                    placeholder="Last Name"
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>
                  Work Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={employerForm.email}
                  onChange={handleEmployerChange}
                  placeholder="name@company.com"
                  className={inputClass}
                  required
                />
              </div>

              <div>
                <label className={labelClass}>
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="phoneNumber"
                  value={employerForm.phoneNumber}
                  onChange={handleEmployerChange}
                  placeholder="10 digit number"
                  className={inputClass}
                  required
                />
              </div>

              <div>
                <label className={labelClass}>
                  Organisation Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="organizationName"
                  value={employerForm.organizationName}
                  onChange={handleEmployerChange}
                  placeholder="Enter organization name"
                  className={inputClass}
                  required
                />
              </div>

              <div>
                <label className={labelClass}>
                  Organisation Type <span className="text-red-500">*</span>
                </label>
                <select
                  name="organizationType"
                  value={employerForm.organizationType}
                  onChange={handleEmployerChange}
                  className={inputClass}
                  required
                >
                  <option value="">Select organization type</option>
                  <option value="Startup">Startup</option>
                  <option value="Enterprise">Enterprise</option>
                  <option value="Ed Tech">Ed Tech</option>
                  <option value="NGO">NGO</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className={labelClass}>
                  Username <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="username"
                  value={employerForm.username}
                  onChange={handleEmployerChange}
                  placeholder="Enter username"
                  className={inputClass}
                  required
                />
              </div>

              <div>
                <label className={labelClass}>
                  Create Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword.employerPassword ? "text" : "password"}
                    name="password"
                    value={employerForm.password}
                    onChange={handleEmployerChange}
                    placeholder="Enter Password"
                    className={`${inputClass} pr-10`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility("employerPassword")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword.employerPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label className={labelClass}>
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword.employerConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={employerForm.confirmPassword}
                    onChange={handleEmployerChange}
                    placeholder="Re-enter Password"
                    className={`${inputClass} pr-10`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility("employerConfirmPassword")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword.employerConfirmPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="employer-whatsapp-updates"
                  name="agreeToWhatsAppUpdates"
                  checked={employerForm.agreeToWhatsAppUpdates}
                  onChange={(e) =>
                    setEmployerForm((prev) => ({
                      ...prev,
                      agreeToWhatsAppUpdates: e.target.checked,
                    }))
                  }
                />
                <span className="text-sm text-gray-600">
                  I agree to edeco{" "}
                  <Link to="" className="text-red-600">Terms & Conditions</Link> and{" "}
                  <Link to="" className="text-red-600">Privacy Policy</Link>
                </span>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-red-600 text-white rounded py-3.5 font-bold text-[14px] uppercase tracking-wider transition-colors shadow-sm disabled:opacity-70 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Submitting...
                    </>
                  ) : (
                    "Create Account"
                  )}
                </button>
              </div>
            </form>
          )}

          <p className="text-gray-500 text-center text-sm pt-4">
            Already have an account?{" "}
            <Link to="/login" className="text-black font-semibold hover:underline">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
