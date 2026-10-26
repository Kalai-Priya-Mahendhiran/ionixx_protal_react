import { Control, UseFormWatch, UseFieldArrayReturn } from "react-hook-form";
import type { ProfileFormData } from "@/lib/schemas";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { FileUpload } from "@/components/ui/file-upload";
import { Badge } from "@/components/ui/badge";
import { 
  DisplayField, 
  DisplayGrid, 
  SectionHeader, 
  SubSection,
  EntryCard,
  EmptyState
} from "./profile-display";
import { GraduationCap, Award, Plus, X, Calendar, MapPin, Building2 } from "lucide-react";
import { DatePicker } from '@/components/ui/date-picker';
import { EDUCATION_TYPE_OPTIONS, STUDY_MODE_OPTIONS } from '@/lib/constants';

interface EducationSectionProps {
  isEditing: boolean;
  control: Control<ProfileFormData>;
  watch: UseFormWatch<ProfileFormData>;
  qualificationFields: UseFieldArrayReturn<ProfileFormData, "qualifications">['fields'];
  certificationFields: UseFieldArrayReturn<ProfileFormData, "certifications">['fields'];
  appendQualification: UseFieldArrayReturn<ProfileFormData, "qualifications">['append'];
  appendCertification: UseFieldArrayReturn<ProfileFormData, "certifications">['append'];
  removeQualification: UseFieldArrayReturn<ProfileFormData, "qualifications">['remove'];
  removeCertification: UseFieldArrayReturn<ProfileFormData, "certifications">['remove'];
  onCertificateUploadStart: () => void;
  onCertificateUploadEnd: () => void;
}

