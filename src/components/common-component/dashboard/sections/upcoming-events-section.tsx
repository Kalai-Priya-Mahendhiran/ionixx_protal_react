import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Plus } from 'lucide-react';
import { sampleEvents } from '@/lib/sample-data/dashboard-sample-data';
import { EVENT_TYPE_COLORS, DEFAULT_BADGE_COLOR } from '@/lib/constants';

export function UpcomingEventsSection() {
  return (
    <Card className="lg:col-span-2 border-0 shadow-xl">
      <CardHeader className="text-black rounded-t-lg">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>Upcoming Events</span>
          </div>
          <Button variant="outline" size="sm" className="bg-white/20 border-white/30 text-white hover:bg-white/30">
            <Plus className="h-4 w-4 mr-2" />
            Add Event
          </Button>
        </CardTitle>
        <CardDescription className="text-white/90">This week's important dates and meetings</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sampleEvents.map((event, index) => (
            <div key={index} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="w-12 h-12 ionixx_icon-gradient rounded-lg flex items-center justify-center">
                <Calendar className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900">{event.title}</h4>
                <p className="text-sm text-gray-600">{event.description}</p>
                <div className="flex items-center space-x-4 mt-2">
                  <span className="text-xs text-gray-500">{event.date}</span>
                  <span className="text-xs text-gray-500">{event.time}</span>
                  {event.location && (
                    <span className="text-xs text-gray-500">{event.location}</span>
                  )}
                </div>
              </div>
              <Badge className={EVENT_TYPE_COLORS[event.type] ?? DEFAULT_BADGE_COLOR}>
                {event.type}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
