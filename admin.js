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
    orderBy 
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
const countCasaClub = document.getElementById('countCasaClub');
const countComedor = document.getElementById('countComedor');
const connectionStatus = document.getElementById('connectionStatus');

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
// FIREBASE DATA FETCHING
// ========================================

async function cargarDatosCasaClub() {
    try {
        const q = query(collection(db, CASA_CLUB_COLLECTION), orderBy('timestamp', 'desc'));
        const querySnapshot = await getDocs(q);
        
        datosCasaClub = [];
        querySnapshot.forEach((doc) => {
            datosCasaClub.push({ id: doc.id, ...doc.data() });
        });
        
        aplicarFiltrosCasaClub();
    } catch (error) {
        console.error('Error cargando Casa Club:', error);
        mostrarError('Casa Club');
    }
}

async function cargarDatosComedor() {
    try {
        const q = query(collection(db, COMEDOR_COLLECTION), orderBy('timestamp', 'desc'));
        const querySnapshot = await getDocs(q);
        
        datosComedor = [];
        querySnapshot.forEach((doc) => {
            datosComedor.push({ id: doc.id, ...doc.data() });
        });
        
        aplicarFiltrosComedor();
    } catch (error) {
        console.error('Error cargando Comedor:', error);
        mostrarError('Comedor');
    }
}

// ========================================
// REAL-TIME LISTENERS
// ========================================

function configurarListenersCasaClub() {
    const q = query(collection(db, CASA_CLUB_COLLECTION), orderBy('timestamp', 'desc'));
    
    onSnapshot(q, (snapshot) => {
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
}

function configurarListenersComedor() {
    const q = query(collection(db, COMEDOR_COLLECTION), orderBy('timestamp', 'desc'));
    
    onSnapshot(q, (snapshot) => {
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
}

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
    countCasaClub.textContent = `${datos.length} ${datos.length === 1 ? 'registro' : 'registros'}`;
    
    if (datos.length === 0) {
        tablaCasaClub.innerHTML = `
            <tr>
                <td colspan="7">
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
        const estadoActivo = !registro.horaSalida;
        const badgeEstado = estadoActivo 
            ? '<span style="display: inline-block; padding: 6px 14px; background: #FEF3C7; color: #92400E; border-radius: 6px; font-size: 0.8rem; font-weight: 600;">En instalaciones</span>'
            : '<span style="display: inline-block; padding: 6px 14px; background: #D1FAE5; color: #065F46; border-radius: 6px; font-size: 0.8rem; font-weight: 600;">Completado</span>';
        
        return `
            <tr>
                <td style="font-weight: 600; color: #1F2937;">${registro.nombre || ''}</td>
                <td>
                    <span style="display: inline-block; padding: 5px 12px; background: #E67E22; color: white; border-radius: 6px; font-size: 0.85rem; font-weight: 600;">
                        ${registro.categoria || ''}
                    </span>
                </td>
                <td style="color: #6B7280;">${registro.celular || ''}</td>
                <td style="color: #4B5563; max-width: 300px;">${registro.motivo || ''}</td>
                <td style="font-weight: 500; color: #059669;">${registro.horaEntrada || ''}</td>
                <td style="font-weight: 500; color: ${estadoActivo ? '#9CA3AF' : '#DC2626'};">
                    ${registro.horaSalida || '—'}
                </td>
                <td>${badgeEstado}</td>
            </tr>
        `;
    }).join('');
}

// ========================================
// RENDER TABLE - COMEDOR
// ========================================

function renderizarTablaComedor(datos) {
    countComedor.textContent = `${datos.length} ${datos.length === 1 ? 'registro' : 'registros'}`;
    
    if (datos.length === 0) {
        tablaComedor.innerHTML = `
            <tr>
                <td colspan="3">
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
            <td style="font-weight: 600; color: #1F2937;">${registro.nombre || ''}</td>
            <td>
                <span style="display: inline-block; padding: 5px 12px; background: #10B981; color: white; border-radius: 6px; font-size: 0.85rem; font-weight: 600;">
                    ${registro.categoria || ''}
                </span>
            </td>
            <td style="font-weight: 500; color: #059669;">${registro.horaEntrada || ''}</td>
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
            <td colspan="${seccion === 'Casa Club' ? '7' : '3'}">
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
            r.horaEntrada || '',
            r.horaSalida || 'Activo'
        ]);
        
        doc.autoTable({
            startY: 42,
            head: [['Nombre', 'Categoría', 'Celular', 'Destino', 'Entrada', 'Salida']],
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
        
    } catch (error) {
        console.error('Error al generar PDF:', error);
        alert('Error al generar el PDF. Intenta nuevamente.');
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
        
    } catch (error) {
        console.error('Error al generar PDF:', error);
        alert('Error al generar el PDF. Intenta nuevamente.');
    }
});

// ========================================
// INITIALIZATION
// ========================================

document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Load initial data
        await Promise.all([
            cargarDatosCasaClub(),
            cargarDatosComedor()
        ]);
        
        // Configure real-time listeners
        configurarListenersCasaClub();
        configurarListenersComedor();
        
        updateConnectionStatus(true);
    } catch (error) {
        console.error('Error en inicialización:', error);
        updateConnectionStatus(false);
    }
});