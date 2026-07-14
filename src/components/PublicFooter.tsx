"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ShieldCheck, Facebook, Twitter, Instagram, Linkedin, Mail, Phone, MapPin } from "lucide-react";
import { getMenusBySlot } from "@/actions/cms";

export function PublicFooter() {
    const [footerMenus, setFooterMenus] = useState<any[]>([]);

    useEffect(() => {
        getMenusBySlot('footer').then(res => {
            if (res.success && res.data) setFooterMenus(res.data);
        });
    }, []);

    // Group footer menus: first item is treated as a column group (label = heading, children = links)
    // If items have children, render as columns. Otherwise render as a flat row.
    const hasColumns = footerMenus.some(m => m.children && m.children.length > 0);

    return (
        <footer
            className="text-white pt-20 pb-10"
            style={{ backgroundColor: 'var(--brand-secondary, #0f172a)' }}
        >
            <div className="max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
                    {/* Brand Section — always shown */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-2">
                            <div className="p-1 bg-white/10 rounded-xl">
                                <img src="/fss_logo.png" alt="FSS Logo" className="w-8 h-8 object-contain" />
                            </div>
                            <span className="text-xl font-black tracking-tighter uppercase italic">
                                FSS<span className="text-indigo-400">Portal</span>
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

                    {/* CMS-managed footer columns */}
                    {footerMenus.length > 0 ? (
                        hasColumns ? (
                            // Each root item is a column with a heading and child links
                            footerMenus.slice(0, 3).map(col => (
                                <div key={col.id}>
                                    <h3 className="text-lg font-bold mb-6 uppercase tracking-widest text-[11px] text-indigo-400">
                                        {col.label}
                                    </h3>
                                    <ul className="space-y-4 text-sm text-slate-400">
                                        {col.children?.map((link: any) => (
                                            <li key={link.id}>
                                                <Link href={link.href} className="hover:text-white transition-colors">
                                                    {link.label}
                                                </Link>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))
                        ) : null
                    ) : (
                        // Fallback static columns when no footer CMS menus
                        <>
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

                            <div>
                                <h3 className="text-lg font-bold mb-6 uppercase tracking-widest text-[11px] text-indigo-400">Contact Us</h3>
                                <ul className="space-y-6 text-sm">
                                    <li className="flex gap-4">
                                        <div className="p-2 bg-white/5 rounded-lg h-fit text-indigo-400 mt-1">
                                            <MapPin className="w-4 h-4" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="font-semibold text-slate-300">Contact us:</span>
                                            <span className="text-slate-400">Federal School of Statistics, Along Ajibode Shasha road, Behind NISER, Shasha-Ojoo, Ibadan.</span>
                                            
                                            <span className="font-semibold text-slate-300 mt-2">Postal address:</span>
                                            <span className="text-slate-400">P. O. 20753 University of Ibadan Post office</span>
                                        </div>
                                    </li>
                                    <li className="flex gap-4">
                                        <div className="p-2 bg-white/5 rounded-lg h-fit text-indigo-400 mt-1">
                                            <Phone className="w-4 h-4" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-slate-400">+234 708 180 8456</span>
                                            <span className="text-slate-400">+234 703 651 6563</span>
                                        </div>
                                    </li>
                                    <li className="flex gap-4">
                                        <div className="p-2 bg-white/5 rounded-lg h-fit text-indigo-400 mt-1">
                                            <Mail className="w-4 h-4" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-slate-400">info@fssibadan.edu.ng</span>
                                            <span className="text-slate-400">fssibadan@gmail.com</span>
                                        </div>
                                    </li>
                                </ul>
                            </div>
                        </>
                    )}
                </div>

                {/* Bottom bar */}
                <div className="border-t border-white/5 pt-10 flex flex-col md:flex-row justify-between items-center gap-6">
                    <p className="text-slate-500 text-xs">
                        &copy; {new Date().getFullYear()} FSSPortal Management System. All rights reserved.
                    </p>
                    <div className="flex gap-8 text-xs text-slate-500 font-bold uppercase tracking-widest">
                        {/* Flat footer links with no children */}
                        {footerMenus.filter(m => !m.children?.length).map(item => (
                            <Link key={item.id} href={item.href} className="hover:text-indigo-400 transition-colors">
                                {item.label}
                            </Link>
                        ))}
                        {/* Fallback legal links if none set */}
                        {footerMenus.filter(m => !m.children?.length).length === 0 && (
                            <>
                                <Link href="#" className="hover:text-indigo-400">Privacy Policy</Link>
                                <Link href="#" className="hover:text-indigo-400">Terms of Service</Link>
                                <Link href="#" className="hover:text-indigo-400">Cookie Policy</Link>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </footer>
    );
}
