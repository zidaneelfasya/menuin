"use client";

import React, { useEffect, useState } from "react";
import { useRive, Layout, Fit, Alignment } from "@rive-app/react-canvas";

interface OrderStatusRiveProps {
  src: string;
  ariaLabel?: string;
  className?: string;
  artboard?: string;
  animation?: string;
  stateMachine?: string;
  stateMachines?: string | string[];
}

export function OrderStatusRive({
  src,
  ariaLabel = "Status Animasi",
  className = "",
  artboard,
  animation,
  stateMachine = "State Machine 1",
  stateMachines,
}: OrderStatusRiveProps) {
  const [hasMounted, setHasMounted] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const activeStateMachine = stateMachines || stateMachine || "State Machine 1";

  const { RiveComponent, rive } = useRive({
    src,
    artboard,
    animations: animation ? [animation] : undefined,
    stateMachines: activeStateMachine,
    autoplay: true,
    layout: new Layout({
      fit: Fit.Cover,
      alignment: Alignment.Center,
    }),
    onLoad: () => {
      setIsLoaded(true);
      setHasError(false);
    },
    onLoadError: (err) => {
      console.warn(`[OrderStatusRive] Failed to load Rive file from ${src}`, err);
      setHasError(true);
    },
  });

  // Ensure state machine is playing once Rive is ready
  useEffect(() => {
    if (rive && isLoaded) {
      try {
        if (typeof activeStateMachine === "string") {
          rive.play(activeStateMachine);
        } else if (Array.isArray(activeStateMachine) && activeStateMachine.length > 0) {
          rive.play(activeStateMachine[0]);
        } else {
          rive.play();
        }
      } catch (err) {
        console.warn("[OrderStatusRive] Error triggering play:", err);
      }
    }
  }, [rive, isLoaded, activeStateMachine]);

  // Reset load state when src changes
  useEffect(() => {
    setIsLoaded(false);
    setHasError(false);
  }, [src]);

  if (!hasMounted) {
    return (
      <div
        className={`w-full h-full bg-gray-100/50 animate-pulse ${className}`}
        aria-hidden="true"
      />
    );
  }

  if (hasError) {
    return null;
  }

  return (
    <div
      role="img"
      aria-label={ariaLabel}
      className={`relative w-full h-full overflow-hidden select-none [&>div]:!w-full [&>div]:!h-full [&_canvas]:!w-full [&_canvas]:!h-full [&_canvas]:!block [&_canvas]:!object-cover ${className}`}
      style={{ width: "100%", height: "100%" }}
    >
      {/* Skeleton placeholder while Rive asset loads */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-gray-100/40 animate-pulse pointer-events-none" />
      )}

      {/* Rive canvas container filling 100% width and height */}
      <div
        className={`w-full h-full absolute inset-0 transition-opacity duration-300 ease-out [&>div]:!w-full [&>div]:!h-full [&_canvas]:!w-full [&_canvas]:!h-full [&_canvas]:!block ${
          isLoaded ? "opacity-100" : "opacity-0"
        }`}
        style={{ width: "100%", height: "100%" }}
      >
        <RiveComponent
          className="w-full h-full !w-full !h-full"
          style={{ width: "100%", height: "100%", display: "block" }}
        />
      </div>
    </div>
  );
}
