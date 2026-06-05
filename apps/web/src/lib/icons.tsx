import SvgIcon from "@mui/material/SvgIcon";
import type { SvgIconProps } from "@mui/material/SvgIcon";
import type { ReactElement } from "react";

// Avoid @mui/icons-material in lazy-loaded route chunks: Rollup's CJS
// default-export interop turns those icons into plain objects in
// production, which triggers React error #130 when used as startIcon.
// Inline the SVG via SvgIcon from @mui/material instead.
export function AddShoppingCartIcon(props: SvgIconProps): ReactElement {
  return (
    <SvgIcon {...props}>
      <path d="M11 9h2V6h3V4h-3V1h-2v3H8v2h3zm-4 9c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2m10 0c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2m-9.83-3.25.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.86-7.01L19.42 4h-.01l-1.1 2-2.76 5H8.53l-.13-.27L6.16 6l-.95-2-.94-2H1v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.13 0-.25-.11-.25-.25" />
    </SvgIcon>
  );
}

export function DeleteIcon(props: SvgIconProps): ReactElement {
  return (
    <SvgIcon {...props}>
      <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6zM19 4h-3.5l-1-1h-5l-1 1H5v2h14z" />
    </SvgIcon>
  );
}

export function AddIcon(props: SvgIconProps): ReactElement {
  return (
    <SvgIcon {...props}>
      <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6z" />
    </SvgIcon>
  );
}

export function RemoveIcon(props: SvgIconProps): ReactElement {
  return (
    <SvgIcon {...props}>
      <path d="M19 13H5v-2h14z" />
    </SvgIcon>
  );
}

export function RestaurantIcon(props: SvgIconProps): ReactElement {
  return (
    <SvgIcon {...props}>
      <path d="M11 9H9V2H7v7H5V2H3v7c0 2.12 1.66 3.84 3.75 3.97V22h2.5v-9.03C11.34 12.84 13 11.12 13 9V2h-2zm5-3v8h2.5v8H21V2z" />
    </SvgIcon>
  );
}

export function LocalShippingIcon(props: SvgIconProps): ReactElement {
  return (
    <SvgIcon {...props}>
      <path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5m13.5-9 1.96 2.5H17V9.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5" />
    </SvgIcon>
  );
}

export function LocalOfferIcon(props: SvgIconProps): ReactElement {
  return (
    <SvgIcon {...props}>
      <path d="m21.41 11.58-9-9C12.05 2.22 11.55 2 11 2H4c-1.1 0-2 .9-2 2v7c0 .55.22 1.05.59 1.42l9 9c.36.36.86.58 1.41.58s1.05-.22 1.41-.59l7-7c.37-.36.59-.86.59-1.41 0-.55-.23-1.06-.59-1.42M5.5 7C4.67 7 4 6.33 4 5.5S4.67 4 5.5 4 7 4.67 7 5.5 6.33 7 5.5 7" />
    </SvgIcon>
  );
}

export function SearchIcon(props: SvgIconProps): ReactElement {
  return (
    <SvgIcon {...props}>
      <path d="M15.5 14h-.79l-.28-.27a6.5 6.5 0 0 0 1.48-5.34C15.31 5.6 12.86 3.5 9.96 3.16 5.86 2.66 2.66 6.04 3.5 10.13c.39 1.97 1.85 3.66 3.83 4.13a6.5 6.5 0 0 0 5.36-1.48l.27.28v.79l4.25 4.25c.41.41 1.08.41 1.49 0s.41-1.08 0-1.49zm-6 0c-2.49 0-4.5-2.01-4.5-4.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14" />
    </SvgIcon>
  );
}

export function ArrowBackIcon(props: SvgIconProps): ReactElement {
  return (
    <SvgIcon {...props}>
      <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20z" />
    </SvgIcon>
  );
}

export function CheckCircleIcon(props: SvgIconProps): ReactElement {
  return (
    <SvgIcon {...props}>
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2m-2 15-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8z" />
    </SvgIcon>
  );
}

export function PlusIcon(props: SvgIconProps): ReactElement {
  return (
    <SvgIcon {...props}>
      <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6z" />
    </SvgIcon>
  );
}

export function ExpandMoreIcon(props: SvgIconProps): ReactElement {
  return (
    <SvgIcon {...props}>
      <path d="M16.59 8.59 12 13.17 7.41 8.59 6 10l6 6 6-6z" />
    </SvgIcon>
  );
}

