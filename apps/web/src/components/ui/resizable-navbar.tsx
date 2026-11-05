"use client";

import { cn } from "@/lib/utils";
import { IconMenu2, IconX } from "@tabler/icons-react";
import {
  motion,
  AnimatePresence,
  useScroll,
  useMotionValueEvent,
  useReducedMotion,
  LayoutGroup,
} from "framer-motion";
import React, { useEffect, useRef, useState } from "react";

interface NavbarProps {
  children: React.ReactNode;
  className?: string;
}

interface NavBodyProps {
  children: React.ReactNode;
  className?: string;
  visible?: boolean;
}

export interface NavItemType {
  name: string;
  link: string;
}

interface NavItemsProps {
  items: NavItemType[];
  className?: string;
  onItemClick?: () => void;
}

interface MobileNavProps {
  children: React.ReactNode;
  className?: string;
  visible?: boolean;
}

interface MobileNavHeaderProps {
  children: React.ReactNode;
  className?: string;
}

interface MobileNavMenuProps {
  children: React.ReactNode;
  className?: string;
  isOpen: boolean;
  onClose?: () => void;
}

export const Navbar = ({ children, className }: NavbarProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();
  const [visible, setVisible] = useState<boolean>(false);
  const [hidden, setHidden] = useState(false);
  const previousScroll = useRef(0);
  const pointerNear = useRef(false);
  const reducedMotion = useReducedMotion();

  // Hysteresis threshold eliminates any oscillation / rapid flickering
  useMotionValueEvent(scrollY, "change", (latest) => {
    if (latest > 100) {
      setVisible(true);
    } else if (latest < 50) {
      setVisible(false);
    }
    const delta = latest - previousScroll.current;
    if (Math.abs(delta) >= 3) {
      if (latest < 5 || delta < 0) setHidden(false);
      else if (!pointerNear.current) setHidden(true);
      previousScroll.current = latest;
    }
  });

  useEffect(() => {
    let touchY = 0;
    const pointer = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      pointerNear.current = event.clientY <= 100;
      if (pointerNear.current) setHidden(false);
    };
    // Some pinned scenes consume the wheel before the document actually scrolls.
    const wheel = (event: WheelEvent) => {
      if (Math.abs(event.deltaY) < 2) return;
      if (event.deltaY < 0) setHidden(false);
      else if (!pointerNear.current) setHidden(true);
    };
    const touchStart = (event: TouchEvent) => {
      touchY = event.touches[0]?.clientY ?? 0;
      pointerNear.current = false;
    };
    const touchMove = (event: TouchEvent) => {
      const y = event.touches[0]?.clientY;
      if (y === undefined || Math.abs(touchY - y) < 3) return;
      setHidden(y < touchY);
      touchY = y;
    };
    window.addEventListener("pointermove", pointer, { passive: true });
    window.addEventListener("wheel", wheel, { capture: true, passive: true });
    window.addEventListener("touchstart", touchStart, { capture: true, passive: true });
    window.addEventListener("touchmove", touchMove, { capture: true, passive: true });
    return () => {
      window.removeEventListener("pointermove", pointer);
      window.removeEventListener("wheel", wheel, true);
      window.removeEventListener("touchstart", touchStart, true);
      window.removeEventListener("touchmove", touchMove, true);
    };
  }, []);

  return (
    <motion.div
      ref={ref}
      initial={false}
      animate={{ y: hidden ? "-150%" : "0%" }}
      transition={{ duration: reducedMotion ? 0 : 0.3, ease: "easeInOut" }}
      onFocusCapture={() => setHidden(false)}
      className={cn(
        "sticky inset-x-0 top-4 z-50 w-full px-4 sm:px-6",
        className,
      )}
    >
      {React.Children.map(children, (child) =>
        React.isValidElement(child)
          ? React.cloneElement(
              child as React.ReactElement<{ visible?: boolean }>,
              { visible },
            )
          : child,
      )}
    </motion.div>
  );
};

export const NavBody = ({ children, className, visible }: NavBodyProps) => {
  return (
    <motion.div
      animate={{
        backdropFilter: "blur(12px)",
        width: visible ? "48%" : "100%",
        y: visible ? 8 : 0,
      }}
      transition={{
        type: "spring",
        stiffness: 220,
        damping: 35,
      }}
      style={{
        minWidth: "860px",
      }}
      className={cn(
        "relative z-[60] mx-auto hidden w-full max-w-7xl flex-row items-center justify-between rounded-full bg-white px-6 py-2 shadow-md transition-colors lg:flex",
        className,
      )}
    >
      {children}
    </motion.div>
  );
};

