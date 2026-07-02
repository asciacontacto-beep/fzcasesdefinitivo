const fs = require('fs');
const path = require('path');

const newFooter = `    <!-- Footer Unificado -->
    <footer class="mega-footer">
        <div class="container">
            <div class="footer-grid">
                <!-- Columna 1: Logo y Redes -->
                <div class="footer-brand">
                    <img src="assets/logo.png" alt="FZCASES Logo" class="footer-logo">
                    <p class="footer-desc">Especialistas en la venta de equipos Apple premium, ofreciendo la mejor calidad y servicio para vos.</p>
                    <div class="social-links">
                        <a href="https://instagram.com/fzcases" target="_blank" aria-label="Instagram">
                            <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                        </a>
                        <a href="https://facebook.com/fzcases" target="_blank" aria-label="Facebook">
                            <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"/></svg>
                        </a>
                        <a href="https://tiktok.com/@fzcases" target="_blank" aria-label="TikTok">
                            <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93v7.2c0 1.96-.65 3.97-1.93 5.37-1.28 1.42-3.14 2.29-5.12 2.45-1.98.15-4-.08-5.74-1.13-1.74-1.05-3-2.66-3.56-4.59-.57-1.92-.37-4.04.54-5.8 1.17-2.28 3.52-3.84 6.04-4.14 1.16-.14 2.34-.11 3.48.09v4.06c-1.32-.35-2.77-.18-3.95.43-1.07.56-1.87 1.56-2.18 2.73-.31 1.17-.12 2.44.51 3.47.62 1.03 1.63 1.73 2.82 1.95 1.18.21 2.42.02 3.44-.55 1.03-.57 1.81-1.49 2.15-2.63.15-.5.21-1.02.21-1.54v-15.4z"/></svg>
                        </a>
                    </div>
                </div>

                <!-- Columna 2: Navegación -->
                <div class="footer-links">
                    <h4>Navegación</h4>
                    <ul>
                        <li><a href="index.html">Inicio</a></li>
                        <li><a href="catalogo.html">Catálogo</a></li>
                        <li><a href="nosotros.html">Nosotros</a></li>
                        <li><a href="garantia.html">Garantía</a></li>
                        <li><a href="info-importante.html">Info Importante</a></li>
                    </ul>
                </div>

                <!-- Columna 3: Contacto -->
                <div class="footer-links">
                    <h4>Contacto</h4>
                    <ul class="contact-list">
                        <li>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="contact-icon wa-icon"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                            <div>
                                <strong>WhatsApp:</strong>
                                <br><a href="https://wa.me/5491100000000" target="_blank" class="contact-link">+54 9 11 0000-0000</a>
                            </div>
                        </li>
                        <li>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="contact-icon email-icon"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                            <div>
                                <strong>Email:</strong>
                                <br><a href="mailto:info@fzcases.com" class="contact-link">info@fzcases.com</a>
                            </div>
                        </li>
                        <li>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="contact-icon time-icon"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                            <div>
                                <strong>Horarios:</strong>
                                <br><span class="contact-text">Lun a Vie: 9 a 18hs</span>
                                <br><span class="contact-text">Sábados: 10 a 14hs</span>
                            </div>
                        </li>
                        <li>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="contact-icon pin-icon"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                            <div>
                                <strong>Ubicación:</strong>
                                <br><span class="contact-text">Necochea y Tandil</span>
                            </div>
                        </li>
                    </ul>
                </div>
            </div>
            <div class="footer-bottom">
                <p>&copy; 2026 FZCASES. Todos los derechos reservados.</p>
            </div>
        </div>
    </footer>`;

const files = ['index.html', 'catalogo.html', 'nosotros.html', 'garantia.html', 'info-importante.html'];

for (const file of files) {
    let content = fs.readFileSync(file, 'utf8');
    // Find the start of the footer
    const startIndex = content.indexOf('<footer class="mega-footer">');
    if (startIndex !== -1) {
        // Find the end of the footer
        const endIndex = content.indexOf('</footer>', startIndex) + '</footer>'.length;
        if (endIndex > '</footer>'.length) {
            content = content.substring(0, startIndex) + newFooter + content.substring(endIndex);
            fs.writeFileSync(file, content, 'utf8');
            console.log('Updated ' + file);
        }
    } else {
        console.log('Footer not found in ' + file);
    }
}
