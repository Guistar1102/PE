package com.gaspe.kg.model;

public class GraphLink {
    private String source;
    private String target;
    private String label;

    public GraphLink() {}

    public GraphLink(String source, String target, String label) {
        this.source = source;
        this.target = target;
        this.label = label;
    }

    // Getters and Setters
    public String getSource() { return source; }
    public void setSource(String source) { this.source = source; }

    public String getTarget() { return target; }
    public void setTarget(String target) { this.target = target; }

    public String getLabel() { return label; }
    public void setLabel(String label) { this.label = label; }
}
