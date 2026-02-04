/**
 * Rezolvere pentru profil utilizator
 */

import { GraphQLContext, requireAuth } from '../context.js';
import * as UserModel from '../../models/User.js';

interface ProfileUpdateInput {
  name?: string;
  phone?: string;
  address?: string;
  city?: string;
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
  },
};
