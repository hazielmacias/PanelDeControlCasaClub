// ========================================
// FIREBASE CONFIGURATION
// ========================================

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { 
    getFirestore, 
    collection, 
    getDocs, 
    onSnapshot,
    query,
    orderBy,
    deleteDoc,
    doc,
    limit,
    enableIndexedDbPersistence
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

const firebaseConfig = {
    apiKey: "AIzaSyClwvb8lXmsRyiTudeRyzca7ooN0r4q-So",
    authDomain: "casaclubpaneldecontrol.firebaseapp.com",
    projectId: "casaclubpaneldecontrol",
    storageBucket: "casaclubpaneldecontrol.firebasestorage.app",
    messagingSenderId: "531451798447",
    appId: "1:531451798447:web:e244172ce5c95f5e70855a",
    measurementId: "G-X5RSV4WY8X"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// OPTIMIZACIÓN: Habilitar caché local para reducir lecturas
enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
        console.warn('Persistencia no disponible: múltiples pestañas abiertas');
    } else if (err.code === 'unimplemented') {
        console.warn('Persistencia no soportada en este navegador');
    }
});

// ========================================
// CONFIGURACIÓN DE OPTIMIZACIÓN
// ========================================

let limiteCasaClub = 100; // Límite configurable
let limiteComedor = 100;  // Límite configurable

// ========================================
// COLLECTIONS
// ========================================

const CASA_CLUB_COLLECTION = 'casaClubRegistros';
const COMEDOR_COLLECTION = 'comedorRegistros';

// ========================================
// DOM ELEMENTS
// ========================================

const tablaCasaClub = document.getElementById('tablaCasaClub');
const tablaComedor = document.getElementById('tablaComedor');
const btnExportarCasaClub = document.getElementById('btnExportarCasaClub');
const btnExportarComedor = document.getElementById('btnExportarComedor');
const btnBorrarTodoCasaClub = document.getElementById('btnBorrarTodoCasaClub');
const btnBorrarTodoComedor = document.getElementById('btnBorrarTodoComedor');
const countCasaClub = document.getElementById('countCasaClub');
const countComedor = document.getElementById('countComedor');
const connectionStatus = document.getElementById('connectionStatus');
const selectLimiteCasa = document.getElementById('selectLimiteCasa');
const selectLimiteComedor = document.getElementById('selectLimiteComedor');

// Filters
const filtroNombreCasa = document.getElementById('filtroNombreCasa');
const filtroCategoriaCasa = document.getElementById('filtroCategoriaCasa');
const filtroNombreComedor = document.getElementById('filtroNombreComedor');
const filtroCategoriaComedor = document.getElementById('filtroCategoriaComedor');

// ========================================
// GLOBAL DATA STORAGE
// ========================================

let datosCasaClub = [];
let datosComedor = [];
let unsubscribeCasaClub = null;
let unsubscribeComedor = null;

// ========================================
// NAVIGATION HANDLING
// ========================================

document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        
        btn.classList.add('active');
        document.getElementById(btn.dataset.tab).classList.add('active');
    });
});

// ========================================
// DELETE FUNCTIONS - INDIVIDUAL
// ========================================

async function eliminarRegistroCasaClub(id) {
    if (!confirm('¿Estás seguro de que deseas eliminar este registro?')) {
        return;
    }
    
    try {
        await deleteDoc(doc(db, CASA_CLUB_COLLECTION, id));
        mostrarNotificacion('Registro eliminado correctamente', 'success');
    } catch (error) {
        console.error('Error eliminando registro:', error);
        mostrarNotificacion('Error al eliminar el registro', 'error');
    }
}

async function eliminarRegistroComedor(id) {
    if (!confirm('¿Estás seguro de que deseas eliminar este registro?')) {
        return;
    }
    
    try {
        await deleteDoc(doc(db, COMEDOR_COLLECTION, id));
        mostrarNotificacion('Registro eliminado correctamente', 'success');
    } catch (error) {
        console.error('Error eliminando registro:', error);
        mostrarNotificacion('Error al eliminar el registro', 'error');
    }
}

