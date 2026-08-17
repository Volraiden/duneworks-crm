"use client";

import { toast } from "sonner";
import { CompanyForm } from "@/components/forms/company-form";
import { StageForm } from "@/components/forms/stage-form";
import { ProjectForm } from "@/components/forms/project-form";
import { PaymentForm } from "@/components/forms/payment-form";
import { EventForm } from "@/components/forms/event-form";
import { CompanyDetail } from "@/components/clients/company-detail";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/context/auth-context";
import { useCrm } from "@/context/crm-context";
import { isPaidClient } from "@/lib/types";

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
    upsertStage,
    removeStage,
    sortStages,
    addNote,
    deleteClient,
  } = useCrm();
  const { allow } = useAuth();

  const editingClient = data.clients.find((client) => client.id === dialog.id);
  const editingProject = data.projects.find((project) => project.id === dialog.id);
  const editingPayment = data.payments.find((payment) => payment.id === dialog.id);
  const editingEvent = data.events.find((event) => event.id === dialog.id);
  const paidClients = data.clients.filter((client) => isPaidClient(client, data.stages));

  return (
    <>
      <Dialog open={dialog.kind === "client"} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{editingClient ? "Edit company" : "Add company"}</DialogTitle>
            <DialogDescription>
              Log company, contact, value, and the first pipeline stage.
            </DialogDescription>
          </DialogHeader>
          <CompanyForm
            key={dialog.id ?? "new-company"}
            client={editingClient}
            stages={data.stages}
            team={data.team}
            onCancel={closeDialog}
            onSubmit={async (values) => {
              await upsertClient({ ...values, id: editingClient?.id });
              toast.success(editingClient ? "Company updated" : "Company added");
              closeDialog();
            }}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={dialog.kind === "stage"} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Pipeline categories</DialogTitle>
            <DialogDescription>
              Create, rename, color-code, reorder, or delete custom stages.
            </DialogDescription>
          </DialogHeader>
          <StageForm
            stages={data.stages}
            onCancel={closeDialog}
            onSave={async (input) => {
              await upsertStage(input);
              toast.success(input.id ? "Category updated" : "Category created");
            }}
            onReorder={sortStages}
            onDelete={async (id) => {
              const result = await removeStage(id);
              if (!result.ok) toast.error(result.error);
              else toast.success("Category removed");
              return result;
            }}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={dialog.kind === "project"} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{editingProject ? "Edit project" : "Add project"}</DialogTitle>
            <DialogDescription>
              Projects are available for paid clients in the pipeline.
            </DialogDescription>
          </DialogHeader>
          <ProjectForm
            key={dialog.id ?? "new-project"}
            project={editingProject}
            clients={
              editingProject
                ? data.clients.filter(
                    (client) =>
                      client.id === editingProject.clientId ||
                      paidClients.some((item) => item.id === client.id)
                  )
                : paidClients
            }
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

      <Dialog open={dialog.kind === "payment"} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingPayment ? "Edit payment" : "Add payment"}</DialogTitle>
            <DialogDescription>Invoices for paid clients and their productions.</DialogDescription>
          </DialogHeader>
          <PaymentForm
            key={dialog.id ?? "new-payment"}
            payment={editingPayment}
            clients={
              editingPayment
                ? data.clients.filter(
                    (client) =>
                      client.id === editingPayment.clientId ||
                      paidClients.some((item) => item.id === client.id)
                  )
                : paidClients
            }
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

      <Dialog open={dialog.kind === "event"} onOpenChange={(open) => !open && closeDialog()}>
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

      <Sheet open={dialog.kind === "clientDetail"} onOpenChange={(open) => !open && closeDialog()}>
        <SheetContent className="w-full sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Company</SheetTitle>
          </SheetHeader>
          <ScrollArea className="h-[calc(100vh-5rem)] px-4 pb-8">
            {editingClient ? (
              <CompanyDetail
                client={editingClient}
                stage={data.stages.find((stage) => stage.id === editingClient.stageId)}
                team={data.team}
                notes={data.notes}
                activities={data.activities}
                projects={data.projects}
                payments={data.payments}
                canEdit={allow("editRecords")}
                canDelete={allow("deleteRecords")}
                canNote={allow("addNotes")}
                canPay={allow("managePayments")}
                onEdit={() => openDialog("client", editingClient.id)}
                onDelete={async () => {
                  await deleteClient(editingClient.id);
                  toast.success("Company removed");
                  closeDialog();
                }}
                onAddProject={() =>
                  openDialog("project", null, { clientId: editingClient.id })
                }
                onAddPayment={() =>
                  openDialog("payment", null, { clientId: editingClient.id })
                }
                onAddNote={(body) => addNote(editingClient.id, body)}
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
              onEdit={
                allow("editRecords")
                  ? () => openDialog("project", editingProject.id)
                  : () => {}
              }
              onToggleItem={(itemId, done) => {
                if (!allow("editRecords")) return;
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
              onEdit={
                allow("managePayments")
                  ? () => openDialog("payment", editingPayment.id)
                  : () => {}
              }
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
