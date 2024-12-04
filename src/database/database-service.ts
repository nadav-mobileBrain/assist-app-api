import { LeagueTeam } from "../models/league-team";
import { PredictionResponse, TeamResponse } from "../types/api-types";
import { Match } from "../models/match";
import MatchStats from "../models/match-stats";
import { MatchOdds } from "../models/match-odds";
import sequelize from "../database/sequelize";
import Fixture from "../models/fixtures";
import Prediction from "../models/predictions";
import { Op } from "sequelize";

export class DatabaseService {
  async saveLeagueTeams(teams: TeamResponse[]): Promise<void> {
    await LeagueTeam.bulkCreate(
      teams.map((team) => ({
        id: team.team.id,
        name: team.team.name,
        clean_name: team.team.name?.toLowerCase().replace(/[^a-z0-9]/g, ""),
        english_name: team.team.name,
        country: team.team.country,
        founded: team.team.founded?.toString(),
        image: team.team.logo,
        // Optional fields that might come from your API:

        season: team.season?.current,
        season_clean: team.season?.current?.toString(),
        url: team.team.website,
        table_position: team.statistics?.rank,
        performance_rank: team.statistics?.performance_rank,
        risk: team.risk,
        season_format: team.season?.format,
        competition_id: team.league?.id,
        full_name: team.team.full_name,
        alt_names: team.team.alternative_names,
        official_sites: [team.team.website].filter(Boolean),
      })),
      {
        updateOnDuplicate: [
          "name",
          "clean_name",
          "english_name",
          "country",
          "founded",
          "image",
          "season",
          "season_clean",
          "url",
          "table_position",
          "performance_rank",
          "risk",
          "season_format",
          "competition_id",
          "full_name",
          "alt_names",
          "official_sites",
        ],
      }
    );
  }

  async getMatches(params: any): Promise<Match[]> {
    return Match.findAll({
      where: params,
      include: [
        {
          model: MatchStats,
          as: "stats",
        },
        {
          model: MatchOdds,
          as: "odds",
        },
      ],
    });
  }

  async saveMatches(matches: any[]): Promise<void> {
    try {
      for (const match of matches) {
        // First check if match exists
        const existingMatch = await Match.findByPk(match.id);
        if (existingMatch) {
          continue; // Skip if exists
        }

        // Validate required fields
        if (!match.id || !match.homeID || !match.awayID) {
          console.warn(`Skipping match due to missing required fields:`, match);
          continue;
        }

        // Check if teams exist
        const homeTeam = await LeagueTeam.findByPk(match.homeID);
        const awayTeam = await LeagueTeam.findByPk(match.awayID);
        if (!homeTeam || !awayTeam) {
          console.warn(
            `Skipping match due to missing team(s): Home=${match.homeID}, Away=${match.awayID}`
          );
          continue;
        }

        // Create match with transaction
        await sequelize.transaction(async (t) => {
          const createdMatch = await Match.create(
            {
              id: match.id,
              homeTeamId: match.homeID,
              awayTeamId: match.awayID,
              season: match.season,
              status: match.status,
              date_unix: match.date_unix,
              competition_id: match.competition_id,
              stadium_name: match.stadium_name,
              attendance: match.attendance,
              referee_id: match.refereeID,
            },
            { transaction: t }
          );

          if (match.homeGoalCount !== undefined) {
            await MatchStats.create(
              {
                match_id: match.id,
                home_goals: match.homeGoalCount,
                away_goals: match.awayGoalCount,
                home_corners: match.team_a_corners,
                away_corners: match.team_b_corners,
                home_shots_on_target: match.team_a_shotsOnTarget,
                away_shots_on_target: match.team_b_shotsOnTarget,
                home_possession: match.team_a_possession,
                away_possession: match.team_b_possession,
                home_xg: match.team_a_xg,
                away_xg: match.team_b_xg,
              },
              { transaction: t }
            );
          }

          if (match.odds_ft_1 !== undefined) {
            await MatchOdds.create(
              {
                match_id: match.id,
                odds_ft_1: match.odds_ft_1,
                odds_ft_x: match.odds_ft_x,
                odds_ft_2: match.odds_ft_2,
                odds_btts_yes: match.odds_btts_yes,
                odds_btts_no: match.odds_btts_no,
                odds_over25: match.odds_ft_over25,
                odds_under25: match.odds_ft_under25,
              },
              { transaction: t }
            );
          }
        });
      }
    } catch (error) {
      console.error("Error saving matches:", error);
    }
  }

