document.addEventListener("DOMContentLoaded", () => {
    const container = document.getElementById("alumni-container");
    const searchInput = document.getElementById("searchInput");
    const sortNameBtn = document.getElementById("sortName");
    const sortBatchBtn = document.getElementById("sortBatch");
    const loadMoreBtn = document.getElementById("loadMoreBtn"); 
    const filterPublicBtn = document.getElementById("filterPublic"); 
    
    // Grab the dropdown menus
    const universityFilter = document.getElementById("universityFilter");
    const batchFilter = document.getElementById("batchFilter");
    
    let alumniData = [];
    let currentDisplayData = []; 
    
    let itemsPerPage = 12; 
    let currentlyShowing = itemsPerPage;
    
    let isPublicFilterActive = false; 

   // FETCHING FROM YOUR LOCAL JSON FILE
   fetch("data.json")
        .then(response => response.json())
        .then(data => {
            const spinner = document.getElementById("loadingSpinner");
            if (spinner) spinner.style.display = "none"; 
            
            alumniData = data;
            currentDisplayData = [...alumniData]; 
            displayAlumni(currentDisplayData); 
            updateDashboard(alumniData); 
            populateDropdowns(alumniData); 
            
            // Trigger the smart map!
            plotAlumniOnMap(alumniData); 
        })
        .catch(error => {
            console.error("Error loading alumni data:", error);
            const spinner = document.getElementById("loadingSpinner");
            if (spinner) spinner.style.display = "none";
            
            if (container) {
                container.innerHTML = "<p class='error-msg'>Error loading data. Please try again later.</p>";
            }
        });

   // Automatically fill dropdowns with unique data
    function populateDropdowns(data) {
        if (!universityFilter || !batchFilter) return;

        universityFilter.innerHTML = '<option value="">🏫 All Institutions</option>';
        batchFilter.innerHTML = '<option value="">📅 All Batches</option>';

        const universities = [...new Set(data.map(a => a.university || a.college).filter(Boolean))].sort();
        universities.forEach(uni => {
            const option = document.createElement("option");
            option.value = uni;
            option.textContent = uni;
            universityFilter.appendChild(option);
        });

        const batches = [...new Set(data.map(a => a.sscBatch).filter(Boolean))].sort((a, b) => b - a);
        batches.forEach(batch => {
            const option = document.createElement("option");
            option.value = batch;
            option.textContent = batch;
            batchFilter.appendChild(option);
        });
    }

    function displayAlumni(data) {
        if (!container) return; 
        container.innerHTML = ""; 

        if (data.length === 0) {
            container.innerHTML = "<p class='empty-msg'>No alumni found matching your criteria.</p>";
            if(loadMoreBtn) loadMoreBtn.style.display = "none"; 
            return;
        }

        const dataToShow = data.slice(0, currentlyShowing);

        dataToShow.forEach(alumnus => {
            const card = document.createElement("div");
            
            if (alumnus.isDeveloper) {
                card.className = "alumni-card developer-card";
            } else {
                card.className = "alumni-card";
            }
            
            // SMART LOGIC: Group vs Department
            let studyLabel = "Department"; 
            let studyValue = alumnus.department || alumnus.group || "N/A"; 
            let lowerStudy = studyValue.toLowerCase();

            if (lowerStudy.includes("science") || lowerStudy.includes("commerce") || lowerStudy.includes("arts") || lowerStudy.includes("humanities") || lowerStudy.includes("business")) {
                studyLabel = "Group";
            }
            
            const emailButton = (alumnus.emailUser && alumnus.emailDomain) ? 
                `<button class="contact-btn" onclick="window.location.href='mailto:${alumnus.emailUser}@${alumnus.emailDomain}'">✉️ Email</button>` : "";

            const whatsappText = `Hello ${alumnus.name}, I am a current student. I found your profile on the Alumni Directory and would love to ask you a quick question!`;
            const whatsappButton = (alumnus.whatsappCode && alumnus.whatsappNum) ? 
                `<button class="whatsapp-btn" onclick="window.open('https://wa.me/${alumnus.whatsappCode}${alumnus.whatsappNum}?text=${encodeURIComponent(whatsappText)}', '_blank')">💬 WhatsApp</button>` : "";

            const callButton = (alumnus.phoneCode && alumnus.phoneNum) ? 
                `<button class="contact-btn call-btn" onclick="window.location.href='tel:${alumnus.phoneCode}${alumnus.phoneNum}'">📞 Call</button>` : "";

            const mentoringBadge = alumnus.mentoring ? `<div class="mentoring-badge"><span class="glow-dot"></span>Mentoring</div>` : "";
            const newArrivalBadge = alumnus.isNew ? `<div class="new-badge">✨ NEW</div>` : "";
            const publicTag = alumnus.isPublic ? `<span class="public-badge">🏛️ Public</span>` : "";
            const developerBadge = alumnus.isDeveloper ? `<div class="developer-badge">👨‍💻 Lead Developer</div><br>` : "";

            const institutionValue = alumnus.university || alumnus.college || "N/A";

            // --- SANITIZE STRINGS FOR BUTTONS ---
            const safeName = alumnus.name ? alumnus.name.replace(/'/g, "\\'") : "Alumnus";
            const safeUni = institutionValue ? institutionValue.replace(/'/g, "\\'") : "N/A";
            const safeDept = studyValue ? studyValue.replace(/'/g, "\\'") : "N/A";
            const safeBatch = alumnus.sscBatch || "N/A";
            const safeAdmission = alumnus.admissionYear || "N/A";
            const safePhoto = alumnus.photo || 'images/default-avatar.png';

            // --- ACTION BUTTONS (Share & Digital ID) ---
            const actionButtons = `
                <div class="card-action-buttons">
                    <button class="btn-share" onclick="shareProfile(this, '${safeName}', '${safeUni}')">🔗 Share</button>
                    <button class="btn-digital-id" onclick="generateIDCard('${safeName}', '${safePhoto}', '${safeUni}', '${safeDept}', '${safeBatch}', '${safeAdmission}', this)">🪪 Digital ID</button>
                </div>
            `;

            // --- FINAL HTML CONSTRUCTION ---
            card.innerHTML = `
                ${newArrivalBadge}
                ${mentoringBadge}
                <img src="${alumnus.photo}" alt="Photo of ${alumnus.name}" onerror="this.src='images/default-avatar.png'">
                <h2>${alumnus.name}</h2>
                ${developerBadge}
                <p><strong>Institution:</strong> ${institutionValue} ${publicTag}</p>
                <p><strong>${studyLabel}:</strong> ${studyValue}</p>
                <p><strong>Admission:</strong> ${alumnus.admissionYear}</p>
                <div class="badge">SSC Batch: ${alumnus.sscBatch}</div>
                <br>
                <div class="button-group">
                    ${emailButton}
                    ${whatsappButton}
                    ${callButton}
                </div>
                ${actionButtons} 
            `;

            container.appendChild(card);
        });

        if (loadMoreBtn) {
            if (currentlyShowing < data.length) {
                loadMoreBtn.style.display = "inline-block";
            } else {
                loadMoreBtn.style.display = "none";
            }
        }
    }

    // The Master Filter! Handles search bar AND dropdowns together.
    function applyFilters() {
        const searchString = searchInput ? searchInput.value.toLowerCase() : "";
        const selectedUni = universityFilter ? universityFilter.value : "";
        const selectedBatch = batchFilter ? batchFilter.value.toString() : "";

        let filteredData = isPublicFilterActive ? alumniData.filter(a => a.isPublic) : alumniData;

        currentDisplayData = filteredData.filter(alumnus => {
            const institution = (alumnus.university || alumnus.college || "");
            const name = (alumnus.name || "").toLowerCase();
            const batch = (alumnus.sscBatch || "").toString();

            const matchesSearch = name.includes(searchString) || institution.toLowerCase().includes(searchString) || batch.includes(searchString);
            const matchesUni = selectedUni === "" || institution === selectedUni;
            const matchesBatch = selectedBatch === "" || batch === selectedBatch;

            return matchesSearch && matchesUni && matchesBatch;
        });

        currentlyShowing = itemsPerPage; 
        displayAlumni(currentDisplayData); 
        plotAlumniOnMap(currentDisplayData); // Update Map with filtered results
    }

    // Event Listeners for Filters
    if (searchInput) searchInput.addEventListener("input", applyFilters);
    if (universityFilter) universityFilter.addEventListener("change", applyFilters);
    if (batchFilter) batchFilter.addEventListener("change", applyFilters);

    if (filterPublicBtn) {
        filterPublicBtn.addEventListener("click", () => {
            isPublicFilterActive = !isPublicFilterActive; 
            filterPublicBtn.classList.toggle("active-filter");
            applyFilters(); 
        });
    }

    if (loadMoreBtn) {
        loadMoreBtn.addEventListener("click", () => {
            currentlyShowing += itemsPerPage; 
            displayAlumni(currentDisplayData); 
        });
    }

    if (sortNameBtn) {
        sortNameBtn.addEventListener("click", () => {
            currentDisplayData.sort((a, b) => a.name.localeCompare(b.name));
            currentlyShowing = itemsPerPage; 
            displayAlumni(currentDisplayData);
        });
    }

    if (sortBatchBtn) {
        sortBatchBtn.addEventListener("click", () => {
            currentDisplayData.sort((a, b) => b.sscBatch - a.sscBatch);
            currentlyShowing = itemsPerPage; 
            displayAlumni(currentDisplayData);
        });
    }

    // --- DARK MODE LOGIC ---
    const darkModeToggle = document.getElementById("darkModeToggle");
    const body = document.body;

    if (darkModeToggle) {
        if (localStorage.getItem("theme") === "dark") {
            body.classList.add("dark-mode");
            darkModeToggle.textContent = "☀️"; 
        }

        darkModeToggle.addEventListener("click", () => {
            body.classList.toggle("dark-mode");
            if (body.classList.contains("dark-mode")) {
                darkModeToggle.textContent = "☀️";
                localStorage.setItem("theme", "dark");
            } else {
                darkModeToggle.textContent = "🌙";
                localStorage.setItem("theme", "light");
            }
        });
    }

    // --- SCROLL TO TOP LOGIC ---
    const scrollToTopBtn = document.getElementById("scrollToTopBtn");
    
    if (scrollToTopBtn) {
        window.addEventListener("scroll", () => {
            if (document.body.scrollTop > 300 || document.documentElement.scrollTop > 300) {
                scrollToTopBtn.style.display = "block";
            } else {
                scrollToTopBtn.style.display = "none";
            }
        });

        scrollToTopBtn.addEventListener("click", () => {
            window.scrollTo({ top: 0, behavior: "smooth" });
        });
    }

    function updateDashboard(data) {
        const totalAlumniElement = document.getElementById("total-alumni");
        const totalUniversitiesElement = document.getElementById("total-universities");
        const totalDepartmentsElement = document.getElementById("total-departments");

        const totalAlumni = data.length;
        const uniqueInstitutions = new Set(data.map(a => a.university || a.college).filter(Boolean)).size;
        const uniqueStudy = new Set(data.map(a => a.department || a.group).filter(Boolean)).size;

        if (totalAlumniElement) totalAlumniElement.textContent = totalAlumni;
        if (totalUniversitiesElement) totalUniversitiesElement.textContent = uniqueInstitutions;
        if (totalDepartmentsElement) totalDepartmentsElement.textContent = uniqueStudy;
    }
});

// --- SHARE PROFILE LOGIC ---
window.shareProfile = function(buttonElement, name, institution) {
    const websiteUrl = window.location.href.split('?')[0]; 
    const textToCopy = `Check out ${name} from ${institution} on our Alumni Directory! ${websiteUrl}`;
    
    navigator.clipboard.writeText(textToCopy).then(() => {
        const originalText = buttonElement.innerHTML;
        buttonElement.innerHTML = "✅ Copied!";
        buttonElement.classList.add("btn-success-state");
        
        setTimeout(() => {
            buttonElement.innerHTML = originalText;
            buttonElement.classList.remove("btn-success-state");
        }, 2000);
    });
};

// --- BKASH/NAGAD POP-UP LOGIC ---
document.addEventListener("DOMContentLoaded", () => {
    const paymentModal = document.getElementById("paymentModal");
    const supportBtn = document.getElementById("supportBtn");
    const closePaymentModal = document.getElementById("closePaymentModal");

    if (supportBtn && paymentModal && closePaymentModal) {
        supportBtn.addEventListener("click", () => {
            paymentModal.style.display = "flex";
        });

        closePaymentModal.addEventListener("click", () => {
            paymentModal.style.display = "none";
        });

        window.addEventListener("click", (e) => {
            if (e.target === paymentModal) {
                paymentModal.style.display = "none";
            }
        });
    }
});

window.copyPaymentNumber = function(number, buttonElement) {
    navigator.clipboard.writeText(number).then(() => {
        const originalText = buttonElement.innerHTML;
        buttonElement.innerHTML = "✅ Copied!";
        buttonElement.classList.add("btn-success-state");
        
        setTimeout(() => {
            buttonElement.innerHTML = originalText;
            buttonElement.classList.remove("btn-success-state");
        }, 2000);
    });
};

// --- PWA SERVICE WORKER REGISTRATION ---
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js')
            .then(reg => console.log('Service Worker Registered!', reg))
            .catch(err => console.error('Service Worker Registration Failed!', err));
    });
}

