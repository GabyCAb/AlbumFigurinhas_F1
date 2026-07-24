import unittest
from fastapi.testclient import TestClient

from backend.main import app


class MainTests(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_endpoint_serves_info_image(self):
        response = self.client.get("/figurinhas/2/imagem")
        self.assertEqual(response.status_code, 200)
        self.assertIn("image", response.headers.get("content-type", ""))

    def test_all_listed_stickers_have_an_image(self):
        response = self.client.get("/figurinhas")
        self.assertEqual(response.status_code, 200)

        figurinhas = response.json()
        self.assertEqual(len(figurinhas), 55)

        for figurinha in figurinhas:
            image_response = self.client.get(figurinha["imagem_url"])
            self.assertEqual(image_response.status_code, 200, figurinha["nome"])
            self.assertIn("image", image_response.headers.get("content-type", ""))


if __name__ == "__main__":
    unittest.main()
