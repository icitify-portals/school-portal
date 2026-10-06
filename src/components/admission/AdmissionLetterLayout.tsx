"use client";

import React from "react";

interface AdmissionLetterLayoutProps {
    headerHtml?: string;
    bodyHtml: string;
    footerHtml?: string;
    css?: string;
    className?: string;
}

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
            {/* No default header. AdmissionLetterService.generateLetter returns the
                template verbatim, letterhead included, so falling back here stacked a
                second letterhead - and a second "Admission Letter" title - on top of
                the real one. A header is only rendered when the caller supplies one. */}
            {headerHtml ? (
                <div dangerouslySetInnerHTML={{ __html: headerHtml }} />
            ) : null}
            <div dangerouslySetInnerHTML={{ __html: bodyHtml }} />
            {/* The footer keeps its default: the four active templates end at
                "Accept my congratulations" and carry no signature block of their own,
                so this is the only Registrar line they receive. */}
            <div
                dangerouslySetInnerHTML={{
                    __html: footerHtml || DEFAULT_FOOTER,
                }}
            />
        </div>
    );
}

export { DEFAULT_FOOTER };