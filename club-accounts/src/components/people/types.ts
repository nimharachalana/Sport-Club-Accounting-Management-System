export interface ClubPerson {
  id: string
  email: string
  fullName: string
  role: 'admin' | 'viewer'
  createdAt: string
}
