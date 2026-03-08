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
                <button class="share-btn" onclick="shareProfile(this, '${alumnus.name}', '${institutionValue}')">🔗 Share Profile</button>
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
// 🗺️ SMART AUTOMATIC MAP LOGIC (Geocoding)
// ==========================================
const map = L.map('alumniMap').setView([23.6850, 90.3563], 7);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

let mapMarkers = [];

// 🧠 Smart Cache: Saves coordinates so we don't have to search the same uni twice!
let geoCache = JSON.parse(localStorage.getItem("geoCache")) || {
    "DEFAULT": [23.7500, 90.3900] // Center of Dhaka as ultimate fallback
};

// Helper function to pause for 1 second (respects free API limits)
const delay = ms => new Promise(res => setTimeout(res, ms));

window.plotAlumniOnMap = async function(data) {
    // 1. Clear old pins
    mapMarkers.forEach(marker => map.removeLayer(marker));
    mapMarkers = [];

    // 2. Loop through alumni data
    for (const alumnus of data) {
        const uniName = alumnus.university || alumnus.college;
        
        // Grab the location from your JSON! (e.g., "Laksam, Comilla, Bangladesh")
        const locationName = alumnus.location || ""; 
        
        if (!uniName) continue;

        // Smart Query: Combine College AND Location. If no location, default to Bangladesh.
        let searchQuery = locationName ? `${uniName}, ${locationName}` : `${uniName}, Bangladesh`;
        let coords = geoCache[searchQuery];

        // 3. If not in memory, ask OpenStreetMap
        if (!coords) {
            try {
                await delay(1000); 
                
                // First Try: Look for the exact college in that exact area
                const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`);
                const result = await response.json();

                if (result && result.length > 0) {
                    coords = [parseFloat(result[0].lat), parseFloat(result[0].lon)];
                    geoCache[searchQuery] = coords; 
                    localStorage.setItem("geoCache", JSON.stringify(geoCache)); 
                } else if (locationName) {
                    // 🚨 SECOND TRY (YOUR FALLBACK): Just search for the City/Village!
                    // Example: It couldn't find "Nawab Faizunnessa", so it just searches "Laksam, Comilla, Bangladesh"
                    const fallbackQuery = locationName;
                    await delay(1000);
                    const fbResponse = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fallbackQuery)}`);
                    const fbResult = await fbResponse.json();
                    
                    if (fbResult && fbResult.length > 0) {
                        coords = [parseFloat(fbResult[0].lat), parseFloat(fbResult[0].lon)];
                        geoCache[searchQuery] = coords; // Save it under the original search query so we don't have to search again
                        localStorage.setItem("geoCache", JSON.stringify(geoCache));
                    }
                }
            } catch (error) {
                console.warn(`Could not find coordinates for: ${uniName}`);
            }
        }

        if (!coords) coords = geoCache["DEFAULT"];

        // 4. Jitter logic so pins don't stack directly on top of each other
        const jitter = 0.006;
        const finalCoords = [
            coords[0] + (Math.random() - 0.5) * jitter,
            coords[1] + (Math.random() - 0.5) * jitter
        ];

        const marker = L.marker(finalCoords).addTo(map);
        
        marker.bindPopup(`
            <div style="font-family: 'Poppins', sans-serif; text-align: center; min-width: 140px;">
                <img src="${alumnus.photo || 'images/default-avatar.png'}" style="width: 50px; height: 50px; border-radius: 50%; object-fit: cover; border: 2px solid #004aad; margin-bottom: 5px;" onerror="this.src='images/default-avatar.png'">
                <br>
                <strong style="color: #004aad; font-size: 1.1rem;">${alumnus.name}</strong><br>
                <span style="font-size: 0.85rem; color: #555;">${uniName}</span><br>
                <span style="font-size: 0.75rem; background: #e0f2fe; color: #0369a1; padding: 2px 6px; border-radius: 10px; display: inline-block; margin-top: 5px;">
                    Batch: ${alumnus.sscBatch}
                </span>
            </div>
        `);

        mapMarkers.push(marker);
    }
};
