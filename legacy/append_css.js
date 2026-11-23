const fs = require('fs');

const css = `
/* Accordion Sidebar Styles */
.sidebar-accordion-header, .nested-accordion-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.85rem 1.5rem;
    font-size: 1rem;
    font-weight: 500;
    color: #1d1d1f;
    background: none;
    border: none;
    width: calc(100% - 1rem);
    margin: 0 0.5rem;
    border-radius: 10px;
    cursor: pointer;
    transition: background 0.2s, color 0.2s;
}

.nested-accordion-header {
    padding: 0.6rem 1.5rem 0.6rem 3rem;
    font-size: 0.95rem;
    color: #48484a;
}

.sidebar-accordion-header:hover, .nested-accordion-header:hover {
    background: #f2f2f7;
}

.chevron {
    transition: transform 0.3s ease;
    color: #8e8e93;
}

.sidebar-accordion-header[aria-expanded="true"] .chevron,
.nested-accordion-header[aria-expanded="true"] .chevron {
    transform: rotate(180deg);
}

.sidebar-accordion-content {
    display: none;
    flex-direction: column;
    padding-bottom: 0.5rem;
}

.nested-accordion-content {
    display: none;
    flex-direction: column;
    background: #fafafc;
    border-radius: 8px;
    margin: 0 1rem;
    overflow: hidden;
}

.sidebar-accordion-content.open, .nested-accordion-content.open {
    display: flex;
}

.sub-link {
    padding: 0.6rem 1.5rem 0.6rem 3rem !important;
    font-size: 0.95rem !important;
    color: #48484a !important;
    font-weight: 400 !important;
}

.sub-link:hover {
    color: #2997ff !important;
}

.sub-link-2 {
    padding: 0.6rem 1.5rem 0.6rem 2.5rem !important;
    font-size: 0.9rem !important;
    color: #6e6e73 !important;
    font-weight: 400 !important;
    margin: 0 !important;
    border-radius: 0 !important;
}

.sub-link-2:hover {
    background: #f0f4ff !important;
    color: #2997ff !important;
}
`;

fs.appendFileSync('styles.css', css, 'utf8');
console.log('CSS Appended');
