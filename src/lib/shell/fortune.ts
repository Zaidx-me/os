/**
 * Original fortune lines in Zaid's voice (todo 27) — no external quote packs.
 */
export const FORTUNES: readonly string[] = [
  "The London System is not a opening — it is a lifestyle choice with extra pawns.",
  "Ricing Hyprland at 2am counts as productive procrastination if the blur radius is correct.",
  "sudo rm -rf / is a personality test. You failed. The chess board reported you.",
  "Every WhatsApp API gateway starts as 'just one webhook' and ends as Docker compose files.",
  "Urdu poetry hits different when your terminal font finally supports the diacritics.",
  "CachyOS users don't reboot — they schedule a kernel update and call it self-care.",
  "If your dotfiles aren't on GitHub, did you even rice?",
  "MMA teaches you to tap out. Your terminal teaches you to Ctrl+C. Same energy.",
  "Building Maktaba offline taught me: users offline > users online complaining about latency.",
  "Applicator applies to jobs. Whatbot applies to messages. You apply to sleep. None succeed on first try.",
  "A portfolio that boots like an OS is just a flex with extra steps — worth it.",
  "SFML games in C++ for semester projects: the real grade is whether it compiles on the lab PC.",
  "Niri config.kdl looking elegant is 90% of the win. The other 10% is pretending you use it daily.",
  "Self-hosting is free until you count the electricity and the 3am nginx logs.",
  "ZaidGPT runs on vibes and a knowledge base until someone adds an API key.",
  "Chess Rookie CPU at depth 2: honest enough to lose, smug enough to gloat when it doesn't.",
  "Matrix rain in the browser: finally, a use case for canvas that isn't a chart nobody asked for.",
  "PU Stacks survived university bureaucracy. That is the real senior project.",
  "Your browser tab is the host. Your RAM is fake. Your productivity is simulated. Welcome to ZaidOS.",
  "Fortune cookies are lies. This one is also a lie, but at least it runs in zsh.",
  "When the gradient wallpaper animates and your FPS drops, that is the rice tax.",
  "Linktree exists because social bios have character limits. ZaidOS exists because limits are boring.",
  "Tower defense in the browser: proof that every CS student eventually builds one.",
  "The sudoers file is empty. The chess board is watching. Choose wisely.",
];

export function randomFortune(): string {
  const index = Math.floor(Math.random() * FORTUNES.length);
  return FORTUNES[index] ?? FORTUNES[0]!;
}
