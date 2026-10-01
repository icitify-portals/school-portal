"use client";

import React from "react";

interface IDCardTemplate1Props {
    studentName: string;
    matricNumber: string;
    department: string;
    phoneNumber?: string;
    bloodGroup?: string;
    genotype?: string;
    photoUrl?: string;
    signatureUrl?: string;
    institutionName?: string;
    campusAddress?: string;
    showWatermark?: boolean;
    side?: "front" | "back" | "both";
}

const DEFAULTS = {
    institutionName: "FEDERAL SCHOOL OF STATISTICS",
    campusAddress: "SAMPLE CAMPUS ADDRESS, IBADAN",
    postalAddress: "P.O. BOX 0000, IBADAN",
    phone: "08000000000",
    bloodGroup: "A+",
    genotype: "AA",
};

export default function IDCardTemplate1({
    studentName = "STUDENT NAME",
    matricNumber = "ACC/FSS/TB/2024/000000",
    department = "ACCOUNTANCY",
    phoneNumber,
    bloodGroup,
    genotype,
    photoUrl,
    signatureUrl,
    institutionName = DEFAULTS.institutionName,
    campusAddress = DEFAULTS.campusAddress,
    showWatermark = true,
    side = "both",
}: IDCardTemplate1Props) {
    const showFront = side === "front" || side === "both";
    const showBack = side === "back" || side === "both";

    return (
        <div className="id-card-template-1" style={{ fontFamily: "Arial, Helvetica, sans-serif" }}>
            <style>{`
                .id-card-template-1 * { box-sizing: border-box; margin: 0; padding: 0; }

                .id-card-t1 {
                    position: relative;
                    width: 500px;
                    height: 315px;
                    overflow: hidden;
                    border-radius: 17px;
                    background: white;
                    box-shadow: 0 8px 25px rgba(0,0,0,.18);
                    border: 1px solid #ccc;
                    display: inline-block;
                    vertical-align: top;
                    margin: 10px;
                }

                /* ── FRONT ── */
                .id-card-t1 .front-top {
                    height: 112px;
                    padding: 15px 20px;
                    display: flex;
                    align-items: center;
                    gap: 15px;
                    background: linear-gradient(135deg, #a8c947, #d5dd68);
                }

                .id-card-t1 .t1-logo {
                    width: 72px;
                    height: 72px;
                    border-radius: 50%;
                    background: rgba(255,255,255,.9);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #157542;
                    font-weight: 900;
                    font-size: 26px;
                    border: 2px solid rgba(255,255,255,.8);
                    flex-shrink: 0;
                }

                .id-card-t1 .school-header {
                    flex: 1;
                    text-align: center;
                }

                .id-card-t1 .school-header h2 {
                    margin: 0;
                    color: white;
                    font-size: 22px;
                    line-height: 1.1;
                    letter-spacing: .4px;
                }

                .id-card-t1 .school-header .sub {
                    margin-top: 7px;
                    color: #f4f4f4;
                    font-size: 11px;
                    line-height: 1.35;
                }

                .id-card-t1 .front-body {
                    height: 157px;
                    padding: 10px 16px;
                    position: relative;
                }

                .id-card-t1 .card-label {
                    color: #b74b4b;
                    font-size: 13px;
                    font-weight: 700;
                    margin-bottom: 8px;
                }

                .id-card-t1 .student-area {
                    display: flex;
                    gap: 18px;
                }

                .id-card-t1 .photo-box {
                    width: 105px;
                    height: 122px;
                    border: 2px solid #333;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    text-align: center;
                    color: #777;
                    font-size: 12px;
                    background: #f7f7f7;
                    flex-shrink: 0;
                    overflow: hidden;
                }

                .id-card-t1 .photo-box img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }

                .id-card-t1 .details {
                    flex: 1;
                    padding-top: 2px;
                }

                .id-card-t1 .detail-row {
                    display: grid;
                    grid-template-columns: 105px 14px 1fr;
                    margin: 7px 0;
                    font-size: 13px;
                    line-height: 1.1;
                }

                .id-card-t1 .detail-row .lbl {
                    color: #a84747;
                    font-weight: 700;
                }

                .id-card-t1 .detail-row .col {
                    color: #a84747;
                    font-weight: 700;
                }

                .id-card-t1 .detail-row .val {
                    font-weight: 700;
                    color: #222;
                }

                .id-card-t1 .front-bottom {
                    position: absolute;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    height: 46px;
                    padding: 0 18px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    background: linear-gradient(135deg, #d4dd68, #a8c947);
                    color: white;
                    font-size: 10px;
                }

                .id-card-t1 .signature {
                    text-align: center;
                    min-width: 80px;
                }

                .id-card-t1 .signature-line {
                    width: 75px;
                    border-top: 1px solid white;
                    margin: 0 auto 2px;
                }

                /* ── BACK ── */
                .id-card-t1.back-card {
                    background:
                        radial-gradient(circle at 50% 50%, rgba(78,145,85,.06), transparent 42%),
                        #fff;
                }

                .id-card-t1 .back-content {
                    position: relative;
                    z-index: 2;
                    height: 100%;
                    padding: 35px 45px 25px;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    text-align: center;
                }

                .id-card-t1 .back-content p {
                    margin: 0 0 23px;
                    font-size: 14px;
                    font-weight: 600;
                    line-height: 1.45;
                }

                .id-card-t1 .rector-sig {
                    width: 105px;
                    margin: 0 auto 3px;
                    padding-bottom: 2px;
                    border-bottom: 1px solid #222;
                    font-family: cursive;
                    font-size: 24px;
                }

                .id-card-t1 .rector {
                    font-weight: 800;
                    font-size: 14px;
                }

                .id-card-t1 .watermark {
                    position: absolute;
                    left: 50%;
                    bottom: 8px;
                    transform: translateX(-50%);
                    z-index: 5;
                    color: #c62828;
                    font-size: 11px;
                    font-weight: 900;
                    letter-spacing: 1px;
                }

                @media print {
                    .id-card-t1 { box-shadow: none; break-inside: avoid; margin: 5mm; }
                    .no-print { display: none; }
                }
            `}</style>

            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "20px" }}>
                {/* FRONT */}
                {showFront && (
                    <section className="id-card-t1">
                        <div className="front-top">
                            <div className="t1-logo">FS</div>
                            <div className="school-header">
                                <h2>{institutionName}</h2>
                                <div className="sub">
                                    {campusAddress}<br />
                                    {DEFAULTS.postalAddress}
                                </div>
                            </div>
                        </div>

                        <div className="front-body">
                            <div className="card-label">STUDENT IDENTIFICATION CARD</div>
                            <div className="student-area">
                                <div className="photo-box">
                                    {photoUrl ? (
                                        <img src={photoUrl} alt={studentName} />
                                    ) : (
                                        <>STUDENT<br />PHOTO</>
                                    )}
                                </div>
                                <div className="details">
                                    <DetailRow label="Name" value={studentName} />
                                    <DetailRow label="Matric No." value={matricNumber} />
                                    <DetailRow label="Department" value={department} />
                                    <DetailRow label="Telephone" value={phoneNumber || DEFAULTS.phone} />
                                    <DetailRow label="Blood Group" value={bloodGroup || DEFAULTS.bloodGroup} />
                                    <DetailRow label="Genotype" value={genotype || DEFAULTS.genotype} />
                                </div>
                            </div>
                        </div>

                        <div className="front-bottom">
                            <span>Say No To Cultism, Exam Malpractice &amp; Drug Abuse</span>
                            <div className="signature">
                                {signatureUrl ? (
                                    <img src={signatureUrl} alt="Signature" style={{ width: 75, height: 25, objectFit: "contain" }} />
                                ) : (
                                    <>
                                        <div className="signature-line"></div>
                                        Signature
                                    </>
                                )}
                            </div>
                        </div>
                    </section>
                )}

                {/* BACK */}
                {showBack && (
                    <section className="id-card-t1 back-card">
                        <div className="back-content">
                            <p>
                                I certify that the bearer whose photograph appears
                                overleaf is a bona fide student of this institution.
                            </p>
                            <p>
                                The loss/recovery of this card should be reported
                                to the school authority or the designated school contact.
                            </p>
                            <p>
                                This card remains the property of this institution
                                and must be surrendered on request by any
                                authorised officer of this institution.
                            </p>
                            <div className="rector-sig">Signature</div>
                            <div className="rector">RECTOR</div>
                        </div>
                        {showWatermark && <div className="watermark">SAMPLE — NOT A VALID ID</div>}
                    </section>
                )}
            </div>
        </div>
    );
}

function DetailRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="detail-row">
            <span className="lbl">{label}</span>
            <span className="col">:</span>
            <span className="val">{value}</span>
        </div>
    );
}