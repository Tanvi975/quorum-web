
function AuthButton({ children, ...props }) {
    return (
      <button
        type="submit"
        {...props}
        style={{ backgroundImage: "linear-gradient(to right, #0068FF, #003D99)" }}
        className="w-full min-w-0 rounded-xl px-4 py-2.5 text-sm font-medium text-white shadow-[0_8px_16px_-2px_rgba(37,99,235,0.3)] transition hover:shadow-[0_12px_24px_-4px_rgba(37,99,235,0.45)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transform-none motion-reduce:transition-none"
    >
        {children}
      </button>
    );
  }
  
  export default AuthButton;
  