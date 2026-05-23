
import { getConversations, getMessages } from "@/actions/communication";
import { auth } from "@/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
    MessageSquare, 
    Send, 
    User, 
    Search,
    Plus,
    Circle,
    Paperclip
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";

export default async function ParentMessagesPage() {
    const session = await auth();
    if (!session?.user) return <div>Unauthorized</div>;

    const conversations = await getConversations();

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 h-[calc(100vh-120px)] flex flex-col">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Parent-Teacher <span className="text-indigo-600">Sync</span></h1>
                    <p className="text-slate-500 font-medium">Private messaging and institutional communication portal.</p>
                </div>
                <Button className="bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200 h-12 px-6 rounded-2xl font-bold">
                    <Plus className="w-5 h-5 mr-2" />
                    New Message
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-1 overflow-hidden">
                {/* Conversation List */}
                <Card className="lg:col-span-1 border-none shadow-xl shadow-slate-200/50 rounded-[2.5rem] overflow-hidden flex flex-col">
                    <CardHeader className="p-6 border-b border-slate-50 bg-slate-50/50">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input 
                                type="text" 
                                placeholder="Search messages..." 
                                className="w-full bg-white border-none rounded-xl pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 shadow-sm"
                            />
                        </div>
                    </CardHeader>
                    <CardContent className="p-0 overflow-y-auto flex-1">
                        <div className="divide-y divide-slate-50">
                            {conversations.map((conv) => {
                                const otherParticipant = conv.conversation.participants.find(p => p.userId !== parseInt(session?.user?.id || "0"));
                                return (
                                    <div key={conv.id} className="p-6 hover:bg-indigo-50/50 transition-colors cursor-pointer group relative">
                                        <div className="flex gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold shadow-sm">
                                                {otherParticipant?.user?.name?.[0] || <User className="w-6 h-6" />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start mb-1">
                                                    <h4 className="text-sm font-black text-slate-900 truncate">
                                                        {otherParticipant?.user?.name || "Support"}
                                                    </h4>
                                                    <span className="text-[10px] font-bold text-slate-400">
                                                        {conv.conversation.lastMessageAt ? formatDistanceToNow(new Date(conv.conversation.lastMessageAt), { addSuffix: false }) : 'New'}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-slate-500 truncate font-medium">
                                                    View conversation...
                                                </p>
                                            </div>
                                        </div>
                                        {!conv.lastReadAt && (
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                                <Circle className="w-2 h-2 fill-indigo-600 text-indigo-600" />
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                            {conversations.length === 0 && (
                                <div className="p-12 text-center">
                                    <MessageSquare className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                                    <p className="text-sm text-slate-400 font-medium">No messages yet.</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Message View (Mocked placeholder) */}
                <Card className="lg:col-span-2 border-none shadow-xl shadow-slate-200/50 rounded-[2.5rem] overflow-hidden flex flex-col bg-white">
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-12 bg-slate-50/30">
                        <div className="w-20 h-20 bg-white rounded-3xl shadow-xl flex items-center justify-center text-indigo-600 mb-6">
                            <MessageSquare className="w-10 h-10" />
                        </div>
                        <h2 className="text-2xl font-black text-slate-900">Select a conversation</h2>
                        <p className="text-slate-500 max-w-xs mt-2 font-medium">
                            Choose a thread from the left to start communicating with teachers or school administrators.
                        </p>
                    </div>
                    
                    {/* Bottom Input Area */}
                    <div className="p-6 bg-white border-t border-slate-50">
                        <div className="flex gap-4 items-center bg-slate-50 rounded-2xl p-2 pl-4">
                            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-slate-400">
                                <Paperclip className="w-5 h-5" />
                            </Button>
                            <input 
                                type="text" 
                                placeholder="Type your message here..." 
                                className="flex-1 bg-transparent border-none focus:ring-0 text-sm font-medium py-3"
                            />
                            <Button className="bg-indigo-600 hover:bg-indigo-700 h-10 w-10 rounded-xl p-0 shadow-lg shadow-indigo-200 transition-transform active:scale-90">
                                <Send className="w-5 h-5 text-white" />
                            </Button>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
}
