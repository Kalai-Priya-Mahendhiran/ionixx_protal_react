import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Folder, 
  FileText, 
  Download, 
  Search,
  Grid,
  List,
  Eye,
  Trash2,
  Share
} from 'lucide-react';
import type { File } from '@/types';

interface FilesContentSectionProps {
  files: File[];
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const getFileIcon = (type: string) => {
  if (type.includes('pdf')) {
    return <FileText className="h-8 w-8 text-red-500" />;
  } else if (type.includes('image')) {
    return <FileText className="h-8 w-8 text-blue-500" />;
  } else if (type.includes('word') || type.includes('document')) {
    return <FileText className="h-8 w-8 text-blue-600" />;
  } else if (type.includes('excel') || type.includes('spreadsheet')) {
    return <FileText className="h-8 w-8 text-green-500" />;
  } else {
    return <FileText className="h-8 w-8 text-gray-500" />;
  }
};

const getCategoryBadge = (category: string) => {
  const colors = {
    'hr-policies': 'bg-blue-100 text-blue-800',
    'training': 'bg-green-100 text-green-800',
    'salary': 'bg-purple-100 text-purple-800',
    'general': 'bg-gray-100 text-gray-800'
  };
  
  return (
    <Badge className={colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800'}>
      {category.replace('-', ' ').toUpperCase()}
    </Badge>
  );
};

const getAccessBadge = (accessLevel: string) => {
  const colors = {
    'public': 'bg-green-100 text-green-800',
    'department': 'bg-yellow-100 text-yellow-800',
    'private': 'bg-red-100 text-red-800'
  };
  
  return (
    <Badge className={colors[accessLevel as keyof typeof colors] || 'bg-gray-100 text-gray-800'}>
      {accessLevel.toUpperCase()}
    </Badge>
  );
};

export function FilesContentSection({ files, searchTerm, onSearchChange }: FilesContentSectionProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  return (
    <div className="lg:col-span-3 space-y-4">
      {/* Search and View Controls */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search files..."
                  value={searchTerm}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Files Grid/List */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {files.map((file) => (
            <Card key={file.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start space-x-3 mb-3">
                  {getFileIcon(file.type)}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 truncate">{file.name}</h3>
                    <p className="text-sm text-gray-600">{formatFileSize(file.size)}</p>
                  </div>
                </div>
                
                <div className="space-y-2 mb-4">
                  {getCategoryBadge(file.category)}
                  {getAccessBadge(file.accessLevel)}
                </div>
                
                <div className="text-xs text-gray-500 mb-4">
                  <p>Uploaded by: {file.uploadedBy}</p>
                  <p>{new Date(file.uploadedDate).toLocaleDateString()}</p>
                </div>
                
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {files.map((file) => (
            <Card key={file.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {getFileIcon(file.type)}
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{file.name}</h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span>{formatFileSize(file.size)}</span>
                        <span>Uploaded by {file.uploadedBy}</span>
                        <span>{new Date(file.uploadedDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    {getCategoryBadge(file.category)}
                    {getAccessBadge(file.accessLevel)}
                    <div className="flex space-x-1">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Share className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {files.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Folder className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No files found</h3>
            <p className="text-gray-600">
              {searchTerm ? 'Try adjusting your search terms' : 'Upload your first file to get started'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
