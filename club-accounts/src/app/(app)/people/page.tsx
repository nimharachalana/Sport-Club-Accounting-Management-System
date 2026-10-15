import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { createClient as createAdminClient } from "@supabase/supabase-js"
import { PeopleClient } from "@/components/people/people-client"
import type { ClubPerson } from "@/components/people/types"

export default async function PeoplePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Get current user profile/role
  const { data: myProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  const isAdmin = myProfile?.role === "admin"

  // Fetch all profiles from public.profiles
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, role, created_at")

  const profileMap = new Map(
    (profiles || []).map((p) => [p.id, p])
  )

  // Fetch auth users using the service role admin client
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

  type AuthUser = {
    id: string
    email?: string
    user_metadata?: { full_name?: string }
    created_at?: string
  }

  let authUsers: AuthUser[] = []
  if (serviceKey && supabaseUrl) {
    const admin = createAdminClient(supabaseUrl, serviceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
    const { data: authData } = await admin.auth.admin.listUsers({
      perPage: 1000,
    })
    authUsers = (authData?.users || []) as AuthUser[]
  }

  // Merge into ClubPerson list
  const people: ClubPerson[] = authUsers.map((authUser) => {
    const prof = profileMap.get(authUser.id)
    return {
      id: authUser.id,
      email: authUser.email || "",
      fullName:
        prof?.full_name ||
        authUser.user_metadata?.full_name ||
        authUser.email?.split("@")[0] ||
        "Member",
      role: (prof?.role as "admin" | "viewer") || "viewer",
      createdAt: prof?.created_at || authUser.created_at || "",
    }
  })

  // Sort: Admins first, then by createdAt desc
  people.sort((a, b) => {
    if (a.role === "admin" && b.role !== "admin") return -1
    if (a.role !== "admin" && b.role === "admin") return 1
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })

  return (
    <PeopleClient
      people={people}
      isAdmin={isAdmin}
      currentUserId={user.id}
    />
  )
}
