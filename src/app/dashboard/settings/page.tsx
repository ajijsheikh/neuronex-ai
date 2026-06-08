"use client";

import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Brain, User, Shield, Bell, Palette, Key } from "lucide-react";

export default function SettingsPage() {
  const { user } = useAuth();

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-4xl mx-auto pb-24 md:pb-6">
      <div>
        <h1 className="text-xl font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your account and preferences.</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm">Profile</CardTitle>
          </div>
          <CardDescription className="text-xs">Your account information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Email</label>
              <Input value={user?.email || ""} readOnly className="text-sm bg-muted/50" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">User ID</label>
              <Input value={user?.uid || ""} readOnly className="text-sm bg-muted/50 text-muted-foreground" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Palette className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm">Appearance</CardTitle>
          </div>
          <CardDescription className="text-xs">Customize your experience</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm">Theme</p>
              <p className="text-xs text-muted-foreground">Dark mode is enabled</p>
            </div>
            <Button variant="outline" size="sm" className="text-xs" disabled>
              Dark Mode
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Key className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm">API Configuration</CardTitle>
          </div>
          <CardDescription className="text-xs">Integration keys for AI services</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">Gemini API Key</label>
            <Input type="password" value="••••••••" readOnly className="text-sm bg-muted/50 font-mono" />
          </div>
          <p className="text-xs text-muted-foreground">
            API keys are configured via environment variables. Contact your administrator to update them.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm">Data & Privacy</CardTitle>
          </div>
          <CardDescription className="text-xs">Manage your data</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm">Export All Data</p>
              <p className="text-xs text-muted-foreground">Download your documents and graph data</p>
            </div>
            <Button variant="outline" size="sm" className="text-xs" disabled>
              Export
            </Button>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-destructive">Delete Account</p>
              <p className="text-xs text-muted-foreground">Permanently delete all your data</p>
            </div>
            <Button variant="outline" size="sm" className="text-xs text-destructive border-destructive/30" disabled>
              Delete
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-2 justify-center text-xs text-muted-foreground pt-4">
        <Brain className="h-3 w-3" />
        <span>NEURONEX v0.1.0</span>
      </div>
    </div>
  );
}
