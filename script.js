// ==========================================
// RSOUSA TECH - Cinematic Parallax Engine (LML Style)
// Pinned Slider Edition
// ==========================================

// 1. Configuração do Supabase (REST Fetch Native Approach)
const SUPABASE_URL = 'https://hrucwxjuapmtflfgmbiv.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_0Q9jLPL2aH4yMLonC7tQ2A_RruzWTVm';

// Inicializar Plugins do GSAP
gsap.registerPlugin(ScrollTrigger);

let lenis;
let projectsState = [];
let currentProjectIndex = -1;

// ==========================================
// 2. Setup Lenis Smooth Scroll & GSAP Sync
// ==========================================
function initSmoothScroll() {
    lenis = new Lenis({
        duration: 2.0, 
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        direction: 'vertical',
        gestureDirection: 'vertical',
        smooth: true,
        mouseMultiplier: 1,
        smoothTouch: false,
        touchMultiplier: 2,
    });

    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time)=>{ lenis.raf(time * 1000); });
    gsap.ticker.lagSmoothing(0);

    // Conectar menu ao scroll suave do Lenis
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target && lenis) {
                lenis.scrollTo(target, { offset: 0, duration: 2 });
            }
        });
    });
}


// ==========================================
// 3. GSAP Animações Iniciais & Hero
// ==========================================
function initHeroAnimations() {
    // 1. Criar Timeline do Hero com Pinning
    // Travamos o #hero na tela enquanto o scroll acontece
    const heroTl = gsap.timeline({
        scrollTrigger: {
            trigger: "#hero",
            start: "top top",
            end: "+=1200", // Distância que o scroll fica travado
            pin: true,
            scrub: 1,
            anticipatePin: 1
        }
    });

    // 2. Parallax do container interno durante o Pin
    heroTl.to("#hero-content", {
        y: -100, // Leve parallax para cima enquanto trava
        opacity: 0.8,
        ease: "none"
    }, 0);

    // 3. Split Text Engine (Rodamos primeiro em todos os .animate-letters)
    const titledElements = document.querySelectorAll('.animate-letters');
    titledElements.forEach(element => {
        const text = element.innerText;
        element.innerHTML = '';
        element.classList.add('splitting-done');

        const lines = text.split('\n');
        lines.forEach(lineText => {
            const lineSpan = document.createElement('span');
            lineSpan.className = 'split-line';
            
            const words = lineText.split(' ');
            words.forEach((word, wIdx) => {
                const wordWrapper = document.createElement('span');
                wordWrapper.style.display = 'inline-block';
                wordWrapper.style.whiteSpace = 'nowrap';

                const chars = word.split('');
                chars.forEach(char => {
                    const charSpan = document.createElement('span');
                    charSpan.className = 'split-char';
                    charSpan.innerText = char;
                    wordWrapper.appendChild(charSpan);
                });

                lineSpan.appendChild(wordWrapper);

                if (wIdx < words.length - 1) {
                    const space = document.createElement('span');
                    space.innerHTML = '&nbsp;';
                    lineSpan.appendChild(space);
                }
            });
            element.appendChild(lineSpan);
        });
    });

    // 4. Animação das Letras do Hero DENTRO da Timeline principal (Scrubbed)
    const heroChars = document.querySelectorAll('#hero .split-char');
    if (heroChars.length > 0) {
        heroTl.fromTo(heroChars, 
            { 
                yPercent: 120, // Começa bem abaixo
                opacity: 0,
                rotateX: -60,
                skewY: 15
            },
            {
                yPercent: 0,
                opacity: 1,
                rotateX: 0,
                skewY: 0,
                stagger: 0.1,
                ease: "power2.out"
            }, 
            0.1 // Começa quase junto com o parallax
        );
    }

    // 5. Animação para outros elementos splitting fora do Hero (se houver)
    const otherElements = document.querySelectorAll('.animate-letters:not(#hero .animate-letters)');
    otherElements.forEach(element => {
        const chars = element.querySelectorAll('.split-char');
        gsap.fromTo(chars, 
            { yPercent: 100, opacity: 0, rotateX: -20, skewY: 7 },
            {
                yPercent: 0, opacity: 1, rotateX: 0, skewY: 0,
                stagger: 0.02,
                duration: 1.8,
                ease: "expo.out",
                scrollTrigger: {
                    trigger: element,
                    start: "top 90%",
                    toggleActions: "play none none none"
                }
            }
        );
    });
}

