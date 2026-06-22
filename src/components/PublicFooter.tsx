"use client";

import Link from "next/link";
import { ShieldCheck, Facebook, Twitter, Instagram, Linkedin, Mail, Phone, MapPin } from "lucide-react";

export function PublicFooter() {
    return (
        <footer 
            className="text-white pt-20 pb-10"
            style={{ backgroundColor: 'var(--brand-secondary, #0f172a)' }}
        >
            <div className="max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
                    {/* Brand Section */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-indigo-600 rounded-xl">
                                <ShieldCheck className="w-6 h-6 text-white" />
                            </div>
                            <span className="text-xl font-black tracking-tighter uppercase italic">
                                School<span className="text-indigo-400">Portal</span>
                            </span>
                        </div>
                        <p className="text-slate-400 leading-relaxed text-sm">
                            Empowering the future through digital innovation in education. Our comprehensive management system streamlines operations for students and faculty alike.
                        </p>
                        <div className="flex items-center gap-4">
                            {[Facebook, Twitter, Instagram, Linkedin].map((Icon, i) => (
                                <Link key={i} href="#" className="p-2 bg-white/5 rounded-lg hover:bg-indigo-600 transition-colors">
                                    <Icon className="w-4 h-4" />
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className="text-lg font-bold mb-6 uppercase tracking-widest text-[11px] text-indigo-400">Quick Links</h3>
                        <ul className="space-y-4 text-sm text-slate-400">
                            {['About Us', 'Admissions', 'Programmes', 'Student Portal', 'Faculty Support', 'Career Center'].map((link) => (
                                <li key={link}>
                                    <Link href="#" className="hover:text-white transition-colors">{link}</Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Resources */}
                    <div>
                        <h3 className="text-lg font-bold mb-6 uppercase tracking-widest text-[11px] text-indigo-400">Resources</h3>
                        <ul className="space-y-4 text-sm text-slate-400">
                            {['Academic Calendar', 'Fees & Payments', 'Library', 'E-Learning', 'Research', 'Alumni'].map((link) => (
                                <li key={link}>
                                    <Link href="#" className="hover:text-white transition-colors">{link}</Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Contact Info */}
                    <div>
                        <h3 className="text-lg font-bold mb-6 uppercase tracking-widest text-[11px] text-indigo-400">Contact Us</h3>
                        <ul className="space-y-6 text-sm">
                            <li className="flex gap-4">
                                <div className="p-2 bg-white/5 rounded-lg h-fit text-indigo-400">
                                    <MapPin className="w-4 h-4" />
                                </div>
                                <span className="text-slate-400">123 Education Boulevard, Academic City, State 90210</span>
                            </li>
                            <li className="flex gap-4">
                                <div className="p-2 bg-white/5 rounded-lg h-fit text-indigo-400">
                                    <Phone className="w-4 h-4" />
                                </div>
                                <span className="text-slate-400">+1 (555) 123-4567</span>
                            </li>
                            <li className="flex gap-4">
                                <div className="p-2 bg-white/5 rounded-lg h-fit text-indigo-400">
                                    <Mail className="w-4 h-4" />
                                </div>
                                <span className="text-slate-400">info@schoolportal.edu</span>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-white/5 pt-10 flex flex-col md:flex-row justify-between items-center gap-6">
                    <p className="text-slate-500 text-xs">
                        &copy; {new Date().getFullYear()} SchoolPortal Management System. All rights reserved.
                    </p>
                    <div className="flex gap-8 text-xs text-slate-500 font-bold uppercase tracking-widest">
                        <Link href="#" className="hover:text-indigo-400">Privacy Policy</Link>
                        <Link href="#" className="hover:text-indigo-400">Terms of Service</Link>
                        <Link href="#" className="hover:text-indigo-400">Cookie Policy</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
