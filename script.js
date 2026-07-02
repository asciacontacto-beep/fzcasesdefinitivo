// CONFIGURACI�N SUPABASE
const SUPABASE_URL = 'https://ffvswmjaxbvomowmigtr.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZmdnN3bWpheGJ2b21vd21pZ3RyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwNjU3MTEsImV4cCI6MjA4NzY0MTcxMX0.96OTSCQOwg5SfidmxpQ3yNA4Qfy8DEqhgR57CpmMAW8';
const _supabase = typeof supabase !== 'undefined' ? supabase.createClient(SUPABASE_URL, SUPABASE_KEY) : null;

let products = [];

async function loadProductsFromSupabase() {
    if (!_supabase) return;
    const { data, error } = await _supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error cargando productos:', error);
        return;
    }
    // �"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"�
    // SISTEMA DE PORTADA DINÁMICA (CARRUSEL + CONFIG)
    // �"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"�
    const heroImages = data.filter(p => p.nombre === '__SYSTEM_HERO__' && (p.activo === true || p.activo === 'true'))
                           .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

    // Configuración de texto/fuente/logo
    const configSettings = data.find(p => p.nombre === '__CONFIG_SETTINGS__');
    if (configSettings && configSettings.notas) {
        try {
            const cfg = JSON.parse(configSettings.notas);

            // Aplicar título y subtítulo
            const titleEl = document.getElementById('hero-title');
            const subtitleEl = document.getElementById('hero-subtitle');
            if (titleEl && cfg.heroTitle) titleEl.innerHTML = cfg.heroTitle;
            if (subtitleEl && cfg.heroSubtitle) subtitleEl.textContent = cfg.heroSubtitle;

            // Aplicar tipografía
            if (cfg.heroFont) {
                const link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = `https://fonts.googleapis.com/css2?family=${cfg.heroFont.replace(/ /g, '+')}:wght@400;700;800&display=swap`;
                document.head.appendChild(link);
                if (titleEl) titleEl.style.fontFamily = `'${cfg.heroFont}', sans-serif`;
            }

            // Aplicar color de texto
            if (cfg.heroColor) {
                if (titleEl) titleEl.style.color = cfg.heroColor;
                if (subtitleEl) subtitleEl.style.color = cfg.heroColor;
            }

            // Aplicar logo dinámico en toda la página
            if (cfg.logoUrl) {
                document.querySelectorAll('img[src*="logo.png"], img[src*="logo."]').forEach(img => {
                    img.src = cfg.logoUrl;
                });
            }

            // Aplicar Canje y Garantía
            if (cfg.canje) {
                const cTitle = document.getElementById('dynamic-canje-title');
                const cSubtitle = document.getElementById('dynamic-canje-subtitle');
                const cImg = document.getElementById('dynamic-canje-img');
                if (cTitle && cfg.canje.title) cTitle.innerHTML = cfg.canje.title;
                if (cSubtitle && cfg.canje.subtitle) cSubtitle.innerHTML = cfg.canje.subtitle;
                if (cImg && cfg.canje.img) cImg.src = cfg.canje.img;
            }
            if (cfg.garantia) {
                const gT1 = document.getElementById('dynamic-garantia-title1');
                const gT2 = document.getElementById('dynamic-garantia-title2');
                const gText = document.getElementById('dynamic-garantia-text');
                const gImg = document.getElementById('dynamic-garantia-img');
                if (gT1 && cfg.garantia.title1) gT1.innerHTML = cfg.garantia.title1;
                if (gT2 && cfg.garantia.title2) gT2.innerHTML = cfg.garantia.title2;
                if (gText && cfg.garantia.text) gText.innerHTML = cfg.garantia.text;
                if (gImg && cfg.garantia.img) gImg.src = cfg.garantia.img;
            }

            // Aplicar fondo animado de destacados
            if (typeof cfg.animatedBgEnabled !== 'undefined' && !cfg.animatedBgEnabled) {
                const animBg = document.querySelector('.featured-bg-animation');
                if (animBg) animBg.style.display = 'none';
                const featuredShowcase = document.querySelector('.featured-showcase');
                if (featuredShowcase) featuredShowcase.style.backgroundColor = '#ffffff';
            }

            if (cfg.bgImg) {
                const featuredShowcase = document.querySelector('.featured-showcase');
                if (featuredShowcase) {
                    featuredShowcase.style.backgroundImage = `url('${cfg.bgImg}')`;
                    featuredShowcase.style.backgroundSize = 'cover';
                    featuredShowcase.style.backgroundPosition = 'center';
                    featuredShowcase.style.backgroundRepeat = 'no-repeat';
                }
            }

            // Categorías Dinámicas
            const catNavSection = document.getElementById('dynamic-category-nav');
            const catNavList = document.getElementById('dynamic-category-list');
            
            if (catNavSection && catNavList) {
                if (cfg.categoryNav && cfg.categoryNav.enabled === false) {
                    catNavSection.style.display = 'none';
                } else {
                    catNavSection.style.display = 'block';
                    const defaultItems = [
                        { name: "iPhone", url: "catalogo.html?cat=iPhone", imgUrl: "https://www.apple.com/la/iphone/home/images/overview/chapternav/nav_iphone_17pro__b8rt659h2ogi_large.png" },
                        { name: "iPad", url: "catalogo.html?cat=iPad", imgUrl: "https://www.apple.com/assets-www/en_WW/ipad/03_chapternav/small/ipad_pro_bd732ab83_2x.png" },
                        { name: "MacBook", url: "catalogo.html?cat=MacBook", imgUrl: "https://www.apple.com/assets-www/en_WW/mac/04_chapternav/small/nav_mbp_0b36bc863_2x.png" },
                        { name: "Apple Watch", url: "catalogo.html?cat=Apple+Watch", imgUrl: "assets/nav_watch_real.png" },
                        { name: "Accesorios", url: "catalogo.html?cat=Accesorios", imgUrl: "https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/MTJV3?wid=200&hei=200&fmt=png-alpha" }
                    ];
                    
                    const items = (cfg.categoryNav && cfg.categoryNav.items && cfg.categoryNav.items.length > 0) 
                        ? cfg.categoryNav.items 
                        : defaultItems;
                    
                    catNavList.innerHTML = '';
                    let displayIndex = 0;
                    items.forEach((item) => {
                        if (item.active === false) return; // Skip inactive items

                        let styleImg = '';
                        if (item.name.toLowerCase().includes('macbook')) styleImg = 'style="width:85px;height:auto;"';
                        else if (item.name.toLowerCase().includes('watch')) styleImg = 'style="height:65px;width:auto;"';
                        
                        const a = document.createElement('a');
                        a.href = item.url;
                        a.className = 'category-item cat-anim';
                        a.style.setProperty('--i', displayIndex++);
                        a.innerHTML = `
                            <div class="cat-img-wrap">
                                <img class="category-icon-img" src="${item.imgUrl}" alt="${item.name}" loading="lazy" ${styleImg}>
                            </div>
                            <span>${item.name}</span>
                        `;
                        catNavList.appendChild(a);
                    });
                }
            }

            // Aplicar Pie de Página (Footer)
            if (cfg.footer) {
                const footerIg = document.querySelector('.social-links a[aria-label="Instagram"]');
                const footerFb = document.querySelector('.social-links a[aria-label="Facebook"]');
                const footerTt = document.querySelector('.social-links a[aria-label="TikTok"]');
                const footerWa = document.querySelector('.contact-list a[href^="https://wa.me"]');
                const footerEmail = document.querySelector('.contact-list a[href^="mailto:"]');
                const footerDesc = document.querySelector('.footer-desc');

                if (footerIg && cfg.footer.ig) footerIg.href = cfg.footer.ig;
                if (footerFb && cfg.footer.fb) footerFb.href = cfg.footer.fb;
                if (footerTt && cfg.footer.tt) footerTt.href = cfg.footer.tt;
                if (footerWa && cfg.footer.waNum) footerWa.href = `https://wa.me/${cfg.footer.waNum}`;
                if (footerWa && cfg.footer.waTxt) footerWa.textContent = cfg.footer.waTxt;
                if (footerEmail && cfg.footer.email) {
                    footerEmail.href = `mailto:${cfg.footer.email}`;
                    footerEmail.textContent = cfg.footer.email;
                }
                if (footerDesc && cfg.footer.desc) footerDesc.textContent = cfg.footer.desc;
            }

            // Aplicar Sección Sobre Nosotros (nosotros.html)
            if (cfg.about) {
                // Timeline
                const tl = document.getElementById('dynamic-timeline');
                if (tl && cfg.about.timeline) {
                    tl.innerHTML = cfg.about.timeline.map(item => `
                        <div class="timeline-item scroll-animate fade-up">
                            <div class="timeline-dot"></div>
                            <div class="timeline-content">
                                <div class="timeline-year">${item.year}</div>
                                <h3>${item.title}</h3>
                                <p>${item.desc}</p>
                            </div>
                        </div>
                    `).join('');
                }

                // Bento
                const bento = document.getElementById('dynamic-bento');
                if (bento && cfg.about.bento) {
                    let html = '';
                    if (cfg.about.bento[0]) {
                        html += `
                        <div class="bento-card bento-large scroll-animate fade-up">
                            <img src="${cfg.about.bento[0].img}" alt="${cfg.about.bento[0].title}" class="bento-img" loading="lazy">
                            <div class="bento-content overlay-content">
                                <h3>${cfg.about.bento[0].title}</h3>
                                <p>${cfg.about.bento[0].desc}</p>
                            </div>
                        </div>`;
                    }
                    if (cfg.about.bento[1]) {
                        html += `
                        <div class="bento-card bento-small bento-dark scroll-animate fade-up">
                            <div class="bento-content">
                                <div class="bento-icon">${cfg.about.bento[1].icon}</div>
                                <h3>${cfg.about.bento[1].title}</h3>
                                <p>${cfg.about.bento[1].desc}</p>
                            </div>
                        </div>`;
                    }
                    if (cfg.about.bento[2] && cfg.about.bento[2].title) {
                        html += `
                        <div class="bento-card bento-small bento-glass scroll-animate fade-up">
                            <div class="bento-content">
                                <div class="bento-icon">${cfg.about.bento[2].icon}</div>
                                <h3>${cfg.about.bento[2].title}</h3>
                                <p>${cfg.about.bento[2].desc}</p>
                            </div>
                        </div>`;
                    }
                    bento.innerHTML = html;
                }

                // Gallery
                const gal = document.getElementById('dynamic-gallery');
                if (gal && cfg.about.gallery) {
                    gal.innerHTML = cfg.about.gallery.map(url => `
                        <div class="gallery-item scroll-animate fade-scale"><img src="${url}" loading="lazy"></div>
                    `).join('');
                }
            }

        } catch(e) { /* JSON inválido, ignorar */ }
    }

    // Inicializar carrusel del hero
    window._heroInitialized = false;
    if (heroImages.length > 0) {
        const container = document.getElementById('hero-slides-container');
        if (container) {
            container.innerHTML = '';
            heroImages.forEach((h, i) => {
                const slide = document.createElement('div');
                slide.className = 'hero-slide' + (i === 0 ? ' active' : '');
                const imgPath = h.imagen ? h.imagen.replace(/^\/assets\//, 'assets/') : '';
                slide.innerHTML = `<img src="${imgPath}" class="hero-slide-img" alt="Portada ${i+1}">`;
                container.appendChild(slide);
            });
            window._heroInitCarousel(heroImages.length);
        }
    }

    // Filtrar localmente para evitar problemas de tipos de datos en la DB (boolean vs string)
    const activeData = data.filter(p => (p.activo === true || p.activo === 'true')
        && p.nombre !== '__SYSTEM_HERO__'
        && p.nombre !== '__CONFIG_HERO__'
        && p.nombre !== '__CONFIG_SETTINGS__');

    // Mapear estructura de base de datos a estructura de UI
    products = activeData.map(p => {
        const baseFeatures = [
            "Garantía oficial de FZCASES",
            "Retiro inmediato en Tandil / Necochea",
            "Soporte técnico especializado"
        ];
        let cleanNotas = p.notas ? p.notas.replace(/\[DESTACADO\]/g, '').replace(/\[NUEVO\]/g, '').trim() : '';
        const isBestseller = p.notas ? p.notas.includes('[DESTACADO]') : false;
        const isNuevo = p.notas ? p.notas.includes('[NUEVO]') : false;

        const customFeatures = cleanNotas ? [cleanNotas] : [];
        const allFeatures = [...customFeatures, ...baseFeatures];

        return {
            id: p.id,
            name: p.nombre,
            category: p.categoria,
            subcategory: p.subcategoria,
            precio: p.precio_venta,
            storage: p.almacenamiento,
            color: p.color,
            battery: p.battery,
            image: (p.imagen || "assets/iphone_case.png").replace(/^\/assets\//, 'assets/'),
            image2: p.imagen2 ? p.imagen2.replace(/^\/assets\//, 'assets/') : null,
            image3: p.imagen3 ? p.imagen3.replace(/^\/assets\//, 'assets/') : null,
            features: allFeatures,
            notas: cleanNotas,
            bestseller: p.bestseller || isBestseller,
            nuevoIngreso: isNuevo,
            variantes: p.variantes
        };
    });

    // Disparar renders iniciales si ya están listos
    if (window.initAdvancedFilters) window.initAdvancedFilters();
    if (window.renderFilters) window.renderFilters();
    if (window.renderCatalog) window.renderCatalog();
    if (window.renderHomeSections) window.renderHomeSections();
    if (window.updateSidebarStockVisibility) window.updateSidebarStockVisibility();

    // Si hay ?product_id= en la URL, abrir ese modal automáticamente
    const urlProductId = new URLSearchParams(window.location.search).get('product_id');
    if (urlProductId && window.openModal) {
        // Pequeño delay para que el DOM del modal esté listo
        setTimeout(() => window.openModal(parseInt(urlProductId) || urlProductId), 200);
    }
}

window.updateSidebarStockVisibility = function() {
    const subLinks = document.querySelectorAll('.sub-link-2');
    subLinks.forEach(link => {
        try {
            const urlParams = new URL(link.href, window.location.origin).searchParams;
            const cat = urlParams.get('cat');
            const subcat = urlParams.get('subcat');
            if (cat && subcat) {
                const hasStock = products.some(p => p.category === cat && p.subcategory === subcat);
                if (!hasStock) {
                    link.style.display = 'none';
                } else {
                    link.style.display = '';
                }
            }
        } catch (e) {
            console.error('Error parsing sidebar link', e);
        }
    });

    const nestedAccordions = document.querySelectorAll('.nested-accordion');
    nestedAccordions.forEach(acc => {
        const visibleChildren = Array.from(acc.querySelectorAll('.sub-link-2')).filter(child => child.style.display !== 'none');
        if (visibleChildren.length === 0) {
            acc.style.display = 'none';
        } else {
            acc.style.display = '';
        }
    });
};

// activeFilter global para que renderFilters/renderCatalog llamados desde Supabase lo vean
let activeFilter = (new URLSearchParams(window.location.search).get('cat'))
    ? decodeURIComponent(new URLSearchParams(window.location.search).get('cat'))
    : 'Todos';
let activeSubcat = (new URLSearchParams(window.location.search).get('subcat'))
    ? decodeURIComponent(new URLSearchParams(window.location.search).get('subcat'))
    : 'Todos';

const phoneNumber = "5491100000000";

document.addEventListener('DOMContentLoaded', () => {
    // ==========================================
    // SIDEBAR NAVIGATION LOGIC (Global)
    // ==========================================
    const burger = document.getElementById('cat-burger-btn');
    const sidebar = document.getElementById('cat-sidebar');
    const overlay = document.getElementById('cat-overlay');
    const closeBtn = document.getElementById('cat-sidebar-close');

    function openSidebar() {
        if(sidebar) sidebar.classList.add('open');
        if(overlay) overlay.classList.add('open');
        document.body.style.overflow = 'hidden';
    }

    function closeSidebar() {
        if(sidebar) sidebar.classList.remove('open');
        if(overlay) overlay.classList.remove('open');
        document.body.style.overflow = '';
    }

    if (burger) burger.addEventListener('click', openSidebar);
    if (closeBtn) closeBtn.addEventListener('click', closeSidebar);
    if (overlay) overlay.addEventListener('click', closeSidebar);

    // Global category filter function for the sidebar
    window.filtrar = function(cat) {
        if (window.location.pathname.includes('catalogo.html')) {
            if (window.setCategoryFilter) {
                window.setCategoryFilter(cat);
                closeSidebar();
            }
        } else {
            // Redirect to catalogo.html with query param
            window.location.href = 'catalogo.html?cat=' + encodeURIComponent(cat);
        }
    };

    // ==========================================
    // SIDEBAR ACCORDION LOGIC
    // ==========================================
    const accHeaders = document.querySelectorAll('.sidebar-accordion-header, .nested-accordion-header');
    accHeaders.forEach(header => {
        header.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const content = header.nextElementSibling;
            const isExpanded = header.getAttribute('aria-expanded') === 'true';
            
            header.setAttribute('aria-expanded', !isExpanded);
            if (!isExpanded) {
                content.classList.add('open');
            } else {
                content.classList.remove('open');
            }
        });
    });


    // ==========================================
    // BUSCADOR GLOBAL
    // ==========================================
    const searchOverlay = document.getElementById('search-overlay');
    const searchInput   = document.getElementById('search-input');
    const searchResults = document.getElementById('search-results');
    const searchOpenBtn = document.getElementById('nav-search-btn');
    const searchCloseBtn= document.getElementById('search-close-btn');

    function openSearch() {
        if (!searchOverlay) return;
        searchOverlay.classList.add('open');
        document.body.style.overflow = 'hidden';
        setTimeout(() => { if (searchInput) searchInput.focus(); }, 150);
    }

    function closeSearch() {
        if (!searchOverlay) return;
        searchOverlay.classList.remove('open');
        document.body.style.overflow = '';
        if (searchInput) searchInput.value = '';
        if (searchResults) {
            searchResults.innerHTML = '';
            searchResults.classList.remove('has-results');
        }
    }

    if (searchOpenBtn)  searchOpenBtn.addEventListener('click', openSearch);
    if (searchCloseBtn) searchCloseBtn.addEventListener('click', closeSearch);

    // Cerrar al hacer clic fuera del contenedor
    if (searchOverlay) {
        searchOverlay.addEventListener('click', (e) => {
            if (e.target === searchOverlay) closeSearch();
        });
    }

    // Cerrar con Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeSearch();
    });

    // Búsqueda en tiempo real
    if (searchInput) {
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const query = searchInput.value.trim();
                if (query.length > 0) {
                    window.location.href = 'catalogo.html?search=' + encodeURIComponent(query);
                }
            }
        });

        searchInput.addEventListener('input', () => {
            const query = searchInput.value.trim().toLowerCase();
            if (!searchResults) return;

            if (query.length < 2) {
                searchResults.innerHTML = '';
                searchResults.classList.remove('has-results');
                return;
            }

            // Si no hay productos cargados todavía (estamos en página sin catálogo)
            // redirigir al catálogo con el término
            if (!products || products.length === 0) {
                searchResults.innerHTML = `
                    <div class="search-result-item" id="search-goto-catalog">
                        <div class="search-result-info">
                            <div class="search-result-name">Buscar "<strong>${searchInput.value.trim()}</strong>" en el catálogo</div>
                            <div class="search-result-cat">Ver todos los resultados</div>
                        </div>
                    </div>`;
                searchResults.classList.add('has-results');
                document.getElementById('search-goto-catalog')?.addEventListener('click', () => {
                    window.location.href = 'catalogo.html?search=' + encodeURIComponent(searchInput.value.trim());
                });
                return;
            }

            const matches = products.filter(p =>
                (p.name  && p.name.toLowerCase().includes(query))  ||
                (p.category && p.category.toLowerCase().includes(query)) ||
                (p.storage  && p.storage.toLowerCase().includes(query))  ||
                (p.color    && p.color.toLowerCase().includes(query))
            ).slice(0, 8);

            if (matches.length === 0) {
                searchResults.innerHTML = `<div class="search-no-results">No encontramos resultados para "<strong>${searchInput.value.trim()}</strong>"</div>`;
                searchResults.classList.add('has-results');
                return;
            }

            searchResults.innerHTML = matches.map((p, i) => `
                <div class="search-result-item" data-search-idx="${i}">
                    <img class="search-result-img" src="${p.image}" alt="${p.name}" onerror="this.src='assets/iphone_case.png'">
                    <div class="search-result-info">
                        <div class="search-result-name">${p.name}${p.storage ? ' · '+p.storage : ''}${p.color ? ' · '+p.color : ''}</div>
                        <div class="search-result-cat">${p.category || ''}</div>
                    </div>
                    <div class="search-result-price">${p.precio ? '$' + Number(p.precio).toLocaleString('es-AR') : ''}</div>
                </div>
            `).join('');
            searchResults.classList.add('has-results');

            // Click en resultado �  navegar al catálogo y abrir el producto
            searchResults.querySelectorAll('.search-result-item').forEach((el, i) => {
                el.addEventListener('click', () => {
                    closeSearch();
                    const prod = matches[i];
                    // Siempre navegar al catálogo con el producto seleccionado
                    window.location.href = 'catalogo.html?product_id=' + encodeURIComponent(prod.id);
                });
            });
        });
    }

    // Si llegamos con ?search= en la URL, se usará en renderCatalog
    const searchParam = new URLSearchParams(window.location.search).get('search');

    // Detectar scroll para el sticky navbar (cat-navbar)
    const navbar = document.querySelector('.cat-navbar');
    if (navbar) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        });
    }

    // Relleno de Filtros
    const filterContainer = document.getElementById('filter-container');
    // activeFilter es global (declarada arriba), ya viene con el valor correcto de la URL

    window.setCategoryFilter = function(categoryName) {
        if (!filterContainer) return;
        const btns = filterContainer.querySelectorAll('.filter-btn');
        for (let btn of btns) {
            if (btn.textContent.trim() === categoryName) {
                btn.click();
                break;
            }
        }
    }

    window.initAdvancedFilters = function() {
        const btnOpenFilters = document.getElementById('btn-open-filters');
        const filterSidebar = document.getElementById('filter-sidebar');
        const filterOverlay = document.getElementById('filter-overlay');
        const btnCloseFilters = document.getElementById('filter-sidebar-close');
        const btnApplyFilters = document.getElementById('btn-apply-filters');

        const catSelect = document.getElementById('adv-category');
        const modelSelect = document.getElementById('adv-modelo');
        const storageSelect = document.getElementById('adv-storage');
        const colorSelect = document.getElementById('adv-color');
        const batterySelect = document.getElementById('adv-battery');
        const simSelect = document.getElementById('adv-sim');

        function updateDynamicFilters() {
            let catValue = catSelect ? catSelect.value : 'Todos';
            // Sincronizar el filtro global de categoría si se seleccionó uno en el sidebar
            if (catValue === 'iPhone') activeFilter = 'iPhone';
            else if (catValue === 'Samsung') activeFilter = 'Samsung';
            else if (catValue === 'iPad') activeFilter = 'iPad';
            else if (catValue === 'MacBook') activeFilter = 'MacBook';
            else if (catValue === 'Apple Watch') activeFilter = 'Apple Watch';
            else if (catValue === 'Accesorios') activeFilter = 'Accesorios';
            else activeFilter = 'Todos';
            
            // Actualizar botones externos para que reflejen el cambio
            window.renderFilters();

            // Filtrar los productos para extraer las opciones
            const catProducts = activeFilter === 'Todos' ? products : products.filter(p => p.category === activeFilter);

            if (modelSelect) {
                const currentModel = modelSelect.value;
                const uniqueModels = [...new Set(catProducts.map(p => p.name).filter(Boolean))].sort();
                modelSelect.innerHTML = '<option value="Todos">Todos</option>';
                uniqueModels.forEach(m => {
                    const opt = document.createElement('option');
                    opt.value = m; opt.textContent = m;
                    modelSelect.appendChild(opt);
                });
                if (uniqueModels.includes(currentModel)) modelSelect.value = currentModel;
            }

            if (storageSelect) {
                const currentStorage = storageSelect.value;
                const uniqueStorages = [...new Set(catProducts.map(p => p.storage).filter(Boolean))].sort();
                storageSelect.innerHTML = '<option value="Todos">Todos</option>';
                uniqueStorages.forEach(s => {
                    const opt = document.createElement('option');
                    opt.value = s; opt.textContent = s;
                    storageSelect.appendChild(opt);
                });
                if (uniqueStorages.includes(currentStorage)) storageSelect.value = currentStorage;
            }

            if (colorSelect) {
                const currentColor = colorSelect.value;
                const uniqueColors = [...new Set(catProducts.map(p => p.color).filter(Boolean))].sort();
                colorSelect.innerHTML = '<option value="Todos">Todos</option>';
                uniqueColors.forEach(color => {
                    const opt = document.createElement('option');
                    opt.value = color; opt.textContent = color;
                    colorSelect.appendChild(opt);
                });
                if (uniqueColors.includes(currentColor)) colorSelect.value = currentColor;
            }
        }

        if (catSelect) {
            catSelect.addEventListener('change', updateDynamicFilters);
        }

        // Ejecutar primera vez
        updateDynamicFilters();

        // Lógica de apertura/cierre
        if (btnOpenFilters && filterSidebar && filterOverlay) {
            btnOpenFilters.addEventListener('click', () => {
                // Sincronizar el select con el filtro activo externo al abrir
                if (catSelect) {
                    let catMatch = 'Todos';
                    if (activeFilter === 'iPhone') catMatch = 'iPhone';
                    else if (activeFilter === 'Samsung') catMatch = 'Samsung';
                    else if (activeFilter === 'iPad') catMatch = 'iPad';
                    else if (activeFilter === 'MacBook') catMatch = 'MacBook';
                    else if (activeFilter === 'Apple Watch') catMatch = 'Apple Watch';
                    else if (activeFilter === 'Accesorios') catMatch = 'Accesorios';
                    catSelect.value = catMatch;
                }
                updateDynamicFilters();
                filterSidebar.classList.add('open');
                filterOverlay.classList.add('open');
            });
            const closeFilters = () => {
                filterSidebar.classList.remove('open');
                filterOverlay.classList.remove('open');
            };
            if (btnCloseFilters) btnCloseFilters.addEventListener('click', closeFilters);
            filterOverlay.addEventListener('click', closeFilters);
            if (btnApplyFilters) {
                btnApplyFilters.addEventListener('click', () => {
                    window.renderCatalog();
                    closeFilters();
                });
            }
        }
    };

    window.renderFilters = function() {
        if (!filterContainer) return;
        
        const preferredOrder = ['Todos', 'iPhone', 'Samsung', 'iPad', 'MacBook', 'Apple Watch', 'Accesorios'];
        const uniqueCategories = [...new Set(products.map(p => p.category))];
        const allCategories = ['Todos', ...uniqueCategories];

        // Ordenar según preferredOrder
        allCategories.sort((a, b) => {
            let indexA = preferredOrder.indexOf(a);
            let indexB = preferredOrder.indexOf(b);
            if (indexA === -1) indexA = 99;
            if (indexB === -1) indexB = 99;
            return indexA - indexB;
        });
        
        filterContainer.innerHTML = '';
        allCategories.forEach(cat => {
            const btn = document.createElement('button');
            btn.className = `filter-btn ${cat === activeFilter ? 'active' : ''}`;
            btn.textContent = cat;
            btn.addEventListener('click', () => {
                activeFilter = cat;
                window.renderFilters();
                window.renderCatalog();
            });
            filterContainer.appendChild(btn);
        });

        // Asegurar que el botón activo sea visible en pantallas móviles
        const activeBtn = filterContainer.querySelector('.active');
        if (activeBtn) {
            setTimeout(() => {
                activeBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
            }, 10);
        }
    }

    // Relleno de Catálogo
    const productGrid = document.getElementById('product-grid');

    window.renderCatalog = function() {
        if (!productGrid) return;
        productGrid.innerHTML = '';

        const urlSearchParam = new URLSearchParams(window.location.search).get('search');
        let searchTitleElement = document.getElementById('search-active-title');

        const advModelo = document.getElementById('adv-modelo') ? document.getElementById('adv-modelo').value : 'Todos';
        const advStorage = document.getElementById('adv-storage') ? document.getElementById('adv-storage').value : 'Todos';
        const advColor = document.getElementById('adv-color') ? document.getElementById('adv-color').value : 'Todos';
        const advBattery = document.getElementById('adv-battery') ? document.getElementById('adv-battery').value : 'Todas';
        const advSim = document.getElementById('adv-sim') ? document.getElementById('adv-sim').value : 'Todas';

        const filteredProducts = products.filter(p => {
            const matchCat = activeFilter === 'Todos' || p.category === activeFilter;
            const matchSubcat = activeSubcat === 'Todos' || p.subcategory === activeSubcat;
            let matchSearch = true;
            if (urlSearchParam) {
                const query = urlSearchParam.trim().toLowerCase();
                matchSearch = (p.name && p.name.toLowerCase().includes(query)) ||
                              (p.category && p.category.toLowerCase().includes(query)) ||
                              (p.storage && p.storage.toLowerCase().includes(query)) ||
                              (p.color && p.color.toLowerCase().includes(query));
            }

            // Filtros Avanzados
            let matchModelo = true;
            if (advModelo !== 'Todos') {
                matchModelo = p.name === advModelo;
            }

            let matchStorage = true;
            if (advStorage !== 'Todos') {
                matchStorage = p.storage === advStorage;
            }

            let matchColor = true;
            if (advColor !== 'Todos') {
                matchColor = p.color === advColor;
            }

            let matchBattery = true;
            if (advBattery !== 'Todas') {
                const batVal = parseInt(p.battery) || 0;
                const filterBat = parseInt(advBattery);
                if (filterBat === 100) matchBattery = batVal === 100;
                else matchBattery = batVal >= filterBat;
            }

            let matchSim = true;
            if (advSim !== 'Todas') {
                const notas = p.notas || '';
                if (advSim === 'SIM Física') {
                    matchSim = notas.includes('[SIM: SIM Física]');
                } else if (advSim === 'eSIM') {
                    matchSim = notas.includes('[SIM: eSIM]');
                }
            }

            return matchCat && matchSubcat && matchSearch && matchModelo && matchStorage && matchColor && matchBattery && matchSim;
        });
        
        if (urlSearchParam) {
            if (!searchTitleElement) {
                const catalogHeader = document.querySelector('.catalog-header h2');
                if (catalogHeader) {
                    searchTitleElement = document.createElement('div');
                    searchTitleElement.id = 'search-active-title';
                    searchTitleElement.style.marginTop = '10px';
                    searchTitleElement.style.fontSize = '1.1rem';
                    searchTitleElement.style.color = 'var(--text-gray)';
                    catalogHeader.parentNode.insertBefore(searchTitleElement, catalogHeader.nextSibling);
                }
            }
            if (searchTitleElement) {
                searchTitleElement.innerHTML = `Resultados para "<strong>${urlSearchParam}</strong>" <a href="catalogo.html" style="color:var(--apple-blue); text-decoration:none; margin-left:10px; font-size:0.9rem;">Borrar búsqueda</a>`;
            }
        } else if (searchTitleElement) {
            searchTitleElement.remove();
        }

        if (filteredProducts.length === 0) {
            productGrid.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--text-gray);">No se encontraron productos que coincidan con la búsqueda.</div>';
            return;
        }
        
        filteredProducts.forEach(product => {
            const waText = encodeURIComponent(`Hola, quiero consultar el stock de: ${product.name}`);
            const waLink = `https://wa.me/${phoneNumber}?text=${waText}`;

            const card = document.createElement('div');
            card.className = 'product-card scroll-animate fade-scale';
            card.innerHTML = `
                <div class="product-img-wrapper" onclick="openModal(${product.id})">
                    <img src="${product.image}" alt="${product.name}" class="product-img" loading="lazy">
                    ${product.bestseller ? '<span class="best-seller-tag">MÁS VENDIDO</span>' : ''}
                </div>
                <div class="product-info">
                    <div onclick="openModal(${product.id})" style="cursor: pointer;">
                        <h3>${product.name}</h3>
                        <p style="color:var(--text-gray); font-size:0.9rem;">
                            ${product.subcategory || ''} ${product.variantes && product.variantes.length > 0 ? '| Varias opciones disponibles' : (product.storage ? ' | ' + product.storage : '') + (product.color ? ' | ' + product.color : '')}
                        </p>
                    </div>
                    <a href="${waLink}" target="_blank" class="btn-wa-sm"><span>Consultar por WhatsApp</span></a>
                </div>
            `;
            productGrid.appendChild(card);
        });

        if (window.attachObserver) window.attachObserver();
    }

    window.renderHomeSections = function() {
        const destacadosGrid = document.getElementById('destacados-grid');
        const nuevosGrid = document.getElementById('nuevos-grid');

        if (destacadosGrid) {
            destacadosGrid.innerHTML = '';
            const destacados = products.filter(p => p.bestseller).slice(0, 4);
            if (destacados.length > 0) {
                destacadosGrid.parentElement.style.display = 'block';
                destacados.forEach(product => {
                    destacadosGrid.appendChild(createProductCard(product));
                });
            } else {
                destacadosGrid.parentElement.style.display = 'none';
            }
        }

        if (nuevosGrid) {
            nuevosGrid.innerHTML = '';
            const nuevos = products.filter(p => p.nuevoIngreso).slice(0, 4);
            if (nuevos.length > 0) {
                nuevosGrid.parentElement.style.display = 'block';
                nuevos.forEach(product => {
                    nuevosGrid.appendChild(createProductCard(product));
                });
            } else {
                nuevosGrid.parentElement.style.display = 'none';
            }
        }
        
        if (window.attachObserver) window.attachObserver();
    }

    function createProductCard(product) {
        const waText = encodeURIComponent(`Hola, quiero consultar el stock de: ${product.name}`);
        const waLink = `https://wa.me/${phoneNumber}?text=${waText}`;

        const card = document.createElement('div');
        card.className = 'product-card scroll-animate fade-scale';
        card.innerHTML = `
            <div class="product-img-wrapper" onclick="openModal(${product.id})">
                <img src="${product.image}" alt="${product.name}" class="product-img" loading="lazy">
                ${product.bestseller ? '<span class="best-seller-tag">MÁS VENDIDO</span>' : ''}
            </div>
            <div class="product-info">
                <div onclick="openModal(${product.id})" style="cursor: pointer;">
                    <h3>${product.name}</h3>
                    <p style="color:var(--text-gray); font-size:0.9rem;">
                        ${product.subcategory || ''} ${product.variantes && product.variantes.length > 0 ? '| Varias opciones disponibles' : (product.storage ? ' | ' + product.storage : '') + (product.color ? ' | ' + product.color : '')}
                    </p>
                </div>
                <a href="${waLink}" target="_blank" class="btn-wa-sm"><span>Consultar por WhatsApp</span></a>
            </div>
        `;
        return card;
    }

    // Modal
    const modal = document.getElementById('product-modal');
    if (modal) {
        const modalBody = document.getElementById('modal-body');
        const closeBtn = document.querySelector('.close-btn');

        window.openModal = (productId) => {
            const product = products.find(p => p.id === productId);
            if (!product) return;

            let selectedUnit = null;

            const updateWALink = () => {
                let message = `Hola, quiero consultar por:\n${product.name}`;
                if (selectedUnit) {
                    message += `\n- Almacenamiento: ${selectedUnit.almacenamiento}`;
                    message += `\n- Color: ${selectedUnit.color}`;
                    if (selectedUnit.bateria) message += `\n- Condición de Batería: ${selectedUnit.bateria}%`;
                    if (selectedUnit.notas) message += `\n- Notas: ${selectedUnit.notas}`;
                }
                
                const waText = encodeURIComponent(message);
                const waLink = `https://wa.me/${phoneNumber}?text=${waText}`;
                const waBtn = document.getElementById('modal-wa-btn');
                if (waBtn) waBtn.href = waLink;
            };

            modalBody.innerHTML = `
                <div class="modal-img" id="modal-img-container">
                    <img src="${product.image}" alt="${product.name}" id="modal-main-img">
                    <div class="modal-img-thumbnails" id="modal-thumbnails"></div>
                </div>
                <div class="modal-info">
                    <div class="modal-top-meta">
                        <span class="modal-category-tag">${product.category}</span>
                        ${product.bestseller ? '<span class="badge-premium">��& Más vendido</span>' : ''}
                    </div>
                    <h2>${product.name}</h2>

                    <div class="modal-condition-row">
                        <span class="condition-pill condition-${(product.subcategory || '').toLowerCase().replace(/ /g, '-')}">${product.subcategory || 'Sin especificar'}</span>
                        <span class="modal-payment-text">Efectivo · Transferencia · MercadoPago</span>
                    </div>

                    ${product.precio ? `<div class="modal-price">$${product.precio.toLocaleString('es-AR')}</div>` : ''}

                    <div id="variant-selectors" class="variant-selectors"></div>

                    <div class="modal-trust-row">
                        <div class="trust-item">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                            100% Original Apple
                        </div>
                        <div class="trust-item">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                            Garantía FZCASES
                        </div>
                        <div class="trust-item">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                            Retiro en Tandil / Necochea
                        </div>
                    </div>

                    <a href="" id="modal-wa-btn" target="_blank" class="btn-wa-modal">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
                        Consultar por WhatsApp
                    </a>
                </div>
            `;

            // =========================================================
            // GALLERY: Build thumbnails from product base images
            // =========================================================
            const productGallery = [product.image, product.image2, product.image3].filter(Boolean);

            function setMainImage(src) {
                const mainImg = document.getElementById('modal-main-img');
                if (mainImg) {
                    mainImg.style.opacity = '0';
                    setTimeout(() => {
                        mainImg.src = src;
                        mainImg.style.opacity = '1';
                    }, 150);
                }
            }

            function buildThumbnails(images, activeIndex = 0) {
                const thumbsContainer = document.getElementById('modal-thumbnails');
                if (!thumbsContainer) return;
                if (images.length <= 1) {
                    thumbsContainer.style.display = 'none';
                    return;
                }
                thumbsContainer.style.display = 'flex';
                thumbsContainer.innerHTML = '';
                images.forEach((imgSrc, i) => {
                    const thumb = document.createElement('button');
                    thumb.className = 'modal-thumb' + (i === activeIndex ? ' active' : '');
                    thumb.innerHTML = `<img src="${imgSrc}" alt="foto ${i + 1}">`;
                    thumb.addEventListener('click', () => {
                        thumbsContainer.querySelectorAll('.modal-thumb').forEach(t => t.classList.remove('active'));
                        thumb.classList.add('active');
                        setMainImage(imgSrc);
                    });
                    thumbsContainer.appendChild(thumb);
                });
            }

            // Init gallery with product base images
            buildThumbnails(productGallery, 0);

            // Variant Rendering (Unidades en Stock)
            const variantContainer = document.getElementById('variant-selectors');
            
            let allVariants = [];
            allVariants.push({
                almacenamiento: product.storage,
                color: product.color,
                bateria: product.battery,
                notas: product.notas,
                imagen: null, // Main product uses gallery
                isMain: true
            });

            if (product.variantes && Array.isArray(product.variantes)) {
                allVariants = allVariants.concat(product.variantes);
            }

            if (allVariants.length > 0) {
                const section = document.createElement('div');
                section.className = 'variant-section';
                section.innerHTML = `<label class="variant-label">Seleccioná una unidad</label>`;
                
                const grid = document.createElement('div');
                grid.className = 'pill-selector';
                grid.style.flexDirection = 'column';
                
                allVariants.forEach((unit, index) => {
                    const btn = document.createElement('button');
                    btn.className = 'pill-btn-variant';
                    if (index === 0) btn.classList.add('active');
                    
                    const batteryText = unit.bateria ? `<span class="variant-battery">�x9 ${unit.bateria}%</span>` : '';
                    const storageText = unit.almacenamiento && unit.almacenamiento !== '-' ? unit.almacenamiento : '';
                    const colorText = unit.color || '';
                    const measureText = unit.medida && unit.medida !== '-' ? unit.medida : '';
                    
                    const parts = [measureText, storageText, colorText].filter(Boolean);
                    const mainLabel = parts.join(' · ');
                    
                    btn.innerHTML = `
                        <div class="variant-btn-content">
                            <div class="variant-btn-main">${mainLabel}</div>
                            ${unit.notas ? `<div class="variant-btn-note">${unit.notas}</div>` : ''}
                        </div>
                        <div class="variant-btn-right">
                            ${batteryText}
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                        </div>
                    `;
                    
                    btn.addEventListener('click', () => {
                        grid.querySelectorAll('.pill-btn-variant').forEach(b => b.classList.remove('active'));
                        btn.classList.add('active');
                        selectedUnit = unit;
                        
                        // Image logic: variant image overrides; otherwise restore product gallery
                        if (unit.imagen && !unit.isMain) {
                            // Variant has its own image � show it alone
                            setMainImage(unit.imagen);
                            buildThumbnails([unit.imagen], 0);
                        } else {
                            // No variant image � show product gallery
                            setMainImage(productGallery[0]);
                            buildThumbnails(productGallery, 0);
                        }
                        
                        updateWALink();
                    });
                    grid.appendChild(btn);
                });
                
                // Auto-select first
                if (allVariants.length > 0) {
                    selectedUnit = allVariants[0];
                    updateWALink();
                }
                
                section.appendChild(grid);
                variantContainer.appendChild(section);
            }

            updateWALink();
            modal.style.display = 'flex';
            setTimeout(() => { modal.classList.add('show'); }, 10);
        };

        function closeModalFunc() {
            modal.classList.remove('show');
            setTimeout(() => modal.style.display = 'none', 300);
        }

        closeBtn.addEventListener('click', closeModalFunc);

        window.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModalFunc();
            }
        });
    }

    // Lightbox Modal para Galería en Nosotros
    const galleryItems = document.querySelectorAll('.gallery-item img');
    if (galleryItems.length > 0) {
        // Crear dinámicamente el modal en el DOM
        const lightbox = document.createElement('div');
        lightbox.className = 'lightbox-modal';
        lightbox.innerHTML = `
            <span class="lightbox-close">&times;</span>
            <img class="lightbox-img" src="" alt="Vista ampliada">
        `;
        document.body.appendChild(lightbox);

        const lbImage = lightbox.querySelector('.lightbox-img');
        const lbClose = lightbox.querySelector('.lightbox-close');

        galleryItems.forEach(img => {
            img.addEventListener('click', () => {
                lbImage.src = img.src;
                lightbox.classList.add('show');
            });
        });

        lbClose.addEventListener('click', () => lightbox.classList.remove('show'));
        lightbox.addEventListener('click', (e) => {
            if (e.target === lightbox) lightbox.classList.remove('show');
        });
    }

    // Scroll Animations Observer
    const observerOptions = {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px"
    };

    const scrollObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    window.attachObserver = () => {
        const animatables = document.querySelectorAll('.scroll-animate:not(.animate-in)');
        animatables.forEach(el => scrollObserver.observe(el));
    };

    // Pausa la animación aurora (filter:blur pesado en GPU) cuando la sección
    // no está en pantalla, en vez de sacarla. Evita que corra infinito de fondo
    // en toda la página, que era el mayor costo de perf en desktop.
    const featuredShowcase = document.querySelector('.featured-showcase');
    if (featuredShowcase) {
        const auroraObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                entry.target.classList.toggle('in-view', entry.isIntersecting);
            });
        }, { threshold: 0 });
        auroraObserver.observe(featuredShowcase);
    }

    // =========================================================================
    // COMO FUNCIONA - ANIMATIONS
    // =========================================================================
    const stepCards = document.querySelectorAll('.step-card');
    if (stepCards.length > 0) {
        const stepsObserverOptions = {
            threshold: 0.2,
            rootMargin: '0px 0px -100px 0px'
        };

        const stepsObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry, index) => {
                if (entry.isIntersecting) {
                    setTimeout(() => {
                        entry.target.classList.add('animate-in');
                    }, index * 200); // Delay progresivo
                    stepsObserver.unobserve(entry.target);
                }
            });
        }, stepsObserverOptions);

        stepCards.forEach(card => {
            card.classList.add('step-hidden');
            stepsObserver.observe(card);
        });
    }

    // =========================================================================
    // WIZARD PLAN CANJE
    // =========================================================================
    const wizardContainer = document.getElementById('plan-canje');
    if (wizardContainer) {
        
        // --- CTA Interaction ---
        const btnAbrirFormulario = document.getElementById('btn-abrir-formulario');
        const canjeCta = document.getElementById('canje-cta');
        const canjeFormulario = document.getElementById('canje-formulario');
        
        if (btnAbrirFormulario && canjeCta && canjeFormulario) {
            btnAbrirFormulario.addEventListener('click', () => {
                // Ocultar CTA
                canjeCta.style.display = 'none';
                
                // Mostrar formulario
                canjeFormulario.style.display = 'block';
                
                // Opcional: trigger animations de los elementos internos
                window.attachObserver();
                
                // Scroll suave al formulario
                canjeFormulario.scrollIntoView({ behavior: 'smooth', block: 'start' });
            });

            const btnVolverCta = document.getElementById('btn-volver-cta');
            if (btnVolverCta) {
                btnVolverCta.addEventListener('click', () => {
                    canjeFormulario.style.display = 'none';
                    canjeCta.style.display = 'block';
                    canjeCta.scrollIntoView({ behavior: 'smooth', block: 'start' });
                });
            }
        }
        
        // --- Wizard Logic ---
        let currentStep = 1;
        const totalSteps = 6;
        let canjeData = {
            modelo: '',
            capacidad: '',
            color: '',
            estado: '',
            detalles: '',
            todoFunciona: false,
            fallas: [],
            reparaciones: '',
            bateria: '',
            ciclos: '',
            cable: false,
            caja: false,
            garantia: false,
            sim: '',
            antiguedad: '',
            origen: ''
        };

        // Try load from local storage
        try {
            const savedData = localStorage.getItem('fzcases_canje_data');
            if (savedData) {
                const parsed = JSON.parse(savedData);
                if (parsed.modelo) canjeData = { ...canjeData, ...parsed };
            }
        } catch(e) {}

        const btnPrev = document.getElementById('btn-prev');
        const btnNext = document.getElementById('btn-next');
        const progressBar = document.getElementById('progress-bar');
        const circles = document.querySelectorAll('.step-circle');
        const stepsBoxes = document.querySelectorAll('.wizard-step');
        
        // Elementos Paso 1
        const pillBtns = document.querySelectorAll('.pill-btn:not(.pill-cap)');
        const pillCaps = document.querySelectorAll('.pill-cap');
        const btnOtro = document.getElementById('btn-otro-modelo');
        const otherContainer = document.getElementById('other-model-container');
        const otherInput = document.getElementById('input-other-model');
        const inputColor = document.getElementById('input-color');

        // Elementos Paso 2
        const stateCards = document.querySelectorAll('.state-card');
        const inputDetalles = document.getElementById('input-detalles');

        // Elementos Paso 3
        const checkTodoFunciona = document.getElementById('check-todo-funciona');
        const funcChecks = document.querySelectorAll('input[name="no-funciona"]');
        const inputReparaciones = document.getElementById('input-reparaciones');

        // Elementos Paso 4
        const batteryInput = document.getElementById('battery-health');
        const boxCiclos = document.getElementById('box-ciclos');
        const inputCiclos = document.getElementById('input-ciclos');

        // Elementos Paso 5
        const checkCable = document.getElementById('check-cable');
        const checkCaja = document.getElementById('check-caja');
        const checkGarantia = document.getElementById('check-garantia');
        const selectSim = document.getElementById('select-sim');
        const inputAntiguedad = document.getElementById('input-antiguedad');
        const inputOrigen = document.getElementById('input-origen');

        // Restore UI state from cached data
        function restoreCachedData() {
            // Step 1
            if (canjeData.modelo) {
                let foundPill = Array.from(pillBtns).find(btn => btn.dataset.value === canjeData.modelo);
                if (foundPill) {
                    foundPill.classList.add('selected');
                } else {
                    btnOtro.classList.add('selected');
                    otherContainer.classList.add('active');
                    otherInput.value = canjeData.modelo;
                }
            }
            if (canjeData.capacidad) {
                let foundCap = Array.from(pillCaps).find(btn => btn.dataset.value === canjeData.capacidad);
                if (foundCap) foundCap.classList.add('selected');
            }
            if (canjeData.color) inputColor.value = canjeData.color;

            // Step 2
            if (canjeData.estado) {
                let foundCard = Array.from(stateCards).find(card => card.dataset.value === canjeData.estado);
                if (foundCard) foundCard.classList.add('selected');
            }
            if (canjeData.detalles) inputDetalles.value = canjeData.detalles;

            // Step 3
            if (canjeData.todoFunciona) checkTodoFunciona.checked = true;
            if (canjeData.fallas && canjeData.fallas.length > 0) {
                funcChecks.forEach(chk => {
                    if (canjeData.fallas.includes(chk.value)) chk.checked = true;
                });
            }
            if (canjeData.reparaciones) inputReparaciones.value = canjeData.reparaciones;

            // Step 4
            if (canjeData.bateria) batteryInput.value = canjeData.bateria;
            if (canjeData.ciclos) inputCiclos.value = canjeData.ciclos;

            // Step 5
            checkCable.checked = canjeData.cable;
            checkCaja.checked = canjeData.caja;
            checkGarantia.checked = canjeData.garantia;
            if (canjeData.sim) selectSim.value = canjeData.sim;
            if (canjeData.antiguedad) inputAntiguedad.value = canjeData.antiguedad;
            if (canjeData.origen) inputOrigen.value = canjeData.origen;
        }

        function saveData() {
            localStorage.setItem('fzcases_canje_data', JSON.stringify(canjeData));
        }

        // Logic UI Step 1
        pillBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                pillBtns.forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                
                if (btn.id === 'btn-otro-modelo') {
                    otherContainer.classList.add('active');
                    canjeData.modelo = otherInput.value.trim();
                } else {
                    otherContainer.classList.remove('active');
                    otherInput.value = '';
                    canjeData.modelo = btn.dataset.value;
                }
                saveData();
                validateCurrentStep();
            });
        });

        pillCaps.forEach(btn => {
            btn.addEventListener('click', () => {
                pillCaps.forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                canjeData.capacidad = btn.dataset.value;
                saveData();
                validateCurrentStep();
            });
        });

        const inputHandlers = [otherInput, inputColor, inputDetalles, inputReparaciones, batteryInput, inputCiclos, selectSim, inputAntiguedad, inputOrigen];
        inputHandlers.forEach(input => {
            if (!input) return;
            input.addEventListener('input', () => {
                if (input === otherInput && btnOtro.classList.contains('selected')) canjeData.modelo = input.value.trim();
                if (input === inputColor) canjeData.color = input.value.trim();
                if (input === inputDetalles) canjeData.detalles = input.value.trim();
                if (input === inputReparaciones) canjeData.reparaciones = input.value.trim();
                if (input === batteryInput) canjeData.bateria = input.value.trim();
                if (input === inputCiclos) canjeData.ciclos = input.value.trim();
                if (input === selectSim) canjeData.sim = input.value;
                if (input === inputAntiguedad) canjeData.antiguedad = input.value.trim();
                if (input === inputOrigen) canjeData.origen = input.value.trim();
                
                saveData();
                validateCurrentStep();
            });
        });

        // Logic UI Step 2
        stateCards.forEach(card => {
            card.addEventListener('click', () => {
                stateCards.forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                canjeData.estado = card.dataset.value;
                saveData();
                validateCurrentStep();
            });
        });

        // Logic UI Step 3
        checkTodoFunciona.addEventListener('change', () => {
            if (checkTodoFunciona.checked) {
                funcChecks.forEach(c => c.checked = false);
                canjeData.fallas = [];
            }
            canjeData.todoFunciona = checkTodoFunciona.checked;
            saveData();
            validateCurrentStep();
        });

        funcChecks.forEach(chk => {
            chk.addEventListener('change', () => {
                if (chk.checked) {
                    checkTodoFunciona.checked = false;
                    canjeData.todoFunciona = false;
                }
                canjeData.fallas = Array.from(funcChecks).filter(c => c.checked).map(c => c.value);
                saveData();
                validateCurrentStep();
            });
        });

        // Logic UI Step 5
        [checkCable, checkCaja, checkGarantia].forEach(chk => {
            chk.addEventListener('change', () => {
                canjeData.cable = checkCable.checked;
                canjeData.caja = checkCaja.checked;
                canjeData.garantia = checkGarantia.checked;
                saveData();
                validateCurrentStep();
            });
        });

        function validateCurrentStep() {
            let isValid = false;
            
            if (currentStep === 1) {
                const selectedModel = document.querySelector('.pill-btn.selected:not(.pill-cap)');
                const selectedCap = document.querySelector('.pill-cap.selected');
                const hasModel = selectedModel && (selectedModel.id !== 'btn-otro-modelo' || otherInput.value.trim().length > 2);
                const hasCap = selectedCap !== null;
                // Color is now optional for better fluidity
                isValid = hasModel && hasCap;
            } 
            else if (currentStep === 2) {
                const hasState = document.querySelector('.state-card.selected') !== null;
                // Detalles is now optional
                isValid = hasState;
            } 
            else if (currentStep === 3) {
                const hasChecks = canjeData.todoFunciona || canjeData.fallas.length > 0;
                // Reparaciones is optional
                isValid = hasChecks;
            } 
            else if (currentStep === 4) {
                const batteryVal = parseInt(canjeData.bateria);
                let validBattery = !isNaN(batteryVal) && batteryVal >= 85 && batteryVal <= 100;
                
                let requiresCiclos = canjeData.modelo.toLowerCase().includes('15') || canjeData.modelo.toLowerCase().includes('16');
                if (requiresCiclos) {
                    boxCiclos.style.display = 'block';
                    isValid = validBattery && canjeData.ciclos.trim().length > 0;
                } else {
                    boxCiclos.style.display = 'none';
                    isValid = validBattery;
                }
            }
            else if (currentStep === 5) {
                // Text inputs are optional, but Caja, Cable, and Origen are strictly required
                const hasOrigen = canjeData.origen.trim().length > 1;
                isValid = canjeData.cable && canjeData.caja && hasOrigen;
            }
            else if (currentStep === 6) {
                isValid = true;
            }

            btnNext.disabled = !isValid;
        }

        function updateUI() {
            // Steps UI visibility
            stepsBoxes.forEach(box => {
                if(parseInt(box.id.split('-')[1]) === currentStep) {
                    box.classList.add('active');
                } else {
                    box.classList.remove('active');
                }
            });

            // Progress Bar Visuals
            const progressRatio = ((currentStep - 1) / (totalSteps - 1)) * 100;
            progressBar.style.width = progressRatio + '%';

            circles.forEach((circle, idx) => {
                const stepIdx = idx + 1;
                circle.classList.remove('active', 'completed');
                if (stepIdx === currentStep) {
                    circle.classList.add('active');
                } else if (stepIdx < currentStep) {
                    circle.classList.add('completed');
                }
            });

            // Navigation Buttons
            btnPrev.style.visibility = currentStep === 1 ? 'hidden' : 'visible';
            btnNext.style.display = currentStep === totalSteps ? 'none' : 'block';

            if (currentStep === totalSteps) {
                renderSummary();
            }

            // Check if we need to show cycles based on model selected before step 4
            if (currentStep === 4) {
                let requiresCiclos = canjeData.modelo.toLowerCase().includes('15') || canjeData.modelo.toLowerCase().includes('16');
                boxCiclos.style.display = requiresCiclos ? 'block' : 'none';
            }

            validateCurrentStep();
        }

        function renderSummary() {
            const summaryBox = document.getElementById('summary-card');
            
            summaryBox.innerHTML = `
                <p>�x� <b>Modelo:</b> ${canjeData.modelo} - ${canjeData.capacidad} - ${canjeData.color}</p>
                <p>⭐ <b>Estado:</b> ${canjeData.estado}</p>
                <p>�x9 <b>Batería:</b> ${canjeData.bateria}% ${canjeData.ciclos ? `(${canjeData.ciclos} ciclos)` : ''}</p>
                <p>�S& <b>Funcionalidad:</b> ${canjeData.todoFunciona ? 'Funciona todo correctamente' : canjeData.fallas.join(', ')}</p>
                <p>�x� <b>Accesorios:</b> ${canjeData.caja ? 'Caja' : ''} ${canjeData.cable ? '- Cable' : ''}</p>
            `;
        }

        btnNext.addEventListener('click', () => {
            if (currentStep < totalSteps) {
                currentStep++;
                updateUI();
                wizardContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });

        btnPrev.addEventListener('click', () => {
            if (currentStep > 1) {
                currentStep--;
                updateUI();
                wizardContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });

        document.getElementById('btn-edit-answers').addEventListener('click', () => {
            currentStep = 1;
            updateUI();
            wizardContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });

        document.getElementById('btn-submit-wa').addEventListener('click', () => {
            const f = canjeData;
            
            const txtFallas = f.todoFunciona ? 'Funciona todo correctamente' : f.fallas.join(', ');
            const txtCaja = f.caja ? 'Sí' : 'No';
            const txtCable = f.cable ? 'Sí' : 'No';
            const txtGarantia = f.garantia ? 'Sí' : 'No';
            const txtCiclos = f.ciclos ? `%0A- *Ciclos:* ${f.ciclos}` : '';

            const message = `*PLAN CANJE - Nueva Consulta*%0A%0A` +
                `*Modelo:* ${f.modelo}%0A` +
                `*Capacidad:* ${f.capacidad}%0A` +
                `*Color:* ${f.color}%0A` +
                `*Cable original:* ${txtCable}%0A` +
                `*Caja:* ${txtCaja}%0A` +
                `*Detalles esteticos:* ${f.detalles}%0A` +
                `*Algo no funciona?* ${txtFallas}%0A` +
                `*Reparaciones:* ${f.reparaciones}%0A` +
                `*Antiguedad:* ${f.antiguedad}%0A` +
                `*Bateria:* ${f.bateria}%25${txtCiclos}%0A` +
                `*Garantia:* ${txtGarantia}%0A` +
                `*Sellado/Usado:* ${f.origen}%0A` +
                `*Chip o eSIM:* ${f.sim}%0A%0A` +
                `_Solicito tasacion para plan canje_`;
            
            // WA Default test number
            const waNumber = '1123456789'; // Esto se deberá cambiar por global_W_NUMBER si existiera
            const waURL = `https://wa.me/549${waNumber}?text=${message}`;
            
            window.open(waURL, '_blank');
            localStorage.removeItem('fzcases_canje_data'); // clean up after success!
        });

        // Initialize Wizard
        restoreCachedData();
        updateUI();
    }

    // FAQ Accordion Logic
    const faqHeaders = document.querySelectorAll('.accordion-header');
    
    faqHeaders.forEach(header => {
        header.addEventListener('click', () => {
            const accordionItem = header.parentElement;
            const accordionContent = header.nextElementSibling;
            
            // Check if curr is already active
            const isActive = accordionItem.classList.contains('active');
            
            // Close all first (Singleton pattern)
            document.querySelectorAll('.accordion-item').forEach(item => {
                item.classList.remove('active');
                item.querySelector('.accordion-header').setAttribute('aria-expanded', 'false');
                item.querySelector('.accordion-content').style.maxHeight = null;
                item.querySelector('.accordion-content').style.opacity = '0';
            });
            
            if (!isActive) {
                accordionItem.classList.add('active');
                header.setAttribute('aria-expanded', 'true');
                accordionContent.style.maxHeight = accordionContent.scrollHeight + "px";
                accordionContent.style.opacity = '1';
            }
        });
    });
    // =========================================================================
    // CARRUSEL TESTIMONIOS
    // =========================================================================
    const track = document.querySelector('.testimonials-track');
    const testimoniosCards = document.querySelectorAll('.testimonial-card');
    const prevBtn = document.querySelector('.carousel-btn.prev');
    const nextBtn = document.querySelector('.carousel-btn.next');
    const dotsContainer = document.querySelector('.carousel-dots');

    if (track && testimoniosCards.length > 0) {
        let currentIndex = 0;
        const cardWidth = testimoniosCards[0].offsetWidth + 32; // width + gap
        // Usar Math.max para evitar divisiones por 0 o NaN
        const trackWidth = track.offsetWidth || 1;
        const visibleCards = Math.max(1, Math.floor(trackWidth / cardWidth));

        // Crear dots
        testimoniosCards.forEach((_, index) => {
            const dot = document.createElement('div');
            dot.classList.add('dot');
            if (index === 0) dot.classList.add('active');
            dot.addEventListener('click', () => goToSlide(index));
            dotsContainer.appendChild(dot);
        });

        const dots = document.querySelectorAll('.dot');

        function goToSlide(index) {
            currentIndex = index;
            track.scrollTo({
                left: cardWidth * index,
                behavior: 'smooth'
            });
            updateDots();
        }

        function updateDots() {
            dots.forEach((dot, index) => {
                dot.classList.toggle('active', index === currentIndex);
            });
        }

        prevBtn.addEventListener('click', () => {
            if (currentIndex > 0) {
                goToSlide(currentIndex - 1);
            } else {
                // Loop to end
                goToSlide(testimoniosCards.length - 1);
            }
        });

        nextBtn.addEventListener('click', () => {
            if (currentIndex < testimoniosCards.length - visibleCards) {
                goToSlide(currentIndex + 1);
            } else {
                goToSlide(0); // Loop al inicio
            }
        });

        // Auto-play
        let autoplayInterval;

        function startAutoplay() {
            autoplayInterval = setInterval(() => {
                if (currentIndex < testimoniosCards.length - visibleCards) {
                    goToSlide(currentIndex + 1);
                } else {
                    goToSlide(0); // volver al inicio
                }
            }, 5000); // 5s
        }

        function stopAutoplay() {
            clearInterval(autoplayInterval);
        }

        startAutoplay();
        track.addEventListener('mouseenter', stopAutoplay);
        track.addEventListener('mouseleave', startAutoplay);

        // Swipe en mobile
        let startX = 0;
        let scrollLeft = 0;

        track.addEventListener('touchstart', (e) => {
            startX = e.touches[0].pageX;
            scrollLeft = track.scrollLeft;
            stopAutoplay();
        }, { passive: true });

        track.addEventListener('touchmove', (e) => {
            const x = e.touches[0].pageX;
            const walk = (startX - x) * 2;
            track.scrollLeft = scrollLeft + walk;
        }, { passive: true });
        
        track.addEventListener('touchend', () => {
            startAutoplay();
        }, { passive: true });
    }

    // Iniciar render globales
    if (window.initAdvancedFilters) window.initAdvancedFilters();
    if (window.renderFilters) window.renderFilters();
    if (window.renderCatalog) window.renderCatalog();
    if (window.attachObserver) window.attachObserver();

    // === CARGAR DATOS FINALES SUPABASE ===
    loadProductsFromSupabase();
});