// ==========================================
// 4. Integração Supabase & GSAP Pinned Slider
// ==========================================
async function fetchAndRenderProjects() {
    const textContainer = document.getElementById('pin-text-container');
    const imagesStrip = document.getElementById('pin-images-strip');
    
    let projects = [];
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/portfolio_projects?select=*&order=created_at.desc`, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });

        if (!response.ok) throw new Error('Falha HTTP DB');
        projects = await response.json();
    } catch (error) {
        console.error('Erro fetching Supabase:', error);
        textContainer.innerHTML = `<h3 class="text-white text-center">Falha na ignição do Database</h3>`;
        return;
    }

    projectsState = projects; 
    textContainer.innerHTML = '';
    imagesStrip.innerHTML = '';
    
    // Gerar Elementos UI Ocultos
    projects.forEach((project, index) => {
        // --- Injetando TEXTOS FIXOS ---
        const textDiv = document.createElement('div');
        textDiv.id = `project-text-${index}`;
        // Visibilidade inicial: apenas o primeiro será visível
        const isFirst = index === 0;
        textDiv.className = `absolute inset-0 flex flex-col justify-center transition-all duration-700 ease-[cubic-bezier(0.165,0.84,0.44,1)] ${isFirst ? 'opacity-100 translate-y-0 scale-100 z-10' : 'opacity-0 translate-y-10 scale-95 z-0'}`;
        
        textDiv.innerHTML = `
            <span class="font-label text-sm uppercase tracking-[0.3em] text-primary mb-4 opacity-80">${String(index + 1).padStart(2, '0')} // ${project.subtitle}</span>
            <h3 class="font-headline font-bold text-5xl lg:text-7xl text-white uppercase tracking-tighter cursor-pointer hover:text-primary transition-colors" onclick="openModal('${project.id}')">
                ${project.title}
            </h3>
            <div class="mt-8">
                <button onclick="openModal('${project.id}')" class="text-xs uppercase tracking-widest border border-white/20 px-6 py-2 rounded-full hover:bg-white hover:text-black transition-all">Explorar Caso</button>
            </div>
        `;
        textContainer.appendChild(textDiv);

        // --- Injetando IMAGENS na tira q viaja ---
        const imgDiv = document.createElement('div');
        // A altura precisa ser 100vh ou 100% da viewport (a tela Pinned) 
        imgDiv.className = 'w-full h-screen lg:h-screen flex items-center justify-center p-4 lg:p-20 relative cursor-pointer group';
        imgDiv.innerHTML = `
            <div class="w-full h-full relative overflow-hidden rounded-md" onclick="openModal('${project.id}')">
                <img src="${project.main_image_url}" alt="${project.title}" class="w-full h-full object-cover grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700 scale-100 group-hover:scale-105">
                <div class="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors"></div>
            </div>
        `;
        imagesStrip.appendChild(imgDiv);
    });

    // Iniciar Pinned Slider do ScrollTrigger
    initPinnedSlider(projects.length);
}

function initPinnedSlider(totalProjects) {
    if(totalProjects <= 1) return; // Não precisa de Slider se houver apenas 1 projeto
    
    const strip = document.getElementById('pin-images-strip');
    const texts = document.querySelectorAll('#pin-text-container > div');
    
    // Distância total da animação da tira de imagem
    // Queremos rolar (-100% * (qtd-1))
    const moveY = - (100 * (totalProjects - 1)) / totalProjects;

    // A mágica: ScrollTrigger que prende a sessão principal e move a Tira
    gsap.to(strip, {
        yPercent: moveY, // Movimento exato para encaixar as telas
        ease: "none",
        scrollTrigger: {
            trigger: "#pinned-projects-section",
            start: "top top", // Quando o topo da div encostar no topo da tela, engata
            end: `+=${totalProjects * 100}%`, // Exigirá (N) viewports de scroll pra terminar
            pin: true,
            scrub: 0.5, // 0.5 sec de delay no scrub para ficar LML buttery
            onUpdate: (self) => {
                // Descobrindo qual é o projeto 'Ativo' baseado no progresso decimal do Slider
                const newIndex = Math.round(self.progress * (totalProjects - 1));
                
                if (newIndex !== currentProjectIndex) {
                    // Update Text Visibility
                    updateActiveText(newIndex, texts);
                    currentProjectIndex = newIndex;
                }
            }
        }
    });
}

function updateActiveText(newIndex, allTextDivs) {
    allTextDivs.forEach((div, i) => {
        if (i === newIndex) {
            // Ativar
            div.classList.replace('opacity-0', 'opacity-100');
            div.classList.replace('translate-y-10', 'translate-y-0');
            div.classList.replace('-translate-y-10', 'translate-y-0');
            div.classList.replace('scale-95', 'scale-100');
            div.classList.replace('z-0', 'z-10');
        } else if (i < newIndex) {
            // Sumindo pra cima
            div.classList.replace('opacity-100', 'opacity-0');
            div.classList.replace('translate-y-0', '-translate-y-10');
            div.classList.replace('translate-y-10', '-translate-y-10');
            div.classList.replace('scale-100', 'scale-95');
            div.classList.replace('z-10', 'z-0');
        } else {
            // Sumindo pra baixo
            div.classList.replace('opacity-100', 'opacity-0');
            div.classList.replace('translate-y-0', 'translate-y-10');
            div.classList.replace('-translate-y-10', 'translate-y-10');
            div.classList.replace('scale-100', 'scale-95');
            div.classList.replace('z-10', 'z-0');
        }
    });
}

// ==========================================
// 5. Modal Engine (Lenis Aware)
// ==========================================
function initModalSystem() {
    const modal = document.getElementById('project-modal');
    const closeBtn = document.getElementById('close-modal');
    const modalContainer = document.getElementById('modal-container');
    
    const closeModalFn = () => {
        modal.classList.add('opacity-0', 'pointer-events-none');
        modalContainer.classList.add('translate-y-10');
        if (lenis) lenis.start();
    };

    closeBtn.addEventListener('click', closeModalFn);
    window.addEventListener('click', (e) => { if (e.target === modal) closeModalFn(); });
    window.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModalFn(); });
}

function openModal(projectId) {
    const project = projectsState.find(p => p.id === projectId);
    if (!project) return;

    const modal = document.getElementById('project-modal');
    const modalBody = document.getElementById('modal-body');
    const modalContainer = document.getElementById('modal-container');

    // Mapeando Arrays de Tecnologias (Chips)
    let techHtml = '';
    if (project.technologies && Array.isArray(project.technologies) && project.technologies.length > 0) {
        techHtml = `<div class="flex flex-wrap gap-2 mt-8">` + 
            project.technologies.map(t => `<span class="px-3 py-1 bg-cyan-900/20 border border-cyan-500/30 text-cyan-400 text-xs font-label uppercase tracking-widest rounded-full">${t}</span>`).join('') +
            `</div>`;
    }

    // Processando até 4 Imagens do Supabase
    let imagesHtml = '';
    const imgs = [project.main_image_url, project.image_2_url, project.image_3_url, project.image_4_url].filter(url => url && url.length > 5);
    
    imgs.forEach(img => {
        imagesHtml += `<img src="${img}" class="w-full h-auto object-cover opacity-90 hover:opacity-100 transition-opacity mb-4 lg:mb-10 shadow-[0_10px_30px_rgba(0,0,0,0.5)]">`;
    });

    // Dividindo o corpo em Esquerda (Sticky Text) e Direita (Scrollable Gallery)
    modalBody.innerHTML = `
        <div class="w-full lg:w-5/12 p-10 lg:p-16 flex flex-col justify-start border-b lg:border-b-0 lg:border-r border-outline-variant/30 relative bg-surface-dim">
            <div class="sticky top-0">
                <h2 class="font-headline font-bold text-4xl lg:text-6xl mb-4 text-white uppercase tracking-tighter leading-none">${project.title || ''}</h2>
                <h3 class="text-cyan-500 tracking-widest text-sm uppercase mb-8 font-label">${project.subtitle || 'Detalhes do Projeto'}</h3>
                
                <div class="font-body text-lg text-slate-300 leading-relaxed space-y-4">
                    ${(project.description || '').split('\\n').filter(p => p.trim()).map(p => `<p>${p}</p>`).join('')}
                </div>

                ${techHtml}
            </div>
        </div>
        <div class="w-full lg:w-7/12 bg-black overflow-y-auto p-4 lg:p-12 relative max-h-[85vh]">
            ${imagesHtml}
        </div>
    `;

    modal.classList.remove('opacity-0', 'pointer-events-none');
    modalContainer.classList.remove('translate-y-10');
    if (lenis) lenis.stop();
}

function initHorizontalStackSlider() {
    const stackSection = document.getElementById('horizontal-stack-section');
    const stackTrack = document.getElementById('stack-track');

    if (!stackSection || !stackTrack) return;

    // Calcular o quanto devemos arrastar a div da trilha no eixo X para mostrar todos
    // Basicamente (Tamanho total da pista - Tamanho visível da janela)
    function getScrollAmount() {
        let trackWidth = stackTrack.scrollWidth;
        return -(trackWidth - window.innerWidth);
    }

    const tween = gsap.to(stackTrack, {
        x: getScrollAmount,
        ease: "none"
    });

    ScrollTrigger.create({
        trigger: stackSection,
        start: "top top",
        end: () => `+=${getScrollAmount() * -1}`, // Dá scroll pra baixo a mesma quantia que andaremos de lado
        pin: true,
        animation: tween,
        scrub: 1, // LML buttery smooth feeling longo scrolling
        invalidateOnRefresh: true // Re-calcula se virar a tela
    });
}

// ==========================================
// 5. Motor de Cursor Cyber & Rastro Elétrico
// ==========================================
function initCustomCursor() {
    // Detectar mobile/touch para não rodar (evitar cursor duplicado ou travado)
    if (window.matchMedia("(max-width: 1024px)").matches || 'ontouchstart' in window) {
        return;
    }

    const cursor = document.getElementById('custom-cursor');
    const canvas = document.getElementById('cursor-canvas');
    const ctx = canvas.getContext('2d');
    
    let mouse = { x: 0, y: 0 };
    let points = [];
    const maxPoints = 25; // Comprimento do rastro

    // Sincronizar tamanho do canvas
    const resize = () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);
    resize();

    // Rastrear mouse
    window.addEventListener('mousemove', (e) => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;

        // Movimento do ponto central (GSAP para smoothness)
        gsap.to(cursor, {
            x: mouse.x,
            y: mouse.y,
            duration: 0.1,
            ease: "power2.out"
        });
    });

    // Interações de Expansão
    const handleExpand = () => cursor.classList.add('expanded');
    const handleShrink = () => cursor.classList.remove('expanded');

    const setupInteractions = () => {
        const triggers = document.querySelectorAll('a, button, .side-nav-node, .project-card, [role="button"]');
        triggers.forEach(el => {
            el.addEventListener('mouseenter', handleExpand);
            el.addEventListener('mouseleave', handleShrink);
        });
    };
    setupInteractions();

    // Observar mudanças no DOM para novos elementos
    const observer = new MutationObserver(setupInteractions);
    observer.observe(document.body, { childList: true, subtree: true });

    // Loop de Animação do Rastro Elétrico
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Adicionar posição atual
        points.push({ ...mouse });
        if (points.length > maxPoints) points.shift();

        if (points.length > 2) {
            ctx.beginPath();
            ctx.strokeStyle = '#00F0FF';
            ctx.lineWidth = 1;
            ctx.lineCap = 'round';
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#00F0FF';

            for (let i = 1; i < points.length; i++) {
                const p1 = points[i - 1];
                const p2 = points[i];

                // Efeito de "Jitter" Elétrico: desvio aleatório na linha
                const jitterX = (Math.random() - 0.5) * 6;
                const jitterY = (Math.random() - 0.5) * 6;

                // Gradiente de opacidade conforme o rastro "envelhece"
                ctx.globalAlpha = i / points.length;
                
                ctx.moveTo(p1.x, p1.y);
                ctx.lineTo(p2.x + jitterX, p2.y + jitterY);
            }
            ctx.stroke();

            // Faísca ocasional
            if (Math.random() > 0.9 && points.length > 10) {
                const sparkP = points[Math.floor(Math.random() * points.length)];
                ctx.beginPath();
                ctx.arc(sparkP.x + (Math.random()-0.5)*15, sparkP.y + (Math.random()-0.5)*15, Math.random() * 2, 0, Math.PI * 2);
                ctx.fillStyle = '#00F0FF';
                ctx.fill();
            }
        }

        requestAnimationFrame(animate);
    }
    animate();
}

// ==========================================
// DOM Ready Bootstrap Inicial
// ==========================================
async function boot() {
    initCustomCursor(); 
    initSmoothScroll();
    initHeroAnimations();
    await fetchAndRenderProjects();
    initModalSystem();
    initHorizontalStackSlider();
    
    // Força o recálculo do GSAP após todas as inserções de DOM dinâmico das galerias estarem completas
    setTimeout(() => {
        ScrollTrigger.refresh();
    }, 100);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
} else {
    boot();
}
