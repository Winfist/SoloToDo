import React, { useState, useCallback } from "react";

/**
 * GameIcon – Universal icon component for SoloToDo.
 * Renders a custom image with glow/animation effects, falls back to emoji.
 *
 * Props:
 * @param {string}  src        – Path to icon image (e.g. "/icons/.webp")
 * @param {string}  fallback   – Emoji fallback if src is missing
 * @param {number}  size       – Icon size in px (default: 24)
 * @param {boolean} glow       – Enable glow effect
 * @param {string}  glowColor  – Glow color (default: theme cyan)
 * @param {string}  animate    – "float" | "pulse" | "breathe" | "reveal" | "none"
 * @param {string}  className  – Additional CSS class
 * @param {object}  style      – Additional inline styles
 * @param {string}  alt        – Alt text for image
 * @param {boolean} inactive   – Dim the icon (greyscale + low brightness)
 * @param {boolean} locked     – Show locked style (greyscale)
 * @param {function} onClick   – Click handler
 */
export default function GameIcon({
    src,
    fallback,
    size = 24,
    glow = false,
    glowColor = "rgba(103, 232, 249, 0.45)",
    animate = "none",
    className = "",
    style = {},
    alt = "",
    inactive = false,
    locked = false,
    onClick,
}) {
    const [imgError, setImgError] = useState(false);

    const handleError = useCallback(() => setImgError(true), []);

    // Build filter string
    const filters = [];
    if (locked) {
        filters.push("grayscale(1) brightness(0.35)");
    } else if (inactive) {
        filters.push("brightness(0.5) saturate(0.6)");
    }
    if (glow && !locked && !inactive) {
        filters.push(`drop-shadow(0 0 ${Math.max(4, size * 0.25)}px ${glowColor})`);
    }

    // Animation name mapping
    const animationMap = {
        float: `giFloat 3s ease-in-out infinite`,
        pulse: `giPulse 2s ease-in-out infinite`,
        breathe: `giBreathe 4s ease-in-out infinite`,
        reveal: `giReveal 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards`,
        none: "none",
    };

    const baseStyle = {
        width: size,
        height: size,
        objectFit: "contain",
        filter: filters.join(" ") || "none",
        animation: animationMap[animate] || "none",
        transition: "filter 0.3s ease, transform 0.25s ease",
        cursor: onClick ? "pointer" : "inherit",
        flexShrink: 0,
        ...style,
    };

    // If no src or image failed to load, render emoji fallback
    if (!src || imgError) {
        if (!fallback) return null;
        return (
            <span
                className={`game-icon-emoji ${className}`}
                onClick={onClick}
                style={{
                    fontSize: size * 0.85,
                    lineHeight: 1,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: size,
                    height: size,
                    flexShrink: 0,
                    animation: animationMap[animate] || "none",
                    cursor: onClick ? "pointer" : "inherit",
                    ...style,
                }}
            >
                {fallback}
            </span>
        );
    }

    return (
        <img
            src={src}
            alt={alt || fallback || "icon"}
            className={`game-icon ${className}`}
            loading="lazy"
            draggable={false}
            onError={handleError}
            onClick={onClick}
            style={baseStyle}
        />
    );
}

/**
 * CSS Keyframes – inject once into the document head.
 * This is a self-executing style injection.
 */
const KEYFRAMES_ID = "game-icon-keyframes";
if (typeof document !== "undefined" && !document.getElementById(KEYFRAMES_ID)) {
    const styleEl = document.createElement("style");
    styleEl.id = KEYFRAMES_ID;
    styleEl.textContent = `
        @keyframes giFloat {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-4px); }
        }
        @keyframes giPulse {
            0%, 100% { filter: drop-shadow(0 0 6px var(--gi-glow, rgba(103,232,249,0.4))); transform: scale(1); }
            50% { filter: drop-shadow(0 0 14px var(--gi-glow, rgba(103,232,249,0.6))); transform: scale(1.05); }
        }
        @keyframes giBreathe {
            0%, 100% { opacity: 0.75; }
            50% { opacity: 1; }
        }
        @keyframes giReveal {
            0% { transform: scale(0.4); opacity: 0; filter: brightness(2.5); }
            70% { transform: scale(1.12); }
            100% { transform: scale(1); opacity: 1; filter: brightness(1); }
        }
        .game-icon {
            user-select: none;
            -webkit-user-drag: none;
        }
        .game-icon:hover {
            transform: scale(1.08);
        }
    `;
    document.head.appendChild(styleEl);
}
