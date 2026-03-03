/**
 * Plugin Welcome Bonus – puncte cadou la prima autentificare (popup + alocare)
 * Feature flag: plugin_welcome_bonus_enabled
 */

import { welcomeBonusSchemaExtension } from './graphql/schema.js';
import { welcomeBonusResolvers } from './graphql/resolvers.js';

export const schemaExtension = welcomeBonusSchemaExtension;
export const resolvers = welcomeBonusResolvers;
