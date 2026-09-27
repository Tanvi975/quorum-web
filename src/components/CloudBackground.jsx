function CloudBackground({ children }) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-blue-950 via-blue-600 to-sky-200">
        <div className="absolute -top-10 -left-10 w-96 h-96 bg-white/40 rounded-full blur-3xl"></div>
        <div className="absolute top-1/3 left-1/4 w-80 h-80 bg-white/30 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-full h-64 bg-white/50 blur-3xl"></div>
        <div className="absolute top-1/4 right-10 w-72 h-72 bg-white/30 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 right-1/4 w-96 h-72 bg-white/40 rounded-full blur-3xl"></div>
  
        <div className="relative z-10">{children}</div>
      </div>
    );
  }
  
  export default CloudBackground;