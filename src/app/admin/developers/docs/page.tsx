"use client";

import React, { useEffect } from 'react';
import Head from 'next/head';

export default function ApiDocsPage({ nodeName = "Institutional" }: { nodeName?: string }) {
  
  useEffect(() => {
    // This effect ensures Swagger UI is initialized on the client side
    const script1 = document.createElement('script');
    script1.src = "https://cdn.jsdelivr.net/npm/swagger-ui-dist@latest/swagger-ui-bundle.js";
    script1.async = true;
    document.body.appendChild(script1);

    const script2 = document.createElement('script');
    script2.src = "https://cdn.jsdelivr.net/npm/swagger-ui-dist@latest/swagger-ui-standalone-preset.js";
    script2.async = true;
    document.body.appendChild(script2);

    script1.onload = () => {
        if ((window as any).SwaggerUIBundle) {
            (window as any).ui = (window as any).SwaggerUIBundle({
                url: '/api/openapi.json', // Path to the generated OpenAPI spec
                dom_id: '#swagger-ui',
                defaultModelsExpandDepth: 0,
                deepLinking: true,
                displayOperationId: true,
                tryItOutEnabled: true,
                persistAuthorization: true,
            });
        }
    };

    return () => {
        document.body.removeChild(script1);
        document.body.removeChild(script2);
    };
  }, []);

  return (
    <div className="bg-white min-h-screen">
      <Head>
        <title>{nodeName} API Documentation</title>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@latest/swagger-ui.css" />
      </Head>

      <div className="p-8 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
        <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black">API</div>
            <div>
                <h1 className="text-xl font-black text-slate-900 tracking-tight">{nodeName} Institutional APIs</h1>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Developer Reference & Sandbox</p>
            </div>
        </div>
        <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-black rounded-full uppercase">v4.0.0 (Next.js)</span>
        </div>
      </div>

      <div id="swagger-ui"></div>

      <style jsx global>{`
        .swagger-ui .topbar { display: none; }
        .swagger-ui .info { margin: 40px 0; }
        .swagger-ui .info .title { font-size: 32px; font-weight: 900; color: #0f172a; }
        .swagger-ui .opblock { border-radius: 16px; border: 1px solid #f1f5f9; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05); overflow: hidden; }
        .swagger-ui .opblock .opblock-summary { padding: 12px 20px; }
      `}</style>
    </div>
  );
}
