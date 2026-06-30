import { supabase } from './supabaseClient';
import type { Match, BracketMatch, Player, Scorer } from '../types';

export interface CompetitionState {
  matches: Match[];
  bracket: Record<string, BracketMatch[]>;
  third_place_selections: Record<string, string>;
  custom_scorers: Record<string, Scorer[]>;
  rosters: Record<string, Player[]>;
  error_correction_mode: boolean;
}

export const competitionRepository = {
  async getCompetitionState(
    id: string,
    initialData: {
      matches: Match[];
      bracket: Record<string, BracketMatch[]>;
      rosters: Record<string, Player[]>;
    }
  ): Promise<CompetitionState> {
    const { data, error } = await supabase
      .from('competition_states')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      // PGRST116 is code for "0 rows returned"
      if (error.code === 'PGRST116') {
        const initialState: CompetitionState = {
          matches: initialData.matches,
          bracket: initialData.bracket,
          third_place_selections: {},
          custom_scorers: {},
          rosters: initialData.rosters,
          error_correction_mode: false,
        };

        const { error: insertError } = await supabase
          .from('competition_states')
          .insert({
            id,
            matches: initialState.matches,
            bracket: initialState.bracket,
            third_place_selections: initialState.third_place_selections,
            custom_scorers: initialState.custom_scorers,
            rosters: initialState.rosters,
            error_correction_mode: initialState.error_correction_mode,
          });

        if (insertError) {
          console.error('Error creating initial competition state in Supabase:', insertError);
          throw insertError;
        }

        return initialState;
      } else {
        console.error('Error fetching competition state from Supabase:', error);
        throw error;
      }
    }

    return {
      matches: data.matches as Match[],
      bracket: data.bracket as Record<string, BracketMatch[]>,
      third_place_selections: data.third_place_selections as Record<string, string>,
      custom_scorers: data.custom_scorers as Record<string, Scorer[]>,
      rosters: data.rosters as Record<string, Player[]>,
      error_correction_mode: data.error_correction_mode as boolean,
    };
  },

  async updateCompetitionState(id: string, state: Partial<CompetitionState>): Promise<void> {
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (state.matches !== undefined) updateData.matches = state.matches;
    if (state.bracket !== undefined) updateData.bracket = state.bracket;
    if (state.third_place_selections !== undefined) updateData.third_place_selections = state.third_place_selections;
    if (state.custom_scorers !== undefined) updateData.custom_scorers = state.custom_scorers;
    if (state.rosters !== undefined) updateData.rosters = state.rosters;
    if (state.error_correction_mode !== undefined) updateData.error_correction_mode = state.error_correction_mode;

    const { error } = await supabase
      .from('competition_states')
      .update(updateData)
      .eq('id', id);

    if (error) {
      console.error('Error updating competition state in Supabase:', error);
      throw error;
    }
  },

  async resetCompetitionState(
    id: string,
    initialData: {
      matches: Match[];
      bracket: Record<string, BracketMatch[]>;
      rosters: Record<string, Player[]>;
    }
  ): Promise<CompetitionState> {
    const initialState: CompetitionState = {
      matches: initialData.matches,
      bracket: initialData.bracket,
      third_place_selections: {},
      custom_scorers: {},
      rosters: initialData.rosters,
      error_correction_mode: false,
    };

    const { error } = await supabase
      .from('competition_states')
      .update({
        matches: initialState.matches,
        bracket: initialState.bracket,
        third_place_selections: initialState.third_place_selections,
        custom_scorers: initialState.custom_scorers,
        rosters: initialState.rosters,
        error_correction_mode: initialState.error_correction_mode,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      console.error('Error resetting competition state in Supabase:', error);
      throw error;
    }

    return initialState;
  },
};
