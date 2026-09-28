import { useState } from "react";
import { FiEye, FiEyeOff } from "react-icons/fi";

function AuthInput({ label, type = "text", value, onChange, placeholder, error, hint }) {
  const [show, setShow] = useState(false);
  const isPassword = type === "password";

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-[#0B2A5B] mb-1">{label}</label>
      <div className="relative">
        <input
          type={isPassword && show ? "text" : type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`w-full rounded-xl bg-gray-100 border px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 ${
            isPassword ? "pr-11" : ""
          } ${error ? "border-red-500" : "border-gray-500"}`}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow(!show)}
            aria-label={show ? "Hide password" : "Show password"}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
          >
            {show ? <FiEyeOff /> : <FiEye />}
          </button>
        )}
      </div>
      {error ? (
        <p className="text-xs text-red-500 mt-1">{error}</p>
      ) : hint ? (
        <p className="text-xs text-gray-500 mt-1">{hint}</p>
      ) : null}
    </div>
  );
}

export default AuthInput;
