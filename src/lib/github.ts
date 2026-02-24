const OWNER = process.env.GITHUB_OWNER!;
const REPO = process.env.GITHUB_REPO!;
const PAT = process.env.GITHUB_PAT!;
const BASE = 'https://api.github.com';

function headers() {
  return {
    Authorization: `Bearer ${PAT}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };
}

export interface GitHubFile {
  content: string; // base64
  sha: string;
  download_url: string;
}

export async function getFile(path: string): Promise<GitHubFile> {
  const res = await fetch(`${BASE}/repos/${OWNER}/${REPO}/contents/${path}`, {
    headers: headers(),
    cache: 'no-store',
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub GET ${path} failed: ${res.status} ${text}`);
  }
  return res.json();
}

export async function putFile(
  path: string,
  content: string, // base64
  sha: string,
  message: string
): Promise<void> {
  const res = await fetch(`${BASE}/repos/${OWNER}/${REPO}/contents/${path}`, {
    method: 'PUT',
    headers: { ...headers(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, content, sha }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub PUT ${path} failed: ${res.status} ${text}`);
  }
}

export async function createFile(
  path: string,
  content: string, // base64
  message: string
): Promise<void> {
  const res = await fetch(`${BASE}/repos/${OWNER}/${REPO}/contents/${path}`, {
    method: 'PUT',
    headers: { ...headers(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, content }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub create ${path} failed: ${res.status} ${text}`);
  }
}
