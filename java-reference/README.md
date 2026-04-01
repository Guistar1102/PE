# Java Backend Reference for Knowledge Graph

This directory contains a reference implementation for a Java backend that mirrors the data structures and logic used in the React frontend of the Gas PE Pipeline Knowledge Graph.

## Purpose
If you want to reproduce this Knowledge Graph application on a Java-based platform (e.g., Spring Boot), you can use these classes as your starting point. The frontend application expects data in the format defined by `GraphData`, `GraphNode`, and `GraphLink`.

## Contents

1. **Models (`com.gaspe.kg.model`)**
   - `NodeType.java`: Enum matching the TypeScript `NodeType` enum.
   - `GraphNode.java`: POJO representing a node in the graph.
   - `GraphLink.java`: POJO representing a relationship between two nodes.
   - `GraphData.java`: The main wrapper object containing lists of nodes and links. This is the exact JSON structure the frontend expects.

2. **Services (`com.gaspe.kg.service`)**
   - `KnowledgeGraphService.java`: Contains the core business logic replicated from the frontend:
     - `inferNodeType()`: The regex-based algorithm that automatically categorizes entities based on their Chinese labels (e.g., assigning "管道" to `NodeType.PIPE`).
     - `importFromTriples()`: The logic to parse TXT/CSV triples (Subject, Predicate, Object) into the `GraphData` structure.

## How to use with Spring Boot

If you are building a REST API, you can create a controller like this:

```java
@RestController
@RequestMapping("/api/graph")
public class GraphController {

    @Autowired
    private KnowledgeGraphService kgService;

    // Endpoint to get the graph data
    @GetMapping("/data")
    public ResponseEntity<GraphData> getGraphData() {
        // Fetch from Neo4j, MySQL, or memory
        // return ResponseEntity.ok(graphData);
    }

    // Endpoint to upload triples
    @PostMapping("/upload-triples")
    public ResponseEntity<GraphData> uploadTriples(@RequestParam("file") MultipartFile file) {
        try {
            GraphData data = kgService.importFromTriples(file.getInputStream());
            // Save to database...
            return ResponseEntity.ok(data);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
}
```

## Frontend Integration
To connect the existing React frontend to your new Java backend:
1. In `App.tsx`, replace the `INITIAL_DATA` state initialization with a `fetch()` call to your Java API endpoint (`/api/graph/data`).
2. Replace the local `handleImportTriples` function with a `FormData` upload to your Java backend (`/api/graph/upload-triples`).
