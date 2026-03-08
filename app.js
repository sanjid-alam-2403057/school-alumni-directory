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

   // FETCHING FROM YOUR LOCAL JSON FILE (Reverted)
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
        })
        .catch(error => {
            console.error("Error loading alumni data:", error);
            // Hides the spinner even if there is an error!
            const spinner = document.getElementById("loadingSpinner");
            if (spinner) spinner.style.display = "none";
            
            if (container) {
                container.innerHTML = "<p style='text-align:center; color:red; width:100%;'>Error loading data. Please try again later.</p>";
            }
        });

   // Automatically fill dropdowns with unique data
    function populateDropdowns(data) {
        if (!universityFilter || !batchFilter) return;

        // Clear out any existing options first so they don't duplicate!
        universityFilter.innerHTML = '<option value="">🏫 All Institutions</option>';
        batchFilter.innerHTML = '<option value="">📅 All Batches</option>';

        // Get unique universities and sort alphabetically
        const universities = [...new Set(data.map(a => a.university || a.college).filter(Boolean))].sort();
        universities.forEach(uni => {
            const option = document.createElement("option");
            option.value = uni;
            option.textContent = uni;
            universityFilter.appendChild(option);
        });

        // Get unique batches and sort newest to oldest
        const batches = [...new Set(data.map(a => a.sscBatch).filter(Boolean))].sort((a, b) => b - a);
        batches.forEach(batch => {
            const option = document.createElement("option");
            option.value = batch;
            option.textContent = batch;
            batchFilter.appendChild(option);
        });
    }

    function displayAlumni(data) {
        if (!container) return; // Safety check
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
            
            // BUTTONS: Using your original JSON variables
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
                <img src="${alumnus.photo}" alt="Photo of ${alumnus.name}">
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

            // Check if it matches search text
            const matchesSearch = name.includes(searchString) || institution.toLowerCase().includes(searchString) || batch.includes(searchString);
            
            // Check if it matches dropdowns
            const matchesUni = selectedUni === "" || institution === selectedUni;
            const matchesBatch = selectedBatch === "" || batch === selectedBatch;

            return matchesSearch && matchesUni && matchesBatch;
        });

        currentlyShowing = itemsPerPage; 
        displayAlumni(currentDisplayData); 
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

    // --- DARK MODE LOGIC (Now safely wrapped!) ---
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
        
        // Smart count for dashboard: Count unique departments OR groups
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
