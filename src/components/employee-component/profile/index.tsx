import { useCallback, useEffect, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Form } from '@/components/ui/form';
import { PageTabs } from '@/components/ui/page-tabs';
import { PageHeaderShade, headerPrimaryButtonClass, headerSecondaryButtonClass, pageHeaderSurfaceClass } from '@/components/ui/page-header';
import { 
  Edit,
  Camera,
  Heart,
  Shield,
  Save,
  X,
  Loader2,
  User,
  GraduationCap,
  Briefcase,
  CreditCard,
  FileCheck,
  ChevronDown
} from 'lucide-react';
import MainLayout from '@/components/layout/main-layout';
import { sampleProfileFormData } from '@/lib/sample-data/profile-sample-data';
import { useMyProfile, useSaveProfile } from '@/services/apis/profile/use-profile';
import { profileSchema, type ProfileFormData } from '@/lib/schemas';
import {
  PersonalSection,
  EducationSection,
  EmploymentSection,
  BankSection,
  ConsentSection
} from './sections';

type SectionId = 'personal' | 'education' | 'employment' | 'bank' | 'consent';

// Height of the app bar plus the sticky tabs, so a section scrolled to isn't hidden under them
const STICKY_OFFSET = 140;

// Navigation items for quick scroll
const navigationItems: { id: SectionId; label: string; icon: typeof User }[] = [
  { id: 'personal', label: 'Personal', icon: User },
  { id: 'education', label: 'Education', icon: GraduationCap },
  { id: 'employment', label: 'Employment', icon: Briefcase },
  { id: 'bank', label: 'Bank Details', icon: CreditCard },
  { id: 'consent', label: 'Consent', icon: FileCheck },
];

