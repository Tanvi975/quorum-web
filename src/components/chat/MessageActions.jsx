
import { useEffect, useRef, useState } from "react";
import {
  FiCornerUpLeft,
  FiEdit2,
  FiSmile,
  FiMoreHorizontal,
  FiShare,
  FiTrash2,
  FiBookmark,
  FiCheckSquare,
} from "react-icons/fi";

export default function MessageActions({
  canEdit,
  canDeleteForEveryone,
  isSaved,
  isSelected,
  align = "right",
  onReply,
  onReact,
  onEdit,
  onForward,
  onDelete,
  onSave,
  onSelectForward,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });

  const wrapperRef = useRef(null);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);

  const closeMenu = () => setMenuOpen(false);

  const toggleMenu = () => {
    if (menuOpen) {
      closeMenu();
      return;
    }
  
    const bubble = wrapperRef.current?.parentElement;
    if (!bubble) return;
  
    const rect = bubble.getBoundingClientRect();
  
    const menuWidth = 200;
    const menuHeight = canEdit ? 270 : 235;
    const gap = 8;
    const padding = 12;
 
    let left =
      align === "right"
        ? rect.left - menuWidth - gap
        : rect.right + gap;
  
    if (left < padding || left + menuWidth > window.innerWidth - padding) {
      left =
        align === "right"
          ? rect.right - menuWidth
          : rect.left;
  
      left = Math.max(
        padding,
        Math.min(left, window.innerWidth - menuWidth - padding)
      );
    }
  
    let top = rect.top;
  
    if (top + menuHeight > window.innerHeight - padding) {
      top = rect.bottom + gap;
    }
  
    top = Math.max(
      padding,
      Math.min(top, window.innerHeight - menuHeight - padding)
    );
  
    setMenuPosition({ top, left });
    setMenuOpen(true);
  };
  

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        wrapperRef.current?.contains(event.target) ||
        menuRef.current?.contains(event.target)
      ) {
        return;
      }

      closeMenu();
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") closeMenu();
    };

    const handleScroll = () => closeMenu();

    document.addEventListener("pointerdown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);
    window.addEventListener("scroll", handleScroll, true);

    return () => {
      document.removeEventListener("pointerdown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, []);

  const runAction = (action) => {
    closeMenu();
    action?.();
  };

  const menuItems = [
    { label: "Reply", icon: FiCornerUpLeft, action: onReply },
    { label: "Forward", icon: FiShare, action: onForward },
    {
      label: isSaved ? "Remove bookmark" : "Save bookmark",
      icon: FiBookmark,
      action: onSave,
    },
    {
      label: isSelected ? "Deselect message" : "Select to forward",
      icon: FiCheckSquare,
      action: onSelectForward,
    },
    ...(canEdit
      ? [{ label: "Edit", icon: FiEdit2, action: onEdit }]
      : []),
      {
        label: "Delete",
        icon: FiTrash2,
        action: onDelete,
        danger: true,
      },
  ];

  return (
    <>
      <div
        ref={wrapperRef}
        className={`absolute top-0 z-30 -translate-y-full ${
          align === "left" ? "left-2" : "right-2"
        }`}
      >
        <div className="hidden items-center gap-0.5 rounded-lg border border-white/15 bg-[#0b1730] p-1 shadow-lg md:flex md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100">
          <button
            type="button"
            onClick={() => runAction(onReact)}
            title="React"
            aria-label="React"
            className="rounded-md p-2 text-white/75 hover:bg-white/10 hover:text-white"
          >
            <FiSmile size={15} />
          </button>

          <button
            type="button"
            onClick={() => runAction(onReply)}
            title="Reply"
            aria-label="Reply"
            className="rounded-md p-2 text-white/75 hover:bg-white/10 hover:text-white"
          >
            <FiCornerUpLeft size={15} />
          </button>

          {canEdit && (
            <button
              type="button"
              onClick={() => runAction(onEdit)}
              title="Edit"
              aria-label="Edit"
              className="rounded-md p-2 text-white/75 hover:bg-white/10 hover:text-white"
            >
              <FiEdit2 size={15} />
            </button>
          )}

          <button
            ref={triggerRef}
            type="button"
            onClick={toggleMenu}
            aria-label="More message actions"
            aria-expanded={menuOpen}
            className="rounded-md p-2 text-white/75 hover:bg-white/10 hover:text-white"
          >
            <FiMoreHorizontal size={16} />
          </button>
        </div>

        <button
          ref={triggerRef}
          type="button"
          onClick={toggleMenu}
          aria-label="More message actions"
          aria-expanded={menuOpen}
          className="rounded-lg border border-white/15 bg-[#0b1730] p-2 text-white shadow-lg md:hidden"
        >
          <FiMoreHorizontal size={16} />
        </button>
      </div>

      {menuOpen && (
        <div
          ref={menuRef}
          style={{
            position: "fixed",
            top: menuPosition.top,
            left: menuPosition.left,
            width: 200,
            zIndex: 9999,
          }}
          className="overflow-hidden rounded-lg border border-white/15 bg-[#102842] p-1.5 shadow-2xl"
        >
          {menuItems.map(({ label, icon: Icon, action, danger }) => (
            <button
              key={label}
              type="button"
              onClick={() => runAction(action)}
              className={`flex w-full items-center gap-2.5 rounded-md px-3 py-2.5 text-left text-xs transition ${
                danger
                  ? "text-red-300 hover:bg-red-500/10"
                  : "text-white/85 hover:bg-white/10"
              }`}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>
      )}
    </>
  );
}
