import aiJobApplicationAssistant from "../content/articles/ai-job-application-assistant.md?raw";
import buildingOfflineUrduReader from "../content/articles/building-offline-urdu-reader.md?raw";
import buildingWhatsappGateway from "../content/articles/building-whatsapp-gateway.md?raw";
import designingUniversityCourseware from "../content/articles/designing-university-courseware-platform.md?raw";

const bodies = {
  "ai-job-application-assistant": aiJobApplicationAssistant,
  "building-offline-urdu-reader": buildingOfflineUrduReader,
  "building-whatsapp-gateway": buildingWhatsappGateway,
  "designing-university-courseware-platform": designingUniversityCourseware,
};

function stripFrontmatter(raw) {
  if (!raw.startsWith("---")) return raw;
  const match = /^---\r?\n[\s\S]*?\r?\n---\r?\n([\s\S]*)$/.exec(raw);
  return match ? match[1] : raw;
}

export function getArticleBody(slug) {
  const raw = bodies[slug];
  return raw ? stripFrontmatter(raw) : "";
}
