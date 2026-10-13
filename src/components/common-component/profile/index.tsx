import { useState, useCallback } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Form } from '@/components/ui/form';
import { 
  Edit,
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
import { sampleUsers } from '@/lib/sample-data';
import { profileSchema, type ProfileFormData } from '@/lib/schemas';
import {
  PersonalSection,
  EducationSection,
  EmploymentSection,
  BankSection,
  ConsentSection
} from './sections';

// Navigation items for quick scroll
const navigationItems = [
  { id: 'personal', label: 'Personal', icon: User },
  { id: 'education', label: 'Education', icon: GraduationCap },
  { id: 'employment', label: 'Employment', icon: Briefcase },
  { id: 'bank', label: 'Bank Details', icon: CreditCard },
  { id: 'consent', label: 'Consent', icon: FileCheck },
];

export default function Profile() {
  const { user } = useAuth();
  const currentUser = sampleUsers[0];
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingCertificateUploads, setPendingCertificateUploads] = useState(0);
  const [submitError, setSubmitError] = useState('');
  const [activeSection, setActiveSection] = useState('personal');

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      // Personal Information
      employeeId: currentUser.employeeId || 'EMP00123',
      firstName: currentUser.name.split(' ')[0] || '',
      middleName: '',
      lastName: currentUser.name.split(' ').slice(1).join(' ') || '',
      preferredName: '',
      dateOfBirth: '1990-05-15',
      gender: 'Male',
      nationality: 'Indian',
      maritalStatus: 'Single',
      personalEmail: 'john.personal@email.com',
      workEmail: currentUser.email || '',
      mobilePersonal: currentUser.phone || '+1 234 567 8900',
      alternatePhone: '',
      currentAddress: currentUser.address || '123 Main Street, Apt 4B, San Francisco, CA 94102, USA',
      permanentAddress: '',
      sameAsCurrentAddress: true,
      emergencyContact: {
        name: 'Jane Doe',
        relationship: 'Spouse',
        phone: '+1 234 567 8901',
        alternatePhone: '',
      },
      governmentIds: {
        pan: 'ABCDE1234F',
        ssn: '',
        nationalId: '',
        passportNumber: 'P1234567',
        aadhaar: '',
      },
      bloodGroup: 'O+',
      profilePhoto: '',
      currentLocation: 'San Francisco, CA',
      workAuthorization: 'Citizen',
      linkedinUrl: 'https://linkedin.com/in/johndoe',
      githubUrl: 'https://github.com/johndoe',
      portfolioUrl: '',
      
      // Education - Sample data
      qualifications: [
        {
          type: "Master's" as const,
          degreeName: 'Master of Computer Science',
          specialization: 'Artificial Intelligence',
          institution: 'Stanford University',
          location: 'Stanford, CA, USA',
          startDate: '2016-09-01',
          endDate: '2018-06-15',
          percentage: '90%',
          gpa: '3.9/4.0',
          mode: 'Full-time' as const,
          documentUpload: '',
          remarks: 'Dean\'s List, AI Research Lab',
        },
        {
          type: "Bachelor's" as const,
          degreeName: 'Bachelor of Technology in Computer Science',
          specialization: 'Software Engineering',
          institution: 'IIT Delhi',
          location: 'New Delhi, India',
          startDate: '2012-08-01',
          endDate: '2016-05-30',
          percentage: '85%',
          gpa: '',
          mode: 'Full-time' as const,
          documentUpload: '',
          remarks: '',
        }
      ],
      certifications: [
        {
          name: 'AWS Solutions Architect - Professional',
          issuingOrganization: 'Amazon Web Services',
          issueDate: '2023-01-15',
          expiryDate: '2026-01-15',
          uploadCertificate: '',
        }
      ],
      
      // Employment - Sample data
      previousEmployments: [
        {
          companyName: 'Google Inc.',
          companyLocation: 'Mountain View, CA',
          designation: 'Senior Software Engineer',
          department: 'Cloud Platform',
          startDate: '2020-03-01',
          endDate: '',
          isCurrent: true,
          employmentType: 'Full-time' as const,
          lastSalary: '180,000',
          noticePeriod: '',
          reportingManager: 'Sarah Johnson, sarah.j@google.com',
          reasonForLeaving: '',
          experienceDescription: 'Led a team of 5 engineers building cloud infrastructure services. Designed and implemented scalable microservices architecture serving 10M+ requests daily.',
          referencePermission: true,
          documentUploads: [],
          nonCompeteDeclaration: false,
          ndaDeclaration: '',
        },
        {
          companyName: 'Microsoft Corporation',
          companyLocation: 'Seattle, WA',
          designation: 'Software Engineer II',
          department: 'Azure',
          startDate: '2018-07-01',
          endDate: '2020-02-28',
          isCurrent: false,
          employmentType: 'Full-time' as const,
          lastSalary: '140,000',
          noticePeriod: '30 days',
          reportingManager: 'Mike Chen, mike.chen@microsoft.com',
          reasonForLeaving: 'Career growth opportunity',
          experienceDescription: 'Developed core features for Azure Kubernetes Service. Improved deployment pipeline efficiency by 40%.',
          referencePermission: true,
          documentUploads: [],
          nonCompeteDeclaration: false,
          ndaDeclaration: '',
        }
      ],
      
      // Bank Details
      accountNumber: '1234567890',
      bankName: 'Wells Fargo',
      ifscCode: 'WFBI0001234',
      accountType: 'Savings' as const,
      branchName: 'San Francisco Main',
      swiftCode: 'WFBIUS6S',
      
      // Consent
      dataProcessingConsent: true,
      backgroundCheckConsent: true,
      dataPrivacyConsent: true,
      esignature: 'John Doe',
      consentDate: '2024-01-15T10:30',
      
      // File Uploads
      uploadedDocuments: [],
    },
  });

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
    setIsSubmitting(true);
    try {
      console.log('Profile data:', data);
      // Here you would typically send the data to your API
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving profile:', error);
    } finally {
      setIsSubmitting(false);
    }
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
    form.reset();
  }, [form]);

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
      
      console.log('Profile photo uploaded:', file.name);
    } catch (error) {
      console.error('File upload error:', error);
    }
  };

  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto">
        {/* Sticky Header */}
        <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-200 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 mb-8">
          <div className="py-6">
            {/* Profile Header */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="flex items-center gap-5">
                <div className="relative">
                  <Avatar className="w-20 h-20 ring-4 ring-indigo-100 shadow-xl">
                    <AvatarImage src={form.watch('profilePhoto') || user?.avatar} alt={user?.name} />
                    <AvatarFallback className="text-2xl font-bold bg-gradient-to-br from-indigo-500 to-violet-600 text-white">
                      {user?.name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  {isEditing && (
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center">
                      <Edit className="w-3 h-3 text-white" />
                    </div>
                  )}
                </div>
                <div>
                  <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">
                    {form.watch('firstName')} {form.watch('lastName')}
                  </h1>
                  <p className="text-slate-600 font-medium">{user?.designation}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-sm text-slate-500">{user?.department}</span>
                    <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                    <span className="text-sm font-medium text-indigo-600">{form.watch('employeeId')}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3">
                {!isEditing ? (
                  <Button 
                    onClick={() => setIsEditing(true)} 
                    className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white shadow-lg shadow-indigo-500/25 px-6"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      onClick={handleCancel}
                      className="border-slate-300 text-slate-700 hover:bg-slate-100"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                    <Button
                      onClick={form.handleSubmit(onSubmit, onInvalidSubmit)}
                      disabled={isSubmitting || pendingCertificateUploads > 0}
                      className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white shadow-lg shadow-indigo-500/25 px-6"
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

            {/* Section Navigation */}
            <div className="mt-6 flex items-center gap-1 overflow-x-auto pb-2 -mb-2 scrollbar-hide">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => scrollToSection(item.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                      isActive 
                        ? 'bg-indigo-100 text-indigo-700' 
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>
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
                user={user}
                onPhotoUpload={handleFileUpload}
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
