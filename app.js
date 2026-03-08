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
            // Hides the spinner when data successfully loads
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
                container.innerHTML = "<p style='text-align:center; color:red; width:100%;'>Error loading data. Please try again later.</p>";
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
            container.innerHTML = "<p style='text-align:center; color:#666; width:100%;'>No alumni found matching your criteria.</p>";
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
                `<button class="contact-btn" style="background-color: #059669; color: white; border-color: #059669;" onclick="window.location.href='tel:${alumnus.phoneCode}${alumnus.phoneNum}'">📞 Call</button>` : "";

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
                <div style="display: flex; gap: 10px; margin-top: 15px;">
                    <button class="share-btn" style="flex: 1;" onclick="shareProfile(this, '${safeName}', '${safeUni}')">🔗 Share</button>
                    <button class="share-btn" style="flex: 1; background-color: #10b981; color: white; border-color: #10b981;" onclick="generateIDCard('${safeName}', '${safePhoto}', '${safeUni}', '${safeDept}', '${safeBatch}', '${safeAdmission}', this)">🪪 Digital ID</button>
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
            if (isPublicFilterActive) {
                filterPublicBtn.style.backgroundColor = "#004aad";
                filterPublicBtn.style.color = "white";
            } else {
                filterPublicBtn.style.backgroundColor = "";
                filterPublicBtn.style.color = "";
            }
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
        buttonElement.style.backgroundColor = "#25D366";
        buttonElement.style.color = "white";
        buttonElement.style.borderColor = "#25D366";
        
        setTimeout(() => {
            buttonElement.innerHTML = originalText;
            buttonElement.style.backgroundColor = "";
            buttonElement.style.color = "";
            buttonElement.style.borderColor = "";
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
        buttonElement.style.backgroundColor = "#25D366";
        buttonElement.style.color = "white";
        buttonElement.style.borderColor = "#25D366";
        
        setTimeout(() => {
            buttonElement.innerHTML = originalText;
            buttonElement.style.backgroundColor = "transparent";
            buttonElement.style.color = "";
            buttonElement.style.borderColor = "";
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

// 1. Draw a fence around Bangladesh (Southwest corner, Northeast corner)
const bangladeshBounds = [
    [20.3, 87.8], 
    [26.9, 92.9]  
];

const map = L.map('alumniMap', {
    center: [23.6850, 90.3563],
    zoom: 7,
    minZoom: 6, // Stops them from zooming out to see the whole world
    maxBounds: bangladeshBounds, // Locks the map inside Bangladesh
    maxBoundsViscosity: 1.0 // Adds a "bounce back" effect if they try to drag outside
});

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// 2. Initialize the Clustering Group
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
    // --- 1. SHOW THE "UPDATING MAP" OVERLAY ---
    let mapContainer = document.getElementById('alumniMap');
    let mapLoadingOverlay = document.getElementById('mapLoadingOverlay');
    
    // Create the overlay dynamically if it doesn't exist yet
    if (!mapLoadingOverlay && mapContainer) {
        mapLoadingOverlay = document.createElement('div');
        mapLoadingOverlay.id = 'mapLoadingOverlay';
        mapLoadingOverlay.innerHTML = `
            <div style="width: 35px; height: 35px; border: 4px solid #e2e8f0; border-top: 4px solid #004aad; border-radius: 50%; animation: mapSpin 1s linear infinite;"></div>
            <span style="margin-left: 12px; font-weight: 600; color: #004aad; font-family: 'Poppins', sans-serif; font-size: 1.1rem; text-shadow: 0px 0px 5px white;">Updating Map...</span>
        `;
        // Styling to make it float over the map with a blur effect
        mapLoadingOverlay.style.cssText = 'position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(255, 255, 255, 0.6); z-index: 9999; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(3px); border-radius: inherit; transition: opacity 0.3s ease;';
        
        // Add the CSS animation for the spinner
        const style = document.createElement('style');
        style.innerHTML = '@keyframes mapSpin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }';
        document.head.appendChild(style);
        
        mapContainer.appendChild(mapLoadingOverlay);
    }
    
    // Make sure it is visible when the function starts
    if (mapLoadingOverlay) mapLoadingOverlay.style.display = 'flex';

    // Clear out the old clusters when filtering/searching
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

            // Determine theme colors based on developer status
            const pinBorderColor = alumnus.isDeveloper ? '#FFD700' : '#004aad'; 
            const pinNeedleColor = alumnus.isDeveloper ? '#FFD700' : '#004aad';

            // Create a custom Snapchat-style pin using the alumnus photo
            const customIcon = L.divIcon({
                className: 'custom-profile-pin',
                html: `
                    <div style="width: 40px; height: 40px; border-radius: 50%; overflow: hidden; border: 3px solid ${pinBorderColor}; background: white; box-shadow: 0 4px 6px rgba(0,0,0,0.3); position: relative;">
                        <img src="${alumnus.photo || 'images/default-avatar.png'}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.src='images/default-avatar.png'">
                    </div>
                    <div style="width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 8px solid ${pinNeedleColor}; margin: 0 auto;"></div>
                `,
                iconSize: [46, 54], 
                iconAnchor: [23, 54], 
                popupAnchor: [0, -50] 
            });

            const marker = L.marker(coords, { icon: customIcon });
            
            // Dynamic styling for the Popup card inside the map (Mobile Optimized)
            const popupWrapperStyle = alumnus.isDeveloper ? 'border-top: 4px solid #FFD700; border-radius: 8px; padding: 8px;' : 'padding: 5px;';
            const popupNameColor = alumnus.isDeveloper ? '#FFD700' : '#004aad';
            const popupImageBorder = alumnus.isDeveloper ? '3px solid #FFD700' : '2px solid #004aad';

            const popupContent = `
                <div style="font-family: 'Poppins', sans-serif; text-align: center; width: 100%; word-wrap: break-word; box-sizing: border-box; ${popupWrapperStyle}">
                    <img src="${alumnus.photo || 'images/default-avatar.png'}" style="width: 50px; height: 50px; border-radius: 50%; object-fit: cover; border: ${popupImageBorder}; margin-bottom: 5px;" onerror="this.src='images/default-avatar.png'">
                    <br>
                    <strong style="color: ${popupNameColor}; font-size: 1.1rem; display: block; line-height: 1.2; margin-bottom: 4px;">${alumnus.name}</strong>
                    ${alumnus.isDeveloper ? '<div style="background: #FFD700; color: #000; padding: 3px 8px; border-radius: 12px; font-weight: bold; display:inline-block; font-size:0.7rem; margin-bottom:5px;">👨‍💻 Lead Developer</div><br>' : ''}
                    <span style="font-size: 0.85rem; color: #555; display: block; margin-bottom: 4px;">${uniName}</span>
                    <span style="font-size: 0.75rem; background: #e0f2fe; color: #0369a1; padding: 2px 6px; border-radius: 10px; display: inline-block;">
                        Batch: ${alumnus.sscBatch}
                    </span>
                </div>
            `;

            // Bind popup with specific Leaflet options to fix mobile overlap
            marker.bindPopup(popupContent, {
                maxWidth: 220,     // Prevents it from stretching too wide
                minWidth: 140,     // Keeps it structured
                autoPanPaddingTopLeft: [50, 50], // Forces map to push the popup away from zoom controls!
                autoPanPaddingBottomRight: [50, 50]
            });

            markersGroup.addLayer(marker);
        }
    } finally {
        // --- 2. HIDE THE OVERLAY WHEN FINISHED ---
        if (mapLoadingOverlay) {
            mapLoadingOverlay.style.display = 'none';
        }
    }
};

// ==========================================
// 🪪 DIGITAL ID CARD GENERATOR LOGIC
// ==========================================
window.generateIDCard = function(name, photo, uni, dept, batch, admitted, buttonElement) {
    // 1. Give the user visual feedback that it's working
    const originalText = buttonElement.innerHTML;
    buttonElement.innerHTML = "⏳ Generating...";
    buttonElement.disabled = true;
    buttonElement.style.opacity = "0.7";

    // 2. Populate the hidden HTML template with this specific user's data
    document.getElementById('id-card-name').textContent = name;
    document.getElementById('id-card-uni').textContent = uni;
    document.getElementById('id-card-dept').textContent = dept;
    document.getElementById('id-card-batch').textContent = batch;
    document.getElementById('id-card-admitted').textContent = admitted;
    
    const photoElement = document.getElementById('id-card-photo');
    photoElement.src = photo;

    // 3. We must wait for the image to fully load in the hidden div before taking the screenshot!
    photoElement.onload = function() {
        takeScreenshotAndDownload();
    };
    
    // Fallback if image fails to load (e.g., broken link)
    photoElement.onerror = function() {
        photoElement.src = 'images/default-avatar.png';
        takeScreenshotAndDownload();
    };

    // If the browser already cached the image, onload might fire instantly
    if (photoElement.complete) {
        takeScreenshotAndDownload();
    }

    // 4. The actual screenshot logic
    function takeScreenshotAndDownload() {
        const cardTemplate = document.getElementById('id-card-template');

        html2canvas(cardTemplate, {
            scale: 2, // Double resolution for a crisp, high-quality image
            useCORS: true, // Crucial: Allows external photos to be drawn on the canvas safely
            backgroundColor: null 
        }).then(canvas => {
            // Create a fake link to trigger the download
            const link = document.createElement('a');
            link.download = `${name.replace(/\s+/g, '_')}_Alumni_ID.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
            
            // Restore button to a success state!
            buttonElement.innerHTML = "✅ Downloaded!";
            buttonElement.style.backgroundColor = "#059669"; // Slightly darker green
            
            setTimeout(() => {
                buttonElement.innerHTML = originalText;
                buttonElement.style.backgroundColor = "#10b981"; // Back to original green
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
