import { importLeads } from '@/app/actions/leads';
import { PageHeader } from '@/components/page-header';
import { ImportWizard } from './ImportWizard';

export const metadata = { title: 'Import' };

export default function ImportPage() {
  return (
    <div className="mx-auto max-w-4xl animate-fade-in space-y-6">
      <PageHeader
        title="Import leads"
        description="Upload a CSV from Sales Navigator or your CRM. Re-importing the same people updates them instead of creating duplicates."
      />
      <ImportWizard onImport={importLeads} />
    </div>
  );
}
