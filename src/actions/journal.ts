"use strict";
"use server";

import { auth } from "@/auth";
import { db } from "@/db/db";
import { journals, journalIssues, journalArticles, journalArticleAuthors, journalArticleFiles, journalReviews, users, staffProfiles } from "@/db/schema";
import { addLibraryResource } from "./library";
import { CrossrefService } from "@/lib/crossref";
import { eq, desc, asc, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// --- Journal Management ---

export async function getAllJournals() {
    try {
        return await db.select().from(journals).where(eq(journals.isActive, true));
    } catch (error) {
        console.error("Failed to fetch journals:", error);
        return [];
    }
}

export async function getJournalBySlug(slug: string) {
    try {
        const [journal] = await db.select().from(journals).where(eq(journals.slug, slug)).limit(1);
        return journal;
    } catch (error) {
        console.error("Failed to fetch journal by slug:", error);
        return null;
    }
}

export async function createJournal(data: { name: string, slug: string, description?: string, issn?: string, logoUrl?: string, contactEmail?: string, managerId?: number }) {
    try {
        const [result] = await db.insert(journals).values(data);
        revalidatePath("/admin/journal");
        return { success: true, id: result.insertId };
    } catch (error) {
        console.error("Failed to create journal:", error);
        return { success: false, error: "Journal creation failed. Slug might be taken." };
    }
}

// --- Issue Management ---

export async function getIssuesByJournalId(journalId: number) {
    try {
        return await db.select().from(journalIssues).where(eq(journalIssues.journalId, journalId)).orderBy(desc(journalIssues.year), desc(journalIssues.volume), desc(journalIssues.number));
    } catch (error) {
        console.error("Failed to fetch issues:", error);
        return [];
    }
}

export async function createIssue(data: { journalId: number, volume: number, number: number, year: number, title?: string, description?: string, coverUrl?: string }) {
    try {
        const [result] = await db.insert(journalIssues).values(data);
        revalidatePath(`/journal/${data.journalId}`);
        return { success: true, id: result.insertId };
    } catch (error) {
        console.error("Failed to create issue:", error);
        return { success: false, error: "Issue creation failed." };
    }
}

// --- Article Submission & Management ---

export async function submitArticle(data: { 
    journalId: number, 
    title: string, 
    abstract?: string, 
    keywords?: string,
    funding?: string,
    conflictOfInterest?: string,
    section?: string,
    pages?: string,
    startingPage?: number,
    endingPage?: number,
    authors: { name: string, email?: string, affiliation?: string, orcid?: string, isCorresponding?: boolean }[],
    files: { fileUrl: string, fileName?: string, fileType: "manuscript" | "supplementary" | "review_version" | "galley" }[]
}) {
    try {
        return await db.transaction(async (tx) => {
            const [artResult] = await tx.insert(journalArticles).values({
                journalId: data.journalId,
                title: data.title,
                abstract: data.abstract,
                keywords: data.keywords,
                funding: data.funding,
                conflictOfInterest: data.conflictOfInterest,
                section: data.section,
                pages: data.pages,
                startingPage: data.startingPage,
                endingPage: data.endingPage,
                status: "submitted",
                submissionDate: new Date(),
            });

            const articleId = artResult.insertId;

            if (data.authors.length > 0) {
                await tx.insert(journalArticleAuthors).values(
                    data.authors.map((auth, index) => ({
                        articleId,
                        name: auth.name,
                        email: auth.email,
                        affiliation: auth.affiliation,
                        orcid: auth.orcid,
                        isCorresponding: auth.isCorresponding || false,
                        order: index + 1
                    }))
                );
            }

            if (data.files.length > 0) {
                await tx.insert(journalArticleFiles).values(
                    data.files.map(file => ({
                        articleId,
                        ...file
                    }))
                );
            }

            return { success: true, articleId };
        });
    } catch (error) {
        console.error("Failed to submit article:", error);
        return { success: false, error: "Article submission failed." };
    }
}

export async function getArticlesByJournalId(journalId: number) {
    try {
        return await db.select().from(journalArticles).where(eq(journalArticles.journalId, journalId));
    } catch (error) {
        console.error("Failed to fetch articles:", error);
        return [];
    }
}

export async function getArticleById(articleId: number) {
    try {
        const [article] = await db.select().from(journalArticles).where(eq(journalArticles.id, articleId)).limit(1);
        if (!article) return null;

        const [journal] = await db.select().from(journals).where(eq(journals.id, article.journalId)).limit(1);
        const issue = article.issueId ? (await db.select().from(journalIssues).where(eq(journalIssues.id, article.issueId)).limit(1))[0] : null;
        const authors = await db.select().from(journalArticleAuthors).where(eq(journalArticleAuthors.articleId, articleId)).orderBy(asc(journalArticleAuthors.order));
        const files = await db.select().from(journalArticleFiles).where(eq(journalArticleFiles.articleId, articleId));
        
        const rawReviews = await db.select().from(journalReviews).where(eq(journalReviews.articleId, articleId));
        const reviewerIds = rawReviews.map(r => r.reviewerId).filter(Boolean) as number[];
        const reviewUsers = reviewerIds.length > 0 ? await db.select().from(users).where(inArray(users.id, reviewerIds)) : [];
        
        const reviews = rawReviews.map(r => ({
            ...r,
            reviewer: reviewUsers.find(u => u.id === r.reviewerId)
        }));

        return {
            ...article,
            journal,
            issue,
            authors,
            files,
            reviews
        };
    } catch (error) {
        console.error("Failed to get article:", error);
        return null;
    }
}

export async function updateArticleStatus(articleId: number, status: "draft" | "submitted" | "under_review" | "revision_required" | "accepted" | "declined" | "copyediting" | "production" | "published") {
    try {
        await db.update(journalArticles).set({ status }).where(eq(journalArticles.id, articleId));

        if (status === "published") {
            // Trigger Library Integration
            const article = await getArticleById(articleId);
            if (article) {
                const authorsStr = article.authors.map(a => a.name).join(", ");
                
                await addLibraryResource({
                    title: article.title,
                    authors: authorsStr,
                    abstract: article.abstract,
                    category: "Journal Article",
                    type: "journal",
                    issn: article.journal?.issn,
                    publicationYear: article.issue?.year || new Date().getFullYear(),
                    metaData: JSON.stringify({
                        journal: article.journal?.name,
                        volume: article.issue?.volume,
                        number: article.issue?.number,
                        doi: article.doi
                    })
                });
            }
        }

        revalidatePath("/staff/journal");
        return { success: true };
    } catch (error) {
        console.error("Failed to update article status:", error);
        return { success: false, error: "Failed to update article status." };
    }
}

export async function updateArticleDoi(articleId: number, doi: string) {
    try {
        await db.update(journalArticles).set({ doi }).where(eq(journalArticles.id, articleId));
        return { success: true };
    } catch (error) {
        console.error("Failed to update DOI:", error);
        return { success: false, error: "Failed to update DOI." };
    }
}

// --- Review Workflow ---

export async function assignReviewer(articleId: number, reviewerId: number, dueDate?: Date) {
    try {
        await db.insert(journalReviews).values({
            articleId,
            reviewerId,
            dueDate,
        });
        await db.update(journalArticles).set({ status: "under_review" }).where(eq(journalArticles.id, articleId));
        return { success: true };
    } catch (error) {
        console.error("Failed to assign reviewer:", error);
        return { success: false, error: "Failed to assign reviewer." };
    }
}

export async function submitReview(reviewId: number, data: { recommendation: string, commentsToAuthor?: string, commentsToEditor?: string }) {
    try {
        await db.update(journalReviews).set({
            recommendation: data.recommendation as "accept" | "minor_revisions" | "major_revisions" | "resubmit" | "decline",
            commentsToAuthor: data.commentsToAuthor,
            commentsToEditor: data.commentsToEditor,
            completedAt: new Date(),
        }).where(eq(journalReviews.id, reviewId));
        
        return { success: true };
    } catch (error) {
        console.error("Failed to submit review:", error);
        return { success: false, error: "Failed to submit review." };
    }
}

export async function suggestReviewers(articleId: number) {
    try {
        const article = await db.query.journalArticles.findFirst({
            where: eq(journalArticles.id, articleId),
        });
        if (!article || !article.keywords) return [];

        const keywords = article.keywords.split(',').map(k => k.trim().toLowerCase());
        
        const staff = await db.select({
            userId: staffProfiles.userId,
            expertise: staffProfiles.expertise,
            name: users.name
        })
        .from(staffProfiles)
        .innerJoin(users, eq(staffProfiles.userId, users.id));

        const suggestions = staff.filter(s => {
            if (!s.expertise) return false;
            const expertKeywords = s.expertise.split(',').map(ek => ek.trim().toLowerCase());
            return keywords.some(k => expertKeywords.includes(k));
        }).map(s => ({
            id: s.userId,
            name: s.name,
            expertise: s.expertise
        }));

        return suggestions;
    } catch (error) {
        console.error("Failed to suggest reviewers:", error);
        return [];
    }
}

export async function generateArticleDoi(articleId: number) {
    try {
        const [article] = await db.select().from(journalArticles).where(eq(journalArticles.id, articleId)).limit(1);
        if (!article) return { success: false, error: "Article not found" };

        const [journal] = await db.select().from(journals).where(eq(journals.id, article.journalId)).limit(1);
        const issue = article.issueId ? (await db.select().from(journalIssues).where(eq(journalIssues.id, article.issueId)).limit(1))[0] : null;
        
        const prefix = "10.5555"; 
        const journalPart = journal.slug;
        const issuePart = issue ? `v${issue.volume}i${issue.number}` : "pre";
        const generatedDoi = `${prefix}/${journalPart}.${issuePart}.${articleId}`;

        await db.update(journalArticles).set({ doi: generatedDoi }).where(eq(journalArticles.id, articleId));
        return { success: true, doi: generatedDoi };
    } catch (error) {
        console.error("Failed to generate DOI:", error);
        return { success: false, error: "Failed to generate DOI." };
    }
}

export async function getArticlesByUserId(userId: number) {
    try {
        console.log(`Demo: Fetching articles. Requested for userId: ${userId}`);
        const session = await auth();
        if (!session?.user?.email) return [];

        // For this demo, let's return articles with their journal info.
        // In a real production system, we'd filter by the user's role and associated articles.
        const baseArticles = await db.select().from(journalArticles).orderBy(desc(journalArticles.createdAt));
        const journalIds = Array.from(new Set(baseArticles.map(a => a.journalId)));
        const relevantJournals = journalIds.length > 0 ? await db.select().from(journals).where(inArray(journals.id, journalIds)) : [];

        return baseArticles.map(a => ({
            ...a,
            journal: relevantJournals.find(j => j.id === a.journalId)
        }));
    } catch (error) {
        console.error("Failed to fetch user articles:", error);
        return [];
    }
}

export async function registerArticleDoiWithCrossref(articleId: number) {
    try {
        const article = await getArticleById(articleId);
        if (!article) return { success: false, error: "Article not found" };
        if (!article.doi) return { success: false, error: "DOI not yet assigned. Assign manually first or generate one." };

        await db.update(journalArticles).set({ doiStatus: "submitted" }).where(eq(journalArticles.id, articleId));

        const res = await CrossrefService.registerDoi({
            title: article.title,
            authors: article.authors.map(a => {
                const parts = a.name.split(" ");
                return {
                    firstName: parts[0],
                    lastName: parts.length > 1 ? parts.slice(1).join(" ") : parts[0],
                    orcid: a.orcid ?? undefined
                };
            }),
            publicationDate: article.publishedDate ? new Date(article.publishedDate) : new Date(),
            journalTitle: article.journal?.name || "Unknown Journal",
            issn: article.journal?.issn ?? undefined,
            volume: article.issue?.volume ?? undefined,
            issue: article.issue?.number ?? undefined,
            doi: article.doi,
            url: `https://academic-journals.edu/article/${articleId}` // Placeholder URL
        });

        if (res.success) {
            await db.update(journalArticles).set({ doiStatus: "registered" }).where(eq(journalArticles.id, articleId));
            return { success: true };
        } else {
            await db.update(journalArticles).set({ doiStatus: "error", doiError: res.error }).where(eq(journalArticles.id, articleId));
            return { success: false, error: res.error };
        }
    } catch (error) {
        console.error("DOI Registration action failed:", error);
        return { success: false, error: "Internal error during registration." };
    }
}
export async function updateArticleMetadata(id: number, data: { translatedMetadata?: unknown, aiSummary?: string }) {
    try {
        await db.update(journalArticles)
            .set(data as never)
            .where(eq(journalArticles.id, id));
        revalidatePath("/admin/staff/journal");
        return { success: true };
    } catch (error) {
        console.error("Failed to update metadata:", error);
        return { success: false };
    }
}