// ========================================
// DELETE FUNCTIONS - BULK DELETE
// ========================================

async function borrarTodosCasaClub() {
    const confirmacion = prompt(
        '⚠️ ADVERTENCIA: Esta acción eliminará TODOS los registros de Casa Club.\n\n' +
        'Para confirmar, escribe la palabra: BORRAR\n\n' +
        '(Esta acción no se puede deshacer)'
    );
    
    if (confirmacion === null) {
        return;
    }
    
    if (confirmacion.toUpperCase() !== 'BORRAR') {
        mostrarNotificacion('Operación cancelada. Debes escribir "BORRAR" exactamente.', 'error');
        return;
    }
    
    try {
        const batchSize = 100;
        let totalEliminados = 0;
        
        mostrarNotificacion('Iniciando eliminación masiva...', 'success');
        
        while (true) {
            const q = query(collection(db, CASA_CLUB_COLLECTION), limit(batchSize));
            const querySnapshot = await getDocs(q);
            
            if (querySnapshot.empty) {
                break;
            }
            
            const promesas = querySnapshot.docs.map(documento => 
                deleteDoc(doc(db, CASA_CLUB_COLLECTION, documento.id))
            );
            
            await Promise.all(promesas);
            totalEliminados += querySnapshot.size;
            
            mostrarNotificacion(`Eliminados ${totalEliminados} registros...`, 'success');
        }
        
        mostrarNotificacion(`✅ Total eliminados: ${totalEliminados} registros`, 'success');
        
    } catch (error) {
        console.error('Error eliminando todos los registros:', error);
        mostrarNotificacion('Error al eliminar los registros. Intenta nuevamente.', 'error');
    }
}

async function borrarTodosComedor() {
    const confirmacion = prompt(
        '⚠️ ADVERTENCIA: Esta acción eliminará TODOS los registros del Comedor.\n\n' +
        'Para confirmar, escribe la palabra: BORRAR\n\n' +
        '(Esta acción no se puede deshacer)'
    );
    
    if (confirmacion === null) {
        return;
    }
    
    if (confirmacion.toUpperCase() !== 'BORRAR') {
        mostrarNotificacion('Operación cancelada. Debes escribir "BORRAR" exactamente.', 'error');
        return;
    }
    
    try {
        const batchSize = 100;
        let totalEliminados = 0;
        
        mostrarNotificacion('Iniciando eliminación masiva...', 'success');
        
        while (true) {
            const q = query(collection(db, COMEDOR_COLLECTION), limit(batchSize));
            const querySnapshot = await getDocs(q);
            
            if (querySnapshot.empty) {
                break;
            }
            
            const promesas = querySnapshot.docs.map(documento => 
                deleteDoc(doc(db, COMEDOR_COLLECTION, documento.id))
            );
            
            await Promise.all(promesas);
            totalEliminados += querySnapshot.size;
            
            mostrarNotificacion(`Eliminados ${totalEliminados} registros...`, 'success');
        }
        
        mostrarNotificacion(`✅ Total eliminados: ${totalEliminados} registros`, 'success');
        
    } catch (error) {
        console.error('Error eliminando todos los registros:', error);
        mostrarNotificacion('Error al eliminar los registros. Intenta nuevamente.', 'error');
    }
}

// ========================================
// REAL-TIME LISTENERS - CON LÍMITE CONFIGURABLE
// ========================================

