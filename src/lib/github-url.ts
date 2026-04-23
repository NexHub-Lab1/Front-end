const GITHUB_REPOSITORY_URL_PATTERN = /^https:\/\/github\.com\/[^/\s]+\/[^/\s]+\/?$/

export function isGithubRepositoryUrl(value: string) {
  return GITHUB_REPOSITORY_URL_PATTERN.test(value.trim())
}
