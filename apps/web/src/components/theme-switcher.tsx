"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Laptop, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface ThemeSwitcherProps {
  className?: string;
  triggerClassName?: string;
  iconClassName?: string;
  size?: number;
}

const ThemeSwitcher = ({
  className,
  triggerClassName,
  iconClassName,
  size = 16,
}: ThemeSwitcherProps) => {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  // useEffect only runs on the client, so now we can safely show the UI
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div className={className}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm"
            className={cn("text-muted-foreground hover:text-foreground", triggerClassName)}
          >
            {theme === "light" ? (
              <Sun
                key="light"
                size={size}
                className={cn("transition-colors", iconClassName || "currentColor")}
              />
            ) : theme === "dark" ? (
              <Moon
                key="dark"
                size={size}
                className={cn("transition-colors", iconClassName || "currentColor")}
              />
            ) : (
              <Laptop
                key="system"
                size={size}
                className={cn("transition-colors", iconClassName || "currentColor")}
              />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-content" align="start">
          <DropdownMenuRadioGroup
            value={theme}
            onValueChange={(e) => setTheme(e)}
          >
            <DropdownMenuRadioItem className="flex gap-2 cursor-pointer" value="light">
              <Sun size={16} className="text-muted-foreground" />{" "}
              <span>Light</span>
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem className="flex gap-2 cursor-pointer" value="dark">
              <Moon size={16} className="text-muted-foreground" />{" "}
              <span>Dark</span>
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem className="flex gap-2 cursor-pointer" value="system">
              <Laptop size={16} className="text-muted-foreground" />{" "}
              <span>System</span>
            </DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export { ThemeSwitcher };