export const NavItems = ({ items, className, onItemClick }: NavItemsProps) => {
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <LayoutGroup id="navbar-hover-group">
      <motion.div
        onMouseLeave={() => setHovered(null)}
        className={cn(
          "hidden flex-1 flex-row items-center justify-center space-x-1 text-sm font-medium transition duration-200 lg:flex",
          className,
        )}
      >
        {items.map((item, idx) => (
          <div
            key={`nav-item-${idx}`}
            className="relative"
            onMouseEnter={() => setHovered(idx)}
          >
            <a
              onClick={onItemClick}
              className="relative block px-4 py-2 text-sm font-medium text-slate-600 transition-colors duration-200 whitespace-nowrap"
              href={item.link}
            >
              {/* Smooth continuous moving bubble pill with spring physics */}
              {hovered === idx && (
                <motion.div
                  layoutId="hovered-bubble"
                  className="absolute inset-0 h-full w-full rounded-full bg-white shadow-[2px_4px_12px_rgba(160,175,200,0.42),-2px_-2px_8px_rgba(255,255,255,0.9)]"
                  transition={{
                    type: "spring",
                    stiffness: 420,
                    damping: 30,
                  }}
                />
              )}
              <span className="relative z-20">{item.name}</span>
            </a>
          </div>
        ))}
      </motion.div>
    </LayoutGroup>
  );
};

export const MobileNav = ({ children, className, visible }: MobileNavProps) => {
  return (
    <motion.div
      animate={{
        backdropFilter: "blur(12px)",
        width: visible ? "92%" : "100%",
        paddingRight: "12px",
        paddingLeft: "12px",
        y: visible ? 8 : 0,
      }}
      transition={{
        type: "spring",
        stiffness: 220,
        damping: 35,
      }}
      className={cn(
        "relative z-50 mx-auto flex w-full max-w-[calc(100vw-2rem)] flex-col items-center justify-between rounded-2xl bg-white px-4 py-2.5 shadow-[6px_8px_20px_rgba(160,175,200,0.32),-4px_-4px_16px_rgba(255,255,255,0.9),0_1px_3px_rgba(15,23,42,0.04)] lg:hidden",
        className,
      )}
    >
      {children}
    </motion.div>
  );
};

export const MobileNavHeader = ({
  children,
  className,
}: MobileNavHeaderProps) => {
  return (
    <div
      className={cn(
        "flex w-full flex-row items-center justify-between",
        className,
      )}
    >
      {children}
    </div>
  );
};

export const MobileNavMenu = ({
  children,
  className,
  isOpen,
}: MobileNavMenuProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.25, ease: "easeInOut" }}
          className={cn(
            "w-full overflow-hidden pt-3 border-t border-slate-200/60 mt-2",
            className,
          )}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export const MobileNavToggle = ({
  isOpen,
  onClick,
}: {
  isOpen: boolean;
  onClick: () => void;
}) => {
  return (
    <button
      onClick={onClick}
      aria-label="Toggle Mobile Menu"
      className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-slate-800 shadow-[2px_4px_10px_rgba(160,175,200,0.35),-2px_-2px_8px_rgba(255,255,255,0.9)] active:shadow-[inset_2px_2px_4px_rgba(160,175,200,0.4)] transition cursor-pointer"
    >
      {isOpen ? (
        <IconX className="h-4 w-4 text-slate-900" />
      ) : (
        <IconMenu2 className="h-4 w-4 text-slate-900" />
      )}
    </button>
  );
};

export const NavbarLogo = () => {
  return (
    <a href="/" className="relative z-20 mr-4 flex items-center">
      <img src="/menuin.png" alt="Menuin" className="h-7 w-auto md:h-8" />
    </a>
  );
};

export const NavbarButton = ({
  href,
  as: Tag = "a",
  children,
  className,
  variant = "primary",
  ...props
}: {
  href?: string;
  as?: React.ElementType;
  children: React.ReactNode;
  className?: string;
  variant?: "primary" | "secondary" | "dark" | "gradient";
} & (
  | React.ComponentPropsWithoutRef<"a">
  | React.ComponentPropsWithoutRef<"button">
)) => {
  const baseStyles =
    "px-5 py-2 rounded-full text-sm font-semibold relative cursor-pointer transition-all duration-150 ease-out inline-flex items-center justify-center space-x-1.5 select-none";

  const variantStyles = {
    primary:
      "bg-[#0e59f9] text-white hover:bg-[#0b4de0] active:scale-[0.98] shadow-none",
    secondary:
      "bg-white text-slate-700 shadow-[2px_4px_10px_rgba(160,175,200,0.35),-2px_-2px_8px_rgba(255,255,255,0.9)] hover:shadow-[3px_5px_12px_rgba(160,175,200,0.45)]",
    dark: "bg-slate-900 text-white hover:bg-black shadow-[3px_5px_12px_rgba(15,23,42,0.3)]",
    gradient:
      "bg-[#0e59f9] text-white hover:bg-[#0b4de0] active:scale-[0.98] shadow-none",
  };

  return (
    <Tag
      href={href || undefined}
      className={cn(baseStyles, variantStyles[variant], className)}
      {...props}
    >
      {children}
    </Tag>
  );
};
