// api/publish.js — CommonJS (works on all Vercel static site setups)
module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ success: false, error: "Method not allowed" });

  try {
    const owner  = process.env.GITHUB_OWNER;
    const repo   = process.env.GITHUB_REPO;
    const branch = process.env.GITHUB_BRANCH || "main";
    const token  = process.env.GITHUB_TOKEN;

    // Check all env vars exist
    const missing = [!owner && "GITHUB_OWNER", !repo && "GITHUB_REPO", !token && "GITHUB_TOKEN"].filter(Boolean);
    if (missing.length) {
      return res.status(500).json({ success: false, error: "Missing env vars: " + missing.join(", ") });
    }

    // Parse body
    let employees;
    try {
      const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      employees = body && body.employees;
    } catch (e) {
      return res.status(400).json({ success: false, error: "Invalid JSON body" });
    }
    if (!Array.isArray(employees)) {
      return res.status(400).json({ success: false, error: "employees must be an array" });
    }

    const filePath = "employees-data.js";
    const apiUrl   = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`;
    const ghHeaders = {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
      "X-GitHub-Api-Version": "2022-11-28"
    };

    // STEP 1: GET existing file SHA (required for updates)
    const getRes = await fetch(`${apiUrl}?ref=${branch}`, { headers: ghHeaders });
    let sha = null;
    if (getRes.status === 200) {
      const fd = await getRes.json();
      sha = fd.sha;
    } else if (getRes.status !== 404) {
      const errBody = await getRes.json().catch(() => ({}));
      return res.status(500).json({
        success: false,
        error: `GitHub GET failed (${getRes.status}): ${errBody.message || "unknown"}`,
        debug: { owner, repo, branch, filePath }
      });
    }

    // STEP 2: Build new file content
    const now = new Date().toISOString();
    const fileContent =
      `// MRK Foods - Employee Data File\n` +
      `// Auto-published: ${now}\n` +
      `window.MRK_EMPLOYEES = ${JSON.stringify(employees, null, 2)};\n`;
    const base64Content = Buffer.from(fileContent).toString("base64");

    // STEP 3: PUT (create or update)
    const putBody = { message: `Auto-publish employees (${now})`, content: base64Content, branch };
    if (sha) putBody.sha = sha; // Required when file already exists

    const putRes  = await fetch(apiUrl, { method: "PUT", headers: ghHeaders, body: JSON.stringify(putBody) });
    const putData = await putRes.json().catch(() => ({}));

    if (!putRes.ok) {
      return res.status(500).json({
        success: false,
        error: `GitHub PUT failed (${putRes.status}): ${putData.message || "unknown"}`,
        debug: { owner, repo, branch, filePath, sha_used: sha }
      });
    }

    return res.status(200).json({
      success: true,
      message: "employees-data.js updated on GitHub!",
      commit_url: putData.commit ? putData.commit.html_url : null
    });

  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};
