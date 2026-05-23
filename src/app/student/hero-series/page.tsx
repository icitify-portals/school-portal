"use client";

import { useState, useEffect } from "react";
import { 
    Calculator, 
    Type, 
    Trophy, 
    Star, 
    Heart, 
    Zap, 
    Play, 
    RotateCcw,
    CheckCircle2,
    XCircle,
    ArrowRight
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function HeroSeriesPage() {
    const [game, setGame] = useState<'math' | 'spelling' | null>(null);

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-12">
            {!game ? (
                <>
                    <div className="text-center space-y-4">
                        <h1 className="text-5xl font-black text-slate-900 tracking-tight">Hero <span className="text-indigo-600">Series</span></h1>
                        <p className="text-xl text-slate-500 font-medium italic">Level up your skills and become a learning legend!</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8">
                        {/* Multiplication Hero */}
                        <Card className="group border-none shadow-2xl shadow-indigo-500/5 rounded-[3rem] overflow-hidden hover:scale-[1.02] transition-all duration-500">
                            <div className="h-48 bg-indigo-600 relative overflow-hidden flex items-center justify-center">
                                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20" />
                                <Calculator className="w-24 h-24 text-white/90 group-hover:rotate-12 transition-transform duration-700" />
                                <div className="absolute top-6 right-6">
                                    <Badge className="bg-white/20 text-white border-none py-2 px-4 rounded-xl backdrop-blur-md font-black">Level 1: Novice</Badge>
                                </div>
                            </div>
                            <CardContent className="p-10 space-y-6">
                                <div className="space-y-2">
                                    <h2 className="text-3xl font-black text-slate-900">Times Table Hero</h2>
                                    <p className="text-slate-500 font-medium">Master multiplication through rapid-fire challenges and unlock special power-ups!</p>
                                </div>
                                <Button 
                                    onClick={() => setGame('math')}
                                    className="w-full py-8 rounded-[1.5rem] bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-200 text-lg font-black uppercase tracking-widest"
                                >
                                    <Play className="w-5 h-5 mr-2 fill-current" /> Start Mission
                                </Button>
                            </CardContent>
                        </Card>

                        {/* Spelling Hero */}
                        <Card className="group border-none shadow-2xl shadow-rose-500/5 rounded-[3rem] overflow-hidden hover:scale-[1.02] transition-all duration-500">
                            <div className="h-48 bg-rose-600 relative overflow-hidden flex items-center justify-center">
                                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20" />
                                <Type className="w-24 h-24 text-white/90 group-hover:-rotate-12 transition-transform duration-700" />
                                <div className="absolute top-6 right-6">
                                    <Badge className="bg-white/20 text-white border-none py-2 px-4 rounded-xl backdrop-blur-md font-black">Level 1: Novice</Badge>
                                </div>
                            </div>
                            <CardContent className="p-10 space-y-6">
                                <div className="space-y-2">
                                    <h2 className="text-3xl font-black text-slate-900">Spelling Hero</h2>
                                    <p className="text-slate-500 font-medium">Conquer the world of words. Listen, type, and earn sessional glory!</p>
                                </div>
                                <Button 
                                    onClick={() => setGame('spelling')}
                                    className="w-full py-8 rounded-[1.5rem] bg-rose-600 hover:bg-rose-700 shadow-xl shadow-rose-200 text-lg font-black uppercase tracking-widest"
                                >
                                    <Play className="w-5 h-5 mr-2 fill-current" /> Start Mission
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </>
            ) : game === 'math' ? (
                <MathHero onBack={() => setGame(null)} />
            ) : (
                <SpellingHero onBack={() => setGame(null)} />
            )}
        </div>
    );
}

function MathHero({ onBack }: { onBack: () => void }) {
    const [num1, setNum1] = useState(0);
    const [num2, setNum2] = useState(0);
    const [answer, setAnswer] = useState("");
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(3);
    const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
    const [combo, setCombo] = useState(0);

    const generateProblem = () => {
        setNum1(Math.floor(Math.random() * 12) + 1);
        setNum2(Math.floor(Math.random() * 12) + 1);
        setAnswer("");
        setFeedback(null);
    };

    useEffect(() => generateProblem(), []);

    const checkAnswer = (e: React.FormEvent) => {
        e.preventDefault();
        const correct = num1 * num2;
        if (parseInt(answer) === correct) {
            setScore(s => s + (10 * (combo + 1)));
            setCombo(c => c + 1);
            setFeedback('correct');
            setTimeout(generateProblem, 1000);
        } else {
            setLives(l => l - 1);
            setCombo(0);
            setFeedback('wrong');
            if (lives <= 1) {
                // Game Over logic
            }
        }
    };

    return (
        <div className="max-w-xl mx-auto space-y-8 animate-in fade-in zoom-in duration-500">
            <div className="flex justify-between items-center bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/50">
                <Button variant="ghost" size="sm" onClick={onBack} className="text-slate-400 font-black uppercase text-[10px]">Exit Mission</Button>
                <div className="flex items-center gap-6">
                    <div className="text-right">
                        <p className="text-[10px] font-black uppercase text-slate-400">Score</p>
                        <p className="text-2xl font-black text-indigo-600">{score}</p>
                    </div>
                    <div className="flex gap-1">
                        {[...Array(3)].map((_, i) => (
                            <Heart key={i} className={cn("w-5 h-5", i < lives ? "text-rose-500 fill-rose-500" : "text-slate-200")} />
                        ))}
                    </div>
                </div>
            </div>

            <Card className="border-none shadow-2xl shadow-indigo-500/10 rounded-[3rem] overflow-hidden text-center p-12 space-y-12 bg-white relative">
                {combo > 1 && (
                    <div className="absolute top-8 left-1/2 -translate-x-1/2 animate-bounce">
                        <Badge className="bg-amber-100 text-amber-600 border-amber-200 px-6 py-2 rounded-full text-lg font-black uppercase italic">
                            <Zap className="w-5 h-5 mr-2 fill-current" /> {combo}x Combo!
                        </Badge>
                    </div>
                )}
                
                <div className="flex justify-center items-center gap-8 text-7xl font-black text-slate-900">
                    <div className="w-32 h-32 bg-slate-50 rounded-3xl flex items-center justify-center">{num1}</div>
                    <XCircle className="w-12 h-12 text-slate-300" />
                    <div className="w-32 h-32 bg-slate-50 rounded-3xl flex items-center justify-center">{num2}</div>
                </div>

                <form onSubmit={checkAnswer} className="space-y-6">
                    <input 
                        type="number" 
                        autoFocus
                        value={answer}
                        onChange={(e) => setAnswer(e.target.value)}
                        className={cn(
                            "w-full text-6xl font-black text-center py-8 rounded-[2rem] bg-slate-50 border-4 outline-none transition-all",
                            feedback === 'correct' ? "border-emerald-400 bg-emerald-50 text-emerald-600" :
                            feedback === 'wrong' ? "border-rose-400 bg-rose-50 text-rose-600" : "border-slate-100 focus:border-indigo-600"
                        )}
                        placeholder="?"
                    />
                    <Button 
                        type="submit"
                        className="w-full py-8 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-xl font-black uppercase tracking-widest shadow-xl shadow-indigo-200"
                    >
                        Verify Answer
                    </Button>
                </form>
            </Card>
        </div>
    );
}

