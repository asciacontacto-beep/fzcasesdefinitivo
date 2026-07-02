const fs = require('fs');
const path = require('path');

const files = ['index.html', 'catalogo.html', 'nosotros.html', 'info-importante.html', 'garantia.html'];

const newSidebar = `        <nav class="cat-sidebar-nav">
            <!-- Navegación principal -->
            <div class="cat-sidebar-label">Navegación</div>
            <a href="index.html" id="nav-inicio">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
                Inicio
            </a>
            
            <!-- Acordeón Catálogo -->
            <div class="sidebar-accordion">
                <button class="sidebar-accordion-header" aria-expanded="false">
                    <div style="display:flex; align-items:center; gap:0.75rem;">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
                        Catálogo
                    </div>
                    <svg class="chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
                </button>
                <div class="sidebar-accordion-content">
                    <a href="catalogo.html?cat=Todos" class="sub-link">Ver Todos</a>
                    
                    <div class="nested-accordion">
                        <button class="nested-accordion-header" aria-expanded="false">iPhone <svg class="chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg></button>
                        <div class="nested-accordion-content">
                            <a href="catalogo.html?cat=iPhone&subcat=Nuevo" class="sub-link-2">Nuevos / Sellados</a>
                            <a href="catalogo.html?cat=iPhone&subcat=Usado" class="sub-link-2">Usados</a>
                        </div>
                    </div>
                    <div class="nested-accordion">
                        <button class="nested-accordion-header" aria-expanded="false">Samsung <svg class="chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg></button>
                        <div class="nested-accordion-content">
                            <a href="catalogo.html?cat=Samsung&subcat=Nuevo" class="sub-link-2">Nuevos / Sellados</a>
                            <a href="catalogo.html?cat=Samsung&subcat=Usado" class="sub-link-2">Usados</a>
                        </div>
                    </div>
                    <div class="nested-accordion">
                        <button class="nested-accordion-header" aria-expanded="false">MacBook <svg class="chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg></button>
                        <div class="nested-accordion-content">
                            <a href="catalogo.html?cat=MacBook&subcat=Nuevo" class="sub-link-2">Nuevas / Selladas</a>
                            <a href="catalogo.html?cat=MacBook&subcat=Usado" class="sub-link-2">Usadas</a>
                        </div>
                    </div>
                    <div class="nested-accordion">
                        <button class="nested-accordion-header" aria-expanded="false">iPad <svg class="chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg></button>
                        <div class="nested-accordion-content">
                            <a href="catalogo.html?cat=iPad&subcat=Nuevo" class="sub-link-2">Nuevos / Sellados</a>
                            <a href="catalogo.html?cat=iPad&subcat=Usado" class="sub-link-2">Usados</a>
                        </div>
                    </div>
                    <div class="nested-accordion">
                        <button class="nested-accordion-header" aria-expanded="false">Apple Watch <svg class="chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg></button>
                        <div class="nested-accordion-content">
                            <a href="catalogo.html?cat=Apple%20Watch&subcat=Nuevo" class="sub-link-2">Nuevos / Sellados</a>
                            <a href="catalogo.html?cat=Apple%20Watch&subcat=Usado" class="sub-link-2">Usados</a>
                        </div>
                    </div>
                    <div class="nested-accordion">
                        <button class="nested-accordion-header" aria-expanded="false">Accesorios <svg class="chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg></button>
                        <div class="nested-accordion-content">
                            <a href="catalogo.html?cat=Accesorios&subcat=Nuevo" class="sub-link-2">Nuevos / Sellados</a>
                            <a href="catalogo.html?cat=Accesorios&subcat=Usado" class="sub-link-2">Usados</a>
                        </div>
                    </div>
                </div>
            </div>

            <a href="index.html#plan-canje" id="nav-canje">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="17 1 21 5 17 9"></polyline><path d="M3 11V9a4 4 0 0 1 4-4h14"></path><polyline points="7 23 3 19 7 15"></polyline><path d="M21 13v2a4 4 0 0 1-4 4H3"></path></svg>
                Plan Canje
            </a>
            <a href="nosotros.html" id="nav-nosotros">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                Nosotros
            </a>
            <a href="info-importante.html" id="nav-info">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                Info Importante
            </a>
        </nav>`;

files.forEach(f => {
    const filePath = path.join(__dirname, f);
    if(fs.existsSync(filePath)) {
        let content = fs.readFileSync(filePath, 'utf8');
        const pattern = /<nav class="cat-sidebar-nav">[\s\S]*?<\/nav>/;
        content = content.replace(pattern, newSidebar);
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Updated ' + f);
    }
});
