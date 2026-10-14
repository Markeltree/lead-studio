'use client';

import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { deleteLead, updateLeadStatus } from '@/app/actions/leads';
import { LEAD_STATUSES, STATUS_LABELS, type LeadStatus } from '@/lib/types';
import { SubmitButton } from '@/components/SubmitButton';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { NativeSelect } from '@/components/ui/native-select';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export function StatusForm({ leadId, status, notes }: { leadId: string; status: LeadStatus; notes: string | null }) {
  return (
    <form
      // Remount after a save so the fields show the saved values, not the pre-save defaults.
      key={`${status}|${notes ?? ''}`}
      action={async (fd) => {
        await updateLeadStatus(fd);
        toast.success('Lead updated');
      }}
      className="space-y-4"
    >
      <input type="hidden" name="leadId" value={leadId} />
      <div className="space-y-2">
        <Label htmlFor="status">Status</Label>
        <NativeSelect id="status" name="status" defaultValue={status}>
          {LEAD_STATUSES.map((s) => (
            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
          ))}
        </NativeSelect>
      </div>
      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" name="notes" rows={4} defaultValue={notes ?? ''} placeholder="Call notes, next steps…" />
      </div>
      <SubmitButton label="Save changes" pendingLabel="Saving…" variant="secondary" className="w-full" />
    </form>
  );
}

export function DeleteLeadButton({ leadId, name }: { leadId: string; name: string }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="sm" className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive">
          <Trash2 /> Delete lead
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {name}?</AlertDialogTitle>
          <AlertDialogDescription>
            This permanently removes the lead along with its AI analysis and outreach. This cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <form action={deleteLead}>
            <input type="hidden" name="leadId" value={leadId} />
            <SubmitButton label="Delete" pendingLabel="Deleting…" variant="destructive" className="w-full" />
          </form>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
