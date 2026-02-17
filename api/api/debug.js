// api/debug.js — DELETE THIS FILE after fixing (diagnostic only)
module.exports = async function handler(req, res) {
  const owner  = process.env.GITHUB_OWNER;
  const repo   = process.env.GITHUB_REPO;
  const branch = process.env.GITHUB_BRANCH || "main";
  const token  = process.env.GITHUB_TOKEN;

  const envStatus = {
    GITHUB_OWNER:  owner  ? `OK: "${owner}"`  : "MISSING",
    GITHUB_REPO:   repo   ? `OK: "${repo}"`   : "MISSING",
    GITHUB_BRANCH: branch ? `OK: "${branch}"` : "MISSING",
    GITHUB_TOKEN:  token  ? `OK (starts with: ${token.substring(0,10)}...)` : "MISSING"
  };

  let githubTest = "skipped (env vars missing)";
  if (owner && repo && token) {
    const r = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/employees-data.js?ref=${branch}`,
      { headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json" } }
    );
    const body = await r.json().catch(() => ({}));
    if (r.ok) {
      githubTest = `SUCCESS - File found. SHA: ${body.sha}`;
    } else {
      githubTest = `FAILED (${r.status}): ${body.message}`;
    }
  }

  return res.status(200).json({ env: envStatus, github_file_test: githubTest });
};
