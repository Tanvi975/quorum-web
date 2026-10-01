
function AuthButton({ children, ...props }) {
    return (
      <button
        type="submit"
        {...props}
        style={{ backgroundImage: "linear-gradient(to right, #0068FF, #003D99)" }}
      className="w-full text-white font-medium py-2.5 rounded-xl shadow-[0_8px_16px_-2px_rgba(37,99,235,0.3)] hover:opacity-90 transition"
    >
        {children}
      </button>
    );
  }
  
  export default AuthButton;
  