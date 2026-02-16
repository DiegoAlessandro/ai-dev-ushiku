// @ts-check
const { generate } = require("./_lib/gemini");
const { checkRateLimit } = require("./_lib/rate-limit");

const SYSTEM_PROMPT = `あなたはECサイト・販促物向けの商品ブランディング専門AIコピーライターです。
商品情報から、魅力的な商品説明文を生成してください。

【出力フォーマット】
🏷️ キャッチコピー
（インパクトのある一文）

📖 ストーリー
（商品の背景・こだわりを2〜3文で）

✨ 特徴
・（3〜4つの箇条書き）

🎁 おすすめの楽しみ方
（1〜2文で提案）

【注意事項】
- 商品の魅力を最大限に引き出してください
- 地域性（茨城・牛久）を活かせる場合は積極的に
- 温かみのある表現で、購入意欲を高めてください
- 事実に基づき、過度な誇張は避けてください`;

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

  const { productName, category, features } = req.body || {};

  if (!productName || typeof productName !== "string") {
    return res.status(400).json({ error: "商品名を入力してください。" });
  }
  if (!category || typeof category !== "string") {
    return res.status(400).json({ error: "カテゴリを選択してください。" });
  }
  if (!features || typeof features !== "string") {
    return res.status(400).json({ error: "特徴を入力してください。" });
  }

  const totalLength = productName.length + category.length + features.length;
  if (totalLength > MAX_INPUT_LENGTH) {
    return res.status(400).json({ error: `入力は合計${MAX_INPUT_LENGTH}文字以内でお願いします。` });
  }

  try {
    const userMessage = `商品名: ${productName}\nカテゴリ: ${category}\n特徴・こだわり: ${features}`;
    const contents = [
      { role: "user", parts: [{ text: userMessage }] },
    ];
    const copy = await generate(SYSTEM_PROMPT, contents);
    return res.status(200).json({ copy });
  } catch (/** @type {any} */ err) {
    console.error("Branding API error:", err);
    return res.status(500).json({ error: "AIの応答生成中にエラーが発生しました。" });
  }
};
