import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./card";

interface FormLayoutProps {
  children: React.ReactNode;
  title: string;
  description: string;
}

const FormLayout: React.FC<FormLayoutProps> = ({ children, title, description }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-600 to-violet-600 p-4 relative">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.15)_1px,transparent_0)] bg-[length:20px_20px]"></div>
      </div>
      
      {/* Main Content */}
      <div className="relative w-full max-w-md">
        {/* Company Logo/Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl shadow-lg mb-4">
            <span className="text-2xl font-bold text-[#3FCCE8]">Ix</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Ionixx Portal</h1>
          <p className="text-purple-200">Employee Management System</p>
        </div>

        {/* Login Card */}
        <Card className="backdrop-blur-sm bg-white/95 shadow-2xl border-0">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-2xl font-bold text-center text-gray-900">{title}</CardTitle>
            <CardDescription className="text-center text-gray-600">{description}</CardDescription>
          </CardHeader>
          <CardContent>
            {children}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-purple-200 text-sm">
            Â© 2026 Ionixx Technologies. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default FormLayout;
