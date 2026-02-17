export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false });
  }

  try {
    const { employees } = req.body;

    const owner = process.env.GITHUB_OWNER;
    const repo = process.env.GITHUB_REPO;
    const branch = process.env.GITHUB_BRANCH;
    const token = process.env.GITHUB_TOKEN;

    const path = "employees-data.js";

    // 1️⃣ GET existing file to get SHA
    const getFile = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json"
        }
      }
    );

    if (!getFile.ok) {
      const err = await getFile.json();
      return res.status(500).json({ success: false, error: err });
    }

    const fileData = await getFile.json();
    const sha = fileData.sha;

    // 2️⃣ Create new file content
    const content = `
window.MRK_EMPLOYEES = ${JSON.stringify(employees, null, 2)};
`;

    const base64Content = Buffer.from(content).toString("base64");

    // 3️⃣ PUT update with SHA
    const updateFile = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json"
        },
        body: JSON.stringify({
          message: "Auto update employees-data.js",
          content: base64Content,
          sha: sha,
          branch: branch
        })
      }
    );

    const updateResult = await updateFile.json();

    if (!updateFile.ok) {
      return res.status(500).json({ success: false, error: updateResult });
    }

    return res.status(200).json({ success: true });

  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}
