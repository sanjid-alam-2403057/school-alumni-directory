document.addEventListener("DOMContentLoaded", () => {
    const container = document.getElementById("alumni-container");
    const searchInput = document.getElementById("searchInput");
    const sortNameBtn = document.getElementById("sortName");
    const sortBatchBtn = document.getElementById("sortBatch");
    const loadMoreBtn = document.getElementById("loadMoreBtn"); // The new Load More button
    
    let alumniData = [];
    let currentDisplayData = []; 
    
    // Pagination Variables for the Load More feature
    let itemsPerPage = 6; 
    let currentlyShowing = itemsPerPage;

    // Fetch the alumni data
    fetch("data.json")
        .then(response => response.json())
        .then(data => {
            alumniData = data;
            currentDisplayData = [...alumniData]; 
            displayAlumni(currentDisplayData); 
            updateDashboard(alumniData); // Calculates stats on load
        })
        .catch(error => console.error("Error loading alumni data:", error));

    // Function to create and display cards
    function displayAlumni(data) {
        container.innerHTML = ""; // Clear out old cards

        if (data.length === 0) {
            container.innerHTML = "<p style='text-align:center; color:#666; width:100%;'>No alumni found matching your search.</p>";
            if(loadMoreBtn) loadMoreBtn.style.display = "none"; // Hide button if no results
            return;
        }

        // Only slice the amount of data we want to show!
        const dataToShow = data.slice(0, currentlyShowing);

        dataToShow.forEach(alumnus => {
            const card = document.createElement("div");
            card.classList.add("alumni-card");
            
            // 1. Bot-proof email button
            const emailButton = (alumnus.emailUser && alumnus.emailDomain) ? 
                `<button class="contact-btn" onclick="window.location.href='mailto:${alumnus.emailUser}@${alumnus.emailDomain}'">✉️ Email</button>` 
                : "";

            // 2. WhatsApp button
            const whatsappText = `Hello ${alumnus.name}, I am a current student. I found your profile on the Alumni Directory and would love to ask you a quick question!`;
            const whatsappButton = (alumnus.whatsappCode && alumnus.whatsappNum) ? 
                `<button class="whatsapp-btn" onclick="window.open('https://wa.me/${alumnus.whatsappCode}${alumnus.whatsappNum}?text=${encodeURIComponent(whatsappText)}', '_blank')">💬 WhatsApp</button>` 
                : "";

            // 3. Mentoring Badge
            const mentoringBadge = alumnus.mentoring ? 
                `<div class="mentoring-badge"><span class="glow-dot"></span>Mentoring</div>` 
                : "";

            // 4. NEW: The New Arrival Badge
            const newArrivalBadge = alumnus.isNew ? 
                `<div class="new-badge">✨ NEW</div>` 
                : "";

            card.innerHTML = `
                ${newArrivalBadge}
                ${mentoringBadge}
                <img src="${alumnus.photo}" alt="Photo of ${alumnus.name}">
                <h2>${alumnus.name}</h2>
                <p><strong>University:</strong> ${alumnus.university}</p>
                <p><strong>Department:</strong> ${alumnus.department}</p>
                <p><strong>Admission:</strong> ${alumnus.admissionYear}</p>
                <div class="badge">SSC Batch: ${alumnus.sscBatch}</div>
                <br>
                <div class="button-group">
                    ${emailButton}
                    ${whatsappButton}
                </div>
                <button class="share-btn" onclick="shareProfile(this, '${alumnus.name}', '${alumnus.university}')">🔗 Share Profile</button>
            `;

            container.appendChild(card);
        });

        // Decide whether to show or hide the Load More button
        if (loadMoreBtn) {
            if (currentlyShowing < data.length) {
                loadMoreBtn.style.display = "inline-block";
            } else {
                loadMoreBtn.style.display = "none";
            }
        }
    }

    // Load More Button Click Event
    if(loadMoreBtn) {
        loadMoreBtn.addEventListener("click", () => {
            currentlyShowing += itemsPerPage; // Add 6 more to the limit
            displayAlumni(currentDisplayData); // Redraw the cards
        });
    }

    // Live search functionality
    searchInput.addEventListener("input", (e) => {
        const searchString = e.target.value.toLowerCase();
        
        currentDisplayData = alumniData.filter(alumnus => {
            return alumnus.name.toLowerCase().includes(searchString) ||
                   alumnus.university.toLowerCase().includes(searchString) ||
                   alumnus.sscBatch.toString().includes(searchString);
        });
        
        currentlyShowing = itemsPerPage; // Reset to 6 cards when searching!
        displayAlumni(currentDisplayData); 
    });

    // Sort by Name (Alphabetical A-Z)
    sortNameBtn.addEventListener("click", () => {
        currentDisplayData.sort((a, b) => a.name.localeCompare(b.name));
        currentlyShowing = itemsPerPage; // Reset to 6 cards when sorting!
        displayAlumni(currentDisplayData);
    });

    // Sort by Newest Batch (Highest number first)
    sortBatchBtn.addEventListener("click", () => {
        currentDisplayData.sort((a, b) => b.sscBatch - a.sscBatch);
        currentlyShowing = itemsPerPage; // Reset to 6 cards when sorting!
        displayAlumni(currentDisplayData);
    });

    // Dark Mode Logic
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

    // Scroll to Top Logic
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

    // Close Desktop Notice Banner
    const desktopNotice = document.getElementById("desktop-notice");
    const closeNoticeBtn = document.getElementById("closeNoticeBtn");

    if (closeNoticeBtn) {
        closeNoticeBtn.addEventListener("click", () => {
            desktopNotice.style.display = "none";
        });
    }

    // Live Dashboard Calculator
    function updateDashboard(data) {
        const totalAlumni = data.length;
        const uniqueUniversities = new Set(data.map(alumnus => alumnus.university)).size;
        const uniqueDepartments = new Set(data.map(alumnus => alumnus.department)).size;

        document.getElementById("total-alumni").textContent = totalAlumni;
        document.getElementById("total-universities").textContent = uniqueUniversities;
        document.getElementById("total-departments").textContent = uniqueDepartments;
    }
});

// Global Share Function (Must be outside the DOMContentLoaded block)
window.shareProfile = function(buttonElement, name, university) {
    const websiteUrl = window.location.href.split('?')[0]; 
    const textToCopy = `Check out ${name} from ${university} on our Alumni Directory! ${websiteUrl}`;
    
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
