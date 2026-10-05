import { useState } from "react";
import { FiEye, FiEyeOff, FiCheck, FiX } from "react-icons/fi";

function AuthInput({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  error,
  hint,
  belowRight,
  checklist, 
}) {
  const [show, setShow] = useState(false);
  const [focused, setFocused] = useState(false);
  const isPassword = type === "password";

  return (
    <div className="mb-3 relative">
      <label className="block text-sm font-semibold text-[#0F172A] mb-1">{label}</label>
      <div className="relative">
        <input
          type={isPassword && show ? "text" : type}
          value={value}
          onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          className={`w-full rounded-xl bg-gray-100 border px-4 py-2.5 text-sm placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-blue-500 ${
            isPassword ? "pr-11" : ""
          } ${error ? "border-red-500" : "border-gray-300"}`}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow(!show)}
            aria-label={show ? "Hide password" : "Show password"}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
          >
            {show ? <FiEye /> : <FiEyeOff />}
          </button>
        )}

    
{checklist && focused && (
  <div className="absolute left-0 top-full mt-2 z-20 w-full">
    <div className="absolute -top-1.5 left-5 w-3 h-3 bg-white border-l border-t border-gray-200 rotate-45" />
    <div className="relative bg-white border border-gray-200 rounded-2xl shadow-lg p-2.5">
      {checklist.map((rule, i) => {
        const passed = rule.test(value);
        return (
          <div key={i} className="flex items-center gap-1.5 text-xs py-[1px]">
            {passed ? (
              <FiCheck className="text-green-600 shrink-0" />
            ) : (
              <FiX className="text-red-500 shrink-0" />
            )}
            <span className={passed ? "text-green-600" : "text-red-500"}>
              {rule.label}
            </span>
          </div>
        );
      })}
    </div>
  </div>
)}
      </div>

      <div className="min-h-5 mt-1 flex items-center justify-between gap-2">
        <p className={`text-xs ${error ? "text-red-500" : "text-gray-500"}`}>
          {error || hint || ""}
        </p>
        {belowRight}
      </div>
    </div>
  );
}

export default AuthInput;