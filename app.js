document.addEventListener("DOMContentLoaded", () => {
    const container = document.getElementById("alumni-container");
    const searchInput = document.getElementById("searchInput");
    const sortNameBtn = document.getElementById("sortName");
    const sortBatchBtn = document.getElementById("sortBatch");
    const loadMoreBtn = document.getElementById("loadMoreBtn"); 
    const filterPublicBtn = document.getElementById("filterPublic"); // NEW
    
    let alumniData = [];
    let currentDisplayData = []; 
    
    let itemsPerPage = 8; 
    let currentlyShowing = itemsPerPage;
    
    let isPublicFilterActive = false; // NEW: Tracks if the filter is ON or OFF

    fetch("data.json")
        .then(response => response.json())
        .then(data => {
            alumniData = data;
            currentDisplayData = [...alumniData]; 
            displayAlumni(currentDisplayData); 
            updateDashboard(alumniData); 
        })
        .catch(error => console.error("Error loading alumni data:", error));

    function displayAlumni(data) {
        container.innerHTML = ""; 

        if (data.length === 0) {
            container.innerHTML = "<p style='text-align:center; color:#666; width:100%;'>No alumni found matching your criteria.</p>";
            if(loadMoreBtn) loadMoreBtn.style.display = "none"; 
            return;
        }

        const dataToShow = data.slice(0, currentlyShowing);

        dataToShow.forEach(alumnus => {
            const card = document.createElement("div");
            card.classList.add("alumni-card");
            
            const emailButton = (alumnus.emailUser && alumnus.emailDomain) ? 
                `<button class="contact-btn" onclick="window.location.href='mailto:${alumnus.emailUser}@${alumnus.emailDomain}'">✉️ Email</button>` 
                : "";

            const whatsappText = `Hello ${alumnus.name}, I am a current student. I found your profile on the Alumni Directory and would love to ask you a quick question!`;
            const whatsappButton = (alumnus.whatsappCode && alumnus.whatsappNum) ? 
                `<button class="whatsapp-btn" onclick="window.open('https://wa.me/${alumnus.whatsappCode}${alumnus.whatsappNum}?text=${encodeURIComponent(whatsappText)}', '_blank')">💬 WhatsApp</button>` 
                : "";

            const callButton = (alumnus.phoneCode && alumnus.phoneNum) ? 
                `<button class="contact-btn" style="background-color: #059669; color: white; border-color: #059669;" onclick="window.location.href='tel:${alumnus.phoneCode}${alumnus.phoneNum}'">📞 Call</button>` 
                : "";

            const mentoringBadge = alumnus.mentoring ? 
                `<div class="mentoring-badge"><span class="glow-dot"></span>Mentoring</div>` 
                : "";

            const newArrivalBadge = alumnus.isNew ? 
                `<div class="new-badge">✨ NEW</div>` 
                : "";

            // NEW: The Public Tag
            const publicTag = alumnus.isPublic ? `<span class="public-badge">🏛️ Public</span>` : "";

            const institutionLabel = alumnus.university ? "University" : "College";
            const institutionValue = alumnus.university || alumnus.college || "N/A";
            
            const studyLabel = alumnus.department ? "Department" : "Group";
            const studyValue = alumnus.department || alumnus.group || "N/A";

            card.innerHTML = `
                ${newArrivalBadge}
                ${mentoringBadge}
                <img src="${alumnus.photo}" alt="Photo of ${alumnus.name}">
                <h2>${alumnus.name}</h2>
                <p><strong>${institutionLabel}:</strong> ${institutionValue} ${publicTag}</p>
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

    if(loadMoreBtn) {
        loadMoreBtn.addEventListener("click", () => {
            currentlyShowing += itemsPerPage; 
            displayAlumni(currentDisplayData); 
        });
    }

    // NEW: The Public Filter Logic
    if(filterPublicBtn) {
        filterPublicBtn.addEventListener("click", () => {
            isPublicFilterActive = !isPublicFilterActive; // Toggles on and off
            
            if (isPublicFilterActive) {
                // Change button style so they know it is ON
                filterPublicBtn.style.backgroundColor = "#004aad";
                filterPublicBtn.style.color = "white";
            } else {
                // Revert button style back to normal
                filterPublicBtn.style.backgroundColor = "";
                filterPublicBtn.style.color = "";
            }

            // Re-trigger the search logic so search, sort, and filter all work together!
            searchInput.dispatchEvent(new Event('input')); 
        });
    }

    // UPDATED: Search now respects the Public Filter!
    searchInput.addEventListener("input", (e) => {
        const searchString = e.target.value.toLowerCase();
        
        // First, check if we should only look at Public universities
        let baseData = isPublicFilterActive ? alumniData.filter(a => a.isPublic) : alumniData;

        // Then, filter by the search text
        currentDisplayData = baseData.filter(alumnus => {
            const institution = (alumnus.university || alumnus.college || "").toLowerCase();
            const name = (alumnus.name || "").toLowerCase();
            const batch = (alumnus.sscBatch || "").toString();

            return name.includes(searchString) ||
                   institution.includes(searchString) ||
                   batch.includes(searchString);
        });
        
        currentlyShowing = itemsPerPage; 
        displayAlumni(currentDisplayData); 
    });

    sortNameBtn.addEventListener("click", () => {
        currentDisplayData.sort((a, b) => a.name.localeCompare(b.name));
        currentlyShowing = itemsPerPage; 
        displayAlumni(currentDisplayData);
    });

    sortBatchBtn.addEventListener("click", () => {
        currentDisplayData.sort((a, b) => b.sscBatch - a.sscBatch);
        currentlyShowing = itemsPerPage; 
        displayAlumni(currentDisplayData);
    });

    const darkModeToggle = document.getElementById("darkModeToggle");
    const body = document.body;

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

    const scrollToTopBtn = document.getElementById("scrollToTopBtn");

    window.addEventListener("scroll", () => {
        if (document.body.scrollTop > 300 || document.documentElement.scrollTop > 300) {
            scrollToTopBtn.style.display = "block";
        } else {
            scrollToTopBtn.style.display = "none";
        }
    });

    scrollToTopBtn.addEventListener("click", () => {
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    });

    const desktopNotice = document.getElementById("desktop-notice");
    const closeNoticeBtn = document.getElementById("closeNoticeBtn");

    if (closeNoticeBtn) {
        closeNoticeBtn.addEventListener("click", () => {
            desktopNotice.style.display = "none";
        });
    }

    function updateDashboard(data) {
        const totalAlumni = data.length;
        const uniqueInstitutions = new Set(data.map(a => a.university || a.college).filter(Boolean)).size;
        const uniqueStudy = new Set(data.map(a => a.department || a.group).filter(Boolean)).size;

        document.getElementById("total-alumni").textContent = totalAlumni;
        document.getElementById("total-universities").textContent = uniqueInstitutions;
        document.getElementById("total-departments").textContent = uniqueStudy;
    }
});

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
