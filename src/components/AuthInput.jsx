
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
    <div className="relative mb-3 w-full min-w-0">
      <label className="mb-1 block text-sm font-semibold text-[#0F172A]">
        {label}
      </label>

      <div className="relative w-full min-w-0">
        <input
          type={isPassword && show ? "text" : type}
          value={value}
          onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          autoComplete={
            label === "Confirm Password"
              ? "new-password"
              : label === "Password"
              ? "current-password"
              : type === "email"
              ? "email"
              : undefined
          }
          className={`block w-full min-w-0 rounded-xl border bg-gray-100 px-3 py-2.5 text-base outline-none transition placeholder:text-sm placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 sm:px-4 sm:text-sm ${
            isPassword ? "pr-11" : ""
          } ${
            error ? "border-red-500" : "border-gray-300"
          }`}
        />

        {isPassword && (
          <button
            type="button"
            onClick={() => setShow((previous) => !previous)}
            aria-label={show ? "Hide password" : "Show password"}
            aria-pressed={show}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            {show ? <FiEye size={18} /> : <FiEyeOff size={18} />}
          </button>
        )}

        {checklist && focused && (
          <div className="absolute left-0 right-0 top-full z-30 mt-2 w-full min-w-0">
            <div className="absolute -top-1.5 left-5 h-3 w-3 rotate-45 border-l border-t border-gray-200 bg-white" />

            <div className="relative rounded-xl border border-gray-200 bg-white p-2.5 shadow-lg sm:p-3">
              {checklist.map((rule, index) => {
                const passed = rule.test(value);

                return (
                  <div
                    key={index}
                    className="flex min-w-0 items-start gap-1.5 py-0.5 text-xs"
                  >
                    {passed ? (
                      <FiCheck className="mt-0.5 shrink-0 text-green-600" />
                    ) : (
                      <FiX className="mt-0.5 shrink-0 text-red-500" />
                    )}

                    <span
                      className={`min-w-0 break-words ${
                        passed ? "text-green-600" : "text-red-500"
                      }`}
                    >
                      {rule.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="mt-1 flex min-h-5 w-full min-w-0 items-start justify-between gap-2">
        <p
          className={`min-w-0 flex-1 break-words text-xs leading-relaxed ${
            error ? "text-red-500" : "text-gray-500"
          }`}
        >
          {error || hint || ""}
        </p>

        {belowRight && (
          <div className="shrink-0">
            {belowRight}
          </div>
        )}
      </div>
    </div>
  );
}

export default AuthInput;
