import { GoogleGenerativeAI } from '@google/generative-ai';

export async function analyzeContract(text, apiKey) {
  if (!apiKey) {
    throw new Error('Gemini API Key não configurada.');
  }

  const genAI = new GoogleGenerativeAI(apiKey);

  // Using gemini-2.5-flash which is widely supported and fast
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    generationConfig: {
      responseMimeType: 'application/json'
    }
  });

  const prompt = `
Você é um especialista em compliance contratual e análise de risco legal.
Analise o contrato a seguir e extraia as seguintes informações:
1. Nível de risco geral do contrato ("low", "medium" ou "high")
2. Resumo da análise do contrato
3. Cláusulas identificadas com seus tipos, nível de risco individual, título e uma breve descrição da cláusula e seu impacto.

Retorne obrigatoriamente um JSON no seguinte formato:
{
  "risk_level": "low" | "medium" | "high",
  "summary": "Resumo explicativo do contrato e seus riscos...",
  "clauses": [
    {
      "type": "Ex: Rescisão, Propriedade Intelectual, Foro, Multas",
      "risk_level": "low" | "medium" | "high",
      "title": "Nome da Cláusula",
      "description": "Explicação detalhada do porquê esta cláusula é de baixo, médio ou alto risco"
    }
  ]
}

Retorne APENAS o JSON. Não inclua blocos markdown (como \`\`\`json) ou textos introdutórios/explicativos.

Contrato a ser analisado:
---
${text.substring(0, 30000)}
---
`;

  const result = await model.generateContent(prompt);
  const responseText = result.response.text().trim();

  try {
    return JSON.parse(responseText);
  } catch (error) {
    // Ajusta a resposta se conter anotações do Markdown, como  ```json ... ```
    let cleanText = responseText;
    if (cleanText.startsWith('```')) {
      cleanText = cleanText.replace(/^```json\s*/, '').replace(/```$/, '').trim();
    }
    return JSON.parse(cleanText);
  }
}
