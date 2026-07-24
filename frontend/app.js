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
    // visualViewport acompanha a área realmente visível em celulares, inclusive
    // quando a barra do navegador aparece ou desaparece.
    const viewport = window.visualViewport;
    const viewportWidth = viewport ? viewport.width : window.innerWidth;
    const viewportHeight = viewport ? viewport.height : window.innerHeight;
    const availableWidth = Math.max(180, viewportWidth - horizontalPadding);
    const vh = Math.max(280, viewportHeight - verticalPadding);

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

    const getBookSize = () => {
        const isMobile = window.matchMedia("(max-width: 768px)").matches;
        const viewport = window.visualViewport;
        const visibleWidth = viewport ? viewport.width : window.innerWidth;
        const visibleHeight = viewport ? viewport.height : window.innerHeight;
        const horizontalSpace = isMobile ? 24 : 96;
        const verticalSpace = isMobile ? 88 : 56;
        const availableWidth = Math.max(180, visibleWidth - horizontalSpace);
        const availableHeight = Math.max(280, visibleHeight - verticalSpace);
        const pageRatio = 800 / 550;
        const bookRatio = isMobile ? pageRatio : pageRatio / 2;
        const width = Math.min(isMobile ? 550 : 1100, availableWidth, availableHeight / bookRatio);

        return {
            width: Math.floor(width),
            height: Math.floor(width * bookRatio),
            minPageWidth: isMobile ? 400 : 180
        };
    };

    const resizeBook = () => {
        const size = getBookSize();
        bookElement.style.width = `${size.width}px`;
        bookElement.style.height = `${size.height}px`;
        // O PageFlip usa este limite para decidir entre livro aberto e página
        // única. Em telas móveis, 400px impede o modo de duas páginas.
        if (pageFlip) {
            pageFlip.getSettings().minWidth = size.minPageWidth;
        }
        pageFlip?.update();
    };

    // 1. Initialize St.PageFlip
    try {
        // Com autoSize desativado, este elemento passa a ser a fonte única das
        // dimensões do PageFlip. Assim, uma tela estreita sempre usa uma página.
        resizeBook();
        const dims = getPageDimensions();
        pageFlip = new St.PageFlip(bookElement, {
            width: dims.width,   // Calculado dinamicamente
            height: dims.height, // Calculado dinamicamente
            size: "stretch",
            minWidth: window.matchMedia("(max-width: 768px)").matches ? 400 : 180,
            maxWidth: dims.maxWidth,
            minHeight: 180,
            maxHeight: dims.maxHeight,
            drawShadow: true,
            maxShadowOpacity: 0.4,
            showCover: true,
            usePortrait: true,
            autoSize: false,
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

                // No celular há uma página por vez: o sentido do gesto define
                // o canto. Em páginas duplas, preservamos a regra atual baseada
                // no lado da página que recebeu o arraste.
                if (pageFlip.getOrientation() === "portrait") {
                    cornerX = deltaX < 0 ? bookRect.width : 0;
                } else if (activeDragPage.index % 2 === 0) {
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
                // O PageFlip só conclui o movimento manual quando isSwipe é
                // falso. Passar true aqui deixava o livro preso após um toque.
                pageFlip.userStop({ x: relX, y: relY }, false);
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

        // Ajusta o livro e as páginas ao redimensionar a janela
        let resizeTimer = null;
        const scheduleResize = () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                resizeBook();
            }, 150);
        };

        window.addEventListener("resize", scheduleResize);
        window.addEventListener("orientationchange", scheduleResize);
        window.visualViewport?.addEventListener("resize", scheduleResize);

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
        const navigate = (direction) => (event) => {
            // Alguns navegadores móveis não disparam click de forma confiável
            // sobre controles que ficam acima de uma área de arraste.
            event.preventDefault();
            event.stopPropagation();

            if (direction === "next") {
                pageFlip.flipNext();
            } else {
                pageFlip.flipPrev();
            }
        };

        const goPrev = navigate("prev");
        const goNext = navigate("next");
        btnPrev.addEventListener("click", goPrev);
        btnNext.addEventListener("click", goNext);
        btnPrev.addEventListener("touchend", goPrev, { passive: false });
        btnNext.addEventListener("touchend", goNext, { passive: false });

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