export default function Profile() {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  // The signed-in person's saved profile (built from the directory until they first save)
  const { data: profile } = useMyProfile();
  const saveProfile = useSaveProfile();
  const isSubmitting = saveProfile.isPending;
  const [pendingCertificateUploads, setPendingCertificateUploads] = useState(0);
  const [submitError, setSubmitError] = useState('');
  const [activeSection, setActiveSection] = useState<SectionId>('personal');

  // Highlight the tab of the section being read while scrolling
  useEffect(() => {
    const onScroll = () => {
      const current = [...navigationItems].reverse().find((item) => (document.getElementById(item.id)?.getBoundingClientRect().top ?? Infinity) <= STICKY_OFFSET + 1);
      setActiveSection(current?.id ?? 'personal');
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: sampleProfileFormData,
  });

  // Load the person's own profile; don't overwrite edits in progress
  useEffect(() => {
    if (profile && !isEditing) form.reset(profile);
  }, [profile, isEditing, form]);

  const { fields: qualificationFields, append: appendQualification, remove: removeQualification } = useFieldArray({
    control: form.control,
    name: 'qualifications'
  });

  const { fields: certificationFields, append: appendCertification, remove: removeCertification } = useFieldArray({
    control: form.control,
    name: 'certifications'
  });

  const { fields: employmentFields, append: appendEmployment, remove: removeEmployment } = useFieldArray({
    control: form.control,
    name: 'previousEmployments'
  });

  const onSubmit = async (data: ProfileFormData) => {
    if (pendingCertificateUploads > 0) {
      setSubmitError('Please wait for the certificate upload to finish before saving.');
      return;
    }
    setSubmitError('');
    saveProfile.mutate(data, { onSuccess: () => setIsEditing(false) });
  };

  const onInvalidSubmit = () => {
    setSubmitError('Some required fields are missing or invalid. Review the highlighted fields before saving.');
    requestAnimationFrame(() => {
      const firstInvalidField = document.querySelector<HTMLElement>('[aria-invalid="true"]');
      firstInvalidField?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      firstInvalidField?.focus({ preventScroll: true });
    });
  };

  const handleCancel = useCallback(() => {
    setIsEditing(false);
    form.reset(profile ?? sampleProfileFormData);
  }, [form, profile]);

  const handleFileUpload = async (file: File) => {
    try {
      // Validate file type and size
      const allowedTypes = ['image/jpeg', 'image/png'];
      const maxSize = 5 * 1024 * 1024; // 5MB
      
      if (!allowedTypes.includes(file.type)) {
        throw new Error('Only JPEG and PNG files are allowed');
      }
      
      if (file.size > maxSize) {
        throw new Error('File size must be less than 5MB');
      }
      
      // Create a mock file URL (in production, upload to server)
      const mockFileUrl = URL.createObjectURL(file);
      form.setValue('profilePhoto', mockFileUrl);
      
    } catch (error) {
      console.error('File upload error:', error);
    }
  };

  const scrollToSection = (sectionId: SectionId) => {
    setActiveSection(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      window.scrollTo({ top: element.getBoundingClientRect().top + window.scrollY - STICKY_OFFSET, behavior: 'smooth' });
    }
  };

  const preferredName = form.watch('preferredName');
  const bloodGroup = form.watch('bloodGroup');
  const workAuthorization = form.watch('workAuthorization');

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto">
        {/* Profile header: the only place the photo, name, role and ID are shown (same gradient as every page header) */}
        <div className={`${pageHeaderSurfaceClass} px-6 py-4`}>
          <PageHeaderShade />
          <div className="relative z-10">
            {/* Profile Header */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Avatar className="w-14 h-14 ring-2 ring-white/30 shadow-lg">
                    <AvatarImage src={form.watch('profilePhoto') || user?.avatar} alt={user?.name} />
                    <AvatarFallback className="text-xl font-bold bg-white text-[#464EB8]">
                      {user?.name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  {isEditing && (
                    <>
                      <button
                        type="button"
                        onClick={() => document.getElementById('profile-photo-upload')?.click()}
                        className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-white text-[#464EB8] shadow-lg hover:bg-white/90"
                        aria-label="Change profile photo (JPEG or PNG, up to 5 MB)"
                        title="Change photo (JPEG or PNG, up to 5 MB)"
                      >
                        <Camera className="h-3 w-3" />
                      </button>
                      <input
                        id="profile-photo-upload"
                        type="file"
                        accept="image/jpeg,image/png"
                        className="hidden"
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          if (file) handleFileUpload(file);
                        }}
                      />
                    </>
                  )}
                </div>
                <div>
                  <h1 className="text-2xl font-bold leading-tight text-white">
                    {form.watch('firstName')} {form.watch('middleName')} {form.watch('lastName')}
                    {preferredName && <span className="ml-2 text-lg font-normal text-white/80">({preferredName})</span>}
                  </h1>
                  <p className="text-sm text-white/90">
                    <span className="font-medium">{user?.designation}</span>
                    {user?.department && <span className="text-white/80"> · {user.department}</span>}
                  </p>
                  {/* ID, blood group and work authorization keep their own colours (indigo, red, green) */}
                  <div className="mt-1.5 flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-semibold text-indigo-800">
                      {form.watch('employeeId')}
                    </span>
                    {bloodGroup && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-700">
                        <Heart className="h-3 w-3" /> {bloodGroup}
                      </span>
                    )}
                    {workAuthorization && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                        <Shield className="h-3 w-3" /> {workAuthorization}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3">
                {!isEditing ? (
                  <Button 
                    onClick={() => setIsEditing(true)} 
                    className={`${headerPrimaryButtonClass} px-6`}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      onClick={handleCancel}
                      className={headerSecondaryButtonClass}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                    <Button
                      onClick={form.handleSubmit(onSubmit, onInvalidSubmit)}
                      disabled={isSubmitting || pendingCertificateUploads > 0}
                      className={`${headerPrimaryButtonClass} px-6`}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* Section tabs stay just under the app bar while scrolling */}
        <div className="sticky top-16 z-20 -mx-4 mb-6 bg-gray-50 px-4 pt-4 lg:-mx-6 lg:px-6">
          <PageTabs label="Profile sections" tabs={navigationItems} value={activeSection} onChange={scrollToSection} />
        </div>

        {/* Form Content */}
        <Form {...form}>
          {submitError && (
            <p role="alert" className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {submitError}
            </p>
          )}
          <form onSubmit={form.handleSubmit(onSubmit, onInvalidSubmit)} className="space-y-8 pb-12">
            {/* Personal Information Section */}
            <section id="personal">
              <PersonalSection
                isEditing={isEditing}
                control={form.control}
                watch={form.watch}
              />
            </section>

            {/* Education Section */}
            <section id="education">
              <EducationSection
                isEditing={isEditing}
                control={form.control}
                watch={form.watch}
                qualificationFields={qualificationFields}
                certificationFields={certificationFields}
                appendQualification={appendQualification}
                appendCertification={appendCertification}
                removeQualification={removeQualification}
                removeCertification={removeCertification}
                onCertificateUploadStart={() => setPendingCertificateUploads((count) => count + 1)}
                onCertificateUploadEnd={() => setPendingCertificateUploads((count) => Math.max(0, count - 1))}
              />
            </section>

            {/* Employment Section */}
            <section id="employment">
              <EmploymentSection
                isEditing={isEditing}
                control={form.control}
                watch={form.watch}
                employmentFields={employmentFields}
                appendEmployment={appendEmployment}
                removeEmployment={removeEmployment}
              />
            </section>

            {/* Bank Details Section */}
            <section id="bank">
              <BankSection
                isEditing={isEditing}
                control={form.control}
                watch={form.watch}
              />
            </section>

            {/* Consent Section */}
            <section id="consent">
              <ConsentSection
                isEditing={isEditing}
                control={form.control}
                watch={form.watch}
                isSubmitting={isSubmitting}
              />
            </section>
          </form>
        </Form>

        {/* Scroll to Top FAB */}
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-8 right-8 p-3 bg-white shadow-lg rounded-full border border-slate-200 hover:shadow-xl transition-all hover:-translate-y-1 z-50"
          aria-label="Scroll to top"
        >
          <ChevronDown className="w-5 h-5 text-slate-600 rotate-180" />
        </button>
      </div>
    </MainLayout>
  );
}
