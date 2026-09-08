"""RAG Pipeline with chunking and semantic TF-IDF / cosine retrieval."""
import re
from typing import List, Dict, Any, Tuple
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

def chunk_document_text(content: str, max_words_per_chunk: int = 40) -> List[str]:
    """Split text into 1-2 sentence overlapping chunks."""
    # Split on sentence boundaries
    sentences = [s.strip() for s in re.split(r'(?<=[.!?])\s+', content) if s.strip()]
    if not sentences:
        return [content.strip()] if content.strip() else []
    
    chunks = []
    for i in range(0, len(sentences), 2):
        chunk = " ".join(sentences[i:i+2])
        chunks.append(chunk)
    return chunks

class KnowledgeRAGStore:
    """In-memory vector store for student knowledge documents."""
    
    def __init__(self, documents: List[Dict[str, Any]]):
        self.documents = documents
        self.chunks: List[Dict[str, Any]] = []
        self._build_index()

    def _build_index(self):
        for doc in self.documents:
            doc_chunks = chunk_document_text(doc.get("content", ""))
            for chunk_str in doc_chunks:
                self.chunks.append({
                    "document_id": doc.get("id"),
                    "documentName": doc.get("name"),
                    "category": doc.get("category"),
                    "text": chunk_str
                })

        if not self.chunks:
            self.vectorizer = None
            self.matrix = None
            return

        self.vectorizer = TfidfVectorizer(ngram_range=(1, 2), stop_words="english", lowercase=True)
        corpus = [c["text"] for c in self.chunks]
        try:
            self.matrix = self.vectorizer.fit_transform(corpus)
        except Exception:
            self.matrix = None

    def search(self, query: str, top_k: int = 3) -> List[Dict[str, Any]]:
        """Retrieve top_k matching chunks with document metadata."""
        if self.matrix is None or self.vectorizer is None or not query.strip():
            # Fallback simple substring matching
            q_words = [w.lower() for w in re.findall(r'\b\w{3,}\b', query)]
            results = []
            for item in self.chunks:
                text_lower = item["text"].lower()
                matches = sum(1 for w in q_words if w in text_lower)
                if matches > 0:
                    results.append({
                        "documentName": item["documentName"],
                        "category": item["category"],
                        "excerpt": item["text"],
                        "score": matches
                    })
            results.sort(key=lambda x: x["score"], reverse=True)
            return results[:top_k]

        try:
            query_vec = self.vectorizer.transform([query])
            similarities = cosine_similarity(query_vec, self.matrix).flatten()
            top_indices = np.argsort(similarities)[::-1][:top_k]
            
            results = []
            for idx in top_indices:
                score = float(similarities[idx])
                if score > 0.02:
                    results.append({
                        "documentName": self.chunks[idx]["documentName"],
                        "category": self.chunks[idx]["category"],
                        "excerpt": self.chunks[idx]["text"],
                        "score": round(score, 4)
                    })
            return results
        except Exception:
            return []
