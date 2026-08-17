"use client";

import Link from "next/link";
import { PageHeader, PageTransition } from "@/components/page-chrome";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";

const TOC = [
  { id: "start", label: "Getting started" },
  { id: "roles", label: "Roles" },
  { id: "dashboard", label: "Dashboard" },
  { id: "pipeline", label: "Client Pipeline" },
  { id: "clients", label: "Clients" },
  { id: "projects", label: "Projects" },
  { id: "finance", label: "Finance" },
  { id: "calendar", label: "Calendar" },
  { id: "team", label: "Team" },
  { id: "settings", label: "Settings" },
  { id: "tips", label: "Tips" },
] as const;

export default function GuidePage() {
  const { user, allow } = useAuth();

  return (
    <PageTransition>
      <PageHeader
        eyebrow="Studio handbook"
        title="How to use Duneworks"
        description="A full walkthrough of the CRM — from sign-in to pipeline, productions, and finance."
      />
      <div className="grid gap-8 xl:grid-cols-[220px_minmax(0,1fr)] scroll-smooth">
        <aside className="xl:sticky xl:top-6 xl:self-start">
          <p className="mb-3 text-[11px] tracking-[0.18em] text-muted-foreground uppercase">
            Contents
          </p>
          <nav className="flex gap-2 overflow-x-auto pb-2 xl:flex-col xl:overflow-visible xl:pb-0">
            {TOC.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className="shrink-0 rounded-lg px-3 py-1.5 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground"
              >
                {item.label}
              </a>
            ))}
          </nav>
          <p className="mt-4 hidden text-xs text-muted-foreground xl:block">
            Signed in as {user?.name ?? "Studio"} · {user?.role ?? "Viewer"}
          </p>
        </aside>

        <div className="space-y-8">
          <Section id="start" title="Getting started">
            <p>
              Duneworks CRM is the studio book for companies, productions, invoices, and
              the calendar. There is no public sign-up. An Admin creates your account,
              then you sign in with that email and password.
            </p>
            <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm">
              <li>Open the studio site and go to Sign in.</li>
              <li>Enter the email and password you were given.</li>
              <li>You land on the Dashboard.</li>
              <li>Use the left menu to move between areas. On a phone, open the menu from the top-left.</li>
              <li>Log out from the bottom of the sidebar when you are done.</li>
            </ol>
            <p className="mt-4 text-sm text-muted-foreground">
              Inactive accounts cannot sign in. If login fails, ask an Admin to confirm
              your account is active and that the password is at least 8 characters.
            </p>
          </Section>

          <Section id="roles" title="Roles & what you can do">
            <p>
              Every person has one role. Buttons you cannot use are hidden. Finance,
              Team, and Settings only appear if your role allows them.
            </p>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[520px] text-left text-sm">
                <thead>
                  <tr className="border-b border-border/70 text-[11px] tracking-[0.14em] text-muted-foreground uppercase">
                    <th className="py-2 pr-3 font-medium">Role</th>
                    <th className="py-2 pr-3 font-medium">Best for</th>
                    <th className="py-2 font-medium">Access</th>
                  </tr>
                </thead>
                <tbody className="text-muted-foreground">
                  <tr className="border-b border-border/50">
                    <td className="py-3 pr-3">
                      <Badge variant="outline">Admin</Badge>
                    </td>
                    <td className="py-3 pr-3 text-foreground">Studio lead</td>
                    <td className="py-3">
                      Everything: pipeline, finance, team accounts, settings, deletes,
                      and custom pipeline stages.
                    </td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-3 pr-3">
                      <Badge variant="outline">Manager</Badge>
                    </td>
                    <td className="py-3 pr-3 text-foreground">Production / ops</td>
                    <td className="py-3">
                      Companies, pipeline, projects, payments, and finance analytics.
                      Cannot manage users or studio settings.
                    </td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-3 pr-3">
                      <Badge variant="outline">Editor</Badge>
                    </td>
                    <td className="py-3 pr-3 text-foreground">Day-to-day logging</td>
                    <td className="py-3">
                      Add and edit companies, notes, projects, and calendar events.
                      Move cards on the pipeline. Cannot delete, and cannot open Finance.
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 pr-3">
                      <Badge variant="outline">Viewer</Badge>
                    </td>
                    <td className="py-3 pr-3 text-foreground">Read-only</td>
                    <td className="py-3">
                      Browse the studio. Can open Finance invoices, but not revenue
                      analytics or payment editing.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Section>

          <Section
            id="dashboard"
            title="Dashboard"
            href="/dashboard"
            linkLabel="Open Dashboard"
          >
            <p>
              The home screen after sign-in. It is an overview of revenue, pipeline,
              activity, alerts, and work due this week — calculated from live studio
              data.
            </p>
            <ul className="mt-4 space-y-2 text-sm">
              <li>
                <strong className="text-foreground">Search</strong> — type a company,
                project, invoice, or teammate. Shortcut: ⌘K / Ctrl+K.
              </li>
              <li>
                <strong className="text-foreground">Bell</strong> — unread alerts such as
                overdue invoices, demos today, or quiet leads. Mark one or all as read.
              </li>
              <li>
                <strong className="text-foreground">Quick Add</strong> — add a company,
                signed client, project, payment, or team member (only the actions your
                role allows).
              </li>
              <li>
                <strong className="text-foreground">Metric cards</strong> — click a card
                or chart stage to open the related records.
              </li>
              <li>
                <strong className="text-foreground">Tasks</strong> — check off meetings,
                deadlines, and invoices. Add Task keeps a personal list on this browser
                until a later backend is connected.
              </li>
              <li>
                <strong className="text-foreground">Team panel</strong> — Admin and
                Manager see assigned companies and workload.
              </li>
            </ul>
          </Section>

          <Section
            id="pipeline"
            title="Client Pipeline"
            href="/pipeline"
            linkLabel="Open pipeline"
          >
            <p>
              This is the main CRM board. Each column is a stage. Each card is a
              company with a Duneworks ID such as #DW-1024, contact, value, owner, and
              last activity.
            </p>
            <p className="mt-3 text-[11px] tracking-[0.16em] text-gold uppercase">
              Default stages
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {[
                "Possible Clients",
                "Contacted",
                "Demo Scheduled",
                "In Discussion",
                "Trial",
                "Paid Client",
                "Denied",
              ].map((stage) => (
                <Badge key={stage} variant="outline">
                  {stage}
                </Badge>
              ))}
            </div>
            <ul className="mt-4 space-y-2 text-sm">
              <li>
                <strong className="text-foreground">Add a company</strong> — company
                name, contact, phone, email, potential value, source, owner, stage, and
                tags.
              </li>
              <li>
                <strong className="text-foreground">Move a deal</strong> — drag a card
                into another column (Admin, Manager, Editor).
              </li>
              <li>
                <strong className="text-foreground">Denied</strong> — dropping into
                Denied asks for a reason. That reason is stored on the activity log.
              </li>
              <li>
                <strong className="text-foreground">Paid Client</strong> — the company
                becomes an Active client and can be used on projects and invoices.
              </li>
              <li>
                <strong className="text-foreground">Filters</strong> — search, assignee,
                source, value band, tags, and date added.
              </li>
              <li>
                <strong className="text-foreground">Create category</strong> — Admins can
                add, rename, recolor, reorder, or delete custom stages. The default
                stages stay locked.
              </li>
            </ul>
          </Section>

          <Section id="clients" title="Clients" href="/clients" linkLabel="Open clients">
            <p>
              A list or grid of every company in the pipeline. Click a row to open the
              company panel: notes, activity, projects, and payments.
            </p>
            <ul className="mt-4 space-y-2 text-sm">
              <li>Search by company, contact, or ID. Filter by stage.</li>
              <li>
                Add Company starts a lead. Add Client (from Quick Add) starts them in
                Paid Client when that stage exists.
              </li>
              <li>Internal notes stay on the company record for the studio.</li>
            </ul>
          </Section>

          <Section
            id="projects"
            title="Projects"
            href="/projects"
            linkLabel="Open projects"
          >
            <p>
              Productions for paid clients. Switch between a kanban board and a table.
              Statuses: Inquiry, Pre-production, Production, Editing, Delivered.
            </p>
            <ul className="mt-4 space-y-2 text-sm">
              <li>Add a project only after the company is a Paid Client.</li>
              <li>Set type, budget, deadline, progress, notes, and a checklist.</li>
              <li>Drag cards between statuses if you can edit records.</li>
              <li>Open a project for checklist ticks and linked invoices.</li>
            </ul>
          </Section>

          <Section
            id="finance"
            title="Finance"
            href={allow("viewFinance") ? "/finance" : undefined}
            linkLabel={allow("viewFinance") ? "Open finance" : undefined}
          >
            <p>
              Invoices for paid clients and their productions. Statuses: Paid, Pending,
              Overdue. Methods: Wire, ACH, Credit Card, Check, PayPal.
            </p>
            {!allow("viewFinance") ? (
              <p className="mt-3 text-sm text-muted-foreground">
                Your role does not include Finance. Ask an Admin if you need invoice
                access.
              </p>
            ) : (
              <ul className="mt-4 space-y-2 text-sm">
                <li>Admin and Manager can add and edit payments.</li>
                <li>Click a row to open the invoice view.</li>
                <li>Export the current list as CSV.</li>
                <li>
                  Revenue charts on Finance and Dashboard are for Admin and Manager.
                </li>
              </ul>
            )}
          </Section>

          <Section
            id="calendar"
            title="Calendar"
            href="/calendar"
            linkLabel="Open calendar"
          >
            <p>
              Month view of studio dates. Types are color-coded: deadline, meeting,
              shoot, and payment. Click a day, then add or open an event. Link it to a
              company or project when you can.
            </p>
          </Section>

          <Section
            id="team"
            title="Team & Permissions"
            href={allow("manageUsers") ? "/team" : undefined}
            linkLabel={allow("manageUsers") ? "Open team" : undefined}
          >
            <p>Admins create studio logins here. Everyone else uses the account they were given.</p>
            <ul className="mt-4 space-y-2 text-sm">
              <li>Add name, email, role, and a password of at least 8 characters.</li>
              <li>Share those details with the person privately — they are the sign-in.</li>
              <li>Edit a user to change role, reset password, or deactivate.</li>
              <li>Deactivated people cannot sign in. Assigned companies stay on the board.</li>
              <li>Keep at least one Admin. You cannot remove your own admin access or delete yourself.</li>
            </ul>
          </Section>

          <Section
            id="settings"
            title="Settings"
            href={allow("manageSettings") ? "/settings" : undefined}
            linkLabel={allow("manageSettings") ? "Open settings" : undefined}
          >
            <p>Admins maintain the studio profile used on invoices: name, email, phone, website, and address.</p>
            <ul className="mt-4 space-y-2 text-sm">
              <li>Notification toggles for deadlines, payment reminders, new leads, and a weekly digest.</li>
              <li>Appearance: dark charcoal, warm light, or system.</li>
              <li>Database status shows health and record counts.</li>
            </ul>
          </Section>

          <Section id="tips" title="Everyday tips">
            <ul className="space-y-2 text-sm">
              <li>Work the pipeline first, then open a card for notes and history.</li>
              <li>Move a company to Paid Client before you log a project or invoice.</li>
              <li>Always give a reason when a deal is denied.</li>
              <li>Refresh the Dashboard after a batch of updates.</li>
              <li>If something you expect is missing, check your role — the menu only shows what you can use.</li>
            </ul>
            <div className="mt-6 flex flex-wrap gap-2">
              <Button asChild>
                <Link href="/dashboard">Go to Dashboard</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/pipeline">Go to Pipeline</Link>
              </Button>
            </div>
          </Section>
        </div>
      </div>
    </PageTransition>
  );
}

function Section({
  id,
  title,
  href,
  linkLabel,
  children,
}: {
  id: string;
  title: string;
  href?: string;
  linkLabel?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="glass-panel scroll-mt-6 rounded-2xl p-6 sm:p-8">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <h2 className="font-heading text-2xl tracking-tight">{title}</h2>
        {href && linkLabel ? (
          <Button variant="ghost" size="sm" asChild>
            <Link href={href}>{linkLabel}</Link>
          </Button>
        ) : null}
      </div>
      <div className="space-y-3 text-sm leading-relaxed text-muted-foreground [&_strong]:font-medium">
        {children}
      </div>
    </section>
  );
}
