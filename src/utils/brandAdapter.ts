/**
 * brandAdapter.ts
 *
 * Bridges the BrandKit (snake_case Zod schema) used by the pipeline
 * and the flat BrandProps (camelCase) expected by migrated aipg-video-templates.
 */

import { BrandKit } from "./brandKit";

export interface FlatBrandProps {
  primaryColor: string;
  accentColor: string;
  backgroundColor: string;
  backgroundVideoUrl: string;
  textColor: string;
  fontFamily: string;
  logoText: string;
  logoUrl: string;
  heygenAvatarId: string;
  elevenlabsVoiceId: string;
}

export function adaptBrandKit(kit: BrandKit): FlatBrandProps {
  return {
    primaryColor: kit.primary_color,
    accentColor: kit.accent_color,
    backgroundColor: kit.background_color,
    backgroundVideoUrl: kit.background_video_url ?? "",
    textColor: "#FFFFFF",
    fontFamily: kit.font_primary,
    logoText: kit.practice_name,
    logoUrl: kit.logo_url ?? "",
    heygenAvatarId: kit.heygen_avatar_id ?? "",
    elevenlabsVoiceId: kit.elevenlabs_voice_id ?? "",
  };
}
