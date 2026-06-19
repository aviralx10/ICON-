"use client";

import { useState } from "react";
import { signInWithEmail } from "@/app/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { IIMB_EMAIL_DOMAIN } from "@/lib/constants";
import { BookOpen, Mail } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (!email.endsWith(IIMB_EMAIL_DOMAIN)) {
      setError("Only @iimb.ac.in email addresses are allowed");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.set("email", email);

      const result = await signInWithEmail(formData);

      if (result.error) {
        setError(result.error);
      } else {
        setSuccess(true);
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

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
          {success ? (
            <div className="rounded-lg bg-green-50 border border-green-200 p-4 text-center">
              <Mail className="mx-auto h-8 w-8 text-green-600 mb-2" />
              <h3 className="font-semibold text-green-800">Check your email</h3>
              <p className="text-sm text-green-700 mt-1">
                We sent a magic link to <strong>{email}</strong>. Click it to sign in.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-gray-700">
                  IIMB Email Address
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="yourname@iimb.ac.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full"
                />
              </div>

              {error && (
                <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={loading}>
                {loading ? "Sending..." : "Send Magic Link"}
              </Button>

              <p className="text-xs text-center text-gray-500">
                Sign in with your @iimb.ac.in email. No password needed.
              </p>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
