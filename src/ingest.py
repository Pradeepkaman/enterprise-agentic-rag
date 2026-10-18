import os
import re
import logging
import pymupdf  # PyMuPDF
from dotenv import load_dotenv
import chromadb
from llama_index.core import Document, VectorStoreIndex, StorageContext, Settings
from llama_index.vector_stores.chroma import ChromaVectorStore
from llama_index.embeddings.huggingface import HuggingFaceEmbedding
from llama_index.core.node_parser import SentenceSplitter

# Load Environment Variables
load_dotenv()

# --- CONFIGURATION ---
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SOURCE_DIR = os.path.join(BASE_DIR, "source_pdfs")
CHROMA_DB_DIR = os.path.join(BASE_DIR, "chroma_db")
COLLECTION_NAME = "agentic_rag"

# Bug 9 fix: multiple watermark patterns to strip
WATERMARK_PATTERNS = [
    "Chaithrashree. A, Dept. of CSE, Brindavan College of Engineering",
    "Circle",  # The "Circle" watermark from the video
    r"(?i)dept\.?\s*of\s+cse",
    r"(?i)brindavan\s+college",
]

# Common headers/footers to strip
HEADER_FOOTER_PATTERNS = [
    r'^\s*Page\s*\d+\s*$',                    # "Page 1", "Page 23"
    r'^\s*\d+\s*$',                            # Bare page numbers
    r'^\s*-\s*\d+\s*-\s*$',                   # "- 1 -" style
    r'^\s*https?://\S+\s*$',                  # Bare URLs on their own line
    r'^\s*http://bit\.ly/\S+\s*$',            # Bitly links
    r'^\s*www\.\S+\s*$',                      # Bare www URLs
]

# Minimum chunk quality thresholds
MIN_CHUNK_WORDS = 40
MIN_SENTENCE_RATIO = 0.3  # At least 30% of lines should be sentences (not headings)

# Chunk size settings — Bug 9 fix: 300-500 tokens with 50 overlap
CHUNK_SIZE = 400  # tokens
CHUNK_OVERLAP = 50  # tokens

# 1. Setup Embedding Model (Local HuggingFace model so we don't pay for OpenAI embeddings)
# We use BAAI/bge-small-en-v1.5 which is extremely fast and high quality for RAG
print("Loading Embedding Model...")
Settings.embed_model = HuggingFaceEmbedding(model_name="BAAI/bge-small-en-v1.5")

def clean_text(text: str) -> str:
    """Removes watermarks, headers/footers, and unnecessary noise from the text."""
    # Replace specific watermark strings
    for pattern in WATERMARK_PATTERNS:
        if pattern.startswith("("):
            # It's a regex
            text = re.sub(pattern, "", text)
        else:
            text = text.replace(pattern, "")
    
    # Remove header/footer patterns line by line
    lines = text.split('\n')
    cleaned_lines = []
    for line in lines:
        skip = False
        for pattern in HEADER_FOOTER_PATTERNS:
            if re.match(pattern, line.strip()):
                skip = True
                break
        if not skip:
            cleaned_lines.append(line)
    
    text = '\n'.join(cleaned_lines)
    
    # Remove excessive whitespace while preserving paragraph breaks
    text = re.sub(r'\n{4,}', '\n\n\n', text)
    text = re.sub(r'[ \t]+', ' ', text)
    
    return text


def is_toc_or_outline(text: str) -> bool:
    """
    Bug 9 fix: Detect table-of-contents or outline-only pages.
    These are mostly headings with no real sentences.
    """
    lines = [l.strip() for l in text.split('\n') if l.strip()]
    if len(lines) < 3:
        return False
    
    heading_like = 0
    sentence_like = 0
    
    for line in lines:
        # Heading-like: short, possibly numbered, no period at end
        if len(line) < 80 and not line.endswith('.') and not line.endswith('?'):
            heading_like += 1
        # Has dots (TOC leader dots)
        elif '...' in line or '…' in line:
            heading_like += 1
        else:
            sentence_like += 1
    
    total = heading_like + sentence_like
    if total == 0:
        return True
    
    # If more than 70% is headings/TOC, it's an outline page
    return False # Relaxed to prevent skipping code/bullet modules