// �"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"�
// CARRUSEL HERO - Motor de animación
// �"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"��"�
window._heroInitCarousel = function(count) {
    if (count < 1) return;

    const slides = document.querySelectorAll('.hero-slide');
    const dotsContainer = document.getElementById('hero-dots');
    const btnPrev = document.getElementById('hero-prev');
    const btnNext = document.getElementById('hero-next');
    let current = 0;
    let autoplayTimer = null;

    // Build dots
    if (dotsContainer) {
        dotsContainer.innerHTML = '';
        slides.forEach((_, i) => {
            const dot = document.createElement('button');
            dot.className = 'hero-dot' + (i === 0 ? ' active' : '');
            dot.setAttribute('aria-label', `Ir a portada ${i + 1}`);
            dot.onclick = () => goTo(i);
            dotsContainer.appendChild(dot);
        });
    }

    function goTo(idx) {
        slides[current].classList.remove('active');
        dotsContainer && dotsContainer.querySelectorAll('.hero-dot')[current] && dotsContainer.querySelectorAll('.hero-dot')[current].classList.remove('active');
        current = (idx + slides.length) % slides.length;
        slides[current].classList.add('active');
        dotsContainer && dotsContainer.querySelectorAll('.hero-dot')[current] && dotsContainer.querySelectorAll('.hero-dot')[current].classList.add('active');
    }

    function startAutoplay() {
        clearInterval(autoplayTimer);
        if (slides.length > 1) {
            autoplayTimer = setInterval(() => goTo(current + 1), 5000);
        }
    }

    // Show arrows and dots only if multiple slides
    if (slides.length > 1) {
        if (btnPrev) btnPrev.style.display = 'flex';
        if (btnNext) btnNext.style.display = 'flex';
        if (dotsContainer) dotsContainer.style.display = 'flex';
        if (btnPrev) btnPrev.onclick = () => { goTo(current - 1); startAutoplay(); };
        if (btnNext) btnNext.onclick = () => { goTo(current + 1); startAutoplay(); };
        startAutoplay();
    }
};

