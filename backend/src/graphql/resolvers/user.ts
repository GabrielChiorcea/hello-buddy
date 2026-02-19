/**
 * Rezolvere pentru profil utilizator
 */

import { GraphQLContext, requireAuth } from '../context.js';
import * as UserModel from '../../models/User.js';
import { queryOne } from '../../config/database.js';
import { isPluginEnabled } from '../../utils/pluginFlags.js';
import type { User } from '../../models/User.js';

interface ProfileUpdateInput {
  name?: string;
  phone?: string;
}

export const userResolvers = {
  Query: {
    /**
     * Returnează utilizatorul autentificat curent
     */
    async currentUser(_: unknown, __: unknown, context: GraphQLContext) {
      return context.user;
    },
  },

  Mutation: {
    /**
     * Actualizează profilul utilizatorului
     */
    async updateProfile(
      _: unknown,
      { input }: { input: ProfileUpdateInput },
      context: GraphQLContext
    ) {
      const user = requireAuth(context);
      
      const updatedUser = await UserModel.update(user.id, input);
      if (!updatedUser) {
        throw new Error('Eroare la actualizarea profilului');
      }
      
      return updatedUser;
    },

    /**
     * Marchează că utilizatorul a văzut popup-ul „Ai câștigat X puncte”.
     */
    async markWelcomeBonusSeen(_: unknown, __: unknown, context: GraphQLContext) {
      const user = requireAuth(context);
      await UserModel.markWelcomeBonusSeen(user.id);
      return true;
    },
  },

  User: {
    /**
     * Numărul de puncte afișat în popup (cadou la înregistrare). 0 dacă a văzut deja sau plugin inactiv.
     */
    async welcomeBonusAmount(user: User): Promise<number> {
      if (user.welcomeBonusSeen) return 0;
      const enabled = await isPluginEnabled('points');
      if (!enabled) return 0;
      const row = await queryOne<{ value: string }>(
        "SELECT value FROM app_settings WHERE id = 'points_welcome_bonus'"
      );
      if (!row) return 5;
      return Math.max(0, parseInt(row.value, 10) || 0);
    },
  },
};
