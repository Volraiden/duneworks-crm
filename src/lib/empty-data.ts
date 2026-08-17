import type { CrmData, StudioSettings } from "@/lib/types";

export const DEFAULT_SETTINGS: StudioSettings = {
  studioName: "Duneworks Productions",
  email: "Duneworksstudios@gmail.com",
  phone: "",
  website: "",
  address: "",
  notifications: {
    projectDeadlines: true,
    paymentReminders: true,
    newLeads: true,
    weeklyDigest: false,
  },
  appearance: "dark",
};

export const EMPTY_CRM_DATA: CrmData = {
  clients: [],
  projects: [],
  payments: [],
  events: [],
  stages: [],
  team: [],
  notes: [],
  activities: [],
  settings: DEFAULT_SETTINGS,
};

export const SIDEBAR_STORAGE_KEY = "duneworks-crm-sidebar";
