import React from "react";

const GenderRadioGroup = ({ value, onChange, disabled }) => {
  return (
    <div>
      <label className="text-sm font-medium">Gender</label>
      <div className="flex space-x-6 mt-2">
        {["male", "female", "other"].map((gender) => (
          <div key={gender} className="flex items-center space-x-2">
            <input
              type="radio"
              id={`gender-${gender}`}
              name="gender"
              value={gender}
              checked={value === gender}
              onChange={(e) => onChange(e.target.value)}
              disabled={disabled}
              className="h-4 w-4 text-red-600 border-gray-300 focus:ring-blue-500"
            />
            <label
              htmlFor={`gender-${gender}`}
              className="text-sm font-medium text-gray-700"
            >
              {gender.charAt(0).toUpperCase() + gender.slice(1)}
            </label>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GenderRadioGroup;