  async saveFixtures(fixtures: any[]): Promise<void> {
    await Fixture.bulkCreate(
      fixtures.map((fixture) => ({
        fixture_id: fixture.fixture?.id,
        referee: fixture.fixture?.referee,
        timezone: fixture.fixture?.timezone,
        fixture_date: fixture.fixture?.date,
        timestamp: fixture.fixture?.timestamp,
        first_period_start: fixture.fixture?.periods?.first,
        second_period_start: fixture.fixture?.periods?.second,
        venue_id: fixture.fixture?.venue?.id,
        venue_name: fixture.fixture?.venue?.name,
        venue_city: fixture.fixture?.venue?.city,
        status_long: fixture.fixture?.status?.long,
        status_short: fixture.fixture?.status?.short,
        status_elapsed: fixture.fixture?.status?.elapsed,
        league_id: fixture.league?.id,
        league_name: fixture.league?.name,
        league_country: fixture.league?.country,
        league_logo: fixture.league?.logo,
        league_flag: fixture.league?.flag,
        league_season: fixture.league?.season,
        league_round: fixture.league?.round,
        home_team_id: fixture.teams?.home?.id,
        home_team_name: fixture.teams?.home?.name,
        home_team_logo: fixture.teams?.home?.logo,
        home_team_winner: fixture.teams?.home?.winner,
        away_team_id: fixture.teams?.away?.id,
        away_team_name: fixture.teams?.away?.name,
        away_team_logo: fixture.teams?.away?.logo,
        away_team_winner: fixture.teams?.away?.winner,
        home_goals: fixture.goals?.home,
        away_goals: fixture.goals?.away,
        halftime_score_home: fixture.score?.halftime?.home,
        halftime_score_away: fixture.score?.halftime?.away,
        fulltime_score_home: fixture.score?.fulltime?.home,
        fulltime_score_away: fixture.score?.fulltime?.away,
        extra_time_score_home: fixture.score?.extratime?.home,
        extra_time_score_away: fixture.score?.extratime?.away,
        penalty_score_home: fixture.score?.penalty?.home,
        penalty_score_away: fixture.score?.penalty?.away,
      })),
      {
        updateOnDuplicate: [
          "referee",
          "timezone",
          "fixture_date",
          "timestamp",
          "status_long",
          "status_short",
          "status_elapsed",
          "home_goals",
          "away_goals",
          "halftime_score_home",
          "halftime_score_away",
          "fulltime_score_home",
          "fulltime_score_away",
          "home_team_id",
          "away_team_id",
          "home_team_name",
          "home_team_logo",
          "away_team_name",
          "away_team_logo",
          "extra_time_score_home",
          "extra_time_score_away",
          "penalty_score_home",
          "penalty_score_away",
          "first_period_start",
          "second_period_start",
          "home_team_winner",
          "away_team_winner",
          "league_id",
          "league_name",
          "league_country",
          "league_logo",
          "league_flag",
          "league_season",
          "league_round",
        ],
      }
    );
  }

  async getFixtures(params: any): Promise<Fixture[]> {
    const predictions = await Prediction.findAll({
      attributes: ["fixture_id"],
    });
    return Fixture.findAll({
      attributes: ["fixture_id"],
      where: {
        fixture_id: {
          [Op.notIn]: predictions.map((prediction) => prediction.fixture_id),
        },
      },
    });
  }

