/**
 * Rezolvere pentru adrese de livrare
 */

import { GraphQLContext, requireAuth } from '../context.js';
import * as AddressModel from '../../models/Address.js';

interface AddressInput {
  label: string;
  address: string;
  city: string;
  phone: string;
  notes?: string;
  isDefault?: boolean;
}

export const addressResolvers = {
  Query: {
    /**
     * Listează adresele utilizatorului autentificat
     */
    async addresses(_: unknown, __: unknown, context: GraphQLContext) {
      const user = requireAuth(context);
      return AddressModel.findByUserId(user.id);
    },

    /**
     * Găsește o adresă după ID
     */
    async address(_: unknown, { id }: { id: string }, context: GraphQLContext) {
      const user = requireAuth(context);
      const address = await AddressModel.findById(id);
      
      // Verifică dacă adresa aparține utilizatorului
      if (!address || address.userId !== user.id) {
        return null;
      }
      
      return address;
    },
  },

  Mutation: {
    /**
     * Creează o adresă nouă
     */
    async createAddress(
      _: unknown,
      { input }: { input: AddressInput },
      context: GraphQLContext
    ) {
      const user = requireAuth(context);
      
      return AddressModel.create({
        userId: user.id,
        ...input,
      });
    },

    /**
     * Actualizează o adresă
     */
    async updateAddress(
      _: unknown,
      { id, input }: { id: string; input: AddressInput },
      context: GraphQLContext
    ) {
      const user = requireAuth(context);
      
      // Verifică dacă adresa aparține utilizatorului
      const address = await AddressModel.findById(id);
      if (!address || address.userId !== user.id) {
        throw new Error('Adresa nu a fost găsită');
      }
      
      const updatedAddress = await AddressModel.update(id, input);
      if (!updatedAddress) {
        throw new Error('Eroare la actualizarea adresei');
      }
      
      return updatedAddress;
    },

    /**
     * Șterge o adresă
     */
    async deleteAddress(
      _: unknown,
      { id }: { id: string },
      context: GraphQLContext
    ) {
      const user = requireAuth(context);
      return AddressModel.deleteAddress(id, user.id);
    },

    /**
     * Setează o adresă ca implicită
     */
    async setDefaultAddress(
      _: unknown,
      { id }: { id: string },
      context: GraphQLContext
    ) {
      const user = requireAuth(context);
      
      // Verifică dacă adresa aparține utilizatorului
      const address = await AddressModel.findById(id);
      if (!address || address.userId !== user.id) {
        throw new Error('Adresa nu a fost găsită');
      }
      
      const updatedAddress = await AddressModel.setDefault(id, user.id);
      if (!updatedAddress) {
        throw new Error('Eroare la setarea adresei implicite');
      }
      
      return updatedAddress;
    },
  },
};
