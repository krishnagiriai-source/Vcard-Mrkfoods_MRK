export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false });
  }

  try {
    const { employees } = req.body;

    const content = `// Auto-generated file
window.MRK_EMPLOYEES = ${JSON.stringify(employees, null, 2)};`;

    const base64Content = Buffer.from(content).toString("base64");

    const response = await fetch(
      `https://api.github.com/repos/${process.env.GITHUB_OWNER}/${process.env.GITHUB_REPO}/contents/employees-data.js`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: "Auto update employees-data.js from dashboard",
          content: base64Content,
          branch: process.env.GITHUB_BRANCH
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(500).json({ success: false, error: data });
    }

    return res.status(200).json({ success: true });

  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}
