import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export interface FileCategory {
  id: string;
  label: string;
  count: number;
}

interface CategoriesSidebarSectionProps {
  categories: FileCategory[];
  selectedCategory: string;
  onSelectCategory: (categoryId: string) => void;
}

export function CategoriesSidebarSection({ categories, selectedCategory, onSelectCategory }: CategoriesSidebarSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Categories</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => onSelectCategory(category.id)}
              className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition-colors ${
                selectedCategory === category.id
                  ? 'bg-blue-100 text-blue-900'
                  : 'hover:bg-gray-100'
              }`}
            >
              <span className="text-sm font-medium">{category.label}</span>
              <Badge variant="outline" className="text-xs">
                {category.count}
              </Badge>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
