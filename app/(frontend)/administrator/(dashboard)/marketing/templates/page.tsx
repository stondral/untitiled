"use client";

import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Layout,
  Plus,
  Search,
  Mail,
  Edit,
  Trash2,
  Code,
  RefreshCw
} from "lucide-react";
import Link from "next/link";

interface Template {
  id: string;
  name: string;
  subject: string;
  body: string;
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/email-templates?limit=100");
      const data = await res.json();
      setTemplates(data.docs || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const filteredTemplates = templates.filter(t => 
    t.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.subject?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this template?")) return;
    try {
      await fetch(`/api/email-templates/${id}`, { method: "DELETE" });
      fetchTemplates();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Layout className="w-6 h-6 text-indigo-500" />
            Email Templates
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Manage your outreach messages and automation templates.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline"
            onClick={async () => {
                await fetch("/api/marketing/seed-templates");
                fetchTemplates();
            }}
            className="border-slate-200 dark:border-slate-700"
          >
            <RefreshCw className="w-4 h-4 mr-2" /> Seed Defaults
          </Button>
          <Link href="/administrator/marketing/templates/new">
            <Button 
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
                <Plus className="w-4 h-4 mr-2" /> Create Template
            </Button>
          </Link>
        </div>
      </div>

      <Card className="border-slate-200 dark:border-slate-700/50 dark:bg-slate-800/30 overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700/50">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
          {loading ? (
            <div className="col-span-full py-20 text-center text-slate-500 flex flex-col items-center gap-2">
                <RefreshCw className="w-8 h-8 animate-spin text-indigo-500" />
                <span>Loading templates...</span>
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="col-span-full py-20 text-center text-slate-500">
                <Mail className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>No templates found.</p>
            </div>
          ) : (
            filteredTemplates.map((template) => (
              <Card key={template.id} className="group p-5 border-slate-200 dark:border-slate-700/50 hover:border-indigo-500/50 transition-all dark:bg-slate-800/50 flex flex-col justify-between">
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <div className="h-10 w-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                            <Code className="w-5 h-5" />
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Link href={`/administrator/marketing/templates/${template.id}/edit`}>
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-8 w-8 text-slate-400 hover:text-indigo-500"
                                >
                                    <Edit className="w-4 h-4" />
                                </Button>
                            </Link>
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => handleDelete(template.id)}
                                className="h-8 w-8 text-slate-400 hover:text-red-500"
                            >
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                    <h3 className="font-bold text-slate-900 dark:text-white truncate">{template.name}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">{template.subject}</p>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700/50">
                    <p className="text-[10px] text-slate-400 font-medium uppercase truncate italic">
                        &quot;{template.body?.substring(0, 50)}...&quot;
                    </p>
                </div>
              </Card>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
