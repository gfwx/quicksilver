import lancedb
from sentence_transformers import SentenceTransformer
import pyarrow as pa
from typing import List

class VectorStore:
    # Vector dimension is derived directly from the SentenceTransformer model
    # to ensure schema and embedding dimensions always match.
    def __init__(self, path: str = 'data'):
        self.path = path
        self.db = lancedb.connect(path)
        self.table_name = "embeddings"
        self.model = SentenceTransformer("all-MiniLM-L6-v2")

        # Get vector dimension directly from the model
        self.vector_dimension = self.model.get_sentence_embedding_dimension()

        self.pa_schema = pa.schema([
            pa.field("vector", pa.list_(pa.float32(), list_size=self.vector_dimension)),
            pa.field("text", pa.string()),
            pa.field("document_id", pa.string())
        ])

        self.table = self.db.create_table(self.table_name, schema=self.pa_schema, exist_ok=True)

    def _entry_exists(self, document_id: str) -> bool:
        try:
            count = self.table.count_rows(filter=f"document_id='{document_id}'")
            return count > 0
        except Exception as e:
            print(f"An unexpected error occured: {e}")
            return False

    def add(self, text_chunks : List[str], document_id: str):
        if self._entry_exists(document_id):
            print(f"Document {document_id} already exists in vector store. Skipping")
            return None

        embeddings = self.model.encode(text_chunks, show_progress_bar=True)

        print(f"Generating embeddings for {len(text_chunks)} chunks...")
        data_to_insert = [
                {
                    "vector": embedding.tolist(),
                    "text": chunk,
                    "document_id": document_id
                }
                for embedding, chunk in zip(embeddings, text_chunks)
            ]

        try:
            self.table.add(data_to_insert)
            print(f"Successfully added {len(data_to_insert)} chunks for document_id: {document_id}")
        except Exception as e:
            print(f"Error adding data to LanceDB: {e}")

    def delete(self, document_id: str):
        try:
            self.table.delete(f"document_id = '{document_id}'")
            print(f"Successfully deleted entries for document_id: {document_id}")
        except Exception as e:
            print(f"Error deleting entries for document_id '{document_id}': {e}")

    def search(self, query_text: str, limit: int = 5):
        try:
            query_vector = self.model.encode(query_text);
            results = self.table.search(query_vector).limit(limit).to_list()
            return results

        except Exception as e:
            print(f"An error occured during the search: {e}")
            return []