export function OpenInNewIcon(props: SvgIconProps): ReactElement {
  return (
    <SvgIcon {...props}>
      <path d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3z" />
    </SvgIcon>
  );
}

export function ErrorOutlineIcon(props: SvgIconProps): ReactElement {
  return (
    <SvgIcon {...props}>
      <path d="M11 15h2v2h-2zm0-8h2v6h-2zm.99-5C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2M12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8" />
    </SvgIcon>
  );
}

export function CompassIcon(props: SvgIconProps): ReactElement {
  return (
    <SvgIcon {...props}>
      <path d="M12 10.9c-.61 0-1.1.49-1.1 1.1s.49 1.1 1.1 1.1c.61 0 1.1-.49 1.1-1.1s-.49-1.1-1.1-1.1M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2m2.19 12.19L6 18l3.81-8.19L18 6z" />
    </SvgIcon>
  );
}

export function MenuIcon(props: SvgIconProps): ReactElement {
  return (
    <SvgIcon {...props}>
      <path d="M3 18h18v-2H3zm0-5h18v-2H3zm0-7v2h18V6z" />
    </SvgIcon>
  );
}

export function CloseIcon(props: SvgIconProps): ReactElement {
  return (
    <SvgIcon {...props}>
      <path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
    </SvgIcon>
  );
}

export function LogoutIcon(props: SvgIconProps): ReactElement {
  return (
    <SvgIcon {...props}>
      <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4z" />
    </SvgIcon>
  );
}

export function StorefrontIcon(props: SvgIconProps): ReactElement {
  return (
    <SvgIcon {...props}>
      <path d="M21.9 8.89l-1.05-4.37c-.22-.9-1-1.52-1.91-1.52H5.05c-.9 0-1.69.63-1.9 1.52L2.1 8.89c-.24 1.02-.02 2.06.62 2.88.08.11.19.19.28.29V19c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-6.94c.09-.09.2-.18.28-.28.64-.82.87-1.87.62-2.89M5.05 5h13.87l1.05 4.37c.1.42.01.84-.25 1.17-.14.18-.44.46-.94.46-.61 0-1.14-.49-1.21-1.14L17 8.5l-.57 5.36c-.07.65-.55 1.14-1.16 1.14-.6 0-1.13-.49-1.2-1.14L13.5 8.5l-.6 5.36c-.05.66-.59 1.14-1.25 1.14-.66 0-1.2-.48-1.25-1.14L9.8 8.5l-.58 5.36c-.06.65-.6 1.14-1.21 1.14-.5 0-.8-.28-.93-.46-.27-.32-.36-.75-.27-1.17zM5 19v-5.03c.12.01.23.03.35.03.86 0 1.64-.36 2.2-.95.57.6 1.36.95 2.26.95.86 0 1.63-.36 2.2-.94.58.58 1.35.94 2.24.94.84 0 1.63-.35 2.2-.95.56.59 1.34.95 2.2.95.13 0 .24-.01.35-.03V19z" />
    </SvgIcon>
  );
}

export function LightModeIcon(props: SvgIconProps): ReactElement {
  return (
    <SvgIcon {...props}>
      <path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5M2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1m18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1M11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1m0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1M5.99 4.58a.996.996 0 0 0-1.41 0 .996.996 0 0 0 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41zm12.37 12.37a.996.996 0 0 0-1.41 0 .996.996 0 0 0 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0a.996.996 0 0 0 0-1.41zm1.06-10.96a.996.996 0 0 0 0-1.41.996.996 0 0 0-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0zM7.05 18.36a.996.996 0 0 0 0-1.41.996.996 0 0 0-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0z" />
    </SvgIcon>
  );
}

export function DarkModeIcon(props: SvgIconProps): ReactElement {
  return (
    <SvgIcon {...props}>
      <path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9c0-.46-.04-.92-.1-1.36a5.389 5.389 0 0 1-4.4 2.26 5.403 5.403 0 0 1-3.14-9.8c-.44-.06-.9-.1-1.36-.1" />
    </SvgIcon>
  );
}

export function ContrastIcon(props: SvgIconProps): ReactElement {
  return (
    <SvgIcon {...props}>
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2m0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8m1-15v14c3.86 0 7-3.14 7-7s-3.14-7-7-7" />
    </SvgIcon>
  );
}

export function CreditCardIcon(props: SvgIconProps): ReactElement {
  return (
    <SvgIcon {...props}>
      <path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2m0 14H4v-6h16zm0-10H4V6h16z" />
    </SvgIcon>
  );
}
