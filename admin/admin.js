document.addEventListener('DOMContentLoaded', () => {

    // ==============================================================================
    // 1. NAVEGACIÓN (Prioridad Máxima)
    // ==============================================================================
    window.switchTab = function (targetId, TitleName) {
        const panels = document.querySelectorAll('.tab-content');
        const navItems = document.querySelectorAll('.nav-item');
        const mainTitle = document.getElementById('main-title');

        panels.forEach(p => { p.style.display = 'none'; p.classList.remove('active'); });
        navItems.forEach(n => n.classList.remove('active'));

        const targetPanel = document.getElementById(targetId);
        if (targetPanel) {
            targetPanel.style.display = 'block';
            targetPanel.classList.add('active');
        }

        document.querySelectorAll(`.nav-item[data-target="${targetId}"]`).forEach(el => el.classList.add('active'));
        if (mainTitle && TitleName) mainTitle.textContent = TitleName;

        const sidebar = document.getElementById('admin-sidebar');
        if (sidebar) sidebar.classList.remove('open');
        const overlay = document.getElementById('sidebar-overlay');
        if (overlay) overlay.classList.remove('show');
    };

    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const navText = item.querySelector('.nav-text');
            window.switchTab(item.dataset.target, navText ? navText.textContent : 'Panel');
        });
    });

    // Accesos directos desde las tarjetas KPI
    const kpiProducts = document.querySelector('.icon-products');
    if (kpiProducts) kpiProducts.closest('.kpi-card').onclick = () => window.switchTab('view-productos', 'Productos');
    const kpiSales = document.querySelector('.icon-sales');
    if (kpiSales) kpiSales.closest('.kpi-card').onclick = () => window.switchTab('view-ventas', 'Ventas');

    // ==============================================================================
    // 2. CONFIGURACIÓN SUPABASE
    // ==============================================================================
    const SUPABASE_URL = 'https://ffvswmjaxbvomowmigtr.supabase.co';
    const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZmdnN3bWpheGJ2b21vd21pZ3RyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwNjU3MTEsImV4cCI6MjA4NzY0MTcxMX0.96OTSCQOwg5SfidmxpQ3yNA4Qfy8DEqhgR57CpmMAW8';
    let _supabase = null;

    try {
        _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

        // Verificación real de sesión de Supabase
        _supabase.auth.getSession().then(({ data, error }) => {
            if (error || !data.session) {
                console.warn("No hay sesión válida en Supabase, redirigiendo...");
                localStorage.removeItem('admin_logged');
                window.location.href = '/admin/index.html';
            }
        });
    } catch (e) {
        console.error("Error inicializando Supabase:", e);
    }

    // ==============================================================================
    // 3. DATOS Y RENDERIZADO
    // ==============================================================================
    const COLOR_MAP = {
        'gold': 'Dorado',
        'oro': 'Dorado',
        'black': 'Negro',
        'green': 'Verde',
        'blue': 'Azul',
        'white': 'Blanco',
        'natural': 'Natural Titanium',
        'natural titanium': 'Natural Titanium',
        'titanio natural': 'Natural Titanium',
        'teal': 'Teal',
        'pink': 'Rosa',
        'desert': 'Desert Titanium',
        'desert titanium': 'Desert Titanium',
        'titanio desierto': 'Desert Titanium',
        'titanium': 'Titanium',
        'space gray': 'Space Gray',
        'gris espacial': 'Space Gray',
        'silver': 'Silver',
        'plata': 'Silver',
        'midnight': 'Midnight',
        'medianoche': 'Midnight',
        'starlight': 'Starlight',
        'luz de estrella': 'Starlight'
    };

    function normalizeColorValue(val) {
        if (!val) return val;
        const lower = val.trim().toLowerCase();
        // Return mapped value or capitalize first letter of original
        return COLOR_MAP[lower] || (val.charAt(0).toUpperCase() + val.slice(1));
    }

    let memoryProducts = [];
    let memorySales = [];
    const formatMoney = (amount) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(amount);

    async function fetchData() {
        if (!_supabase) return;
        try {
            const { data: products } = await _supabase.from('products').select('*').order('created_at', { ascending: false });
            if (products) memoryProducts = products;

            const { data: sales } = await _supabase.from('sales').select('*').order('fecha', { ascending: false });
            if (sales) memorySales = sales;
        } catch (e) {
            console.error("Error al obtener datos:", e);
        } finally {
            initRenders();
        }
    }

    function initRenders() {
        calcularKPIs();
        renderProductos();
        renderVentas();
    }

    function calcularKPIs() {
        if (!document.getElementById('kpi-total-prod')) return;

        let totalUnits = 0;
        memoryProducts.forEach(p => {
            if (p.variantes && Array.isArray(p.variantes) && p.variantes.length > 0) {
                totalUnits += p.variantes.length;
            } else {
                totalUnits += 1;
            }
        });

        document.getElementById('kpi-total-prod').textContent = totalUnits;
        document.getElementById('badge-products').textContent = totalUnits;

        const actualMonth = new Date().getMonth();
        const salesThisMonth = memorySales.filter(s => new Date(s.fecha).getMonth() === actualMonth);

        document.getElementById('kpi-total-sales').textContent = salesThisMonth.length;
        document.getElementById('badge-sales').textContent = memorySales.length;

        let grossRevenue = 0;
        let totalCost = 0;
        salesThisMonth.forEach(sale => {
            grossRevenue += (sale.precio_final * sale.cantidad);
            totalCost += (sale.precio_costo * sale.cantidad);
        });

        document.getElementById('kpi-gross-revenue').textContent = formatMoney(grossRevenue);
        document.getElementById('kpi-net-profit').textContent = formatMoney(grossRevenue - totalCost);
    }

    function renderProductos(filterText = "") {
        const tbody = document.getElementById('tbody-products');
        if (!tbody) return;
        tbody.innerHTML = '';

        const arr = memoryProducts.filter(p => p.nombre.toLowerCase().includes(filterText.toLowerCase()));
        arr.forEach(prod => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>
                    <button class="expand-btn" onclick="window.toggleVariants(${prod.id}, this)">
                        <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none"><polyline points="6 9 12 15 18 9"></polyline></svg>
                    </button>
                </td>
                <td><img src="${prod.imagen}" class="prod-thumb"></td>
                <td><strong>${prod.nombre}</strong> <br> <small>ID: ${prod.id}</small></td>
                <td>${prod.categoria}</td>
                <td>${formatMoney(prod.precio_venta)}</td>
                <td>${formatMoney(prod.precio_costo)}</td>
                <td>${prod.stock}</td>
                <td><span class="pill-badge ${prod.activo ? 'badge-active' : 'badge-inactive'}">${prod.activo ? 'Activo' : 'Inactivo'}</span></td>
                <td>
                    <button class="action-btn" onclick="window.editProduct(${prod.id})">Editar</button>
                    <button class="action-btn delete" onclick="window.deleteProduct(${prod.id})">Borrar</button>
                </td>
            `;
            tbody.appendChild(tr);

            // Fila de variantes (oculta por defecto)
            const trVariants = document.createElement('tr');
            trVariants.id = `variants-row-${prod.id}`;
            trVariants.style.display = 'none';
            trVariants.className = 'variants-expanded-row';

            let variantsHtml = '<div class="variants-expanded-content">';
            let allVariants = [];
            // Agregar el modelo principal como la primera variante
            allVariants.push({
                almacenamiento: prod.almacenamiento,
                color: prod.color,
                bateria: prod.battery,
                notas: prod.notas,
                isMain: true
            });

            if (prod.variantes && Array.isArray(prod.variantes)) {
                allVariants = allVariants.concat(prod.variantes);
            }

            if (allVariants.length > 0) {
                variantsHtml += `
                    <table class="variants-inner-table">
                        <thead>
                            <tr>
                                <th>Almac.</th>
                                <th>Color</th>
                                <th>Batería</th>
                                <th>Notas</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${allVariants.map(v => `
                                <tr>
                                    <td>${v.almacenamiento || '-'}</td>
                                    <td>${v.color || '-'}</td>
                                    <td>${v.bateria ? v.bateria + '%' : '-'}</td>
                                    <td>${v.notas || '-'} ${v.isMain ? '<span style="font-size:0.65rem; color:#8e8e93; margin-left: 5px;">(Principal)</span>' : ''}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                `;
            } else {
                variantsHtml += '<p style="padding: 10px; color: #8e8e93; font-size: 0.85rem;">No hay variantes cargadas para este producto.</p>';
            }
            variantsHtml += '</div>';

            trVariants.innerHTML = `<td colspan="9">${variantsHtml}</td>`;
            tbody.appendChild(trVariants);
        });

        const selectProd = document.getElementById('sale-prod');
        if (selectProd) {
            selectProd.innerHTML = '<option value="">Seleccione un producto...</option>';
            memoryProducts.filter(p => p.activo && p.stock > 0).forEach(p => {
                const opt = document.createElement('option');
                opt.value = p.id;
                opt.textContent = `[Stk: ${p.stock}] ${p.nombre}`;
                opt.dataset.price = p.precio_venta;
                opt.dataset.cost = p.precio_costo;
                selectProd.appendChild(opt);
            });
        }
    }

    function renderVentas() {
        const tbody = document.getElementById('tbody-sales');
        if (!tbody) return;
        tbody.innerHTML = '';

        memorySales.forEach(sale => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${new Date(sale.fecha).toLocaleDateString()}</td>
                <td><strong>${sale.producto_nombre}</strong></td>
                <td>${sale.cliente}</td>
                <td>x${sale.cantidad}</td>
                <td>${formatMoney(sale.precio_final)}</td>
                <td>${sale.metodo_pago}</td>
                <td><button class="action-btn delete" onclick="window.deleteSale(${sale.id})">X</button></td>
            `;
            tbody.appendChild(tr);
        });
    }

    // ==============================================================================
    // 4. FUNCIONES GLOBALES (CRUD)
    // ==============================================================================
    window.deleteProduct = async (id) => {
        if (!confirm("¿Borrar producto?")) return;
        const { error } = await _supabase.from('products').delete().eq('id', id);
        if (!error) fetchData();
    };

    // ==============================================================================
    // 4. MODALES Y FORMULARIOS (CRUD)
    // ==============================================================================
    const modalProduct = document.getElementById('modal-product');
    const formProduct = document.getElementById('form-product');
    const modalSale = document.getElementById('modal-sale');
    const formSale = document.getElementById('form-sale');

    // ============== TOAST HELPER =================
    function showToast(msg, type = 'success') {
        let container = document.querySelector('.toast-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'toast-container';
            document.body.appendChild(container);
        }
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = msg;
        container.appendChild(toast);
        setTimeout(() => toast.remove(), 4000);
    }

    // -- Helpers de UI (Chips, Imágenes, Modelos) --
    function initChipSelectors() {
        document.querySelectorAll('.chip-container, .chip-container-pills').forEach(container => {
            const chips = container.querySelectorAll('.chip, .chip-pill, .chip-pill-variant');
            const hiddenInput = container.querySelector('input[type="hidden"]');
            chips.forEach(chip => {
                chip.onclick = () => {
                    if (container.classList.contains('multi-select')) {
                        // Lógica multi-select (usada en variantes)
                        chip.classList.toggle('active');
                    } else {
                        // Lógica single-select (original)
                        chips.forEach(c => c.classList.remove('active'));
                        chip.classList.add('active');
                        if (hiddenInput) {
                            hiddenInput.value = chip.getAttribute('data-val');
                            hiddenInput.dispatchEvent(new Event('change'));
                        }
                    }
                };
            });
        });
    }

    // -- Lógica de Unidades en Stock (Variaciones Específicas) --
    let currentStockItems = [];
    let editingVariantIndex = -1;

    function renderStockItems() {
        const tbody = document.getElementById('tbody-stock-items');
        tbody.innerHTML = '';

        if (currentStockItems.length === 0) {
            tbody.innerHTML = '<div style="padding: 20px; text-align: center; color: #8e8e93; font-size: 0.85rem;">No hay unidades cargadas</div>';
            return;
        }

        currentStockItems.forEach((item, index) => {
            const row = document.createElement('div');
            row.className = 'stock-variant-row stock-variant-item';
            if (index === editingVariantIndex) {
                row.style.backgroundColor = '#f0f8ff'; // Highlight editing row
            }
            row.innerHTML = `
                <div>${item.almacenamiento}</div>
                <div>${item.color}</div>
                <div>${item.bateria ? item.bateria + '%' : '-'}</div>
                <div style="font-size: 0.7rem; color: #007aff;">${item.imagen ? '📷 Imagen' : '-'}</div>
                <div style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${item.notas || ''}</div>
                <div style="text-align: center; white-space: nowrap;">
                    <button type="button" class="expand-btn" style="display:inline-block; margin-right: 5px;" onclick="window.editStockItem(${index})" title="Editar">
                        <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                    </button>
                    <button type="button" class="remove-color" onclick="window.removeStockItem(${index})" title="Eliminar">&times;</button>
                </div>
            `;
            tbody.appendChild(row);
        });
    }

    window.removeStockItem = (index) => {
        if (confirm("¿Estás seguro de eliminar esta variante?")) {
            currentStockItems.splice(index, 1);
            if (editingVariantIndex === index) resetEditVariantState();
            else if (editingVariantIndex > index) editingVariantIndex--;
            renderStockItems();
        }
    };

    window.editStockItem = (index) => {
        const item = currentStockItems[index];

        // Cargar datos en los inputs
        document.getElementById('item-storage').value = item.almacenamiento;
        
        // Si el color no está en el select, agregarlo temporalmente
        const colorSelect = document.getElementById('item-color');
        let optionExists = Array.from(colorSelect.options).some(opt => opt.value === item.color);
        if (!optionExists && item.color) {
            const opt = document.createElement('option');
            opt.value = item.color;
            opt.text = item.color;
            colorSelect.appendChild(opt);
        }
        colorSelect.value = item.color;
        
        document.getElementById('item-battery').value = item.bateria || '';
        document.getElementById('item-notes').value = item.notas || '';

        // Cargar imagen si existe
        if (item.imagen) {
            document.getElementById('item-image-data').value = item.imagen;
            document.getElementById('item-image-preview').style.display = 'block';
            document.getElementById('item-image-preview').innerHTML = 'Imagen cargada <button type="button" onclick="window.clearVariantImage()" style="background:none; border:none; color:red; cursor:pointer; font-size:10px;">(Quitar)</button>';
        } else {
            window.clearVariantImage();
        }

        editingVariantIndex = index;
        const btn = document.getElementById('btn-add-stock-item');
        btn.innerHTML = '✓';
        btn.style.background = '#007aff';
        
        renderStockItems();

        // Scroll al formulario de variantes
        document.querySelector('.add-stock-item-row').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    };

    window.clearVariantImage = () => {
        document.getElementById('item-image-data').value = '';
        document.getElementById('item-image-file').value = '';
        document.getElementById('item-image-preview').style.display = 'none';
        document.getElementById('item-image-preview').innerHTML = 'Listo!';
    };

    function resetEditVariantState() {
        editingVariantIndex = -1;
        const btn = document.getElementById('btn-add-stock-item');
        if (btn) {
            btn.innerHTML = '+';
            btn.style.background = '#000';
        }
    }

    document.getElementById('btn-add-stock-item').onclick = () => {
        const storage = document.getElementById('item-storage').value;
        const colorRaw = document.getElementById('item-color').value.trim();
        const color = normalizeColorValue(colorRaw);
        const battery = document.getElementById('item-battery').value.trim();
        const imageData = document.getElementById('item-image-data').value;
        const notes = document.getElementById('item-notes').value.trim();

        if (color) {
            const variantData = {
                almacenamiento: storage,
                color: color,
                bateria: battery,
                imagen: imageData,
                notas: notes
            };

            if (editingVariantIndex >= 0) {
                currentStockItems[editingVariantIndex] = variantData;
                resetEditVariantState();
            } else {
                currentStockItems.push(variantData);
            }

            // Limpiar inputs
            document.getElementById('item-color').value = 'Negro'; // Default
            document.getElementById('item-battery').value = '';
            document.getElementById('item-image-data').value = '';
            document.getElementById('item-image-file').value = '';
            document.getElementById('item-image-preview').style.display = 'none';
            document.getElementById('item-notes').value = '';
            renderStockItems();
        } else {
            alert("Por favor, ingresá al menos el color.");
        }
    };

    window.toggleVariants = (id, btn) => {
        const row = document.getElementById(`variants-row-${id}`);
        if (row.style.display === 'none') {
            row.style.display = 'table-row';
            btn.classList.add('active');
        } else {
            row.style.display = 'none';
            btn.classList.remove('active');
        }
    };

    function initVariantSelectors() {
        renderStockItems();
    }

    function initImageUpload() {
        // Imágenes de producto base
        [1, 2, 3].forEach(slot => {
            const fileInput = document.getElementById(`file-${slot}`);
            const hiddenInput = document.getElementById(`prod-img-${slot}`);
            const thumb = document.getElementById(`img-${slot}`);
            if (!fileInput) return;
            fileInput.onchange = e => {
                const reader = new FileReader();
                reader.onload = ev => {
                    hiddenInput.value = ev.target.result;
                    thumb.src = ev.target.result;
                    thumb.classList.remove('hidden');
                    if (thumb.previousElementSibling) thumb.previousElementSibling.classList.add('hidden');
                };
                reader.readAsDataURL(e.target.files[0]);
            };
        });

        // Imágenes de variantes
        const vTrigger = document.getElementById('btn-trigger-variant-file');
        const vFile = document.getElementById('item-image-file');
        const vHidden = document.getElementById('item-image-data');
        const vPreview = document.getElementById('item-image-preview');

        if (vTrigger && vFile) {
            vTrigger.onclick = () => vFile.click();
            vFile.onchange = e => {
                if (e.target.files && e.target.files[0]) {
                    const reader = new FileReader();
                    reader.onload = ev => {
                        vHidden.value = ev.target.result;
                        vPreview.style.display = 'block';
                        vPreview.innerHTML = 'Imagen cargada <button type="button" onclick="window.clearVariantImage()" style="background:none; border:none; color:red; cursor:pointer; font-size:10px;">(Quitar)</button>';
                    };
                    reader.readAsDataURL(e.target.files[0]);
                }
            };
        }
    }

    const CATEGORY_MODELS = {
        'iPhone': [
            'iPhone 11', 'iPhone 11 Pro', 'iPhone 11 Pro Max',
            'iPhone 12 Mini', 'iPhone 12', 'iPhone 12 Pro', 'iPhone 12 Pro Max',
            'iPhone 13 Mini', 'iPhone 13', 'iPhone 13 Pro', 'iPhone 13 Pro Max',
            'iPhone 14', 'iPhone 14 Plus', 'iPhone 14 Pro', 'iPhone 14 Pro Max',
            'iPhone 15', 'iPhone 15 Plus', 'iPhone 15 Pro', 'iPhone 15 Pro Max',
            'iPhone 16', 'iPhone 16 Plus', 'iPhone 16 Pro', 'iPhone 16 Pro Max',
            'iPhone 17', 'iPhone 17 Plus', 'iPhone 17 Pro', 'iPhone 17 Pro Max'
        ],
        'MacBook': [
            'MacBook Air M1', 'MacBook Air M2', 'MacBook Air M3',
            'MacBook Pro 13"', 'MacBook Pro 14"', 'MacBook Pro 16"',
            'iMac 24"'
        ],
        'iPad': [
            'iPad (9na Gen)', 'iPad (10ma Gen)',
            'iPad Mini (6ta Gen)',
            'iPad Air (5ta Gen)', 'iPad Air (M2)',
            'iPad Pro 11"', 'iPad Pro 12.9"', 'iPad Pro 13" (M4)'
        ],
        'AirPods': [
            'AirPods 2', 'AirPods 3', 'AirPods 4',
            'AirPods Pro (1ra Gen)', 'AirPods Pro 2', 'AirPods Max'
        ],
        'Accesorios': [
            'Apple Watch SE', 'Apple Watch Series 8', 'Apple Watch Series 9', 'Apple Watch Series 10', 'Apple Watch Ultra', 'Apple Watch Ultra 2',
            'Cargador MagSafe', 'Cable Tipo C a Lightning', 'Cable Tipo C a Tipo C', 'Adaptador de corriente 20W',
            'Funda Silicone Case', 'Funda Clear Case', 'Funda FineWoven',
            'Apple Pencil (1ra Gen)', 'Apple Pencil (2da Gen)', 'Apple Pencil (USB-C)', 'Apple Pencil Pro'
        ]
    };

    function updateModelDropdown(category) {
        const select = document.getElementById('prod-name');
        if (!select) return;
        select.innerHTML = '';
        (CATEGORY_MODELS[category] || CATEGORY_MODELS['iPhone']).forEach(m => {
            const opt = document.createElement('option');
            opt.value = m; opt.textContent = m;
            select.appendChild(opt);
        });
    }

    // -- Listeners de Botones Abrir --
    document.getElementById('btn-add-product').onclick = () => {
        formProduct.reset();
        document.getElementById('prod-id').value = '';
        document.getElementById('modal-prod-title').textContent = 'Nuevo Producto';

        // Reset unidades stock
        currentStockItems = [];
        resetEditVariantState();
        renderStockItems();

        // Reset chips
        document.querySelectorAll('.chip, .chip-pill').forEach(c => c.classList.remove('active'));
        document.querySelectorAll('.chip-container, .chip-container-pills').forEach(container => {
            if (container.classList.contains('multi-select')) return;
            const first = container.querySelector('.chip, .chip-pill');
            if (first) first.click();
        });
        modalProduct.classList.remove('hidden');
    };

    document.getElementById('btn-add-sale').onclick = () => {
        formSale.reset();
        document.getElementById('preview-total').textContent = '$0';
        modalSale.classList.remove('hidden');
    };

    // -- Handlers de Envío --
    formProduct.onsubmit = async (e) => {
        e.preventDefault();
        
        if (currentStockItems.length === 0) {
            alert("Debes agregar al menos una unidad en la grilla de stock.");
            return;
        }

        const id = document.getElementById('prod-id').value;
        const mainUnit = currentStockItems[0];
        const extraUnits = currentStockItems.slice(1);

        const prodData = {
            nombre: document.getElementById('prod-name').value,
            categoria: document.getElementById('prod-cat').value,
            subcategoria: document.getElementById('prod-subcat').value,
            almacenamiento: mainUnit.almacenamiento,
            color: mainUnit.color,
            precio_venta: Number(document.getElementById('prod-sell').value),
            precio_costo: Number(document.getElementById('prod-cost').value),
            battery: mainUnit.bateria,
            ubicacion: document.getElementById('prod-location') ? document.getElementById('prod-location').value : null,
            notas: mainUnit.notas,
            imagen: mainUnit.imagen || document.getElementById('prod-img-1').value || '/assets/iphone_case.png',
            stock: currentStockItems.length,
            activo: document.getElementById('prod-active').checked,
            variantes: extraUnits.length > 0 ? extraUnits : null
        };

        const { error } = id
            ? await _supabase.from('products').update(prodData).eq('id', id)
            : await _supabase.from('products').insert([prodData]);

        if (!error) {
            modalProduct.classList.add('hidden');
            showToast(id ? 'Producto actualizado' : 'Producto agregado');
            fetchData();
        } else {
            console.error("Error BD:", error);
            alert("Error de BD: " + error.message + "\nDetalle: " + error.details);
        }
    };

    formSale.onsubmit = async (e) => {
        e.preventDefault();
        const sel = document.getElementById('sale-prod');
        const opt = sel.options[sel.selectedIndex];
        const saleData = {
            producto_id: Number(sel.value),
            producto_nombre: opt.text.split('] ')[1],
            cantidad: Number(document.getElementById('sale-qty').value),
            precio_final: Number(document.getElementById('sale-price').value),
            precio_costo: Number(opt.dataset.cost),
            cliente: document.getElementById('sale-client').value,
            metodo_pago: document.getElementById('sale-method').value,
            fecha: new Date().toISOString()
        };

        const { error } = await _supabase.from('sales').insert([saleData]);
        if (!error) {
            modalSale.classList.add('hidden');
            showToast('Venta registrada');
            fetchData();
        } else {
            console.error("Error BD Ventas:", error);
            alert("Error al registrar venta: " + error.message);
        }
    };

    // -- Inicializadores de Formulario --
    initChipSelectors();
    initVariantSelectors();

    // Lógica para mostrar/ocultar Condición de Batería
    const subcatInput = document.getElementById('prod-subcat');
    const batteryGroup = document.getElementById('group-battery');

    if (subcatInput && batteryGroup) {
        subcatInput.addEventListener('change', (e) => {
            if (e.target.value === 'Usado') {
                batteryGroup.classList.remove('hidden');
            } else {
                batteryGroup.classList.add('hidden');
            }
        });
    }

    initImageUpload();
    document.getElementById('prod-cat').onchange = (e) => updateModelDropdown(e.target.value);
    document.querySelectorAll('[data-close]').forEach(b => b.onclick = () => {
        b.closest('.modal-overlay').classList.add('hidden');
    });

    // Logout y Mobile
    window.logout = async () => {
        if (_supabase) {
            await _supabase.auth.signOut();
        }
        localStorage.removeItem('admin_logged');
        window.location.href = '/admin/index.html';
    };
    document.getElementById('btn-logout').onclick = window.logout;
    document.getElementById('mobile-menu-open').onclick = () => {
        document.getElementById('admin-sidebar').classList.add('open');
        document.getElementById('sidebar-overlay').classList.add('show');
    };
    document.getElementById('mobile-menu-close').onclick = () => {
        document.getElementById('admin-sidebar').classList.remove('open');
        document.getElementById('sidebar-overlay').classList.remove('show');
    };

    window.editProduct = (id) => {
        const p = memoryProducts.find(x => x.id === id);
        if (!p) return;
        document.getElementById('prod-id').value = p.id;
        document.getElementById('modal-prod-title').textContent = 'Editar Producto';
        document.getElementById('prod-sell').value = p.precio_venta;
        document.getElementById('prod-cost').value = p.precio_costo;
        document.getElementById('prod-active').checked = p.activo;

        const subcatInputEdit = document.getElementById('prod-subcat');
        if (subcatInputEdit) {
            subcatInputEdit.value = p.subcategoria || 'Nuevo';
            subcatInputEdit.dispatchEvent(new Event('change'));
        }

        document.getElementById('prod-battery').value = p.battery || '';

        // Reset y Cargar Unidades en Stock (Variantes)
        currentStockItems = [{
            almacenamiento: p.almacenamiento || '128GB',
            color: p.color || 'Negro',
            bateria: p.battery || '',
            notas: p.notas || '',
            imagen: p.imagen && p.imagen !== '/assets/iphone_case.png' ? p.imagen : ''
        }];
        if (Array.isArray(p.variantes)) {
            currentStockItems = currentStockItems.concat(p.variantes);
        }
        resetEditVariantState();
        renderStockItems();

        // Chips
        const fields = [
            { id: 'container-category', val: p.categoria },
            { id: 'container-condition', val: p.subcategoria },
            { id: 'container-storage', val: p.almacenamiento }
        ];
        fields.forEach(f => {
            const container = document.getElementById(f.id);
            if (container) {
                const chip = container.querySelector(`[data-val="${f.val}"]`);
                if (chip) chip.click();
            }
        });

        // Set name AFTER category is selected and dropdown is populated
        setTimeout(() => {
            document.getElementById('prod-name').value = p.nombre;
        }, 50);

        modalProduct.classList.remove('hidden');
    };

    // Inicializar carga de datos
    fetchData();

    // Fecha Header
    const mainSubtitle = document.getElementById('main-subtitle');
    if (mainSubtitle) mainSubtitle.textContent = new Date().toLocaleDateString('es-AR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

});
