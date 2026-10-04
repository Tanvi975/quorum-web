import cloud1 from "../assets/dashboard-cloud-1.svg";
import cloud2 from "../assets/dashboard-cloud-2.svg";

function DashboardBackground() {
  return (
    <div
      className="absolute top-0 left-0 w-full overflow-hidden pointer-events-none"
      style={{
        height: "3331px",
        backgroundImage:
          "linear-gradient(to bottom, #062C5F 0%, #7698C5 29%, #868686 54%, #FFFFFF 85%)",
      }}
    >
      <img
        src={cloud1}
        alt=""
        className="absolute left-1/2 -translate-x-1/2 w-[1986px] max-w-none opacity-80"
        style={{ top: "300px", filter: "blur(60px)" }}
      />
      <img
        src={cloud2}
        alt=""
        className="absolute left-1/2 -translate-x-1/2 w-[1440px] max-w-none opacity-60"
        style={{ top: "900px", filter: "blur(10px)" }}
      />
    </div>
  );
}

export default DashboardBackground;