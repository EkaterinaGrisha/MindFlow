import pathlib
import tempfile
import unittest

from infra.scripts.prepare_rag_corpus import build_manifest, build_records, is_approved


class PrepareRagCorpusTests(unittest.TestCase):
    def test_is_approved_requires_both_flags(self):
        self.assertTrue(is_approved({"include_in_rag": "true", "license_status": "open"}))
        self.assertTrue(is_approved({"include_in_rag": "yes", "license_status": "licensed"}))
        self.assertFalse(is_approved({"include_in_rag": "true", "license_status": "unknown"}))
        self.assertFalse(is_approved({"include_in_rag": "false", "license_status": "open"}))

    def test_csv_with_commas_in_url_parses_correctly(self):
        csv_text = (
            "id,title,url,source_type,license_status,include_in_rag,notes\n"
            'x,Test,"https://example.com/a,b,c.pdf",direct_pdf,open,true,ok\n'
        )
        with tempfile.TemporaryDirectory() as tmp:
            path = pathlib.Path(tmp) / "sources.csv"
            path.write_text(csv_text, encoding="utf-8")
            rows = build_records(path)

        self.assertEqual(1, len(rows))
        self.assertEqual("https://example.com/a,b,c.pdf", rows[0]["url"])
        self.assertEqual("direct_pdf", rows[0]["source_type"])

    def test_manifest_fields(self):
        rows = [
            {
                "id": "doc1",
                "title": "Doc",
                "url": "file:///tmp/doc.pdf",
                "source_type": "local_file",
                "license_status": "open",
                "include_in_rag": "true",
                "notes": "n",
            }
        ]
        manifest = build_manifest(rows, check_links=False)
        self.assertEqual(1, len(manifest))
        self.assertTrue(manifest[0]["approved_for_rag"])
        self.assertFalse(manifest[0]["http_scheme_allowed"])
        self.assertFalse(manifest[0]["downloaded"])


if __name__ == "__main__":
    unittest.main()
