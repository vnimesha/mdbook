/**
 * Central UI design tokens.
 *
 * Edit this file to retheme the entire app — every light/dark color
 * decision in every component is derived from one of these constants.
 *
 * Rules:
 *   - All strings must be complete Tailwind class names (no interpolation
 *     inside the values) so the v4 scanner picks them up from this file.
 *   - Components combine tokens with structural classes (spacing, radius,
 *     typography sizes) inline — only color/theme choices live here.
 */

export const ui = {
  // ── Page / body ───────────────────────────────────────────────────────────
  pageBg:   "bg-stone-50 dark:bg-stone-950",
  readerBg: "bg-white dark:bg-[#2C2C2A]",

  // ── Component surfaces ────────────────────────────────────────────────────
  /** Cards, form sections, modals */
  card:     "bg-white dark:bg-stone-900",
  /** Inline code, small chips, drag-zone highlight */
  inlineBg: "bg-stone-100 dark:bg-stone-800",
  /** Row / item hover state */
  hoverBg:  "hover:bg-stone-100 dark:hover:bg-stone-800",

  // ── Headers / nav ─────────────────────────────────────────────────────────
  navBg:          "bg-stone-50/90 dark:bg-stone-950/90 backdrop-blur-sm",
  readerHeaderBg: "bg-white/95 dark:bg-[#1F1E1C]/95 backdrop-blur-sm",

  // ── Borders ───────────────────────────────────────────────────────────────
  border:              "border-stone-200 dark:border-stone-800",
  borderStrong:        "border-stone-300 dark:border-stone-700",
  readerHeaderBorder:  "border-stone-200 dark:border-[#141413]",

  // ── Text ─────────────────────────────────────────────────────────────────
  text:          "text-stone-900 dark:text-stone-100",
  textSecondary: "text-stone-700 dark:text-stone-300",
  textMuted:     "text-stone-500 dark:text-stone-400",
  textFaint:     "text-stone-400 dark:text-stone-500",
  /** Navigation links, secondary button labels */
  textLabel:     "text-stone-600 dark:text-stone-400",

  // ── Buttons ───────────────────────────────────────────────────────────────
  /** Primary CTA — dark-on-light inverts in dark mode */
  btnPrimary: "bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 hover:bg-stone-700 dark:hover:bg-stone-300 transition-colors",
  /** Outlined secondary — use alongside .btn-secondary CSS class or stand-alone */
  btnOutline: "border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors",

  // ── Nav link (text-only, with hover bg) ──────────────────────────────────
  navLink: "text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors",

  // ── Tags / pills ─────────────────────────────────────────────────────────
  tag: "bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400",

  // ── Danger ────────────────────────────────────────────────────────────────
  dangerBg:     "bg-red-50 dark:bg-red-950/30",
  dangerBorder: "border-red-200 dark:border-red-900",
  dangerText:   "text-red-600 dark:text-red-400",
  /** Hover-into-danger: combine with a base border/text to get a red hover state */
  dangerHover:  "hover:border-red-200 dark:hover:border-red-900 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30",
  /** Active/confirming danger state (no hover needed, already in danger) */
  dangerActive: "bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400",

  // ── Accent (blue) ─────────────────────────────────────────────────────────
  accentProgress:      "bg-blue-600 dark:bg-blue-500",
  accentProgressTrack: "bg-stone-200 dark:bg-[#1a1a18]",

  // ── Reader TOC sidebar ────────────────────────────────────────────────────
  sidebarBg:     "bg-stone-50 dark:bg-[#222220]",
  sidebarBorder: "border-stone-200 dark:border-[#1a1918]",
  sidebarSep:    "border-stone-200 dark:border-stone-800/60",
  sidebarLabel:  "text-stone-400 dark:text-stone-400",
  sidebarItemActive:    "text-blue-600 dark:text-blue-300 bg-blue-50 dark:bg-white/10 border-l-2 border-blue-500 dark:border-blue-400 pl-[calc(1.25rem-2px)]",
  sidebarItemInactive:  "text-stone-500 dark:text-stone-300 hover:text-stone-800 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-white/10 border-l-2 border-transparent",
  sidebarBadgeActive:   "bg-blue-500 dark:bg-blue-500/80 text-white",
  sidebarBadgeInactive: "bg-stone-200 dark:bg-white/10 text-stone-500 dark:text-stone-400",

  // ── ThemeToggle ───────────────────────────────────────────────────────────
  toggleWrap:    "border border-stone-200 dark:border-stone-700 bg-stone-100 dark:bg-stone-800",
  toggleActive:  "bg-white dark:bg-stone-600 text-stone-800 dark:text-stone-100 shadow-sm",
  toggleInactive: "text-stone-400 dark:text-stone-500 hover:text-stone-700 dark:hover:text-stone-300",

  // ── Footer ────────────────────────────────────────────────────────────────
  footerText: "text-stone-400 dark:text-stone-600",

  // ── Reader header breadcrumb text levels ──────────────────────────────────
  breadcrumbDimmed:  "text-stone-400 dark:text-stone-500",
  breadcrumbNormal:  "text-stone-700 dark:text-stone-200",
  breadcrumbH1:      "text-stone-800 dark:text-white",
  breadcrumbH2:      "text-stone-700 dark:text-stone-200",
  breadcrumbH3:      "text-stone-600 dark:text-stone-300",
  breadcrumbDivider: "text-stone-200 dark:text-stone-700",
  breadcrumbRule:    "text-stone-200 dark:text-stone-800",
} as const;
