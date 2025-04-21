import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { client } from "@/lib/auth-client"

interface OrganizationMember {
  id: string
  organizationId: string
  role: "member" | "admin" | "owner"
  createdAt: Date
  userId: string
  user: {
    email: string
    name: string
    image?: string
  }
}

interface OrganizationInvitation {
  id: string
  email: string
  role: "member" | "admin" | "owner"
  createdAt: string
}

interface OrganizationData {
  id: string
  name: string
  slug: string | null
  logo: string | null
  members: OrganizationMember[]
  invitations: OrganizationInvitation[]
}

interface OrganizationContextType {
  organization: OrganizationData | null
  isLoading: boolean
  currentMember: OrganizationMember | null
  refreshOrganization: () => Promise<void>
  error: Error | null
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined)

export function OrganizationProvider({ children }: { children: ReactNode }) {
  const [organization, setOrganization] = useState<OrganizationData | null>(null)
  const [currentMember, setCurrentMember] = useState<OrganizationMember | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchOrganizationData = async () => {
    try {
      setIsLoading(true)
      const result = await client.organization.getFullOrganization()

      if (result && result.data) {
        setOrganization(result.data)

        // Set current member by finding the member that matches the current user
        if (result.data.members && result.data.members.length > 0) {
          // You might need to compare with the current user ID from auth
          // For now, we'll just get the first member
          setCurrentMember(result.data.members[0])
        }
      }

    } catch (error) {
      console.error("Failed to fetch organization data:", error)
      setError(error instanceof Error ? error : new Error('Unknown error occurred'))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchOrganizationData()
  }, [])

  return (
    <OrganizationContext.Provider
      value={{
        organization,
        isLoading,
        currentMember,
        refreshOrganization: fetchOrganizationData,
        error
      }}
    >
      {children}
    </OrganizationContext.Provider>
  )
}

export function useOrganization() {
  const context = useContext(OrganizationContext)
  if (context === undefined) {
    throw new Error('useOrganization must be used within a OrganizationProvider')
  }
  return context
}
