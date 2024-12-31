export interface StatsSection {
  position: string | number;
  matchesPlayed: number;
  wins: number;
  draws: number;
  losses: number;
  points: number;
  goalsScored: number;
  goalsScoredHome: number;
  goalsScoredAway: number;
  goalsConceded: number;
  goalsConcededHome: number;
  goalsConcededAway: number;
  chance2score: number;
  chance2scoreHome: number;
  chance2scoreAway: number;
  cornersWonAvg: number;
  cornersWonOver0_5: number;
  cornersWonOver1_5: number;
  cornersWonHighest: number;
  BTTS: number;
  BTTSOver0_5: number | null;
  BTTSOver1_5: number | null;
  BTTSHighest: number | null;
  xG: number;
  dxG: number;
  shotsTaken: number;
  shotsTakenFirstHalf: number | null;
  shotsTakenSecondHalf: number | null;
  shotsConceded: number;
  shotsConcededFirstHalf: number | null;
  shotsConcededSecondHalf: number | null;
  shotsCR: number;
  shotsConcededCR: number;
  shotsOnTarget: number;
  shotsOnTargetHome: number;
  shotsOnTargetAway: number;
  possessionAvg: number;
  possessionHome: number;
  possessionAway: number;
  cleanSheets: number;
  cleanSheetsHome: number;
  cleanSheetsAway: number;
  totalFoulsCommitted: number;
  totalFoulsCommittedAgainst: number;
  dangerousAttacks: number;
  dangerousAttacksHome: number;
  dangerousAttacksAway: number;
  dangerousAttacksConceded: number;
  dangerousAttacksConcededHome: number;
  dangerousAttacksConcededAway: number;
  ppgHome: number;
  ppgAway: number;
  games?: any[];
}