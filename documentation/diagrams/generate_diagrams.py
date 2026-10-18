import urllib.request
import urllib.parse
import os
import ssl

# Diagram 1: Project Flow Diagram
flow_diagram = """
@startuml
!theme spacelab
skinparam backgroundColor white
skinparam BoxPadding 10
skinparam defaultFontName Arial

title Project Workflow - Agentic RAG System

actor User

box "Frontend" #LightCyan
participant "Vanilla JS UI\\n(index.html)" as UI
end box

box "Backend (FastAPI)" #LightGoldenRodYellow
participant "app.py\\n(API Endpoints)" as API
participant "retrieve.py\\n(RAG Core Logic)" as RAG
end box

box "Data Ingestion (Offline)" #LightGreen
participant "ingest.py" as Ingest
database "ChromaDB" as DB
end box

box "External Services" #LightPink
participant "HuggingFace\\n(Embedding)" as HF
participant "Gemini / NVIDIA\\n(LLM API)" as LLM
end box

== 1. Data Ingestion Phase ==
Ingest -> Ingest : Read PDFs & Clean Text
Ingest -> Ingest : Hierarchical Chunking (Nodes)
Ingest -> HF : Get Embeddings
HF --> Ingest : Vectors
Ingest -> DB : Store Vectors & Metadata

== 2. Retrieval & Chat Phase ==
User -> UI : Enter Query
UI -> API : POST /chat {query}
API -> RAG : answer_query(query)
RAG -> LLM : Expand Query (HyDE)
LLM --> RAG : Expanded Query
RAG -> HF : Embed Expanded Query
HF --> RAG : Query Vector
RAG -> DB : Vector Search (top_k=10)
DB --> RAG : Retrieve Documents
RAG -> RAG : Rerank Nodes (SentenceTransformer)
RAG -> LLM : Prompt + Context + Original Query
LLM --> RAG : Generated Answer
RAG --> API : ChatResponse {answer, sources}
API --> UI : JSON Response
UI --> User : Display Answer & Sources
@enduml
"""

# Diagram 2: UML Class Diagram
uml_diagram = """
@startuml
!theme spacelab
skinparam classAttributeIconSize 0
skinparam defaultFontName Arial

package "Frontend" {
    class "index.html" as IndexHTML {
        +fetchChatResponse(query: String)
        +displayAnswer(answer: String)
        +displaySources(sources: List)
    }
}

package "API Layer (src/app.py)" {
    class ChatRequest {
        +query: str
    }

    class ChatResponse {
        +answer: str
        +sources: list
    }

    class "FastAPI Application" as FastAPIApp {
        +chat_endpoint(request: ChatRequest): ChatResponse
    }
}

package "RAG Engine (src/retrieve.py)" {
    class RetrieveModule << (M, #FF7700) module >> {
        - _index: VectorStoreIndex
        - _retriever: VectorIndexRetriever
        - _reranker: SentenceTransformerRerank
        + get_models(): Tuple
        + setup(): VectorStoreIndex
        + expand_query(query: str, gemini, nvidia): str
        + call_llm(gemini, nvidia, prompt: str): str
        + answer_query(query: str): dict
        + main()
    }
}

package "Ingestion Pipeline (src/ingest.py)" {
    class IngestModule << (M, #FF7700) module >> {
        + clean_text(text: str): str
        + parse_pdfs_to_documents(source_dir: str): List[Document]
        + build_index()
    }
}

package "LlamaIndex Core" {
    class VectorStoreIndex
    class ChromaVectorStore
    class HuggingFaceEmbedding
    class SentenceTransformerRerank
}

IndexHTML ..> FastAPIApp : HTTP POST
FastAPIApp ..> ChatRequest
FastAPIApp ..> ChatResponse
FastAPIApp --> RetrieveModule : calls answer_query()

RetrieveModule --> VectorStoreIndex
RetrieveModule --> ChromaVectorStore
RetrieveModule --> HuggingFaceEmbedding
RetrieveModule --> SentenceTransformerRerank

IngestModule --> VectorStoreIndex
IngestModule --> ChromaVectorStore
IngestModule --> HuggingFaceEmbedding

note bottom of RetrieveModule
Handles Query Expansion, Retrieval,
Reranking, and LLM Synthesis
end note

@enduml
"""

def generate_image(plantuml_text, filename):
    url = "https://kroki.io/plantuml/png"
    req = urllib.request.Request(url, data=plantuml_text.encode('utf-8'), method='POST')
    req.add_header('Content-Type', 'text/plain')
    req.add_header('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36')
    req.add_header('Accept', 'image/png')
    
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE

    try:
        with urllib.request.urlopen(req, context=ctx) as response:
            image_data = response.read()
            with open(filename, "wb") as f:
                f.write(image_data)
            print(f"Successfully saved {filename}")
    except Exception as e:
        print(f"Failed to generate {filename}: {e}")

if __name__ == "__main__":
    out_dir = r"c:\Users\ASUS\OneDrive\Desktop\RAG"
    
    print("Generating Project Flow Diagram...")
    generate_image(flow_diagram, os.path.join(out_dir, "project_flow.png"))
    
    print("Generating UML Diagram...")
    generate_image(uml_diagram, os.path.join(out_dir, "uml_diagram.png"))
