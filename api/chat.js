// @ts-check
const { generate } = require("./_lib/gemini");
const { checkRateLimit } = require("./_lib/rate-limit");

const SYSTEM_PROMPT = `あなたは茨城県牛久市にある「さくら歯科クリニック」の受付AIアシスタントです。
患者さんからの問い合わせに丁寧に対応してください。

【クリニック情報】
- 診療時間: 平日 9:00-13:00 / 14:30-18:30、土曜 9:00-13:00
- 休診日: 日曜・祝日・木曜午後
- 住所: 茨城県牛久市中央3-15-1
- 電話: 029-874-XXXX

【対応可能な内容】
- 診療予約の案内（空き状況の確認方法）
- メニュー・料金の案内（保険診療・自費診療）
- アクセス方法（駐車場あり・牛久駅から徒歩10分）
- 初診の流れ（持ち物：保険証、お薬手帳）

【注意事項】
- 具体的な医療判断や診断は行わないでください
- 緊急の場合は電話連絡を案内してください
- 回答は簡潔に、3〜4文以内で答えてください
- これはデモです。実在のクリニックではありません。`;

const MAX_HISTORY = 5;
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

  const { message, history } = req.body || {};

  if (!message || typeof message !== "string") {
    return res.status(400).json({ error: "メッセージを入力してください。" });
  }
  if (message.length > MAX_INPUT_LENGTH) {
    return res.status(400).json({ error: `メッセージは${MAX_INPUT_LENGTH}文字以内でお願いします。` });
  }

  try {
    /** @type {Array<{role: string, parts: Array<{text: string}>}>} */
    const contents = [];

    if (Array.isArray(history)) {
      const recent = history.slice(-MAX_HISTORY * 2);
      for (const item of recent) {
        if (item.role && item.text && typeof item.text === "string") {
          contents.push({
            role: item.role === "user" ? "user" : "model",
            parts: [{ text: item.text.slice(0, MAX_INPUT_LENGTH) }],
          });
        }
      }
    }

    contents.push({ role: "user", parts: [{ text: message }] });

    const reply = await generate(SYSTEM_PROMPT, contents);
    return res.status(200).json({ reply });
  } catch (/** @type {any} */ err) {
    console.error("Chat API error:", err);
    return res.status(500).json({ error: "AIの応答生成中にエラーが発生しました。" });
  }
};
