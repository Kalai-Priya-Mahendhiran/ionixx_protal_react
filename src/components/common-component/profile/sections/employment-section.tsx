import { Control, UseFormWatch, UseFieldArrayReturn } from "react-hook-form";
import type { ProfileFormData } from "@/lib/schemas";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { 
  DisplayField, 
  DisplayGrid, 
  SectionHeader, 
  SubSection,
  EntryCard,
  EmptyState
} from "../profile-display";
import { Briefcase, Plus, X, Calendar, MapPin, Building2, DollarSign, Clock, AlertCircle } from "lucide-react";

interface EmploymentSectionProps {
  isEditing: boolean;
  control: Control<ProfileFormData>;
  watch: UseFormWatch<ProfileFormData>;
  employmentFields: UseFieldArrayReturn<ProfileFormData, "previousEmployments">['fields'];
  appendEmployment: UseFieldArrayReturn<ProfileFormData, "previousEmployments">['append'];
  removeEmployment: UseFieldArrayReturn<ProfileFormData, "previousEmployments">['remove'];
}

export function EmploymentSection({ 
  isEditing, 
  control, 
  watch,
  employmentFields,
  appendEmployment,
  removeEmployment
}: EmploymentSectionProps) {
  const formData = watch();

  // Calculate total experience
  const calculateTotalExperience = () => {
    if (!formData.previousEmployments || formData.previousEmployments.length === 0) return null;
    
    let totalMonths = 0;
    formData.previousEmployments.forEach((emp: any) => {
      if (emp.startDate) {
        const start = new Date(emp.startDate);
        const end = emp.isCurrent ? new Date() : (emp.endDate ? new Date(emp.endDate) : new Date());
        const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
        totalMonths += Math.max(0, months);
      }
    });
    
    const years = Math.floor(totalMonths / 12);
    const months = totalMonths % 12;
    
    if (years === 0 && months === 0) return null;
    if (years === 0) return `${months} month${months > 1 ? 's' : ''}`;
    if (months === 0) return `${years} year${years > 1 ? 's' : ''}`;
    return `${years} year${years > 1 ? 's' : ''} ${months} month${months > 1 ? 's' : ''}`;
  };

  if (!isEditing) {
    // VIEW MODE
    return (
      <Card className="border-0 shadow-xl bg-white/80 backdrop-blur overflow-hidden">
        <CardContent className="p-8">
          <SectionHeader 
            title="Employment History" 
            icon={<Briefcase className="w-5 h-5" />}
            subtitle="Previous work experience"
          />
          
          {/* Total Experience Summary */}
          {calculateTotalExperience() && (
            <div className="mb-6 p-4 bg-gradient-to-r from-indigo-50 to-violet-50 rounded-xl border border-indigo-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <Clock className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Total Experience</p>
                  <p className="text-lg font-semibold text-slate-800">{calculateTotalExperience()}</p>
                </div>
              </div>
            </div>
          )}
          
          {formData.previousEmployments?.length === 0 ? (
            <EmptyState 
              message="No employment history added yet" 
              icon={<Briefcase className="w-12 h-12" />}
            />
          ) : (
            <div className="space-y-4">
              {formData.previousEmployments?.map((emp: any, index: number) => (
                <EntryCard
                  key={index}
                  title={emp.designation || 'Untitled Position'}
                  subtitle={emp.companyName}
                  badges={[
                    ...(emp.employmentType ? [{ label: emp.employmentType, variant: "secondary" as const }] : []),
                    ...(emp.isCurrent ? [{ label: 'Current', variant: "default" as const }] : [])
                  ]}
                  accentColor="indigo"
                >
                  <DisplayGrid columns={3}>
                    <DisplayField label="Department" value={emp.department} />
                    <DisplayField label="Location" value={emp.companyLocation} icon={<MapPin className="w-3 h-3" />} />
                    <DisplayField 
                      label="Duration" 
                      value={emp.startDate ? 
                        `${new Date(emp.startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} - ${emp.isCurrent ? 'Present' : (emp.endDate ? new Date(emp.endDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'N/A')}` : 
                        null
                      } 
                      icon={<Calendar className="w-3 h-3" />}
                    />
                    <DisplayField label="Last CTC/Salary" value={emp.lastSalary} isSensitive icon={<DollarSign className="w-3 h-3" />} />
                    <DisplayField label="Notice Period" value={emp.noticePeriod} />
                    <DisplayField label="Reporting Manager" value={emp.reportingManager} />
                  </DisplayGrid>
                  
                  {emp.experienceDescription && (
                    <div className="mt-4 pt-4 border-t border-slate-200">
                      <DisplayField label="Responsibilities & Achievements" value={emp.experienceDescription} />
                    </div>
                  )}
                  
                  {emp.reasonForLeaving && (
                    <div className="mt-4 pt-4 border-t border-slate-200">
                      <DisplayField label="Reason for Leaving" value={emp.reasonForLeaving} />
                    </div>
                  )}

                  {/* Reference Permission Status */}
                  <div className="mt-4 pt-4 border-t border-slate-200">
                    <div className="flex items-center gap-2">
                      {emp.referencePermission ? (
                        <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                          ✓ Reference check permitted
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="border-amber-300 text-amber-700">
                          <AlertCircle className="w-3 h-3 mr-1" /> Reference check not permitted
                        </Badge>
                      )}
                    </div>
                  </div>
                </EntryCard>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // EDIT MODE
  return (
    <Card className="border-0 shadow-xl bg-white/80 backdrop-blur overflow-hidden ring-2 ring-indigo-500/20">
      <CardContent className="p-8">
        <SectionHeader 
          title="Employment History" 
          icon={<Briefcase className="w-5 h-5" />}
          subtitle="Manage your previous work experience"
          action={
            <Button
              type="button"
              onClick={() => appendEmployment({
                companyName: '',
                companyLocation: '',
                designation: '',
                department: '',
                startDate: '',
                endDate: '',
                isCurrent: false,
                employmentType: "Full-time",
                lastSalary: '',
                noticePeriod: '',
                reportingManager: '',
                reasonForLeaving: '',
                experienceDescription: '',
                referencePermission: false,
                documentUploads: [],
                nonCompeteDeclaration: false,
                ndaDeclaration: '',
              })}
              className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white shadow-lg"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Employment
            </Button>
          }
        />
        
        {employmentFields.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
            <Briefcase className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <p className="text-slate-500 mb-4">No employment history added yet</p>
            <Button
              type="button"
              variant="outline"
              onClick={() => appendEmployment({
                companyName: '',
                companyLocation: '',
                designation: '',
                department: '',
                startDate: '',
                endDate: '',
                isCurrent: false,
                employmentType: "Full-time",
                lastSalary: '',
                noticePeriod: '',
                reportingManager: '',
                reasonForLeaving: '',
                experienceDescription: '',
                referencePermission: false,
                documentUploads: [],
                nonCompeteDeclaration: false,
                ndaDeclaration: '',
              })}
              className="border-indigo-300 text-indigo-600 hover:bg-indigo-50"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Employment
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {employmentFields.map((field, index) => (
              <div key={field.id} className="bg-slate-50/50 border border-slate-200 rounded-xl p-6 border-l-4 border-l-indigo-500">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-sm font-semibold">
                      {index + 1}
                    </span>
                    <h5 className="font-semibold text-slate-800">Employment {index + 1}</h5>
                    {watch(`previousEmployments.${index}.isCurrent`) && (
                      <Badge className="bg-emerald-100 text-emerald-700">Current</Badge>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeEmployment(index)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <FormField
                    control={control}
                    name={`previousEmployments.${index}.companyName`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-700">Company Name <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g., Google Inc." className="bg-white border-slate-200 focus:border-indigo-500 focus:ring-indigo-500" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name={`previousEmployments.${index}.companyLocation`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-700">Company Location <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g., San Francisco, CA" className="bg-white border-slate-200 focus:border-indigo-500 focus:ring-indigo-500" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name={`previousEmployments.${index}.designation`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-700">Designation/Job Title <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g., Senior Software Engineer" className="bg-white border-slate-200 focus:border-indigo-500 focus:ring-indigo-500" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name={`previousEmployments.${index}.department`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-700">Department/Team <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g., Engineering" className="bg-white border-slate-200 focus:border-indigo-500 focus:ring-indigo-500" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name={`previousEmployments.${index}.employmentType`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-700">Employment Type <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <select {...field} className="w-full h-10 px-3 py-2 bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                            <option value="">Select Type</option>
                            <option value="Full-time">Full-time</option>
                            <option value="Part-time">Part-time</option>
                            <option value="Contract">Contract</option>
                            <option value="Internship">Internship</option>
                            <option value="Freelance">Freelance</option>
                          </select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name={`previousEmployments.${index}.startDate`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-700">Start Date <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Input type="date" {...field} className="bg-white border-slate-200 focus:border-indigo-500 focus:ring-indigo-500" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name={`previousEmployments.${index}.isCurrent`}
                    render={({ field }) => (
                      <FormItem className="flex items-center gap-2 pt-8">
                        <FormControl>
                          <input
                            type="checkbox"
                            checked={field.value}
                            onChange={field.onChange}
                            className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                          />
                        </FormControl>
                        <FormLabel className="text-slate-700 cursor-pointer">Currently working here</FormLabel>
                      </FormItem>
                    )}
                  />
                  {!watch(`previousEmployments.${index}.isCurrent`) && (
                    <FormField
                      control={control}
                      name={`previousEmployments.${index}.endDate`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-700">End Date <span className="text-red-500">*</span></FormLabel>
                          <FormControl>
                            <Input type="date" {...field} className="bg-white border-slate-200 focus:border-indigo-500 focus:ring-indigo-500" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  <FormField
                    control={control}
                    name={`previousEmployments.${index}.lastSalary`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-700">Last Drawn CTC/Salary <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g., 50,000" className="bg-white border-slate-200 focus:border-indigo-500 focus:ring-indigo-500" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name={`previousEmployments.${index}.noticePeriod`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-700">Notice Period Served</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g., 30 days" className="bg-white border-slate-200 focus:border-indigo-500 focus:ring-indigo-500" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name={`previousEmployments.${index}.reportingManager`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-700">Reporting Manager</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Name & Contact" className="bg-white border-slate-200 focus:border-indigo-500 focus:ring-indigo-500" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={control}
                  name={`previousEmployments.${index}.experienceDescription`}
                  render={({ field }) => (
                    <FormItem className="mt-4">
                      <FormLabel className="text-slate-700">Responsibilities & Achievements</FormLabel>
                      <FormControl>
                        <textarea
                          {...field}
                          rows={3}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                          placeholder="Describe your key responsibilities and achievements in this role"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  name={`previousEmployments.${index}.reasonForLeaving`}
                  render={({ field }) => (
                    <FormItem className="mt-4">
                      <FormLabel className="text-slate-700">Reason for Leaving</FormLabel>
                      <FormControl>
                        <textarea
                          {...field}
                          rows={2}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                          placeholder="Why did you leave this position?"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Reference Permission */}
                <div className="mt-4 p-4 bg-amber-50 rounded-lg border border-amber-200">
                  <FormField
                    control={control}
                    name={`previousEmployments.${index}.referencePermission`}
                    render={({ field }) => (
                      <FormItem className="flex items-start gap-3">
                        <FormControl>
                          <input
                            type="checkbox"
                            checked={field.value}
                            onChange={field.onChange}
                            className="w-4 h-4 mt-1 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                          />
                        </FormControl>
                        <div>
                          <FormLabel className="text-slate-700 cursor-pointer font-medium">
                            Reference Permission <span className="text-red-500">*</span>
                          </FormLabel>
                          <p className="text-sm text-slate-500">I authorize the company to contact this employer for background verification</p>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Date Overlap Warning */}
        {employmentFields.length > 1 && (
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-800">Tip: Overlapping Dates</p>
                <p className="text-sm text-blue-600">Ensure employment dates don't overlap unless you held multiple concurrent positions.</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
