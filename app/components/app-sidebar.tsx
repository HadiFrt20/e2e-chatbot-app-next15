'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { SidebarHistory } from '@/components/sidebar-history';
import { SidebarUserNav } from '@/components/sidebar-user-nav';
import { Button } from '@/components/ui/button';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  useSidebar,
} from '@/components/ui/sidebar';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { PlusIcon } from 'lucide-react';
import type { ClientSession } from '@chat-template/auth';
import type { ChatHistory } from './sidebar-history';

export function AppSidebar({
  user,
  preferredUsername,
  initialHistory,
}: {
  user: ClientSession['user'] | undefined;
  preferredUsername: string | null;
  initialHistory?: ChatHistory;
}) {
  const router = useRouter();
  const { setOpenMobile } = useSidebar();

  const goToNewChat = () => {
    setOpenMobile(false);
    const search = `?new=${Date.now()}`;
    router.push(`/chat${search}`);
  };

  return (
    <Sidebar className="group-data-[side=left]:border-r-0">
      <SidebarHeader>
        <SidebarMenu>
          <div className="flex flex-row items-center justify-between">
            <Link
              href="/"
              onClick={() => setOpenMobile(false)}
              className="flex flex-row items-center gap-3"
            >
              <span className="cursor-pointer rounded-md px-2 font-semibold text-lg hover:bg-muted">
                Chatbot
              </span>
            </Link>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                variant="ghost"
                type="button"
                className="h-8 p-1 md:h-fit md:p-2"
                onClick={goToNewChat}
              >
                <PlusIcon />
              </Button>
              </TooltipTrigger>
              <TooltipContent align="end" className="hidden md:block">
                New Chat
              </TooltipContent>
            </Tooltip>
          </div>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarHistory user={user} initialHistory={initialHistory} />
      </SidebarContent>
      <SidebarFooter>
        {user && (
          <SidebarUserNav user={user} preferredUsername={preferredUsername} />
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
