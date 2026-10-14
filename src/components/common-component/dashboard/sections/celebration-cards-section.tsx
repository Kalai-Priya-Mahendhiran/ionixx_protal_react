import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Cake } from 'lucide-react';
import { celebrationCards } from '@/lib/sample-data/dashboard-sample-data';
import { getIcon, CELEBRATION_STATUS_COLORS, DEFAULT_BADGE_COLOR } from '@/lib/constants';

export function CelebrationCardsSection() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {celebrationCards.map((card, index) => {
        const Icon = getIcon(card.icon, Cake);
        return (
          <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <CardHeader className="rounded-t-lg">
              <CardTitle className="flex items-center space-x-2 text-black">
                <Icon className={`h-5 w-5 ${card.color}`} />
                <span>{card.title}</span>
              </CardTitle>
              <CardDescription className="text-black">{card.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {card.items.map((item, itemIndex) => (
                  <div key={itemIndex} className="flex items-center space-x-4 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center">
                      <Icon className={`h-5 w-5 ${card.color}`} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{item.name}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-xs text-gray-500">{item.date}</span>
                        {item.years && (
                          <span className="text-xs text-gray-500">• {item.years}</span>
                        )}
                      </div>
                    </div>
                    <Badge className={CELEBRATION_STATUS_COLORS[item.status] ?? DEFAULT_BADGE_COLOR}>
                      {item.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
