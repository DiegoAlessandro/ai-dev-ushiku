// @ts-check
const { generate } = require("./_lib/gemini");
const { checkRateLimit } = require("./_lib/rate-limit");

const SYSTEM_PROMPT = `あなたは建設現場の日報を清書する専門AIです。
現場監督が忙しい中でメモした雑な文章を、プロ品質の業務報告書に変換してください。

【出力フォーマット】
■ 日報（清書済み）
━━━━━━━━━━━━━━━━
日付：（メモから推定、なければ本日）
現場名：（メモから推定）
天候：（メモから推定）

【本日の作業内容】
・（箇条書きで整理）

【進捗状況】
（全体の進捗を簡潔に）

【明日の予定】
・（メモにあれば記載）

【特記事項・安全管理】
（気になる点があれば記載）
━━━━━━━━━━━━━━━━

【注意事項】
- 元のメモにある情報のみを使い、事実を捏造しないでください
- 専門用語は適切に使用してください
- 簡潔で読みやすい文章にしてください`;

const MAX_INPUT_LENGTH = 500;

/**
 * @param {import('@vercel/node').VercelRequest} req
 * @param {import('@vercel/node').VercelResponse} res
 */
module.exports = async function handler(req, res) {
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { allowed } = checkRateLimit(req);
  if (!allowed) {
    return res.status(429).json({ error: "リクエスト制限に達しました。1分後に再度お試しください。" });
  }

  const { roughNotes } = req.body || {};

  if (!roughNotes || typeof roughNotes !== "string") {
    return res.status(400).json({ error: "メモを入力してください。" });
  }
  if (roughNotes.length > MAX_INPUT_LENGTH) {
    return res.status(400).json({ error: `入力は${MAX_INPUT_LENGTH}文字以内でお願いします。` });
  }

  try {
    const contents = [
      { role: "user", parts: [{ text: roughNotes }] },
    ];
    const cleanReport = await generate(SYSTEM_PROMPT, contents);
    return res.status(200).json({ cleanReport });
  } catch (/** @type {any} */ err) {
    console.error("Report API error:", err);
    return res.status(500).json({ error: "AIの応答生成中にエラーが発生しました。" });
  }
};
