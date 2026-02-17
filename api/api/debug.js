// api/debug.js
// TEMPORARY file to verify your environment variables are correct.
// DELETE this file after confirming everything works (it exposes config info).

export default async function handler(req, res) {
  const owner  = process.env.GITHUB_OWNER;
  const repo   = process.env.GITHUB_REPO;
  const branch = process.env.GITHUB_BRANCH;
  const token  = process.env.GITHUB_TOKEN;

  // Test 1: Check env vars are loaded
  const envCheck = {
    GITHUB_OWNER:  owner  ? `✅ "${owner}"`  : "❌ MISSING",
    GITHUB_REPO:   repo   ? `✅ "${repo}"`   : "❌ MISSING",
    GITHUB_BRANCH: branch ? `✅ "${branch}"` : "❌ MISSING",
    GITHUB_TOKEN:  token  ? `✅ set (${token.substring(0, 8)}...)` : "❌ MISSING",
  };

  // Test 2: Try to fetch the file from GitHub
  let githubTest = "not attempted";
  if (owner && repo && token && branch) {
    try {
      const r = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/contents/employees-data.js?ref=${branch}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/vnd.github+json",
          },
        }
      );
      const body = await r.json();
      if (r.ok) {
        githubTest = `✅ File found! SHA: ${body.sha}`;
      } else {
        githubTest = `❌ GitHub returned ${r.status}: ${body.message}`;
      }
    } catch (e) {
      githubTest = `❌ Fetch error: ${e.message}`;
    }
  } else {
    githubTest = "❌ Skipped – env vars missing";
  }

  return res.status(200).json({
    environment_variables: envCheck,
    github_file_access: githubTest,
  });
}
