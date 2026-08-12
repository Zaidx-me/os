/**
 * Portfolio filesystem tree — real content only (projects, articles, site).
 */
import { articles, projects, site } from "../../content/index.ts";

function dir(children) {
  return { type: "dir", children: new Map(Object.entries(children)) };
}

function file(content) {
  return { type: "file", content };
}

const PICTURE_FILES = [
  "coast.webp",
  "forest.webp",
  "portrait.webp",
  "puppy.webp",
  "river.webp",
];

function projectReadme(title, tagline, description, links) {
  const lines = [`# ${title}`, "", tagline, "", description, ""];
  if (links.length > 0) {
    lines.push("Links:", ...links.map((l) => `- ${l}`), "");
  }
  return lines.join("\n");
}

export function buildPortfolioTree() {
  const projectDirs = {};
  for (const p of projects) {
    const links = [];
    if (p.links.live) links.push(`Live: ${p.links.live}`);
    if (p.links.repo) links.push(`Repo: ${p.links.repo}`);
    if (p.links.article) links.push(`Article: ${p.links.article}`);
    projectDirs[p.id] = dir({
      "README.md": file(projectReadme(p.title, p.tagline, p.description, links)),
    });
  }

  const articleFiles = {};
  for (const a of articles) {
    articleFiles[`${a.slug}.md`] = file(
      [`# ${a.title}`, "", a.description, "", `Published: ${a.date}`, a.readingTime].join("\n"),
    );
  }

  const pictureFiles = {};
  for (const name of PICTURE_FILES) {
    pictureFiles[name] = file(`Image: /pictures/optimized/${name} — open in Photos.\n`);
  }

  return dir({
    home: dir({
      zaid: dir({
        Desktop: dir({}),
        Documents: dir({
          "Resume.txt": file(
            [
              site.owner,
              site.roleLine,
              "",
              "Open the Resume app for the full PDF-style layout.",
            ].join("\n"),
          ),
          ...articleFiles,
        }),
        Downloads: dir({}),
        Pictures: dir(pictureFiles),
        Projects: dir(projectDirs),
        "README.md": file(
          [
            `# ${site.name}`,
            "",
            site.roleLine,
            "",
            "Browse Projects, Documents, and Pictures — or open apps from the Dock.",
          ].join("\n"),
        ),
      }),
    }),
  });
}
