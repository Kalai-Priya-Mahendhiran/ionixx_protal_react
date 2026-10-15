import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Folder, 
  FileText, 
  Download, 
  Upload
} from 'lucide-react';
import MainLayout from '@/components/layout/main-layout';
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Files</h1>
            <p className="text-gray-600 mt-2">Manage and organize your documents</p>
          </div>
          <Button className="flex items-center space-x-2">
            <Upload className="h-4 w-4" />
            <span>Upload File</span>
          </Button>
        </div>

        {/* File Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Files</p>
                  <p className="text-2xl font-bold text-gray-900">{files.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Folder className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Categories</p>
                  <p className="text-2xl font-bold text-gray-900">{categories.length - 1}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Download className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Downloads</p>
                  <p className="text-2xl font-bold text-gray-900">156</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Upload className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Storage Used</p>
                  <p className="text-2xl font-bold text-gray-900">2.4 GB</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

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
