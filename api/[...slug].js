export default function handler(req, res) {
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  res.status(503).json({
    error: "The analysis engine is not deployed in this environment.",
    detail: "Deploy the backend/ Express server separately to enable live scanning. The demo fixture loads automatically on first visit.",
  });
}
