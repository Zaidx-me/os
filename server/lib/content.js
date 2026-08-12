/** Server-side content snapshot for chat prompt (mirrors src/zaidos/content). */
export const site = {
  name: "ZaidOS",
  owner: "Muhammad Zaid Yaseen",
  handle: "zaidx",
  roleLine: "Developer · Programmer · Engineer · Designer · Modder",
  siteUrl: "https://zaidx.me",
  contactEmail: "owner@zaidx.me",
  bio: [
    "I'm Zaid an Information Technology student at the University of the Punjab, currently working as a mobile developer and Software Engineer.",
    "By day I'm a 5th-semester BSIT student; by night an overengineer who ships Applicator, Whatbot, and other projects. Daily driver: CachyOS + Niri.",
  ],
};

export const projects = [
  { title: "Applicator", tagline: "AI-Powered Job Application Assistant", featured: true },
  { title: "Whatbot", tagline: "Open-Source WhatsApp API Gateway", featured: true },
  { title: "Maktaba", tagline: "Offline Urdu Book Reader", featured: true },
  { title: "PU Stacks", tagline: "University Courseware Sharing Platform", featured: true },
];

export const skillGroups = [
  { label: "Mobile", skills: [{ name: "React Native" }, { name: "Kotlin" }] },
  { label: "Frontend", skills: [{ name: "TypeScript" }, { name: "React" }, { name: "Next.js" }] },
  { label: "Backend", skills: [{ name: "Node.js" }, { name: "NestJS" }, { name: "Python" }] },
];

export const experience = [
  { role: "BSIT, Information Technology", org: "University of the Punjab", current: true },
  { role: "Freelance mobile developer", org: "Self Employed", current: true },
];

export const socials = [
  { label: "GitHub", url: "https://github.com/zaidx-me" },
  { label: "LinkedIn", url: "https://linkedin.com/in/zaidx-me" },
];

export const articles = [
  { slug: "building-whatsapp-gateway", title: "Building a WhatsApp API Gateway with MCP Server Integration" },
  { slug: "building-offline-urdu-reader", title: "Building an Offline-First Urdu Book Reader" },
  { slug: "designing-university-courseware-platform", title: "Designing a University Courseware Platform" },
  { slug: "ai-job-application-assistant", title: "How I Built an AI-Powered Job Application Assistant" },
];
