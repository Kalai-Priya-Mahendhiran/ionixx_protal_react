import { useState, type ReactNode } from 'react';
import { RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

interface SettingsPanelProps {
  title: string;
  description: ReactNode;
  // Unsaved edits: shows the save bar
  dirty: boolean;
  saving: boolean;
  onSave: () => void;
  onDiscard: () => void;
  onReset?: () => void;
  resetDescription?: string;
  children: ReactNode;
}

// Frame shared by every settings tab: heading, content, and a save bar while there are unsaved edits
export function SettingsPanel({ title, description, dirty, saving, onSave, onDiscard, onReset, resetDescription, children }: SettingsPanelProps) {
  const [confirmReset, setConfirmReset] = useState(false);
  return (
    <Card>
      <CardContent className="space-y-5 p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
            <p className="mt-1 max-w-3xl text-sm text-gray-600">{description}</p>
          </div>
          {onReset && (
            <Button variant="ghost" size="sm" onClick={() => setConfirmReset(true)} className="gap-1.5 text-gray-600">
              <RotateCcw className="h-4 w-4" />
              Reset to defaults
            </Button>
          )}
        </div>

        {children}

        {dirty && (
          <div className="sticky bottom-4 z-10 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#464EB8]/30 bg-indigo-50 px-4 py-3 shadow-lg">
            <span className="text-sm font-medium text-indigo-900">You have unsaved changes</span>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onDiscard} disabled={saving} className="bg-white">
                Discard
              </Button>
              <Button onClick={onSave} disabled={saving} className="bg-[#464EB8] text-white hover:bg-[#3a3f9a]">
                {saving ? 'Saving…' : 'Save changes'}
              </Button>
            </div>
          </div>
        )}
      </CardContent>

      {onReset && (
        <ConfirmDialog
          open={confirmReset}
          title={`Reset ${title.toLowerCase()}?`}
          description={resetDescription ?? 'This restores the built-in settings and discards your customisations.'}
          confirmLabel="Reset"
          destructive
          onConfirm={() => {
            onReset();
            setConfirmReset(false);
          }}
          onOpenChange={setConfirmReset}
        />
      )}
    </Card>
  );
}
