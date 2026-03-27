-- Add representative image per streak campaign
ALTER TABLE streak_campaigns
  ADD COLUMN image_url VARCHAR(1024) NULL AFTER custom_text;
