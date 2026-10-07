import { Link, useNavigate } from "react-router-dom";
import { HiOutlineAcademicCap, HiOutlineBriefcase } from "react-icons/hi2";
import logo from "../../../assets/logo.png";

const ChooseSignup = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
       <div className="w-[1250px] mx-auto py-2 px-3">

         <Link to='/' className="overflow-hidden">
                      <img src={logo} alt="edeco logo" className="object-cover h-[65px]"/>
                    </Link>

       </div>

      <div className="flex-1 flex justify-center items-center px-4 ">
        <div className="flex flex-col md:flex-row gap-8 max-w-5xl w-full justify-center">
          
          {/* Student Card */}
          <div className="bg-white rounded-lg border border-slate-200 p-5 flex flex-col items-center text-center w-full max-w-[340px] transition-shadow">
            <div className="h-48 w-full bg-[#EEF2FF] rounded-lg mb-8 flex items-center justify-center text-indigo-500">
              {/* Placeholder for Student Illustration */}
              <HiOutlineAcademicCap size={80} strokeWidth={1} />
            </div>
            <h2 className="text-[28px] font-bold text-slate-800 mb-4">Student</h2>
            <p className="text-slate-500 mb-8 px-2 flex-1 font-medium">
              Create a student profile to discover Career Option, track applications, and build your career.
            </p>
            <button 
              onClick={() => navigate('/signup?type=student')}
              className=" bg-red-600 text-white py-2 px-8 rounded-lg font-semibold text-lg"
            >
              Register Free
            </button>
          </div>

          {/* Employer Card */}
          <div className="bg-white rounded-lg border border-slate-200 p-5 flex flex-col items-center text-center w-full max-w-[340px]  transition-shadow">
            <div className="h-48 w-full bg-[#EEF2FF] rounded-lg mb-8 flex items-center justify-center text-emerald-500">
              {/* Placeholder for Employer Illustration */}
              <HiOutlineBriefcase size={80} strokeWidth={1} />
            </div>
            <h2 className="text-[28px] font-bold text-slate-800 mb-4">Employer</h2>
            <p className="text-slate-500 mb-8 px-2 flex-1 font-medium">
              Create an employer profile to post opportunities, manage applications, and hire top talent.
            </p>
            <button 
              onClick={() => navigate('/signup?type=employer')}
              className=" bg-red-600 text-white py-2 px-8 rounded-lg font-semibold text-lg"
            >
              Post Requirment 
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ChooseSignup;
