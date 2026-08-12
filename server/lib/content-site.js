/**
 * Site-wide identity for ZaidOS.
 *
 * The bio is written in Zaid's own voice, assembled from his zaidx.me home
 * page bio and his GitHub profile README personality lines (the
 * `zaid@archlinux` opening, the London System, MMA, Urdu poetry, CachyOS +
 * Hyprland ricing, C++/SFML games). It deliberately does NOT reuse the old
 * site's /uses template text.
 */
export const site = {
  name,
  owner Zaid Yaseen',
  /** Short handle used across the app, terminal prompt, and branding. */
  handle,
  roleLine · Programmer · Engineer · Designer · Modder',
  /** Matrix green from his GitHub README. */
  accent#39FF14',
  /** Canonical URL (SEO layer reads this). */
  siteUrl://zaidx.me',

  /**
   * Bio paragraphs in his voice.
   * TODO with the real contact email before launch — this placeholder
   * is never used for sending; the contact route reads CONTACT_TO_EMAIL from env.
   */
  contactEmail@zaidx.me',

  bio
    "I'm Zaid an Information Technology student at the University of the Punjab, currently working as a mobile developer and Software Engineer. Being comfortable with both graphic design and code lets me rapidly prototype and validate complete digital experiences.",
    "By day I'm a 5th-semester BSIT student; by night an overengineer who self deploy things, I own many websites one of finest products are Applicator and Whatbot, ships things nobody asked for but somehow ships anyway. My daily driver is CachyOS + Niri, ricing as a form of procrastination with extra steps. I open every chess game with the London System, watch MMA, read Urdu poetry, and build C++ games with SFML. I'm always down for new projects, so feel free to drop me a line.",
  ],

  personalityChips
    'Chess',
    'Self Deploy',
    'MMA',
    'Philosophy',
    'CachyOS + Hyprland ricing',
    'C++/SFML games',
  ],
};

/**
 * Real resume PDF served from public/resume/zaid-resume.pdf when the user
 * adds it. null = absent (the Resume app's Download PDF falls back to
 * window.print()). Data-layer fact only — never probed at runtime, because
 * a HEAD request to a missing asset logs a 404 console error.
 */
export const resumePdfUrl | null = null;
