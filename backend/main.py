import os
import glob
from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

# Caminho absoluto da pasta onde está este arquivo
PASTA_BASE = os.path.dirname(os.path.abspath(__file__))
# Caminho absoluto da pasta de imagens das figurinhas
PASTA_IMAGENS = os.path.join(PASTA_BASE, "figurinhas")
PASTA_FRONTEND = os.path.abspath(os.path.join(PASTA_BASE, "..", "frontend"))

# Cria a aplicação FastAPI
app = FastAPI()

# Monta o frontend para servir os arquivos estáticos
app.mount("/frontend", StaticFiles(directory=PASTA_FRONTEND, html=True), name="frontend")

# Configura o middleware CORS para aceitar requisições de qualquer origem
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Lista de figurinhas. Itens sem imagem disponível são comentados.
figurinhas = [
    {"id": 1, "nome": "Kimi Antonelli", "categoria": "Piloto", "imagem_url": "/figurinhas/1/imagem"},
    {"id": 2, "nome": "Kimi Antonelli Info", "categoria": "Piloto", "imagem_url": "/figurinhas/2/imagem"},
    {"id": 3, "nome": "Mercedes", "categoria": "Carro", "imagem_url": "/figurinhas/3/imagem"},
    {"id": 4, "nome": "George Russel Info", "categoria": "Piloto", "imagem_url": "/figurinhas/4/imagem"},
    {"id": 5, "nome": "George Russel", "categoria": "Piloto", "imagem_url": "/figurinhas/5/imagem"},
    {"id": 6, "nome": "Charles Leclerc Info", "categoria": "Piloto", "imagem_url": "/figurinhas/6/imagem"},
    {"id": 7, "nome": "Charles Leclerc", "categoria": "Piloto", "imagem_url": "/figurinhas/7/imagem"},
    {"id": 8, "nome": "Ferrari", "categoria": "Carro", "imagem_url": "/figurinhas/8/imagem"},
    {"id": 9, "nome": "Lewis Hamilton", "categoria": "Piloto", "imagem_url": "/figurinhas/9/imagem"},
    {"id": 10, "nome": "Lewis Hamilton Info", "categoria": "Piloto", "imagem_url": "/figurinhas/10/imagem"},
    {"id": 11, "nome": "Lando Norris", "categoria": "Piloto", "imagem_url": "/figurinhas/11/imagem"},
    {"id": 12, "nome": "Lando Norris Info", "categoria": "Piloto", "imagem_url": "/figurinhas/12/imagem"},
    {"id": 13, "nome": "McLaren", "categoria": "Carro", "imagem_url": "/figurinhas/13/imagem"},
    {"id": 14, "nome": "Oscar Piastri Info", "categoria": "Piloto", "imagem_url": "/figurinhas/14/imagem"},
    {"id": 15, "nome": "Oscar Piastri", "categoria": "Piloto", "imagem_url": "/figurinhas/15/imagem"},
    {"id": 16, "nome": "Max Verstappen Info", "categoria": "Piloto", "imagem_url": "/figurinhas/16/imagem"},
    {"id": 17, "nome": "Max Verstappen", "categoria": "Piloto", "imagem_url": "/figurinhas/17/imagem"},
    {"id": 18, "nome": "Red Bull Racing", "categoria": "Carro", "imagem_url": "/figurinhas/18/imagem"},
    {"id": 19, "nome": "Isack Radjar", "categoria": "Piloto", "imagem_url": "/figurinhas/19/imagem"},
    {"id": 20, "nome": "Isack Radjar Info", "categoria": "Piloto", "imagem_url": "/figurinhas/20/imagem"},
    {"id": 21, "nome": "Pierre Gasly", "categoria": "Piloto", "imagem_url": "/figurinhas/21/imagem"},
    {"id": 22, "nome": "Pierre Gasly Info", "categoria": "Piloto", "imagem_url": "/figurinhas/22/imagem"},
    {"id": 23, "nome": "Alpine", "categoria": "Carro", "imagem_url": "/figurinhas/23/imagem"},
    {"id": 24, "nome": "Franco Colapinto Info", "categoria": "Piloto", "imagem_url": "/figurinhas/24/imagem"},
    {"id": 25, "nome": "Franco Colapinto", "categoria": "Piloto", "imagem_url": "/figurinhas/25/imagem"},
    {"id": 26, "nome": "Liam Lawson", "categoria": "Piloto", "imagem_url": "/figurinhas/26/imagem"},
    {"id": 27, "nome": "Liam Lawson Info", "categoria": "Piloto", "imagem_url": "/figurinhas/27/imagem"},
    {"id": 28, "nome": "Racing Bulls", "categoria": "Carro", "imagem_url": "/figurinhas/28/imagem"},
    {"id": 29, "nome": "Arvid Lindblad Info", "categoria": "Piloto", "imagem_url": "/figurinhas/29/imagem"},
    {"id": 30, "nome": "Arvid Lindblad", "categoria": "Piloto", "imagem_url": "/figurinhas/30/imagem"},
    {"id": 31, "nome": "Esteban Ocon Info", "categoria": "Piloto", "imagem_url": "/figurinhas/31/imagem"},
    {"id": 32, "nome": "Esteban Ocon", "categoria": "Piloto", "imagem_url": "/figurinhas/32/imagem"},
    {"id": 33, "nome": "Haas F1 Team", "categoria": "Carro", "imagem_url": "/figurinhas/33/imagem"},
    {"id": 34, "nome": "Oliver Bearman", "categoria": "Piloto", "imagem_url": "/figurinhas/34/imagem"},
    {"id": 35, "nome": "Oliver Bearman Info", "categoria": "Piloto", "imagem_url": "/figurinhas/35/imagem"},
    {"id": 36, "nome": "Carlos Sainz", "categoria": "Piloto", "imagem_url": "/figurinhas/36/imagem"},
    {"id": 37, "nome": "Carlos Sainz Info", "categoria": "Piloto", "imagem_url": "/figurinhas/37/imagem"},
    {"id": 38, "nome": "Williams", "categoria": "Carro", "imagem_url": "/figurinhas/38/imagem"},
    {"id": 39, "nome": "Alexander Albon Info", "categoria": "Piloto", "imagem_url": "/figurinhas/39/imagem"},
    {"id": 40, "nome": "Alexander Albon", "categoria": "Piloto", "imagem_url": "/figurinhas/40/imagem"},
    {"id": 41, "nome": "Gabriel Bortoleto Info", "categoria": "Piloto", "imagem_url": "/figurinhas/41/imagem"},
    {"id": 42, "nome": "Gabriel Bortoleto", "categoria": "Piloto", "imagem_url": "/figurinhas/42/imagem"},
    {"id": 43, "nome": "Audi", "categoria": "Carro", "imagem_url": "/figurinhas/43/imagem"},
    {"id": 44, "nome": "Nico Hulkenberg", "categoria": "Piloto", "imagem_url": "/figurinhas/44/imagem"},
    {"id": 45, "nome": "Nico Hulkenberg Info", "categoria": "Piloto", "imagem_url": "/figurinhas/45/imagem"},
    {"id": 46, "nome": "Fernando Alonso", "categoria": "Piloto", "imagem_url": "/figurinhas/46/imagem"},
    {"id": 47, "nome": "Fernando Alonso Info", "categoria": "Piloto", "imagem_url": "/figurinhas/47/imagem"},
    {"id": 48, "nome": "Aston Martin", "categoria": "Carro", "imagem_url": "/figurinhas/48/imagem"},
    {"id": 49, "nome": "Lance Stroll Info", "categoria": "Piloto", "imagem_url": "/figurinhas/49/imagem"},
    {"id": 50, "nome": "Lance Stroll", "categoria": "Piloto", "imagem_url": "/figurinhas/50/imagem"},
    {"id": 51, "nome": "Sergio Perez Info", "categoria": "Piloto", "imagem_url": "/figurinhas/51/imagem"},
    {"id": 52, "nome": "Sergio Perez", "categoria": "Piloto", "imagem_url": "/figurinhas/52/imagem"},
    {"id": 53, "nome": "Cadillac", "categoria": "Carro", "imagem_url": "/figurinhas/53/imagem"},
    {"id": 54, "nome": "Valteri Bottas", "categoria": "Piloto", "imagem_url": "/figurinhas/54/imagem"},
    {"id": 55, "nome": "Valteri Bottas Info", "categoria": "Piloto", "imagem_url": "/figurinhas/55/imagem"},
]

# Endpoint GET que retorna a lista de figurinhas disponíveis
@app.get("/figurinhas")
def listar_figurinhas():
    return figurinhas

# Endpoint GET que retorna o arquivo de imagem da figurinha por id
@app.get("/figurinhas/{id}/imagem")
def obter_imagem_figurinha(id: int):
    padrao = os.path.join(PASTA_IMAGENS, f"{id:02d}*")
    arquivos = sorted(glob.glob(padrao))

    if not arquivos:
        raise HTTPException(status_code=404, detail="Imagem não encontrada")

    arquivo = next(
        (item for item in arquivos if os.path.isfile(item)),
        None,
    )

    if not arquivo:
        raise HTTPException(status_code=404, detail="Imagem não encontrada")

    return FileResponse(arquivo)