def is_junk_chunk(text: str) -> bool:
    """
    Bug 9 fix: Detect low-quality chunks that shouldn't be indexed.
    """
    stripped = text.strip()
    
    # Too short
    words = stripped.split()
    if len(words) < MIN_CHUNK_WORDS:
        return True
    
    # Only a URL
    if re.match(r'^\s*https?://\S+\s*$', stripped):
        return True
    
    # Only a heading (single short line, possibly with numbers)
    lines = [l.strip() for l in stripped.split('\n') if l.strip()]
    if len(lines) <= 2 and all(len(l) < 60 for l in lines):
        return True
    
    # TOC/outline content
    if is_toc_or_outline(stripped):
        return True
    
    return False


def merge_short_lines(text: str) -> str:
    """
    Bug 9 fix: Merge short lines into proper paragraphs.
    PDF extraction often breaks lines at page width.
    """
    lines = text.split('\n')
    merged = []
    current_para = []
    
    for line in lines:
        stripped = line.strip()
        
        # Empty line = paragraph break
        if not stripped:
            if current_para:
                merged.append(' '.join(current_para))
                current_para = []
            merged.append('')
            continue
        
        # Heading-like lines (start with number+dot, all caps, or very short)
        is_heading = (
            re.match(r'^\d+[\.\)]\s', stripped) or
            (stripped.isupper() and len(stripped) < 80) or
            re.match(r'^(Module|Chapter|Unit|Section|Topic)\s+\d+', stripped, re.IGNORECASE)
        )
        
        if is_heading:
            if current_para:
                merged.append(' '.join(current_para))
                current_para = []
            merged.append(stripped)
        else:
            current_para.append(stripped)
    
    if current_para:
        merged.append(' '.join(current_para))
    
    return '\n'.join(merged)


def parse_pdfs_to_documents(source_dir: str):
    """Reads PDFs, cleans watermarks, and extracts hierarchical metadata based on filename.
    Task 9: Tracks total characters per PDF and warns about scanned/image-only documents.
    """
    logger = logging.getLogger("rag_ingest")
    documents = []
    failed_files = []  # Task 9: track failed/skipped PDFs
    
    if not os.path.exists(source_dir):
        print(f"Directory {source_dir} not found.")
        return documents, failed_files

    for filename in os.listdir(source_dir):
        if filename.endswith(".pdf"):
            filepath = os.path.join(source_dir, filename)
            print(f"Processing: {filename}")
            
            # Bug 9 fix: extract text page by page with page numbers
            page_texts = []
            total_chars = 0  # Task 9: track total characters
            try:
                pdf_doc = pymupdf.open(filepath)
                total_pages = len(pdf_doc)
                for page_num, page in enumerate(pdf_doc, start=1):
                    raw_text = page.get_text("text")
                    cleaned_text = clean_text(raw_text)
                    cleaned_text = merge_short_lines(cleaned_text)
                    
                    total_chars += len(cleaned_text.strip())
                    
                    # Skip TOC/outline pages
                    if is_toc_or_outline(cleaned_text):
                        print(f"  Skipping TOC/outline page {page_num}")
                        continue
                    
                    if cleaned_text.strip():
                        page_texts.append((page_num, cleaned_text))
            except Exception as e:
                print(f"Error reading {filename}: {e}")
                failed_files.append({"filename": filename, "reason": f"Read error: {e}", "pages": 0, "chars": 0})
                continue
            
            # Task 9: Detect scanned / image-only PDFs
            if total_chars < 50:
                warning_msg = (
                    f"[WARNING] Scanned / Image-only document detected: {filename} "
                    f"({total_chars} chars from {total_pages} pages). "
                    f"Run OCR (e.g., ocrmypdf) to extract text content."
                )
                print(warning_msg)
                logger.warning(warning_msg)
                failed_files.append({
                    "filename": filename,
                    "reason": "Scanned/image-only (no selectable text)",
                    "pages": total_pages,
                    "chars": total_chars,
                })
                continue
            
            if not page_texts:
                print(f"  No usable content in {filename}")
                failed_files.append({"filename": filename, "reason": "No usable content after cleaning", "pages": 0, "chars": total_chars})
                continue
                
            # Attempt to extract metadata from filename
            subject = "Unknown Subject"
            module = "Unknown Module"
            chapter = "Unknown Chapter"
            
            # Try various filename formats
            name_no_ext = filename.replace(".pdf", "")
            
            # Format: "AI module 1", "DL module 2", "CN-module-1"
            module_match = re.match(r'([A-Za-z\s\'\-]+?)\s*(?:module|Module|M)[\s\-]*(\d+)', name_no_ext)
            if module_match:
                subject = module_match.group(1).strip()
                module = f"Module {module_match.group(2)}"
            else:
                parts = name_no_ext.replace("-", "_").split("_")
                if len(parts) >= 3:
                    subject, module, chapter = parts[0], parts[1], parts[2]
                elif len(parts) == 2:
                    subject, module = parts[0], parts[1]
                else:
                    subject = parts[0]
            
            # Bug 9 fix: Create one document per page (preserving page numbers in metadata)
            for page_num, page_text in page_texts:
                doc = Document(
                    text=page_text,
                    metadata={
                        "filename": filename,
                        "subject": subject,
                        "module": module,
                        "chapter": chapter,
                        "page_number": page_num,
                    }
                )
                documents.append(doc)
            
            print(f"  ✓ {len(page_texts)} pages, {total_chars} chars")
            
    return documents, failed_files

