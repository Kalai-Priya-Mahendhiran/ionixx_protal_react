import {
  Sliders,
  Save,
  RotateCcw,
  Mail,
  Globe,
  Building2,
  Clock,
  CheckCircle2,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TIMEZONES, WEEK_DAYS, MONTHS } from "@/lib/constants";
import type { DefaultsState } from "./system-config-meta";

export function DefaultsSection({
  defaults,
  defaultsDraft,
  setDefaultsDraft,
  defaultsDirty,
  onReset,
  onSave,
}: {
  defaults: DefaultsState;
  defaultsDraft: DefaultsState;
  setDefaultsDraft: (draft: DefaultsState) => void;
  defaultsDirty: boolean;
  onReset: () => void;
  onSave: () => void;
}) {
  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Sliders className="h-5 w-5 text-[#464EB8]" />
              System defaults
            </CardTitle>
            <CardDescription>
              Organization-wide settings applied across the portal.
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={onReset}
              disabled={!defaultsDirty}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
            <Button
              onClick={onSave}
              disabled={!defaultsDirty}
              className="bg-[#464EB8] hover:bg-[#3a3f9a]"
            >
              <Save className="h-4 w-4 mr-2" />
              Save changes
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <FieldGroup title="Organization" icon={<Building2 className="h-4 w-4" />}>
            <Field label="Organization name">
              <input
                value={defaultsDraft.organizationName}
                onChange={(e) =>
                  setDefaultsDraft({
                    ...defaultsDraft,
                    organizationName: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#464EB8]/30"
              />
            </Field>
            <Field label="Primary domain">
              <input
                value={defaultsDraft.primaryDomain}
                onChange={(e) =>
                  setDefaultsDraft({
                    ...defaultsDraft,
                    primaryDomain: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#464EB8]/30"
              />
            </Field>
            <Field label="Support email">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="email"
                  value={defaultsDraft.supportEmail}
                  onChange={(e) =>
                    setDefaultsDraft({
                      ...defaultsDraft,
                      supportEmail: e.target.value,
                    })
                  }
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#464EB8]/30"
                />
              </div>
            </Field>
          </FieldGroup>

          <FieldGroup title="Locale & calendar" icon={<Globe className="h-4 w-4" />}>
            <Field label="Default timezone">
              <select
                value={defaultsDraft.defaultTimezone}
                onChange={(e) =>
                  setDefaultsDraft({
                    ...defaultsDraft,
                    defaultTimezone: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#464EB8]/30"
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Work week starts">
              <select
                value={defaultsDraft.workWeekStart}
                onChange={(e) =>
                  setDefaultsDraft({
                    ...defaultsDraft,
                    workWeekStart: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#464EB8]/30"
              >
                {WEEK_DAYS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Fiscal year starts">
              <select
                value={defaultsDraft.fiscalYearStart}
                onChange={(e) =>
                  setDefaultsDraft({
                    ...defaultsDraft,
                    fiscalYearStart: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#464EB8]/30"
              >
                {MONTHS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </Field>
          </FieldGroup>

          <FieldGroup title="Security" icon={<Clock className="h-4 w-4" />}>
            <Field label="Session timeout (minutes)">
              <input
                type="number"
                min={5}
                max={480}
                value={defaultsDraft.sessionTimeout}
                onChange={(e) =>
                  setDefaultsDraft({
                    ...defaultsDraft,
                    sessionTimeout: Number(e.target.value),
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#464EB8]/30"
              />
            </Field>
            <Field label="Password expiry (days)">
              <input
                type="number"
                min={0}
                max={365}
                value={defaultsDraft.passwordExpiry}
                onChange={(e) =>
                  setDefaultsDraft({
                    ...defaultsDraft,
                    passwordExpiry: Number(e.target.value),
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#464EB8]/30"
              />
              <p className="text-[11px] text-gray-500 mt-1">
                Set to 0 to disable expiry.
              </p>
            </Field>
          </FieldGroup>

          <FieldGroup title="Status" icon={<CheckCircle2 className="h-4 w-4" />}>
            <div className="space-y-2 text-sm">
              <p className="text-gray-700">
                <span className="text-gray-500">Org:</span>{" "}
                <span className="font-medium">{defaults.organizationName}</span>
              </p>
              <p className="text-gray-700">
                <span className="text-gray-500">Domain:</span>{" "}
                <span className="font-medium">{defaults.primaryDomain}</span>
              </p>
              <p className="text-gray-700">
                <span className="text-gray-500">Timezone:</span>{" "}
                <span className="font-medium">{defaults.defaultTimezone}</span>
              </p>
              <p className="text-gray-700">
                <span className="text-gray-500">Session timeout:</span>{" "}
                <span className="font-medium">{defaults.sessionTimeout} min</span>
              </p>
              {defaultsDirty && (
                <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2 mt-2">
                  You have unsaved changes.
                </p>
              )}
            </div>
          </FieldGroup>
        </div>
      </CardContent>
    </Card>
  );
}

function FieldGroup({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="border border-gray-200 rounded-lg p-4 space-y-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
        <span className="text-[#464EB8]">{icon}</span>
        {title}
      </div>
      {children}
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-gray-600 mb-1 block">{label}</span>
      {children}
    </label>
  );
}
