/**
 * Loading animation component with Lottie
 * Shows a cooking animation while waiting for recipe data
 */
import Lottie from "lottie-react";

// Simple cooking pot animation data (inline to avoid external fetch)
// This is a minimal animation of a pot with rising steam bubbles
const cookingAnimation = {
  v: "5.7.4",
  fr: 30,
  ip: 0,
  op: 90,
  w: 200,
  h: 200,
  nm: "Cooking Pot",
  ddd: 0,
  assets: [],
  layers: [
    // Steam bubble 1
    {
      ddd: 0,
      ind: 1,
      ty: 4,
      nm: "Steam 1",
      sr: 1,
      ks: {
        o: {
          a: 1,
          k: [
            { t: 0, s: [0], i: { x: [0.5], y: [1] }, o: { x: [0.5], y: [0] } },
            { t: 20, s: [80], i: { x: [0.5], y: [1] }, o: { x: [0.5], y: [0] } },
            { t: 60, s: [0] }
          ]
        },
        p: {
          a: 1,
          k: [
            { t: 0, s: [80, 90], i: { x: 0.5, y: 1 }, o: { x: 0.5, y: 0 } },
            { t: 60, s: [75, 30] }
          ]
        },
        s: {
          a: 1,
          k: [
            { t: 0, s: [60, 60], i: { x: 0.5, y: 1 }, o: { x: 0.5, y: 0 } },
            { t: 60, s: [100, 100] }
          ]
        }
      },
      shapes: [
        {
          ty: "el",
          p: { a: 0, k: [0, 0] },
          s: { a: 0, k: [12, 12] }
        },
        {
          ty: "fl",
          c: { a: 0, k: [0.7, 0.7, 0.7, 1] },
          o: { a: 0, k: 100 }
        }
      ]
    },
    // Steam bubble 2
    {
      ddd: 0,
      ind: 2,
      ty: 4,
      nm: "Steam 2",
      sr: 1,
      ks: {
        o: {
          a: 1,
          k: [
            { t: 15, s: [0], i: { x: [0.5], y: [1] }, o: { x: [0.5], y: [0] } },
            { t: 35, s: [80], i: { x: [0.5], y: [1] }, o: { x: [0.5], y: [0] } },
            { t: 75, s: [0] }
          ]
        },
        p: {
          a: 1,
          k: [
            { t: 15, s: [100, 85], i: { x: 0.5, y: 1 }, o: { x: 0.5, y: 0 } },
            { t: 75, s: [105, 25] }
          ]
        },
        s: {
          a: 1,
          k: [
            { t: 15, s: [50, 50], i: { x: 0.5, y: 1 }, o: { x: 0.5, y: 0 } },
            { t: 75, s: [90, 90] }
          ]
        }
      },
      shapes: [
        {
          ty: "el",
          p: { a: 0, k: [0, 0] },
          s: { a: 0, k: [10, 10] }
        },
        {
          ty: "fl",
          c: { a: 0, k: [0.75, 0.75, 0.75, 1] },
          o: { a: 0, k: 100 }
        }
      ]
    },
    // Steam bubble 3
    {
      ddd: 0,
      ind: 3,
      ty: 4,
      nm: "Steam 3",
      sr: 1,
      ks: {
        o: {
          a: 1,
          k: [
            { t: 30, s: [0], i: { x: [0.5], y: [1] }, o: { x: [0.5], y: [0] } },
            { t: 50, s: [70], i: { x: [0.5], y: [1] }, o: { x: [0.5], y: [0] } },
            { t: 90, s: [0] }
          ]
        },
        p: {
          a: 1,
          k: [
            { t: 30, s: [120, 88], i: { x: 0.5, y: 1 }, o: { x: 0.5, y: 0 } },
            { t: 90, s: [130, 35] }
          ]
        },
        s: {
          a: 1,
          k: [
            { t: 30, s: [40, 40], i: { x: 0.5, y: 1 }, o: { x: 0.5, y: 0 } },
            { t: 90, s: [80, 80] }
          ]
        }
      },
      shapes: [
        {
          ty: "el",
          p: { a: 0, k: [0, 0] },
          s: { a: 0, k: [8, 8] }
        },
        {
          ty: "fl",
          c: { a: 0, k: [0.8, 0.8, 0.8, 1] },
          o: { a: 0, k: 100 }
        }
      ]
    },
    // Pot body
    {
      ddd: 0,
      ind: 4,
      ty: 4,
      nm: "Pot",
      sr: 1,
      ks: {
        p: { a: 0, k: [100, 130] }
      },
      shapes: [
        {
          ty: "rc",
          p: { a: 0, k: [0, 10] },
          s: { a: 0, k: [80, 50] },
          r: { a: 0, k: 8 }
        },
        {
          ty: "fl",
          c: { a: 0, k: [0.4, 0.25, 0.1, 1] },
          o: { a: 0, k: 100 }
        }
      ]
    },
    // Pot lid with wobble
    {
      ddd: 0,
      ind: 5,
      ty: 4,
      nm: "Lid",
      sr: 1,
      ks: {
        p: { a: 0, k: [100, 100] },
        r: {
          a: 1,
          k: [
            { t: 0, s: [-2], i: { x: [0.5], y: [1] }, o: { x: [0.5], y: [0] } },
            { t: 15, s: [2], i: { x: [0.5], y: [1] }, o: { x: [0.5], y: [0] } },
            { t: 30, s: [-2], i: { x: [0.5], y: [1] }, o: { x: [0.5], y: [0] } },
            { t: 45, s: [2], i: { x: [0.5], y: [1] }, o: { x: [0.5], y: [0] } },
            { t: 60, s: [-2], i: { x: [0.5], y: [1] }, o: { x: [0.5], y: [0] } },
            { t: 75, s: [2], i: { x: [0.5], y: [1] }, o: { x: [0.5], y: [0] } },
            { t: 90, s: [-2] }
          ]
        }
      },
      shapes: [
        // Lid top
        {
          ty: "el",
          p: { a: 0, k: [0, 0] },
          s: { a: 0, k: [90, 20] }
        },
        {
          ty: "fl",
          c: { a: 0, k: [0.5, 0.3, 0.15, 1] },
          o: { a: 0, k: 100 }
        },
        // Lid handle
        {
          ty: "el",
          p: { a: 0, k: [0, -8] },
          s: { a: 0, k: [20, 12] }
        },
        {
          ty: "fl",
          c: { a: 0, k: [0.3, 0.2, 0.1, 1] },
          o: { a: 0, k: 100 }
        }
      ]
    },
    // Pot handles
    {
      ddd: 0,
      ind: 6,
      ty: 4,
      nm: "Handles",
      sr: 1,
      ks: {
        p: { a: 0, k: [100, 130] }
      },
      shapes: [
        // Left handle
        {
          ty: "el",
          p: { a: 0, k: [-48, 5] },
          s: { a: 0, k: [16, 20] }
        },
        // Right handle
        {
          ty: "el",
          p: { a: 0, k: [48, 5] },
          s: { a: 0, k: [16, 20] }
        },
        {
          ty: "fl",
          c: { a: 0, k: [0.35, 0.22, 0.08, 1] },
          o: { a: 0, k: 100 }
        }
      ]
    }
  ]
};

interface LoadingAnimationProps {
  message?: string;
}

export function LoadingAnimation({ message = "Preparing your recipe..." }: LoadingAnimationProps) {
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: "1rem",
      padding: "2rem",
    }}>
      <Lottie
        animationData={cookingAnimation}
        loop={true}
        style={{ width: 120, height: 120 }}
      />
      <span style={{
        fontSize: "1rem",
        color: "var(--vscode-descriptionForeground, #888)",
        fontWeight: 500,
      }}>
        {message}
      </span>
    </div>
  );
}
