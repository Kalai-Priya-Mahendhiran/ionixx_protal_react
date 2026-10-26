import { Control, UseFormWatch } from "react-hook-form";
import type { ProfileFormData } from "@/lib/schemas";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { 
  DisplayField, 
  DisplayGrid, 
  SectionHeader, 
  SubSection 
} from "./profile-display";
import { CreditCard, Lock, Shield, Building2 } from "lucide-react";

interface BankSectionProps {
  isEditing: boolean;
  control: Control<ProfileFormData>;
  watch: UseFormWatch<ProfileFormData>;
}

export function BankSection({ isEditing, control, watch }: BankSectionProps) {
  const formData = watch();

  if (!isEditing) {
    // VIEW MODE
    return (
      <Card className="border-0 shadow-xl bg-white/80 backdrop-blur overflow-hidden">
        <CardContent className="p-8">
          <SectionHeader 
            title="Bank Details" 
            icon={<CreditCard className="w-5 h-5" />}
            subtitle="Financial information for payroll processing"
          />
          
          {/* Security Notice */}
          <div className="mb-6 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <Shield className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-emerald-800">Sensitive Information Protected</p>
                <p className="text-xs text-emerald-600">Bank details are encrypted and accessible only to authorized personnel.</p>
              </div>
            </div>
          </div>
          
          <DisplayGrid columns={3}>
            <DisplayField 
              label="Account Number" 
              value={formData.accountNumber} 
              icon={<Lock className="w-4 h-4" />}
            />
            <DisplayField 
              label="Bank Name" 
              value={formData.bankName} 
              icon={<Building2 className="w-4 h-4" />}
            />
            <DisplayField label="Account Type" value={formData.accountType} />
            <DisplayField label="IFSC Code" value={formData.ifscCode} />
            <DisplayField label="Branch Name" value={formData.branchName} />
            <DisplayField label="SWIFT Code" value={formData.swiftCode} />
          </DisplayGrid>
        </CardContent>
      </Card>
    );
  }

  // EDIT MODE
  return (
    <Card className="border-0 shadow-xl bg-white/80 backdrop-blur overflow-hidden ring-2 ring-indigo-500/20">
      <CardContent className="p-8">
        <SectionHeader 
          title="Bank Details" 
          icon={<CreditCard className="w-5 h-5" />}
          subtitle="Update your financial information for payroll"
        />
        
        {/* Security Notice */}
        <div className="mb-6 p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Lock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-amber-800">Sensitive Information</p>
              <p className="text-xs text-amber-600">Please ensure your bank details are accurate. This information is encrypted and stored securely.</p>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <FormField
            control={control}
            name="accountNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-slate-700">Account Number <span className="text-red-500">*</span></FormLabel>
                <FormControl>
                  <Input 
                    {...field} 
                    type="text"
                    placeholder="Enter account number" 
                    className="bg-white border-slate-200 focus:border-indigo-500 focus:ring-indigo-500 font-mono" 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="bankName"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-slate-700">Bank Name <span className="text-red-500">*</span></FormLabel>
                <FormControl>
                  <Input {...field} placeholder="e.g., State Bank of India" className="bg-white border-slate-200 focus:border-indigo-500 focus:ring-indigo-500" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="accountType"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-slate-700">Account Type <span className="text-red-500">*</span></FormLabel>
                <FormControl>
                  <select {...field} className="w-full h-10 px-3 py-2 bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                    <option value="">Select Account Type</option>
                    <option value="Savings">Savings</option>
                    <option value="Current">Current</option>
                    <option value="Salary">Salary</option>
                    <option value="Fixed Deposit">Fixed Deposit</option>
                    <option value="Recurring Deposit">Recurring Deposit</option>
                  </select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="ifscCode"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-slate-700">IFSC Code
                  <span className="text-red-500">*</span>
                  <span className="text-xs text-slate-400">(11-character bank branch code)</span>
                  </FormLabel>
                <FormControl>
                  <Input {...field} placeholder="e.g., SBIN0001234" className="bg-white border-slate-200 focus:border-indigo-500 focus:ring-indigo-500 font-mono uppercase" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="branchName"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-slate-700">Branch Name <span className="text-red-500">*</span></FormLabel>
                <FormControl>
                  <Input {...field} placeholder="e.g., Main Branch, City" className="bg-white border-slate-200 focus:border-indigo-500 focus:ring-indigo-500" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="swiftCode"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-slate-700">SWIFT Code
                  <span className="text-xs text-slate-400">(for international transfers)</span>
                </FormLabel>
                <FormControl>
                  <Input {...field} placeholder="e.g., SBININBB123" className="bg-white border-slate-200 focus:border-indigo-500 focus:ring-indigo-500 font-mono uppercase" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </CardContent>
    </Card>
  );
}
