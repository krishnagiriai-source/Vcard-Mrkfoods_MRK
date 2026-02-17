export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  try {
    const { employees } = req.body;

    const owner = process.env.GITHUB_OWNER;
    const repo = process.env.GITHUB_REPO;
    const branch = process.env.GITHUB_BRANCH;
    const token = process.env.GITHUB_TOKEN;

    const filePath = "employees-data.js";

    // 1️⃣ Get existing file (get SHA)
    const getResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}?ref=${branch}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json"
        }
      }
    );

    if (!getResponse.ok) {
      const err = await getResponse.json();
      return res.status(500).json({ success: false, error: err });
    }

    const fileData = await getResponse.json();
    const sha = fileData.sha;

    // 2️⃣ Prepare updated content
    const newContent =
      `// Auto-generated file\n` +
      `window.MRK_EMPLOYEES = ${JSON.stringify(employees, null, 2)};`;

    const base64Content = Buffer.from(newContent).toString("base64");

    // 3️⃣ Update file
    const updateResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: "Auto update employees-data.js from dashboard",
          content: base64Content,
          sha: sha,
          branch: branch
        })
      }
    );

    const updateData = await updateResponse.json();

    if (!updateResponse.ok) {
      return res.status(500).json({ success: false, error: updateData });
    }

    return res.status(200).json({ success: true });

  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}
