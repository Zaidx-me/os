const commands = new Map();

export function register(cmd) {
  commands.set(cmd.name, cmd);
}

export function findCommand(name) {
  const direct = commands.get(name);
  if (direct) return direct;
  for (const cmd of commands.values()) {
    if (cmd.aliases?.includes(name)) return cmd;
  }
  return undefined;
}

export function listCommands() {
  return [...commands.values()];
}

export function clearCommands() {
  commands.clear();
}
