import type { User } from '@/types';
import type { ProfileFormData } from '@/lib/schemas';

export const sampleProfileUser: User = {
  id: '1',
  name: 'John Doe',
  email: 'john.doe@company.com',
  phone: '+1-555-0123',
  address: '123 Main St, City, State',
  department: 'Engineering',
  designation: 'Senior Developer',
  employeeId: 'EMP001',
  joiningDate: '2022-01-15',
  reportingManager: 'Jane Smith',
  role: 'employee',
  bankName: 'State Bank of India',
  ifscCode: 'SBIN0001234',
  accountType: 'Savings',
};

export const sampleProfileFormData: ProfileFormData = {
  // Personal Information
  employeeId: sampleProfileUser.employeeId || 'EMP00123',
  firstName: sampleProfileUser.name.split(' ')[0] || '',
  middleName: '',
  lastName: sampleProfileUser.name.split(' ').slice(1).join(' ') || '',
  preferredName: '',
  dateOfBirth: '1990-05-15',
  gender: 'Male',
  nationality: 'Indian',
  maritalStatus: 'Single',
  personalEmail: 'john.personal@email.com',
  workEmail: sampleProfileUser.email || '',
  mobilePersonal: sampleProfileUser.phone || '+1 234 567 8900',
  alternatePhone: '',
  currentAddress: sampleProfileUser.address || '123 Main Street, Apt 4B, San Francisco, CA 94102, USA',
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
};
