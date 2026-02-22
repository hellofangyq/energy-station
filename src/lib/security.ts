export const SECURITY_QUESTIONS = [
  { value: "pet", labelZh: "你的第一只宠物名字？", labelEn: "Name of your first pet?" },
  { value: "school", labelZh: "你的小学名字？", labelEn: "Name of your elementary school?" },
  { value: "city", labelZh: "你出生的城市？", labelEn: "City you were born in?" },
  { value: "food", labelZh: "你最喜欢的食物？", labelEn: "Your favorite food?" },
  { value: "teacher", labelZh: "你最喜欢的老师名字？", labelEn: "Name of your favorite teacher?" },
  { value: "movie", labelZh: "你最喜欢的一部电影？", labelEn: "Your favorite movie?" }
];

const questionMap = new Map(SECURITY_QUESTIONS.map((item) => [item.value, item]));

export function getQuestionLabel(value: string, lang: "zh" | "en" = "zh") {
  const item = questionMap.get(value);
  if (!item) return "";
  return lang === "en" ? item.labelEn : item.labelZh;
}

export function normalizeAnswer(answer: string) {
  return answer.trim().toLowerCase();
}
