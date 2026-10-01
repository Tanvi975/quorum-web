import { useState } from "react";
import { FiEye, FiEyeOff } from "react-icons/fi";

function AuthInput({ label, type = "text", value, onChange, placeholder, error, hint , belowRight}) {
  const [show, setShow] = useState(false);
  const isPassword = type === "password";

  return (
<div className="mb-3">
  <label className="block text-sm font-semibold text-[#0F172A] mb-1">{label}</label>
      <div className="relative">
        <input
          type={isPassword && show ? "text" : type}
          value={value}
          onChange={onChange}
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
            {show ? <FiEye /> : <FiEyeOff/>}
          </button>
        )}
      </div>
      <div className="h-5 mt-1 flex items-center justify-between gap-2">
  <p className={`text-xs ${error ? "text-red-500" : "text-gray-500"}`}>
    {error || hint || ""}
  </p>
  {belowRight}
</div>
    </div>
  );
}

export default AuthInput;
