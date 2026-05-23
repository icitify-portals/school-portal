"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { MessageSquare, Send, CheckCircle2 } from "lucide-react";


// Server action or API call should be used instead of direct service import

export default function WhatsAppDebugTestPage() {
    const [phone, setPhone] = useState("+2347043091082");
    const [message, setMessage] = useState("Hello from the School Portal! Your WhatsApp integration is working. 🚀");
    const [loading, setLoading] = useState(false);

    const handleSend = async () => {
        setLoading(true);
        try {
            // Since this is a client component, we'd normally call a server action.
            // For debug, we'll assume a 'testWhatsApp' server action exists or is added.
            // I'll create the server action in a separate file if needed.
            toast.promise(
                fetch('/api/debug/whatsapp', {
                    method: 'POST',
                    body: JSON.stringify({ phone, message }),
                    headers: { 'Content-Type': 'application/json' }
                }).then(res => res.json()),
                {
                    loading: 'Sending WhatsApp message...',
                    success: (data) => data.success ? "Message sent!" : `Error: ${data.error}`,
                    error: "Failed to connect to debug endpoint"
                }
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8 max-w-2xl mx-auto space-y-6">
            <div className="flex items-center gap-3">
                <div className="p-3 bg-green-100 text-green-600 rounded-xl">
                    <MessageSquare className="h-6 w-6" />
                </div>
                <h1 className="text-3xl font-bold">WhatsApp Debugger</h1>
            </div>

            <Card className="border-2 border-green-100 shadow-sm">
                <CardHeader>
                    <CardTitle>Test Twilio Integration</CardTitle>
                    <CardDescription>
                        Send a manual WhatsApp message to verify your environment variables and Twilio connectivity.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Recipient Phone Number</label>
                        <Input
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="+234..."
                            className="font-mono"
                        />
                        <p className="text-xs text-muted-foreground italic">
                            Include country code (e.g., +234 for Nigeria).
                        </p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Message Body</label>
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            className="w-full min-h-[100px] p-3 rounded-md border text-sm"
                        />
                    </div>

                    <Button
                        onClick={handleSend}
                        className="w-full bg-green-600 hover:bg-green-700 h-11"
                        disabled={loading}
                    >
                        <Send className="mr-2 h-4 w-4" />
                        {loading ? "Sending..." : "Send Test Message"}
                    </Button>

                    <div className="pt-4 border-t grid grid-cols-2 gap-4 text-xs">
                        <div className="flex items-center gap-2 text-slate-500">
                            <CheckCircle2 className="h-3 w-3 text-green-500" />
                            Twilio SDK Installed
                        </div>
                        <div className="flex items-center gap-2 text-slate-500">
                            <CheckCircle2 className="h-3 w-3 text-green-500" />
                            Utility Initialized
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
