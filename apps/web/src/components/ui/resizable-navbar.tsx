"use client";

import { cn } from "@/lib/utils";
import { IconMenu2, IconX } from "@tabler/icons-react";
import {
  motion,
  AnimatePresence,
  useScroll,
  useMotionValueEvent,
} from "framer-motion";
import React, { useRef, useState } from "react";

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
  children?: React.ReactNode;
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

  // Hysteresis threshold eliminates any oscillation / rapid flickering
  useMotionValueEvent(scrollY, "change", (latest) => {
    if (latest > 100) {
      setVisible(true);
    } else if (latest < 50) {
      setVisible(false);
    }
  });

  return (
    <motion.div
      ref={ref}
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
        boxShadow: visible
          ? "0 0 24px rgba(34, 42, 53, 0.08), 0 1px 1px rgba(0, 0, 0, 0.05), 0 0 0 1px rgba(34, 42, 53, 0.06), 0 0 4px rgba(34, 42, 53, 0.08), 0 16px 68px rgba(47, 48, 55, 0.05), 0 1px 0 rgba(255, 255, 255, 0.1) inset"
          : "0 1px 3px rgba(0, 0, 0, 0.05), 0 0 0 1px rgba(0, 0, 0, 0.04)",
        width: visible ? "62%" : "100%",
        y: visible ? 8 : 0,
      }}
      transition={{
        type: "spring",
        stiffness: 220,
        damping: 35,
      }}
      style={{
        minWidth: "760px",
      }}
      className={cn(
        "relative z-[60] mx-auto hidden w-full max-w-7xl flex-row items-center justify-between rounded-full border border-black/[0.07] px-6 py-2 transition-colors lg:flex",
        visible ? "bg-white/95 shadow-md" : "bg-white/80 shadow-xs",
        className,
      )}
    >
      {children}
    </motion.div>
  );
};

export const NavItems = ({ items, className, onItemClick }: NavItemsProps) => {
  const [hovered, setHovered] = useState<number | null>(null);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  return (
    <motion.div
      onMouseLeave={() => {
        setHovered(null);
        setActiveDropdown(null);
      }}
      className={cn(
        "hidden flex-1 flex-row items-center justify-center space-x-1 text-sm font-medium transition duration-200 lg:flex",
        className,
      )}
    >
      {items.map((item, idx) => (
        <div
          key={`nav-item-${idx}`}
          className="relative"
          onMouseEnter={() => {
            setHovered(idx);
            if (item.children) {
              setActiveDropdown(item.name);
            } else {
              setActiveDropdown(null);
            }
          }}
        >
          <a
            onClick={onItemClick}
            className={cn(
              "relative block px-4 py-2 text-sm font-medium transition-colors duration-200",
              hovered === idx
                ? "text-[#0E59F9] font-semibold"
                : "text-slate-600 hover:text-[#0E59F9]",
            )}
            href={item.link}
          >
            {/* Smooth moving bubble pill matching Menuin brand */}
            <AnimatePresence>
              {hovered === idx && (
                <motion.div
                  layoutId="hovered-bubble"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 h-full w-full rounded-full bg-[#0E59F9]/[0.08]"
                  transition={{
                    type: "spring",
                    stiffness: 420,
                    damping: 30,
                  }}
                />
              )}
            </AnimatePresence>
            <span className="relative z-20">{item.name}</span>
          </a>

          {/* Children Preview Dropdown */}
          {item.children && activeDropdown === item.name && (
            <div className="absolute top-[calc(100%_+_0.6rem)] left-1/2 -translate-x-1/2 pt-2 z-50">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 6 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 6 }}
                transition={{
                  type: "spring",
                  mass: 0.5,
                  damping: 14,
                  stiffness: 130,
                }}
              >
                <motion.div
                  layoutId="active-dropdown-card"
                  className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-[0_20px_50px_rgba(0,0,0,0.15)] ring-1 ring-black/5"
                >
                  <motion.div layout className="w-max h-full p-4 sm:p-5">
                    {item.children}
                  </motion.div>
                </motion.div>
              </motion.div>
            </div>
          )}
        </div>
      ))}
    </motion.div>
  );
};

export const MobileNav = ({ children, className, visible }: MobileNavProps) => {
  return (
    <motion.div
      animate={{
        backdropFilter: "blur(12px)",
        boxShadow: visible
          ? "0 0 24px rgba(34, 42, 53, 0.08), 0 1px 1px rgba(0, 0, 0, 0.05), 0 0 0 1px rgba(34, 42, 53, 0.06), 0 0 4px rgba(34, 42, 53, 0.08), 0 16px 68px rgba(47, 48, 55, 0.05), 0 1px 0 rgba(255, 255, 255, 0.1) inset"
          : "none",
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
        "relative z-50 mx-auto flex w-full max-w-[calc(100vw-2rem)] flex-col items-center justify-between rounded-2xl border border-black/[0.08] bg-white/95 px-4 py-2.5 shadow-md backdrop-blur-md lg:hidden",
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
            "w-full overflow-hidden pt-3 border-t border-black/[0.06] mt-2",
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
      className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-800 hover:bg-slate-200 transition cursor-pointer"
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
    "px-5 py-2 rounded-full text-sm font-semibold relative cursor-pointer transition duration-200 inline-flex items-center justify-center space-x-1.5 active:scale-95";

  const variantStyles = {
    primary:
      "bg-[#0E59F9] text-white shadow-sm hover:bg-[#0C4CD6] hover:shadow-md",
    secondary:
      "bg-transparent hover:bg-[#0E59F9]/[0.08] text-slate-700 hover:text-[#0E59F9]",
    dark: "bg-slate-900 text-white hover:bg-black",
    gradient: "bg-[#0E59F9] text-white shadow-sm hover:bg-[#0C4CD6]",
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
