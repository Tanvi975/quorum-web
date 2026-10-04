function OptionCard({ icon, badge, title, description, selected, onClick, horizontal, button }) {
    return (
      <div
        onClick={onClick}
        className={`cursor-pointer rounded-xl ${horizontal ? "flex items-center justify-between p-3 gap-2" : "flex flex-col gap-5 p-5"}`}
        style={{
          backgroundColor: selected ? "rgba(30, 41, 59, 0.4)" : "rgba(30, 41, 59, 0.3)",
          border: selected ? "1px solid rgba(56, 189, 248, 0.8)" : "1px solid #334155",
        }}
      >
        <div className={horizontal ? "flex items-center gap-2" : ""}>
          {icon && <span className="text-white/80">{icon}</span>}
          <div>
            <div className="flex items-center gap-2 justify-between">
              <h3 className="text-white font-semibold text-sm">{title}</h3>
              {badge && (
                <span className="text-[10px] text-white/60 border border-white/20 rounded px-1.5 py-0.5">
                  {badge}
                </span>
              )}
            </div>
            <p className="text-xs text-white/60 mt-1 leading-snug">{description}</p>
          </div>
        </div>
        {button}
      </div>
    );
  }
  
  export default OptionCard;