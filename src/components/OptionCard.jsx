
function OptionCard({
  icon,
  badge,
  title,
  description,
  selected,
  onClick,
  horizontal,
  button,
}) {
  return (
    <div
      onClick={onClick}
      className={`min-w-0 h-full rounded-xl ${
        horizontal
          ? "flex items-center justify-between gap-2 p-3 sm:p-4"
          : "flex flex-col gap-4 p-4 sm:p-5"
      }`}
      style={{
        backgroundColor: selected
          ? "rgba(30, 55, 85, 0.38)"
          : "rgba(30, 55, 85, 0.22)",
        border: selected
          ? "1px solid rgba(120, 180, 255, 0.85)"
          : "1px solid rgba(255, 255, 255, 0.22)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
      }}
    >
      <div
        className={
          horizontal
            ? "flex min-w-0 items-center gap-2"
            : "flex w-full min-w-0 flex-col"
        }
      >

        {!horizontal && (
          <div className="mb-3 flex w-full items-center justify-between gap-2">
            {icon && (
              <span className="flex shrink-0 items-center text-white/80">
                {icon}
              </span>
            )}

            {badge && (
              <span className="shrink-0 rounded border border-white/25 px-1.5 py-0.5 text-[10px] text-white/70">
                {badge}
              </span>
            )}
          </div>
        )}

        {horizontal && icon && (
          <span className="shrink-0 text-white/80">{icon}</span>
        )}

        <div className="min-w-0 w-full">
          <div className="flex w-full items-center justify-center gap-2">
            <h3 className="w-full text-center text-sm font-semibold text-white">
              {title}
            </h3>

            {horizontal && badge && (
              <span className="shrink-0 rounded border border-white/25 px-1.5 py-0.5 text-[10px] text-white/70">
                {badge}
              </span>
            )}
          </div>

          <p className="mt-2 text-center text-xs leading-relaxed text-white/75 sm:text-sm">
            {description}
          </p>
        </div>
      </div>

      {button && (
        <div className={!horizontal ? "mt-auto w-full pt-2" : "w-full"}>
          {button}
        </div>
      )}
    </div>
  );
}

export default OptionCard;
