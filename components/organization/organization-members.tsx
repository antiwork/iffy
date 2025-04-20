"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
import { MoreHorizontal, UserPlus } from "lucide-react"
import { format } from "date-fns"

type Role = "admin" | "member"

interface Member {
  id: string
  name: string
  email: string
  imageUrl: string
  role: Role
  joinedAt: Date
}

export function OrganizationMembers() {
  const [members, setMembers] = useState<Member[]>([
    {
      id: "user_1",
      name: "John Doe",
      email: "john@example.com",
      imageUrl: "/placeholder.svg?height=40&width=40",
      role: "admin",
      joinedAt: new Date(2023, 0, 15),
    },
    {
      id: "user_2",
      name: "Jane Smith",
      email: "jane@example.com",
      imageUrl: "/placeholder.svg?height=40&width=40",
      role: "member",
      joinedAt: new Date(2023, 2, 10),
    },
    {
      id: "user_3",
      name: "Bob Johnson",
      email: "bob@example.com",
      imageUrl: "/placeholder.svg?height=40&width=40",
      role: "member",
      joinedAt: new Date(2023, 5, 22),
    },
  ])

  const [currentUserRole, setCurrentUserRole] = useState<Role>("admin")
  const [memberToRemove, setMemberToRemove] = useState<Member | null>(null)

  const handleRoleChange = (memberId: string, newRole: Role) => {
    setMembers(members.map((member) => (member.id === memberId ? { ...member, role: newRole } : member)))
  }

  const handleRemoveMember = () => {
    if (memberToRemove) {
      setMembers(members.filter((member) => member.id !== memberToRemove.id))
      setMemberToRemove(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Organization Members</h1>
        <Button>
          <UserPlus className="mr-2 h-4 w-4" />
          Invite Member
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Members</CardTitle>
          <CardDescription>Manage members and their roles in your organization</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="rounded-md border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50 text-left">
                    <th className="px-4 py-3 font-medium">User</th>
                    <th className="px-4 py-3 font-medium">Joined</th>
                    <th className="px-4 py-3 font-medium">Role</th>
                    <th className="px-4 py-3 font-medium sr-only">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((member) => (
                    <tr key={member.id} className="border-b">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={member.imageUrl || "/placeholder.svg"} alt={member.name} />
                            <AvatarFallback>{member.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{member.name}</div>
                            <div className="text-muted-foreground">{member.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{format(member.joinedAt, "MMM d, yyyy")}</td>
                      <td className="px-4 py-3">
                        <Select
                          value={member.role}
                          onValueChange={(value: Role) => handleRoleChange(member.id, value)}
                          disabled={currentUserRole !== "admin" || member.id === "user_1"} // Disable for non-admins or for the first user (self)
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="member">Member</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {currentUserRole === "admin" && member.id !== "user_1" && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
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
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
