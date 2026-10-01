"use client";

import React from "react";

interface AdmissionLetterLayoutProps {
    headerHtml?: string;
    bodyHtml: string;
    footerHtml?: string;
    css?: string;
    className?: string;
}

const DEFAULT_HEADER = `
<div style="text-align:center; border-bottom: 3px solid #1e3a5f; padding-bottom: 16px; margin-bottom: 24px;">
    <h1 style="font-size: 22px; font-weight: 900; color: #1e3a5f; margin: 0; text-transform: uppercase; letter-spacing: 2px;">
        Federal School of Statistics, Ibadan
    </h1>
    <p style="font-size: 12px; color: #64748b; margin: 4px 0 0 0; letter-spacing: 1px;">
        P.M.B. 1017, Ibadan, Oyo State, Nigeria
    </p>
    <p style="font-size: 14px; font-weight: 700; color: #1e3a5f; margin: 12px 0 0 0; text-transform: uppercase; letter-spacing: 3px;">
        Admission Letter
    </p>
</div>`;

const DEFAULT_FOOTER = `
<div style="margin-top: 40px; display: flex; justify-content: space-between; align-items: flex-end;">
    <div>
        <p style="font-size: 11px; color: #94a3b8; margin: 0;">This is a computer-generated document.</p>
        <p style="font-size: 11px; color: #94a3b8; margin: 2px 0 0 0;">No signature is required.</p>
    </div>
    <div style="text-align: center;">
        <div style="width: 160px; border-top: 2px solid #1e3a5f; margin: 0 auto 4px auto;"></div>
        <p style="font-size: 12px; font-weight: 700; color: #1e3a5f; margin: 0;">Registrar</p>
    </div>
</div>`;

export default function AdmissionLetterLayout({
    headerHtml,
    bodyHtml,
    footerHtml,
    css,
    className = "",
}: AdmissionLetterLayoutProps) {
    return (
        <div
            className={`admission-letter-layout ${className}`}
            style={{
                fontFamily: "'Georgia', 'Times New Roman', serif",
                color: "#1e293b",
                lineHeight: 1.6,
                fontSize: "13px",
            }}
        >
            {css && <style dangerouslySetInnerHTML={{ __html: css }} />}
            <div
                dangerouslySetInnerHTML={{
                    __html: headerHtml || DEFAULT_HEADER,
                }}
            />
            <div dangerouslySetInnerHTML={{ __html: bodyHtml }} />
            <div
                dangerouslySetInnerHTML={{
                    __html: footerHtml || DEFAULT_FOOTER,
                }}
            />
        </div>
    );
}

export { DEFAULT_HEADER, DEFAULT_FOOTER };