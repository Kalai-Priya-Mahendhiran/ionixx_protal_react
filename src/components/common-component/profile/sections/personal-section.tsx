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
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Globe,
  Linkedin,
  Github,
  ExternalLink
} from "lucide-react";
import { DatePicker } from '@/components/ui/date-picker';

interface PersonalSectionProps {
  isEditing: boolean;
  control: Control<ProfileFormData>;
  watch: UseFormWatch<ProfileFormData>;
}

export function PersonalSection({ isEditing, control, watch }: PersonalSectionProps) {
  const formData = watch();

  if (!isEditing) {
    // VIEW MODE
    return (
      <Card className="border-0 shadow-xl bg-white/80 backdrop-blur overflow-hidden">
        <CardContent className="p-8">
          <SectionHeader 
            title="Personal Information" 
            icon={<User className="w-5 h-5" />}
            subtitle="Basic details and contact information"
          />
          
          {/* Basic Information */}
          <SubSection title="Basic Information">
            <DisplayGrid columns={4}>
              <DisplayField label="Date of Birth" value={formData.dateOfBirth ? new Date(formData.dateOfBirth).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : null} />
              <DisplayField label="Gender" value={formData.gender} />
              <DisplayField label="Nationality" value={formData.nationality} />
              <DisplayField label="Marital Status" value={formData.maritalStatus} />
            </DisplayGrid>
          </SubSection>

          {/* Contact Information */}
          <SubSection title="Contact Information" className="mt-8">
            <DisplayGrid columns={2}>
              <DisplayField label="Personal Email" value={formData.personalEmail} icon={<Mail className="w-4 h-4" />} />
              <DisplayField label="Work Email" value={formData.workEmail} icon={<Mail className="w-4 h-4" />} />
              <DisplayField label="Mobile (Personal)" value={formData.mobilePersonal} icon={<Phone className="w-4 h-4" />} />
              <DisplayField label="Alternate Phone" value={formData.alternatePhone} icon={<Phone className="w-4 h-4" />} />
            </DisplayGrid>
          </SubSection>

          {/* Address Information */}
          <SubSection title="Address" className="mt-8">
            <DisplayGrid columns={2}>
              <DisplayField label="Current Address" value={formData.currentAddress} icon={<MapPin className="w-4 h-4" />} />
              <DisplayField 
                label="Permanent Address" 
                value={formData.sameAsCurrentAddress ? formData.currentAddress : formData.permanentAddress} 
                icon={<MapPin className="w-4 h-4" />} 
              />
            </DisplayGrid>
            {formData.currentLocation && (
              <div className="mt-4">
                <DisplayField label="Current Location / City" value={formData.currentLocation} icon={<Globe className="w-4 h-4" />} />
              </div>
            )}
          </SubSection>

          {/* Emergency Contact */}
          <SubSection title="Emergency Contact" className="mt-8">
            <div className="bg-red-50/50 rounded-xl p-5 border border-red-100">
              <DisplayGrid columns={4}>
                <DisplayField label="Contact Name" value={formData.emergencyContact?.name} />
                <DisplayField label="Relationship" value={formData.emergencyContact?.relationship} />
                <DisplayField label="Phone" value={formData.emergencyContact?.phone} icon={<Phone className="w-4 h-4" />} />
                <DisplayField label="Alternate Phone" value={formData.emergencyContact?.alternatePhone} icon={<Phone className="w-4 h-4" />} />
              </DisplayGrid>
            </div>
          </SubSection>

          {/* Government IDs */}
          <SubSection title="Government IDs" className="mt-8">
            <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
              <DisplayGrid columns={3}>
                <DisplayField label="PAN / SSN / National ID" value={formData.governmentIds?.pan || formData.governmentIds?.ssn || formData.governmentIds?.nationalId} isSensitive />
                <DisplayField label="Passport Number" value={formData.governmentIds?.passportNumber} isSensitive />
                <DisplayField label="Aadhaar (India)" value={formData.governmentIds?.aadhaar} isSensitive />
              </DisplayGrid>
            </div>
          </SubSection>

          {/* Social Links */}
          {(formData.linkedinUrl || formData.githubUrl || formData.portfolioUrl) && (
            <SubSection title="Social & Professional Links" className="mt-8">
              <div className="flex flex-wrap gap-4">
                {formData.linkedinUrl && (
                  <a 
                    href={formData.linkedinUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#0077B5]/10 text-[#0077B5] rounded-lg hover:bg-[#0077B5]/20 transition-colors font-medium"
                  >
                    <Linkedin className="w-4 h-4" /> LinkedIn
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
                {formData.githubUrl && (
                  <a 
                    href={formData.githubUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900/10 text-slate-900 rounded-lg hover:bg-slate-900/20 transition-colors font-medium"
                  >
                    <Github className="w-4 h-4" /> GitHub
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
                {formData.portfolioUrl && (
                  <a 
                    href={formData.portfolioUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-violet-500/10 text-violet-600 rounded-lg hover:bg-violet-500/20 transition-colors font-medium"
                  >
                    <Globe className="w-4 h-4" /> Portfolio
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </SubSection>
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
          title="Personal Information" 
          icon={<User className="w-5 h-5" />}
          subtitle="Edit your basic details and contact information"
        />
        
        {/* Basic Information - Edit */}
        <SubSection title="Basic Information">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              control={control}
              name="employeeId"
              disabled
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-700">Employee ID <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <Input {...field} className="bg-slate-50 border-slate-200 focus:border-indigo-500 focus:ring-indigo-500" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="firstName"
              disabled
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-700">First Name <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <Input {...field} className="bg-white border-slate-200 focus:border-indigo-500 focus:ring-indigo-500" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="middleName"
              disabled
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-700">Middle Name</FormLabel>
                  <FormControl>
                    <Input {...field} className="bg-white border-slate-200 focus:border-indigo-500 focus:ring-indigo-500" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="lastName"
              disabled
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-700">Last Name <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <Input {...field} className="bg-white border-slate-200 focus:border-indigo-500 focus:ring-indigo-500" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="preferredName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-700">Preferred Name / Nickname</FormLabel>
                  <FormControl>
                    <Input {...field} className="bg-white border-slate-200 focus:border-indigo-500 focus:ring-indigo-500" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="dateOfBirth"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-700">Date of Birth <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <DatePicker {...field} className="bg-white border-slate-200 focus:border-indigo-500 focus:ring-indigo-500" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="gender"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-700">Gender</FormLabel>
                  <FormControl>
                    <select {...field} className="w-full h-10 px-3 py-2 bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                      <option value="Prefer not to say">Prefer not to say</option>
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="nationality"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-700">Nationality <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <Input {...field} className="bg-white border-slate-200 focus:border-indigo-500 focus:ring-indigo-500" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="maritalStatus"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-700">Marital Status</FormLabel>
                  <FormControl>
                    <select {...field} className="w-full h-10 px-3 py-2 bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                      <option value="">Select Status</option>
                      <option value="Single">Single</option>
                      <option value="Married">Married</option>
                      <option value="Divorced">Divorced</option>
                      <option value="Widowed">Widowed</option>
                      <option value="Other">Other</option>
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </SubSection>

        {/* Contact Information - Edit */}
        <SubSection title="Contact Information" className="mt-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={control}
              name="personalEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-700">Personal Email <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <Input type="email" {...field} className="bg-white border-slate-200 focus:border-indigo-500 focus:ring-indigo-500" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="workEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-700">Work Email</FormLabel>
                  <FormControl>
                    <Input type="email" {...field} className="bg-white border-slate-200 focus:border-indigo-500 focus:ring-indigo-500" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="mobilePersonal"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-700">Mobile (Personal) <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <Input type="tel" {...field} placeholder="+1 234 567 8900" className="bg-white border-slate-200 focus:border-indigo-500 focus:ring-indigo-500" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="alternatePhone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-700">Alternate Phone</FormLabel>
                  <FormControl>
                    <Input type="tel" {...field} className="bg-white border-slate-200 focus:border-indigo-500 focus:ring-indigo-500" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </SubSection>

        {/* Address - Edit */}
        <SubSection title="Address" className="mt-8">
          <FormField
            control={control}
            name="currentAddress"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-slate-700">Current Address <span className="text-red-500">*</span></FormLabel>
                <FormControl>
                  <textarea
                    {...field}
                    rows={3}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                    placeholder="Enter your complete current address including city, state, PIN/ZIP, and country"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="sameAsCurrentAddress"
            render={({ field }) => (
              <FormItem className="flex items-center gap-2 mt-4">
                <FormControl>
                  <input
                    type="checkbox"
                    checked={field.value}
                    onChange={field.onChange}
                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                </FormControl>
                <FormLabel className="text-slate-700 cursor-pointer">Same as current address</FormLabel>
              </FormItem>
            )}
          />
          {!watch('sameAsCurrentAddress') && (
            <FormField
              control={control}
              name="permanentAddress"
              render={({ field }) => (
                <FormItem className="mt-4">
                  <FormLabel className="text-slate-700">Permanent Address</FormLabel>
                  <FormControl>
                    <textarea
                      {...field}
                      rows={3}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                      placeholder="Enter your permanent address"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <FormField
              control={control}
              name="currentLocation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-700">Current Location / City</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g., San Francisco, CA" className="bg-white border-slate-200 focus:border-indigo-500 focus:ring-indigo-500" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="workAuthorization"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-700">Work Authorization / Visa Status</FormLabel>
                  <FormControl>
                    <select {...field} className="w-full h-10 px-3 py-2 bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                      <option value="">Select Status</option>
                      <option value="Citizen">Citizen</option>
                      <option value="Permanent Resident">Permanent Resident</option>
                      <option value="Work Visa">Work Visa</option>
                      <option value="Student Visa">Student Visa</option>
                      <option value="Other">Other</option>
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </SubSection>

        {/* Emergency Contact - Edit */}
        <SubSection title="Emergency Contact" className="mt-8">
          <div className="bg-red-50/50 rounded-xl p-5 border border-red-100">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={control}
                name="emergencyContact.name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-700">Name <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input {...field} className="bg-white border-slate-200 focus:border-indigo-500 focus:ring-indigo-500" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name="emergencyContact.relationship"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-700">Relationship <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g., Spouse, Parent, Sibling" className="bg-white border-slate-200 focus:border-indigo-500 focus:ring-indigo-500" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name="emergencyContact.phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-700">Phone <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input type="tel" {...field} className="bg-white border-slate-200 focus:border-indigo-500 focus:ring-indigo-500" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name="emergencyContact.alternatePhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-700">Alternate Phone</FormLabel>
                    <FormControl>
                      <Input type="tel" {...field} className="bg-white border-slate-200 focus:border-indigo-500 focus:ring-indigo-500" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        </SubSection>

        {/* Government IDs - Edit */}
        <SubSection title="Government IDs" className="mt-8">
          <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={control}
                name="governmentIds.pan"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-700">PAN</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="ABCDE1234F" className="bg-white border-slate-200 focus:border-indigo-500 focus:ring-indigo-500 font-mono" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name="governmentIds.passportNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-700">Passport Number</FormLabel>
                    <FormControl>
                      <Input {...field} className="bg-white border-slate-200 focus:border-indigo-500 focus:ring-indigo-500 font-mono" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name="governmentIds.aadhaar"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-700">Aadhaar (India)</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="12-digit Aadhaar number" maxLength={12} className="bg-white border-slate-200 focus:border-indigo-500 focus:ring-indigo-500 font-mono" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        </SubSection>

        {/* Additional Info - Edit */}
        <SubSection title="Additional Information" className="mt-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={control}
              name="bloodGroup"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-700">Blood Group</FormLabel>
                  <FormControl>
                    <select {...field} className="w-full h-10 px-3 py-2 bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                      <option value="">Select Blood Group</option>
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </SubSection>

        {/* Social Links - Edit */}
        <SubSection title="Social & Professional Links" className="mt-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              control={control}
              name="linkedinUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-700">LinkedIn URL</FormLabel>
                  <FormControl>
                    <Input type="url" {...field} placeholder="https://linkedin.com/in/username" className="bg-white border-slate-200 focus:border-indigo-500 focus:ring-indigo-500" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="githubUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-700">GitHub URL</FormLabel>
                  <FormControl>
                    <Input type="url" {...field} placeholder="https://github.com/username" className="bg-white border-slate-200 focus:border-indigo-500 focus:ring-indigo-500" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="portfolioUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-700">Portfolio URL</FormLabel>
                  <FormControl>
                    <Input type="url" {...field} placeholder="https://yourportfolio.com" className="bg-white border-slate-200 focus:border-indigo-500 focus:ring-indigo-500" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </SubSection>
      </CardContent>
    </Card>
  );
}
