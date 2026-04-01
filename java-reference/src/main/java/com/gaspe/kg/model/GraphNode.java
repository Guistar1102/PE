package com.gaspe.kg.model;

import java.util.Map;

public class GraphNode {
    private String id;
    private String label;
    private NodeType type;
    private Map<String, Object> properties;
    private String color;
    private Double x;
    private Double y;

    public GraphNode() {}

    public GraphNode(String id, String label, NodeType type) {
        this.id = id;
        this.label = label;
        this.type = type;
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getLabel() { return label; }
    public void setLabel(String label) { this.label = label; }

    public NodeType getType() { return type; }
    public void setType(NodeType type) { this.type = type; }

    public Map<String, Object> getProperties() { return properties; }
    public void setProperties(Map<String, Object> properties) { this.properties = properties; }

    public String getColor() { return color; }
    public void setColor(String color) { this.color = color; }

    public Double getX() { return x; }
    public void setX(Double x) { this.x = x; }

    public Double getY() { return y; }
    public void setY(Double y) { this.y = y; }
}
