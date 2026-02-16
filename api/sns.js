// @ts-check
const { generate } = require("./_lib/gemini");
const { checkRateLimit } = require("./_lib/rate-limit");

const SYSTEM_PROMPT = `あなたは地域密着型飲食店のSNSマーケティング専門AIです。
料理名や商品情報から、Instagram向けの魅力的な投稿文を生成してください。

【出力フォーマット】
投稿文（3〜4行、絵文字を効果的に使用）

ハッシュタグ（10〜15個、以下を含む）:
- 料理・食材関連タグ
- 地域タグ: #牛久 #牛久グルメ #牛久ランチ #茨城グルメ #つくばグルメ
- 一般タグ: #今日のランチ #おすすめ #地元の味

【注意事項】
- 食欲をそそる表現を使ってください
- 地元の食材や季節感をアピールしてください
- 投稿文は親しみやすいトーンで
- ハッシュタグは改行して見やすく`;

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

  const { productName, description } = req.body || {};

  if (!productName || typeof productName !== "string") {
    return res.status(400).json({ error: "料理名を入力してください。" });
  }
  if (productName.length > MAX_INPUT_LENGTH) {
    return res.status(400).json({ error: `入力は${MAX_INPUT_LENGTH}文字以内でお願いします。` });
  }

  try {
    let userMessage = `料理名: ${productName}`;
    if (description && typeof description === "string") {
      userMessage += `\n補足: ${description.slice(0, MAX_INPUT_LENGTH)}`;
    }

    const contents = [
      { role: "user", parts: [{ text: userMessage }] },
    ];
    const post = await generate(SYSTEM_PROMPT, contents);
    return res.status(200).json({ post });
  } catch (/** @type {any} */ err) {
    console.error("SNS API error:", err);
    return res.status(500).json({ error: "AIの応答生成中にエラーが発生しました。" });
  }
};
