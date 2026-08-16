"use client";

import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Trash2 } from "lucide-react";
import { PageTransition } from "@/components/page-chrome";
import { ClientDetail } from "@/components/clients/client-detail";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useCrm } from "@/context/crm-context";

export default function ClientPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { data, openDialog, deleteClient } = useCrm();
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
      <div className="mb-6 flex items-center justify-between">
        <Button variant="ghost" onClick={() => router.push("/clients")}>
          <ArrowLeft />
          Clients
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive">
              <Trash2 />
              Delete
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this client?</AlertDialogTitle>
              <AlertDialogDescription>
                Projects and payments linked to {client.company} will also be removed.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                variant="destructive"
                onClick={() => {
                  deleteClient(client.id);
                  toast.success("Client removed");
                  router.push("/clients");
                }}
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
      <div className="glass-panel rounded-3xl p-6 sm:p-8">
        <ClientDetail
          client={client}
          projects={data.projects}
          payments={data.payments}
          showFullPageLink={false}
          onEdit={() => openDialog("client", client.id)}
          onAddProject={() => openDialog("project", null, { clientId: client.id })}
          onAddPayment={() => openDialog("payment", null, { clientId: client.id })}
        />
      </div>
    </PageTransition>
  );
}
