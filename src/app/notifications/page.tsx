"use client";

import { useAppStore } from "@/store/useAppStore";
import { Bell, CheckCircle2, Navigation, Target } from "lucide-react";
import { useRouter } from "next/navigation";

export default function NotificationsPage() {
  const { notifications, markNotificationRead } = useAppStore();
  const router = useRouter();

  const handleAction = (id: string, route?: string) => {
    markNotificationRead(id);
    if (route) router.push(route);
  };

  return (
    <div className="flex-1 bg-surface p-6 max-w-4xl mx-auto w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
        <p className="text-gray-500 mt-2">Updates about your profile, opportunities, and roadmap.</p>
      </div>

      <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
        {notifications.length === 0 ? (
          <div className="p-12 text-center text-gray-500 flex flex-col items-center">
            <Bell className="w-12 h-12 text-gray-300 mb-4" />
            <p>You have no new notifications.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {notifications.map(n => (
              <div 
                key={n.id} 
                className={`p-6 flex items-start gap-4 transition ${n.read ? 'bg-white' : 'bg-blue-50/30'}`}
                onClick={() => handleAction(n.id, n.actionRoute)}
              >
                <div className={`mt-1 shrink-0 ${n.read ? 'text-gray-400' : 'text-primary'}`}>
                  {n.type === 'roadmap' ? <Navigation className="w-6 h-6" /> : 
                   n.type === 'recommendation' ? <Target className="w-6 h-6" /> : 
                   <Bell className="w-6 h-6" />}
                </div>
                <div className="flex-1 cursor-pointer">
                  <h3 className={`font-bold text-sm mb-1 ${n.read ? 'text-gray-700' : 'text-gray-900'}`}>{n.title}</h3>
                  <p className="text-sm text-gray-600">{n.message}</p>
                  <span className="text-xs text-gray-400 mt-2 block">
                    {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                {!n.read && (
                  <div className="w-2.5 h-2.5 rounded-full bg-primary shrink-0 mt-2" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