export function EducationSection({ 
  isEditing, 
  control, 
  watch,
  qualificationFields,
  certificationFields,
  appendQualification,
  appendCertification,
  removeQualification,
  removeCertification,
  onCertificateUploadStart,
  onCertificateUploadEnd,
}: EducationSectionProps) {
  const formData = watch();

  if (!isEditing) {
    // VIEW MODE
    return (
      <Card className="border-0 shadow-xl bg-white/80 backdrop-blur overflow-hidden">
        <CardContent className="p-8">
          <SectionHeader 
            title="Education" 
            icon={<GraduationCap className="w-5 h-5" />}
            subtitle="Educational qualifications and certifications"
          />
          
          {/* Educational Qualifications */}
          <SubSection title="Educational Qualifications">
            {formData.qualifications?.length === 0 ? (
              <EmptyState 
                message="No educational qualifications added yet" 
                icon={<GraduationCap className="w-12 h-12" />}
              />
            ) : (
              <div className="space-y-4">
                {formData.qualifications?.map((qual: any, index: number) => (
                  <EntryCard
                    key={index}
                    title={qual.degreeName || 'Untitled Degree'}
                    subtitle={qual.institution}
                    badges={[
                      { label: qual.type, variant: "secondary" },
                      ...(qual.mode ? [{ label: qual.mode, variant: "outline" as const }] : [])
                    ]}
                    accentColor="indigo"
                  >
                    <DisplayGrid columns={4}>
                      <DisplayField label="Specialization" value={qual.specialization} />
                      <DisplayField label="Location" value={qual.location} icon={<MapPin className="w-3 h-3" />} />
                      <DisplayField 
                        label="Duration" 
                        value={qual.startDate && qual.endDate ? 
                          `${new Date(qual.startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} - ${new Date(qual.endDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}` : 
                          null
                        } 
                      />
                      <DisplayField label="Grade" value={qual.percentage || qual.gpa} />
                    </DisplayGrid>
                    {qual.remarks && (
                      <div className="mt-4 pt-4 border-t border-slate-200">
                        <DisplayField label="Remarks" value={qual.remarks} />
                      </div>
                    )}
                  </EntryCard>
                ))}
              </div>
            )}
          </SubSection>

          {/* Certifications */}
          <SubSection title="Certifications" className="mt-8">
            {formData.certifications?.length === 0 ? (
              <EmptyState 
                message="No certifications added yet" 
                icon={<Award className="w-12 h-12" />}
              />
            ) : (
              <div className="space-y-4">
                {formData.certifications?.map((cert: any, index: number) => (
                  <EntryCard
                    key={index}
                    title={cert.name || 'Untitled Certification'}
                    subtitle={cert.issuingOrganization}
                    badges={cert.expiryDate ? [
                      { 
                        label: new Date(cert.expiryDate) > new Date() ? 'Active' : 'Expired', 
                        variant: new Date(cert.expiryDate) > new Date() ? "default" : "secondary" as const 
                      }
                    ] : []}
                    accentColor="violet"
                  >
                    <DisplayGrid columns={2}>
                      <DisplayField 
                        label="Issue Date" 
                        value={cert.issueDate ? new Date(cert.issueDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : null} 
                      />
                      <DisplayField 
                        label="Expiry Date" 
                        value={cert.expiryDate ? new Date(cert.expiryDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : null} 
                      />
                    </DisplayGrid>
                    {cert.uploadCertificate && (
                      <a
                        href={cert.uploadCertificate}
                        download="certificate"
                        className="mt-3 inline-block text-sm font-medium text-indigo-600 hover:text-indigo-700"
                      >
                        Download Certificate
                      </a>
                    )}
                  </EntryCard>
                ))}
              </div>
            )}
          </SubSection>
        </CardContent>
      </Card>
    );
  }

  // EDIT MODE
  return (
    <Card className="border-0 shadow-xl bg-white/80 backdrop-blur overflow-hidden ring-2 ring-indigo-500/20">
      <CardContent className="p-8">
        <SectionHeader 
          title="Education" 
          icon={<GraduationCap className="w-5 h-5" />}
          subtitle="Manage your educational qualifications and certifications"
          action={
            <Button
              type="button"
              onClick={() => appendQualification({
                type: "Bachelor's",
                degreeName: '',
                specialization: '',
                institution: '',
                location: '',
                startDate: '',
                endDate: '',
                percentage: '',
                gpa: '',
                mode: "Full-time",
                documentUpload: '',
                remarks: '',
              })}
              className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white shadow-lg"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Qualification
            </Button>
          }
        />
        
        {/* Educational Qualifications - Edit */}
        <SubSection title="Educational Qualifications">
          {qualificationFields.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
              <GraduationCap className="w-12 h-12 mx-auto text-slate-300 mb-3" />
              <p className="text-slate-500 mb-4">No educational qualifications added yet</p>
              <Button
                type="button"
                variant="outline"
                onClick={() => appendQualification({
                  type: "Bachelor's",
                  degreeName: '',
                  specialization: '',
                  institution: '',
                  location: '',
                  startDate: '',
                  endDate: '',
                  percentage: '',
                  gpa: '',
                  mode: "Full-time",
                  documentUpload: '',
                  remarks: '',
                })}
                className="border-indigo-300 text-indigo-600 hover:bg-indigo-50"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Qualification
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {qualificationFields.map((field, index) => (
                <div key={field.id} className="bg-slate-50/50 border border-slate-200 rounded-xl p-6 border-l-4 border-l-indigo-500">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <span className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-sm font-semibold">
                        {index + 1}
                      </span>
                      <h5 className="font-semibold text-slate-800">Qualification {index + 1}</h5>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeQualification(index)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <FormField
                      control={control}
                      name={`qualifications.${index}.type`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-700">Qualification Type <span className="text-red-500">*</span></FormLabel>
                          <FormControl>
                            <select {...field} className="w-full h-10 px-3 py-2 bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                              <option value="">Select Type</option>
                              {EDUCATION_TYPE_OPTIONS.map((option) => (
                                <option key={option} value={option}>{option}</option>
                              ))}
                            </select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={control}
                      name={`qualifications.${index}.degreeName`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-700">Degree/Course Name <span className="text-red-500">*</span></FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="e.g., B.Tech Computer Science" className="bg-white border-slate-200 focus:border-indigo-500 focus:ring-indigo-500" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={control}
                      name={`qualifications.${index}.specialization`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-700">Specialization/Major</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="e.g., Software Engineering" className="bg-white border-slate-200 focus:border-indigo-500 focus:ring-indigo-500" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={control}
                      name={`qualifications.${index}.institution`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-700">Institution/University <span className="text-red-500">*</span></FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="e.g., MIT" className="bg-white border-slate-200 focus:border-indigo-500 focus:ring-indigo-500" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={control}
                      name={`qualifications.${index}.location`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-700">Location (City, Country) <span className="text-red-500">*</span></FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="e.g., Boston, USA" className="bg-white border-slate-200 focus:border-indigo-500 focus:ring-indigo-500" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={control}
                      name={`qualifications.${index}.mode`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-700">Mode of Study</FormLabel>
                          <FormControl>
                            <select {...field} className="w-full h-10 px-3 py-2 bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                              <option value="">Select Mode</option>
                              {STUDY_MODE_OPTIONS.map((option) => (
                                <option key={option} value={option}>{option}</option>
                              ))}
                            </select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={control}
                      name={`qualifications.${index}.startDate`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-700">Start Date <span className="text-red-500">*</span></FormLabel>
                          <FormControl>
                            <DatePicker {...field} className="bg-white border-slate-200 focus:border-indigo-500 focus:ring-indigo-500" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={control}
                      name={`qualifications.${index}.endDate`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-700">End Date / Graduation <span className="text-red-500">*</span></FormLabel>
                          <FormControl>
                            <DatePicker {...field} className="bg-white border-slate-200 focus:border-indigo-500 focus:ring-indigo-500" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={control}
                        name={`qualifications.${index}.percentage`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-slate-700">Percentage <span className="text-red-500">*</span></FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="e.g., 85%" className="bg-white border-slate-200 focus:border-indigo-500 focus:ring-indigo-500" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={control}
                        name={`qualifications.${index}.gpa`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-slate-700">GPA</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="e.g., 3.8/4.0" className="bg-white border-slate-200 focus:border-indigo-500 focus:ring-indigo-500" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                  <FormField
                    control={control}
                    name={`qualifications.${index}.remarks`}
                    render={({ field }) => (
                      <FormItem className="mt-4">
                        <FormLabel className="text-slate-700">Remarks / Additional Notes</FormLabel>
                        <FormControl>
                          <textarea
                            {...field}
                            rows={2}
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                            placeholder="Any additional remarks about this qualification"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              ))}
            </div>
          )}
        </SubSection>

        {/* Certifications - Edit */}
        <SubSection title="Certifications" className="mt-8">
          <div className="flex justify-end mb-4">
            <Button
              type="button"
              onClick={() => appendCertification({
                name: '',
                issuingOrganization: '',
                issueDate: '',
                expiryDate: '',
                uploadCertificate: '',
              })}
              variant="outline"
              className="border-violet-300 text-violet-600 hover:bg-violet-50"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Certification
            </Button>
          </div>
          
          {certificationFields.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
              <Award className="w-12 h-12 mx-auto text-slate-300 mb-3" />
              <p className="text-slate-500">No certifications added yet</p>
            </div>
          ) : (
            <div className="space-y-6">
              {certificationFields.map((field, index) => (
                <div key={field.id} className="min-w-0 bg-slate-50/50 border border-slate-200 rounded-xl p-6 border-l-4 border-l-violet-500">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <span className="w-8 h-8 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center text-sm font-semibold">
                        {index + 1}
                      </span>
                      <h5 className="font-semibold text-slate-800">Certification {index + 1}</h5>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeCertification(index)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={control}
                      name={`certifications.${index}.name`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-700">Certification Name <span className="text-red-500">*</span></FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="e.g., AWS Solutions Architect" className="bg-white border-slate-200 focus:border-indigo-500 focus:ring-indigo-500" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={control}
                      name={`certifications.${index}.issuingOrganization`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-700">Issuing Organization <span className="text-red-500">*</span></FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="e.g., Amazon Web Services" className="bg-white border-slate-200 focus:border-indigo-500 focus:ring-indigo-500" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={control}
                      name={`certifications.${index}.issueDate`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-700">Issue Date</FormLabel>
                          <FormControl>
                            <DatePicker {...field} className="bg-white border-slate-200 focus:border-indigo-500 focus:ring-indigo-500" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={control}
                      name={`certifications.${index}.expiryDate`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-700">Expiry Date</FormLabel>
                          <FormControl>
                            <DatePicker {...field} className="bg-white border-slate-200 focus:border-indigo-500 focus:ring-indigo-500" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={control}
                      name={`certifications.${index}.uploadCertificate`}
                      render={({ field }) => {
                        return (
                          <FormItem className="min-w-0 md:col-span-2">
                            <FormLabel className="text-slate-700">
                              Certificate Upload <span className="text-red-500">*</span>
                            </FormLabel>
                            <FormControl>
                              <FileUpload
                                accept="application/pdf,image/*"
                                acceptedTypesLabel="PDF or image files"
                                aria-label="Upload certificate"
                                name={field.name}
                                inputRef={field.ref}
                                onBlur={field.onBlur}
                                value={field.value}
                                onValueChange={field.onChange}
                                onUploadStart={onCertificateUploadStart}
                                onUploadEnd={onCertificateUploadEnd}
                              />
                            </FormControl>
                            <FormMessage className="break-words" />
                          </FormItem>
                        );
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </SubSection>
      </CardContent>
    </Card>
  );
}
