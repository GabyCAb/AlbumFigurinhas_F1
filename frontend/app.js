// ===================================================
// CONFIGURAÇÃO DA API
// Quando o frontend for servido pelo FastAPI (Dia 3), a API está
// no mesmo servidor — usamos uma URL relativa ou o endereço completo.
// ===================================================
function getApiBaseUrls() {
    const bases = [];

    if (window.location.protocol === "http:" || window.location.protocol === "https:") {
        bases.push(window.location.origin);
    }

    // TambÃ©m funciona quando o frontend Ã© aberto pelo Live Server ou por arquivo.
    bases.push("http://127.0.0.1:8000", "http://localhost:8000");
    return [...new Set(bases)];
}

async function carregarFigurinhasDaApi() {
    let lastError;

    for (const baseUrl of getApiBaseUrls()) {
        try {
            const response = await fetch(`${baseUrl}/figurinhas`);
            if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
            return { baseUrl, figurinhas: await response.json() };
        } catch (error) {
            lastError = error;
        }
    }

    throw lastError || new Error("API indisponÃ­vel");
}

// ===================================================
// FUNÇÃO: Preenche os slots do álbum com imagens da API
// Esta função é chamada após o álbum ser inicializado.
// ===================================================
async function preencherFigurinhas() {
    try {
        // 1. Busca as figurinhas disponíveis na API
        const { baseUrl, figurinhas } = await carregarFigurinhasDaApi();

        // 2. Converte o JSON em array JavaScript

        // 3. Cria um Map de id → figurinha para lookup rápido
        //    Ex: 1 → { id: 1, nome: "Alan Turing", imagem_url: "/imgs/01-alan-turing.jpg" }
        const porId = new Map(figurinhas.map(f => [f.id, f]));

        // 4. Percorre todos os slots do HTML
        const slots = document.querySelectorAll(".sticker-slot");

        for (const slot of slots) {
            const slotNumeroEl = slot.querySelector(".slot-number");
            if (!slotNumeroEl) continue;

            // Extrai o número do slot: "#01" → 1
            const id = parseInt(slotNumeroEl.textContent.replace("#", ""), 10);

            if (!porId.has(id)) continue;

            // A figurinha existe: insere a imagem
            const figurinha = porId.get(id);

            const img = document.createElement("img");
            img.src = `${baseUrl}${figurinha.imagem_url}`;
            img.alt = figurinha.nome;
            img.className = "sticker-img";

            img.onload = () => slot.classList.add("slot-preenchido");
            img.onerror = () => console.warn(`Imagem não encontrada: ${figurinha.nome}`);

            slot.insertBefore(img, slot.firstChild);
        }

        console.log(`✅ ${figurinhas.length} figurinhas carregadas da API!`);

    } catch (erro) {
        console.warn("⚠️  Não foi possível conectar à API do backend:", erro.message);
        console.info("ℹ️  Inicie o servidor: cd backend/dia-3 && uvicorn main:app --reload");
    }
}

// ===================================================
// FUNÇÃO: Calcula dimensões da página conforme o viewport
// Mantém a proporção 550×800 respeitando os limites da tela
// ===================================================
function getPageDimensions() {
    const BASE_W = 550;
    const BASE_H = 800;
    const ratio = BASE_H / BASE_W;

    // Viewport disponível (com margem)
    const isPortrait = window.matchMedia("(max-width: 768px)").matches;
    const horizontalPadding = isPortrait ? 24 : 96;
    const verticalPadding = isPortrait ? 88 : 56;
    const availableWidth = Math.max(180, window.innerWidth - horizontalPadding);
    const vh = Math.max(280, window.innerHeight - verticalPadding);

    // Largura máxima de uma página (metade do viewport em modo de duas páginas)
    const halfVW = isPortrait ? availableWidth : availableWidth / 2;

    // Escala pelo menor fator (largura ou altura)
    let w = Math.min(BASE_W, halfVW);
    let h = w * ratio;

    // Se a altura ultrapassar o disponível, reajusta pela altura
    if (h > vh) {
        h = vh;
        w = h / ratio;
    }

    return {
        width: Math.floor(w),
        height: Math.floor(h),
        minWidth: 180,
        maxWidth: 1000,
        minHeight: 400,
        maxHeight: 1350
    };
}