function SpellingHero({ onBack }: { onBack: () => void }) {
    const words = ["Education", "Curriculum", "Nigeria", "Knowledge", "Leadership", "Technology", "Innovation", "Academic"];
    const [word, setWord] = useState("");
    const [userInput, setUserInput] = useState("");
    const [score, setScore] = useState(0);
    const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);

    const pickWord = () => {
        setWord(words[Math.floor(Math.random() * words.length)]);
        setUserInput("");
        setFeedback(null);
    };

    useEffect(() => pickWord(), []);

    const speak = () => {
        if (!window.speechSynthesis) return;
        const utterance = new SpeechSynthesisUtterance(word);
        utterance.rate = 0.8;
        window.speechSynthesis.speak(utterance);
    };

    const checkSpelling = (e: React.FormEvent) => {
        e.preventDefault();
        if (userInput.toLowerCase() === word.toLowerCase()) {
            setScore(s => s + 50);
            setFeedback('correct');
            setTimeout(pickWord, 1500);
        } else {
            setFeedback('wrong');
        }
    };

    return (
        <div className="max-w-xl mx-auto space-y-8 animate-in fade-in zoom-in duration-500">
            <div className="flex justify-between items-center bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/50">
                <Button variant="ghost" size="sm" onClick={onBack} className="text-slate-400 font-black uppercase text-[10px]">Exit Mission</Button>
                <div className="text-right">
                    <p className="text-[10px] font-black uppercase text-slate-400">Score</p>
                    <p className="text-2xl font-black text-rose-600">{score}</p>
                </div>
            </div>

            <Card className="border-none shadow-2xl shadow-rose-500/10 rounded-[3rem] overflow-hidden text-center p-12 space-y-12 bg-white">
                <div className="space-y-6">
                    <div className="w-24 h-24 bg-rose-100 rounded-full flex items-center justify-center mx-auto text-rose-600 cursor-pointer hover:scale-110 transition-transform shadow-lg shadow-rose-100" onClick={speak}>
                        <Play className="w-10 h-10 fill-current" />
                    </div>
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-sm">Click the button to hear the word</p>
                </div>

                <form onSubmit={checkSpelling} className="space-y-6">
                    <input 
                        type="text" 
                        autoFocus
                        autoComplete="off"
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        className={cn(
                            "w-full text-4xl font-black text-center py-8 rounded-[2rem] bg-slate-50 border-4 outline-none transition-all uppercase tracking-widest",
                            feedback === 'correct' ? "border-emerald-400 bg-emerald-50 text-emerald-600" :
                            feedback === 'wrong' ? "border-rose-400 bg-rose-50 text-rose-600" : "border-slate-100 focus:border-rose-600"
                        )}
                        placeholder="Type Word"
                    />
                    <div className="flex gap-4">
                        <Button 
                            type="button"
                            onClick={speak}
                            variant="outline"
                            className="flex-1 py-8 rounded-2xl border-2 font-black uppercase tracking-widest"
                        >
                            Repeat Word
                        </Button>
                        <Button 
                            type="submit"
                            className="flex-[2] py-8 rounded-2xl bg-rose-600 hover:bg-rose-700 text-xl font-black uppercase tracking-widest shadow-xl shadow-rose-200"
                        >
                            Submit
                        </Button>
                    </div>
                </form>

                {feedback === 'correct' && (
                    <div className="flex items-center justify-center gap-3 text-emerald-600 animate-bounce">
                        <Star className="w-6 h-6 fill-current" />
                        <span className="text-xl font-black uppercase">Legendary!</span>
                        <Star className="w-6 h-6 fill-current" />
                    </div>
                )}
            </Card>
        </div>
    );
}
