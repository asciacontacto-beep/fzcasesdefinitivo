document.addEventListener('DOMContentLoaded', () => {

    // ==============================================================================
    // 1. NAVEGACIï¿½N (Prioridad MÃ¡xima)
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
    // 2. CONFIGURACIï¿½N SUPABASE
    // ==============================================================================
    const SUPABASE_URL = 'https://ffvswmjaxbvomowmigtr.supabase.co';
    const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZmdnN3bWpheGJ2b21vd21pZ3RyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwNjU3MTEsImV4cCI6MjA4NzY0MTcxMX0.96OTSCQOwg5SfidmxpQ3yNA4Qfy8DEqhgR57CpmMAW8';
    try {
        _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

        if (localStorage.getItem('fzcases_bypass') === 'true') {
            console.warn("Bypass de autenticaciÃ³n activado.");
            document.body.classList.remove('auth-hidden');
            fetchData();
        } else {
            // VerificaciÃ³n real de sesiÃ³n de Supabase
            _supabase.auth.getSession().then(({ data, error }) => {
                if (error || !data.session) {
                    console.warn("No hay sesiÃ³n vÃ¡lida en Supabase, redirigiendo...");
                    document.body.innerHTML = ''; // Limpia el DOM por seguridad
                    localStorage.removeItem('admin_logged');
                    window.location.href = 'index.html';
                } else {
                    // SESIï¿½N VÃLIDA: Revelar contenido
                    document.body.classList.remove('auth-hidden');
                    fetchData();
                }
            });
        }
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
        if (typeof updateAdminModelFilter === 'function') updateAdminModelFilter();
        renderProductos();
        renderVentas();
        renderHeroGallery();
        if (typeof renderNosotrosConfig === 'function') renderNosotrosConfig();
        calcularKPIs();
    }

    function calcularKPIs() {
        if (!document.getElementById('kpi-total-prod')) return;

        let totalUnits = 0;
        memoryProducts.forEach(p => {
            let count = 1; // main unit
            if (p.variantes && Array.isArray(p.variantes)) {
                count += p.variantes.length;
            }
            totalUnits += count;
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

    // Filtro de productos
    const searchProducts = document.getElementById('search-products');
    const adminFilterCategory = document.getElementById('admin-filter-category');
    const adminFilterModel = document.getElementById('admin-filter-model');

    function updateAdminModelFilter() {
        if (!adminFilterCategory || !adminFilterModel) return;
        const catValue = adminFilterCategory.value;
        const catProducts = catValue === 'Todas' ? memoryProducts : memoryProducts.filter(p => p.categoria === catValue);
        
        const currentModel = adminFilterModel.value;
        const uniqueModels = [...new Set(catProducts.filter(p => p.nombre && p.nombre !== '__SYSTEM_HERO__' && p.nombre !== '__CONFIG_HERO__' && p.nombre !== '__CONFIG_SETTINGS__').map(p => p.nombre))].sort();
        
        adminFilterModel.innerHTML = '<option value="Todos">Todos los modelos</option>';
        uniqueModels.forEach(m => {
            const opt = document.createElement('option');
            opt.value = m; opt.textContent = m;
            adminFilterModel.appendChild(opt);
        });
        if (uniqueModels.includes(currentModel)) adminFilterModel.value = currentModel;
    }

    if (adminFilterCategory) {
        adminFilterCategory.addEventListener('change', () => {
            updateAdminModelFilter();
            renderProductos();
        });
    }

    if (adminFilterModel) {
        adminFilterModel.addEventListener('change', () => {
            renderProductos();
        });
    }

    if (searchProducts) {
        searchProducts.addEventListener('input', () => {
            renderProductos();
        });
    }

    function renderProductos() {
        const tbody = document.getElementById('tbody-products');
        if (!tbody) return;
        tbody.innerHTML = '';

        let filterText = searchProducts ? searchProducts.value.toLowerCase() : '';
        let catFilter = adminFilterCategory ? adminFilterCategory.value : 'Todas';
        let modFilter = adminFilterModel ? adminFilterModel.value : 'Todos';

        const arr = memoryProducts.filter(p => {
            if (p.nombre === '__SYSTEM_HERO__' || p.nombre === '__CONFIG_HERO__' || p.nombre === '__CONFIG_SETTINGS__') return false;
            
            let matchText = p.nombre.toLowerCase().includes(filterText);
            let matchCat = catFilter === 'Todas' || p.categoria === catFilter;
            let matchMod = modFilter === 'Todos' || p.nombre === modFilter;
            
            return matchText && matchCat && matchMod;
        });
        arr.forEach(prod => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>
                    <button class="expand-btn" onclick="window.toggleVariants(${prod.id}, this)">
                        <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none"><polyline points="6 9 12 15 18 9"></polyline></svg>
                    </button>
                </td>
                <td><img src="${prod.imagen ? prod.imagen.replace(/^\/assets\//, '../assets/') : ''}" class="prod-thumb"></td>
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
                                <th>BaterÃ­a</th>
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
        if (!confirm("Â¿Borrar producto?")) return;
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

    // -- Helpers de UI (Chips, ImÃ¡genes, Modelos) --
    function initChipSelectors() {
        document.querySelectorAll('.chip-container, .chip-container-pills').forEach(container => {
            const chips = container.querySelectorAll('.chip, .chip-pill, .chip-pill-variant');
            const hiddenInput = container.querySelector('input[type="hidden"]');
            chips.forEach(chip => {
                chip.onclick = () => {
                    if (container.classList.contains('multi-select')) {
                        // LÃ³gica multi-select
                        chip.classList.toggle('active');
                        if (hiddenInput) {
                            const activeChips = Array.from(container.querySelectorAll('.active'));
                            hiddenInput.value = activeChips.map(c => c.getAttribute('data-val')).join(', ');
                            hiddenInput.dispatchEvent(new Event('change'));
                        }
                    } else {
                        // LÃ³gica single-select (original)
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

        // Trigger inicial para subcategoria
        const subcatInput = document.getElementById('prod-subcat');
        if (subcatInput) {
            subcatInput.addEventListener('change', (e) => {
                const batInput = document.getElementById('item-battery');
                if (batInput) {
                    if (e.target.value === 'Nuevo') {
                        // Let them type whatever they want, don't disable
                        if (!batInput.value) batInput.value = '100';
                    }
                }
            });
            // Ejecutar una vez para estado inicial
            subcatInput.dispatchEvent(new Event('change'));
        }

        // Trigger inicial para colores segÃºn categorÃ­a
        const catInput = document.getElementById('prod-cat');
        if (catInput) {
            catInput.dispatchEvent(new Event('change'));
        }
    }

    // -- LÃ³gica de Unidades en Stock (Variaciones EspecÃ­ficas) --
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
                <div>${item.bateria ? (item.bateria.toString().includes('%') ? item.bateria : item.bateria + '%') : '-'}</div>
                <div>${(item.notas && item.notas.match(/\[SIM: (.*?)\]/)) ? item.notas.match(/\[SIM: (.*?)\]/)[1] : '-'}</div>
                <div>${(item.notas && item.notas.match(/\[CAJA: (.*?)\]/)) ? item.notas.match(/\[CAJA: (.*?)\]/)[1] : '-'}</div>
                <div style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${(item.notas || '').replace(/\[SIM: .*?\]\s*/g, '').replace(/\[CAJA: .*?\]\s*/g, '')}</div>
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
        if (confirm("Â¿EstÃ¡s seguro de eliminar esta variante?")) {
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

        // Si el color no estÃ¡ en el select, agregarlo temporalmente
        const colorSelect = document.getElementById('item-color');
        let optionExists = Array.from(colorSelect.options).some(opt => opt.value === item.color);
        if (!optionExists && item.color) {
            const opt = document.createElement('option');
            opt.value = item.color;
            opt.text = item.color;
            colorSelect.appendChild(opt);
        }
        colorSelect.value = item.color;

        document.getElementById('item-battery').value = (item.bateria ? item.bateria.toString().replace(/\D/g, '') : '');
        document.getElementById('item-notes').value = (item.notas || '').replace(/\[SIM: .*?\]\s*/g, '').replace(/\[CAJA: .*?\]\s*/g, '');
        const simMatch = item.notas && item.notas.match(/\[SIM: (.*?)\]/);
        document.getElementById('item-sim').value = simMatch ? simMatch[1] : '-';
        const boxMatch = item.notas && item.notas.match(/\[CAJA: (.*?)\]/);
        document.getElementById('item-box').value = boxMatch ? boxMatch[1] : '-';

        editingVariantIndex = index;
        const btn = document.getElementById('btn-add-stock-item');
        btn.innerHTML = 'ï¿½S';
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
        let notes = document.getElementById('item-notes').value.trim();
        const sim = document.getElementById('item-sim').value;
        const box = document.getElementById('item-box').value;
        
        if (box !== '-') {
            notes = `[CAJA: ${box}] ` + notes;
        }
        if (sim !== '-') {
            notes = `[SIM: ${sim}] ` + notes;
        }

        if (color) {
            const variantData = {
                almacenamiento: storage,
                color: color,
                bateria: battery,
                notas: notes.trim()
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
            document.getElementById('item-sim').value = '-';
            document.getElementById('item-box').value = '-';
            document.getElementById('item-image-data').value = '';
            document.getElementById('item-image-file').value = '';
            document.getElementById('item-image-preview').style.display = 'none';
            document.getElementById('item-notes').value = '';
            renderStockItems();
        } else {
            alert("Por favor, ingresÃ¡ al menos el color.");
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

    window.uploadAndCompressImage = (callback) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = e => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = ev => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;
                    const maxDim = 1200;
                    if (width > height && width > maxDim) {
                        height *= maxDim / width;
                        width = maxDim;
                    } else if (height > maxDim) {
                        width *= maxDim / height;
                        height = maxDim;
                    }
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    const compressedBase64 = canvas.toDataURL('image/jpeg', 0.8);
                    callback(compressedBase64);
                };
                img.src = ev.target.result;
            };
            reader.readAsDataURL(file);
        };
        input.click();
    };

    function initImageUpload() {
        // ImÃ¡genes de producto base
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

        // ImÃ¡genes de variantes
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
            'MacBook Air M1', 'MacBook Air M2', 'MacBook Air M3', 'MacBook Air M4',
            'MacBook Pro 13"', 'MacBook Pro 14"', 'MacBook Pro 16"', 'MacBook Pro M4',
            'MacBook Neo',
            'iMac 24"', 'Mac Mini', 'Mac Studio', 'Mac Pro'
        ],
        'iPad': [
            'iPad (9na Gen)', 'iPad (10ma Gen)', 'iPad A16',
            'iPad Mini (6ta Gen)',
            'iPad Air (5ta Gen)', 'iPad Air (M2)',
            'iPad Pro 11"', 'iPad Pro 12.9"', 'iPad Pro 13" (M4)'
        ],
        'AirPods': [
            'AirPods 2', 'AirPods 3', 'AirPods 4', 'Airpods con cancelacion',
            'AirPods Pro (1ra Gen)', 'AirPods Pro 2', 'Airpods pro 3', 'AirPods Max'
        ],
        'Apple Watch': [
            'Apple Watch SE', 'Apple Watch SE 2', 'Apple Watch SE 3',
            'Apple Watch Series 4', 'Apple Watch Series 5', 'Apple Watch Series 6',
            'Apple Watch Series 7', 'Apple Watch Series 8', 'Apple Watch Series 9',
            'Apple Watch Series 10', 'Apple Watch Series 11',
            'Apple Watch Ultra', 'Apple Watch Ultra 2'
        ],
        'Accesorios': [
            'Cargador Magsafe', 'Cable usb c', 'Cable Ligthning', 'Cable Tipo C a Tipo C',
            'Adpaptador Usb c', 'Adaptador usb c Duo', 'Adaptador Usb c 60w', 'Adaptador de corriente 20W',
            'Airtag', 'Airtag x4', 'Earpods', 'Magic Mouse',
            'Funda Silicone Case', 'Funda Clear Case', 'Funda FineWoven',
            'Apple Pencil (1ra Gen)', 'Apple Pencil (2da Gen)', 'Apple Pencil (USB-C)', 'Apple Pencil Pro'
        ],
        'Samsung': [
            'Galaxy S24 Ultra', 'Galaxy S24+', 'Galaxy S24',
            'Galaxy S23 Ultra', 'Galaxy S23+', 'Galaxy S23',
            'Galaxy S22 Ultra', 'Galaxy S22+', 'Galaxy S22',
            'Galaxy Z Fold 5', 'Galaxy Z Flip 5',
            'Galaxy A54', 'Galaxy A34', 'Galaxy A14'
        ]
    };

    // Helper for Config Settings
    async function getConfigSettings() {
        const rec = memoryProducts.find(p => p.nombre === '__CONFIG_SETTINGS__');
        if (rec && rec.notas) {
            try { return JSON.parse(rec.notas); } catch(e) {}
        }
        return {};
    }

    async function saveConfigSettings(newCfg) {
        let rec = memoryProducts.find(p => p.nombre === '__CONFIG_SETTINGS__');
        if (rec) {
            await _supabase.from('products').update({ notas: JSON.stringify(newCfg) }).eq('id', rec.id);
        } else {
            await _supabase.from('products').insert([{
                nombre: '__CONFIG_SETTINGS__',
                categoria: 'Sistema',
                notas: JSON.stringify(newCfg),
                precio_venta: 0, precio_costo: 0, stock: 0, activo: false
            }]);
        }
        await fetchData(); // refresh memory
    }

    async function updateModelDropdown(category) {
        const select = document.getElementById('prod-name');
        if (!select) return;
        select.innerHTML = '';
        
        const cfg = await getConfigSettings();
        const customModels = cfg.customModels || {};
        
        let modelsToUse = customModels[category];
        if (!modelsToUse || modelsToUse.length === 0) {
            modelsToUse = CATEGORY_MODELS[category] || CATEGORY_MODELS['iPhone'];
        }
        
        modelsToUse.forEach(m => {
            const opt = document.createElement('option');
            opt.value = m; opt.textContent = m;
            select.appendChild(opt);
        });
    }

    const btnAddModel = document.getElementById('btn-add-model');
    const btnDelModel = document.getElementById('btn-del-model');

    if (btnAddModel) {
        btnAddModel.addEventListener('click', async () => {
            const category = document.getElementById('prod-cat').value;
            const newModel = prompt(`EscribÃ­ el nombre del nuevo modelo para la categorÃ­a "${category}":`);
            if (newModel && newModel.trim()) {
                const cfg = await getConfigSettings();
                cfg.customModels = cfg.customModels || {};
                
                let models = cfg.customModels[category] || CATEGORY_MODELS[category] || CATEGORY_MODELS['iPhone'];
                // Clonar array para no mutar la constante global por error
                models = [...models]; 
                
                if (!models.includes(newModel.trim())) {
                    models.push(newModel.trim());
                    models.sort();
                    cfg.customModels[category] = models;
                    await saveConfigSettings(cfg);
                    showToast(`Modelo "${newModel.trim()}" agregado`);
                    await updateModelDropdown(category);
                    document.getElementById('prod-name').value = newModel.trim();
                } else {
                    alert("Ese modelo ya existe en la lista.");
                }
            }
        });
    }

    if (btnDelModel) {
        btnDelModel.addEventListener('click', async () => {
            const category = document.getElementById('prod-cat').value;
            const select = document.getElementById('prod-name');
            const modelToDelete = select.value;
            
            if (!modelToDelete) return;
            
            if (confirm(`Â¿EstÃ¡s SEGURO de que querÃ©s borrar permanentemente el modelo "${modelToDelete}" de la lista de ${category}?`)) {
                const cfg = await getConfigSettings();
                cfg.customModels = cfg.customModels || {};
                
                let models = cfg.customModels[category] || CATEGORY_MODELS[category] || CATEGORY_MODELS['iPhone'];
                models = [...models];
                
                models = models.filter(m => m !== modelToDelete);
                cfg.customModels[category] = models;
                
                await saveConfigSettings(cfg);
                showToast(`Modelo eliminado`);
                await updateModelDropdown(category);
            }
        });
    }

    const CATEGORY_COLORS = {
        'MacBook': [
            'Rosa', 'Plata', 'Indigo', 'Citrus'
        ],
        'Apple Watch': [
            'Midnight', 'Starlight', 'Silver', 'Jet Black', 'Titanium', 'Black', 'Blue', 'Rose Gold'
        ],
        'default': [
            'Negro', 'Blanco', 'Dorado', 'Azul', 'Verde', 'Rosa', 'Teal',
            'Orange', 'Lavanda', 'Citrus', 'Indigo',
            'Natural Titanium', 'Desert Titanium', 'Midnight', 'Starlight',
            'Space Gray', 'Silver', 'Jet Black'
        ]
    };

    function updateColorDropdown(category) {
        const select = document.getElementById('item-color');
        if (!select) return;
        const colors = CATEGORY_COLORS[category] || CATEGORY_COLORS['default'];
        select.innerHTML = colors.map(c => `<option value="${c}">${c}</option>`).join('');
    }

    // ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½
    // GESTOR DE PORTADAS: GALERÃA + CONFIG + LOGO
    // ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½ï¿½"ï¿½

    // Live preview helpers
    function updatePreviewFromInputs() {
        const titleEl = document.getElementById('prev-title');
        const subtitleEl = document.getElementById('prev-subtitle');
        const titleInput = document.getElementById('cfg-hero-title');
        const subtitleInput = document.getElementById('cfg-hero-subtitle');
        const fontSelect = document.getElementById('cfg-hero-font');
        const colorInput = document.getElementById('cfg-hero-color');
        const colorLabel = document.getElementById('cfg-hero-color-label');

        if (titleEl && titleInput && titleInput.value) titleEl.textContent = titleInput.value;
        if (subtitleEl && subtitleInput && subtitleInput.value) subtitleEl.textContent = subtitleInput.value;

        // Apply color
        if (colorInput) {
            const col = colorInput.value;
            if (colorLabel) colorLabel.textContent = col;
            if (titleEl) titleEl.style.color = col;
            if (subtitleEl) subtitleEl.style.color = col;
        }

        if (titleEl && fontSelect) {
            const font = fontSelect.value;
            const link = document.getElementById(`gfont-${font.replace(/ /g,'-')}`);
            if (!link) {
                const l = document.createElement('link');
                l.rel = 'stylesheet';
                l.id = `gfont-${font.replace(/ /g,'-')}`;
                l.href = `https://fonts.googleapis.com/css2?family=${font.replace(/ /g,'+')}:wght@400;700;800&display=swap`;
                document.head.appendChild(l);
            }
            titleEl.style.fontFamily = `'${font}', sans-serif`;
        }
    }

    document.getElementById('cfg-hero-title').oninput = updatePreviewFromInputs;
    document.getElementById('cfg-hero-subtitle').oninput = updatePreviewFromInputs;
    document.getElementById('cfg-hero-font').onchange = updatePreviewFromInputs;
    document.getElementById('cfg-hero-color').oninput = updatePreviewFromInputs;

    // Load current config into fields
    window.renderHeroGallery = () => {
        const grid = document.getElementById('hero-gallery-grid');
        const previewImg = document.getElementById('hero-preview-img');
        if (!grid) return;

        // Load settings config into fields
        let cfg = {};
        const configRec = memoryProducts.find(p => p.nombre === '__CONFIG_SETTINGS__');
        if (configRec && configRec.notas) {
            try {
                cfg = JSON.parse(configRec.notas);
                if (cfg.heroTitle) document.getElementById('cfg-hero-title').value = cfg.heroTitle;
                if (cfg.heroSubtitle) document.getElementById('cfg-hero-subtitle').value = cfg.heroSubtitle;
                if (cfg.heroFont) document.getElementById('cfg-hero-font').value = cfg.heroFont;
                if (cfg.heroColor) document.getElementById('cfg-hero-color').value = cfg.heroColor;
                
                if (cfg.footer) {
                    if (cfg.footer.ig) document.getElementById('cfg-footer-ig').value = cfg.footer.ig;
                    if (cfg.footer.fb) document.getElementById('cfg-footer-fb').value = cfg.footer.fb;
                    if (cfg.footer.tt) document.getElementById('cfg-footer-tt').value = cfg.footer.tt;
                    if (cfg.footer.waNum) document.getElementById('cfg-footer-wa-num').value = cfg.footer.waNum;
                    if (cfg.footer.waTxt) document.getElementById('cfg-footer-wa-txt').value = cfg.footer.waTxt;
                    if (cfg.footer.email) document.getElementById('cfg-footer-email').value = cfg.footer.email;
                    if (cfg.footer.desc) document.getElementById('cfg-footer-desc').value = cfg.footer.desc;
                }
                const animBgCheckbox = document.getElementById('cfg-animated-bg-enabled');
                if (animBgCheckbox && typeof cfg.animatedBgEnabled !== 'undefined') {
                    animBgCheckbox.checked = cfg.animatedBgEnabled;
                }
                const bgImgInput = document.getElementById('cfg-bg-img');
                if (bgImgInput && cfg.bgImg) {
                    bgImgInput.value = cfg.bgImg;
                }

                if (cfg.logoUrl) {
                    document.getElementById('logo-preview').src = cfg.logoUrl.replace(/^\/?assets\//, '../assets/');
                }
                if (cfg.canje) {
                    if (cfg.canje.title) document.getElementById('cfg-canje-title').value = cfg.canje.title;
                    if (cfg.canje.subtitle) document.getElementById('cfg-canje-subtitle').value = cfg.canje.subtitle;
                    if (cfg.canje.img) document.getElementById('cfg-canje-img').value = cfg.canje.img;
                }
                if (cfg.garantia) {
                    if (cfg.garantia.title1) document.getElementById('cfg-garantia-title1').value = cfg.garantia.title1;
                    if (cfg.garantia.title2) document.getElementById('cfg-garantia-title2').value = cfg.garantia.title2;
                    if (cfg.garantia.text) document.getElementById('cfg-garantia-text').value = cfg.garantia.text;
                    if (cfg.garantia.img) document.getElementById('cfg-garantia-img').value = cfg.garantia.img;
                }
                if (cfg.canje_inner) {
                    if (cfg.canje_inner.title) document.getElementById('cfg-canje-inner-title').value = cfg.canje_inner.title;
                    if (cfg.canje_inner.subtitle) document.getElementById('cfg-canje-inner-subtitle').value = cfg.canje_inner.subtitle;
                }
                if (cfg.garantia_inner) {
                    if (cfg.garantia_inner.title) document.getElementById('cfg-garantia-inner-title').value = cfg.garantia_inner.title;
                    if (cfg.garantia_inner.subtitle) document.getElementById('cfg-garantia-inner-subtitle').value = cfg.garantia_inner.subtitle;
                    if (cfg.garantia_inner.terms) document.getElementById('cfg-garantia-inner-terms').value = cfg.garantia_inner.terms;
                }
                updatePreviewFromInputs();
            } catch(e) {}
        }
        
        // Category Navigation Setup
        const catnavEnabled = document.getElementById('cfg-catnav-enabled');
        if (catnavEnabled) {
            catnavEnabled.checked = cfg.categoryNav && cfg.categoryNav.enabled !== undefined ? cfg.categoryNav.enabled : true;
        }
        
        const catnavContainer = document.getElementById('catnav-items-container');
        if (catnavContainer) {
            catnavContainer.innerHTML = '';
            const defaultItems = [
                { name: "iPhone", url: "catalogo.html?cat=iPhone", imgUrl: "https://www.apple.com/la/iphone/home/images/overview/chapternav/nav_iphone_17pro__b8rt659h2ogi_large.png", active: true },
                { name: "iPad", url: "catalogo.html?cat=iPad", imgUrl: "https://www.apple.com/assets-www/en_WW/ipad/03_chapternav/small/ipad_pro_bd732ab83_2x.png", active: true },
                { name: "MacBook", url: "catalogo.html?cat=MacBook", imgUrl: "https://www.apple.com/assets-www/en_WW/mac/04_chapternav/small/nav_mbp_0b36bc863_2x.png", active: true },
                { name: "Apple Watch", url: "catalogo.html?cat=Apple+Watch", imgUrl: "assets/nav_watch_real.png", active: true },
                { name: "Accesorios", url: "catalogo.html?cat=Accesorios", imgUrl: "https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/MTJV3?wid=200&hei=200&fmt=png-alpha", active: true },
                { name: "Samsung", url: "catalogo.html?cat=Samsung", imgUrl: "https://images.samsung.com/is/image/samsung/assets/ar/smartphones/galaxy-s24-ultra/buy/S24Ultra-Color-Titanium_Gray_MO.jpg", active: false }
            ];
            
            let items = defaultItems;
            if (cfg.categoryNav && cfg.categoryNav.items && cfg.categoryNav.items.length > 0) {
                items = cfg.categoryNav.items;
                // Si la configuraciÃ³n anterior no tenÃ­a Samsung, lo agregamos desactivado
                if (items.length === 5) {
                    items.push({ name: "Samsung", url: "catalogo.html?cat=Samsung", imgUrl: "https://images.samsung.com/is/image/samsung/assets/ar/smartphones/galaxy-s24-ultra/buy/S24Ultra-Color-Titanium_Gray_MO.jpg", active: false });
                }
            }
            
            items.forEach((item, index) => {
                const displayImgUrl = item.imgUrl.startsWith('assets/') ? '../' + item.imgUrl : item.imgUrl;
                const div = document.createElement('div');
                div.style = `display: flex; flex-wrap: wrap; gap: 10px; align-items: center; background: #2c2c2e; padding: 12px; border-radius: 8px; border: 1px solid ${item.active !== false ? '#444' : '#222'}; opacity: ${item.active !== false ? '1' : '0.6'};`;
                div.innerHTML = `
                    <div style="flex: 1 1 20%; text-align: center;"><img src="${displayImgUrl}" style="max-height:60px;max-width:100%;object-fit:contain;" onerror="this.style.display='none'"></div>
                    <div style="flex: 2 1 70%; display: flex; flex-direction: column; gap: 8px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                            <label style="color: #fff; font-size: 0.85rem; font-weight: normal; margin: 0; display: flex; align-items: center; cursor: pointer;">
                                <input type="checkbox" id="cfg-catnav-active-${index}" style="margin-right: 6px;" ${item.active !== false ? 'checked' : ''}>
                                Mostrar este Ã­cono en la pÃ¡gina
                            </label>
                        </div>
                        
                        <div>
                            <label style="font-size: 0.75rem; color: #aaa; margin-bottom: 2px; display: block;">1. Nombre de la categorÃ­a (ej. iPhone)</label>
                            <input type="text" id="cfg-catnav-name-${index}" class="admin-input" value="${item.name}" placeholder="Nombre" style="width: 100%;">
                        </div>
                        
                        <div>
                            <label style="font-size: 0.75rem; color: #aaa; margin-bottom: 2px; display: block;">2. Link / Enlace al que lleva (ej. catalogo.html?cat=iPhone)</label>
                            <input type="text" id="cfg-catnav-url-${index}" class="admin-input" value="${item.url}" placeholder="URL del Enlace" style="width: 100%;">
                        </div>
                        
                        <div>
                            <label style="font-size: 0.75rem; color: #aaa; margin-bottom: 2px; display: block;">3. Link directo de la Imagen (pega aquÃ­ el link de la foto)</label>
                            <div style="display: flex; gap: 8px;">
                                <input type="text" id="cfg-catnav-img-${index}" class="admin-input" value="${item.imgUrl}" placeholder="URL de la Imagen" style="width: 100%;">
                                <button class="btn btn-secondary" onclick="window.uploadAndCompressImage((base64) => { document.getElementById('cfg-catnav-img-${index}').value = base64; this.parentElement.parentElement.parentElement.querySelector('img').src = base64; })" style="padding: 0 12px; white-space: nowrap;">Subir Foto</button>
                            </div>
                        </div>
                    </div>
                `;
                catnavContainer.appendChild(div);
            });
        }

        const heroes = memoryProducts.filter(p => p.nombre === '__SYSTEM_HERO__');
        grid.innerHTML = '';

        // Show first active image in preview
        const activeHero = heroes.find(h => h.activo) || heroes[0];
        if (activeHero && activeHero.imagen && previewImg) {
            previewImg.src = activeHero.imagen.replace(/^\/?assets\//, '../assets/');
        }

        heroes.forEach(h => {
            const displayImg = h.imagen ? h.imagen.replace(/^\/?assets\//, '../assets/') : '';
            const div = document.createElement('div');
            div.style = `position: relative; border-radius: 8px; overflow: hidden; border: 3px solid ${h.activo ? '#5e5ce6' : '#333'}; cursor: pointer; aspect-ratio: 16/9; background: #000; transition: border-color 0.2s;`;
            div.innerHTML = `
                <img src="${displayImg}" style="width: 100%; height: 100%; object-fit: cover; opacity: ${h.activo ? '1' : '0.55'}; transition: opacity 0.2s;">
                <div style="position: absolute; top: 8px; left: 8px; background: ${h.activo ? '#5e5ce6' : 'rgba(0,0,0,0.5)'}; color: #fff; padding: 3px 10px; border-radius: 4px; font-size: 0.7rem; font-weight: bold;">${h.activo ? 'ï¿½S ACTIVA' : 'Inactiva'}</div>
                <button class="action-btn delete" style="position: absolute; top: 8px; right: 8px; padding: 5px; background: rgba(255,59,48,0.85); border:none; border-radius:6px;" onclick="event.stopPropagation(); window.deleteHero(${h.id})">
                    <svg viewBox="0 0 24 24" width="14" height="14" stroke="#fff" stroke-width="2.5" fill="none"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
            `;
            // Click toggles active state (allows multiple active)
            div.onclick = () => window.toggleHeroActive(h.id, h.activo);
            grid.appendChild(div);
        });
    };

    window.toggleHeroActive = async (id, currentState) => {
        await _supabase.from('products').update({ activo: !currentState }).eq('id', id);
        await fetchData();
    };

    window.deleteHero = async (id) => {
        if (!confirm('Â¿EstÃ¡s seguro de eliminar esta portada?')) return;
        await _supabase.from('products').delete().eq('id', id);
        await fetchData();
    };

    // Save settings (title, subtitle, font, logo)
    let _pendingLogoB64 = null;

    document.getElementById('btn-upload-logo').onclick = () => document.getElementById('logo-upload').click();
    document.getElementById('logo-upload').onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            _pendingLogoB64 = ev.target.result;
            document.getElementById('logo-preview').src = _pendingLogoB64;
        };
        reader.readAsDataURL(file);
    };

    document.getElementById('btn-save-hero-config').onclick = async (e) => {
        const btn = e.currentTarget;
        const originalHtml = btn.innerHTML;
        btn.innerHTML = `<svg class="spinner-icon" viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg> Guardando...`;
        btn.disabled = true;

        const cfg = {
            heroTitle: document.getElementById('cfg-hero-title').value,
            heroSubtitle: document.getElementById('cfg-hero-subtitle').value,
            heroFont: document.getElementById('cfg-hero-font').value,
            heroColor: document.getElementById('cfg-hero-color').value,
        };
        
        cfg.footer = {
            ig: document.getElementById('cfg-footer-ig').value.trim(),
            fb: document.getElementById('cfg-footer-fb').value.trim(),
            tt: document.getElementById('cfg-footer-tt').value.trim(),
            waNum: document.getElementById('cfg-footer-wa-num').value.trim(),
            waTxt: document.getElementById('cfg-footer-wa-txt').value.trim(),
            email: document.getElementById('cfg-footer-email').value.trim(),
            desc: document.getElementById('cfg-footer-desc').value.trim()
        };

        const animBgCheckbox = document.getElementById('cfg-animated-bg-enabled');
        if (animBgCheckbox) {
            cfg.animatedBgEnabled = animBgCheckbox.checked;
        }
        const bgImgInput = document.getElementById('cfg-bg-img');
        if (bgImgInput && bgImgInput.value.trim()) {
            cfg.bgImg = bgImgInput.value.trim();
        } else {
            cfg.bgImg = ""; // clear it
        }
        if (_pendingLogoB64) cfg.logoUrl = _pendingLogoB64;

        cfg.canje = {
            title: document.getElementById('cfg-canje-title').value.trim(),
            subtitle: document.getElementById('cfg-canje-subtitle').value.trim(),
            img: document.getElementById('cfg-canje-img').value.trim()
        };
        cfg.garantia = {
            title1: document.getElementById('cfg-garantia-title1').value.trim(),
            title2: document.getElementById('cfg-garantia-title2').value.trim(),
            text: document.getElementById('cfg-garantia-text').value.trim(),
            img: document.getElementById('cfg-garantia-img').value.trim()
        };
        
        cfg.canje_inner = {
            title: document.getElementById('cfg-canje-inner-title').value.trim(),
            subtitle: document.getElementById('cfg-canje-inner-subtitle').value.trim()
        };
        
        cfg.garantia_inner = {
            title: document.getElementById('cfg-garantia-inner-title').value.trim(),
            subtitle: document.getElementById('cfg-garantia-inner-subtitle').value.trim(),
            terms: document.getElementById('cfg-garantia-inner-terms').value.trim()
        };

        // Save Category Navigation
        const catnavEnabled = document.getElementById('cfg-catnav-enabled');
        if (catnavEnabled) {
            cfg.categoryNav = { enabled: catnavEnabled.checked, items: [] };
            for(let i=0; i<6; i++) {
                const nEl = document.getElementById(`cfg-catnav-name-${i}`);
                const uEl = document.getElementById(`cfg-catnav-url-${i}`);
                const iEl = document.getElementById(`cfg-catnav-img-${i}`);
                const actEl = document.getElementById(`cfg-catnav-active-${i}`);
                if (nEl && uEl && iEl) {
                    cfg.categoryNav.items.push({
                        name: nEl.value,
                        url: uEl.value,
                        imgUrl: iEl.value,
                        active: actEl ? actEl.checked : true
                    });
                }
            }
        }

        // Check if config record already exists
        const existing = memoryProducts.find(p => p.nombre === '__CONFIG_SETTINGS__');
        const payload = {
            nombre: '__CONFIG_SETTINGS__',
            categoria: 'Sistema',
            activo: false,
            precio_venta: 0,
            precio_costo: 0,
            stock: 0,
            notas: JSON.stringify(cfg)
        };
        if (existing) {
            // Preserve existing logoUrl if not uploading new
            if (!_pendingLogoB64) {
                try {
                    const prev = JSON.parse(existing.notas || '{}');
                    if (prev.logoUrl) cfg.logoUrl = prev.logoUrl;
                    payload.notas = JSON.stringify(cfg);
                } catch(e) {}
            }
            await _supabase.from('products').update(payload).eq('id', existing.id);
        } else {
            await _supabase.from('products').insert([payload]);
        }
        _pendingLogoB64 = null;
        await fetchData();
        
        btn.innerHTML = originalHtml;
        btn.disabled = false;
        showToast('ConfiguraciÃ³n guardada con Ã©xito', 'success');
    };

    window.showToast = function(message, type = 'success') {
        const toast = document.getElementById('admin-toast');
        if (!toast) return;
        toast.className = `admin-toast show ${type}`;
        let icon = '';
        if (type === 'success') icon = '<svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"></path></svg>';
        else if (type === 'error') icon = '<svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>';
        else if (type === 'loading') icon = '<svg class="spinner-icon" viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>';
        
        toast.innerHTML = `${icon} <span>${message}</span>`;
        
        setTimeout(() => {
            toast.className = toast.className.replace('show', '').trim();
        }, 3500);
    };

    // Upload new hero slide (keeps existing active ones)
    document.getElementById('btn-upload-hero').onclick = () => {
        document.getElementById('hero-gallery-upload').click();
    };

    document.getElementById('hero-gallery-upload').onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async (ev) => {
            const heroData = {
                nombre: '__SYSTEM_HERO__',
                categoria: 'Sistema',
                activo: true,
                imagen: ev.target.result,
                precio_venta: 0,
                precio_costo: 0,
                stock: 0
            };
            await _supabase.from('products').insert([heroData]);
            await fetchData();
        };
        reader.readAsDataURL(file);
    };

    // -- Listeners de Botones Abrir --
    document.getElementById('btn-add-product').onclick = () => {
        formProduct.reset();
        document.getElementById('prod-id').value = '';
        document.getElementById('prod-bestseller').checked = false;
        document.getElementById('prod-nuevo').checked = false;
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

    // -- Handlers de EnvÃ­o --
    formProduct.onsubmit = async (e) => {
        e.preventDefault();

        if (currentStockItems.length === 0) {
            alert("Debes agregar al menos una unidad en la grilla de stock.");
            return;
        }

        const id = document.getElementById('prod-id').value;
        const mainUnit = currentStockItems[0];
        const extraUnits = currentStockItems.slice(1);

        let finalNotas = mainUnit.notas || '';
        finalNotas = finalNotas.replace(/\[DESTACADO\]/g, '').replace(/\[NUEVO\]/g, '').trim();
        if (document.getElementById('prod-bestseller').checked) finalNotas += ' [DESTACADO]';
        if (document.getElementById('prod-nuevo').checked) finalNotas += ' [NUEVO]';
        finalNotas = finalNotas.trim();

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
            notas: finalNotas,
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
        if (!sel.value) {
            alert("Por favor, selecciona un producto.");
            return;
        }
        const opt = sel.options[sel.selectedIndex];
        const saleData = {
            producto_id: Number(sel.value),
            producto_nombre: opt.text.split('] ')[1] || opt.text,
            cantidad: Number(document.getElementById('sale-qty').value) || 1,
            precio_final: Number(document.getElementById('sale-price').value) || 0,
            precio_costo: Number(opt.dataset.cost) || 0,
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

    // LÃ³gica para mostrar/ocultar CondiciÃ³n de BaterÃ­a
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
    document.getElementById('prod-cat').onchange = (e) => {
        updateModelDropdown(e.target.value);
        updateColorDropdown(e.target.value);
    };
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
        document.getElementById('prod-bestseller').checked = p.notas && p.notas.includes('[DESTACADO]');
        document.getElementById('prod-nuevo').checked = p.notas && p.notas.includes('[NUEVO]');

        const subcatInputEdit = document.getElementById('prod-subcat');
        if (subcatInputEdit) {
            subcatInputEdit.value = p.subcategoria || 'Nuevo';
            subcatInputEdit.dispatchEvent(new Event('change'));
        }

        document.getElementById('prod-battery').value = p.battery || '';

        // Reset y Cargar Unidades en Stock (Variantes)
        const isWatch = p.categoria === 'Apple Watch';
        const isMeasure = p.almacenamiento && p.almacenamiento.includes('mm');
        currentStockItems = [{
            medida: isWatch && isMeasure ? p.almacenamiento : (p.medida || '-'),
            almacenamiento: isWatch && isMeasure ? '-' : (p.almacenamiento || '128GB'),
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

        // Location chips (Multi-select)
        const locationContainer = document.getElementById('container-location');
        if (locationContainer) {
            locationContainer.querySelectorAll('.chip, .chip-pill').forEach(c => c.classList.remove('active'));
            if (p.ubicacion) {
                const locs = p.ubicacion.split(',').map(s => s.trim());
                locs.forEach(loc => {
                    const chip = locationContainer.querySelector(`[data-val="${loc}"]`);
                    if (chip) chip.classList.add('active');
                });
            } else {
                const first = locationContainer.querySelector('.chip, .chip-pill');
                if (first) first.classList.add('active');
            }
            const hiddenInput = locationContainer.querySelector('input[type="hidden"]');
            if (hiddenInput) {
                const activeChips = Array.from(locationContainer.querySelectorAll('.active'));
                hiddenInput.value = activeChips.map(c => c.getAttribute('data-val')).join(', ');
                hiddenInput.dispatchEvent(new Event('change'));
            }
        }

        // Set name AFTER category is selected and dropdown is populated
        setTimeout(() => {
            document.getElementById('prod-name').value = p.nombre;
        }, 50);

        modalProduct.classList.remove('hidden');
    };

    // Inicializar carga de datos se moviÃ³ dentro de la verificaciÃ³n de sesiÃ³n
    // fetchData();

    // Fecha Header
    const mainSubtitle = document.getElementById('main-subtitle');
    if (mainSubtitle) mainSubtitle.textContent = new Date().toLocaleDateString('es-AR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    // ==============================================================================
    // CONFIGURACIï¿½N: SOBRE NOSOTROS
    // ==============================================================================
    window.renderNosotrosConfig = () => {
        let cfg = {};
        const configRec = memoryProducts.find(p => p.nombre === '__CONFIG_SETTINGS__');
        if (configRec && configRec.notas) {
            try { cfg = JSON.parse(configRec.notas); } catch(e) {}
        }
        const about = cfg.about || {};

        // Timeline
        const tlContainer = document.getElementById('nosotros-timeline-container');
        if (tlContainer) {
            tlContainer.innerHTML = '';
            const timelines = about.timeline || [
                {year: '2020', title: 'El Comienzo', desc: 'Iniciamos como un pequeÃ±o emprendimiento de entusiastas de Apple, conectando a usuarios con los mejores accesorios en marketplaces.'},
                {year: '2021', title: 'Presencia FÃ­sica', desc: 'Abrimos nuestro primer punto de atenciÃ³n en Tandil, consolidando la confianza y el retiro presencial de equipos.'}
            ];
            timelines.forEach(item => window.addTimelineRow(item.year, item.title, item.desc));
        }

        // Bento
        if (about.bento) {
            if (about.bento[0]) {
                document.getElementById('nosotros-bento-1-img').value = about.bento[0].img || '';
                document.getElementById('nosotros-bento-1-title').value = about.bento[0].title || '';
                document.getElementById('nosotros-bento-1-text').value = about.bento[0].desc || '';
            }
            if (about.bento[1]) {
                document.getElementById('nosotros-bento-2-icon').value = about.bento[1].icon || '';
                document.getElementById('nosotros-bento-2-title').value = about.bento[1].title || '';
                document.getElementById('nosotros-bento-2-text').value = about.bento[1].desc || '';
            }
            if (about.bento[2]) {
                document.getElementById('nosotros-bento-3-icon').value = about.bento[2].icon || '';
                document.getElementById('nosotros-bento-3-title').value = about.bento[2].title || '';
                document.getElementById('nosotros-bento-3-text').value = about.bento[2].desc || '';
            }
        }

        // Gallery
        const galContainer = document.getElementById('nosotros-gallery-container');
        if (galContainer) {
            galContainer.innerHTML = '';
            const gallery = about.gallery || [
                'assets/local-fzcases.jpg', 'assets/local-fzcases.jpg', 'assets/local-fzcases.jpg', 
                'assets/local-fzcases.jpg', 'assets/local-fzcases.jpg', 'assets/local-fzcases.jpg'
            ];
            gallery.forEach(url => window.addGalleryRow(url));
        }
    };

    window.addTimelineRow = (year = '', title = '', desc = '') => {
        const div = document.createElement('div');
        div.className = 'timeline-row';
        div.style = 'display: flex; gap: 10px; align-items: start; border-bottom: 1px solid #e5e5ea; padding-bottom: 10px;';
        div.innerHTML = `
            <input type="text" class="admin-input tl-year" placeholder="AÃ±o" value="${year}" style="width:80px;">
            <input type="text" class="admin-input tl-title" placeholder="TÃ­tulo" value="${title}" style="width:150px;">
            <textarea class="admin-input tl-desc" placeholder="DescripciÃ³n" style="flex:1; height:40px; resize:vertical;">${desc}</textarea>
            <button class="btn btn-secondary" style="background:#ffebee; color:#d32f2f; height: 40px;" onclick="this.parentElement.remove()">X</button>
        `;
        document.getElementById('nosotros-timeline-container').appendChild(div);
    };

    window.addGalleryRow = (url = '') => {
        const div = document.createElement('div');
        div.className = 'gallery-row';
        div.style = 'position:relative; background:#f5f5f7; padding:10px; border-radius:8px; border:1px solid #e5e5ea;';
        div.innerHTML = `
            <div style="display: flex; gap: 8px; margin-bottom: 10px;">
                <input type="text" class="admin-input gal-url" placeholder="URL Imagen" value="${url}" style="width:100%;" onchange="this.parentElement.nextElementSibling.src=this.value || 'assets/placeholder.jpg'">
                <button class="btn btn-secondary" onclick="window.uploadAndCompressImage((base64) => { this.previousElementSibling.value = base64; this.parentElement.nextElementSibling.src = base64; })" style="padding: 0 12px; white-space: nowrap;">Subir</button>
            </div>
            <img src="${url || 'assets/placeholder.jpg'}" style="width:100%; height:120px; object-fit:cover; border-radius:4px;" onerror="this.src='assets/placeholder.jpg'">
            <button class="btn btn-secondary" style="position:absolute; top:-10px; right:-10px; background:#ffebee; color:#d32f2f; border-radius:50%; width:30px; height:30px; padding:0; line-height:30px; text-align:center;" onclick="this.parentElement.remove()">X</button>
        `;
        document.getElementById('nosotros-gallery-container').appendChild(div);
    };

    const btnAddTimeline = document.getElementById('btn-add-timeline');
    if (btnAddTimeline) btnAddTimeline.onclick = () => window.addTimelineRow();

    const btnAddGallery = document.getElementById('btn-add-gallery-img');
    if (btnAddGallery) btnAddGallery.onclick = () => window.addGalleryRow();

    const btnSaveNosotros = document.getElementById('btn-save-nosotros');
    if (btnSaveNosotros) {
        btnSaveNosotros.onclick = async (e) => {
            const btn = e.currentTarget;
            btn.innerHTML = 'Guardando...';
            btn.disabled = true;

            const cfg = await getConfigSettings();
            
            const timelineRows = document.querySelectorAll('#nosotros-timeline-container .timeline-row');
            const timeline = Array.from(timelineRows).map(row => ({
                year: row.querySelector('.tl-year').value.trim(),
                title: row.querySelector('.tl-title').value.trim(),
                desc: row.querySelector('.tl-desc').value.trim()
            })).filter(t => t.title || t.desc);

            const bento = [
                {
                    img: document.getElementById('nosotros-bento-1-img').value.trim(),
                    title: document.getElementById('nosotros-bento-1-title').value.trim(),
                    desc: document.getElementById('nosotros-bento-1-text').value.trim()
                },
                {
                    icon: document.getElementById('nosotros-bento-2-icon').value.trim(),
                    title: document.getElementById('nosotros-bento-2-title').value.trim(),
                    desc: document.getElementById('nosotros-bento-2-text').value.trim()
                },
                {
                    icon: document.getElementById('nosotros-bento-3-icon').value.trim(),
                    title: document.getElementById('nosotros-bento-3-title').value.trim(),
                    desc: document.getElementById('nosotros-bento-3-text').value.trim()
                }
            ];

            const galleryRows = document.querySelectorAll('#nosotros-gallery-container .gallery-row');
            const gallery = Array.from(galleryRows).map(row => row.querySelector('.gal-url').value.trim()).filter(u => u);

            cfg.about = { timeline, bento, gallery };
            await saveConfigSettings(cfg);
            
            showToast('ConfiguraciÃ³n "Nosotros" guardada');
            btn.innerHTML = 'Guardar Cambios';
            btn.disabled = false;
        };
    }

});



