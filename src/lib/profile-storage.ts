import type { AuthUser, ProfileDetails } from '../types/app'

const PROFILE_STORAGE_PREFIX = 'nexhub-profile-details'

function buildStorageKey(userId: number) {
  return `${PROFILE_STORAGE_PREFIX}:${userId}`
}

export function createDefaultProfileDetails(user: AuthUser): ProfileDetails {
  return {
    displayName: user.username,
    username: user.username,
    bio: 'Backend developer focused on Java and distributed systems.',
    primaryRole: 'Backend Developer',
    experienceLevel: 'Mid-level',
    skills: ['Java', 'Spring', 'PostgreSQL'],
    location: 'Buenos Aires, Argentina',
    website: '',
    githubUsername: '',
  }
}

export function readStoredProfileDetails(user: AuthUser): ProfileDetails {
  const stored = window.localStorage.getItem(buildStorageKey(user.id))

  if (!stored) {
    return createDefaultProfileDetails(user)
  }

  try {
    const parsed = JSON.parse(stored) as Partial<ProfileDetails>
    return {
      ...createDefaultProfileDetails(user),
      ...parsed,
      skills: Array.isArray(parsed.skills)
        ? parsed.skills.filter((value): value is string => typeof value === 'string')
        : createDefaultProfileDetails(user).skills,
    }
  } catch {
    window.localStorage.removeItem(buildStorageKey(user.id))
    return createDefaultProfileDetails(user)
  }
}

export function persistProfileDetails(userId: number, details: ProfileDetails) {
  window.localStorage.setItem(buildStorageKey(userId), JSON.stringify(details))
}
