import { site, projects, articles } from "../content/index.ts";

/** Flat Finder file list with parentFolderId (matches Finder.jsx). */
export function buildPortfolioFinderFiles() {
  const now = new Date().toISOString();
  const files = [
    { id: "fav_home", name: "zaid", type: "folder", size: 0, date: now },
    { id: "fav_desktop", name: "Desktop", type: "folder", size: 0, date: now },
    { id: "fav_documents", name: "Documents", type: "folder", size: 0, date: now },
    { id: "fav_projects", name: "Projects", type: "folder", size: 0, date: now },
    { id: "fav_pictures", name: "Pictures", type: "folder", size: 0, date: now },
    {
      id: "readme",
      name: "README.md",
      type: "document",
      size: 512,
      date: now,
      content: `# ${site.name}\n\n${site.roleLine}\n\n${site.bio[0]}`,
    },
  ];

  for (const a of articles) {
    files.push({
      id: `art_${a.slug}`,
      name: `${a.slug}.md`,
      type: "document",
      size: a.description.length + 200,
      date: a.date,
      parentFolderId: "fav_documents",
      content: `# ${a.title}\n\n${a.description}\n\nPublished: ${a.date} · ${a.readingTime}`,
    });
  }

  for (const p of projects) {
    const folderId = `proj_${p.id}`;
    files.push({
      id: folderId,
      name: p.title,
      type: "folder",
      size: 0,
      date: now,
      parentFolderId: "fav_projects",
      tag: p.featured ? "blue" : undefined,
      meta: { description: p.tagline, links: p.links },
    });
    const links = [];
    if (p.links.live) links.push(`Live: ${p.links.live}`);
    if (p.links.repo) links.push(`Repo: ${p.links.repo}`);
    if (p.links.article) links.push(`Article: ${p.links.article}`);
    files.push({
      id: `${folderId}_readme`,
      name: "README.md",
      type: "document",
      size: 256,
      date: now,
      parentFolderId: folderId,
      content: [
        `# ${p.title}`,
        "",
        p.tagline,
        "",
        p.description,
        "",
        ...(links.length ? ["Links:", ...links.map((l) => `- ${l}`)] : []),
      ].join("\n"),
    });
  }

  return files;
}
