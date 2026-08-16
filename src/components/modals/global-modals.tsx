"use client";

import { toast } from "sonner";
import { ClientForm } from "@/components/forms/client-form";
import { ProjectForm } from "@/components/forms/project-form";
import { PaymentForm } from "@/components/forms/payment-form";
import { EventForm } from "@/components/forms/event-form";
import { ClientDetail } from "@/components/clients/client-detail";
import { ProjectDetail } from "@/components/projects/project-detail";
import { InvoiceModal } from "@/components/finance/invoice-modal";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useCrm } from "@/context/crm-context";
import { ScrollArea } from "@/components/ui/scroll-area";

export function GlobalModals() {
  const {
    data,
    dialog,
    closeDialog,
    openDialog,
    upsertClient,
    upsertProject,
    upsertPayment,
    upsertEvent,
  } = useCrm();

  const editingClient = data.clients.find((client) => client.id === dialog.id);
  const editingProject = data.projects.find((project) => project.id === dialog.id);
  const editingPayment = data.payments.find((payment) => payment.id === dialog.id);
  const editingEvent = data.events.find((event) => event.id === dialog.id);

  return (
    <>
      <Dialog
        open={dialog.kind === "client"}
        onOpenChange={(open) => !open && closeDialog()}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingClient ? "Edit client" : "Add client"}
            </DialogTitle>
            <DialogDescription>
              Keep contact details, status, and production tags in one place.
            </DialogDescription>
          </DialogHeader>
          <ClientForm
            key={dialog.id ?? "new-client"}
            client={editingClient}
            onCancel={closeDialog}
            onSubmit={async (values) => {
              await upsertClient({ ...values, id: editingClient?.id });
              toast.success(editingClient ? "Client updated" : "Client added");
              closeDialog();
            }}
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={dialog.kind === "project"}
        onOpenChange={(open) => !open && closeDialog()}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {editingProject ? "Edit project" : "Add project"}
            </DialogTitle>
            <DialogDescription>
              Link a production to a client and track budget, deadline, and stage.
            </DialogDescription>
          </DialogHeader>
          <ProjectForm
            key={dialog.id ?? "new-project"}
            project={editingProject}
            clients={data.clients}
            presetClientId={dialog.preset?.clientId}
            onCancel={closeDialog}
            onSubmit={async (values) => {
              await upsertProject({ ...values, id: editingProject?.id });
              toast.success(editingProject ? "Project updated" : "Project added");
              closeDialog();
            }}
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={dialog.kind === "payment"}
        onOpenChange={(open) => !open && closeDialog()}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingPayment ? "Edit payment" : "Add payment"}
            </DialogTitle>
            <DialogDescription>
              Log invoices and keep paid, pending, and overdue amounts accurate.
            </DialogDescription>
          </DialogHeader>
          <PaymentForm
            key={dialog.id ?? "new-payment"}
            payment={editingPayment}
            clients={data.clients}
            projects={data.projects}
            preset={{
              clientId: dialog.preset?.clientId,
              projectId: dialog.preset?.projectId,
            }}
            onCancel={closeDialog}
            onSubmit={async (values) => {
              await upsertPayment({ ...values, id: editingPayment?.id });
              toast.success(editingPayment ? "Payment updated" : "Payment added");
              closeDialog();
            }}
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={dialog.kind === "event"}
        onOpenChange={(open) => !open && closeDialog()}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingEvent ? "Edit event" : "Add event"}</DialogTitle>
            <DialogDescription>
              Color-coded deadlines, meetings, shoots, and payment dates.
            </DialogDescription>
          </DialogHeader>
          <EventForm
            key={dialog.id ?? "new-event"}
            event={editingEvent}
            clients={data.clients}
            projects={data.projects}
            presetDate={dialog.preset?.date}
            onCancel={closeDialog}
            onSubmit={async (values) => {
              await upsertEvent({ ...values, id: editingEvent?.id });
              toast.success(editingEvent ? "Event updated" : "Event added");
              closeDialog();
            }}
          />
        </DialogContent>
      </Dialog>

      <Sheet
        open={dialog.kind === "clientDetail"}
        onOpenChange={(open) => !open && closeDialog()}
      >
        <SheetContent className="w-full sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Client</SheetTitle>
          </SheetHeader>
          <ScrollArea className="h-[calc(100vh-5rem)] px-4 pb-8">
            {editingClient ? (
              <ClientDetail
                client={editingClient}
                projects={data.projects}
                payments={data.payments}
                onEdit={() => openDialog("client", editingClient.id)}
                onAddProject={() =>
                  openDialog("project", null, { clientId: editingClient.id })
                }
                onAddPayment={() =>
                  openDialog("payment", null, { clientId: editingClient.id })
                }
              />
            ) : null}
          </ScrollArea>
        </SheetContent>
      </Sheet>

      <Dialog
        open={dialog.kind === "projectDetail"}
        onOpenChange={(open) => !open && closeDialog()}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Project</DialogTitle>
            <DialogDescription>Checklist, notes, and financials.</DialogDescription>
          </DialogHeader>
          {editingProject ? (
            <ProjectDetail
              project={editingProject}
              client={data.clients.find((c) => c.id === editingProject.clientId)}
              payments={data.payments}
              onEdit={() => openDialog("project", editingProject.id)}
              onToggleItem={(itemId, done) => {
                void upsertProject({
                  ...editingProject,
                  checklist: editingProject.checklist.map((item) =>
                    item.id === itemId ? { ...item, done } : item
                  ),
                });
              }}
            />
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog
        open={dialog.kind === "paymentDetail"}
        onOpenChange={(open) => !open && closeDialog()}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Invoice</DialogTitle>
            <DialogDescription>Payment detail in invoice form.</DialogDescription>
          </DialogHeader>
          {editingPayment ? (
            <InvoiceModal
              payment={editingPayment}
              client={data.clients.find((c) => c.id === editingPayment.clientId)}
              project={data.projects.find((p) => p.id === editingPayment.projectId)}
              studioName={data.settings.studioName}
              studioAddress={data.settings.address}
              studioEmail={data.settings.email}
              onEdit={() => openDialog("payment", editingPayment.id)}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
