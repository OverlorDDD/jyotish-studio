-- News Personal Interests P4: opt-out switch, preserves all existing accounts and topics.
ALTER TABLE "PersonalProfile" ADD COLUMN "newsPersonalizationEnabled" BOOLEAN NOT NULL DEFAULT TRUE;
