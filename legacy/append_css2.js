const fs = require('fs');

const css = `
/* Agrandar textos del acordeon */
.sidebar-accordion-header, .nested-accordion-header {
    font-size: 1.05rem !important;
    padding-top: 1rem !important;
    padding-bottom: 1rem !important;
}
.sub-link {
    font-size: 1.05rem !important;
    padding-top: 0.8rem !important;
    padding-bottom: 0.8rem !important;
}
.sub-link-2 {
    font-size: 1rem !important;
    padding-top: 0.8rem !important;
    padding-bottom: 0.8rem !important;
}
`;

fs.appendFileSync('styles.css', css, 'utf8');
console.log('CSS Appended');
