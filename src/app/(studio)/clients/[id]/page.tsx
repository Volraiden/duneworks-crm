"use client";

import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { PageTransition } from "@/components/page-chrome";
import { CompanyDetail } from "@/components/clients/company-detail";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";
import { useCrm } from "@/context/crm-context";

export default function ClientPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { data, openDialog, deleteClient, addNote } = useCrm();
  const { allow } = useAuth();
  const client = data.clients.find((item) => item.id === params.id);

  if (!client) {
    return (
      <PageTransition>
        <p className="text-muted-foreground">Client not found.</p>
        <Button className="mt-4" variant="outline" onClick={() => router.push("/clients")}>
          Back to clients
        </Button>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="mb-6">
        <Button variant="ghost" onClick={() => router.push("/clients")}>
          <ArrowLeft />
          Clients
        </Button>
      </div>
      <div className="glass-panel rounded-3xl p-6 sm:p-8">
        <CompanyDetail
          client={client}
          stage={data.stages.find((stage) => stage.id === client.stageId)}
          team={data.team}
          notes={data.notes}
          activities={data.activities}
          projects={data.projects}
          payments={data.payments}
          canEdit={allow("editRecords")}
          canDelete={allow("deleteRecords")}
          canNote={allow("addNotes")}
          canPay={allow("managePayments")}
          onEdit={() => openDialog("client", client.id)}
          onDelete={async () => {
            await deleteClient(client.id);
            toast.success("Company removed");
            router.push("/clients");
          }}
          onAddProject={() => openDialog("project", null, { clientId: client.id })}
          onAddPayment={() => openDialog("payment", null, { clientId: client.id })}
          onAddNote={(body) => addNote(client.id, body)}
        />
      </div>
    </PageTransition>
  );
}
