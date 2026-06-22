CREATE TABLE "accolades" (
	"id" serial PRIMARY KEY NOT NULL,
	"player_id" integer NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"season" text,
	"date_earned" date,
	"verified" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "activity_streaks" (
	"id" serial PRIMARY KEY NOT NULL,
	"player_id" integer NOT NULL,
	"streak_type" text NOT NULL,
	"current_streak" integer DEFAULT 0 NOT NULL,
	"longest_streak" integer DEFAULT 0 NOT NULL,
	"last_activity_date" date,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "ai_projections" (
	"id" serial PRIMARY KEY NOT NULL,
	"player_id" integer NOT NULL,
	"projection_type" text NOT NULL,
	"projected_overall" integer,
	"projected_potential" integer,
	"projected_ppg" numeric(4, 1),
	"projected_rpg" numeric(4, 1),
	"projected_apg" numeric(4, 1),
	"projected_fg_pct" numeric(4, 1),
	"strengths_analysis" text,
	"areas_to_improve" text,
	"comparison_player" text,
	"college_fit" text,
	"confidence_score" integer,
	"data_points_used" integer,
	"model_version" text,
	"valid_until" timestamp,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "alerts" (
	"id" serial PRIMARY KEY NOT NULL,
	"player_id" integer NOT NULL,
	"alert_type" text NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"severity" text NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL,
	"related_game_id" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "athletic_measurements" (
	"id" serial PRIMARY KEY NOT NULL,
	"player_id" integer NOT NULL,
	"court_sprint_seconds" real,
	"standing_vertical_inches" real,
	"max_vertical_inches" real,
	"bench_press_reps" integer,
	"bench_press_weight" integer,
	"measured_at" timestamp DEFAULT now(),
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "badges" (
	"id" serial PRIMARY KEY NOT NULL,
	"player_id" integer NOT NULL,
	"badge_type" text NOT NULL,
	"game_id" integer,
	"earned_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "caliber_badges" (
	"id" serial PRIMARY KEY NOT NULL,
	"player_id" integer NOT NULL,
	"awarded_by" text NOT NULL,
	"reason" text,
	"category" text DEFAULT 'excellence' NOT NULL,
	"awarded_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "challenge_progress" (
	"id" serial PRIMARY KEY NOT NULL,
	"challenge_id" integer NOT NULL,
	"player_id" integer NOT NULL,
	"current_value" integer DEFAULT 0 NOT NULL,
	"completed" boolean DEFAULT false NOT NULL,
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "challenge_results" (
	"id" serial PRIMARY KEY NOT NULL,
	"challenge_id" integer NOT NULL,
	"player_id" integer NOT NULL,
	"score" integer NOT NULL,
	"time_elapsed" integer,
	"attempt_number" integer DEFAULT 1 NOT NULL,
	"video_proof_url" text,
	"is_verified" boolean DEFAULT false NOT NULL,
	"verified_by_user_id" text,
	"leaderboard_rank" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "challenges" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"challenge_type" text NOT NULL,
	"target_type" text NOT NULL,
	"target_value" integer NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"badge_reward" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "coach_goals" (
	"id" serial PRIMARY KEY NOT NULL,
	"player_id" integer NOT NULL,
	"coach_name" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"target_type" text NOT NULL,
	"target_category" text NOT NULL,
	"target_value" integer NOT NULL,
	"deadline" date,
	"status" text DEFAULT 'active' NOT NULL,
	"coach_feedback" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "coach_recommendations" (
	"id" serial PRIMARY KEY NOT NULL,
	"player_id" integer NOT NULL,
	"coach_user_id" text NOT NULL,
	"coach_name" text NOT NULL,
	"coach_title" text,
	"coach_organization" text,
	"coach_email" text,
	"coach_phone" text,
	"recommendation" text NOT NULL,
	"relationship" text,
	"years_known" integer,
	"athletic_ability_rating" integer,
	"work_ethic_rating" integer,
	"coachability_rating" integer,
	"leadership_rating" integer,
	"character_rating" integer,
	"is_verified" boolean DEFAULT false,
	"is_public" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "coin_transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"amount" integer NOT NULL,
	"type" text NOT NULL,
	"description" text,
	"related_item_id" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "college_coaching_staff" (
	"id" serial PRIMARY KEY NOT NULL,
	"college_id" integer NOT NULL,
	"espn_id" text,
	"name" text NOT NULL,
	"first_name" text,
	"last_name" text,
	"title" text,
	"experience" integer,
	"headshot_url" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "college_roster_players" (
	"id" serial PRIMARY KEY NOT NULL,
	"college_id" integer NOT NULL,
	"espn_id" text,
	"name" text NOT NULL,
	"first_name" text,
	"last_name" text,
	"jersey" text,
	"position" text,
	"height" text,
	"weight" text,
	"class_year" text,
	"hometown" text,
	"headshot_url" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "colleges" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"short_name" text,
	"espn_team_id" text,
	"logo_url" text,
	"city" text NOT NULL,
	"state" text NOT NULL,
	"region" text,
	"division" text NOT NULL,
	"conference" text,
	"academic_rating" integer,
	"avg_gpa_required" numeric(3, 2),
	"sat_range" text,
	"sport" text DEFAULT 'basketball' NOT NULL,
	"program_strength" integer,
	"coaching_rating" integer,
	"facilities_rating" integer,
	"wins_last_season" integer,
	"losses_last_season" integer,
	"conference_record" text,
	"national_championships" integer DEFAULT 0,
	"conference_championships" integer DEFAULT 0,
	"tournament_appearances" integer DEFAULT 0,
	"final_four_appearances" integer DEFAULT 0,
	"nba_players_produced" integer DEFAULT 0,
	"nfl_players_produced" integer DEFAULT 0,
	"draft_picks_last_5_years" integer DEFAULT 0,
	"avg_minutes_freshmen" integer,
	"athlete_graduation_rate" integer,
	"academic_all_americans" integer DEFAULT 0,
	"athletic_budget" text,
	"average_attendance" integer,
	"nil_opportunities" text,
	"current_roster_size" integer,
	"incoming_recruiting_class" integer,
	"head_coach_name" text,
	"head_coach_years" integer,
	"head_coach_record" text,
	"tempo_rating" integer,
	"defensive_style" text,
	"offensive_style" text,
	"position_needs" text,
	"scholarships_available" integer,
	"recruiting_contact_email" text,
	"recruiting_url" text,
	"stats_last_updated" timestamp,
	"stats_source" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "comments" (
	"id" serial PRIMARY KEY NOT NULL,
	"game_id" integer NOT NULL,
	"author_name" text NOT NULL,
	"content" text NOT NULL,
	"session_id" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "conversations" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dm_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"thread_id" integer NOT NULL,
	"sender_user_id" text,
	"sender_player_id" integer,
	"content" text NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "dm_participants" (
	"id" serial PRIMARY KEY NOT NULL,
	"thread_id" integer NOT NULL,
	"user_id" text,
	"player_id" integer,
	"last_read_at" timestamp,
	"joined_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "dm_threads" (
	"id" serial PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "drill_recommendations" (
	"id" serial PRIMARY KEY NOT NULL,
	"player_id" integer NOT NULL,
	"drill_id" integer,
	"drill_name" text,
	"drill_category" text,
	"reason" text NOT NULL,
	"priority" integer NOT NULL,
	"weak_stat" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "drill_scores" (
	"id" serial PRIMARY KEY NOT NULL,
	"practice_id" integer NOT NULL,
	"player_id" integer NOT NULL,
	"drill_id" integer NOT NULL,
	"score" integer NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "drills" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"category" text NOT NULL,
	"description" text,
	"target_stat" text
);
--> statement-breakpoint
CREATE TABLE "endorsements" (
	"id" serial PRIMARY KEY NOT NULL,
	"coach_user_id" text NOT NULL,
	"player_id" integer NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"skills" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "event_game_links" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" integer NOT NULL,
	"game_id" integer NOT NULL,
	"external_game_id" text,
	"external_stats_url" text,
	"sync_status" text DEFAULT 'pending',
	"last_sync_at" timestamp,
	"sync_error" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "event_integrations" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_name" text NOT NULL,
	"event_type" text NOT NULL,
	"organization_name" text NOT NULL,
	"external_event_id" text,
	"external_api_source" text,
	"start_date" date NOT NULL,
	"end_date" date,
	"location" text,
	"sport" text DEFAULT 'basketball' NOT NULL,
	"is_official" boolean DEFAULT false NOT NULL,
	"verification_code" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "feed_activities" (
	"id" serial PRIMARY KEY NOT NULL,
	"activity_type" text NOT NULL,
	"player_id" integer,
	"game_id" integer,
	"badge_id" integer,
	"related_id" integer,
	"headline" text NOT NULL,
	"subtext" text,
	"session_id" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "feed_comment_likes" (
	"id" serial PRIMARY KEY NOT NULL,
	"comment_id" integer NOT NULL,
	"session_id" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "unique_comment_like" UNIQUE("comment_id","session_id")
);
--> statement-breakpoint
CREATE TABLE "feed_comments" (
	"id" serial PRIMARY KEY NOT NULL,
	"activity_id" integer NOT NULL,
	"parent_id" integer,
	"session_id" text NOT NULL,
	"author_name" text NOT NULL,
	"content" text NOT NULL,
	"like_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "feed_reactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"activity_id" integer NOT NULL,
	"session_id" text NOT NULL,
	"reaction_type" text NOT NULL,
	"player_name" text,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "unique_user_reaction_per_activity" UNIQUE("activity_id","session_id","reaction_type")
);
--> statement-breakpoint
CREATE TABLE "fitness_data" (
	"id" serial PRIMARY KEY NOT NULL,
	"player_id" integer NOT NULL,
	"source" text NOT NULL,
	"synced_at" timestamp,
	"date" date NOT NULL,
	"step_count" integer,
	"active_minutes" integer,
	"calories_burned" integer,
	"distance_meters" numeric(10, 2),
	"resting_heart_rate" integer,
	"avg_heart_rate" integer,
	"max_heart_rate" integer,
	"hrv_score" integer,
	"sleep_hours" numeric(4, 2),
	"sleep_quality_score" integer,
	"deep_sleep_minutes" integer,
	"rem_sleep_minutes" integer,
	"recovery_score" integer,
	"strain_score" numeric(4, 2),
	"readiness_score" integer,
	"workout_count" integer,
	"training_load_score" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "follows" (
	"id" serial PRIMARY KEY NOT NULL,
	"follower_player_id" integer,
	"follower_user_id" text,
	"followee_player_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "football_metrics" (
	"id" serial PRIMARY KEY NOT NULL,
	"player_id" integer NOT NULL,
	"total_points_sis" numeric(5, 1),
	"hand_on_ball_pct" numeric(5, 2),
	"adjusted_tackle_depth" numeric(4, 2),
	"missed_tackle_rate" numeric(5, 2),
	"yac_per_completion" numeric(5, 2),
	"separation_rating" numeric(4, 2),
	"contested_catch_rate" numeric(5, 2),
	"pressure_rate" numeric(5, 2),
	"time_to_throw" numeric(4, 2),
	"accuracy_rating" numeric(4, 2),
	"pass_block_win_rate" numeric(5, 2),
	"run_block_grade" numeric(4, 2),
	"forty_yard_dash" numeric(4, 2),
	"vertical_jump" numeric(4, 1),
	"broad_jump" integer,
	"three_cone_drill" numeric(4, 2),
	"shuttle_time" numeric(4, 2),
	"bench_press_reps" integer,
	"wingspan" numeric(4, 2),
	"hand_size" numeric(4, 2),
	"physicality" integer,
	"football_iq" integer,
	"mental_toughness" integer,
	"coachability" integer,
	"leadership" integer,
	"work_ethic" integer,
	"competitiveness" integer,
	"clutch_performance" integer,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "game_notes" (
	"id" serial PRIMARY KEY NOT NULL,
	"game_id" integer NOT NULL,
	"player_id" integer NOT NULL,
	"author_name" text NOT NULL,
	"created_by" text,
	"content" text NOT NULL,
	"note_type" text NOT NULL,
	"is_private" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "games" (
	"id" serial PRIMARY KEY NOT NULL,
	"player_id" integer NOT NULL,
	"sport" text DEFAULT 'basketball' NOT NULL,
	"date" date NOT NULL,
	"opponent" text NOT NULL,
	"result" text,
	"minutes" integer DEFAULT 0 NOT NULL,
	"points" integer DEFAULT 0 NOT NULL,
	"rebounds" integer DEFAULT 0 NOT NULL,
	"assists" integer DEFAULT 0 NOT NULL,
	"steals" integer DEFAULT 0 NOT NULL,
	"blocks" integer DEFAULT 0 NOT NULL,
	"turnovers" integer DEFAULT 0 NOT NULL,
	"fouls" integer DEFAULT 0 NOT NULL,
	"fg_made" integer DEFAULT 0 NOT NULL,
	"fg_attempted" integer DEFAULT 0 NOT NULL,
	"three_made" integer DEFAULT 0 NOT NULL,
	"three_attempted" integer DEFAULT 0 NOT NULL,
	"ft_made" integer DEFAULT 0 NOT NULL,
	"ft_attempted" integer DEFAULT 0 NOT NULL,
	"offensive_rebounds" integer DEFAULT 0,
	"defensive_rebounds" integer DEFAULT 0,
	"hustle_score" integer DEFAULT 50,
	"defense_rating" integer DEFAULT 50,
	"plus_minus" integer DEFAULT 0,
	"per" numeric(5, 2) DEFAULT '0',
	"notes" text,
	"completions" integer DEFAULT 0,
	"pass_attempts" integer DEFAULT 0,
	"passing_yards" integer DEFAULT 0,
	"passing_touchdowns" integer DEFAULT 0,
	"interceptions" integer DEFAULT 0,
	"sacks_taken" integer DEFAULT 0,
	"carries" integer DEFAULT 0,
	"rushing_yards" integer DEFAULT 0,
	"rushing_touchdowns" integer DEFAULT 0,
	"fumbles" integer DEFAULT 0,
	"receptions" integer DEFAULT 0,
	"targets" integer DEFAULT 0,
	"receiving_yards" integer DEFAULT 0,
	"receiving_touchdowns" integer DEFAULT 0,
	"drops" integer DEFAULT 0,
	"tackles" integer DEFAULT 0,
	"solo_tackles" integer DEFAULT 0,
	"sacks" integer DEFAULT 0,
	"defensive_interceptions" integer DEFAULT 0,
	"pass_deflections" integer DEFAULT 0,
	"forced_fumbles" integer DEFAULT 0,
	"fumble_recoveries" integer DEFAULT 0,
	"field_goals_made" integer DEFAULT 0,
	"field_goals_attempted" integer DEFAULT 0,
	"extra_points_made" integer DEFAULT 0,
	"extra_points_attempted" integer DEFAULT 0,
	"punts" integer DEFAULT 0,
	"punt_yards" integer DEFAULT 0,
	"pancake_blocks" integer DEFAULT 0,
	"sacks_allowed" integer DEFAULT 0,
	"penalties" integer DEFAULT 0,
	"efficiency_grade" text,
	"playmaking_grade" text,
	"ball_security_grade" text,
	"impact_grade" text,
	"grade" text,
	"feedback" text,
	"defensive_grade" text,
	"shooting_grade" text,
	"rebounding_grade" text,
	"passing_grade" text,
	"season" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "goal_shares" (
	"id" serial PRIMARY KEY NOT NULL,
	"goal_id" integer NOT NULL,
	"shared_with_player_id" integer,
	"shared_with_team_id" integer,
	"visibility" text DEFAULT 'private' NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "goals" (
	"id" serial PRIMARY KEY NOT NULL,
	"player_id" integer NOT NULL,
	"title" text NOT NULL,
	"target_type" text NOT NULL,
	"target_category" text NOT NULL,
	"target_value" integer NOT NULL,
	"deadline" date,
	"completed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "guardian_links" (
	"id" serial PRIMARY KEY NOT NULL,
	"guardian_user_id" text NOT NULL,
	"player_id" integer NOT NULL,
	"relationship" text DEFAULT 'parent' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"invite_code" text,
	"linked_at" timestamp DEFAULT now(),
	"approved_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "head_to_head_challenges" (
	"id" serial PRIMARY KEY NOT NULL,
	"challenger_player_id" integer NOT NULL,
	"opponent_player_id" integer NOT NULL,
	"metric" text NOT NULL,
	"target_value" integer,
	"challenger_game_id" integer,
	"opponent_game_id" integer,
	"status" text DEFAULT 'pending' NOT NULL,
	"winner_id" integer,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"resolved_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "highlight_clips" (
	"id" serial PRIMARY KEY NOT NULL,
	"player_id" integer NOT NULL,
	"game_id" integer,
	"title" text NOT NULL,
	"description" text,
	"video_url" text NOT NULL,
	"thumbnail_url" text,
	"duration" integer,
	"view_count" integer DEFAULT 0 NOT NULL,
	"like_count" integer DEFAULT 0 NOT NULL,
	"linked_game_id" integer,
	"linked_timestamp" text,
	"overlay_style" text DEFAULT 'minimal',
	"stats_to_feature" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "highlight_verifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"highlight_id" integer NOT NULL,
	"verification_status" text DEFAULT 'pending' NOT NULL,
	"duplicate_check_passed" boolean,
	"duplicate_of_highlight_id" integer,
	"metadata_consistent" boolean,
	"ai_confidence_score" integer,
	"manually_reviewed_by" text,
	"manual_review_notes" text,
	"reviewed_at" timestamp,
	"flagged_reasons" text,
	"appeal_status" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "league_games" (
	"id" serial PRIMARY KEY NOT NULL,
	"league_id" integer NOT NULL,
	"home_team_id" integer NOT NULL,
	"away_team_id" integer NOT NULL,
	"scheduled_date" timestamp,
	"location" text,
	"home_score" integer,
	"away_score" integer,
	"status" text DEFAULT 'scheduled' NOT NULL,
	"quarter" integer,
	"game_time" text,
	"is_playoff" boolean DEFAULT false NOT NULL,
	"playoff_round" text,
	"linked_game_id" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "league_rivalries" (
	"id" serial PRIMARY KEY NOT NULL,
	"league_id" integer NOT NULL,
	"team_1_id" integer NOT NULL,
	"team_2_id" integer NOT NULL,
	"rivalry_name" text,
	"team_1_wins" integer DEFAULT 0 NOT NULL,
	"team_2_wins" integer DEFAULT 0 NOT NULL,
	"ties" integer DEFAULT 0 NOT NULL,
	"current_streak_team_id" integer,
	"current_streak_count" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "league_team_rosters" (
	"id" serial PRIMARY KEY NOT NULL,
	"league_team_id" integer NOT NULL,
	"player_id" integer NOT NULL,
	"jersey_number" integer,
	"position" text,
	"role" text DEFAULT 'player',
	"joined_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "league_teams" (
	"id" serial PRIMARY KEY NOT NULL,
	"league_id" integer NOT NULL,
	"name" text NOT NULL,
	"logo_url" text,
	"primary_color" text DEFAULT '#00D4FF',
	"captain_user_id" text,
	"wins" integer DEFAULT 0 NOT NULL,
	"losses" integer DEFAULT 0 NOT NULL,
	"ties" integer DEFAULT 0 NOT NULL,
	"points_for" integer DEFAULT 0 NOT NULL,
	"points_against" integer DEFAULT 0 NOT NULL,
	"playoff_seed" integer,
	"is_eliminated" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "leagues" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"sport" text DEFAULT 'basketball' NOT NULL,
	"description" text,
	"logo_url" text,
	"season_name" text,
	"start_date" date,
	"end_date" date,
	"max_teams" integer DEFAULT 12,
	"game_format" text DEFAULT 'round_robin',
	"is_public" boolean DEFAULT true NOT NULL,
	"join_code" text,
	"created_by_user_id" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "likes" (
	"id" serial PRIMARY KEY NOT NULL,
	"game_id" integer NOT NULL,
	"session_id" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "lineup_stats" (
	"id" serial PRIMARY KEY NOT NULL,
	"lineup_id" integer NOT NULL,
	"game_id" integer NOT NULL,
	"minutes" integer NOT NULL,
	"plus_minus" integer NOT NULL,
	"points" integer NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "lineups" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text,
	"player_ids" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "live_game_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" integer NOT NULL,
	"player_id" integer NOT NULL,
	"event_type" text NOT NULL,
	"value" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "live_game_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"coach_user_id" text NOT NULL,
	"sport" text DEFAULT 'basketball' NOT NULL,
	"opponent" text,
	"selected_player_ids" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"started_at" timestamp DEFAULT now(),
	"ended_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "live_game_spectators" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" integer NOT NULL,
	"viewer_user_id" text,
	"viewer_player_id" integer,
	"joined_at" timestamp DEFAULT now(),
	"left_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "mentorship_profiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"player_id" integer NOT NULL,
	"role" text NOT NULL,
	"bio" text,
	"focus_areas" text,
	"years_experience" integer,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "mentorship_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"requester_player_id" integer NOT NULL,
	"mentor_player_id" integer NOT NULL,
	"message" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"responded_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"conversation_id" integer NOT NULL,
	"role" text NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ncaa_eligibility_progress" (
	"id" serial PRIMARY KEY NOT NULL,
	"player_id" integer NOT NULL,
	"ncaa_id_number" text,
	"registered_with_ncaa" boolean DEFAULT false,
	"core_courses_completed" integer DEFAULT 0,
	"core_gpa" numeric(3, 2),
	"sliding_scale_eligible" boolean,
	"sat_score" integer,
	"act_score" integer,
	"test_scores_sent" boolean DEFAULT false,
	"transcript_sent" boolean DEFAULT false,
	"final_transcript_sent" boolean DEFAULT false,
	"amateurism_certified" boolean DEFAULT false,
	"amateurism_questionnaire_done" boolean DEFAULT false,
	"eligibility_status" text DEFAULT 'in_progress',
	"target_division" text DEFAULT 'D1',
	"notes" text,
	"updated_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"player_id" integer,
	"user_id" text,
	"notification_type" text NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"related_id" integer,
	"related_type" text,
	"is_read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "opponents" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"opponent_type" text NOT NULL,
	"position" text,
	"tendencies" text,
	"strengths" text,
	"weaknesses" text,
	"notes" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "performance_milestones" (
	"id" serial PRIMARY KEY NOT NULL,
	"player_id" integer NOT NULL,
	"milestone_type" text NOT NULL,
	"milestone_value" integer NOT NULL,
	"milestone_title" text NOT NULL,
	"achieved_at" timestamp DEFAULT now(),
	"achieved_in_game_id" integer,
	"is_announced" boolean DEFAULT false NOT NULL,
	"xp_awarded" integer DEFAULT 100 NOT NULL,
	"coin_awarded" integer DEFAULT 25 NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "personal_records" (
	"id" serial PRIMARY KEY NOT NULL,
	"player_id" integer NOT NULL,
	"stat_name" text NOT NULL,
	"value" integer NOT NULL,
	"game_id" integer,
	"previous_value" integer,
	"achieved_at" timestamp DEFAULT now(),
	CONSTRAINT "personal_records_player_stat" UNIQUE("player_id","stat_name")
);
--> statement-breakpoint
CREATE TABLE "player_college_interests" (
	"id" serial PRIMARY KEY NOT NULL,
	"player_id" integer NOT NULL,
	"college_id" integer NOT NULL,
	"interest_level" text DEFAULT 'interested',
	"notes" text,
	"contacted" boolean DEFAULT false,
	"contacted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "player_college_matches" (
	"id" serial PRIMARY KEY NOT NULL,
	"player_id" integer NOT NULL,
	"college_id" integer NOT NULL,
	"overall_match_score" integer NOT NULL,
	"skill_match_score" integer,
	"academic_match_score" integer,
	"style_match_score" integer,
	"location_match_score" integer,
	"match_reasoning" text,
	"strengths_for_program" text,
	"development_areas" text,
	"is_recommended" boolean DEFAULT false NOT NULL,
	"is_saved" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "player_event_registrations" (
	"id" serial PRIMARY KEY NOT NULL,
	"player_id" integer NOT NULL,
	"event_id" integer NOT NULL,
	"status" text DEFAULT 'interested' NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "player_goals" (
	"id" serial PRIMARY KEY NOT NULL,
	"player_id" integer NOT NULL,
	"stat_name" text NOT NULL,
	"target_value" numeric(6, 2) NOT NULL,
	"current_value" numeric(6, 2) DEFAULT '0' NOT NULL,
	"timeframe" text DEFAULT 'season' NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "player_ratings" (
	"id" serial PRIMARY KEY NOT NULL,
	"player_id" integer NOT NULL,
	"rated_by_user_id" text NOT NULL,
	"rater_role" text NOT NULL,
	"overall_rating" integer NOT NULL,
	"potential_rating" integer,
	"athleticism" integer,
	"basketball_iq" integer,
	"shooting" integer,
	"passing" integer,
	"defense" integer,
	"rebounding" integer,
	"leadership" integer,
	"arm_strength" integer,
	"accuracy" integer,
	"speed" integer,
	"agility" integer,
	"strength" integer,
	"football_iq" integer,
	"notes" text,
	"is_public" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "player_stories" (
	"id" serial PRIMARY KEY NOT NULL,
	"player_id" integer NOT NULL,
	"template_id" integer,
	"headline" text NOT NULL,
	"stats" text,
	"image_url" text,
	"video_url" text,
	"media_type" text,
	"caption" text,
	"session_id" text,
	"is_public" boolean DEFAULT true NOT NULL,
	"expires_at" timestamp,
	"view_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "players" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text,
	"name" text NOT NULL,
	"sport" text DEFAULT 'basketball' NOT NULL,
	"position" text NOT NULL,
	"height" text,
	"team" text,
	"jersey_number" integer,
	"photo_url" text,
	"banner_url" text,
	"bio" text,
	"total_xp" integer DEFAULT 0 NOT NULL,
	"current_tier" text DEFAULT 'Rookie' NOT NULL,
	"open_to_opportunities" boolean DEFAULT false,
	"city" text,
	"state" text,
	"school" text,
	"graduation_year" integer,
	"level" text,
	"gpa" numeric(3, 2),
	"highlight_video_url" text,
	"profile_visibility" text DEFAULT 'public',
	"show_email" boolean DEFAULT false,
	"show_phone" boolean DEFAULT false,
	"show_school" boolean DEFAULT true,
	"show_gpa" boolean DEFAULT true,
	"open_to_recruiting" boolean DEFAULT false,
	"show_stats_to_coaches" boolean DEFAULT true,
	"show_contact_to_coaches" boolean DEFAULT true,
	"show_detailed_stats_to_guardians" boolean DEFAULT true,
	"show_grades_to_guardians" boolean DEFAULT true,
	"scouting_report" text,
	"scouting_report_generated_at" timestamp,
	"coach_name" text,
	"coach_phone" text,
	"state_rank" integer,
	"country_rank" integer,
	"widget_preferences" text,
	"roster_role" text DEFAULT 'rotation',
	"username" text,
	"last_active_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "players_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "poll_votes" (
	"id" serial PRIMARY KEY NOT NULL,
	"poll_id" integer NOT NULL,
	"option_index" integer NOT NULL,
	"session_id" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "polls" (
	"id" serial PRIMARY KEY NOT NULL,
	"question" text NOT NULL,
	"options" text[] NOT NULL,
	"created_by" text NOT NULL,
	"player_id" integer,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "practice_attendance" (
	"id" serial PRIMARY KEY NOT NULL,
	"practice_id" integer NOT NULL,
	"player_id" integer NOT NULL,
	"attended" boolean DEFAULT true NOT NULL,
	"checked_in_at" timestamp,
	"effort_rating" integer,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "practices" (
	"id" serial PRIMARY KEY NOT NULL,
	"team_id" integer,
	"date" date NOT NULL,
	"title" text NOT NULL,
	"duration" integer NOT NULL,
	"actual_duration" integer,
	"status" text DEFAULT 'completed' NOT NULL,
	"started_at" timestamp,
	"ended_at" timestamp,
	"current_drill_id" integer,
	"notes" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "prediction_votes" (
	"id" serial PRIMARY KEY NOT NULL,
	"prediction_id" integer NOT NULL,
	"voted_for" integer NOT NULL,
	"session_id" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "predictions" (
	"id" serial PRIMARY KEY NOT NULL,
	"player1_id" integer NOT NULL,
	"player2_id" integer NOT NULL,
	"category" text NOT NULL,
	"created_by" text NOT NULL,
	"session_id" text,
	"game_date" date,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "profile_views" (
	"id" serial PRIMARY KEY NOT NULL,
	"player_id" integer NOT NULL,
	"viewer_ip" text,
	"viewer_user_id" text,
	"referrer" text,
	"user_agent" text,
	"viewed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recruit_interests" (
	"id" serial PRIMARY KEY NOT NULL,
	"post_id" integer NOT NULL,
	"player_id" integer NOT NULL,
	"message" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "recruit_posts" (
	"id" serial PRIMARY KEY NOT NULL,
	"coach_user_id" text NOT NULL,
	"player_id" integer,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"position_needs" text,
	"level" text,
	"location" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "recruiter_blocks" (
	"id" serial PRIMARY KEY NOT NULL,
	"player_id" integer NOT NULL,
	"recruiter_id" integer NOT NULL,
	"reason" text,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "recruiter_block_unique" UNIQUE("player_id","recruiter_id")
);
--> statement-breakpoint
CREATE TABLE "recruiter_bookmarks" (
	"id" serial PRIMARY KEY NOT NULL,
	"recruiter_id" integer NOT NULL,
	"player_id" integer NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "recruiter_bookmark_unique" UNIQUE("recruiter_id","player_id")
);
--> statement-breakpoint
CREATE TABLE "recruiter_interest_signals" (
	"id" serial PRIMARY KEY NOT NULL,
	"recruiter_id" integer NOT NULL,
	"player_id" integer NOT NULL,
	"signal_type" text NOT NULL,
	"message" text,
	"is_read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "recruiter_profile_views" (
	"id" serial PRIMARY KEY NOT NULL,
	"recruiter_id" integer NOT NULL,
	"player_id" integer NOT NULL,
	"viewed_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "recruiter_profiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"school_name" text NOT NULL,
	"division" text NOT NULL,
	"title" text NOT NULL,
	"school_email" text NOT NULL,
	"phone" text,
	"school_logo_url" text,
	"bio" text,
	"state" text,
	"conference" text,
	"sport" text DEFAULT 'basketball' NOT NULL,
	"is_verified" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "recruiter_profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "recruiting_contacts" (
	"id" serial PRIMARY KEY NOT NULL,
	"target_id" integer NOT NULL,
	"player_id" integer NOT NULL,
	"type" text NOT NULL,
	"date" timestamp DEFAULT now(),
	"notes" text,
	"response" text
);
--> statement-breakpoint
CREATE TABLE "recruiting_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"sport" text NOT NULL,
	"event_type" text NOT NULL,
	"description" text,
	"host_organization" text,
	"college_id" integer,
	"location" text NOT NULL,
	"city" text,
	"state" text,
	"start_date" date NOT NULL,
	"end_date" date,
	"registration_deadline" date,
	"cost" integer,
	"is_free" boolean DEFAULT false,
	"registration_url" text,
	"contact_email" text,
	"age_groups" text,
	"positions" text,
	"max_participants" integer,
	"spots_remaining" integer,
	"is_verified" boolean DEFAULT false,
	"visibility" text DEFAULT 'public' NOT NULL,
	"team_id" integer,
	"created_by" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "recruiting_inquiries" (
	"id" serial PRIMARY KEY NOT NULL,
	"player_id" integer NOT NULL,
	"sender_name" text NOT NULL,
	"sender_email" text NOT NULL,
	"sender_role" text NOT NULL,
	"sender_school" text,
	"message" text NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "recruiting_targets" (
	"id" serial PRIMARY KEY NOT NULL,
	"player_id" integer NOT NULL,
	"college_name" text NOT NULL,
	"division" text NOT NULL,
	"state" text,
	"status" text DEFAULT 'researching' NOT NULL,
	"contact_name" text,
	"contact_email" text,
	"contact_title" text,
	"last_contact_date" timestamp,
	"follow_up_date" timestamp,
	"notes" text,
	"generated_email" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "reposts" (
	"id" serial PRIMARY KEY NOT NULL,
	"original_activity_id" integer,
	"game_id" integer,
	"session_id" text NOT NULL,
	"comment" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "saved_posts" (
	"id" serial PRIMARY KEY NOT NULL,
	"activity_id" integer NOT NULL,
	"player_id" integer NOT NULL,
	"session_id" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "schedule_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"player_id" integer,
	"team_id" integer,
	"event_type" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"location" text,
	"start_time" timestamp NOT NULL,
	"end_time" timestamp,
	"is_recurring" boolean DEFAULT false NOT NULL,
	"recurrence_rule" text,
	"sport" text DEFAULT 'basketball' NOT NULL,
	"created_by" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "seasons" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"sport" text DEFAULT 'basketball' NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"is_current" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE "share_assets" (
	"id" serial PRIMARY KEY NOT NULL,
	"player_id" integer NOT NULL,
	"game_id" integer,
	"badge_id" integer,
	"asset_type" text NOT NULL,
	"image_url" text NOT NULL,
	"shared_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "shop_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"category" text NOT NULL,
	"type" text NOT NULL,
	"value" text NOT NULL,
	"preview_url" text,
	"coin_price" integer DEFAULT 0 NOT NULL,
	"premium_price" integer,
	"rarity" text DEFAULT 'common' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "shots" (
	"id" serial PRIMARY KEY NOT NULL,
	"game_id" integer NOT NULL,
	"player_id" integer NOT NULL,
	"x" integer NOT NULL,
	"y" integer NOT NULL,
	"shot_type" text NOT NULL,
	"result" text NOT NULL,
	"quarter" integer NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "skill_badges" (
	"id" serial PRIMARY KEY NOT NULL,
	"player_id" integer NOT NULL,
	"skill_type" text NOT NULL,
	"current_level" text DEFAULT 'none' NOT NULL,
	"career_value" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "skill_challenges" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"sport" text DEFAULT 'basketball' NOT NULL,
	"category" text NOT NULL,
	"duration" integer,
	"target_score" integer,
	"max_attempts" integer,
	"scoring_type" text NOT NULL,
	"higher_is_better" boolean DEFAULT true NOT NULL,
	"required_tier" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"xp_reward" integer DEFAULT 50 NOT NULL,
	"coin_reward" integer DEFAULT 10 NOT NULL,
	"badge_reward" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "stat_verifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"game_id" integer NOT NULL,
	"player_id" integer NOT NULL,
	"verified_by_user_id" text NOT NULL,
	"verifier_name" text NOT NULL,
	"verifier_role" text NOT NULL,
	"verification_method" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"verified_at" timestamp,
	"proof_url" text,
	"notes" text,
	"stat_hash" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "story_highlights" (
	"id" serial PRIMARY KEY NOT NULL,
	"player_id" integer NOT NULL,
	"title" text NOT NULL,
	"cover_image_url" text,
	"story_ids" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "story_reactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"story_id" integer NOT NULL,
	"reactor_id" integer,
	"session_id" text,
	"reaction" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "story_tags" (
	"id" serial PRIMARY KEY NOT NULL,
	"story_id" integer NOT NULL,
	"tagged_player_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "story_templates" (
	"id" serial PRIMARY KEY NOT NULL,
	"template_name" text NOT NULL,
	"title" text NOT NULL,
	"subtitle" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"week_start" date,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "story_views" (
	"id" serial PRIMARY KEY NOT NULL,
	"story_id" integer NOT NULL,
	"viewer_id" integer,
	"session_id" text,
	"viewed_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "streaks" (
	"id" serial PRIMARY KEY NOT NULL,
	"player_id" integer NOT NULL,
	"streak_type" text NOT NULL,
	"current_count" integer DEFAULT 0 NOT NULL,
	"best_count" integer DEFAULT 0 NOT NULL,
	"last_game_id" integer,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "team_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"player_id" integer NOT NULL,
	"team_name" text NOT NULL,
	"team_id" integer,
	"sport" text DEFAULT 'basketball' NOT NULL,
	"season" text,
	"role" text DEFAULT 'rotation',
	"joined_at" timestamp DEFAULT now(),
	"left_at" timestamp,
	"is_current" boolean DEFAULT true
);
--> statement-breakpoint
CREATE TABLE "team_members" (
	"id" serial PRIMARY KEY NOT NULL,
	"team_id" integer NOT NULL,
	"player_id" integer,
	"display_name" text NOT NULL,
	"session_id" text NOT NULL,
	"role" text DEFAULT 'member' NOT NULL,
	"roster_role" text DEFAULT 'rotation',
	"joined_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "team_post_comments" (
	"id" serial PRIMARY KEY NOT NULL,
	"post_id" integer NOT NULL,
	"author_id" integer NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "team_posts" (
	"id" serial PRIMARY KEY NOT NULL,
	"team_id" integer NOT NULL,
	"author_id" integer NOT NULL,
	"content" text NOT NULL,
	"post_type" text DEFAULT 'general' NOT NULL,
	"practice_time" timestamp,
	"practice_location" text,
	"is_pinned" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "teams" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"code" text NOT NULL,
	"created_by" text NOT NULL,
	"profile_picture" text,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "teams_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "training_group_members" (
	"id" serial PRIMARY KEY NOT NULL,
	"group_id" integer NOT NULL,
	"player_id" integer NOT NULL,
	"role" text DEFAULT 'member' NOT NULL,
	"joined_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "training_groups" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"owner_player_id" integer,
	"owner_user_id" text,
	"is_public" boolean DEFAULT false NOT NULL,
	"max_members" integer DEFAULT 20,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_inventory" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"item_id" integer NOT NULL,
	"purchased_at" timestamp DEFAULT now(),
	"is_equipped" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "video_analyses" (
	"id" serial PRIMARY KEY NOT NULL,
	"player_id" integer,
	"user_id" text NOT NULL,
	"source" text DEFAULT 'video' NOT NULL,
	"player_name" text NOT NULL,
	"stats" text NOT NULL,
	"observations" text,
	"confidence" text,
	"video_quality" text,
	"limitations" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "wearable_connections" (
	"id" serial PRIMARY KEY NOT NULL,
	"player_id" integer NOT NULL,
	"provider" text NOT NULL,
	"access_token" text NOT NULL,
	"refresh_token" text,
	"token_expires_at" timestamp,
	"last_sync_at" timestamp,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "workouts" (
	"id" serial PRIMARY KEY NOT NULL,
	"player_id" integer NOT NULL,
	"date" date NOT NULL,
	"workout_type" text NOT NULL,
	"title" text NOT NULL,
	"duration" integer NOT NULL,
	"intensity" integer,
	"notes" text,
	"video_url" text,
	"metrics" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" jsonb NOT NULL,
	"expire" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar,
	"first_name" varchar,
	"last_name" varchar,
	"profile_image_url" varchar,
	"role" varchar,
	"player_id" integer,
	"preferred_sport" varchar DEFAULT 'basketball',
	"password_hash" varchar,
	"stripe_customer_id" varchar,
	"stripe_subscription_id" varchar,
	"subscription_status" varchar,
	"coin_balance" integer DEFAULT 0,
	"active_theme_id" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "accolades" ADD CONSTRAINT "accolades_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_streaks" ADD CONSTRAINT "activity_streaks_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_projections" ADD CONSTRAINT "ai_projections_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_related_game_id_games_id_fk" FOREIGN KEY ("related_game_id") REFERENCES "public"."games"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "athletic_measurements" ADD CONSTRAINT "athletic_measurements_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "caliber_badges" ADD CONSTRAINT "caliber_badges_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "challenge_progress" ADD CONSTRAINT "challenge_progress_challenge_id_challenges_id_fk" FOREIGN KEY ("challenge_id") REFERENCES "public"."challenges"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "challenge_progress" ADD CONSTRAINT "challenge_progress_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "challenge_results" ADD CONSTRAINT "challenge_results_challenge_id_skill_challenges_id_fk" FOREIGN KEY ("challenge_id") REFERENCES "public"."skill_challenges"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "challenge_results" ADD CONSTRAINT "challenge_results_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coach_goals" ADD CONSTRAINT "coach_goals_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coach_recommendations" ADD CONSTRAINT "coach_recommendations_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "college_coaching_staff" ADD CONSTRAINT "college_coaching_staff_college_id_colleges_id_fk" FOREIGN KEY ("college_id") REFERENCES "public"."colleges"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "college_roster_players" ADD CONSTRAINT "college_roster_players_college_id_colleges_id_fk" FOREIGN KEY ("college_id") REFERENCES "public"."colleges"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dm_messages" ADD CONSTRAINT "dm_messages_thread_id_dm_threads_id_fk" FOREIGN KEY ("thread_id") REFERENCES "public"."dm_threads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dm_messages" ADD CONSTRAINT "dm_messages_sender_player_id_players_id_fk" FOREIGN KEY ("sender_player_id") REFERENCES "public"."players"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dm_participants" ADD CONSTRAINT "dm_participants_thread_id_dm_threads_id_fk" FOREIGN KEY ("thread_id") REFERENCES "public"."dm_threads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dm_participants" ADD CONSTRAINT "dm_participants_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "drill_recommendations" ADD CONSTRAINT "drill_recommendations_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "drill_recommendations" ADD CONSTRAINT "drill_recommendations_drill_id_drills_id_fk" FOREIGN KEY ("drill_id") REFERENCES "public"."drills"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "drill_scores" ADD CONSTRAINT "drill_scores_practice_id_practices_id_fk" FOREIGN KEY ("practice_id") REFERENCES "public"."practices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "drill_scores" ADD CONSTRAINT "drill_scores_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "drill_scores" ADD CONSTRAINT "drill_scores_drill_id_drills_id_fk" FOREIGN KEY ("drill_id") REFERENCES "public"."drills"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "endorsements" ADD CONSTRAINT "endorsements_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_game_links" ADD CONSTRAINT "event_game_links_event_id_event_integrations_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."event_integrations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_game_links" ADD CONSTRAINT "event_game_links_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feed_activities" ADD CONSTRAINT "feed_activities_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feed_activities" ADD CONSTRAINT "feed_activities_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feed_activities" ADD CONSTRAINT "feed_activities_badge_id_badges_id_fk" FOREIGN KEY ("badge_id") REFERENCES "public"."badges"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feed_comment_likes" ADD CONSTRAINT "feed_comment_likes_comment_id_feed_comments_id_fk" FOREIGN KEY ("comment_id") REFERENCES "public"."feed_comments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feed_comments" ADD CONSTRAINT "feed_comments_activity_id_feed_activities_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."feed_activities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feed_reactions" ADD CONSTRAINT "feed_reactions_activity_id_feed_activities_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."feed_activities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fitness_data" ADD CONSTRAINT "fitness_data_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "follows" ADD CONSTRAINT "follows_follower_player_id_players_id_fk" FOREIGN KEY ("follower_player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "follows" ADD CONSTRAINT "follows_followee_player_id_players_id_fk" FOREIGN KEY ("followee_player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "football_metrics" ADD CONSTRAINT "football_metrics_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_notes" ADD CONSTRAINT "game_notes_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_notes" ADD CONSTRAINT "game_notes_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "goal_shares" ADD CONSTRAINT "goal_shares_goal_id_goals_id_fk" FOREIGN KEY ("goal_id") REFERENCES "public"."goals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "goal_shares" ADD CONSTRAINT "goal_shares_shared_with_player_id_players_id_fk" FOREIGN KEY ("shared_with_player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "goal_shares" ADD CONSTRAINT "goal_shares_shared_with_team_id_teams_id_fk" FOREIGN KEY ("shared_with_team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guardian_links" ADD CONSTRAINT "guardian_links_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "head_to_head_challenges" ADD CONSTRAINT "head_to_head_challenges_challenger_player_id_players_id_fk" FOREIGN KEY ("challenger_player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "head_to_head_challenges" ADD CONSTRAINT "head_to_head_challenges_opponent_player_id_players_id_fk" FOREIGN KEY ("opponent_player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "head_to_head_challenges" ADD CONSTRAINT "head_to_head_challenges_challenger_game_id_games_id_fk" FOREIGN KEY ("challenger_game_id") REFERENCES "public"."games"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "head_to_head_challenges" ADD CONSTRAINT "head_to_head_challenges_opponent_game_id_games_id_fk" FOREIGN KEY ("opponent_game_id") REFERENCES "public"."games"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "head_to_head_challenges" ADD CONSTRAINT "head_to_head_challenges_winner_id_players_id_fk" FOREIGN KEY ("winner_id") REFERENCES "public"."players"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "highlight_clips" ADD CONSTRAINT "highlight_clips_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "highlight_clips" ADD CONSTRAINT "highlight_clips_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "highlight_clips" ADD CONSTRAINT "highlight_clips_linked_game_id_games_id_fk" FOREIGN KEY ("linked_game_id") REFERENCES "public"."games"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "highlight_verifications" ADD CONSTRAINT "highlight_verifications_highlight_id_highlight_clips_id_fk" FOREIGN KEY ("highlight_id") REFERENCES "public"."highlight_clips"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "league_games" ADD CONSTRAINT "league_games_league_id_leagues_id_fk" FOREIGN KEY ("league_id") REFERENCES "public"."leagues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "league_games" ADD CONSTRAINT "league_games_home_team_id_league_teams_id_fk" FOREIGN KEY ("home_team_id") REFERENCES "public"."league_teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "league_games" ADD CONSTRAINT "league_games_away_team_id_league_teams_id_fk" FOREIGN KEY ("away_team_id") REFERENCES "public"."league_teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "league_games" ADD CONSTRAINT "league_games_linked_game_id_games_id_fk" FOREIGN KEY ("linked_game_id") REFERENCES "public"."games"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "league_rivalries" ADD CONSTRAINT "league_rivalries_league_id_leagues_id_fk" FOREIGN KEY ("league_id") REFERENCES "public"."leagues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "league_rivalries" ADD CONSTRAINT "league_rivalries_team_1_id_league_teams_id_fk" FOREIGN KEY ("team_1_id") REFERENCES "public"."league_teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "league_rivalries" ADD CONSTRAINT "league_rivalries_team_2_id_league_teams_id_fk" FOREIGN KEY ("team_2_id") REFERENCES "public"."league_teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "league_team_rosters" ADD CONSTRAINT "league_team_rosters_league_team_id_league_teams_id_fk" FOREIGN KEY ("league_team_id") REFERENCES "public"."league_teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "league_team_rosters" ADD CONSTRAINT "league_team_rosters_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "league_teams" ADD CONSTRAINT "league_teams_league_id_leagues_id_fk" FOREIGN KEY ("league_id") REFERENCES "public"."leagues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "likes" ADD CONSTRAINT "likes_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lineup_stats" ADD CONSTRAINT "lineup_stats_lineup_id_lineups_id_fk" FOREIGN KEY ("lineup_id") REFERENCES "public"."lineups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lineup_stats" ADD CONSTRAINT "lineup_stats_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "live_game_events" ADD CONSTRAINT "live_game_events_session_id_live_game_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."live_game_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "live_game_events" ADD CONSTRAINT "live_game_events_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "live_game_spectators" ADD CONSTRAINT "live_game_spectators_session_id_live_game_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."live_game_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "live_game_spectators" ADD CONSTRAINT "live_game_spectators_viewer_player_id_players_id_fk" FOREIGN KEY ("viewer_player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentorship_profiles" ADD CONSTRAINT "mentorship_profiles_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentorship_requests" ADD CONSTRAINT "mentorship_requests_requester_player_id_players_id_fk" FOREIGN KEY ("requester_player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentorship_requests" ADD CONSTRAINT "mentorship_requests_mentor_player_id_players_id_fk" FOREIGN KEY ("mentor_player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ncaa_eligibility_progress" ADD CONSTRAINT "ncaa_eligibility_progress_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "performance_milestones" ADD CONSTRAINT "performance_milestones_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "performance_milestones" ADD CONSTRAINT "performance_milestones_achieved_in_game_id_games_id_fk" FOREIGN KEY ("achieved_in_game_id") REFERENCES "public"."games"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "personal_records" ADD CONSTRAINT "personal_records_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "personal_records" ADD CONSTRAINT "personal_records_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_college_matches" ADD CONSTRAINT "player_college_matches_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_college_matches" ADD CONSTRAINT "player_college_matches_college_id_colleges_id_fk" FOREIGN KEY ("college_id") REFERENCES "public"."colleges"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_event_registrations" ADD CONSTRAINT "player_event_registrations_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_event_registrations" ADD CONSTRAINT "player_event_registrations_event_id_recruiting_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."recruiting_events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_goals" ADD CONSTRAINT "player_goals_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_ratings" ADD CONSTRAINT "player_ratings_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_stories" ADD CONSTRAINT "player_stories_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_stories" ADD CONSTRAINT "player_stories_template_id_story_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."story_templates"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "poll_votes" ADD CONSTRAINT "poll_votes_poll_id_polls_id_fk" FOREIGN KEY ("poll_id") REFERENCES "public"."polls"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "polls" ADD CONSTRAINT "polls_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "practice_attendance" ADD CONSTRAINT "practice_attendance_practice_id_practices_id_fk" FOREIGN KEY ("practice_id") REFERENCES "public"."practices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "practice_attendance" ADD CONSTRAINT "practice_attendance_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "practices" ADD CONSTRAINT "practices_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "practices" ADD CONSTRAINT "practices_current_drill_id_drills_id_fk" FOREIGN KEY ("current_drill_id") REFERENCES "public"."drills"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prediction_votes" ADD CONSTRAINT "prediction_votes_prediction_id_predictions_id_fk" FOREIGN KEY ("prediction_id") REFERENCES "public"."predictions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "predictions" ADD CONSTRAINT "predictions_player1_id_players_id_fk" FOREIGN KEY ("player1_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "predictions" ADD CONSTRAINT "predictions_player2_id_players_id_fk" FOREIGN KEY ("player2_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profile_views" ADD CONSTRAINT "profile_views_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recruit_interests" ADD CONSTRAINT "recruit_interests_post_id_recruit_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."recruit_posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recruit_interests" ADD CONSTRAINT "recruit_interests_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recruit_posts" ADD CONSTRAINT "recruit_posts_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recruiter_blocks" ADD CONSTRAINT "recruiter_blocks_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recruiter_blocks" ADD CONSTRAINT "recruiter_blocks_recruiter_id_recruiter_profiles_id_fk" FOREIGN KEY ("recruiter_id") REFERENCES "public"."recruiter_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recruiter_bookmarks" ADD CONSTRAINT "recruiter_bookmarks_recruiter_id_recruiter_profiles_id_fk" FOREIGN KEY ("recruiter_id") REFERENCES "public"."recruiter_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recruiter_bookmarks" ADD CONSTRAINT "recruiter_bookmarks_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recruiter_interest_signals" ADD CONSTRAINT "recruiter_interest_signals_recruiter_id_recruiter_profiles_id_fk" FOREIGN KEY ("recruiter_id") REFERENCES "public"."recruiter_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recruiter_interest_signals" ADD CONSTRAINT "recruiter_interest_signals_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recruiter_profile_views" ADD CONSTRAINT "recruiter_profile_views_recruiter_id_recruiter_profiles_id_fk" FOREIGN KEY ("recruiter_id") REFERENCES "public"."recruiter_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recruiter_profile_views" ADD CONSTRAINT "recruiter_profile_views_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recruiting_events" ADD CONSTRAINT "recruiting_events_college_id_colleges_id_fk" FOREIGN KEY ("college_id") REFERENCES "public"."colleges"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recruiting_events" ADD CONSTRAINT "recruiting_events_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recruiting_inquiries" ADD CONSTRAINT "recruiting_inquiries_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reposts" ADD CONSTRAINT "reposts_original_activity_id_feed_activities_id_fk" FOREIGN KEY ("original_activity_id") REFERENCES "public"."feed_activities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reposts" ADD CONSTRAINT "reposts_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_posts" ADD CONSTRAINT "saved_posts_activity_id_feed_activities_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."feed_activities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_posts" ADD CONSTRAINT "saved_posts_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schedule_events" ADD CONSTRAINT "schedule_events_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schedule_events" ADD CONSTRAINT "schedule_events_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "share_assets" ADD CONSTRAINT "share_assets_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "share_assets" ADD CONSTRAINT "share_assets_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "share_assets" ADD CONSTRAINT "share_assets_badge_id_badges_id_fk" FOREIGN KEY ("badge_id") REFERENCES "public"."badges"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shots" ADD CONSTRAINT "shots_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shots" ADD CONSTRAINT "shots_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill_badges" ADD CONSTRAINT "skill_badges_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stat_verifications" ADD CONSTRAINT "stat_verifications_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stat_verifications" ADD CONSTRAINT "stat_verifications_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "story_highlights" ADD CONSTRAINT "story_highlights_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "story_reactions" ADD CONSTRAINT "story_reactions_story_id_player_stories_id_fk" FOREIGN KEY ("story_id") REFERENCES "public"."player_stories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "story_reactions" ADD CONSTRAINT "story_reactions_reactor_id_players_id_fk" FOREIGN KEY ("reactor_id") REFERENCES "public"."players"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "story_tags" ADD CONSTRAINT "story_tags_story_id_player_stories_id_fk" FOREIGN KEY ("story_id") REFERENCES "public"."player_stories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "story_tags" ADD CONSTRAINT "story_tags_tagged_player_id_players_id_fk" FOREIGN KEY ("tagged_player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "story_views" ADD CONSTRAINT "story_views_story_id_player_stories_id_fk" FOREIGN KEY ("story_id") REFERENCES "public"."player_stories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "story_views" ADD CONSTRAINT "story_views_viewer_id_players_id_fk" FOREIGN KEY ("viewer_id") REFERENCES "public"."players"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_history" ADD CONSTRAINT "team_history_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_post_comments" ADD CONSTRAINT "team_post_comments_post_id_team_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."team_posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_post_comments" ADD CONSTRAINT "team_post_comments_author_id_team_members_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."team_members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_posts" ADD CONSTRAINT "team_posts_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_posts" ADD CONSTRAINT "team_posts_author_id_team_members_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."team_members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_group_members" ADD CONSTRAINT "training_group_members_group_id_training_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."training_groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_group_members" ADD CONSTRAINT "training_group_members_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_groups" ADD CONSTRAINT "training_groups_owner_player_id_players_id_fk" FOREIGN KEY ("owner_player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_inventory" ADD CONSTRAINT "user_inventory_item_id_shop_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."shop_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wearable_connections" ADD CONSTRAINT "wearable_connections_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workouts" ADD CONSTRAINT "workouts_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "accolades_player_id_idx" ON "accolades" USING btree ("player_id");--> statement-breakpoint
CREATE INDEX "activity_streaks_player_id_idx" ON "activity_streaks" USING btree ("player_id");--> statement-breakpoint
CREATE INDEX "ai_projections_player_id_idx" ON "ai_projections" USING btree ("player_id");--> statement-breakpoint
CREATE INDEX "ai_projections_type_idx" ON "ai_projections" USING btree ("projection_type");--> statement-breakpoint
CREATE INDEX "alerts_player_id_idx" ON "alerts" USING btree ("player_id");--> statement-breakpoint
CREATE INDEX "alerts_related_game_id_idx" ON "alerts" USING btree ("related_game_id");--> statement-breakpoint
CREATE INDEX "athletic_measurements_player_id_idx" ON "athletic_measurements" USING btree ("player_id");--> statement-breakpoint
CREATE INDEX "badges_player_id_idx" ON "badges" USING btree ("player_id");--> statement-breakpoint
CREATE INDEX "badges_game_id_idx" ON "badges" USING btree ("game_id");--> statement-breakpoint
CREATE INDEX "caliber_badges_player_id_idx" ON "caliber_badges" USING btree ("player_id");--> statement-breakpoint
CREATE INDEX "challenge_progress_challenge_id_idx" ON "challenge_progress" USING btree ("challenge_id");--> statement-breakpoint
CREATE INDEX "challenge_progress_player_id_idx" ON "challenge_progress" USING btree ("player_id");--> statement-breakpoint
CREATE INDEX "challenge_results_challenge_id_idx" ON "challenge_results" USING btree ("challenge_id");--> statement-breakpoint
CREATE INDEX "challenge_results_player_id_idx" ON "challenge_results" USING btree ("player_id");--> statement-breakpoint
CREATE INDEX "challenge_results_score_idx" ON "challenge_results" USING btree ("score");--> statement-breakpoint
CREATE INDEX "coach_goals_player_id_idx" ON "coach_goals" USING btree ("player_id");--> statement-breakpoint
CREATE INDEX "coach_recommendations_player_idx" ON "coach_recommendations" USING btree ("player_id");--> statement-breakpoint
CREATE INDEX "coach_recommendations_coach_idx" ON "coach_recommendations" USING btree ("coach_user_id");--> statement-breakpoint
CREATE INDEX "coin_transactions_user_id_idx" ON "coin_transactions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "college_staff_college_idx" ON "college_coaching_staff" USING btree ("college_id");--> statement-breakpoint
CREATE INDEX "college_roster_college_idx" ON "college_roster_players" USING btree ("college_id");--> statement-breakpoint
CREATE INDEX "colleges_division_idx" ON "colleges" USING btree ("division");--> statement-breakpoint
CREATE INDEX "colleges_sport_idx" ON "colleges" USING btree ("sport");--> statement-breakpoint
CREATE INDEX "colleges_state_idx" ON "colleges" USING btree ("state");--> statement-breakpoint
CREATE INDEX "comments_game_id_idx" ON "comments" USING btree ("game_id");--> statement-breakpoint
CREATE INDEX "dm_messages_thread_id_idx" ON "dm_messages" USING btree ("thread_id");--> statement-breakpoint
CREATE INDEX "dm_messages_sender_player_id_idx" ON "dm_messages" USING btree ("sender_player_id");--> statement-breakpoint
CREATE INDEX "dm_participants_thread_id_idx" ON "dm_participants" USING btree ("thread_id");--> statement-breakpoint
CREATE INDEX "dm_participants_player_id_idx" ON "dm_participants" USING btree ("player_id");--> statement-breakpoint
CREATE INDEX "drill_recommendations_player_id_idx" ON "drill_recommendations" USING btree ("player_id");--> statement-breakpoint
CREATE INDEX "drill_scores_practice_id_idx" ON "drill_scores" USING btree ("practice_id");--> statement-breakpoint
CREATE INDEX "drill_scores_player_id_idx" ON "drill_scores" USING btree ("player_id");--> statement-breakpoint
CREATE INDEX "drill_scores_drill_id_idx" ON "drill_scores" USING btree ("drill_id");--> statement-breakpoint
CREATE INDEX "endorsements_player_id_idx" ON "endorsements" USING btree ("player_id");--> statement-breakpoint
CREATE INDEX "event_game_links_event_id_idx" ON "event_game_links" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "event_game_links_game_id_idx" ON "event_game_links" USING btree ("game_id");--> statement-breakpoint
CREATE INDEX "feed_activities_player_id_idx" ON "feed_activities" USING btree ("player_id");--> statement-breakpoint
CREATE INDEX "feed_activities_game_id_idx" ON "feed_activities" USING btree ("game_id");--> statement-breakpoint
CREATE INDEX "feed_activities_badge_id_idx" ON "feed_activities" USING btree ("badge_id");--> statement-breakpoint
CREATE INDEX "feed_comment_likes_comment_id_idx" ON "feed_comment_likes" USING btree ("comment_id");--> statement-breakpoint
CREATE INDEX "feed_comments_activity_id_idx" ON "feed_comments" USING btree ("activity_id");--> statement-breakpoint
CREATE INDEX "feed_comments_parent_id_idx" ON "feed_comments" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "feed_reactions_activity_id_idx" ON "feed_reactions" USING btree ("activity_id");--> statement-breakpoint
CREATE INDEX "feed_reactions_session_id_idx" ON "feed_reactions" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "fitness_data_player_id_idx" ON "fitness_data" USING btree ("player_id");--> statement-breakpoint
CREATE INDEX "fitness_data_date_idx" ON "fitness_data" USING btree ("date");--> statement-breakpoint
CREATE INDEX "fitness_data_source_idx" ON "fitness_data" USING btree ("source");--> statement-breakpoint
CREATE INDEX "follows_follower_player_id_idx" ON "follows" USING btree ("follower_player_id");--> statement-breakpoint
CREATE INDEX "follows_followee_player_id_idx" ON "follows" USING btree ("followee_player_id");--> statement-breakpoint
CREATE INDEX "football_metrics_player_id_idx" ON "football_metrics" USING btree ("player_id");--> statement-breakpoint
CREATE INDEX "game_notes_game_id_idx" ON "game_notes" USING btree ("game_id");--> statement-breakpoint
CREATE INDEX "game_notes_player_id_idx" ON "game_notes" USING btree ("player_id");--> statement-breakpoint
CREATE INDEX "games_player_id_idx" ON "games" USING btree ("player_id");--> statement-breakpoint
CREATE INDEX "games_sport_idx" ON "games" USING btree ("sport");--> statement-breakpoint
CREATE INDEX "goal_shares_goal_id_idx" ON "goal_shares" USING btree ("goal_id");--> statement-breakpoint
CREATE INDEX "goal_shares_shared_with_player_id_idx" ON "goal_shares" USING btree ("shared_with_player_id");--> statement-breakpoint
CREATE INDEX "goal_shares_shared_with_team_id_idx" ON "goal_shares" USING btree ("shared_with_team_id");--> statement-breakpoint
CREATE INDEX "goals_player_id_idx" ON "goals" USING btree ("player_id");--> statement-breakpoint
CREATE INDEX "guardian_links_guardian_idx" ON "guardian_links" USING btree ("guardian_user_id");--> statement-breakpoint
CREATE INDEX "guardian_links_player_idx" ON "guardian_links" USING btree ("player_id");--> statement-breakpoint
CREATE INDEX "guardian_links_status_idx" ON "guardian_links" USING btree ("status");--> statement-breakpoint
CREATE INDEX "head_to_head_challenges_challenger_player_id_idx" ON "head_to_head_challenges" USING btree ("challenger_player_id");--> statement-breakpoint
CREATE INDEX "head_to_head_challenges_opponent_player_id_idx" ON "head_to_head_challenges" USING btree ("opponent_player_id");--> statement-breakpoint
CREATE INDEX "head_to_head_challenges_challenger_game_id_idx" ON "head_to_head_challenges" USING btree ("challenger_game_id");--> statement-breakpoint
CREATE INDEX "head_to_head_challenges_opponent_game_id_idx" ON "head_to_head_challenges" USING btree ("opponent_game_id");--> statement-breakpoint
CREATE INDEX "head_to_head_challenges_winner_id_idx" ON "head_to_head_challenges" USING btree ("winner_id");--> statement-breakpoint
CREATE INDEX "highlight_clips_player_id_idx" ON "highlight_clips" USING btree ("player_id");--> statement-breakpoint
CREATE INDEX "highlight_clips_game_id_idx" ON "highlight_clips" USING btree ("game_id");--> statement-breakpoint
CREATE INDEX "highlight_clips_linked_game_id_idx" ON "highlight_clips" USING btree ("linked_game_id");--> statement-breakpoint
CREATE INDEX "highlight_verifications_highlight_id_idx" ON "highlight_verifications" USING btree ("highlight_id");--> statement-breakpoint
CREATE INDEX "highlight_verifications_status_idx" ON "highlight_verifications" USING btree ("verification_status");--> statement-breakpoint
CREATE INDEX "league_games_league_id_idx" ON "league_games" USING btree ("league_id");--> statement-breakpoint
CREATE INDEX "league_games_home_team_idx" ON "league_games" USING btree ("home_team_id");--> statement-breakpoint
CREATE INDEX "league_games_away_team_idx" ON "league_games" USING btree ("away_team_id");--> statement-breakpoint
CREATE INDEX "league_games_status_idx" ON "league_games" USING btree ("status");--> statement-breakpoint
CREATE INDEX "league_rivalries_league_id_idx" ON "league_rivalries" USING btree ("league_id");--> statement-breakpoint
CREATE INDEX "league_team_rosters_team_id_idx" ON "league_team_rosters" USING btree ("league_team_id");--> statement-breakpoint
CREATE INDEX "league_team_rosters_player_id_idx" ON "league_team_rosters" USING btree ("player_id");--> statement-breakpoint
CREATE INDEX "league_teams_league_id_idx" ON "league_teams" USING btree ("league_id");--> statement-breakpoint
CREATE INDEX "league_teams_captain_idx" ON "league_teams" USING btree ("captain_user_id");--> statement-breakpoint
CREATE INDEX "leagues_sport_idx" ON "leagues" USING btree ("sport");--> statement-breakpoint
CREATE INDEX "leagues_created_by_idx" ON "leagues" USING btree ("created_by_user_id");--> statement-breakpoint
CREATE INDEX "likes_game_id_idx" ON "likes" USING btree ("game_id");--> statement-breakpoint
CREATE INDEX "lineup_stats_lineup_id_idx" ON "lineup_stats" USING btree ("lineup_id");--> statement-breakpoint
CREATE INDEX "lineup_stats_game_id_idx" ON "lineup_stats" USING btree ("game_id");--> statement-breakpoint
CREATE INDEX "live_game_events_session_id_idx" ON "live_game_events" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "live_game_events_player_id_idx" ON "live_game_events" USING btree ("player_id");--> statement-breakpoint
CREATE INDEX "live_game_sessions_coach_user_id_idx" ON "live_game_sessions" USING btree ("coach_user_id");--> statement-breakpoint
CREATE INDEX "live_game_sessions_status_idx" ON "live_game_sessions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "live_game_spectators_session_id_idx" ON "live_game_spectators" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "live_game_spectators_viewer_player_id_idx" ON "live_game_spectators" USING btree ("viewer_player_id");--> statement-breakpoint
CREATE INDEX "mentorship_profiles_player_id_idx" ON "mentorship_profiles" USING btree ("player_id");--> statement-breakpoint
CREATE INDEX "mentorship_requests_requester_player_id_idx" ON "mentorship_requests" USING btree ("requester_player_id");--> statement-breakpoint
CREATE INDEX "mentorship_requests_mentor_player_id_idx" ON "mentorship_requests" USING btree ("mentor_player_id");--> statement-breakpoint
CREATE INDEX "messages_conversation_id_idx" ON "messages" USING btree ("conversation_id");--> statement-breakpoint
CREATE INDEX "ncaa_eligibility_progress_player_idx" ON "ncaa_eligibility_progress" USING btree ("player_id");--> statement-breakpoint
CREATE INDEX "notifications_player_id_idx" ON "notifications" USING btree ("player_id");--> statement-breakpoint
CREATE INDEX "performance_milestones_player_id_idx" ON "performance_milestones" USING btree ("player_id");--> statement-breakpoint
CREATE INDEX "performance_milestones_type_idx" ON "performance_milestones" USING btree ("milestone_type");--> statement-breakpoint
CREATE INDEX "player_college_interests_player_idx" ON "player_college_interests" USING btree ("player_id");--> statement-breakpoint
CREATE INDEX "player_college_interests_college_idx" ON "player_college_interests" USING btree ("college_id");--> statement-breakpoint
CREATE INDEX "player_college_interests_unique" ON "player_college_interests" USING btree ("player_id","college_id");--> statement-breakpoint
CREATE INDEX "player_college_matches_player_id_idx" ON "player_college_matches" USING btree ("player_id");--> statement-breakpoint
CREATE INDEX "player_college_matches_college_id_idx" ON "player_college_matches" USING btree ("college_id");--> statement-breakpoint
CREATE INDEX "player_college_matches_score_idx" ON "player_college_matches" USING btree ("overall_match_score");--> statement-breakpoint
CREATE INDEX "player_event_registrations_player_idx" ON "player_event_registrations" USING btree ("player_id");--> statement-breakpoint
CREATE INDEX "player_event_registrations_event_idx" ON "player_event_registrations" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "player_goals_player_id_idx" ON "player_goals" USING btree ("player_id");--> statement-breakpoint
CREATE INDEX "player_ratings_player_id_idx" ON "player_ratings" USING btree ("player_id");--> statement-breakpoint
CREATE INDEX "player_ratings_rated_by_user_id_idx" ON "player_ratings" USING btree ("rated_by_user_id");--> statement-breakpoint
CREATE INDEX "player_stories_player_id_idx" ON "player_stories" USING btree ("player_id");--> statement-breakpoint
CREATE INDEX "player_stories_template_id_idx" ON "player_stories" USING btree ("template_id");--> statement-breakpoint
CREATE INDEX "players_user_id_idx" ON "players" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "players_sport_idx" ON "players" USING btree ("sport");--> statement-breakpoint
CREATE UNIQUE INDEX "players_username_idx" ON "players" USING btree ("username");--> statement-breakpoint
CREATE INDEX "poll_votes_poll_id_idx" ON "poll_votes" USING btree ("poll_id");--> statement-breakpoint
CREATE INDEX "polls_player_id_idx" ON "polls" USING btree ("player_id");--> statement-breakpoint
CREATE INDEX "practice_attendance_practice_id_idx" ON "practice_attendance" USING btree ("practice_id");--> statement-breakpoint
CREATE INDEX "practice_attendance_player_id_idx" ON "practice_attendance" USING btree ("player_id");--> statement-breakpoint
CREATE INDEX "practices_team_id_idx" ON "practices" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "prediction_votes_prediction_id_idx" ON "prediction_votes" USING btree ("prediction_id");--> statement-breakpoint
CREATE INDEX "predictions_player1_id_idx" ON "predictions" USING btree ("player1_id");--> statement-breakpoint
CREATE INDEX "predictions_player2_id_idx" ON "predictions" USING btree ("player2_id");--> statement-breakpoint
CREATE INDEX "profile_views_player_idx" ON "profile_views" USING btree ("player_id");--> statement-breakpoint
CREATE INDEX "profile_views_viewed_at_idx" ON "profile_views" USING btree ("viewed_at");--> statement-breakpoint
CREATE INDEX "recruit_interests_post_id_idx" ON "recruit_interests" USING btree ("post_id");--> statement-breakpoint
CREATE INDEX "recruit_interests_player_id_idx" ON "recruit_interests" USING btree ("player_id");--> statement-breakpoint
CREATE INDEX "recruit_posts_player_id_idx" ON "recruit_posts" USING btree ("player_id");--> statement-breakpoint
CREATE INDEX "recruiter_profiles_user_id_idx" ON "recruiter_profiles" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "recruiting_contacts_target_id_idx" ON "recruiting_contacts" USING btree ("target_id");--> statement-breakpoint
CREATE INDEX "recruiting_events_sport_idx" ON "recruiting_events" USING btree ("sport");--> statement-breakpoint
CREATE INDEX "recruiting_events_state_idx" ON "recruiting_events" USING btree ("state");--> statement-breakpoint
CREATE INDEX "recruiting_events_start_date_idx" ON "recruiting_events" USING btree ("start_date");--> statement-breakpoint
CREATE INDEX "recruiting_events_college_id_idx" ON "recruiting_events" USING btree ("college_id");--> statement-breakpoint
CREATE INDEX "recruiting_events_team_id_idx" ON "recruiting_events" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "recruiting_events_visibility_idx" ON "recruiting_events" USING btree ("visibility");--> statement-breakpoint
CREATE INDEX "recruiting_inquiries_player_id_idx" ON "recruiting_inquiries" USING btree ("player_id");--> statement-breakpoint
CREATE INDEX "recruiting_targets_player_id_idx" ON "recruiting_targets" USING btree ("player_id");--> statement-breakpoint
CREATE INDEX "reposts_original_activity_id_idx" ON "reposts" USING btree ("original_activity_id");--> statement-breakpoint
CREATE INDEX "reposts_game_id_idx" ON "reposts" USING btree ("game_id");--> statement-breakpoint
CREATE INDEX "saved_posts_activity_id_idx" ON "saved_posts" USING btree ("activity_id");--> statement-breakpoint
CREATE INDEX "saved_posts_player_id_idx" ON "saved_posts" USING btree ("player_id");--> statement-breakpoint
CREATE UNIQUE INDEX "saved_posts_unique_idx" ON "saved_posts" USING btree ("activity_id","player_id");--> statement-breakpoint
CREATE INDEX "schedule_events_player_id_idx" ON "schedule_events" USING btree ("player_id");--> statement-breakpoint
CREATE INDEX "schedule_events_team_id_idx" ON "schedule_events" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "share_assets_player_id_idx" ON "share_assets" USING btree ("player_id");--> statement-breakpoint
CREATE INDEX "share_assets_game_id_idx" ON "share_assets" USING btree ("game_id");--> statement-breakpoint
CREATE INDEX "share_assets_badge_id_idx" ON "share_assets" USING btree ("badge_id");--> statement-breakpoint
CREATE INDEX "shop_items_category_idx" ON "shop_items" USING btree ("category");--> statement-breakpoint
CREATE INDEX "shop_items_is_active_idx" ON "shop_items" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "shots_game_id_idx" ON "shots" USING btree ("game_id");--> statement-breakpoint
CREATE INDEX "shots_player_id_idx" ON "shots" USING btree ("player_id");--> statement-breakpoint
CREATE INDEX "skill_badges_player_id_idx" ON "skill_badges" USING btree ("player_id");--> statement-breakpoint
CREATE INDEX "stat_verifications_game_id_idx" ON "stat_verifications" USING btree ("game_id");--> statement-breakpoint
CREATE INDEX "stat_verifications_player_id_idx" ON "stat_verifications" USING btree ("player_id");--> statement-breakpoint
CREATE INDEX "stat_verifications_status_idx" ON "stat_verifications" USING btree ("status");--> statement-breakpoint
CREATE INDEX "story_highlights_player_id_idx" ON "story_highlights" USING btree ("player_id");--> statement-breakpoint
CREATE INDEX "story_reactions_story_id_idx" ON "story_reactions" USING btree ("story_id");--> statement-breakpoint
CREATE INDEX "story_reactions_reactor_id_idx" ON "story_reactions" USING btree ("reactor_id");--> statement-breakpoint
CREATE INDEX "story_tags_story_id_idx" ON "story_tags" USING btree ("story_id");--> statement-breakpoint
CREATE INDEX "story_tags_tagged_player_id_idx" ON "story_tags" USING btree ("tagged_player_id");--> statement-breakpoint
CREATE INDEX "story_views_story_id_idx" ON "story_views" USING btree ("story_id");--> statement-breakpoint
CREATE INDEX "story_views_viewer_id_idx" ON "story_views" USING btree ("viewer_id");--> statement-breakpoint
CREATE INDEX "streaks_player_id_idx" ON "streaks" USING btree ("player_id");--> statement-breakpoint
CREATE INDEX "streaks_last_game_id_idx" ON "streaks" USING btree ("last_game_id");--> statement-breakpoint
CREATE INDEX "team_history_player_idx" ON "team_history" USING btree ("player_id");--> statement-breakpoint
CREATE INDEX "team_members_team_id_idx" ON "team_members" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "team_members_player_id_idx" ON "team_members" USING btree ("player_id");--> statement-breakpoint
CREATE INDEX "team_post_comments_post_id_idx" ON "team_post_comments" USING btree ("post_id");--> statement-breakpoint
CREATE INDEX "team_post_comments_author_id_idx" ON "team_post_comments" USING btree ("author_id");--> statement-breakpoint
CREATE INDEX "team_posts_team_id_idx" ON "team_posts" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "team_posts_author_id_idx" ON "team_posts" USING btree ("author_id");--> statement-breakpoint
CREATE INDEX "training_group_members_group_id_idx" ON "training_group_members" USING btree ("group_id");--> statement-breakpoint
CREATE INDEX "training_group_members_player_id_idx" ON "training_group_members" USING btree ("player_id");--> statement-breakpoint
CREATE INDEX "training_groups_owner_player_id_idx" ON "training_groups" USING btree ("owner_player_id");--> statement-breakpoint
CREATE INDEX "user_inventory_user_id_idx" ON "user_inventory" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_inventory_item_id_idx" ON "user_inventory" USING btree ("item_id");--> statement-breakpoint
CREATE INDEX "wearable_connections_player_id_idx" ON "wearable_connections" USING btree ("player_id");--> statement-breakpoint
CREATE INDEX "wearable_connections_provider_idx" ON "wearable_connections" USING btree ("provider");--> statement-breakpoint
CREATE INDEX "workouts_player_id_idx" ON "workouts" USING btree ("player_id");--> statement-breakpoint
CREATE INDEX "IDX_session_expire" ON "sessions" USING btree ("expire");