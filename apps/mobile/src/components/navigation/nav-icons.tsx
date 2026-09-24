import React from 'react';
import Svg, { Path, Rect, Circle } from 'react-native-svg';

export const MENUIN_BLUE = '#014FFD';

// 1. Home Icon (Filled house with crisp white door cutout)
export function ActiveHomeIcon({ size = 22, color = MENUIN_BLUE }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3.5 9.8L12 3L20.5 9.8V19.5C20.5 20.3284 19.8284 21 19 21H5C4.17157 21 3.5 20.3284 3.5 19.5V9.8Z"
        fill={color}
        stroke={color}
        strokeWidth={0.5}
        strokeLinejoin="round"
      />
      <Path
        d="M9.5 21V12.5H14.5V21"
        stroke="#ffffff"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// 2. Receipt Icon (Filled receipt with crisp white text lines)
export function ActiveReceiptIcon({ size = 22, color = MENUIN_BLUE }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 2.5V21.5L6.5 20L9 21.5L11.5 20L14 21.5L16.5 20L19 21.5L20 21V2.5L18 3.5L16 2.5L14 3.5L12 2.5L10 3.5L8 2.5L6 3.5L4 2.5Z"
        fill={color}
        stroke={color}
        strokeWidth={0.5}
        strokeLinejoin="round"
      />
      <Path
        d="M8 8H16M8 12H16M8 16H13"
        stroke="#ffffff"
        strokeWidth={2}
        strokeLinecap="round"
      />
    </Svg>
  );
}

// 3. Grid Icon (4 solid filled rounded rectangles)
export function ActiveGridIcon({ size = 22, color = MENUIN_BLUE }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="3" width="7.5" height="7.5" rx="2" fill={color} />
      <Rect x="13.5" y="3" width="7.5" height="7.5" rx="2" fill={color} />
      <Rect x="13.5" y="13.5" width="7.5" height="7.5" rx="2" fill={color} />
      <Rect x="3" y="13.5" width="7.5" height="7.5" rx="2" fill={color} />
    </Svg>
  );
}

// 4. Settings Icon (Filled gear with crisp white circular center)
export function ActiveSettingsIcon({ size = 22, color = MENUIN_BLUE }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"
        fill={color}
        stroke={color}
        strokeWidth={1}
        strokeLinejoin="round"
      />
      <Circle cx="12" cy="12" r="3.2" fill="#ffffff" />
    </Svg>
  );
}

// 5. Store / Kasir Icon (Filled storefront with white doorway)
export function ActiveStoreIcon({ size = 22, color = MENUIN_BLUE }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 9L4.5 4H19.5L21 9V20C21 20.5523 20.5523 21 20 21H4C3.44772 21 3 20.5523 3 20V9Z"
        fill={color}
        stroke={color}
        strokeWidth={0.5}
        strokeLinejoin="round"
      />
      <Path
        d="M3 9C4 9 4.5 8 5.5 8C6.5 8 7 9 8 9C9 9 9.5 8 10.5 8C11.5 8 12 9 13 9C14 9 14.5 8 15.5 8C16.5 8 17 9 18 9C19 9 19.5 8 21 8"
        stroke="#ffffff"
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      <Path
        d="M9 21V13H15V21"
        stroke="#ffffff"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// 6. Clock / Shift Icon (Filled circle with crisp white hands)
export function ActiveClockIcon({ size = 22, color = MENUIN_BLUE }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9.5" fill={color} stroke={color} strokeWidth={0.5} />
      <Path
        d="M12 7V12L15.5 14"
        stroke="#ffffff"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// 7. Dashboard Icon (Filled dashboard layout blocks)
export function ActiveDashboardIcon({ size = 22, color = MENUIN_BLUE }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="3" width="7" height="9" rx="1.5" fill={color} />
      <Rect x="14" y="3" width="7" height="5" rx="1.5" fill={color} />
      <Rect x="14" y="12" width="7" height="9" rx="1.5" fill={color} />
      <Rect x="3" y="16" width="7" height="5" rx="1.5" fill={color} />
    </Svg>
  );
}