// ==========================================
// 🗺️ SMART AUTOMATIC MAP LOGIC (Clustered & Locked to BD)
// ==========================================

const bangladeshBounds = [
    [20.3, 87.8], 
    [26.9, 92.9]  
];

const map = L.map('alumniMap', {
    center: [23.6850, 90.3563],
    zoom: 7,
    minZoom: 6,
    maxBounds: bangladeshBounds,
    maxBoundsViscosity: 1.0
});

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

let markersGroup = L.markerClusterGroup({
    spiderfyOnMaxZoom: true,
    showCoverageOnHover: false,
    zoomToBoundsOnClick: true
});

map.addLayer(markersGroup);

let geoCache = JSON.parse(localStorage.getItem("geoCache")) || {
    "DEFAULT": [23.7500, 90.3900] 
};

const delay = ms => new Promise(res => setTimeout(res, ms));
window.plotAlumniOnMap = async function(data) {
    let mapContainer = document.getElementById('alumniMap');
    let mapLoadingOverlay = document.getElementById('mapLoadingOverlay');
    
    if (!mapLoadingOverlay && mapContainer) {
        mapLoadingOverlay = document.createElement('div');
        mapLoadingOverlay.id = 'mapLoadingOverlay';
        mapLoadingOverlay.className = 'map-loading-overlay';
        mapLoadingOverlay.innerHTML = `
            <div class="map-spinner"></div>
            <span class="map-overlay-text">Updating Map...</span>
        `;
        mapContainer.appendChild(mapLoadingOverlay);
    }
    
    if (mapLoadingOverlay) mapLoadingOverlay.style.display = 'flex';

    markersGroup.clearLayers();

    try {
        for (const alumnus of data) {
            const uniName = alumnus.university || alumnus.college;
            const locationName = alumnus.location || ""; 
            
            if (!uniName) continue;

            let searchQuery = locationName ? `${uniName}, ${locationName}` : `${uniName}, Bangladesh`;
            let coords = geoCache[searchQuery];

            if (!coords) {
                try {
                    await delay(1000); 
                    const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`);
                    const result = await response.json();

                    if (result && result.length > 0) {
                        coords = [parseFloat(result[0].lat), parseFloat(result[0].lon)];
                        geoCache[searchQuery] = coords; 
                        localStorage.setItem("geoCache", JSON.stringify(geoCache)); 
                    } else if (locationName) {
                        const fallbackQuery = locationName;
                        await delay(1000);
                        const fbResponse = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fallbackQuery)}`);
                        const fbResult = await fbResponse.json();
                        
                        if (fbResult && fbResult.length > 0) {
                            coords = [parseFloat(fbResult[0].lat), parseFloat(fbResult[0].lon)];
                            geoCache[searchQuery] = coords; 
                            localStorage.setItem("geoCache", JSON.stringify(geoCache));
                        }
                    }
                } catch (error) {
                    console.warn(`Could not find coordinates for: ${uniName}`);
                }
            }

            if (!coords) coords = geoCache["DEFAULT"];

            // Determine theme colors dynamically
            const pinBorderColor = alumnus.isDeveloper ? '#FFD700' : '#004aad'; 
            const pinNeedleColor = alumnus.isDeveloper ? '#FFD700' : '#004aad';
            const popupWrapperClass = alumnus.isDeveloper ? 'map-popup-container dev-popup' : 'map-popup-container';
            const popupImageBorder = alumnus.isDeveloper ? '#FFD700' : '#004aad';

            // HTML for custom map pin
            const customIcon = L.divIcon({
                className: 'custom-profile-pin',
                html: `
                    <div class="pin-img-wrapper" style="border-color: ${pinBorderColor};">
                        <img src="${alumnus.photo || 'images/default-avatar.png'}" class="pin-img" onerror="this.src='images/default-avatar.png'">
                    </div>
                    <div class="pin-needle" style="border-top-color: ${pinNeedleColor};"></div>
                `,
                iconSize: [46, 54], 
                iconAnchor: [23, 54], 
                popupAnchor: [0, -50] 
            });

            const marker = L.marker(coords, { icon: customIcon });
            
            // HTML for the map popup
            const popupContent = `
                <div class="${popupWrapperClass}">
                    <img src="${alumnus.photo || 'images/default-avatar.png'}" class="map-popup-img" style="border-color: ${popupImageBorder};" onerror="this.src='images/default-avatar.png'">
                    <br>
                    <strong class="map-popup-name" style="color: ${pinBorderColor};">${alumnus.name}</strong>
                    ${alumnus.isDeveloper ? '<div class="map-popup-dev-badge">👨‍💻 Lead Developer</div><br>' : ''}
                    <span class="map-popup-uni">${uniName}</span>
                    <span class="map-popup-batch">Batch: ${alumnus.sscBatch}</span>
                </div>
            `;

            marker.bindPopup(popupContent, {
                maxWidth: 220,     
                minWidth: 140,     
                autoPanPaddingTopLeft: [50, 50], 
                autoPanPaddingBottomRight: [50, 50]
            });

            markersGroup.addLayer(marker);
        }
    } finally {
        if (mapLoadingOverlay) {
            mapLoadingOverlay.style.display = 'none';
        }
    }
};

