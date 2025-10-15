export type ToneOption = "friendly" | "authoritative" | "contrarian";

export type AudienceStage = "starting" | "small" | "growing";

export type CadenceFormat = "text" | "thread" | "carousel" | "shorts" | "blog";

export type CadenceChannel = "linkedin" | "x" | "instagram" | "youtube" | "blog";

export type CadenceDay = "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun";

export type TargetPlatform =
  | "x"
  | "linkedin"
  | "youtube"
  | "rss"
  | "instagram"
  | "other";

export interface Target {
  id: string;
  handle: string;
  platform: TargetPlatform;
  notes?: string;
}

export interface PlanPillar {
  id: string;
  name: string;
  color: string;
}

export interface PlanCadenceSlot {
  id: string;
  day: CadenceDay;
  type: CadenceFormat;
  channels: CadenceChannel[];
  hourHint?: number;
}

export interface PlanTargets {
  peers: Target[];
  prospects: Target[];
  leaders: Target[];
}

export interface Plan {
  purpose: string;
  tone: ToneOption;
  audienceStage: AudienceStage;
  pillars: PlanPillar[];
  cadence: PlanCadenceSlot[];
  targets: PlanTargets;
  dailyReplies: number;
}

export type PlanBlockKey = "pillars" | "cadence" | "targets" | "engagement";
