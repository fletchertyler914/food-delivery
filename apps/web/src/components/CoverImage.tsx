import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import type { ReactElement } from "react";
import { useEffect, useState } from "react";

import { gradientFor, initialsFor } from "../lib/format/cover";

export interface CoverImageProps {
  readonly src?: string | null;
  readonly seed: string;
  readonly alt: string;
  readonly height?: number | string | Record<string, number | string>;
  readonly ratio?: number;
  readonly rounded?: boolean | number;
  readonly overlay?: boolean;
}

export function CoverImage({
  src,
  seed,
  alt,
  height = 200,
  ratio,
  rounded = true,
  overlay = false
}: CoverImageProps): ReactElement {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  const gradient = gradientFor(seed);
  const showImage = Boolean(src) && !failed;
  const radius = rounded === false ? 0 : typeof rounded === "number" ? rounded : 2;

  return (
    <Box
      sx={{
        position: "relative",
        overflow: "hidden",
        width: "100%",
        ...(ratio !== undefined ? { aspectRatio: String(ratio) } : { height }),
        borderRadius: radius,
        background: showImage
          ? undefined
          : `radial-gradient(120% 120% at 0% 0%, ${gradient.from} 0%, ${gradient.to} 75%)`,
        bgcolor: showImage ? "action.hover" : undefined,
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      }}
    >
      {showImage ? (
        <Box
          component="img"
          src={src ?? undefined}
          alt={alt}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onError={() => {
            setFailed(true);
          }}
          sx={{
            // Absolute positioning lets `height: 100%` resolve reliably
            // even when the parent's cross-axis size is set by flex
            // `align-self: stretch` rather than an explicit pixel
            // height — without this, the <img>'s intrinsic dimensions
            // can leak through and balloon the parent row.
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block"
          }}
        />
      ) : (
        <>
          <Box
            aria-hidden
            sx={{
              position: "absolute",
              inset: 0,
              backgroundImage:
                "radial-gradient(circle at 30% 20%, rgba(255,255,255,0.18) 0, rgba(255,255,255,0) 45%), radial-gradient(circle at 80% 80%, rgba(0,0,0,0.18) 0, rgba(0,0,0,0) 50%)",
              opacity: 0.9
            }}
          />
          <Typography
            variant="h3"
            component="span"
            aria-hidden
            sx={{
              position: "relative",
              color: "rgba(255,255,255,0.92)",
              fontWeight: 700,
              userSelect: "none",
              textTransform: "uppercase",
              letterSpacing: "0.04em"
            }}
          >
            {initialsFor(seed)}
          </Typography>
        </>
      )}
      {overlay ? (
        <Box
          aria-hidden
          sx={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(180deg, rgba(0,0,0,0) 35%, rgba(0,0,0,0.55) 100%)"
          }}
        />
      ) : null}
    </Box>
  );
}
