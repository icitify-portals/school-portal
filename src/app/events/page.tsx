import { auth } from "@/auth";
import { StudentAffairsService } from "@/services/StudentAffairsService";
import EventsClient from "./EventsClient";

export const dynamic = "force-dynamic";

export default async function PublicEventsPage() {
  const session = await auth();
  const userId = session?.user?.id ? Number(session.user.id) : null;

  // Fetch events
  const rawEvents = await StudentAffairsService.getEvents(true);
  
  // Cast types for client consumption
  const events = rawEvents.map(e => ({
    ...e,
    startDate: new Date(e.startDate),
    endDate: new Date(e.endDate),
    createdAt: e.createdAt ? new Date(e.createdAt) : null
  }));

  // Fetch user registrations if authenticated
  let userRegistrations: any[] = [];
  if (userId) {
    userRegistrations = await StudentAffairsService.getUserRegistrations(userId);
  }

  return (
    <EventsClient 
      initialEvents={events} 
      session={session} 
      userRegistrations={userRegistrations} 
    />
  );
}