document.addEventListener("DOMContentLoaded", () => {
    const bookElement = document.getElementById("book");
    const btnPrev = document.getElementById("btn-prev");
    const btnNext = document.getElementById("btn-next");
    const soundToggle = document.getElementById("sound-toggle");
    const iconOn = soundToggle.querySelector(".sound-icon-on");
    const iconOff = soundToggle.querySelector(".sound-icon-off");

    let isMuted = false;
    let pageFlip = null;

    // 1. Initialize St.PageFlip
    try {
        const dims = getPageDimensions();
        pageFlip = new St.PageFlip(bookElement, {
            width: dims.width,   // Calculado dinamicamente
            height: dims.height, // Calculado dinamicamente
            size: "stretch",
            minWidth: dims.minWidth,
            maxWidth: dims.maxWidth,
            minHeight: dims.minHeight,
            maxHeight: dims.maxHeight,
            drawShadow: true,
            maxShadowOpacity: 0.4,
            showCover: true,
            usePortrait: true,
            mobileScrollSupport: true,
            useMouseEvents: false,
            showPageCorners: false,
            disableFlipByClick: true,
            flippingTime: 800
        });

        // Load pages from HTML
        pageFlip.loadFromHTML(document.querySelectorAll(".page"));

        // Estado de arraste personalizado
        let activeDragPage = null;
        let isClicking = false;
        let startX = 0;
        let startY = 0;
        let dragStarted = false;

        // Monitora o mousedown/touchstart em cada página para iniciar a intenção de arraste
        document.querySelectorAll(".page").forEach((page, index) => {
            page.addEventListener("mousedown", (e) => {
                if (e.target.closest("button") || e.target.closest("a")) return;
                isClicking = true;
                startX = e.clientX;
                startY = e.clientY;
                dragStarted = false;
                activeDragPage = { page, index };
            });

            page.addEventListener("touchstart", (e) => {
                if (e.target.closest("button") || e.target.closest("a")) return;
                const touch = e.touches[0];
                isClicking = true;
                startX = touch.clientX;
                startY = touch.clientY;
                dragStarted = false;
                activeDragPage = { page, index };
            });
        });

        // Executa o movimento de dobra apenas se o mouse/dedo se mover além de um limiar (threshold)
        const handleMove = (clientX, clientY, isTouch = false) => {
            if (!isClicking || !activeDragPage) return;
            
            const deltaX = clientX - startX;
            const deltaY = clientY - startY;
            const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
            
            const bookRect = bookElement.getBoundingClientRect();

            // Só ativa o flip se mover mais de 10px (evita disparar ao clicar e soltar estático)
            if (distance > 10 && !dragStarted) {
                dragStarted = true;
                let cornerX, cornerY;
                
                // Determina canto vertical (topo vs base) em coordenadas relativas ao livro
                const centerY = bookRect.top + bookRect.height / 2;
                if (startY < centerY) {
                    cornerY = 0; // Canto superior
                } else {
                    cornerY = bookRect.height; // Canto inferior
                }

                // Determina canto horizontal (direita vs esquerda) em coordenadas relativas ao livro
                if (activeDragPage.index % 2 === 0) {
                    cornerX = bookRect.width; // Canto direito
                } else {
                    cornerX = 0; // Canto esquerdo
                }
                
                document.body.classList.add("dragging");
                pageFlip.startUserTouch({ x: cornerX, y: cornerY });
            }
            
            if (dragStarted) {
                const relX = clientX - bookRect.left;
                const relY = clientY - bookRect.top;
                pageFlip.userMove({ x: relX, y: relY }, isTouch);
            }
        };

        const handleRelease = (clientX, clientY, isTouch = false) => {
            if (dragStarted) {
                const bookRect = bookElement.getBoundingClientRect();
                const relX = clientX - bookRect.left;
                const relY = clientY - bookRect.top;
                pageFlip.userStop({ x: relX, y: relY }, isTouch);
            }
            isClicking = false;
            dragStarted = false;
            activeDragPage = null;
            document.body.classList.remove("dragging");
        };

        window.addEventListener("mousemove", (e) => {
            handleMove(e.clientX, e.clientY, false);
        });

        window.addEventListener("touchmove", (e) => {
            if (e.touches.length > 0) {
                const touch = e.touches[0];
                handleMove(touch.clientX, touch.clientY, true);
            }
        });

        window.addEventListener("mouseup", (e) => {
            handleRelease(e.clientX, e.clientY, false);
        });

        window.addEventListener("touchend", (e) => {
            const touch = e.changedTouches[0] || e.touches[0];
            if (touch) {
                handleRelease(touch.clientX, touch.clientY, true);
            } else {
                handleRelease(startX, startY, true);
            }
        });

        // Show book after successful initialization
        bookElement.style.display = "block";

        const resizeBook = () => {
            const isPortrait = window.matchMedia("(max-width: 768px)").matches;
            const viewportWidth = Math.max(180, window.innerWidth - (isPortrait ? 24 : 96));
            const viewportHeight = Math.max(280, window.innerHeight - (isPortrait ? 88 : 56));
            const ratio = 800 / 550;
            const widthFromHeight = (viewportHeight / ratio) * (isPortrait ? 1 : 2);
            const naturalWidth = isPortrait ? 550 : 1100;
            const bookWidth = Math.min(naturalWidth, viewportWidth, widthFromHeight);

            bookElement.style.width = `${Math.floor(bookWidth)}px`;
            bookElement.style.height = `${Math.floor(Math.min(viewportHeight, (bookWidth / (isPortrait ? 1 : 2)) * ratio))}px`;
        };

        // Ajusta o livro e as páginas ao redimensionar a janela
        let resizeTimer = null;
        window.addEventListener("resize", () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                resizeBook();
            }, 150);
        });

        resizeBook();

        // Dia 3: Busca as figurinhas da API e preenche o álbum
        // A função é async, chamamos sem await para não bloquear a inicialização do álbum
        preencherFigurinhas();

    } catch (error) {
        console.error("Erro ao inicializar a biblioteca PageFlip:", error);
    }

    // 2. Sound Effect Generator (Web Audio API)
    function playPaperTurnSound() {
        if (isMuted) return;

        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (!AudioContext) return;

            const audioCtx = new AudioContext();
            const duration = 0.45; // seconds
            const sampleRate = audioCtx.sampleRate;
            const bufferSize = sampleRate * duration;
            const buffer = audioCtx.createBuffer(1, bufferSize, sampleRate);
            const data = buffer.getChannelData(0);

            // Synthesize white noise with a custom page-flip volume envelope
            for (let i = 0; i < bufferSize; i++) {
                const progress = i / bufferSize;
                // Noise value between -1 and 1
                const noise = Math.random() * 2 - 1;

                // Volume envelope: smooth curve that peaks around 30% of the duration
                let envelope = 0;
                if (progress < 0.3) {
                    envelope = progress / 0.3; // Rapid ramp up
                } else {
                    envelope = (1 - progress) / 0.7; // Smooth decay
                }

                // Add minor irregular spikes to simulate paper friction/crackle
                const paperCrackle = Math.random() > 0.985 ? (Math.random() * 2 - 1) * 0.35 : 0;

                data[i] = (noise * 0.65 + paperCrackle) * envelope * 0.12;
            }

            // Create nodes
            const noiseNode = audioCtx.createBufferSource();
            noiseNode.buffer = buffer;

            // Bandpass filter to extract the "whoosh" sound of paper shuffling
            const bandpassFilter = audioCtx.createBiquadFilter();
            bandpassFilter.type = "bandpass";
            bandpassFilter.Q.value = 2.0;

            // Dynamic frequency sweep: starts at 1500Hz, sweeps down to 350Hz (sound of page moving away)
            bandpassFilter.frequency.setValueAtTime(1500, audioCtx.currentTime);
            bandpassFilter.frequency.exponentialRampToValueAtTime(350, audioCtx.currentTime + duration);

            // Lowpass filter to remove harsh high-frequency digital artifacts
            const lowpassFilter = audioCtx.createBiquadFilter();
            lowpassFilter.type = "lowpass";
            lowpassFilter.frequency.setValueAtTime(3800, audioCtx.currentTime);

            // Connect graph: Source -> Bandpass -> Lowpass -> Destination
            noiseNode.connect(bandpassFilter);
            bandpassFilter.connect(lowpassFilter);
            lowpassFilter.connect(audioCtx.destination);

            noiseNode.start();
        } catch (e) {
            console.warn("Falha ao tocar som de virada de página:", e);
        }
    }

    // 3. Audio State Controls
    soundToggle.addEventListener("click", () => {
        isMuted = !isMuted;
        if (isMuted) {
            iconOn.classList.add("hidden");
            iconOff.classList.remove("hidden");
        } else {
            iconOn.classList.remove("hidden");
            iconOff.classList.add("hidden");
        }
    });

    // 4. Navigation controls and events
    if (pageFlip) {
        // Play turn sound when page starts flipping
        pageFlip.on("changeState", (e) => {
            if (e.data === "flipping") {
                playPaperTurnSound();
            }
        });

        // Discrete arrow toggle depending on current page
        pageFlip.on("flip", (e) => {
            const currentPage = e.data;
            const totalPages = pageFlip.getPageCount();

            // Hide left button on cover page
            if (currentPage === 0) {
                btnPrev.classList.add("hidden");
            } else {
                btnPrev.classList.remove("hidden");
            }

            // Hide right button on back cover
            if (currentPage === totalPages - 1) {
                btnNext.classList.add("hidden");
            } else {
                btnNext.classList.remove("hidden");
            }
        });

        // Click events for navigational arrows
        btnPrev.addEventListener("click", () => {
            pageFlip.flipPrev();
        });

        btnNext.addEventListener("click", () => {
            pageFlip.flipNext();
        });

        // Keyboard events for navigational arrows
        document.addEventListener("keydown", (e) => {
            if (e.key === "ArrowLeft") {
                pageFlip.flipPrev();
            } else if (e.key === "ArrowRight") {
                pageFlip.flipNext();
            }
        });

        // Hide left button initially since start page is 0
        btnPrev.classList.add("hidden");
    }
});
