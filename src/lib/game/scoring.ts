interface ScoreResult {
  deltas: Record<string, number>;
  imposterCaught: boolean;
}

/** Calculate scores for a round based on votes */
export function calculateRoundScores(
  votes: Record<string, string>,
  imposterId: string,
  playerIds: string[]
): ScoreResult {
  // Tally votes
  const tally: Record<string, number> = {};
  for (const targetId of Object.values(votes)) {
    tally[targetId] = (tally[targetId] || 0) + 1;
  }

  // Find max votes
  const maxVotes = Math.max(0, ...Object.values(tally));
  const accused = Object.entries(tally)
    .filter(([, count]) => count === maxVotes)
    .map(([id]) => id);

  // Imposter caught only if they alone have the most votes
  const imposterCaught = accused.length === 1 && accused[0] === imposterId;

  const deltas: Record<string, number> = {};
  for (const pid of playerIds) {
    deltas[pid] = 0;
  }

  if (imposterCaught) {
    // Insiders win: +10 each
    for (const pid of playerIds) {
      if (pid !== imposterId) deltas[pid] = 10;
    }
    // Bonus: +5 for correct voters
    for (const [voterId, targetId] of Object.entries(votes)) {
      if (targetId === imposterId) deltas[voterId] += 5;
    }
  } else {
    // Imposter wins: +15
    deltas[imposterId] = 15;
    // Bonus: +5 for any insider who still guessed right
    for (const [voterId, targetId] of Object.entries(votes)) {
      if (targetId === imposterId && voterId !== imposterId) {
        deltas[voterId] += 5;
      }
    }
  }

  return { deltas, imposterCaught };
}
