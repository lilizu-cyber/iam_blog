const SECURITY_KEYWORDS = [
  'security',
  'cybersecurity',
  'vulnerability',
  'threat',
  'attack',
  'malware',
  'phishing',
  'breach',
  'authentication',
  'authorization',
]

const IAM_KEYWORDS = [
  'iam',
  'identity',
  'access management',
  'authentication',
  'authorization',
  'oauth',
  'saml',
  'sso',
  'mfa',
  'multi-factor',
  'credential',
  'federation',
]

export function normalizePostTags(tags) {
  if (Array.isArray(tags)) {
    return tags.filter(Boolean).map(String)
  }

  if (typeof tags === 'string' && tags.trim()) {
    try {
      const parsed = JSON.parse(tags)
      if (Array.isArray(parsed)) {
        return parsed.filter(Boolean).map(String)
      }
    } catch {
      // fall through to comma-separated parsing
    }

    return tags.split(',').map((tag) => tag.trim()).filter(Boolean)
  }

  return []
}

function buildSearchText(post, tags) {
  return [post.title, post.excerpt, ...(Array.isArray(tags) ? tags : [])]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
}

function matchesKeywords(text, keywords) {
  return keywords.some((keyword) => text.includes(keyword.toLowerCase()))
}

export function getPostDisplayFlags(post, tags = normalizePostTags(post?.tags)) {
  const searchText = buildSearchText(post, tags)
  const categoryId = post?.category?.id || post?.categoryId

  return {
    isSecurityRelated:
      Boolean(post?.flags?.isSecurityRelated) ||
      categoryId === 'security' ||
      matchesKeywords(searchText, SECURITY_KEYWORDS),
    isIAMRelated:
      Boolean(post?.flags?.isIAMRelated) ||
      categoryId === 'iam' ||
      matchesKeywords(searchText, IAM_KEYWORDS),
  }
}

export function getPostHeroTags(post) {
  const tags = normalizePostTags(post?.tags)
  const flags = getPostDisplayFlags(post, tags)

  return {
    flags,
    tags,
  }
}