// ==========================================
// 🪪 DIGITAL ID CARD GENERATOR LOGIC
// ==========================================
// ==========================================
// 🪪 DIGITAL ID CARD GENERATOR LOGIC (WITH QR CODE)
// ==========================================
window.generateIDCard = function(name, photo, uni, dept, batch, admitted, buttonElement) {
    const originalText = buttonElement.innerHTML;
    buttonElement.innerHTML = "⏳ Generating...";
    buttonElement.disabled = true;
    buttonElement.style.opacity = "0.7";

    // 1. Populate text data
    document.getElementById('id-card-name').textContent = name;
    document.getElementById('id-card-uni').textContent = uni;
    document.getElementById('id-card-dept').textContent = dept;
    document.getElementById('id-card-batch').textContent = batch;
    document.getElementById('id-card-admitted').textContent = admitted;
    
    // 2. Generate the QR Code (Formats as a vCard so phones can save it as a contact!)
    const qrContainer = document.getElementById('id-card-qrcode');
    qrContainer.innerHTML = ""; // Clear any previous QR code
    
    const vCardData = `BEGIN:VCARD\nVERSION:3.0\nFN:${name}\nORG:${uni}\nNOTE:Dept: ${dept} | Batch: ${batch}\nEND:VCARD`;
    
  new QRCode(qrContainer, {
        text: vCardData,
        width: 45,   // Changed from 70 to make it smaller
        height: 45,  // Changed from 70 to make it smaller
        colorDark : "#004aad", 
        colorLight : "#ffffff",
        correctLevel : QRCode.CorrectLevel.L
    });

    // 3. Handle the Profile Photo
    const photoElement = document.getElementById('id-card-photo');
    photoElement.src = photo;

    photoElement.onload = function() {
        // Adding a tiny 100ms delay to ensure the QR code canvas finishes drawing
        setTimeout(takeScreenshotAndDownload, 100);
    };
    
    photoElement.onerror = function() {
        photoElement.src = 'images/default-avatar.png';
        setTimeout(takeScreenshotAndDownload, 100);
    };

    if (photoElement.complete) {
        setTimeout(takeScreenshotAndDownload, 100);
    }

    // 4. Capture and Download
    function takeScreenshotAndDownload() {
        const cardTemplate = document.getElementById('id-card-template');

        html2canvas(cardTemplate, {
            scale: 2, 
            useCORS: true, 
            backgroundColor: null 
        }).then(canvas => {
            const link = document.createElement('a');
            link.download = `${name.replace(/\s+/g, '_')}_Alumni_ID.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
            
            buttonElement.innerHTML = "✅ Downloaded!";
            buttonElement.classList.add("btn-success-state");
            
            setTimeout(() => {
                buttonElement.innerHTML = originalText;
                buttonElement.classList.remove("btn-success-state");
                buttonElement.style.opacity = "1";
                buttonElement.disabled = false;
            }, 2500);
        }).catch(err => {
            console.error("Error generating ID card:", err);
            buttonElement.innerHTML = "❌ Error";
            
            setTimeout(() => {
                buttonElement.innerHTML = originalText;
                buttonElement.style.opacity = "1";
                buttonElement.disabled = false;
            }, 2000);
        });
    }
};
