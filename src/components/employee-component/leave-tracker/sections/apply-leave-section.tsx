import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { LEAVE_TYPES } from '@/lib/constants';

export function ApplyLeaveSection() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Plus className="h-5 w-5" />
          <span>Apply for Leave</span>
        </CardTitle>
        <CardDescription>Submit a new leave request</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Leave Type</label>
          <select className="w-full p-2 border border-gray-300 rounded-md">
            <option value="">Select leave type</option>
            {LEAVE_TYPES.map(type => (
              <option key={type.id} value={type.id}>{type.label}</option>
            ))}
          </select>
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Start Date</label>
            <input 
              type="date" 
              className="w-full p-2 border border-gray-300 rounded-md"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">End Date</label>
            <input 
              type="date" 
              className="w-full p-2 border border-gray-300 rounded-md"
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Reason</label>
          <textarea 
            className="w-full p-2 border border-gray-300 rounded-md h-20"
            placeholder="Enter reason for leave..."
          />
        </div>
        
        <Button className="w-full">Submit Request</Button>
      </CardContent>
    </Card>
  );
}
