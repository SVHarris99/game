import type { PlayerDocument, SecretDocument } from "@/types/game";

interface RoleAssignment {
  imposterId: string;
  secrets: Map<string, SecretDocument>;
}

/** Randomly assign one player as imposter, rest as insiders */
export function assignRoles(
  players: PlayerDocument[],
  category: string,
  word: string
): RoleAssignment {
  const imposterIndex = Math.floor(Math.random() * players.length);
  const imposterId = players[imposterIndex].id;

  const secrets = new Map<string, SecretDocument>();

  for (const player of players) {
    const isImposter = player.id === imposterId;
    secrets.set(player.id, {
      playerId: player.id,
      role: isImposter ? "imposter" : "insider",
      word: isImposter ? "" : word,
      category,
    });
  }

  return { imposterId, secrets };
}
