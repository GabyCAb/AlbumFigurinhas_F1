# Álbum Digital de Figurinhas — Fórmula 1 2026

Aplicação web interativa que simula um álbum de figurinhas da temporada 2026 de Fórmula 1. O frontend exibe o álbum com efeito de virada de página e o backend FastAPI fornece as 55 imagens das figurinhas.

## Recursos

- Álbum navegável por setas, teclado ou arraste.
- Figurinhas de 11 equipes, pilotos, perfis e carros.
- Carregamento das imagens pela API.
- Layout responsivo para desktop e celular.
- Capa adaptável a diferentes alturas de tela.
- Marca-d'água com o logo da F1 nas páginas internas.
- Controle de som para a animação de troca de página.

## Tecnologias

- HTML, CSS e JavaScript
- [StPageFlip](https://github.com/Nodlik/StPageFlip), carregado por CDN
- Python e FastAPI
- Uvicorn

## Estrutura

```text
Album_Figurinhas/
├── backend/
│   ├── figurinhas/       # 55 imagens PNG
│   └── main.py           # API FastAPI
├── frontend/
│   ├── index.html
│   ├── style.css
│   ├── app.js
│   └── logo_f1.png
├── tests/
│   └── test_main.py
├── requirements.txt
└── README.md
```

## Como executar

Requer Python 3.10 ou superior.

```powershell
git clone <URL_DO_REPOSITORIO>
cd Album_Figurinhas
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
cd backend
..\.venv\Scripts\uvicorn main:app --reload
```

Com o servidor iniciado, abra no navegador:

```text
http://127.0.0.1:8000/frontend/
```

## Testes

Na raiz do projeto, com o ambiente virtual ativado:

```powershell
python -m unittest discover -s tests -v
```

Os testes verificam a lista de figurinhas e se as 55 imagens são servidas corretamente pela API.

## Endpoints

| Método | Rota | Descrição |
| --- | --- | --- |
| `GET` | `/figurinhas` | Retorna os dados das 55 figurinhas. |
| `GET` | `/figurinhas/{id}/imagem` | Retorna a imagem PNG da figurinha solicitada. |

## Observação

O projeto é educacional e não possui vínculo oficial com a Fórmula 1 ou suas equipes.
