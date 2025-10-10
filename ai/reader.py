import pymupdf
import os
from langchain_text_splitters import RecursiveCharacterTextSplitter
from typing import List
from .db.vector import VectorStore


class FileProcessor:
    def __init__(self, filepath: str = ""):
        self.filepath = filepath
        self.data = None

    # This only works for text-based PDFs.
    # Needs to wokrk with OCR potentially
    def _process_pdf(self):
        try:
            with pymupdf.open(self.filepath) as doc:
                text = chr(12).join([page.get_text() for page in doc])  # pyright: ignore
                return text
        except Exception as e:
            print(f"Error while processing PDF file: {e}")
            return None

    def _process_txt(self):
        try:
            with open(self.filepath, "r", encoding="utf-8") as file:
                text = file.read()
                return text
        except Exception as e:
            print(f"Error while processing TXT file: {e}")
            return None

    def process(self):
        extension = os.path.splitext(self.filepath)[1]
        actions = {
            ".pdf": self._process_pdf,
            ".txt": self._process_txt,
            ".csv": self._process_txt,
        }

        action = actions.get(extension)

        if not action:
            print(f"Unsupported file type: {extension}")
            return None

        self.data = action()
        print("Data processing complete!")

    def save(self, outdir: str):
        if self.data is None:
            print("No data to save")
            return

        filename = os.path.basename(self.filepath)
        filepath = os.path.join(outdir, filename)

        try:
            with open(filepath, "w", encoding="utf-8") as file:
                file.write(self.data)
            print(f"Saved to {filepath}")
        except Exception as e:
            print(f"Error while saving file: {e}")
            self.data = None

    def chunk_data(
        self,
        chunk_size: int = 1000,
        chunk_overlap: int = 100,
        separators: List[str] | None = None,
    ):
        if self.data is None:
            print("No data to chunk! Run process()")
            return None

        try:
            # Initialize the text splitter
            text_splitter = RecursiveCharacterTextSplitter(
                chunk_size=chunk_size,
                chunk_overlap=chunk_overlap,
                separators=separators
                if separators is not None
                else ["\n\n", "\n", " ", ""],
            )

            # Split the text
            chunks = text_splitter.split_text(self.data)
            return chunks
        except (TypeError, ValueError) as e:
            print(f"Invalid parameters or data type for chunking: {e}")
            return None

        except Exception as e:
            print(f"An unexpected error occurred during data chunking: {e}")
            return None

    def get(self):
        return self.data


if __name__ == "__main__":
    filepath = "test.pdf"
    fp = FileProcessor(filepath)
    vs = VectorStore()

    fp.process()
    data = fp.chunk_data()
    if data != None:
        vs.add(data, "test_document_id")
        results = vs.search("What are the possible streams of revenue?")
        for i, result in enumerate(results):
            print(f"[TOP RESULT #{i + 1}]\n{result['text']}\n")
