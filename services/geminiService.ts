import { GoogleGenAI, Type } from "@google/genai";
import { AIModel, ExtractionResult } from '../types';

export const extractGraphFromText = async (
  text: string, 
  model: AIModel = AIModel.FLASH
): Promise<ExtractionResult> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key not found in environment variables");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const systemInstruction = `
    你是一个燃气工程领域的专家和数据分析师。你的任务是从非结构化的文本中提取构建“燃气PE管道知识图谱”所需的实体（Nodes）和关系（Links）。
    
    请识别以下类型的实体：
    - PIPE (管道: PE管, 钢骨架管等)
    - VALVE (阀门: 闸阀, 球阀等)
    - STATION (场站: 调压站, 调压柜)
    - FITTING (管件: 弯头, 三通, 变径)
    - RISK (风险: 腐蚀, 占压, 泄漏)
    - LOCATION (位置: 道路, 小区, 坐标)
    - PERSON (人员: 巡检员, 施工队)
    - DOCUMENT (文档: 施工图, 规范)
    
    返回 strict JSON 格式。
  `;

  // Define strict schema for JSON output
  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      nodes: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING, description: "Unique identifier (e.g., node_1)" },
            label: { type: Type.STRING, description: "Display name of the entity" },
            type: { 
              type: Type.STRING, 
              description: "Entity type (PIPE, VALVE, STATION, FITTING, RISK, LOCATION, PERSON, DOCUMENT)" 
            },
            properties: {
              type: Type.OBJECT,
              properties: {
                 info: { type: Type.STRING, description: "Any extracted details combined into a string" }
              },
              description: "Additional attributes extracted"
            }
          },
          required: ["id", "label", "type"]
        }
      },
      links: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            source: { type: Type.STRING, description: "The ID of the source node" },
            target: { type: Type.STRING, description: "The ID of the target node" },
            label: { type: Type.STRING, description: "Relationship name (e.g., CONNECTS_TO, LOCATED_AT)" }
          },
          required: ["source", "target", "label"]
        }
      }
    },
    required: ["nodes", "links"]
  };

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: text,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.1, // Low temperature for factual extraction
      }
    });

    const resultText = response.text;
    if (!resultText) {
        throw new Error("No response from AI");
    }

    const data = JSON.parse(resultText) as ExtractionResult;
    return data;

  } catch (error) {
    console.error("Gemini Extraction Error:", error);
    throw error;
  }
};
