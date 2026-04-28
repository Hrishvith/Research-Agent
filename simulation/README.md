# Vision · AI Research Pipeline Simulation

An interactive frontend simulation demonstrating a multi-agent AI research assistant that automates literature discovery, knowledge graph construction, and insight synthesis.

## ⚠️ Simulation Notice

**This is a frontend-only simulation.** No actual AI processing, API calls, or backend operations occur. All pipeline stages, agent activities, and results are pre-programmed animations and mock data designed to showcase the user interface and workflow of a hypothetical AI research system.

## Overview

Vision is a simulated AI research pipeline that showcases a sophisticated multi-agent system for academic research automation. The system consists of 5 pipeline stages and 4 specialized agents working synergistically to process research queries and generate comprehensive literature reviews.

## What This Simulation Demonstrates

This interactive demo showcases the user experience and visual workflow of a multi-agent AI research system. It simulates:

- **Pipeline orchestration** with sequential stage activation
- **Agent coordination** with animated status indicators
- **Real-time logging** of system activities
- **Data flow visualization** using HTML5 Canvas
- **Research result presentation** with ranking and citations

## Features

### Simulated Pipeline Stages
1. **Literature Fetch** - *Simulates* retrieving papers from ArXiv and Semantic Scholar APIs
2. **Semantic Parse** - *Simulates* deep content analysis using LLM APIs and chunking
3. **Knowledge Graph** - *Simulates* building entity relationships in Neo4j database
4. **Insight Synthesis** - *Simulates* detecting contradictions and ranking insights
5. **Report Generation** - *Simulates* producing structured research summaries

### Simulated Agent System
- **Retrieval Agent** - *Simulates* fetching and filtering academic papers
- **Analysis Agent** - *Simulates* extracting methodology, results, and limitations
- **KG Agent** - *Simulates* constructing knowledge graphs with entity linking
- **Synthesis Agent** - *Simulates* resolving contradictions and generating reports

### Interactive Features
- Real-time pipeline visualization with animated data flow
- Live agent activity logging (pre-scripted messages)
- Research query presets with mock responses
- Dynamic progress tracking animations
- Citation analysis and ranking (static data)

## Technologies

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Styling**: Custom CSS with CSS Variables, Grid Layout, Flexbox
- **Animation**: CSS Animations, Canvas API for data flow visualization
- **Fonts**: Google Fonts (Space Mono, Syne)
- **Backend Simulation**: Pure JavaScript (no actual APIs called)

## How to Run

### 🚀 Quickest Method - Run Directly from GitHub
**No installation needed!** Click here to run the simulation:

👉 **[Open AI Research Pipeline Simulation](https://raw.githack.com/Hrishvith/Research-Agent/main/workflow.html)**

Or use any browser with this link:
```
https://raw.githack.com/Hrishvith/Research-Agent/main/workflow.html
```

### Local Methods:

1. **Simple Method**: Double-click the `workflow.html` file to open in your default browser
2. **Command Line**:
   ```bash
   # On Windows
   start chrome "file:///c:/path/to/workflow.html"
   
   # Or use any browser
   start firefox "file:///c:/path/to/workflow.html"
   ```

## Usage

1. Enter a research query in the input field (e.g., "Multi-agent reinforcement learning survey")
2. Click "Execute" or use one of the preset queries
3. Watch the pipeline stages activate sequentially
4. Monitor agent activities in the log stream
5. View the synthesized research results with paper rankings and citations

## Demo Queries

The system includes several preset research topics:
- Multi-agent reinforcement learning survey
- Transformer attention mechanisms
- Graph neural networks for drug discovery
- LLM reasoning and chain-of-thought

## Architecture

The pipeline demonstrates a simulated dual-engine architecture:
- **Data Intelligence Layer**: *Simulates* information retrieval and processing
- **Knowledge Synthesis Layer**: *Simulates* graph construction and insight generation

## Visual Design

- Dark theme with purple/teal color scheme
- Animated starfield background
- Grid overlay and scanline effects
- Responsive design with mobile-friendly layout
- Custom typography and spacing

## Important: This is Purely a Frontend Simulation

**No AI processing occurs.** The application contains:
- Pre-written log messages that play in sequence
- Mock research paper data
- Animated progress bars with setInterval timers
- Canvas-based particle system for visual effect
- Static JSON data for all "results"

This demo is designed to showcase UI/UX patterns for AI research tools, not to perform actual research automation.