def build_index():
    print("Step 1: Reading and Cleaning PDFs...")
    docs, failed_files = parse_pdfs_to_documents(SOURCE_DIR)
    
    if not docs:
        print("No documents found to process. Exiting.")
        return

    # Bug 9 fix: use SentenceSplitter with better chunk sizes
    print("Step 2: Creating Chunks (300-500 tokens with 50 overlap)...")
    node_parser = SentenceSplitter(
        chunk_size=CHUNK_SIZE,
        chunk_overlap=CHUNK_OVERLAP,
    )
    nodes = node_parser.get_nodes_from_documents(docs)
    
    # Bug 9 fix: filter out junk chunks
    original_count = len(nodes)
    quality_nodes = []
    junk_count = 0
    for node in nodes:
        content = node.get_content()
        if is_junk_chunk(content):
            junk_count += 1
        else:
            quality_nodes.append(node)
    
    print(f"Generated {original_count} chunks, filtered {junk_count} junk -> {len(quality_nodes)} quality chunks.")

    print("Step 3: Initializing Vector Database...")
    db = chromadb.PersistentClient(path=CHROMA_DB_DIR)
    
    # Bug 9 fix: delete old collection and rebuild
    try:
        db.delete_collection(COLLECTION_NAME)
        print("  Deleted old collection.")
    except Exception:
        pass
    
    chroma_collection = db.get_or_create_collection(COLLECTION_NAME)
    vector_store = ChromaVectorStore(chroma_collection=chroma_collection)
    
    storage_context = StorageContext.from_defaults(vector_store=vector_store)
    
    print("Step 4: Embedding and Storing in ChromaDB (This may take a minute)...")
    index = VectorStoreIndex(
        quality_nodes,
        storage_context=storage_context,
        show_progress=True
    )
    
    # Report final counts
    total_pdfs = len([f for f in os.listdir(SOURCE_DIR) if f.endswith('.pdf')])
    final_count = chroma_collection.count()
    print(f"\n{'='*60}")
    print(f"  INGESTION COMPLETE")
    print(f"{'='*60}")
    print(f"  Source PDFs:          {total_pdfs} files")
    print(f"  Successfully parsed:  {total_pdfs - len(failed_files)} files")
    print(f"  Pages processed:      {len(docs)}")
    print(f"  Raw chunks:           {original_count}")
    print(f"  Junk filtered:        {junk_count}")
    print(f"  Quality chunks:       {final_count}")
    print(f"  Chunk settings:       {CHUNK_SIZE} tokens, {CHUNK_OVERLAP} overlap")
    
    # Task 9: Print failed/skipped files table
    if failed_files:
        print(f"\n{'='*60}")
        print(f"  FAILED / SKIPPED FILES ({len(failed_files)} files)")
        print(f"{'='*60}")
        print(f"  {'Filename':<35} {'Reason':<40} {'Pages':<6} {'Chars'}")
        print(f"  {'-'*35} {'-'*40} {'-'*6} {'-'*6}")
        for f in failed_files:
            print(f"  {f['filename']:<35} {f['reason']:<40} {f['pages']:<6} {f['chars']}")
        print(f"{'='*60}")
    else:
        print(f"\n  All PDFs processed successfully!")

if __name__ == "__main__":
    # Run this from the 'src' directory
    build_index()
