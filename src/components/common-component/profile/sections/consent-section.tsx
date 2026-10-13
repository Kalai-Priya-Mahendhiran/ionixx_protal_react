import { Control, UseFormWatch } from "react-hook-form";
import type { ProfileFormData } from "@/lib/schemas";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { 
  SectionHeader 
} from "../profile-display";
import { CheckCircle, FileCheck, Shield, Pen, Save, Loader2 } from "lucide-react";

interface ConsentSectionProps {
  isEditing: boolean;
  control: Control<ProfileFormData>;
  watch: UseFormWatch<ProfileFormData>;
  isSubmitting: boolean;
}

export function ConsentSection({ isEditing, control, watch, isSubmitting }: ConsentSectionProps) {
  const formData = watch();

  if (!isEditing) {
    // VIEW MODE
    return (
      <Card className="border-0 shadow-xl bg-white/80 backdrop-blur overflow-hidden">
        <CardContent className="p-8">
          <SectionHeader 
            title="Consent & Declarations" 
            icon={<FileCheck className="w-5 h-5" />}
            subtitle="Review your consent status"
          />
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <Shield className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <p className="font-medium text-slate-800">Data Processing Consent</p>
                  <p className="text-sm text-slate-500">Storage and processing of personal data for employment purposes</p>
                </div>
              </div>
              <Badge className={formData.dataProcessingConsent ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}>
                {formData.dataProcessingConsent ? "✓ Consented" : "Pending"}
              </Badge>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-violet-100 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-violet-600" />
                </div>
                <div>
                  <p className="font-medium text-slate-800">Background Check Consent</p>
                  <p className="text-sm text-slate-500">Authorization for background verification checks</p>
                </div>
              </div>
              <Badge className={formData.backgroundCheckConsent ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}>
                {formData.backgroundCheckConsent ? "✓ Consented" : "Pending"}
              </Badge>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FileCheck className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-slate-800">Data Privacy Policy</p>
                  <p className="text-sm text-slate-500">Agreement to the company's data privacy policy</p>
                </div>
              </div>
              <Badge className={formData.dataPrivacyConsent ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}>
                {formData.dataPrivacyConsent ? "✓ Agreed" : "Pending"}
              </Badge>
            </div>

            {formData.esignature && (
              <div className="mt-6 p-4 bg-gradient-to-r from-indigo-50 to-violet-50 rounded-xl border border-indigo-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-100 rounded-lg">
                    <Pen className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">E-Signature</p>
                    <p className="text-lg font-medium text-slate-800 font-signature italic">{formData.esignature}</p>
                  </div>
                </div>
                {formData.consentDate && (
                  <p className="text-xs text-slate-400 mt-2 ml-12">
                    Signed on {new Date(formData.consentDate).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // EDIT MODE
  return (
    <Card className="border-0 shadow-xl bg-white/80 backdrop-blur overflow-hidden ring-2 ring-indigo-500/20">
      <CardContent className="p-8">
        <SectionHeader 
          title="Consent & Declarations" 
          icon={<FileCheck className="w-5 h-5" />}
          subtitle="Review and provide your consent"
        />
        
        <div className="space-y-4">
          {/* Data Processing Consent */}
          <FormField
            control={control}
            name="dataProcessingConsent"
            render={({ field }) => (
              <FormItem className="flex items-start gap-4 p-4 bg-indigo-50/50 rounded-xl border border-indigo-100 hover:border-indigo-300 transition-colors">
                <FormControl>
                  <input
                    type="checkbox"
                    checked={field.value}
                    onChange={field.onChange}
                    className="w-5 h-5 mt-1 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                </FormControl>
                <div className="flex-1">
                  <FormLabel className="text-slate-800 font-medium cursor-pointer">
                    Data Processing Consent <span className="text-red-500">*</span>
                  </FormLabel>
                  <p className="text-sm text-slate-600 mt-1">
                    I consent to the storage and processing of my personal data for employment purposes. 
                    I understand that my data will be handled in accordance with applicable data protection regulations.
                  </p>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Background Check Consent */}
          <FormField
            control={control}
            name="backgroundCheckConsent"
            render={({ field }) => (
              <FormItem className="flex items-start gap-4 p-4 bg-violet-50/50 rounded-xl border border-violet-100 hover:border-violet-300 transition-colors">
                <FormControl>
                  <input
                    type="checkbox"
                    checked={field.value}
                    onChange={field.onChange}
                    className="w-5 h-5 mt-1 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                  />
                </FormControl>
                <div className="flex-1">
                  <FormLabel className="text-slate-800 font-medium cursor-pointer">
                    Background Check Consent <span className="text-red-500">*</span>
                  </FormLabel>
                  <p className="text-sm text-slate-600 mt-1">
                    I authorize the company to conduct background verification checks as required by company policy. 
                    This may include verification of educational qualifications, employment history, and reference checks.
                  </p>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Data Privacy Consent */}
          <FormField
            control={control}
            name="dataPrivacyConsent"
            render={({ field }) => (
              <FormItem className="flex items-start gap-4 p-4 bg-blue-50/50 rounded-xl border border-blue-100 hover:border-blue-300 transition-colors">
                <FormControl>
                  <input
                    type="checkbox"
                    checked={field.value}
                    onChange={field.onChange}
                    className="w-5 h-5 mt-1 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                </FormControl>
                <div className="flex-1">
                  <FormLabel className="text-slate-800 font-medium cursor-pointer">
                    Data Privacy Policy Agreement <span className="text-red-500">*</span>
                  </FormLabel>
                  <p className="text-sm text-slate-600 mt-1">
                    I have read and agree to the company's{" "}
                    <a href="#" className="text-blue-600 hover:underline">Data Privacy Policy</a>. 
                    I understand how my personal information will be collected, used, and protected.
                  </p>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* E-Signature */}
          <div className="mt-8 p-6 bg-gradient-to-r from-slate-50 to-indigo-50/50 rounded-xl border border-slate-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <Pen className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h4 className="font-semibold text-slate-800">Electronic Signature</h4>
                <p className="text-sm text-slate-500">Type your full legal name as your electronic signature</p>
              </div>
            </div>
            <FormField
              control={control}
              name="esignature"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-700">Full Legal Name <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      placeholder="Type your full name here"
                      className="bg-white border-slate-200 focus:border-indigo-500 focus:ring-indigo-500 text-lg font-medium italic" 
                    />
                  </FormControl>
                  <p className="text-xs text-slate-400 mt-2">
                    By typing your name above, you acknowledge that this constitutes a legally binding electronic signature.
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="consentDate"
              render={({ field }) => (
                <FormItem className="mt-4">
                  <FormLabel className="text-slate-700">Date</FormLabel>
                  <FormControl>
                    <Input 
                      type="datetime-local"
                      {...field} 
                      className="bg-white border-slate-200 focus:border-indigo-500 focus:ring-indigo-500 max-w-xs" 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Submit Button */}
          <div className="mt-8 flex justify-end">
            <Button
              type="submit"
              disabled={isSubmitting || !formData.dataProcessingConsent || !formData.backgroundCheckConsent || !formData.dataPrivacyConsent || !formData.esignature}
              className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white px-8 py-3 text-lg shadow-lg shadow-indigo-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Saving Profile...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5 mr-2" />
                  Save & Submit Profile
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

