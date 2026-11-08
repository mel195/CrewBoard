"""Text from uploaded estimates: PDF (first 12 pages), Word (.docx), plain text. Images go to the AI reader (ADD-01)."""
from __future__ import annotations

import io
import re
import zipfile

from app.core.errors import AppError

MAX_BYTES = 20 * 1024 * 1024
PDF_PAGES = 12
MIN_TEXT = 20
IMAGE_TYPES = {"image/png", "image/jpeg", "image/webp", "image/gif"}


def kind_of(filename: str, mime: str | None) -> str:
    n = filename.lower()
    if n.endswith(".pdf") or mime == "application/pdf":
        return "pdf"
    if n.endswith(".docx"):
        return "docx"
    if (mime or "") in IMAGE_TYPES or n.endswith((".png", ".jpg", ".jpeg", ".webp", ".gif")):
        return "image"
    return "text"


def extract_text(data: bytes, filename: str, mime: str | None) -> tuple[str | None, int | None]:
    """Returns (text, page_count). Images return (None, None). Raises 422 when nothing can be read."""
    if len(data) > MAX_BYTES:
        raise AppError(422, "file_too_large", "That file is over 20 MB")
    k = kind_of(filename, mime)
    try:
        if k == "pdf":
            from pypdf import PdfReader
            r = PdfReader(io.BytesIO(data))
            pages = r.pages[:PDF_PAGES]
            text = "\n".join((p.extract_text() or "") for p in pages)
            n = len(r.pages)
        elif k == "docx":
            with zipfile.ZipFile(io.BytesIO(data)) as z:
                xml = z.read("word/document.xml").decode("utf8")
            paras = re.findall(r"<w:p[ >].*?</w:p>", xml, re.S)
            text = "\n".join("".join(re.findall(r"<w:t[^>]*>([^<]*)</w:t>", p)) for p in paras)
            import html
            text, n = html.unescape(text), None
        elif k == "image":
            return None, None
        else:
            text, n = data.decode("utf8", errors="replace"), None
    except Exception:
        raise AppError(422, "unreadable_document", "We couldn’t open that file. Try a PDF, Word file or text, or paste the text.")
    if len(text.strip()) < MIN_TEXT:
        raise AppError(422, "unreadable_document", "We couldn’t find any text in that file. If it’s a scan, upload a photo or paste the text.")
    return text, n
