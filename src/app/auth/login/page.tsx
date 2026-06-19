"use client";

import { signInWithMicrosoft } from "@/app/auth/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen } from "lucide-react";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-600">
            <BookOpen className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-blue-900">ICON Casebook</CardTitle>
          <CardDescription className="text-gray-600">
            IIM Bangalore Consulting Club Casebook Platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={signInWithMicrosoft} className="space-y-4">
            <Button type="submit" className="w-full bg-[#2f2f2f] hover:bg-[#1a1a1a] text-white">
              <svg className="mr-2 h-5 w-5" viewBox="0 0 21 21" fill="none">
                <rect x="1" y="1" width="9" height="9" fill="#F25022" />
                <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
                <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
                <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
              </svg>
              Sign in with Microsoft
            </Button>
            <p className="text-xs text-center text-gray-500">
              Use your @iimb.ac.in Microsoft account to sign in.
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
