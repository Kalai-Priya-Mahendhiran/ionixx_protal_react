import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Folder, HardDrive, Upload } from 'lucide-react';
import MainLayout from '@/components/layout/main-layout';
import { Button } from '@/components/ui/button';
import { PageHeader, headerPrimaryButtonClass } from '@/components/ui/page-header';
import { StatCard, StatGrid } from '@/components/ui/stat-card';
import { useAuth } from '@/context/auth-context';
import { useCreateFromLink } from '@/hooks/use-create-from-link';
import { STORAGE_QUOTA_BYTES } from '@/services/apis/files/file-service';
import { useFiles } from '@/services/apis/files/use-files';
import { FILE_CATEGORIES, FilesContentSection, UploadFileDialog, formatFileSize } from './sections';
import { getFilesInfo } from './sections/files-info';

export default function Files() {
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState('all');
  // ?q= pre-fills the search (the header search links here with the file's name)
  const [params] = useSearchParams();
  const linkedQuery = params.get('q');
  const [searchTerm, setSearchTerm] = useState(linkedQuery ?? '');
  useEffect(() => {
    if (linkedQuery !== null) setSearchTerm(linkedQuery);
  }, [linkedQuery]);
  const [uploading, setUploading] = useState(false);
  // Only what this person may see: company files, their department, their own documents and uploads
  const { data: files = [], isLoading } = useFiles();
  // Quick Add → Upload File
  useCreateFromLink(() => setUploading(true));

  if (!user) return null;
  const viewer = { id: user.id, role: user.role };
  const storageUsed = files.filter((file) => file.uploadedById === user.id).reduce((total, file) => total + file.size, 0);

  // Category cards act as the filter; empty categories are hidden unless selected
  const categoryCards = FILE_CATEGORIES.map((category) => ({
    ...category,
    count: files.filter((file) => file.category === category.id).length,
  })).filter((category) => category.count > 0 || category.id === selectedCategory);

  const filteredFiles = files
    .filter((file) => selectedCategory === 'all' || file.category === selectedCategory)
    .filter((file) => file.name.toLowerCase().includes(searchTerm.trim().toLowerCase()))
    .sort((a, b) => b.uploadedDate.localeCompare(a.uploadedDate));

  return (
    <MainLayout>
      <div className="mx-auto max-w-6xl space-y-6">
        <PageHeader
          icon={Folder}
          title="Files"
          description={`Company documents, ${user.department} team files and your own documents`}
          info={getFilesInfo(user.role, user.department)}
          actions={
            <Button className={headerPrimaryButtonClass} onClick={() => setUploading(true)}>
              <Upload className="mr-2 h-4 w-4" />
              Upload File
            </Button>
          }
        />

        {/* Four per row on wide screens, so the cards wrap evenly */}
        <StatGrid className="lg:grid-cols-4">
          <StatCard icon={Folder} label="All Files" value={files.length} tone="indigo" loading={isLoading} active={selectedCategory === 'all'} onClick={() => setSelectedCategory('all')} />
          {categoryCards.map((category) => (
            <StatCard
              key={category.id}
              icon={category.icon}
              label={category.label}
              value={category.count}
              tone={category.tone}
              loading={isLoading}
              active={selectedCategory === category.id}
              // Clicking the selected card again shows all files
              onClick={() => setSelectedCategory((current) => (current === category.id ? 'all' : category.id))}
            />
          ))}
        </StatGrid>

        <FilesContentSection
          files={filteredFiles}
          viewer={viewer}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          toolbarNote={
            <span className="flex shrink-0 items-center gap-1.5 text-sm text-gray-600" title="Space used by files you uploaded">
              <HardDrive className="h-4 w-4 text-teal-600" aria-hidden="true" />
              {formatFileSize(storageUsed)} of {formatFileSize(STORAGE_QUOTA_BYTES)} used
            </span>
          }
        />
      </div>

      <UploadFileDialog open={uploading} onOpenChange={setUploading} role={user.role} department={user.department} />
    </MainLayout>
  );
}
