
function AuthButton({ children, ...props }) {
    return (
      <button
        type="submit"
        {...props}
        style={{ backgroundImage: "linear-gradient(to right, #38BDF8, #1E3A8A)" }}
        className="w-full text-white font-medium py-2.5 rounded-xl shadow-md hover:opacity-90 transition"
      >
        {children}
      </button>
    );
  }
  
  export default AuthButton;
  