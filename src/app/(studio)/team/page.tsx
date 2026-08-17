"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, PageTransition } from "@/components/page-chrome";
import { UserForm } from "@/components/forms/user-form";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { deleteUser } from "@/app/actions/users";
import { useAuth } from "@/context/auth-context";
import { useCrm } from "@/context/crm-context";
import type { TeamMember } from "@/lib/types";

export default function TeamPage() {
  const { data, refresh } = useCrm();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<TeamMember | null>(null);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  return (
    <PageTransition>
      <PageHeader
        eyebrow="Access"
        title="Team & Permissions"
        description="Create studio users and assign Admin, Manager, Editor, or Viewer access."
        actions={
          <Button
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
          >
            <Plus />
            Add user
          </Button>
        }
      />
      <div className="glass-panel rounded-2xl">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.team.map((member) => (
              <TableRow key={member.id}>
                <TableCell className="font-medium">{member.name}</TableCell>
                <TableCell>{member.email}</TableCell>
                <TableCell>
                  <Badge variant="outline">{member.role}</Badge>
                </TableCell>
                <TableCell>{member.active ? "Active" : "Deactivated"}</TableCell>
                <TableCell className="text-right">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditing(member);
                      setOpen(true);
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    className="ml-1"
                    onClick={() => setPendingDelete(member.id)}
                  >
                    <Trash2 />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <UserDialog
        open={open}
        member={editing}
        actor={{ id: user?.id ?? "", name: user?.name ?? "Studio" }}
        onOpenChange={setOpen}
        onSaved={async () => {
          setOpen(false);
          await refresh();
        }}
      />
      <AlertDialog open={Boolean(pendingDelete)} onOpenChange={(value) => !value && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this user?</AlertDialogTitle>
            <AlertDialogDescription>
              They will lose access immediately. Assigned companies stay in the pipeline.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={async () => {
                if (!pendingDelete) return;
                const result = await deleteUser(pendingDelete);
                if (!result.ok) toast.error(result.error);
                else {
                  toast.success("User removed");
                  await refresh();
                }
                setPendingDelete(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageTransition>
  );
}

function UserDialog({
  open,
  member,
  actor,
  onOpenChange,
  onSaved,
}: {
  open: boolean;
  member: TeamMember | null;
  actor: { id: string; name: string };
  onOpenChange: (open: boolean) => void;
  onSaved: () => Promise<void>;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{member ? "Edit user" : "Add user"}</DialogTitle>
          <DialogDescription>
            Roles control pipeline, finance, settings, and who can delete records.
          </DialogDescription>
        </DialogHeader>
        <UserForm
          key={member?.id ?? "new-user"}
          member={member}
          actor={actor}
          onCancel={() => onOpenChange(false)}
          onSaved={onSaved}
        />
      </DialogContent>
    </Dialog>
  );
}
