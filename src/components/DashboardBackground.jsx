import cloud1 from "../assets/dashboard-cloud-1.svg";
import cloud2 from "../assets/dashboard-cloud-2.svg";

function DashboardBackground() {
  return (
    <div
    className="pointer-events-none absolute inset-x-0 top-0 -z-10 w-full overflow-hidden"
      style={{
        minHeight: "100vh",
        backgroundImage:
          "linear-gradient(to bottom, #062C5F 0%, #7698C5 29%, #868686 54%, #FFFFFF 85%)",
      }}
    >
      <img
        src={cloud1}
        alt=""
        className="absolute left-1/2 top-0 w-[1200px] max-w-none -translate-x-1/2 opacity-80 sm:w-[1500px] lg:w-[1986px]"
        style={{ top: "300px", filter: "blur(60px)" }}
      />
      <img
        src={cloud2}
        alt=""
        className="absolute left-1/2 w-[900px] max-w-none -translate-x-1/2 opacity-60 sm:w-[1100px] lg:w-[1440px]"
        style={{ top: "900px", filter: "blur(10px)" }}
      />
    </div>
  );
}

export default DashboardBackground;