import { useState } from 'react';
import { StatCard, StatGrid } from '@/components/ui/stat-card';
import { Button } from '@/components/ui/button';
import { 
  Folder, 
  FileText, 
  Download, 
  Upload
} from 'lucide-react';
import MainLayout from '@/components/layout/main-layout';
import { PageHeader, headerPrimaryButtonClass } from '@/components/ui/page-header';
import { TASK_ATTACHMENT_CATEGORY } from '@/services/apis/files/file-service';
import { useFiles } from '@/services/apis/files/use-files';
import { CategoriesSidebarSection, FilesContentSection, type FileCategory } from './sections';

export default function Files() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  // Shared with task attachments, so files uploaded to a task appear under "Task Attachments"
  const { data: files = [] } = useFiles();

  const categories: FileCategory[] = [
    { id: 'all', label: 'All Files', count: files.length },
    { id: 'hr-policies', label: 'HR Policies', count: files.filter(f => f.category === 'hr-policies').length },
    { id: 'training', label: 'Training', count: files.filter(f => f.category === 'training').length },
    { id: 'salary', label: 'Salary', count: files.filter(f => f.category === 'salary').length },
    { id: 'general', label: 'General', count: files.filter(f => f.category === 'general').length },
    { id: TASK_ATTACHMENT_CATEGORY, label: 'Task Attachments', count: files.filter(f => f.category === TASK_ATTACHMENT_CATEGORY).length },
  ];

  const filteredFiles = files.filter(file => {
    const matchesCategory = selectedCategory === 'all' || file.category === selectedCategory;
    const matchesSearch = file.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <PageHeader
          icon={Folder}
          title="Files"
          description="Manage and organize your documents"
          actions={
            <Button className={`flex items-center space-x-2 ${headerPrimaryButtonClass}`}>
              <Upload className="h-4 w-4" />
              <span>Upload File</span>
            </Button>
          }
        />

        {/* File Stats */}
        <StatGrid>
          <StatCard icon={FileText} label="Total Files" value={files.length} tone="blue" />
          <StatCard icon={Folder} label="Categories" value={categories.length - 1} tone="green" />
          <StatCard icon={Download} label="Downloads" value={156} tone="purple" />
          <StatCard icon={Upload} label="Storage Used" value="2.4 GB" tone="orange" />
        </StatGrid>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Categories Sidebar */}
          <CategoriesSidebarSection
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
          />

          {/* Files Content */}
          <FilesContentSection
            files={filteredFiles}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
          />
        </div>
      </div>
    </MainLayout>
  );
}
