
import cloud1 from "../assets/dashboard-cloud-1.svg";
import cloud2 from "../assets/dashboard-cloud-2.svg";

function DashboardBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
      style={{
        background:
          "linear-gradient(to bottom, #082F61 0px, #174778 420px, #527DA8 650px, #FFFFFF 1050px)",
      }}
    >
      <div
        className="absolute inset-x-0"
        style={{
          top: "420px",
          height: "430px",
        }}
      >
      
{/* First cloud layer — UPPER */}
<img
  src={cloud1}
  alt=""
  className="absolute left-1/2 max-w-none"
  style={{
    width: "min(150%, 1500px)",
    height: "auto",
    top: "0",
    transform: "translateX(-50%)",
    opacity: 0.8,
    filter: "blur(18px)",
    zIndex: 1,
  }}
/>

<img
  src={cloud2}
  alt=""
  className="absolute left-1/2 max-w-none"
  style={{
    width: "min(125%, 1250px)",
    height: "auto",
    top: "100px",
    transform: "translateX(-50%)",
    opacity: 0.72,
    filter: "blur(12px)",
    zIndex: 2,
  }}
/>
      </div>
    </div>
  );
}

export default DashboardBackground;
