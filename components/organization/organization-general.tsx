"use client"

import React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
import { LogOut, Pencil, Upload } from "lucide-react"
import { client } from "@/lib/auth-client"
import { useOrganization } from "@/lib/organization-context"

interface FormData {
  name: string
  slug: string
  imageUrl: string
}

export function OrganizationGeneral() {
  const { organization, isLoading, refreshOrganization } = useOrganization()
  const [isEditing, setIsEditing] = useState(false)

  const [formData, setFormData] = useState<FormData>({
    name: "",
    slug: "",
    imageUrl: "/placeholder.svg?height=100&width=100",
  })

  // Update form data when organization data loads
  React.useEffect(() => {
    if (organization) {
      setFormData({
        name: organization.name,
        slug: organization.slug || "",
        imageUrl: organization.logo || "/placeholder.svg?height=100&width=100"
      })
    }
  }, [organization])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await client.organization.update({
        data: {
          name: formData.name,
          logo: formData.imageUrl,
          slug: formData.slug
        }
      })

      // Refresh organization data to get updated info
      await refreshOrganization()
      setIsEditing(false)
    } catch (error) {
      console.error("Failed to update organization:", error)
    }
  }

  const handleLeaveOrganization = async () => {
    try {
      await client.organization.leave()
      // Redirect or update UI accordingly
      window.location.href = "/organizations" // Redirect to organizations page or similar
    } catch (error) {
      console.error("Failed to leave organization:", error)
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      const reader = new FileReader()
      reader.onload = (event) => {
        if (event.target?.result) {
          setFormData((prev) => ({ ...prev, imageUrl: event.target.result as string }))
        }
      }
      reader.readAsDataURL(file)
      // Note: In a real implementation, you would upload this to a server/storage and get back a URL
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">Loading organization details...</div>
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Organization Settings</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Organization Profile</CardTitle>
          <CardDescription>Manage your organization's profile information</CardDescription>
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="avatar">Organization Logo</Label>
                <div className="flex items-center gap-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={formData.imageUrl || "/placeholder.svg"} alt={formData.name} />
                    <AvatarFallback>{formData.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="relative">
                    <Button variant="outline" type="button" className="relative overflow-hidden">
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Image
                      <input
                        type="file"
                        className="absolute inset-0 cursor-pointer opacity-0"
                        accept="image/*"
                        onChange={handleImageUpload}
                      />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Organization Name</Label>
                <Input id="name" name="name" value={formData.name} onChange={handleInputChange} required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">Organization Slug</Label>
                <Input id="slug" name="slug" value={formData.slug} onChange={handleInputChange} required />
                <p className="text-sm text-muted-foreground">
                  This will be used in your organization's URL: example.com/org/{formData.slug}
                </p>
              </div>

              <div className="flex gap-2">
                <Button type="submit">Save Changes</Button>
                <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage
                    src={organization.logo || "/placeholder.svg"}
                    alt={organization.name}
                  />
                  <AvatarFallback>{organization.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl font-semibold">{organization.name}</h3>
                  <p className="text-sm text-muted-foreground">Slug: {organization.slug}</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
        {!isEditing && (
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={() => setIsEditing(true)}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit Organization
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Leave Organization
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    You are about to leave this organization. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleLeaveOrganization}>Leave</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardFooter>
        )}
      </Card>
    </div>
  )
}
