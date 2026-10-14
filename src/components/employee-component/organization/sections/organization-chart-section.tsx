import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building, User, Crown } from 'lucide-react';

export function OrganizationChartSection() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Building className="h-5 w-5" />
          <span>Organization Chart</span>
        </CardTitle>
        <CardDescription>Visual representation of company hierarchy</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* CEO Level */}
          <div className="flex justify-center">
            <div className="text-center">
              <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <Crown className="h-8 w-8 text-yellow-600" />
              </div>
              <p className="font-medium text-sm">CEO</p>
              <p className="text-xs text-gray-600">Mike Johnson</p>
            </div>
          </div>

          {/* Manager Level */}
          <div className="flex justify-center">
            <div className="flex space-x-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <User className="h-6 w-6 text-blue-600" />
                </div>
                <p className="font-medium text-sm">VP Engineering</p>
                <p className="text-xs text-gray-600">Mike Johnson</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <User className="h-6 w-6 text-blue-600" />
                </div>
                <p className="font-medium text-sm">VP Marketing</p>
                <p className="text-xs text-gray-600">Sarah Wilson</p>
              </div>
            </div>
          </div>

          {/* Employee Level */}
          <div className="flex justify-center">
            <div className="flex space-x-4">
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <User className="h-4 w-4 text-green-600" />
                </div>
                <p className="font-medium text-xs">Engineering Manager</p>
                <p className="text-xs text-gray-600">Jane Smith</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <User className="h-4 w-4 text-green-600" />
                </div>
                <p className="font-medium text-xs">Senior Developer</p>
                <p className="text-xs text-gray-600">John Doe</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