function configurarListenersCasaClub() {
    // Cancelar listener anterior si existe
    if (unsubscribeCasaClub) {
        unsubscribeCasaClub();
    }
    
    const limite = limiteCasaClub === 0 ? 10000 : limiteCasaClub; // 0 = "todos" (máximo 10000)
    
    const q = query(
        collection(db, CASA_CLUB_COLLECTION), 
        orderBy('timestamp', 'desc'),
        limit(limite)
    );
    
    unsubscribeCasaClub = onSnapshot(q, (snapshot) => {
        console.log(`📊 Casa Club - Documentos recibidos: ${snapshot.docs.length} (límite: ${limiteCasaClub === 0 ? 'todos' : limiteCasaClub})`);
        
        datosCasaClub = [];
        snapshot.forEach((doc) => {
            datosCasaClub.push({ id: doc.id, ...doc.data() });
        });
        
        aplicarFiltrosCasaClub();
        updateConnectionStatus(true);
    }, (error) => {
        console.error('Error en listener Casa Club:', error);
        updateConnectionStatus(false);
    });
    
    console.log(`✅ Listener Casa Club configurado (límite: ${limiteCasaClub === 0 ? 'todos' : limiteCasaClub})`);
}

function configurarListenersComedor() {
    // Cancelar listener anterior si existe
    if (unsubscribeComedor) {
        unsubscribeComedor();
    }
    
    const limite = limiteComedor === 0 ? 10000 : limiteComedor;
    
    const q = query(
        collection(db, COMEDOR_COLLECTION), 
        orderBy('timestamp', 'desc'),
        limit(limite)
    );
    
    unsubscribeComedor = onSnapshot(q, (snapshot) => {
        console.log(`📊 Comedor - Documentos recibidos: ${snapshot.docs.length} (límite: ${limiteComedor === 0 ? 'todos' : limiteComedor})`);
        
        datosComedor = [];
        snapshot.forEach((doc) => {
            datosComedor.push({ id: doc.id, ...doc.data() });
        });
        
        aplicarFiltrosComedor();
        updateConnectionStatus(true);
    }, (error) => {
        console.error('Error en listener Comedor:', error);
        updateConnectionStatus(false);
    });
    
    console.log(`✅ Listener Comedor configurado (límite: ${limiteComedor === 0 ? 'todos' : limiteComedor})`);
}

// ========================================
// CAMBIO DE LÍMITE
// ========================================

selectLimiteCasa.addEventListener('change', (e) => {
    const nuevoLimite = parseInt(e.target.value);
    limiteCasaClub = nuevoLimite;
    
    console.log(`🔄 Cambiando límite Casa Club a: ${nuevoLimite === 0 ? 'todos' : nuevoLimite}`);
    
    if (nuevoLimite === 0) {
        mostrarNotificacion('⚠️ Cargando TODOS los registros. Esto puede consumir muchas lecturas.', 'error');
    }
    
    configurarListenersCasaClub();
});

selectLimiteComedor.addEventListener('change', (e) => {
    const nuevoLimite = parseInt(e.target.value);
    limiteComedor = nuevoLimite;
    
    console.log(`🔄 Cambiando límite Comedor a: ${nuevoLimite === 0 ? 'todos' : nuevoLimite}`);
    
    if (nuevoLimite === 0) {
        mostrarNotificacion('⚠️ Cargando TODOS los registros. Esto puede consumir muchas lecturas.', 'error');
    }
    
    configurarListenersComedor();
});

// ========================================
// CONNECTION STATUS
// ========================================

function updateConnectionStatus(connected) {
    if (connectionStatus) {
        connectionStatus.style.background = connected ? '#10B981' : '#EF4444';
        connectionStatus.parentElement.style.background = connected 
            ? 'rgba(16, 185, 129, 0.1)' 
            : 'rgba(239, 68, 68, 0.1)';
        connectionStatus.nextElementSibling.textContent = connected 
            ? 'Conectado a Firebase' 
            : 'Desconectado';
        connectionStatus.nextElementSibling.style.color = connected ? '#10B981' : '#EF4444';
    }
}

// ========================================
// RENDER TABLE - CASA CLUB
// ========================================

