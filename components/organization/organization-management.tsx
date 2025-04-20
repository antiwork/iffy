"use client"

import { useState } from "react"
import {
  Sidebar,
  SidebarContent,
  SidebarProvider,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
} from "@/components/ui/sidebar"
import { OrganizationGeneral } from "@/components/organization/organization-general"
import { OrganizationMembers } from "@/components/organization/organization-members"
import { Users, Settings } from "lucide-react"

type TabType = "general" | "members"

export function OrganizationManagement() {
  const [activeTab, setActiveTab] = useState<TabType>("general")

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full">
        <Sidebar variant="inset" collapsible="icon">
          <SidebarContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={activeTab === "general"}
                  onClick={() => setActiveTab("general")}
                  tooltip="General Settings"
                >
                  <Settings className="h-5 w-5" />
                  <span>General</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={activeTab === "members"}
                  onClick={() => setActiveTab("members")}
                  tooltip="Organization Members"
                >
                  <Users className="h-5 w-5" />
                  <span>Members</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>
        </Sidebar>
        <SidebarInset className="flex-1 overflow-auto p-6">
          {activeTab === "general" ? <OrganizationGeneral /> : <OrganizationMembers />}
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