  async savePredictions(predictions: PredictionResponse[]): Promise<void> {
    await Prediction.bulkCreate(
      predictions.map((prediction) => ({
        fixture_id: prediction.fixture_id,
        prediction_winner_id: prediction.predictions?.winner?.id,
        prediction_winner_name: prediction.predictions?.winner?.name,
        prediction_winner_comment: prediction.predictions?.winner?.comment,
        prediction_win_or_draw: prediction.predictions?.win_or_draw,
        prediction_under_over: prediction.predictions?.under_over,
        prediction_goals_home: prediction.predictions?.goals?.home,
        prediction_goals_away: prediction.predictions?.goals?.away,
        prediction_advice: prediction.predictions?.advice,
        prediction_percent_home: prediction.predictions?.percent?.home,
        prediction_percent_draw: prediction.predictions?.percent?.draw,
        prediction_percent_away: prediction.predictions?.percent?.away,
        league_id: prediction.league?.id,
        league_name: prediction.league?.name,
        league_country: prediction.league?.country,
        league_logo: prediction.league?.logo,
        league_flag: prediction.league?.flag,
        league_season: prediction.league?.season,
        home_team_id: prediction.teams?.home?.id,
        home_team_name: prediction.teams?.home?.name,
        home_team_logo: prediction.teams?.home?.logo,
        home_last_5_form: prediction.teams?.home?.last_5?.form,
        home_last_5_att: prediction.teams?.home?.last_5?.att,
        home_last_5_def: prediction.teams?.home?.last_5?.def,
        home_goals_for_total: prediction.teams?.home?.last_5?.goals?.for?.total,
        home_goals_against_total:
          prediction.teams?.home?.last_5?.goals?.against?.total,
        away_team_id: prediction.teams?.away?.id,
        away_team_name: prediction.teams?.away?.name,
        away_team_logo: prediction.teams?.away?.logo,
        away_last_5_form: prediction.teams?.away?.last_5?.form,
        away_last_5_att: prediction.teams?.away?.last_5?.att,
        away_last_5_def: prediction.teams?.away?.last_5?.def,
        away_goals_for_total: prediction.teams?.away?.last_5?.goals?.for?.total,
        away_goals_against_total:
          prediction.teams?.away?.last_5?.goals?.against?.total,
        comparison_form_home: prediction.comparison?.form?.home,
        comparison_form_away: prediction.comparison?.form?.away,
        comparison_att_home: prediction.comparison?.att?.home,
        comparison_att_away: prediction.comparison?.att?.away,
        comparison_def_home: prediction.comparison?.def?.home,
        comparison_def_away: prediction.comparison?.def?.away,
        comparison_poisson_distribution_home:
          prediction.comparison?.poisson_distribution?.home,
        comparison_poisson_distribution_away:
          prediction.comparison?.poisson_distribution?.away,
        comparison_h2h_home: prediction.comparison?.h2h?.home,
        comparison_h2h_away: prediction.comparison?.h2h?.away,
      })),
      {
        updateOnDuplicate: [
          "prediction_winner_id",
          "prediction_winner_name",
          "prediction_winner_comment",
          "prediction_win_or_draw",
          "prediction_under_over",
          "prediction_goals_home",
          "prediction_goals_away",
          "prediction_advice",
          "prediction_percent_home",
          "prediction_percent_draw",
          "prediction_percent_away",
          "league_id",
          "league_name",
          "league_country",
          "league_logo",
          "league_flag",
          "league_season",
          "home_team_id",
          "home_team_name",
          "home_team_logo",
          "home_last_5_form",
          "home_last_5_att",
          "home_last_5_def",
          "home_goals_for_total",
          "home_goals_against_total",
          "away_team_id",
          "away_team_name",
          "away_team_logo",
          "away_last_5_form",
          "away_last_5_att",
          "away_last_5_def",
          "away_goals_for_total",
          "away_goals_against_total",
          "comparison_form_home",
          "comparison_form_away",
          "comparison_att_home",
          "comparison_att_away",
          "comparison_def_home",
          "comparison_def_away",
          "comparison_poisson_distribution_home",
          "comparison_poisson_distribution_away",
          "comparison_h2h_home",
          "comparison_h2h_away",
        ],
      }
    );
  }

  async getMatchesForJson(date: string, leagueName: string): Promise<any[]> {
    if (!date || !leagueName) {
      return [];
    }
    const teams = await LeagueTeam.findAll({
      attributes: [
        ["clean_name", "name"],
        ["clean_name", "logo"],
      ],
      order: [["clean_name", "DESC"]],
    });

    return teams.map((team) => ({
      uefa_euro_qualifiers_group: null,
      uefa_euro_qualifiers_table: null,
      uefa_euro_championship_group: null,
      uefa_euro_championship_table: null,
      ...team.toJSON(),
    }));
  }
}
