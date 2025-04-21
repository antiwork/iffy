"use client"

import type React from "react"
import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { MoreHorizontal, UserPlus, X, Mail } from "lucide-react"
import { format } from "date-fns"
import { client } from "@/lib/auth-client"
import { useOrganization } from "@/lib/organization-context"

type Role = "admin" | "member" | "owner"

interface Member {
  id: string
  name: string
  email: string
  imageUrl?: string
  role: Role
  joinedAt?: Date
}

export function OrganizationMembers() {
  const { organization, isLoading, currentMember, refreshOrganization } = useOrganization()
  const [memberToRemove, setMemberToRemove] = useState<Member | null>(null)
  const [inviteRole, setInviteRole] = useState<Role>("member")
  const [emailInput, setEmailInput] = useState("")
  const [emailChips, setEmailChips] = useState<string[]>([])
  const [isPopoverOpen, setIsPopoverOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleRoleChange = async (memberId: string, newRole: Role) => {
    try {
      await client.organization.updateMemberRole({
        memberId,
        role: newRole
      })

      // Refresh data to get updated roles
      await refreshOrganization()
    } catch (error) {
      console.error("Failed to update member role:", error)
    }
  }

  const handleRemoveMember = async () => {
    if (memberToRemove) {
      try {
        await client.organization.removeMember({
          memberIdOrEmail: memberToRemove.id
        })

        // Refresh data after removal
        await refreshOrganization()
        setMemberToRemove(null)
      } catch (error) {
        console.error("Failed to remove member:", error)
      }
    }
  }

  const handleEmailInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setEmailInput(value)
    // If the user types a comma, create a new chip
    if (value.endsWith(",")) {
      const email = value.slice(0, -1).trim()
      if (email && isValidEmail(email) && !emailChips.includes(email)) {
        setEmailChips([...emailChips, email])
        setEmailInput("")
      } else {
        setEmailInput(value)
      }
    }
  }

  const handleEmailInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // If the user presses Enter, create a new chip
    if (e.key === "Enter") {
      e.preventDefault()
      const email = emailInput.trim()
      if (email && isValidEmail(email) && !emailChips.includes(email)) {
        setEmailChips([...emailChips, email])
        setEmailInput("")
      }
    }
    // If the user presses Backspace and there's no input, remove the last chip
    if (e.key === "Backspace" && !emailInput && emailChips.length > 0) {
      const newChips = [...emailChips]
      newChips.pop()
      setEmailChips(newChips)
    }
  }

  const removeEmailChip = (email: string) => {
    setEmailChips(emailChips.filter((e) => e !== email))
  }

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  const handleSendInvites = async () => {
    try {
      // Send invitations for each email
      for (const email of emailChips) {
        await client.organization.inviteMember({
          email,
          role: inviteRole
        })
      }

      // Refresh organization data to get updated invitations
      await refreshOrganization()

      setEmailChips([])
      setEmailInput("")
      setIsPopoverOpen(false)
    } catch (error) {
      console.error("Failed to send invitations:", error)
    }
  }

  const handleCancelInvitation = async (invitationId: string) => {
    try {
      const invitation = organization?.invitations.find(inv => inv.id === invitationId)

      if (invitation) {
        await client.organization.removeMember({
          memberIdOrEmail: invitation.email
        })

        // Refresh data after cancellation
        await refreshOrganization()
      }
    } catch (error) {
      console.error("Failed to cancel invitation:", error)
    }
  }

  const focusInput = () => {
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">Loading members data...</div>
      </div>
    )
  }

  if (!organization) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">No organization data available.</div>
      </div>
    )
  }

  // Transform the API data into the format needed for the component
  const members = organization.members.map(member => ({
    id: member.id,
    name: member.user.name || "Unknown",
    email: member.user.email || "unknown@example.com",
    imageUrl: member.user.image || "/placeholder.svg?height=40&width=40",
    role: member.role,
    joinedAt: new Date(member.createdAt)
  }));

  const invitations = organization.invitations.map(invitation => ({
    id: invitation.id,
    email: invitation.email,
    role: invitation.role,
    sentAt: new Date(invitation.createdAt)
  }));

  const isAdmin = currentMember?.role === "admin" || currentMember?.role === "owner";

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-2xl font-bold">Organization Members</h2>
        {isAdmin && (
          <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
            <PopoverTrigger asChild>
              <Button size="sm">
                <UserPlus className="mr-2 h-4 w-4" />
                Invite
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="end">
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium">Invite Members</h4>
                  <p className="text-xs text-muted-foreground">Invite new members to your organization</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emails">Email Addresses</Label>
                  <div
                    className="flex min-h-10 w-full flex-wrap items-center gap-1 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2"
                    onClick={focusInput}
                  >
                    {emailChips.map((email) => (
                      <Badge key={email} variant="secondary" className="flex items-center gap-1 px-2 py-1">
                        {email}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            removeEmailChip(email)
                          }}
                          className="ml-1 rounded-full hover:bg-muted"
                        >
                          <X className="h-3 w-3" />
                          <span className="sr-only">Remove</span>
                        </button>
                      </Badge>
                    ))}
                    <Input
                      ref={inputRef}
                      id="emails"
                      value={emailInput}
                      onChange={handleEmailInputChange}
                      onKeyDown={handleEmailInputKeyDown}
                      className="flex-1 border-0 bg-transparent p-0 placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
                      placeholder={emailChips.length > 0 ? "" : "Enter email addresses (comma separated)"}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">Press Enter or add a comma after each email</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select value={inviteRole} onValueChange={(value: Role) => setInviteRole(value)}>
                    <SelectTrigger id="role">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="member">Member</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsPopoverOpen(false)
                      setEmailChips([])
                      setEmailInput("")
                    }}
                  >
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleSendInvites} disabled={emailChips.length === 0}>
                    Send Invites
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>
      <Tabs defaultValue="members">
        <TabsList className="mb-4">
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="invitations">Invitations</TabsTrigger>
        </TabsList>
        <TabsContent value="members">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Members</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="rounded-md border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50 text-left">
                      <th className="px-3 py-2 font-medium">User</th>
                      <th className="px-3 py-2 font-medium">Joined</th>
                      <th className="px-3 py-2 font-medium">Role</th>
                      <th className="px-3 py-2 font-medium sr-only">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.map((member) => (
                      <tr key={member.id} className="border-b">
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-7 w-7">
                              <AvatarImage src={member.imageUrl || "/placeholder.svg"} alt={member.name} />
                              <AvatarFallback>{member.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{member.name}</div>
                              <div className="text-xs text-muted-foreground">{member.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-2 text-xs text-muted-foreground">
                          {member.joinedAt ? format(member.joinedAt, "MMM d, yyyy") : "N/A"}
                        </td>
                        <td className="px-3 py-2">
                          <Select
                            value={member.role}
                            onValueChange={(value: Role) => handleRoleChange(member.id, value)}
                            disabled={!isAdmin || member.id === currentMember?.id}
                          >
                            <SelectTrigger className="h-7 w-24 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="admin">Admin</SelectItem>
                              <SelectItem value="member">Member</SelectItem>
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="px-3 py-2 text-right">
                          {isAdmin && member.id !== currentMember?.id && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7">
                                  <MoreHorizontal className="h-4 w-4" />
                                  <span className="sr-only">Actions</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <DropdownMenuItem
                                      className="text-destructive focus:text-destructive"
                                      onSelect={(e) => {
                                        e.preventDefault()
                                        setMemberToRemove(member)
                                      }}
                                    >
                                      Remove Member
                                    </DropdownMenuItem>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        You are about to remove {member.name} from this organization. This action cannot
                                        be undone.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction onClick={handleRemoveMember}>Remove</AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="invitations">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Pending Invitations</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {invitations.length > 0 ? (
                <div className="rounded-md border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50 text-left">
                        <th className="px-3 py-2 font-medium">Email</th>
                        <th className="px-3 py-2 font-medium">Role</th>
                        <th className="px-3 py-2 font-medium">Sent</th>
                        <th className="px-3 py-2 font-medium sr-only">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invitations.map((invitation) => (
                        <tr key={invitation.id} className="border-b">
                          <td className="px-3 py-2">{invitation.email}</td>
                          <td className="px-3 py-2 capitalize">{invitation.role}</td>
                          <td className="px-3 py-2 text-xs text-muted-foreground">
                            {invitation.sentAt ? format(invitation.sentAt, "MMM d, yyyy") : "N/A"}
                          </td>
                          <td className="px-3 py-2 text-right">
                            {isAdmin && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-destructive"
                                onClick={() => handleCancelInvitation(invitation.id)}
                              >
                                <X className="h-4 w-4" />
                                <span className="sr-only">Cancel Invitation</span>
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-4 text-sm text-muted-foreground">No pending invitations.</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
