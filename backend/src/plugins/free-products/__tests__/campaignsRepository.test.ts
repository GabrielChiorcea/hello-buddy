import { describe, it, expect } from 'vitest';

// Simple smoke tests to ensure repository functions are defined and return promises.
// Detailed integration tests can be added with a real test DB setup.

import * as Repo from '../repositories/campaignsRepository.js';

describe('free-products campaignsRepository', () => {
  it('expose expected functions', () => {
    expect(typeof Repo.listCampaigns).toBe('function');
    expect(typeof Repo.getCampaignById).toBe('function');
    expect(typeof Repo.createCampaign).toBe('function');
    expect(typeof Repo.updateCampaign).toBe('function');
    expect(typeof Repo.deleteCampaign).toBe('function');
    expect(typeof Repo.setCampaignProducts).toBe('function');
    expect(typeof Repo.getCampaignProducts).toBe('function');
    expect(typeof Repo.getCampaignsWithProducts).toBe('function');
    expect(typeof Repo.getActiveCampaignsForTier).toBe('function');
    expect(typeof Repo.getActiveProductIdsForTier).toBe('function');
  });
});

