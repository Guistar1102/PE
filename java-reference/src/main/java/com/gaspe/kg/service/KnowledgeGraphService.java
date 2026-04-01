package com.gaspe.kg.service;

import com.gaspe.kg.model.*;
import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.util.*;
import java.util.regex.Pattern;

public class KnowledgeGraphService {

    /**
     * 推断节点类型 (与前端 React 逻辑保持一致)
     */
    public NodeType inferNodeType(String label) {
        if (Pattern.compile("(管|PE|钢)").matcher(label).find() && !Pattern.compile("(管理|人员)").matcher(label).find()) {
            return NodeType.PIPE;
        }
        if (Pattern.compile("(阀|泵|表|计|缸|设备)").matcher(label).find()) return NodeType.VALVE;
        if (Pattern.compile("(站|厂|库|系统)").matcher(label).find()) return NodeType.STATION;
        if (Pattern.compile("(接头|法兰|三通|弯头|管件|警示带|示踪线|装置)").matcher(label).find()) return NodeType.FITTING;
        if (Pattern.compile("(风险|泄漏|腐蚀|隐患|违规|破坏|事故|报警|检测|试验|测试|评估|占压|施工)").matcher(label).find()) return NodeType.RISK;
        if (Pattern.compile("(位置|坐标|区|路|街|村|镇|市|省|环境|土壤|深度|河流|交通)").matcher(label).find()) return NodeType.LOCATION;
        if (Pattern.compile("(人|工|员|公司|单位|局|商|长|张|李|王|赵)").matcher(label).find()) return NodeType.PERSON;
        if (Pattern.compile("(文件|记录|报告|证|书|规范|标准|图|表|数据|参数|温度|压力|时间|速率|率|寿命|批号)").matcher(label).find()) return NodeType.DOCUMENT;
        
        return NodeType.UNKNOWN;
    }

    /**
     * 从三元组文本/CSV中导入数据 (与前端导入逻辑保持一致)
     */
    public GraphData importFromTriples(InputStream inputStream) throws Exception {
        BufferedReader reader = new BufferedReader(new InputStreamReader(inputStream));
        String line;
        
        Map<String, GraphNode> nodeMap = new HashMap<>();
        List<GraphLink> links = new ArrayList<>();

        while ((line = reader.readLine()) != null) {
            String trimmed = line.trim();
            if (trimmed.isEmpty()) continue;

            // 尝试使用制表符、逗号或空格分割
            String[] parts = trimmed.split("\\t");
            if (parts.length < 3) parts = trimmed.split(",");
            if (parts.length < 3) parts = trimmed.split("\\s+");

            if (parts.length >= 3) {
                String subject = parts[0].trim();
                String predicate = parts[1].trim();
                String object = parts[2].trim();

                if (subject.isEmpty() || predicate.isEmpty() || object.isEmpty()) continue;

                // 创建或获取主语节点
                nodeMap.putIfAbsent(subject, new GraphNode(
                    "node_" + UUID.randomUUID().toString(),
                    subject,
                    inferNodeType(subject)
                ));

                // 创建或获取宾语节点
                nodeMap.putIfAbsent(object, new GraphNode(
                    "node_" + UUID.randomUUID().toString(),
                    object,
                    inferNodeType(object)
                ));

                // 创建关系
                links.add(new GraphLink(
                    nodeMap.get(subject).getId(),
                    nodeMap.get(object).getId(),
                    predicate
                ));
            }
        }

        return new GraphData(new ArrayList<>(nodeMap.values()), links);
    }
}
