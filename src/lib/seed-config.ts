/**
 * Studio account credentials for the Duneworks Productions CRM.
 *
 * Keep credentials here — never hard-code them in UI components.
 */

export const STUDIO_ADMIN = {
  id: "user_admin",
  name: "Duneworks",
  email: "Duneworksstudios@gmail.com",
  password: "Duneworks123",
  role: "Admin" as const,
};

export const DEFAULT_PIPELINE_STAGES = [
  { id: "stage_possible", name: "Possible Clients", slug: "possible-clients", color: "#c4b49a", sortOrder: 0, kind: "possible" },
  { id: "stage_contacted", name: "Contacted", slug: "contacted", color: "#8fa6c2", sortOrder: 1, kind: "contacted" },
  { id: "stage_demo", name: "Demo Scheduled", slug: "demo-scheduled", color: "#c9a45c", sortOrder: 2, kind: "demo" },
  { id: "stage_discussion", name: "In Discussion", slug: "in-discussion", color: "#b08968", sortOrder: 3, kind: "discussion" },
  { id: "stage_trial", name: "Trial", slug: "trial", color: "#7d9b76", sortOrder: 4, kind: "trial" },
  { id: "stage_paid", name: "Paid Client", slug: "paid-client", color: "#d4c4a8", sortOrder: 5, kind: "paid" },
  { id: "stage_denied", name: "Denied", slug: "denied", color: "#8a5a52", sortOrder: 6, kind: "denied" },
] as const;

/** Previously seeded sample records — removed on startup so they do not linger. */
export const LEGACY_SAMPLE_IDS = {
  users: ["user_manager", "user_editor", "user_viewer"],
  userEmails: [
    "caleb.ward@duneworks.studio",
    "sienna.okonkwo@duneworks.studio",
    "jonah.reeves@duneworks.studio",
  ],
  clients: [
    "co_amberline",
    "co_northglass",
    "co_redcedar",
    "co_harbor",
    "co_kiteloom",
    "co_solstice",
    "co_ironbark",
    "co_velvet",
    "co_lumenforge",
    "co_saltmarsh",
    "co_quartzpine",
    "co_nightorchard",
  ],
  projects: ["proj_solstice_short", "proj_quartz_showroom"],
  payments: ["pay_solstice_deposit", "pay_quartz_1", "pay_quartz_2"],
};
