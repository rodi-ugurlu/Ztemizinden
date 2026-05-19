-- V8: Asset Breakdown Structure — hierarchical tree support
-- Adds self-referencing parent_id, depth tracking, sort order, and leaf flag.

ALTER TABLE assets ADD COLUMN parent_id VARCHAR(255) REFERENCES assets(id) ON DELETE CASCADE;
ALTER TABLE assets ADD COLUMN depth INTEGER NOT NULL DEFAULT 0;
ALTER TABLE assets ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 0;
ALTER TABLE assets ADD COLUMN leaf BOOLEAN NOT NULL DEFAULT TRUE;

CREATE INDEX idx_assets_parent ON assets(parent_id);
CREATE INDEX idx_assets_owner_parent ON assets(owner_id, parent_id);
CREATE INDEX idx_assets_depth ON assets(owner_id, depth);
