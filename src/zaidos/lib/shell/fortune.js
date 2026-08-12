export const FORTUNES = [
  "The London System is not an opening — it is a lifestyle choice with extra pawns.",
  "Ricing Hyprland at 2am counts as productive procrastination if the blur radius is correct.",
  "sudo rm -rf / is a personality test. You failed. The chess board reported you.",
  "Every WhatsApp API gateway starts as 'just one webhook' and ends as Docker compose files.",
  "CachyOS users don't reboot — they schedule a kernel update and call it self-care.",
  "If your dotfiles aren't on GitHub, did you even rice?",
  "Building Maktaba offline taught me: users offline > users online complaining about latency.",
  "A portfolio that boots like an OS is just a flex with extra steps — worth it.",
  "ZaidGPT runs on vibes and a knowledge base until someone adds an API key.",
  "Your browser tab is the host. Your RAM is fake. Your productivity is simulated. Welcome to ZaidOS.",
  "Fortune cookies are lies. This one is also a lie, but at least it runs in zsh.",
];

export function randomFortune() {
  return FORTUNES[Math.floor(Math.random() * FORTUNES.length)];
}