function renderizarTablaCasaClub(datos) {
    const totalMostrado = datos.length;
    const limiteTexto = limiteCasaClub === 0 ? 'todos' : limiteCasaClub;
    const textoLimite = limiteCasaClub > 0 && totalMostrado >= limiteCasaClub 
        ? ` (mostrando últimos ${limiteTexto})` 
        : '';
    
    countCasaClub.textContent = `${totalMostrado} ${totalMostrado === 1 ? 'registro' : 'registros'}${textoLimite}`;
    
    if (datos.length === 0) {
        tablaCasaClub.innerHTML = `
            <tr>
                <td colspan="8">
                    <div class="table-empty">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                            <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                        </svg>
                        <p>No hay registros disponibles</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    tablaCasaClub.innerHTML = datos.map(registro => {
        const estadoActivo = registro.horaSalida;
        const badgeEstado = estadoActivo 
            ? '<span class="badge-completed">Completado</span>'
            : '<span class="badge-active">En instalaciones</span>';
        
        return `
            <tr>
                <td class="td-nombre">${registro.nombre || ''}</td>
                <td class="td-categoria">
                    <span class="badge-category-casa">
                        ${registro.categoria || ''}
                    </span>
                </td>
                <td class="td-celular">${registro.celular || ''}</td>
                <td class="td-motivo">${registro.motivo || ''}</td>
                <td class="td-hora td-entrada">${registro.horaEntrada || ''}</td>
                <td class="td-hora td-salida">${registro.horaSalida || '—'}</td>
                <td class="td-estado">${badgeEstado}</td>
                <td class="td-actions">
                    <button class="btn-delete" onclick="eliminarRegistroCasaClub('${registro.id}')" title="Eliminar registro">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            <line x1="10" y1="11" x2="10" y2="17"></line>
                            <line x1="14" y1="11" x2="14" y2="17"></line>
                        </svg>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

// ========================================
// RENDER TABLE - COMEDOR
// ========================================

function renderizarTablaComedor(datos) {
    const totalMostrado = datos.length;
    const limiteTexto = limiteComedor === 0 ? 'todos' : limiteComedor;
    const textoLimite = limiteComedor > 0 && totalMostrado >= limiteComedor 
        ? ` (mostrando últimos ${limiteTexto})` 
        : '';
    
    countComedor.textContent = `${totalMostrado} ${totalMostrado === 1 ? 'registro' : 'registros'}${textoLimite}`;
    
    if (datos.length === 0) {
        tablaComedor.innerHTML = `
            <tr>
                <td colspan="4">
                    <div class="table-empty">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                            <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                        </svg>
                        <p>No hay registros disponibles</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    tablaComedor.innerHTML = datos.map(registro => `
        <tr>
            <td class="td-nombre">${registro.nombre || ''}</td>
            <td class="td-categoria">
                <span class="badge-category-comedor">
                    ${registro.categoria || ''}
                </span>
            </td>
            <td class="td-hora">${registro.horaEntrada || ''}</td>
            <td class="td-actions">
                <button class="btn-delete" onclick="eliminarRegistroComedor('${registro.id}')" title="Eliminar registro">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        <line x1="10" y1="11" x2="10" y2="17"></line>
                        <line x1="14" y1="11" x2="14" y2="17"></line>
                    </svg>
                </button>
            </td>
        </tr>
    `).join('');
}

// ========================================
// FILTERS
// ========================================

function aplicarFiltrosCasaClub() {
    let datos = [...datosCasaClub];
    const nombre = filtroNombreCasa.value.toLowerCase();
    const categoria = filtroCategoriaCasa.value;
    
    if (nombre) {
        datos = datos.filter(r => r.nombre && r.nombre.toLowerCase().includes(nombre));
    }
    
    if (categoria) {
        datos = datos.filter(r => r.categoria === categoria);
    }
    
    renderizarTablaCasaClub(datos);
}

function aplicarFiltrosComedor() {
    let datos = [...datosComedor];
    const nombre = filtroNombreComedor.value.toLowerCase();
    const categoria = filtroCategoriaComedor.value;
    
    if (nombre) {
        datos = datos.filter(r => r.nombre && r.nombre.toLowerCase().includes(nombre));
    }
    
    if (categoria) {
        datos = datos.filter(r => r.categoria === categoria);
    }
    
    renderizarTablaComedor(datos);
}

filtroNombreCasa.addEventListener('input', aplicarFiltrosCasaClub);
filtroCategoriaCasa.addEventListener('change', aplicarFiltrosCasaClub);
filtroNombreComedor.addEventListener('input', aplicarFiltrosComedor);
filtroCategoriaComedor.addEventListener('change', aplicarFiltrosComedor);

// ========================================
// ERROR DISPLAY
// ========================================

function mostrarError(seccion) {
    const mensaje = `
        <tr>
            <td colspan="${seccion === 'Casa Club' ? '8' : '4'}">
                <div class="table-empty">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                    <p>Error al cargar datos. Verifica tu conexión.</p>
                </div>
            </td>
        </tr>
    `;
    
    if (seccion === 'Casa Club') {
        tablaCasaClub.innerHTML = mensaje;
    } else {
        tablaComedor.innerHTML = mensaje;
    }
}

// ========================================
// NOTIFICATIONS
// ========================================

function mostrarNotificacion(mensaje, tipo) {
    const notif = document.createElement('div');
    notif.className = `notification ${tipo}`;
    notif.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            ${tipo === 'success' 
                ? '<polyline points="20 6 9 17 4 12"></polyline>' 
                : '<circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line>'}
        </svg>
        <span>${mensaje}</span>
    `;
    
    document.body.appendChild(notif);
    
    setTimeout(() => {
        notif.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notif.remove(), 300);
    }, 3000);
}

// ========================================
// EXPORT TO PDF - CASA CLUB
// ========================================

btnExportarCasaClub.addEventListener('click', async () => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    if (datosCasaClub.length === 0) {
        alert('No hay datos para exportar');
        return;
    }
    
    const logoUrl = 'https://cdn.shopify.com/s/files/1/0763/5392/9451/files/03_TEOTIHUACAN_-_Fuerzas_Basicas.png?v=1749841591';
    
    try {
        doc.addImage(logoUrl, 'PNG', 15, 10, 40, 20);
        
        doc.setFontSize(20);
        doc.setTextColor(44, 62, 80);
        doc.text('Reporte Casa Club', 70, 20);
        
        doc.setFontSize(10);
        doc.setTextColor(127, 140, 141);
        const fecha = new Date().toLocaleDateString('es-MX', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        doc.text(`Generado: ${fecha}`, 70, 27);
        doc.text(`Total: ${datosCasaClub.length} registros`, 70, 32);
        
        const datosTabla = datosCasaClub.map(r => [
            r.nombre || '',
            r.categoria || '',
            r.celular || '',
            (r.motivo || '').substring(0, 40) + ((r.motivo || '').length > 40 ? '...' : ''),
            r.horaSalida || '—',
            r.horaEntrada || ''
        ]);
        
        doc.autoTable({
            startY: 42,
            head: [['Nombre', 'Categoría', 'Celular', 'Destino', 'Salida', 'Entrada']],
            body: datosTabla,
            theme: 'striped',
            headStyles: {
                fillColor: [44, 62, 80],
                textColor: [255, 255, 255],
                fontSize: 10,
                fontStyle: 'bold',
                halign: 'center'
            },
            bodyStyles: {
                fontSize: 9,
                textColor: [44, 62, 80]
            },
            alternateRowStyles: {
                fillColor: [236, 240, 241]
            }
        });
        
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(127, 140, 141);
            doc.text(
                `Página ${i} de ${pageCount}`,
                doc.internal.pageSize.getWidth() / 2,
                doc.internal.pageSize.getHeight() - 10,
                { align: 'center' }
            );
            doc.text(
                'Teotihuacán Fuerzas Básicas © 2025',
                doc.internal.pageSize.getWidth() / 2,
                doc.internal.pageSize.getHeight() - 5,
                { align: 'center' }
            );
        }
        
        doc.save(`Casa_Club_${new Date().toISOString().split('T')[0]}.pdf`);
        
        mostrarNotificacion('PDF generado correctamente', 'success');
        
    } catch (error) {
        console.error('Error al generar PDF:', error);
        mostrarNotificacion('Error al generar el PDF. Intenta nuevamente.', 'error');
    }
});

// ========================================
// EXPORT TO PDF - COMEDOR
// ========================================

btnExportarComedor.addEventListener('click', async () => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    if (datosComedor.length === 0) {
        alert('No hay datos para exportar');
        return;
    }
    
    const logoUrl = 'https://cdn.shopify.com/s/files/1/0763/5392/9451/files/03_TEOTIHUACAN_-_Fuerzas_Basicas.png?v=1749841591';
    
    try {
        doc.addImage(logoUrl, 'PNG', 15, 10, 40, 20);
        
        doc.setFontSize(20);
        doc.setTextColor(44, 62, 80);
        doc.text('Reporte Comedor', 70, 20);
        
        doc.setFontSize(10);
        doc.setTextColor(127, 140, 141);
        const fecha = new Date().toLocaleDateString('es-MX', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        doc.text(`Generado: ${fecha}`, 70, 27);
        doc.text(`Total: ${datosComedor.length} registros`, 70, 32);
        
        const datosTabla = datosComedor.map(r => [
            r.nombre || '',
            r.categoria || '',
            r.horaEntrada || ''
        ]);
        
        doc.autoTable({
            startY: 42,
            head: [['Nombre', 'Categoría', 'Hora de Entrada']],
            body: datosTabla,
            theme: 'striped',
            headStyles: {
                fillColor: [44, 62, 80],
                textColor: [255, 255, 255],
                fontSize: 11,
                fontStyle: 'bold',
                halign: 'center'
            },
            bodyStyles: {
                fontSize: 10,
                textColor: [44, 62, 80]
            },
            alternateRowStyles: {
                fillColor: [236, 240, 241]
            }
        });
        
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(127, 140, 141);
            doc.text(
                `Página ${i} de ${pageCount}`,
                doc.internal.pageSize.getWidth() / 2,
                doc.internal.pageSize.getHeight() - 10,
                { align: 'center' }
            );
            doc.text(
                'Teotihuacán Fuerzas Básicas © 2025',
                doc.internal.pageSize.getWidth() / 2,
                doc.internal.pageSize.getHeight() - 5,
                { align: 'center' }
            );
        }
        
        doc.save(`Comedor_${new Date().toISOString().split('T')[0]}.pdf`);
        
        mostrarNotificacion('PDF generado correctamente', 'success');
        
    } catch (error) {
        console.error('Error al generar PDF:', error);
        mostrarNotificacion('Error al generar el PDF. Intenta nuevamente.', 'error');
    }
});

// ========================================
// EVENT LISTENERS FOR DELETE ALL BUTTONS
// ========================================

btnBorrarTodoCasaClub.addEventListener('click', borrarTodosCasaClub);
btnBorrarTodoComedor.addEventListener('click', borrarTodosComedor);

// ========================================
// MAKE FUNCTIONS GLOBAL FOR ONCLICK
// ========================================

window.eliminarRegistroCasaClub = eliminarRegistroCasaClub;
window.eliminarRegistroComedor = eliminarRegistroComedor;

// ========================================
// INITIALIZATION
// ========================================

document.addEventListener('DOMContentLoaded', async () => {
    try {
        console.log('🚀 Iniciando aplicación OPTIMIZADA...');
        console.log(`📊 Límite inicial: ${limiteCasaClub} registros`);
        
        updateConnectionStatus(true);
        
        configurarListenersCasaClub();
        configurarListenersComedor();
        
        console.log('Sistema iniciado');
        mostrarNotificacion('Sistema iniciado correctamente', 'success');
        
    } catch (error) {
        console.error('❌ Error en inicialización:', error);
        updateConnectionStatus(false);
        mostrarNotificacion('Error al iniciar el sistema', 'error');
    }
});
