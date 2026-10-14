'use client';

import Link from 'next/link';
import { useMemo, useRef, useState, useTransition } from 'react';
import Papa from 'papaparse';
import { AlertCircle, ArrowRight, Check, CheckCircle2, FileSpreadsheet, Loader2, UploadCloud, X } from 'lucide-react';
import { toast } from 'sonner';
import {
  FIELD_LABELS,
  IMPORT_FIELDS,
  MAX_IMPORT_ROWS,
  buildLeads,
  detectMapping,
  type ColumnMapping,
  type ImportField,
} from '@/lib/import';
import type { ActionResult, ImportSummary } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { NativeSelect } from '@/components/ui/native-select';
import { Alert } from '@/components/ui/misc';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

type Props = {
  onImport: (
    fileName: string,
    rows: Record<string, string>[],
    mapping: ColumnMapping
  ) => Promise<ActionResult<ImportSummary>>;
};

const STEPS = ['Upload', 'Map columns', 'Review'];

export function ImportWizard({ onImport }: Props) {
  const [fileName, setFileName] = useState('');
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [mapping, setMapping] = useState<ColumnMapping>({});
  const [parseError, setParseError] = useState<string | null>(null);
  const [result, setResult] = useState<ActionResult<ImportSummary> | null>(null);
  const [dragging, setDragging] = useState(false);
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  const preview = useMemo(() => buildLeads(rows, mapping), [rows, mapping]);
  const hasRows = rows.length > 0;
  const step = result?.ok ? 3 : hasRows ? 2 : 0;

  async function handleFile(file: File) {
    setResult(null);
    setParseError(null);

    if (!/\.csv$/i.test(file.name) && file.type !== 'text/csv') {
      setParseError('Please choose a .csv file. In Excel: File → Save As → CSV UTF-8.');
      return;
    }

    const text = (await file.text()).replace(/^﻿/, '');
    const parsed = Papa.parse<Record<string, string>>(text, { header: true, skipEmptyLines: 'greedy' });

    const fields = parsed.meta.fields ?? [];
    if (!fields.length) {
      setParseError('No header row found. The first line must contain column names.');
      return;
    }
    if (parsed.data.length > MAX_IMPORT_ROWS) {
      setParseError(`This file has ${parsed.data.length} rows. Split it into files of ${MAX_IMPORT_ROWS} rows or fewer.`);
      return;
    }

    setFileName(file.name);
    setHeaders(fields);
    setRows(parsed.data);
    setMapping(detectMapping(fields));
  }

  function reset() {
    setRows([]);
    setHeaders([]);
    setFileName('');
    if (inputRef.current) inputRef.current.value = '';
  }

  function runImport() {
    startTransition(async () => {
      const res = await onImport(fileName, rows, mapping);
      setResult(res);
      if (res.ok) {
        toast.success(`Imported ${res.created + res.updated} leads`);
        reset();
      } else {
        toast.error(res.error);
      }
    });
  }

  const mappedCount = IMPORT_FIELDS.filter((f) => mapping[f]).length;

  return (
    <div className="space-y-6">
      <ol className="flex items-center gap-2 text-sm">
        {STEPS.map((label, i) => {
          const done = step > i || (step === 2 && i === 1);
          const current = (step === 0 && i === 0) || (step === 2 && i === 2);
          return (
            <li key={label} className="flex items-center gap-2">
              <span
                className={cn(
                  'grid size-6 place-items-center rounded-full border text-xs font-medium transition-colors',
                  done && 'border-brand bg-brand text-brand-foreground',
                  current && 'border-foreground text-foreground',
                  !done && !current && 'text-muted-foreground'
                )}
              >
                {done ? <Check className="size-3.5" /> : i + 1}
              </span>
              <span className={cn(current || done ? 'text-foreground' : 'text-muted-foreground', 'hidden sm:inline')}>{label}</span>
              {i < STEPS.length - 1 && <span className="mx-1 h-px w-6 bg-border sm:w-10" />}
            </li>
          );
        })}
      </ol>

      {result?.ok && (
        <Alert variant="success" className="animate-fade-in">
          <CheckCircle2 />
          <div className="flex-1 space-y-1">
            <p className="font-medium">Import complete</p>
            <p>
              {result.created} created · {result.updated} updated · {result.skipped} skipped
              {result.duplicatesInFile > 0 && ` · ${result.duplicatesInFile} duplicates merged`}
            </p>
            {result.errors.length > 0 && (
              <ul className="list-disc pl-5 text-xs opacity-80">
                {result.errors.map((e) => (
                  <li key={e.row}>Row {e.row}: {e.reason}</li>
                ))}
              </ul>
            )}
          </div>
          <Button size="sm" asChild>
            <Link href="/leads">View leads <ArrowRight /></Link>
          </Button>
        </Alert>
      )}
      {result && !result.ok && (
        <Alert variant="destructive">
          <AlertCircle />
          <span>{result.error}</span>
        </Alert>
      )}

      {!hasRows ? (
        <Card
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            const file = e.dataTransfer.files?.[0];
            if (file) void handleFile(file);
          }}
          className={cn(
            'border-2 border-dashed shadow-none transition-colors',
            dragging ? 'border-brand bg-brand/5' : 'hover:border-muted-foreground/40'
          )}
        >
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex w-full flex-col items-center gap-3 px-6 py-16 text-center focus-visible:outline-none"
          >
            <span className={cn('grid size-12 place-items-center rounded-xl border bg-muted/50 transition-transform', dragging && 'scale-110')}>
              <UploadCloud className="size-6 text-muted-foreground" />
            </span>
            <span className="space-y-1">
              <span className="block font-medium">Drop your CSV here, or click to browse</span>
              <span className="block text-sm text-muted-foreground">
                Up to {MAX_IMPORT_ROWS.toLocaleString()} rows. Excel users: Save As → CSV UTF-8.
              </span>
            </span>
          </button>
          <input
            ref={inputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleFile(file);
            }}
          />
          {parseError && (
            <div className="px-6 pb-6">
              <Alert variant="destructive">
                <AlertCircle />
                <span>{parseError}</span>
              </Alert>
            </div>
          )}
        </Card>
      ) : (
        <>
          <Card className="animate-fade-in">
            <CardContent className="flex items-center gap-3 p-4">
              <span className="grid size-10 place-items-center rounded-lg border bg-muted/50">
                <FileSpreadsheet className="size-5 text-muted-foreground" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{fileName}</p>
                <p className="text-xs text-muted-foreground">
                  {rows.length} rows · {headers.length} columns · {mappedCount} fields mapped
                </p>
              </div>
              <Button variant="ghost" size="icon-sm" onClick={reset} disabled={pending} aria-label="Remove file">
                <X />
              </Button>
            </CardContent>
          </Card>

          <Card className="animate-fade-in">
            <CardHeader>
              <CardTitle className="text-base">Map columns</CardTitle>
              <CardDescription>We matched columns automatically. Fix any that look wrong; leave the rest on &ldquo;Ignore&rdquo;.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
              {IMPORT_FIELDS.map((field: ImportField) => (
                <div key={field} className="space-y-2">
                  <Label htmlFor={`map-${field}`} className="flex items-center gap-1.5">
                    {FIELD_LABELS[field]}
                    {mapping[field] && <Check className="size-3.5 text-emerald-500" />}
                  </Label>
                  <NativeSelect
                    id={`map-${field}`}
                    value={mapping[field] ?? ''}
                    onChange={(e) => setMapping((m) => ({ ...m, [field]: e.target.value || undefined }))}
                    className={cn(!mapping[field] && 'text-muted-foreground')}
                  >
                    <option value="">Ignore</option>
                    {headers.map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </NativeSelect>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="animate-fade-in">
            <CardHeader>
              <CardTitle className="text-base">Review</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { label: 'Rows in file', value: rows.length, cls: '' },
                  { label: 'Valid leads', value: preview.leads.length, cls: 'text-emerald-600 dark:text-emerald-400' },
                  { label: 'Will be skipped', value: preview.errors.length, cls: preview.errors.length ? 'text-amber-600' : '' },
                  { label: 'Duplicates merged', value: preview.duplicatesInFile, cls: '' },
                ].map((s) => (
                  <div key={s.label} className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                    <p className={cn('mt-1 text-xl font-semibold tabular-nums', s.cls)}>{s.value}</p>
                  </div>
                ))}
              </div>

              {preview.leads.length > 0 && (
                <div className="overflow-hidden rounded-lg border">
                  <Table className="text-xs">
                    <TableHeader className="bg-muted/40">
                      <TableRow className="hover:bg-transparent">
                        <TableHead>Name</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead>Company</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>LinkedIn</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {preview.leads.slice(0, 5).map((l) => (
                        <TableRow key={l.dedupe_key}>
                          <TableCell className="py-2 font-medium">{l.full_name ?? '—'}</TableCell>
                          <TableCell className="py-2">{l.title ?? '—'}</TableCell>
                          <TableCell className="py-2">{l.company ?? '—'}</TableCell>
                          <TableCell className="py-2">{l.email ?? '—'}</TableCell>
                          <TableCell className="max-w-[12rem] truncate py-2">{l.linkedin_url ?? '—'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {preview.leads.length > 5 && (
                    <p className="border-t px-4 py-2 text-xs text-muted-foreground">Showing 5 of {preview.leads.length} leads</p>
                  )}
                </div>
              )}

              {preview.errors.length > 0 && (
                <details className="rounded-lg border px-4 py-3 text-sm">
                  <summary className="cursor-pointer font-medium">Why rows are skipped ({preview.errors.length})</summary>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
                    {preview.errors.slice(0, 20).map((e) => (
                      <li key={e.row}>Row {e.row}: {e.reason}</li>
                    ))}
                  </ul>
                </details>
              )}

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={reset} disabled={pending}>Cancel</Button>
                <Button onClick={runImport} disabled={pending || preview.leads.length === 0}>
                  {pending ? <Loader2 className="animate-spin" /> : <UploadCloud />}
                  {pending ? 'Importing…' : `Import ${preview.leads.length} leads`}
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
