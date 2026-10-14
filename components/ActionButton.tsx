'use client';

import { useTransition, type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { ActionResult } from '@/lib/types';
import { Button, type ButtonProps } from '@/components/ui/button';

type Props = {
  action: () => Promise<ActionResult>;
  label: string;
  pendingLabel: string;
  successMessage?: string;
  icon?: ReactNode;
  variant?: ButtonProps['variant'];
  size?: ButtonProps['size'];
  className?: string;
};

/** Runs a server action on click, with a spinner and a toast for the result. */
export function ActionButton({
  action,
  label,
  pendingLabel,
  successMessage = 'Done',
  icon,
  variant = 'default',
  size,
  className,
}: Props) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={className}
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const id = toast.loading(pendingLabel);
          const result = await action();
          if (result.ok) toast.success(successMessage, { id });
          else toast.error(result.error, { id, duration: 8000 });
        })
      }
    >
      {pending ? <Loader2 className="animate-spin" /> : icon}
      {pending ? pendingLabel : label}
    </Button>
  );
}
