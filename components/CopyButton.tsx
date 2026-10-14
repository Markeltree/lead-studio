'use client';

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

export function CopyButton({ text, label = 'Copy' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success('Copied to clipboard');
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error('Could not copy. Select the text and copy it manually.');
    }
  }

  return (
    <Button type="button" variant="outline" size="sm" onClick={copy} className="h-7 gap-1.5 px-2.5">
      {copied ? <Check className="text-emerald-500" /> : <Copy />}
      {copied ? 'Copied' : label}
    </Button>
  );
}
